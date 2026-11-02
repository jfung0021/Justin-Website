# Working on this site from another computer

The repo on GitHub is the source of truth: `https://github.com/jfung0021/Justin-Website`.
Nothing lives outside it — clone it and you have the whole project.

## One-time setup on a new machine

1. Install [Git](https://git-scm.com/download/win) and [Node.js](https://nodejs.org) (LTS, v20 or newer).
2. Enable pnpm, which ships with Node:

   ```
   corepack enable pnpm
   ```

3. Clone the repo somewhere **outside** OneDrive, Dropbox or any sync folder —
   file-sync tools corrupt `node_modules` and `.git`:

   ```
   git clone https://github.com/jfung0021/Justin-Website.git
   cd Justin-Website
   pnpm install
   ```

## Day to day

```
pnpm dev        # local preview at http://127.0.0.1:4321
pnpm build      # production build into dist/
pnpm preview    # serve the built site locally
```

Start each session with `git pull`, and finish with:

```
git add -A
git commit -m "..."
git push
```

## Publishing

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site
and deploys it to GitHub Pages at https://justin-fung.com. There is no manual
deploy step and no secret or API key to copy between machines.

## Writing posts

Posts are Markdown files in `src/content/posts/`. Images referenced by posts live
in `public/uploads/`. Both are committed to the repo, so they travel with the clone.
