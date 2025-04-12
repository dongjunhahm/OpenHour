-- Function to execute raw SQL queries from the Supabase client
-- This allows us to execute dynamic SQL without direct Postgres connections
CREATE OR REPLACE FUNCTION execute_sql_query(sql_query TEXT, query_params JSONB DEFAULT '[]'::JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Uses the permissions of the function creator
SET search_path = public
AS $$
DECLARE
    result JSONB;
    query_text TEXT;
    i INTEGER;
BEGIN
    -- Prepare the query by replacing parameters
    query_text := sql_query;
    
    -- Execute the query dynamically
    EXECUTE query_text
    INTO result
    USING query_params;
    
    -- Return the result as JSON
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'error', SQLERRM,
            'detail', SQLSTATE,
            'query', query_text
        );
END;
$$;

-- Create a stored procedure for creating shared calendars
-- This can replace the complex transaction in your API
CREATE OR REPLACE FUNCTION create_shared_calendar(
    p_token TEXT,
    p_title TEXT,
    p_description TEXT,
    p_min_slot_duration INTEGER,
    p_start_date TIMESTAMP,
    p_end_date TIMESTAMP
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_calendar_id UUID;
    v_invite_code TEXT;
BEGIN
    -- Begin a transaction
    BEGIN
        -- Get user ID from token or create user if doesn't exist
        SELECT id INTO v_user_id FROM users WHERE google_token = p_token;
        
        IF v_user_id IS NULL THEN
            -- Create new user
            INSERT INTO users (google_token, created_at)
            VALUES (p_token, NOW())
            RETURNING id INTO v_user_id;
        END IF;
        
        -- Create the calendar
        INSERT INTO calendars 
        (title, description, min_slot_duration, start_date, end_date, owner_id, created_at)
        VALUES (p_title, p_description, p_min_slot_duration, p_start_date, p_end_date, v_user_id, NOW())
        RETURNING id, invite_code INTO v_calendar_id, v_invite_code;
        
        -- Add owner as a participant
        INSERT INTO calendar_participants 
        (calendar_id, user_id, is_owner, joined_at)
        VALUES (v_calendar_id, v_user_id, true, NOW());
        
        -- Return success response
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Shared calendar created successfully',
            'calendarId', v_calendar_id,
            'inviteCode', v_invite_code
        );
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback the transaction
            ROLLBACK;
            RAISE;
    END;
END;
$$;

-- Add more stored procedures as needed for your application

-- Function to get available slots with duration calculation
CREATE OR REPLACE FUNCTION get_available_slots (calendar_id_param UUID)
RETURNS TABLE (
  id UUID,
  start TIMESTAMP WITH TIME ZONE,
  "end" TIMESTAMP WITH TIME ZONE,
  duration NUMERIC
)
LANGUAGE SQL
SECURITY DEFINER
AS $
  SELECT 
    id, 
    start_time as start, 
    end_time as "end",
    EXTRACT(EPOCH FROM (end_time - start_time)) / 60 as duration
  FROM available_slots
  WHERE calendar_id = calendar_id_param
  ORDER BY start_time ASC;
$;
