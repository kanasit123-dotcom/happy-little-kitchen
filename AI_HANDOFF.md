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
- Each recipe carries its own `steps` list (`RECIPES[x].steps`) that mirrors real cooking. Step types and their renderers live in `RENDERERS` in `js/app.js`: prep (cut/crack), add (drag into bowl/pot/blender), mix (tool gesture), cook (hold appliance), pour (hold the source to tilt), flip (swipe up), move (drag N times: plate, ladle, scoops), dip (hold to blanch), spread (rub until coverage), sprinkle (tap the grater), shape (tap the tray), lid (drag the lid), slice (swipe), candles (place → light → blow), decorate, serve. Art references are `kind:key` strings (`state:` default → `assets/states/`).
- `stage` holds what is on the plate between steps (`base`, `bits`, `slices`, `candles`) and `paint` is an offscreen canvas for sauce/frosting that `syncPaint()` copies into every rendered `.dish`; `coverage()` measures how much of it is painted for spread steps.
- State art lives in `assets/states/` (prompts in `design/PROMPTS-gemini-3.md`, packed four to a generation). All eleven friends have drawn expression art (`FRIEND_ART`).
- (Older note) Steps used to be a fixed `STEPS` = prep → add → mix → cook → decorate → serve. Prep shows each ingredient with a `prep` field on the cutting board: `cut` = three swipes (taps only nudge), `crack` = two taps; the art then switches to `INGREDIENTS[x].prepared` for the rest of the recipe.
- Decorating: swatches set both the plate tint and the frosting colour; dragging on the dish draws a frosting stroke on the `#frosting` canvas (`creation.strokes`, redrawn by `paintStrokes()` on the serve screen and stored with the gallery entry). A tap with a topping selected places it; a drag never does.
- Mixing is a drag gesture on the bowl that depends on the tool (`TOOLS[x].motion`): spoon/ladle = circles, whisk = fast back-and-forth, rolling pin = left-right, butter knife = all over. Plain taps still add a little progress so a child who cannot drag yet can finish. Goals live in `MIX_GOAL`.
- Drag ghosts (ingredients, toppings, the finished food) are the picture only, sized to the on-screen source. Keep it that way; a cloned button with its white card looked wrong on the iPad.
- `body` is `position: fixed` and `#app` scrolls internally, which stops iOS Safari's rubber-band bounce; `touchmove` is blocked unless `#app` really overflows. Every screen should fit 390x664 (iPhone with Safari bars) without scrolling.
- Cooking (oven, blender, pan, pot, freezer, toaster) requires holding the appliance itself. Progress pauses immediately on release.
- Friends: `FRIENDS` lists 11 friends with favourite dishes (`likes`) and an `unlock` threshold on `state.served` (total feedings). The first three are always available; the rest appear with a popup as the count grows. The serve screen shows at most `FRIEND_MAX_ON_SCREEN` (4): the ordering friend first, then a random pick of the others. The home friends row shows every unlocked friend in a horizontally scrollable strip (`.friends-row.scroll-x`, edge fades via `more-left/right`); the document-level touchmove blocker skips `.scroll-x` elements. Tapping a friend there speaks its name.
- Orders: `ensureOrder()` keeps one order per day (`state.order = { friend, recipe, date }`) chosen from that friend's favourites; the home friends row shows it as a bubble that starts the recipe. Feeding the ordering friend the ordered dish completes it (`ordersDone`, love reaction, "ตรงใจเลย"). Any other dish is still fine, the order simply stays.
- Reactions: `reactionFor()` picks sneeze (pepper topping) > full (10+ toppings) > love (favourite/ordered) > yum. `react()` swaps in `assets/friends/<id>-<reaction>.png` only when `FRIEND_ART[id]` lists that reaction; otherwise the base portrait plays a CSS animation with floating particles. Prompts for the expression art are in `design/PROMPTS-gemini-2.md`.
- Sound: all effects are synthesized in `js/app.js` (`SFX` one-shots, `LOOPS` for hold steps via `holdMeter({ loop })`, `APPLIANCE_LOOP` maps appliance → loop). No audio files; everything obeys `state.sound`.
- Creations book: `snapshot(dish)` renders the on-screen dish (plate tint, base, clipped paint, bits, toppings, candles) into a 384 px JPEG data URL stored as `photo` on the gallery entry (`GALLERY_MAX` 12). The home strip (`#book`) opens `showBook()`; a card popup offers "make again".
- Paint is clipped to the base picture with a CSS mask (`--mask` on `.dish`, set with an absolute URL because `url()` inside a custom property resolves against the stylesheet).
- Dish art is drawn undecorated; toppings are separate images the child places. Saved creations store toppings as `{ key, x, y }` (older saves used emoji strings and are migrated on load).
- Long presses and drags must not select text, show a copy menu, drag browser images, or zoom the page.
- Decorations can be selected and placed on the food, or dragged to an exact position.
- The finished food can be dragged to multiple friends. Each friend may be fed once per dish.
- Keep Thai and English behavior equivalent.

## Important Files

- `js/app.js`: data tables (`INGREDIENTS`, `TOOLS`, `APPLIANCES`, `RECIPES`), translations, state, audio queue, game steps, touch interactions, feeding animation. Every table key doubles as the PNG file name under `assets/<group>/`, so adding a recipe means adding art files plus one `RECIPES` entry.
- `css/app.css` `.appliance.<name>` rules: position of the food inside each appliance image and the running/finished effects (glow, steam, snow, sparks, toast pop-up). Percentages were measured against the current appliance art; re-measure if the art changes.
- `design/PROMPTS-gemini.md`, `design/cutout.py`, `design/blobs.py`: art pipeline. Raw Gemini output goes in `assets/incoming/` (git-ignored); `cutout.py` routes by file-name prefix (`dish-`, `appliance-`, `ing-`, `tool-`, `top-`).
- `css/app.css`: responsive layout, appliance illustrations, interaction states, and animations.
- `sw.js`: offline cache. Increment the cache version whenever deployed assets change.
- `tests/app.cjs`: Chrome end-to-end coverage for all nine recipes, image loading, responsive layouts, offline mode, drag/drop, hold/pause, decoration, feeding, and legacy-save migration.
- `MEMORY.md`: long-term product decisions.

## Run

Serve the repository over HTTP, then open the local URL in Chrome:

```powershell
python -m http.server 5174 --bind 127.0.0.1
```

Run the browser tests with Playwright available in `NODE_PATH` (on this machine it lives in the Codex runtime bundle):

```powershell
$env:NODE_PATH='C:\Users\KANASIT\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
node tests/app.cjs
```

## Deployment

The `main` branch deploys through GitHub Pages at:

`https://kanasit123-dotcom.github.io/happy-little-kitchen/`

After changing CSS or JavaScript, update the version query in `index.html`, the cache name and file URLs in `sw.js`, run the full tests, commit, push, wait for Pages to build, and test the live URL.

## Prompt For Another AI

Read the project files and preserve the existing child-friendly interaction rules. Make the requested change end to end, update tests for the behavior, verify at 320, 390, 768, and 1280 pixel widths, verify offline mode, and do not remove unrelated working features.
