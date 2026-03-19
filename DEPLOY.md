# Deployment (Cloudflare Pages + Cloudflare Access)

This repo is set up for a **free** deployment where:

- The Astro site is hosted on **Cloudflare Pages**.
- `/api/compile` is protected by **Cloudflare Access** (only you).
- Calling `/api/compile` triggers a **GitHub Actions** workflow that runs the existing compiler and commits the generated post back to the repo (which triggers a Pages rebuild).

## 1) Cloudflare Pages

- Framework preset: Astro
- Build command: `npm run build`
- Build output directory: `dist`
- Node version: `20` (recommended)

Note: `npm run build` runs `src/scripts/sync_public_images.js` first, which copies `images/` → `public/images/` so your `/images/...` URLs work in `dist/`.

### KV binding (sessions)

`@astrojs/cloudflare` enables Astro sessions via a Cloudflare KV binding named `SESSION` by default.

Cloudflare Pages bindings are configured **in the Cloudflare dashboard** (not in this repo).

In Cloudflare Dashboard → Workers & Pages → your Pages project → Settings → Functions → **KV namespace bindings**, create/bind a KV namespace as:

- Variable name: `SESSION`

Tip: Set this for both **Production** and **Preview** environments if you use Preview deployments.

## 2) GitHub Actions secret (Google service account)

Create a Google service account key (JSON), then add this GitHub Actions secret:

- `GOOGLE_SERVICE_ACCOUNT_JSON`: the full JSON key contents

Share any source Google Doc(s) with the service account’s `client_email` so it can read/export them.

## 3) Cloudflare Pages env vars (compile endpoint)

Set these as **Cloudflare Pages environment variables** (Dashboard → Workers & Pages → your Pages project → Settings → Environment variables).

These are read by `src/pages/api/compile.ts` and `src/lib/cloudflare_access.ts`.

- `CF_ACCESS_TEAM_DOMAIN`: e.g. `andypersonalwebsite.cloudflareaccess.com`
- `CF_ACCESS_AUD`: your Access Application “AUD” (Audience)
- `ENFORCE_ACCESS`: `1`

- `GITHUB_OWNER`: e.g. `YetSquire`
- `GITHUB_REPO`: e.g. `yetsquire.github.io`
- `GITHUB_DISPATCH_TOKEN`: a GitHub token that can dispatch workflows for the repo (**store as a secret**)
- `GITHUB_WORKFLOW_ID`: `compile-post.yml` (optional; default)
- `GITHUB_REF`: `main` (optional; default)

## 4) Cloudflare Access policy

In Cloudflare Zero Trust → Access → Applications:

- Create (or reuse) an app protecting your Pages site (typically a **Self-hosted** application for `https://YOUR_DOMAIN`).
- Add a policy that allows only your identity (email / IdP user).
- Ensure the policy applies to the path `/api/compile*`.

Notes:
- Your Access app’s **AUD** value is what you put in `CF_ACCESS_AUD`.
- When Access is enforced, Cloudflare injects a `Cf-Access-Jwt-Assertion` header, and the `/api/compile` endpoint validates it.

## 5) Triggering a compile

Send a POST:

```sh
curl -X POST https://YOUR_DOMAIN/api/compile \
  -H 'content-type: application/json' \
  -d '{"docId":"...","tabId":"t....","debug":0}'
```

If you hit it from a browser while logged into Access, it should dispatch `Compile post` in GitHub Actions.


  Minimal Google Cloud setup (for your current compiler)

  1. Create a Google Cloud project
  2. Enable APIs: Google Docs API + Google Drive API
  3. Create a Service Account and download a JSON key
  4. Put that JSON into GitHub Actions secret GOOGLE_SERVICE_ACCOUNT_JSON
  5. Share each source Google Doc with the service account email
     (client_email in that JSON)
