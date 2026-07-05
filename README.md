# ChezburgerPRO

The private game vault. Members only.

- **Frontend:** React + Vite static site on GitHub Pages
  (https://chezburgar.github.io/chezburgerpro/)
- **Backend:** Supabase — Postgres + Storage + the `api` Edge Function
  (all access control is IP-based and enforced server-side)

Every push to `main` redeploys the site via GitHub Actions.

## Local dev

```bash
npm install
npm run dev
```
