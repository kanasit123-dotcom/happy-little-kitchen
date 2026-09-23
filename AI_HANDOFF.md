# AI Handoff

## Project

Happy Little Kitchen is a bilingual Thai/English cooking game for young children. It is a static PWA built with plain HTML, CSS, and JavaScript. No build step or framework is required.

## Read First

Before changing code, read `README.md`, `MEMORY.md`, `index.html`, `css/app.css`, `js/app.js`, and `tests/app.cjs`.

## Product Rules

- Use picture-first controls and large touch targets for mobile and iPad.
- Do not add scores, countdowns, advertisements, subscriptions, or wrong-answer pressure.
- Exception (2026-09-23), restaurant/market mode only: a non-matching math answer gets a gentle retry and, on the second miss, the guided walkthrough. No red, ✕, sad faces, buzz sounds, miss counters or penalties. See `RESTAURANT-MATH-PLAN.md` section 0 before working on the shop; shop data uses its own key `happy-little-kitchen-shop-v1`.
- Spoken prompts must finish before the next spoken prompt or automatic step transition.
- Ingredients support real drag-and-drop, or tap an ingredient followed by tapping the bowl.
- Each recipe carries its own `steps` list (`RECIPES[x].steps`) that mirrors real cooking. Step types and their renderers live in `RENDERERS` in `js/app.js`: prep (cut/crack), add (drag into bowl/pot/blender), mix (tool gesture), cook (hold appliance), pour (hold the source to tilt), flip (swipe up), move (drag N times: plate, ladle, scoops), dip (hold to blanch), spread (rub until coverage), sprinkle (tap the grater), shape (tap the tray), lid (drag the lid), slice (swipe), candles (place → light → blow), decorate, serve. Art references are `kind:key` strings (`state:` default → `assets/states/`).
- `stage` holds what is on the plate between steps (`base`, `bits`, `slices`, `candles`) and `paint` is an offscreen canvas for sauce/frosting that `syncPaint()` copies into every rendered `.dish`; `coverage()` measures how much of it is painted for spread steps.
- State art lives in `assets/states/` (prompts in `design/PROMPTS-gemini-3.md`, packed four to a generation). All eleven friends have drawn expression art (`FRIEND_ART`).
- (Older note) Steps used to be a fixed `STEPS` = prep → add → mix → cook → decorate → serve. Prep shows each ingredient with a `prep` field on the cutting board: `cut` = three swipes (taps only nudge), `crack` = two taps; the art then switches to `INGREDIENTS[x].prepared` for the rest of the recipe.
- Decorating: swatches set the plate tint. A tap (or a drag that ends on the dish) with a topping selected places it. Sauce pens draw on the paint canvas only for steps with `pens`.
- Mixing is a drag gesture on the bowl that depends on the tool (`TOOLS[x].motion`): spoon/ladle = circles, whisk = fast back-and-forth, rolling pin = left-right, butter knife = all over. Plain taps still add a little progress so a child who cannot drag yet can finish. Goals live in `MIX_GOAL`.
- Drag ghosts (ingredients, toppings, the finished food) are the picture only, sized to the on-screen source. Keep it that way; a cloned button with its white card looked wrong on the iPad.
- `body` is `position: fixed` and `#app` scrolls internally, which stops iOS Safari's rubber-band bounce; `touchmove` is blocked unless `#app` really overflows. Every screen should fit 390x664 (iPhone with Safari bars) without scrolling.
- Cooking (oven, blender, pan, pot, freezer, toaster) requires holding the appliance itself. Progress pauses immediately on release.
- Friends: `FRIENDS` lists 11 friends with favourite dishes (`likes`) and an `unlock` threshold on `state.served` (total feedings). The first three are always available; the rest appear with a popup as the count grows. The serve screen shows at most `FRIEND_MAX_ON_SCREEN` (4): the ordering friend first, then a random pick of the others. The home friends row shows every unlocked friend in a horizontally scrollable strip (`.friends-row.scroll-x`, edge fades via `more-left/right`); the document-level touchmove blocker skips `.scroll-x` elements. Tapping a friend there speaks its name.
- Orders: `ensureOrder()` keeps one order per day (`state.order = { friend, recipe, date }`) chosen from that friend's favourites; the home friends row shows it as a bubble that starts the recipe. Feeding the ordering friend the ordered dish completes it (`ordersDone`, love reaction, "ตรงใจเลย"). Any other dish is still fine, the order simply stays.
- Reactions: `reactionFor()` picks yuck (a topping/ingredient in the friend's `hates`, or burnt) > sneeze (chili/pepper) > love (a `loves` topping, favourite dish or completed order) > full (10+ toppings) > yum. Each friend card shows its first loved (♥) and hated (✕) thing under the portrait; tapping a friend on the home row speaks its likes and dislikes. `yuck` has no drawn face yet (CSS head-shake); the prompt is section C of `design/PROMPTS-gemini-2.md`.
- Parent page: hold the 👪 topbar button on the home screen for 2 s (`bindHold`); it shows stats and hold-to-confirm reset buttons (`showParent`). Nothing there is reachable by a single tap. `react()` swaps in `assets/friends/<id>-<reaction>.png` only when `FRIEND_ART[id]` lists that reaction; otherwise the base portrait plays a CSS animation with floating particles. Prompts for the expression art are in `design/PROMPTS-gemini-2.md`.
- Thai speech is pre-recorded: `design/voice.py` (needs `pip install edge-tts`) collects every Thai string in `js/app.js` (all `th: '…'` values and the `COPY.th` block), renders them with Microsoft Neural `th-TH-PremwadeeNeural` (rate −10 %, pitch +10 Hz — the user chose this voice over Niwat and the iOS Kanya voice) into `assets/voice/th/<md5>.mp3`, writes `manifest.json` (text → file) and fills the `// voice-start … // voice-end` block in `sw.js`. Run it after adding or changing any Thai text, then bump the cache version. At runtime `speak()` in Thai decodes the clips into the same Web Audio context as the sound effects (`voiceBuffer()` cache + `playClips()` buffer sources) — never an `<audio>` element, which switches iOS into media-playback mode and silenced the cooking loops (blender/oven) in v27; composed sentences ("แมวน้ำ ชอบ กุ้ง กับ พริก") are segmented by `clipsFor()` into the longest matching phrases, so every word that can appear in a composed sentence must be its own `th:` string. If no clip set matches (or playback fails) it falls back to the device voice below. English still uses the device voice.
- Decorate step: no finger-drawn frosting any more (the user did not like it). Toppings + plate colour only; drawing is enabled only when the step lists `pens` (omelet ketchup/mayo). The `spread` cooking steps (pizza sauce, butter/jam, cupcake/cake frosting) still use the rub gesture.
- Speech (device voice): `speak()` must set `utterance.voice` explicitly (`findVoice(lang)`, refreshed on `voiceschanged`), because iPhone/iPad Safari ignore `utterance.lang` without a voice and read Thai text with the English voice (silence). The first user touch also speaks a silent warm-up utterance (`unlockAudio`) so iOS allows speech and populates the voice list, and `speak()` waits ~60 ms after a `cancel()` because iOS/Chrome drop an utterance queued right after one.
- Drag ghosts live on `document.body`, outside `#app`. `bindDragChoice` ignores a second finger while a drag is live (a second `pointerdown` used to orphan the first ghost, which then stayed on screen all the way back to the home page on the iPad); `screen()` and `showHome()` call `removeGhosts()` as a safety net.
- Sound: all effects are synthesized in `js/app.js` (`SFX` one-shots, `LOOPS` for hold steps via `holdMeter({ loop })`, `APPLIANCE_LOOP` maps appliance → loop). No audio files; everything obeys `state.sound`.
- Creations book: `snapshot(dish)` renders the on-screen dish (plate tint, base, clipped paint, bits, toppings, candles) into a 384 px JPEG data URL stored as `photo` on the gallery entry (`GALLERY_MAX` 12). The home strip (`#book`) opens `showBook()`; a card popup offers "make again".
- Paint is clipped to the base picture with a CSS mask (`--mask` on `.dish`, set with an absolute URL because `url()` inside a custom property resolves against the stylesheet).
- Free kitchen (`RECIPES.free`, `free: true`): `freeadd` accepts a tap (the item flies into the bowl) or an upward drag; horizontal swipes pan the tray because the items use `touch-action: pan-x` and the browser cancels the pointer when it takes over, `freecook` shows six machine buttons and holds like a cook step with `overhold` (oven/pan/toaster burn after 2.5 s past full — the meter turns coral). The result is a real food chosen by `FREE_RESULT[kind](traits)` from `freeTraits()` (majority taste sweet/savory and colour from `INGREDIENT_TRAITS`), e.g. blender → `drink-<colour>`, freezer → `pop-<colour>` or `ice-block`; all 20 result pictures exist (`FREE_ART`); keys missing from it would fall back to existing dishes. No ingredient icons are placed on the finished food (the child decorates it next). Its decorate step is `nodraw` (toppings + plate colour only) with all `ALL_TOPPINGS` in a scrolling two-row tray (tap-only). Burnt food makes friends sneeze. Prompts for the 20 result foods are in `design/PROMPTS-gemini-4.md`.
- Serve screen layout: `.serve-layout` wraps, so on iPad portrait the four friends drop under the plate instead of overflowing to the right; between 621 and 1100 px the plate is capped at 300 px so iPad landscape keeps plate + four friends side by side. `tests/app.cjs` (`serveFits`) checks 768, 834, 1024 and 1280 px.
- Short phones: `@media (max-width: 620px) and (max-height: 720px)` compacts the home so it fits 390×664 without scrolling — keep that true when adding anything to the home screen.
- Dish art is drawn undecorated; toppings are separate images the child places. Saved creations store toppings as `{ key, x, y }` (older saves used emoji strings and are migrated on load).
- Long presses and drags must not select text, show a copy menu, drag browser images, or zoom the page.
- Decorations can be selected and placed on the food, or dragged to an exact position.
- The finished food can be dragged to multiple friends. Each friend may be fed once per dish.
- Keep Thai and English behavior equivalent.

## Restaurant ("ร้านของหนู", v32)

- Plan and agreed decisions: `RESTAURANT-MATH-PLAN.md` (section 0 first). Code: `js/shop/core.js` (pure logic and settings, no DOM, no localStorage — tested by `node --test "tests/shop/*.test.mjs"`), `js/shop/ui.js` (screens), `css/shop.css`. `app.js` loads the shop with `import("./shop/ui.js" + MODULE_VERSION)` and passes an `api` object (speak, topbar, friendSrc, startRecipe…); `ui.js` imports `core.js` the same way. Every shop module URL must carry the same `?v=` as `app.js` and be listed in `sw.js` exactly like that, because the worker answers from cache first.
- Shop data lives under `happy-little-kitchen-shop-v1` (never inside the kitchen save). A parse error moves the old value to `happy-little-kitchen-shop-broken` and starts a fresh shop with six cookies.
- One order = customer arrives → pick food onto the tray → price → payment → thanks; `order.status` (`arriving`/`picking`/`paying`) is saved after each step so a reload returns to the same customer. The sale is committed once by `core.commitSale()` (idempotency key = `order.id`), which moves stock, the bank (`piggy`) and totals in one write.
- Each order has exactly one checkpoint chosen by level: `count` (level 1), `collect` (level 2), `change` (level 3). A non-matching answer shows `?`/`!` on the customer and a spoken hint; the second one switches to guided mode (numbered tray slots, glowing coins, a number line); 💡 opens guided mode at once. No red, no ✕, nothing taken away.
- Restocking: `startRecipe(id, { destination: 'stock', restockId })`; when the recipe reaches its `serve` step, `finishForStock()` adds one batch (`PRODUCTS[x].batch`, capped at 12 per product, once per `restockId`), saves the photo to the book (`made`++ but not `served`) and offers the way back to the shop.
- Voice: every spoken shop word is a `th: '…'` literal in `js/shop/ui.js`; `design/voice.py` also records 0–100 plus round hundreds/thousands. `tests/shop/voice.test.mjs` fails if any sentence the shop can build is not covered by clips.
- Market (v33): tapping the bank opens the market (`openMarket()` in `ui.js`, `view = 'market'`); `core.makePurchase()` picks the mode by level (`free` / `exact` / `change`, level 3 alternates via `lastPurchaseMode`), `core.marketPurse()` always allows an exact payment, `core.commitPurchase()` moves money once (idempotency key = purchase id) and places the decoration (`decor.placed[id] = id`). Decorations are drawn in the shop by `decorHTML()` at fixed spots per item.
- E2E: `node tests/shop.cjs` (blocks the service worker, turns sound off, uses `tests/fixtures/kitchen-save-v31.json` and checks the kitchen save is untouched).

## Important Files

- `js/app.js`: data tables (`INGREDIENTS`, `TOOLS`, `APPLIANCES`, `RECIPES`), translations, state, audio queue, game steps, touch interactions, feeding animation. Every table key doubles as the PNG file name under `assets/<group>/`, so adding a recipe means adding art files plus one `RECIPES` entry.
- `css/app.css` `.appliance.<name>` rules: position of the food inside each appliance image and the running/finished effects (glow, steam, snow, sparks, toast pop-up). Percentages were measured against the current appliance art; re-measure if the art changes.
- `design/PROMPTS-gemini.md`, `design/cutout.py`, `design/blobs.py`: art pipeline. Raw Gemini output goes in `assets/incoming/` (git-ignored); `cutout.py` routes by file-name prefix (`dish-`, `appliance-`, `ing-`, `tool-`, `top-`).
- `css/app.css`: responsive layout, appliance illustrations, interaction states, and animations.
- `sw.js`: offline cache. Increment the cache version whenever deployed assets change. Navigations are fetched with `cache: 'no-cache'` so GitHub Pages' 10-minute HTTP cache cannot hand back the old `index.html`; the page registers with `updateViaCache: 'none'`, calls `update()` on load and reloads itself when a new worker takes control (immediately on the home screen, otherwise on the next return home).
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
