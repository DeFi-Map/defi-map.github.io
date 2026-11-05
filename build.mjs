// Builds dist/: /en/ and /ru/ pages from src/page.html + src/i18n/*.json, plus the root redirect.
// Run with Bun (uses its built-in HTMLRewriter): `bun build.mjs`
import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';

const BASE = 'https://defi-map.github.io';
const LANGS = ['en', 'ru'];
const OUT = 'dist';

const template = await readFile('src/page.html', 'utf8');
const templateKeys = new Set([...template.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]));

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await cp('assets', `${OUT}/assets`, { recursive: true });
await writeFile(`${OUT}/.nojekyll`, '');
await cp('src/root.html', `${OUT}/index.html`);

for (const lang of LANGS) {
  const { meta, readouts, strings } = JSON.parse(await readFile(`src/i18n/${lang}.json`, 'utf8'));

  // English text lives in the template; every other language must translate every key.
  if (lang !== 'en') {
    const missing = [...templateKeys].filter((k) => !(k in strings));
    const unused = Object.keys(strings).filter((k) => !templateKeys.has(k));
    if (missing.length || unused.length) {
      throw new Error(`${lang}: missing ${JSON.stringify(missing)}, unused ${JSON.stringify(unused)}`);
    }
  }

  const url = `${BASE}/${lang}/`;
  const setAttr = (name, value) => ({ element: (el) => el.setAttribute(name, value) });
  const html = await new HTMLRewriter()
    .on('html', setAttr('lang', lang))
    .on('title', { element: (el) => el.setInnerContent(meta.title) })
    .on('meta[name="description"]', setAttr('content', meta.description))
    .on('meta[property="og:title"]', setAttr('content', meta.title))
    .on('meta[property="og:description"]', setAttr('content', meta.ogDescription))
    .on('meta[property="og:locale"]', setAttr('content', meta.locale))
    .on('meta[property="og:url"]', setAttr('content', url))
    .on('link[rel="canonical"]', setAttr('href', url))
    .on('[data-i18n]', {
      element(el) {
        if (lang !== 'en') el.setInnerContent(strings[el.getAttribute('data-i18n')], { html: true });
        el.removeAttribute('data-i18n');
      },
    })
    .on('.lang a', {
      element(el) { if (el.getAttribute('data-lang') === lang) el.setAttribute('aria-current', 'page'); },
    })
    .on('[data-label]', { element: (el) => el.setInnerContent(readouts[0][0]) })
    .on('[data-big]', { element: (el) => el.setInnerContent(readouts[0][1]) })
    .on('#readouts', {
      element: (el) => el.setInnerContent(JSON.stringify(readouts).replace(/</g, '\\u003c'), { html: true }),
    })
    .transform(new Response(template))
    .text();

  await mkdir(`${OUT}/${lang}`, { recursive: true });
  await writeFile(`${OUT}/${lang}/index.html`, html);
  console.log(`built ${OUT}/${lang}/index.html`);
}
