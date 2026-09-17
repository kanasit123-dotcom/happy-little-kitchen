# AI Handoff

## Project

Happy Little Kitchen is a bilingual Thai/English cooking game for young children. It is a static PWA built with plain HTML, CSS, and JavaScript. No build step or framework is required.

## Read First

Before changing code, read `README.md`, `MEMORY.md`, `index.html`, `css/app.css`, `js/app.js`, and `tests/app.cjs`.

## Product Rules

- Use picture-first controls and large touch targets for mobile and iPad.
- Do not add scores, countdowns, advertisements, subscriptions, or wrong-answer pressure.
- Spoken prompts must finish before the next spoken prompt or automatic step transition.
- Ingredients support real drag-and-drop, or tap an ingredient followed by tapping the bowl.
- Mixing happens by tapping the spoon directly.
- Baking and blending require holding the appliance itself. Progress pauses immediately on release.
- Long presses and drags must not select text, show a copy menu, drag browser images, or zoom the page.
- Decorations can be selected and placed on the food, or dragged to an exact position.
- The finished food can be dragged to multiple friends. Each friend may be fed once per dish.
- Keep Thai and English behavior equivalent.

## Important Files

- `js/app.js`: recipes, translations, state, audio queue, game steps, touch interactions, feeding animation.
- `css/app.css`: responsive layout, appliance illustrations, interaction states, and animations.
- `sw.js`: offline cache. Increment the cache version whenever deployed assets change.
- `tests/app.cjs`: Chrome end-to-end coverage for all recipes, responsive layouts, offline mode, drag/drop, hold/pause, decoration, and feeding.
- `MEMORY.md`: long-term product decisions.

## Run

Serve the repository over HTTP, then open the local URL in Chrome:

```powershell
python -m http.server 5174 --bind 127.0.0.1
```

Run the browser tests with Playwright available in `NODE_PATH`:

```powershell
node tests/app.cjs
```

## Deployment

The `main` branch deploys through GitHub Pages at:

`https://kanasit123-dotcom.github.io/happy-little-kitchen/`

After changing CSS or JavaScript, update the version query in `index.html`, the cache name and file URLs in `sw.js`, run the full tests, commit, push, wait for Pages to build, and test the live URL.

## Prompt For Another AI

Read the project files and preserve the existing child-friendly interaction rules. Make the requested change end to end, update tests for the behavior, verify at 320, 390, 768, and 1280 pixel widths, verify offline mode, and do not remove unrelated working features.
