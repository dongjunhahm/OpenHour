# OpenHour

A Next.js application for scheduling and organizing appointments.

## Local Development

To install dependencies:

```bash
npm install
# or
bun install
```

To run the development server:

```bash
npm run dev
# or
bun run dev
```

To build the application:

```bash
npm run build
# or
bun run build
```

## Database Setup

Initialize the database:

```bash
npm run init-db
# or
bun run init-db
```

## Deployment on Render

This application is configured for deployment on Render using the `render.yaml` file in the root directory.

### Deployment Steps

1. Create a Render account at [render.com](https://render.com)
2. Connect your GitHub repository
3. Click on "Blueprint" and select your repository
4. Render will automatically detect the `render.yaml` file and create the required resources
5. Update the environment variables as needed
6. The application will be deployed automatically

### Key Files for Render Deployment

- `render.yaml`: Contains the configuration for both the web service and database
- `render-startup.sh`: The startup script that Render will run to start the application
- `render-init-db.js`: Script to initialize the database during deployment

### Health Check

The application has a health check endpoint at `/api/health` that Render uses to verify the application is running correctly.

## Original Project

This project was originally created using `bun init` in bun v1.1.29. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime, but the application now uses npm for better compatibility with Render.
