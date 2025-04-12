# Migration Guide: Local PostgreSQL to Supabase

This guide will help you migrate your OpenHour application from a local PostgreSQL database to Supabase/Vercel Postgres.

## Prerequisites

1. Make sure you have all your Supabase/Vercel Postgres credentials in your `.env.local` file:
   ```
   # Supabase/Vercel Postgres variables
   POSTGRES_URL="your_postgres_url"
   POSTGRES_PRISMA_URL="your_prisma_url"
   POSTGRES_URL_NON_POOLING="your_non_pooling_url"
   POSTGRES_USER="your_postgres_user"
   POSTGRES_PASSWORD="your_postgres_password"
   POSTGRES_DATABASE="your_database_name"
   POSTGRES_HOST="your_postgres_host"
   
   SUPABASE_URL="your_supabase_url"
   NEXT_PUBLIC_SUPABASE_URL="your_public_supabase_url"
   SUPABASE_ANON_KEY="your_anon_key"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your_public_anon_key"
   SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
   SUPABASE_JWT_SECRET="your_jwt_secret"
   ```

2. Ensure your local PostgreSQL server is running if you want to migrate existing data

## Migration Steps

### 1. Install Required Packages

```bash
npm install @supabase/supabase-js
# or
yarn add @supabase/supabase-js
```

### 2. Test the Supabase Connection

First, verify that you can connect to your Supabase database:

```bash
# Start your development server
npm run dev
# or
yarn dev

# Then in another terminal, make a request to test the connection
curl -X POST http://localhost:3000/api/test-supabase
```

This will test both your direct PostgreSQL connection and the Supabase client connection.

### 3. Migrate the Schema

To set up your database schema in Supabase:

```bash
curl -X POST http://localhost:3000/api/migrate-to-supabase
```

This will create all the necessary tables in your Supabase database.

### 4. Migrate Existing Data (Optional)

If you have existing data in your local database that you want to migrate:

```bash
curl -X POST -H "Content-Type: application/json" -d '{"migrateData": true}' http://localhost:3000/api/migrate-to-supabase
```

This will copy all data from your local PostgreSQL database to Supabase.

### 5. Update Your Application to Use Supabase

After successful migration, update your application to use Supabase by modifying your code:

1. Replace imports in your API files:

```javascript
// Change this:
import { pool } from "./db";

// To this:
import { pool, supabase } from "./supabaseDb";
```

2. For Supabase Auth features (if needed):

```javascript
import { supabase } from "./supabaseDb";

// Example authentication
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google'
});
```

3. For admin operations that need higher privileges:

```javascript
import { supabaseAdmin } from "./supabaseDb";

// Example admin operation
const { data, error } = await supabaseAdmin.from('users').delete().eq('id', userId);
```

### 6. Deploy to Vercel

Once you've successfully migrated and tested your application:

```bash
# Deploy to Vercel
vercel --prod
```

## Troubleshooting

If you encounter issues during migration:

1. **Connection Issues**: 
   - Check the output of `/api/test-supabase` to see detailed connection information
   - Verify your Supabase and PostgreSQL credentials in `.env.local`
   - Make sure your IP address is allowed in Supabase's network settings

2. **Permission Errors**: 
   - Try using the `supabaseAdmin` client with the service role key
   - Check if your tables have row-level security (RLS) policies that might be blocking access

3. **SQL Errors**: 
   - Check your database schema for compatibility issues
   - Supabase uses PostgreSQL 14+, so ensure your SQL is compatible

## Using Both Connection Methods

The migration setup provides two ways to connect to your database:

1. **Direct PostgreSQL Connection** (`pool`): Use this for complex SQL queries and database operations
2. **Supabase Client** (`supabase` and `supabaseAdmin`): Use this for auth, storage, and simplified database operations

## Rollback Plan

If you need to rollback to your local database:

1. Revert imports in your code from `supabaseDb.js` back to `db.js`
2. Remove or comment out Supabase-specific code
3. Update your environment configuration to use local database settings

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [Next.js API Routes Documentation](https://nextjs.org/docs/api-routes/introduction)
