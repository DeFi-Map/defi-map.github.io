# DeFiMap landing page

Served by GitHub Pages at https://defi-map.github.io/ — `/en/` and `/ru/`, with `/` redirecting to the visitor's language (saved choice, then browser languages, then English).

- `src/page.html` — page template; English copy is inline, translatable elements carry `data-i18n` keys
- `src/i18n/en.json`, `src/i18n/ru.json` — page metadata, scroll-story readouts, and (for Russian) every `data-i18n` string
- `src/root.html` — the `/` redirect page
- `assets/` — CSS, JS, images, shared by both languages
- `build.mjs` — writes `dist/`; fails if a language misses or has extra keys

Pushes to `main` build and deploy via `.github/workflows/pages.yml`.

Preview locally:

```sh
bun build.mjs
cd dist && python3 -m http.server 8765
# open http://127.0.0.1:8765/
```

All numbers in the page mockups are illustrative sample data.
