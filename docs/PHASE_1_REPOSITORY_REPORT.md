# Phase 1 — Repository configuration report

Date: 11 October 2026

## Findings before any change

| Item | Finding |
| --- | --- |
| Website 2.0 folder | `C:\Users\91767\Downloads\Wedding website 2.0` contained only the nine phase prompt files — **no Website 2.0 implementation existed yet**. |
| Git repository of that folder | None of its own. The folder sat inside an unrelated home-directory repository (`C:\Users\91767`, remote `PrajwalS380/Handwritten-Text-Extraction`, branch `main`), where it showed as untracked. |
| Dedicated remote | `https://github.com/PrajwalS380/wedding-2.0.git` exists, is public, default branch `main`, and was **empty** (no commits), so nothing needed to be merged or fetched. |
| Website 1.0 | `D:\wedding_invitation` → `PrajwalS380/wedding`, production `https://thedarshanandvathsala.vercel.app/`. Not opened for editing. |

## Migration performed

1. `git init -b main` inside the Website 2.0 folder — a separate, nested
   repository with its own history. The outer home-directory repository was not
   modified (the folder still appears there only as an untracked directory).
2. `origin` set to `https://github.com/PrajwalS380/wedding-2.0.git`.
3. Phase prompt files (`Phase *.txt`) are kept locally but git-ignored.
4. The Website 2.0 foundation was created in this repository (see README) and
   committed locally on `main`.

No push and no deployment were made in Phase 1. Pushing to `origin/main` is
deferred to the deployment phase, after the separate Vercel project for
Website 2.0 has been created and verified, so that a push can never trigger
an unverified deployment.

## Isolation guarantees

- No file in this repository was copied from Website 1.0.
- Website 2.0 runs on port 5174 (dev) / 4180 (preview); Website 1.0 uses 5173.
- No Vercel configuration, domain or deployment of Website 1.0 was touched.
