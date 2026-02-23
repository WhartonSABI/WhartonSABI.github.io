# WSABI Website

The main website for the Wharton Sports Analytics and Business Initiative. Hosts portfolios, data links, and rosters from the seminar, summer lab, and Moneyball Academy.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:4321

## Build

```bash
npm run build
```

Output is in `dist/`.

## Deploy to GitHub Pages

The workflow is at `.github/workflows/deploy-website.yml` (wsabi repo root).

1. Push the wsabi repo to GitHub
2. Repo Settings → Pages → Source: **GitHub Actions**
3. On push to `main`/`master` (when `website/` changes), the workflow builds and deploys

If your site URL will be `username.github.io/wsabi` (project site), add `site: 'https://...'` and `base: '/wsabi/'` to `astro.config.mjs`.

## Content

- **Projects:** Edit `src/config/repos.yaml` to add/remove projects and deliverables (presentations, papers).
- **People:** Add YAML files in `src/config/people/` (e.g. `seminar-2025.yaml`, `lab-2024.yaml`). See existing files for the schema.

## GitHub raw URLs

Deliverable links use: `https://github.com/{org}/{repo}/raw/main/{path}`

Ensure the files exist in the default branch of each repo.
