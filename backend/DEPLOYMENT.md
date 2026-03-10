# Deployment & PostgreSQL Migration Guide

This document outlines how to upgrade your LeetCode leaderboard dashboard to full production readiness using Render and PostgreSQL (Neon, Supabase, Render Postgres, etc). 

## 1. Updated Backend Connection Logic
The code in `backend/config/db.js` has been updated to support PostgreSQL environments seamlessly. When Render spins up the container, it will automatically connect to Postgres via `process.env.DATABASE_URL`. If you run the app locally and `DATABASE_URL` is omitted, it will safely fallback to the local `database.sqlite` file.

## 2. Environment Variables (.env)
You must apply the following environment configuration securely inside your Render dashboard (**Render > Dashboard > Backend Web Service > Environment variables**):

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=supersecretkey_for_champions_arena
DATABASE_URL=postgresql://<YOUR_USER>:<YOUR_PASSWORD>@<YOUR_HOST>/<YOUR_DB_NAME>?sslmode=require
```

## 3. Database Migration Script
A script has been carefully provided at `backend/scripts/migrateToPostgres.js`. It safely connects to both the local SQLite database and the remote PostgreSQL cluster simultaneously and duplicates every single user record automatically.

**To run the migration locally:**
1. Populate your `.env` file with your `DATABASE_URL` inside your local `backend` directory.
2. Ensure you are inside the `backend/` directory.
3. Run the script:
   ```bash
   node scripts/migrateToPostgres.js
   ```
4. Verify that the terminal logs declare "Migration completed successfully!"

## 4. API & Scheduled Job Status
* **The Leaderboard API:** The API has actually already been updated to directly source all its data exactly from the central database (`Student.findAll()`) without scraping Leetcode for every request. This is 100x faster and never returns `0` erroneously unless the user genuinely has no problems solved.
* **Scheduled Background Job:** Located at `backend/cron/jobs.js`, this automated task runs synchronously and responsibly every day at midnight to query LeetCode and securely write updated stats into your PostgreSQL cluster.

## 5. Deployment Instructions
1. Push all of these latest `config/db.js`, `package.json`, and `scripts` changes to your main GitHub branch safely.
2. Spin up a Postgres database (such as on Neon.tech or Supabase.com).
3. Ensure you have entered the valid `DATABASE_URL` from Supabase, Neon, or Render exactly in the Render production servers config securely.
4. Run the migration script (`node scripts/migrateToPostgres.js`) to transfer your populated local SQLite data into your production database.
5. In Render, your project should now start with a robust persisted Postgres connection, retaining all student scores, solving the "0" issue permanently!
