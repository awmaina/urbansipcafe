# Deploying this repo to GitHub + Vercel

This project contains a Vite frontend (`client`) and a Node server (`server`). The easiest path to deploy on Vercel is to host the frontend there and host the server separately (or convert server endpoints to Vercel Serverless functions).

Quick steps to push to GitHub and connect to Vercel:

1. Initialize git and push to a new GitHub repo

```bash
cd /path/to/this/repo
git init
git add .
git commit -m "Initial commit"
# create repo on GitHub (use web UI or gh CLI)
# replace <YOUR_REMOTE_URL> with the repo HTTPS/SSH URL
git remote add origin <YOUR_REMOTE_URL>
git branch -M main
git push -u origin main
```

2. Connect the repository in Vercel

- Go to https://vercel.com/new
- Select your GitHub account and the new repo.
- In Project Settings (during import) set:
  - **Install Command:** `pnpm install` (or `npm ci`)
  - **Build Command:** `pnpm build` (or `npm run build`)
  - **Output Directory:** `dist/public`

3. Environment variables

- If your app needs env vars for build or runtime, add them in the Vercel dashboard under Settings → Environment Variables. Example keys may include database URLs, S3 keys, etc.

4. Notes

- The root `package.json` contains the `build` script that runs the Vite build and bundles server code to `dist`.
- This repo's Vite `outDir` is configured as `dist/public`, so set that as Vercel's output directory.
- If you want the Node server deployed on Vercel, you'll need to convert its endpoints into Vercel Serverless Functions (move handlers into `api/`), or deploy the server to another host (Heroku, Railway, Render, DigitalOcean, etc.) and point the frontend to that backend.

If you want, I can:
- Add a `vercel.json` with rewrites to point API calls to another host.
- Add GitHub Actions for CI.
- Walk through creating the GitHub repo via `gh` CLI and pushing from here.
