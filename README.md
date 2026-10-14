# markcherches.com

A minimal, single-page portfolio with an original portrait, selected work, projects, and contact links. Navigation scrolls within the page. The Snapchat lens player and privacy page are preserved.

## Edit text and photos without code

1. Open [Pages CMS](https://app.pagescms.org) and sign in with GitHub.
2. Choose **mdcherches/markcherches**, branch **main**, then **Portfolio content**.
3. Edit **Introduction & portrait**, **Selected work**, **Selected projects**, **About section**, or **Contact footer**. **Introduction social links** controls the links below the introduction.
4. Upload or replace the portrait in **Introduction & portrait → Portrait**. Add a short portrait description for accessibility.
5. Save. Pages CMS commits to `main`; GitHub Pages publishes the update. Allow time for the deployment, then refresh the site.

**Optional experience section** and **Optional research section** retain the previous background records. They are hidden by default to keep the homepage concise; enable **Show this section on the website** to display either below About. Review dates and claims before enabling older records. Projects without a public destination can leave **Project link** blank. The Snapchat entry's **Interactive demo** value stays `snapchat-lenses`.

All editable text lives in `content/site.json`; the editor fields are in `.pages.yml`. Uploaded images remain in `assets/images`. No new CMS account, database, or content migration is required for an existing Pages CMS connection.

## Hosting

GitHub Pages serves `main` from `/`, with custom domain `markcherches.com` in `CNAME`. `.nojekyll` keeps this a plain static site. The repository and Pages CMS remain the source of truth.

## Preview and verify

```sh
python3 -m http.server 4173
```

Open `http://localhost:4173`. Check desktop and narrow mobile layouts, anchor navigation, the original portrait, and the Snapchat demo. The browser regression suite is `npm run test:lenses` (requires Playwright and Chrome; its default server port is 4174, or set `LENS_TEST_URL`).

## Structure

- `index.html` — site shell and navigation
- `styles.css` — responsive layout, lens player, and privacy styling
- `script.js` — content rendering and anchor navigation
- `content/site.json` — editable portfolio text and image paths
- `.pages.yml` — Pages CMS configuration
- `lenses.js`, `content/lenses.json` — existing optional Snapchat demo
- `assets/` — original images and lens resources
