# Little Moments Studio — Secure Cloudflare Edition

A responsive celebration website with server-verified admin login, shared event data, and remote photo uploads using Cloudflare Pages Functions, KV, and R2.

## Critical hosting requirement

This version **will not work on GitHub Pages alone** because GitHub Pages does not execute server-side Functions. Deploy it to **Cloudflare Pages**. Do not upload the password into HTML, CSS, JavaScript, or this repository.

## 1. Create Cloudflare resources

In the Cloudflare dashboard:
1. Create a KV namespace, e.g. `little-moments-events`.
2. Create an R2 bucket, e.g. `little-moments-photos`.
3. Create a Pages project and connect this repository, or upload the project through a supported Pages deployment workflow.
4. In Pages → Settings → Functions, bind KV namespace as `EVENTS_KV` and R2 bucket as `EVENT_PHOTOS`.
5. In Pages → Settings → Variables and Secrets, add **encrypted secrets**:
   - `ADMIN_PASSWORD`: enter your chosen admin password in Cloudflare's dashboard only.
   - `SESSION_SECRET`: use a long, random secret value (at least 32 random characters).
6. Redeploy after adding bindings and secrets.

If using `wrangler.toml`, replace the KV namespace ID and R2 bucket name with your real values. For dashboard-based Pages deployment, configure bindings in the dashboard as well.

## 2. Deploy

The easiest robust path is connect a GitHub repository to Cloudflare Pages and use the repository root as the build output directory with no build command. Ensure the `functions/` folder is included in the repository so Pages Functions are deployed. A plain drag-and-drop static upload may not deploy Functions; use Git integration or Wrangler Pages deployment for this project.

## 3. Use the site

- Open the public site: celebrations are visible to visitors.
- Tap **Admin login**, enter the password you configured as `ADMIN_PASSWORD`, and manage events.
- Uploaded photos are stored in R2; celebration metadata is stored in KV.
- Admin sessions use a signed, HttpOnly, Secure, SameSite=Strict cookie and expire after eight hours.
- Use Log out securely when finished.

## Included features

- Birthday, wedding anniversary, anniversary, graduation, wedding, baby shower, new baby, festival, achievement, thank-you, congratulations, custom occasions.
- Multiple people and multiple photos per celebration.
- Add, edit, and delete public celebrations.
- Shared server-side storage and photo hosting.

## Security notes

- Never commit `ADMIN_PASSWORD` or `SESSION_SECRET` to source control.
- If the password has already been placed in any public code, change it in Cloudflare immediately.
- The site displays public celebration photos publicly. Do not upload sensitive/private images.
- This starter includes basic same-origin checks and signed sessions. For high-traffic/public production use, add login rate limiting (e.g. a dedicated KV/Durable Object limiter or Cloudflare WAF rate-limit rule), logging/monitoring, and a recovery procedure for lost secrets.
- Deleting an event removes its metadata but does not automatically garbage-collect its R2 photo objects; those unused files can be removed from R2 later.
