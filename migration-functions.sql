-- OpenHour Supabase Migration Functions
-- This script creates all necessary SQL functions for the OpenHour application
-- to work with Supabase without direct PostgreSQL connections

-- Enable PostgreSQL's procedural language if not already enabled
CREATE EXTENSION IF NOT EXISTS plpgsql;

-- 1. Function to execute arbitrary SQL queries from the Supabase client
-- This is crucial for avoiding SSL certificate issues
CREATE OR REPLACE FUNCTION execute_sql_query(sql_query TEXT, query_params JSONB DEFAULT '[]'::JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Uses the permissions of the function creator
SET search_path = public
AS $$
DECLARE
    result JSONB;
    query_text TEXT;
    param_values TEXT[];
    i INTEGER;
BEGIN
    -- Prepare the query by replacing parameters
    query_text := sql_query;
    
    -- Extract parameter values from JSONB array
    IF jsonb_array_length(query_params) > 0 THEN
        SELECT array_agg(value) INTO param_values
        FROM jsonb_array_elements(query_params);
    END IF;
    
    -- Execute the query dynamically
    IF param_values IS NULL THEN
        EXECUTE format('SELECT to_jsonb(t) FROM (%s) AS t', query_text) INTO result;
    ELSE
        EXECUTE format('SELECT to_jsonb(t) FROM (%s) AS t', query_text) 
        INTO result
        USING VARIADIC param_values;
    END IF;
    
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

-- Grant execute permission to necessary roles
GRANT EXECUTE ON FUNCTION execute_sql_query TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql_query TO anon;
GRANT EXECUTE ON FUNCTION execute_sql_query TO service_role;

-- 2. Simplified function for basic SQL execution
CREATE OR REPLACE FUNCTION execute_sql(query_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    EXECUTE format('SELECT to_jsonb(t) FROM (%s) AS t', query_text) INTO result;
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'error', SQLERRM,
            'detail', SQLSTATE
        );
END;
$$;

-- Grant execute permission to necessary roles
GRANT EXECUTE ON FUNCTION execute_sql TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql TO anon;
GRANT EXECUTE ON FUNCTION execute_sql TO service_role;

-- 3. Function to create a shared calendar
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
    v_invite_code UUID;
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
            -- Return error information
            RETURN jsonb_build_object(
                'success', false,
                'message', 'Failed to create shared calendar',
                'error', SQLERRM,
                'detail', SQLSTATE
            );
    END;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_shared_calendar TO authenticated;
GRANT EXECUTE ON FUNCTION create_shared_calendar TO anon;
GRANT EXECUTE ON FUNCTION create_shared_calendar TO service_role;

-- 4. Function to get available slots with duration calculation
CREATE OR REPLACE FUNCTION get_available_slots(calendar_id_param UUID)
RETURNS TABLE (
    id UUID,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER -- In minutes
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        id, 
        start_time, 
        end_time,
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60 AS duration
    FROM available_slots
    WHERE calendar_id = calendar_id_param
    ORDER BY start_time ASC;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_available_slots TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_slots TO anon;
GRANT EXECUTE ON FUNCTION get_available_slots TO service_role;

-- 5. Function to join a calendar by invite code
CREATE OR REPLACE FUNCTION join_calendar_by_invite(
    p_invite_code UUID,
    p_user_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
            'message', 'Invalid invite code'
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
            'message', 'Already a participant',
            'calendarId', v_calendar_id
        );
    END IF;
    
    -- Add user as participant
    INSERT INTO calendar_participants (calendar_id, user_id, is_owner, joined_at)
    VALUES (v_calendar_id, v_user_id, false, NOW());
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Successfully joined calendar',
        'calendarId', v_calendar_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Failed to join calendar',
        'error', SQLERRM
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION join_calendar_by_invite TO authenticated;
GRANT EXECUTE ON FUNCTION join_calendar_by_invite TO anon;
GRANT EXECUTE ON FUNCTION join_calendar_by_invite TO service_role;

-- 6. Function to get calendar details with participants
CREATE OR REPLACE FUNCTION get_calendar(
    p_calendar_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Get calendar details with owner and participants
    SELECT jsonb_build_object(
        'id', c.id,
        'title', c.title,
        'description', c.description,
        'minSlotDuration', c.min_slot_duration,
        'startDate', c.start_date,
        'endDate', c.end_date,
        'inviteCode', c.invite_code,
        'createdAt', c.created_at,
        'owner', jsonb_build_object(
            'id', u.id,
            'email', u.email,
            'name', u.name
        ),
        'participants', (
            SELECT jsonb_agg(jsonb_build_object(
                'id', u2.id,
                'email', u2.email,
                'name', u2.name,
                'isOwner', cp.is_owner,
                'joinedAt', cp.joined_at
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
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_calendar TO authenticated;
GRANT EXECUTE ON FUNCTION get_calendar TO anon;
GRANT EXECUTE ON FUNCTION get_calendar TO service_role;

-- 7. Function to get user calendars
CREATE OR REPLACE FUNCTION get_user_calendars(
    p_user_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_result JSONB;
BEGIN
    -- Get user ID from token
    SELECT id INTO v_user_id
    FROM users
    WHERE google_token = p_user_token;
    
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'User not found'
        );
    END IF;
    
    -- Get calendars where user is a participant
    SELECT jsonb_agg(jsonb_build_object(
        'id', c.id,
        'title', c.title,
        'description', c.description,
        'minSlotDuration', c.min_slot_duration,
        'startDate', c.start_date,
        'endDate', c.end_date,
        'inviteCode', c.invite_code,
        'createdAt', c.created_at,
        'isOwner', cp.is_owner,
        'joinedAt', cp.joined_at
    ))
    INTO v_result
    FROM calendars c
    JOIN calendar_participants cp ON c.id = cp.calendar_id
    WHERE cp.user_id = v_user_id
    ORDER BY c.created_at DESC;
    
    RETURN jsonb_build_object(
        'success', true,
        'calendars', COALESCE(v_result, '[]'::jsonb)
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Failed to get user calendars',
        'error', SQLERRM
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_calendars TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_calendars TO anon;
GRANT EXECUTE ON FUNCTION get_user_calendars TO service_role;

-- 8. Function to add available slots
CREATE OR REPLACE FUNCTION add_available_slots(
    p_calendar_id UUID,
    p_user_token TEXT,
    p_slots JSONB -- Array of {startTime, endTime} objects
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_is_participant BOOLEAN;
    v_slot JSONB;
    v_added_count INTEGER := 0;
BEGIN
    -- Get user ID from token
    SELECT id INTO v_user_id
    FROM users
    WHERE google_token = p_user_token;
    
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'User not found'
        );
    END IF;
    
    -- Check if user is a participant of the calendar
    SELECT EXISTS (
        SELECT 1
        FROM calendar_participants
        WHERE calendar_id = p_calendar_id AND user_id = v_user_id
    ) INTO v_is_participant;
    
    IF NOT v_is_participant THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'User is not a participant of this calendar'
        );
    END IF;
    
    -- Add each available slot
    FOR v_slot IN SELECT * FROM jsonb_array_elements(p_slots)
    LOOP
        BEGIN
            INSERT INTO available_slots (calendar_id, start_time, end_time, created_at)
            VALUES (
                p_calendar_id,
                (v_slot->>'startTime')::TIMESTAMP,
                (v_slot->>'endTime')::TIMESTAMP,
                NOW()
            );
            v_added_count := v_added_count + 1;
        EXCEPTION WHEN OTHERS THEN
            -- Skip and continue with the next slot if there's an error
            CONTINUE;
        END;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Available slots added',
        'addedCount', v_added_count
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Failed to add available slots',
        'error', SQLERRM
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION add_available_slots TO authenticated;
GRANT EXECUTE ON FUNCTION add_available_slots TO anon;
GRANT EXECUTE ON FUNCTION add_available_slots TO service_role;
