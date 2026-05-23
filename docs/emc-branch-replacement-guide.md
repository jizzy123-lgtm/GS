# EMC Branch Replacement Guide

Date: 2026-05-23

## Purpose

This guide documents the cleanup completed before pushing to `jizzy123-lgtm/GS` branch `emc`, and provides the exact Windows PowerShell steps to replace the current branch contents with the folders the team wants to keep.

## Intended Branch Contents

After the replacement push, the target branch should contain only:

- `docker-gsobackend`
- `AppFrontend`
- `docs/emc-branch-replacement-guide.md`

The guide below assumes the branch is being treated like a fresh branch whose old contents are removed first.

## Important Decisions Already Applied

- Backend folder name stays `docker-gsobackend`
- Frontend folder name becomes `AppFrontend`
- Backend `.env` is not pushed to the public repository
- Existing `.github/workflows` content is not kept because it is not required for the team's current local run workflow

## Cleanup Completed Before Push

The backend had unresolved Git conflict markers left in multiple files. Conflict markers look like this:

```text
<<<<<<< HEAD
=======
>>>>>>> commit-hash
```

These markers appear when Git detects two competing versions during a merge or rebase, and the file is saved without fully resolving the conflict. Leaving them in the repo is dangerous because:

- configuration files become invalid
- documentation becomes confusing
- build tools may fail
- future teammates may think the current file is the correct final version when it is not

The following backend files were cleaned:

- `docker-gsobackend/README.md`
- `docker-gsobackend/.gitignore`
- `docker-gsobackend/package.json`
- `docker-gsobackend/vite.config.js`

### What Was Changed

`README.md`

- Replaced the conflict text with a clean backend-specific README
- Updated it to match the team's actual local run command:

  ```bash
  php artisan serve --host=0.0.0.0 --port=8000
  ```

- Added setup notes about private `.env` handling

`.gitignore`

- Removed conflict markers
- Kept important Laravel ignore rules like `vendor`, `public/build`, and storage keys
- Kept useful machine-specific and Node-related ignores like `node_modules`, `*.log`, `.idea`, `.vscode`, and `.DS_Store`

`package.json`

- Removed conflict markers
- Merged the useful metadata, scripts, and development dependencies from both conflicting versions into one valid JSON file

`vite.config.js`

- Removed conflict markers
- Kept both the React plugin and Laravel Vite plugin so the file is syntactically valid and does not discard either side's setup blindly

## Frontend Copy Rule

The frontend source folder at:

```text
C:\Users\ACER\GSO_MOBILE_TESTING
```

currently contains its own nested `docker-gsobackend` folder.

That nested backend is an old copy and must not be pushed inside `AppFrontend`.

Because the latest backend is being pushed separately at the repository root from `C:\Users\ACER\GS-JS_Backend\docker-gsobackend`, the nested frontend-side backend copy must be excluded. Otherwise, the branch will contain a second, outdated backend inside the frontend folder.

## What Not To Push

Do not push these as part of the public branch replacement:

- backend `.env`
- backend runtime output files such as `stdout.txt`, `stderr.txt`, `as_fix_err.txt`, and `as_fix_out.txt`
- `.git` folders
- `node_modules`
- `.expo`
- `vendor`
- backend `storage/logs`
- IDE folders such as `.idea` and `.vscode`
- the nested `C:\Users\ACER\GSO_MOBILE_TESTING\docker-gsobackend` copy inside the frontend source

## Step-By-Step PowerShell Commands

### 1. Prepare a clean temporary working folder

```powershell
cd C:\tmp
if (Test-Path 'C:\tmp\GS-emc-clean') { Remove-Item -LiteralPath 'C:\tmp\GS-emc-clean' -Recurse -Force }
git clone --branch emc https://github.com/jizzy123-lgtm/GS.git C:\tmp\GS-emc-clean
cd C:\tmp\GS-emc-clean
```

### 2. Remove the current branch contents but keep Git metadata

```powershell
Get-ChildItem -Force | Where-Object { $_.Name -ne '.git' } | Remove-Item -Recurse -Force
```

### 3. Copy the backend folder into the clean clone

This copies the backend while excluding `.env`, `vendor`, `node_modules`, runtime output files, `storage/logs`, and local editor/cache folders.

```powershell
robocopy 'C:\Users\ACER\GS-JS_Backend\docker-gsobackend' 'C:\tmp\GS-emc-clean\docker-gsobackend' /E /XD .git node_modules vendor .idea .vscode .fleet .nova .zed storage\\logs /XF .env .env.backup .env.production .phpunit.result.cache stdout.txt stderr.txt as_fix_err.txt as_fix_out.txt
```

### 4. Copy the frontend folder as `AppFrontend`

This guide excludes the nested frontend-side `docker-gsobackend` copy so only the frontend is pushed into `AppFrontend`.

```powershell
robocopy 'C:\Users\ACER\GSO_MOBILE_TESTING' 'C:\tmp\GS-emc-clean\AppFrontend' /E /XD .git node_modules .expo .idea .vscode docker-gsobackend /XF .env
```

### 5. Copy this documentation file into the branch

```powershell
New-Item -ItemType Directory -Path 'C:\tmp\GS-emc-clean\docs' -Force | Out-Null
Copy-Item 'C:\Users\ACER\GS-JS_Backend\docs\emc-branch-replacement-guide.md' 'C:\tmp\GS-emc-clean\docs\emc-branch-replacement-guide.md'
```

### 6. Review what will be committed

```powershell
cd C:\tmp\GS-emc-clean
git status --short
```

At this point, confirm that:

- the old branch contents are gone
- `docker-gsobackend` is present
- `AppFrontend` is present
- `docs/emc-branch-replacement-guide.md` is present
- backend `.env` is not present
- `AppFrontend\docker-gsobackend` is not present

### 7. Commit the replacement

```powershell
git add .
git commit -m "Replace emc branch with backend and AppFrontend"
```

### 8. Push to the `emc` branch

```powershell
git push origin emc
```

## Notes About `robocopy`

`robocopy` often returns exit codes from `1` to `7` even when the copy succeeded. Those codes do not automatically mean failure.

## What Teammates Need After Pulling

Because `.env` is intentionally not pushed, a teammate must get the correct backend `.env` file privately and place it in:

```text
docker-gsobackend\.env
```

Then the usual local run flow is:

### Backend

```powershell
cd docker-gsobackend
composer install
php artisan serve --host=0.0.0.0 --port=8000
```

### Frontend

```powershell
cd AppFrontend
npm install
npx expo start --dev-client --tunnel
```

## Final Reminder

`AppFrontend` should contain frontend files only. The latest backend should exist only once at the repository root as `docker-gsobackend`.
