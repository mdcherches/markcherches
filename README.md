# markcherches.com

A lightweight, editable portfolio hosted on GitHub Pages.

## Edit the portfolio visually

The repository includes a [Pages CMS](https://pagescms.org) configuration. Pages CMS edits the same files in this repository, so there is no separate database or content migration.

1. Open [app.pagescms.org](https://app.pagescms.org).
2. Sign in with GitHub.
3. Install the Pages CMS GitHub App for the `mdcherches/markcherches` repository when prompted.
4. Open **Portfolio content**.
5. Edit text, reorder list items, or upload images.
6. Save. Pages CMS commits the update to `main`, and GitHub Pages publishes it automatically.

All editable text and links live in `content/site.json`. Uploaded JPG, JPEG, PNG, and WebP images go in `assets/images`.

## Preview locally

From the repository folder:

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Structure

- `index.html` — site shell and accessible navigation
- `styles.css` — responsive portfolio design
- `script.js` — page rendering and interactions
- `content/site.json` — all editable portfolio content
- `.pages.yml` — visual editor fields
- `assets/` — portfolio images
