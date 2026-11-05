# DeFiMap landing page

Static site served by GitHub Pages. No build step: `index.html`, `assets/css/site.css`, `assets/js/site.js`.

Two languages. English copy lives in `index.html`; Russian is in `assets/js/i18n.js`, keyed by each element's `data-i18n` attribute. The language is picked by `?lang=en|ru`, then the visitor's saved choice, then browser languages, falling back to English.

Preview locally:

```sh
python3 -m http.server 8765
# open http://127.0.0.1:8765/
```

All numbers in the page mockups are illustrative sample data.
