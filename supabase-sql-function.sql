-- Create a PostgreSQL function to execute SQL queries
-- This function will be used by our application to execute SQL queries via Supabase's REST API
-- without needing direct PostgreSQL connections (avoiding SSL issues)

CREATE OR REPLACE FUNCTION execute_sql_query(sql_query TEXT, query_params JSONB DEFAULT '[]')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the function creator
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Execute the query dynamically with parameters
    EXECUTE format('WITH query_result AS (%s)', sql_query)
    INTO result
    USING VARIADIC array_to_json(query_params)::text[]::varchar[];
    
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    -- Return error information
    RETURN jsonb_build_object(
        'error', SQLERRM,
        'detail', SQLSTATE,
        'query', sql_query
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_sql_query TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql_query TO anon;
GRANT EXECUTE ON FUNCTION execute_sql_query TO service_role;

-- Alternative function with simpler implementation for basic queries
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    EXECUTE format('SELECT to_jsonb(t) FROM (%s) t', sql_query) INTO result;
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_sql TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql TO anon;
GRANT EXECUTE ON FUNCTION execute_sql TO service_role;

-- Function to create a shared calendar (example of moving business logic to the database)
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
AS $$
DECLARE
    user_id UUID;
    calendar_id UUID;
    invite_code TEXT;
BEGIN
    -- Begin transaction
    BEGIN
        -- Get user ID from token or create user if doesn't exist
        SELECT id INTO user_id FROM users WHERE google_token = p_token;
        
        IF user_id IS NULL THEN
            -- Create new user
            INSERT INTO users (google_token, created_at)
            VALUES (p_token, NOW())
            RETURNING id INTO user_id;
        END IF;
        
        -- Create the calendar
        INSERT INTO calendars 
        (title, description, min_slot_duration, start_date, end_date, owner_id, created_at)
        VALUES (p_title, p_description, p_min_slot_duration, p_start_date, p_end_date, user_id, NOW())
        RETURNING id, invite_code INTO calendar_id, invite_code;
        
        -- Add owner as a participant
        INSERT INTO calendar_participants (calendar_id, user_id, is_owner, joined_at)
        VALUES (calendar_id, user_id, TRUE, NOW());
        
        -- Return success data
        RETURN jsonb_build_object(
            'success', TRUE,
            'message', 'Shared calendar created successfully',
            'calendarId', calendar_id,
            'inviteCode', invite_code
        );
    EXCEPTION WHEN OTHERS THEN
        -- Roll back transaction on error
        RAISE;
        
        -- Return error data
        RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'Failed to create shared calendar',
            'error', SQLERRM
        );
    END;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_shared_calendar TO authenticated;
GRANT EXECUTE ON FUNCTION create_shared_calendar TO anon;
GRANT EXECUTE ON FUNCTION create_shared_calendar TO service_role;
