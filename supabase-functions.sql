-- Enable PostgreSQL's procedural language
CREATE EXTENSION IF NOT EXISTS plpgsql;

-- Function to execute arbitrary SQL (for admin use only)
CREATE OR REPLACE FUNCTION execute_sql(query_text TEXT, query_params JSONB DEFAULT '{}'::JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the function creator
AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE query_text
  INTO result
  USING query_params;
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM, 'detail', SQLSTATE);
END;
$$;

-- Function to create a shared calendar
CREATE OR REPLACE FUNCTION create_shared_calendar(
  p_token TEXT,
  p_title TEXT,
  p_description TEXT,
  p_min_slot_duration INTERVAL,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_calendar_id UUID;
  v_invite_code TEXT;
BEGIN
  -- Begin transaction
  BEGIN
    -- Get user ID from token or create user if doesn't exist
    SELECT id INTO v_user_id
    FROM users
    WHERE google_token = p_token;
    
    IF v_user_id IS NULL THEN
      -- Create new user
      INSERT INTO users (google_token, created_at)
      VALUES (p_token, NOW())
      RETURNING id INTO v_user_id;
    END IF;
    
    -- Create the calendar
    INSERT INTO calendars 
      (title, description, min_slot_duration, start_date, end_date, owner_id, created_at)
    VALUES 
      (p_title, p_description, p_min_slot_duration, p_start_date, p_end_date, v_user_id, NOW())
    RETURNING id, invite_code INTO v_calendar_id, v_invite_code;
    
    -- Add owner as a participant
    INSERT INTO calendar_participants (calendar_id, user_id, is_owner, joined_at)
    VALUES (v_calendar_id, v_user_id, true, NOW());
    
    -- Return success with calendar information
    RETURN jsonb_build_object(
      'success', true,
      'calendar_id', v_calendar_id,
      'invite_code', v_invite_code
    );
  EXCEPTION WHEN OTHERS THEN
    -- Return error information
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
  END;
END;
$$;

-- Function to get calendar details
CREATE OR REPLACE FUNCTION get_calendar(
  p_calendar_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Get calendar details
  SELECT jsonb_build_object(
    'id', c.id,
    'title', c.title,
    'description', c.description,
    'min_slot_duration', c.min_slot_duration,
    'start_date', c.start_date,
    'end_date', c.end_date,
    'invite_code', c.invite_code,
    'created_at', c.created_at,
    'owner', jsonb_build_object(
      'id', u.id,
      'email', u.email
    ),
    'participants', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', u2.id,
        'email', u2.email,
        'is_owner', cp.is_owner,
        'joined_at', cp.joined_at
      ))
      FROM calendar_participants cp
      JOIN users u2 ON cp.user_id = u2.id
      WHERE cp.calendar_id = c.id
    )
  )
  INTO v_result
  FROM calendars c
  JOIN users u ON c.owner_id = u.id
  WHERE c.id = p_calendar_id;
  
  RETURN v_result;
END;
$$;

-- Function to join a calendar by invite code
CREATE OR REPLACE FUNCTION join_calendar_by_invite(
  p_invite_code TEXT,
  p_user_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_calendar_id UUID;
  v_user_id UUID;
  v_already_joined BOOLEAN;
BEGIN
  -- Find the calendar by invite code
  SELECT id INTO v_calendar_id
  FROM calendars
  WHERE invite_code = p_invite_code;
  
  IF v_calendar_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid invite code'
    );
  END IF;
  
  -- Get or create user
  SELECT id INTO v_user_id
  FROM users
  WHERE google_token = p_user_token;
  
  IF v_user_id IS NULL THEN
    -- Create new user
    INSERT INTO users (google_token, created_at)
    VALUES (p_user_token, NOW())
    RETURNING id INTO v_user_id;
  END IF;
  
  -- Check if user is already a participant
  SELECT EXISTS (
    SELECT 1
    FROM calendar_participants
    WHERE calendar_id = v_calendar_id AND user_id = v_user_id
  ) INTO v_already_joined;
  
  IF v_already_joined THEN
    RETURN jsonb_build_object(
      'success', true,
      'calendar_id', v_calendar_id,
      'message', 'Already a participant'
    );
  END IF;
  
  -- Add user as participant
  INSERT INTO calendar_participants (calendar_id, user_id, is_owner, joined_at)
  VALUES (v_calendar_id, v_user_id, false, NOW());
  
  RETURN jsonb_build_object(
    'success', true,
    'calendar_id', v_calendar_id,
    'message', 'Successfully joined calendar'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;
