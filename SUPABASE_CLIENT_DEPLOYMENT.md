# Supabase Client Deployment Guide

This guide explains how to deploy the changes that replace direct PostgreSQL connections with Supabase client.

## Overview of Changes

1. Created an enhanced Supabase client (`enhanced-supabase-client.js`) that handles all database operations
2. Added SQL functions to be deployed to Supabase (`supabase-sql-functions.sql`)
3. Updated the `db.js` file to use Supabase instead of direct PostgreSQL connections
4. Added a test endpoint to verify the Supabase connection
5. Created a new API endpoint for shared calendars using only Supabase

## Deployment Steps

### 1. Deploy SQL Functions to Supabase

First, you need to deploy the SQL functions to your Supabase instance:

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Select your project
3. Go to the SQL Editor
4. Create a new query
5. Copy and paste the contents of `supabase-sql-functions.sql`
6. Click "Run" to execute the SQL and create the functions

### 2. Update Environment Variables

Ensure all required environment variables are set in your Vercel project:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Test the Connection

After deploying the changes, test the Supabase connection with:

```bash
# Local testing
curl -X POST http://localhost:3000/api/test-enhanced-supabase

# Vercel testing
curl -X POST https://your-vercel-domain.vercel.app/api/test-enhanced-supabase
```

### 4. Verify API Functionality

Test the shared calendar creation using the new Supabase-only endpoint:

```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "userToken": {"token": "your_test_token"},
  "calendarDetails": {
    "title": "Test Calendar",
    "description": "Testing Supabase",
    "minSlotDuration": 30,
    "startDate": "2025-04-15T00:00:00Z",
    "endDate": "2025-04-30T23:59:59Z"
  }
}' http://localhost:3000/api/create-shared-calendar-supabase
```

## Troubleshooting

If you encounter issues:

1. **SQL Function Errors**:
   - Check for syntax errors in the SQL functions
   - Verify the SQL functions have been created correctly in Supabase

2. **Connection Issues**:
   - Verify environment variables are set correctly
   - Check Supabase project settings for any restrictions

3. **Permission Errors**:
   - Ensure your Supabase service role key has appropriate permissions
   - Check Row-Level Security (RLS) policies for tables being accessed

## Rollback Plan

If necessary, you can rollback by:

1. Reverting the changes to `db.js`
2. Removing or disabling the new endpoints
3. Continuing to use the original `db.js` with direct PostgreSQL connections

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Supabase SQL Functions](https://supabase.com/docs/guides/database/functions)
