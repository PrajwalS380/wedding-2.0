# Deployment — Website 2.0 on its own Vercel project

Website 2.0 deploys from **`https://github.com/PrajwalS380/wedding-2.0`** only.
Website 1.0 (`PrajwalS380/wedding`, `https://thedarshanandvathsala.vercel.app/`)
is a different project and must not be touched.

## Status

| Step | Status |
| --- | --- |
| Code pushed to `wedding-2.0` / `main` | Done (`b2d01b1`, then the Phase 8 configuration commit) |
| Separate Vercel project created and linked to `wedding-2.0` | **Waiting for you.** It needs your Vercel login, which only you can authorise |
| Production URL | Not assigned yet. It will be the domain Vercel gives the new project |

## Create the project (about 2 minutes)

1. Open <https://vercel.com/new> while signed in to the Vercel account you use.
2. Under **Import Git Repository**, choose **PrajwalS380/wedding-2.0**.
   - If it isn't listed, click **Adjust GitHub App Permissions** and grant the
     Vercel app access to `wedding-2.0`.
   - Do **not** pick `wedding`; that is Website 1.0.
3. Configure the project:
   - **Project Name:** something new, e.g. `darshan-vathsala-royal`. This name
     becomes the address `https://<name>.vercel.app`. It must differ from
     Website 1.0's project.
   - **Framework Preset:** Vite (detected automatically).
   - **Root Directory:** `./` (the repository root).
   - **Build and Output Settings:** leave as detected. `vercel.json` already sets
     `npm ci`, `npm run build` and `dist`.
   - **Environment Variables:** none. The site needs none.
4. Click **Deploy**.
5. When it finishes, open the project's **Domains** tab and copy the production
   domain (`https://<name>.vercel.app`). Website 1.0's project and domain stay
   exactly as they are.

From then on, every push to `wedding-2.0` / `main` deploys Website 2.0 only.

## After it is live

Run the production checks against the real URL:

```bash
node tests/e2e/smoke.mjs https://<name>.vercel.app
node tests/e2e/features.mjs https://<name>.vercel.app
node tests/e2e/a11y.mjs https://<name>.vercel.app
```

`intro.mjs`, `introcontrast.mjs`, `introperf.mjs` and `worldshot.mjs` use
development-only hooks, so they run against the dev server
(`npm run dev`, port 5174).
