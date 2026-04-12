# Deployment Guide (Railway / Render)

This project is built using Node.js, Express, TypeScript, and Drizzle ORM configured for PostgreSQL. It is deployment-ready for cloud platforms like Railway or Render.

## Prerequisites
1. Ensure your code is pushed to a Github Repository.
2. In your `package.json`, ensure the start commands are ready. They are already set up:
```json
"scripts": {
  "build": "tsc",
  "start": "node dist/server.js",
  "db:push": "drizzle-kit push",
  "seed": "node dist/db/seed.js"
}
```

## Option 1: Deploy on Railway

1. Go to [Railway.app](https://railway.app/) and sign in.
2. Click **New Project** and select **Provision PostgreSQL**. This will create a fresh Postgres database for you.
3. Click **New** again, select **GitHub Repo**, and choose your RGS Store backend repository.
4. Once the repository is added, Railway will attempt to build and deploy. Wait for it to fail (because environment variables are missing).
5. Open your App service in Railway, go to the **Variables** tab, and add the following:
   - `DATABASE_URL`: (You can get this by going to your Postgres service in Railway, clicking the **Variables** tab, and copying `DATABASE_URL`).
   - `JWT_SECRET`: Enter a strong, secure random string.
   - `PORT`: (Optional, Railway automatically injects the PORT).
6. Go back to your App Service settings, find the **Build** section:
   - Build Command: `npm run build`
   - Start Command: `npm run db:push && npm run start`
   *(This ensures that whenever you deploy, the database schema is automatically updated before starting the server).*
7. Railway will trigger a redeploy automatically with the variables and commands.
8. Go to the **Settings** tab of the App, click **Generate Domain**, and you can use this URL for your API (`https://your-app.up.railway.app/api/v1/...`).

## Option 2: Deploy on Render

1. Go to [Render.com](https://render.com/) and sign in.
2. Click **New** -> **PostgreSQL**. Give your DB a name and click **Create Database**. 
3. Once created, copy the **Internal Database URL** (or External if needed).
4. Click **New** -> **Web Service** and choose your Github repository.
5. In the Service settings:
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run db:push && npm run start`
   - Add the Environment Variables:
     - `DATABASE_URL`: The URL you copied from your Postgres database.
     - `JWT_SECRET`: A secure random string for JWT.
6. Save and deploy. Render will build and deploy your app.

## Seeding the Database in Production

If you want to run the manual seed script in production to create your initial admin account:
1. In Railway/Render, open the console/terminal of your deployed app.
2. Run `npm run seed` (or `node dist/db/seed.js`).
3. You will now have the `admin@rgsstore.com` user and dummy products accessible via your API.
