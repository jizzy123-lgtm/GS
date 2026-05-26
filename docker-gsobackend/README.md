# GS-JS Backend (`docker-gsobackend`)

This folder contains the Laravel backend for the GS-JS / GSU Gateway system.

The team's current local workflow is to run this backend directly with Laravel's built-in server instead of Docker. The mobile frontend lives in a separate folder and connects to this API over the network.

## Current Team Run Command

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

## What This Folder Contains

- Laravel application code
- API routes and controllers used by the mobile frontend
- Database migrations, models, and backend configuration
- Optional Vite assets that exist in this folder from earlier development work

## Prerequisites

- PHP 8.2 or newer
- Composer
- MySQL access, or access to the team's shared database
- Node.js and npm only if you need to work with the optional Vite assets in this folder

## Setup

1. Get the real `.env` file from a teammate or maintainer through a private channel.
   The public repository should not contain `.env`.
2. Place that `.env` file inside this folder.
3. Install PHP dependencies:

   ```bash
   composer install
   ```

4. If the `.env` file does not already contain an `APP_KEY`, generate one:

   ```bash
   php artisan key:generate
   ```

5. If you are setting up a brand-new local database instead of using the team's shared database, run:

   ```bash
   php artisan migrate
   ```

6. If the project needs public file uploads locally, create the storage symlink:

   ```bash
   php artisan storage:link
   ```

## Run the Backend

Start the API server from inside this folder:

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

Leave that terminal open while testing the frontend.

## Optional Queue Worker

Some features may rely on queued jobs. If needed, run this in a second terminal:

```bash
php artisan queue:work
```

## Frontend Connection

The separate mobile frontend uses its own `api.js` file to point to the backend host IP.

- Backend folder name stays `docker-gsobackend`
- Frontend folder name in the target repo is planned as `AppFrontend`

## Notes for Teammates

- Do not commit `.env` to a public repository.
- If you clone the repo and the backend does not start, first confirm that the correct `.env` file was provided privately.
- This folder name is intentionally kept as `docker-gsobackend` because the team requested that existing references remain unchanged.
