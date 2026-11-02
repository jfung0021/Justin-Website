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

## Signing in to GitHub — read this before the first push

**This repo belongs to `jfung0021`. There is a second GitHub account, `Justin0021`,
which does not have write access.** Cloning and pulling work without signing in at
all, because the repo is public, so the mismatch stays invisible until the first
push — which then fails with:

```
remote: Permission to jfung0021/Justin-Website.git denied to Justin0021.
fatal: ... The requested URL returned error: 403
```

Git Credential Manager authenticates by opening a browser, and it silently reuses
whatever GitHub session that browser already has. So **sign in to github.com as
`jfung0021` first**, then push. If the browser is logged in as the wrong account,
sign out or use a private window — otherwise GCM keeps handing over the wrong token.

Notes from hitting this the hard way:

- A 403 makes git discard the token, so nothing bad gets cached. Just fix the
  account and push again.
- Do not dismiss the GCM dialog mid-flow. Cancelling it drops git back to a
  `Username for 'https://github.com':` prompt, which is a dead end — GitHub no
  longer accepts passwords there. Press Ctrl-C and start over.
- After a successful push, `cmdkey /list` should show
  `git:https://github.com` with user `jfung0021`. Once that exists, pushes stop
  prompting on that machine.
- A `127.0.0.1 refused to connect` page in the browser after authenticating is
  harmless — it is the OAuth callback tab, and its listener closes as soon as
  the push succeeds. Check the terminal, not the browser, to see whether it worked.

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
