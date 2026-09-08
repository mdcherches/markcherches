# Snapchat lens demo

The Projects entry with `demo: "snapchat-lenses"` opens an inline player. Its text and thumbnail remain editable in Pages CMS.

`content/lenses.json` controls the featured lenses. The public fallback uses the approved Snap-hosted Vine Trivia link while the Personal Site Camera Kit app awaits production approval. No staging token is committed or used on the public site.

## Enable the camera on this site

1. Obtain production approval for the Personal Site app in My Lenses / the Snap Developer Portal. Submit a demo of the integration and a privacy-policy URL as required by Snap's review workflow.
2. Configure Trusted Origins for the exact deployed origins, including `https://markcherches.com` (and `https://www.markcherches.com` if used).
3. Set `productionApiToken` to the Web Production API Token in `content/lenses.json`. This is Snap's browser SDK token, which visitors necessarily receive; never put an account password, client secret, or other backend credential here.
4. Keep `lensGroupId` set to the group containing the selected lenses. Add a `lensId` from Camera Kit for each entry if possible; otherwise the player matches its `name` against that group's returned lenses. A Snapchat Snapcode ID or Hosted WebAR experience ID is not a substitute for a verified Camera Kit Lens ID.
5. Verify camera permissions, the complete game, sound, restart, mobile layout, closing, and navigation on the live HTTPS origin.

The SDK handles its own Snap terms prompt. This site does not record camera video. Before release, ensure the published privacy information reflects Snap's processing and the rest of the site's actual behavior.

## Build

The portfolio remains a static site. `assets/lenses/camera-kit.js` and its license notices are committed so GitHub Pages does not need a build service. The bundle loads only when a visitor starts the camera.

To update the pinned SDK bundle:

```sh
npm ci
npm run build:lenses
```

On localhost only, developers may put `{ "stagingApiToken": "…", "lensGroupId": "…" }` in the current tab's `sessionStorage` under `lens-preview`. The production token is not overridden on any public hostname. Do not commit staging credentials. Use localhost rather than 127.0.0.1: Snap's API rejected the latter origin during testing.

## References

- [Camera Kit account setup](https://developers.snap.com/camera-kit/getting-started/setting-up-accounts)
- [Lens sources and groups](https://developers.snap.com/camera-kit/ar-content/lens-scheduler)
- [Release approval and trusted origins](https://developers.snap.com/camera-kit/app-review/release-app)
- [Snap terms prompt](https://developers.snap.com/camera-kit/app-review/terms-of-service-notice)

## Validation scope

Browser checks cover the hosted fallback, responsive layout, lazy SDK loading, and camera lifecycle with a controlled SDK substitute and simulated camera. Real Vine Trivia loaded in the earlier isolated test, and its creator confirmed the working group setup. This repository integration still requires a full round with real staging credentials and camera input; production cannot be verified before Snap enables it.

Run the browser regression checks with a local server on port 4174:

```sh
python3 -m http.server 4174 --bind 127.0.0.1
# In another terminal:
npm run test:lenses
```

The tests use installed Google Chrome with simulated camera input; set `LENS_TEST_URL` to use another localhost port. They never need a real token.
