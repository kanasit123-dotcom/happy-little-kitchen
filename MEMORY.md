# Project Memory

## Purpose

`Happy Little Kitchen` is a separate, open-ended creative game for children. It must remain independent from the lesson game, including its URL, saved data, and deployment.

## Product Rules

- Thai and English are both welcome. Keep a visible language switch.
- Picture-first controls, large touch targets, and short spoken prompts are preferred for children who are still learning to read.
- Never add scores, countdowns, wrong-answer states, advertisements, subscriptions, or pressure to continue.
  Exception agreed with the user on 2026-09-23, **restaurant and market mode only**: a math answer that does not match may get a gentle retry (soft shake, "ลองนับอีกครั้งนะ", a picture hint; the second miss opens the guided walkthrough). Never a red colour, ✕, sad face, buzz sound, on-screen miss counter, lost money or a changed customer. Everywhere else the original rule stands.
- Let every spoken prompt finish before advancing to the next prompt or game step.
- Support direct taps and touch dragging on iPad and iPhone Safari. Feedback from real play (2026-09-17): no small caps on decorations (topping cap is 30, oldest is replaced), drag ghosts must be picture-only and source-sized, the page must not bounce, and mixing should be a varied gesture rather than repeated tapping.
- Finished food can be fed to several friends, with each friend accepting one serving per dish.
- Long presses and drags must never trigger browser text selection, image dragging, copy menus, or page zoom.
- Use original visuals and mechanics. Do not copy another children's app's art, brand, characters, or screen layout.
- Keep activities playful and creative, with several valid outcomes.

## Recipes and art (2026-09-17)

Nine recipes: cupcake, pizza, smoothie, omelet, noodle soup, cookie, ice cream, toast, birthday cake. Six appliances: oven, blender, pan, pot, freezer, toaster. Five mixing tools: spoon, whisk, ladle, rolling pin, butter knife. All food, appliance, ingredient, tool and topping art is Gemini-drawn PNG in the kitchen's pastel picture-book style (no faces on food). Emoji are no longer used for game objects; keep new content illustrated the same way via `design/PROMPTS-gemini.md`.

The user generates art in Gemini themselves; the AI writes prompts, cuts backgrounds and integrates. Ideas held in reserve for later recipes: fried rice, popcorn (shaking pot), hot cocoa, donut, rice ball.

## Friends, orders and unlocks (2026-09-17)

Market research (Toca Kitchen 2, Dr. Panda Restaurant, Sago Mini) showed the strongest hooks are character reactions and "a friend asks for a dish". The kitchen now has a daily order bubble, four reactions (love / yum / sneeze / full — all positive or funny, never disappointed), and eight extra friends that unlock at 3, 6, 10, 14, 18, 22, 26, 30 feedings. Done 2026-09-18: slicing/cracking prep step, finger-drawn frosting, 10 toppings per recipe (37 topping images), drawn expression art for all eleven friends. 2026-09-18 (later): the user asked for recipes to follow real cooking (more than three ingredients, real step order), so every recipe now has its own step list with new gestures (pour, flip, spread, sprinkle, shape, scoop/ladle, blanch, lid, slice, candles). Keep new recipes in this style: each step is one short gesture with a spoken cue, and every intermediate state has its own picture. Done 2026-09-18 (evening): synthesized sound effects, the creations book with photos, and the free kitchen (sandbox). Feedback from play: sauce must stay on the food (paint is masked to the base picture) and tools should sit next to what they act on (grater at the pizza's corner). Art prompts for all of these are in `design/PROMPTS-gemini-2.md`.

## iPad feedback (2026-09-19, v26)

Real play on the iPad mini found three bugs, all fixed in v26: Thai speech was silent on iPhone and iPad (iOS ignores `utterance.lang` unless `utterance.voice` is set — game-lilly already did this), the serve screen overflowed sideways so not all friends were visible (layout now wraps on tablets), and a finished omelet stayed floating over the home page (a second finger during the feeding drag orphaned the drag ghost). Keep speech voice selection and the ghost sweep when touching those areas.

## v27 (2026-09-19): recorded Thai voice, no finger frosting

The user listened to demos and chose Microsoft Neural **Premwadee** (female) over Niwat and the iOS Kanya voice; all Thai prompts are now shipped as MP3 clips (`design/voice.py`, ~3 MB, cached offline). They also asked to drop finger-drawn frosting in the decorate step ("ตกแต่งปกติก็พอ หรือถ้ามีซอสก็ทาซอส"): decorate = toppings + plate colour, sauce pens only where a recipe has sauce; the spread cooking steps stay. If they later dislike rubbing cream on the cupcake/cake, turn those into a tap-to-frost step.

## Status at hand-off (2026-09-19 evening, live v30)

Session summary (all deployed, `tests/app.cjs` green locally and against the live URL):
- v26 iPad fixes: explicit `utterance.voice` for Thai, serve layout wraps on tablets, no orphaned drag ghost on a two-finger touch.
- v27 recorded Thai speech (Premwadee via `design/voice.py`), decorate step without finger frosting (sauce pens only where a recipe has sauce).
- v28 prep step says only "หั่นแล้ว/แตกแล้ว" (the ingredient name was just spoken).
- v29 clips play through Web Audio, not `<audio>` (an `<audio>` element silenced the cooking loops on iOS).
- v30 clip silence trimmed and stitched words scheduled back-to-back.
Open questions for the user: whether cupcake/cake frosting should become tap-to-frost instead of rubbing; whether any other prompt sounds repetitive. Same voice pipeline now lives in game-lilly (v35) — keep the two `design/voice.py` scripts in step when improving one.

## Status at hand-off (2026-09-19, live v25)

Everything below is deployed at https://kanasit123-dotcom.github.io/happy-little-kitchen/ and covered by `tests/app.cjs` (run it locally and against the live URL after every deploy):

- 9 recipes with real cooking steps (16 step types), 11 friends with drawn faces for love / yum / sneeze / full, likes and dislikes with ♥/✕ badges, daily order bubble, unlocks at 3…30 feedings, free kitchen with 20 real result foods and burnt-if-over-held, creations book with photos, synthesized sound, parent page (hold 👪 2 s) with stats and reset, zoom lock, scrollable friends row, auto-update when a new build is deployed.
- Art pipeline: `design/PROMPTS-gemini*.md` (1–4 all done) + `design/blobs.py` (`--grid`, `--grow`) + `design/cutout.py`. Gemini output goes to `assets/incoming/` (git-ignored). Prompts still unused: section C of `PROMPTS-gemini-2.md` (yuck faces) and the optional new-recipe / plate ideas.
- Open feedback to watch for: whether feeding drags work on the child's iPhone after v23+ (could not reproduce; zoom was the likely cause), whether the longer step lists stay fun for a 5-year-old, and whether the ~200 px free-kitchen result pictures look sharp enough on iPad (ask for the 4×5 sheet at 2K if not).
- Ideas queued but not started: new recipes (popcorn, donut, fried rice, cocoa, rice ball), choose-a-plate step, two-player feeding, progress transfer code between devices, smaller first download (~26 MB).

## Restaurant and market (planned 2026-09-23; shop levels 1–3 + restocking live in v32)

Full plan: `RESTAURANT-MATH-PLAN.md` in this repo (section 0 lists the agreed decisions D1–D5). In short: friends come to a shop counter to buy food the child has cooked; the child picks the items, takes the money and gives change with real coins (1/2/5/10 baht coins, 20-baht note). Each order practises at most one math skill, chosen by level. The price of every sale goes into a coin bank (seal-shaped, never a pig) and the child spends it at a market on shop decorations, where they pay and count the change they get back. Market guardrails: decorations cost 5–20 baht, always on sale, no timed offers, no random boxes, money never goes negative, nothing is lost.

Shop data lives under its own localStorage key `happy-little-kitchen-shop-v1`, never inside `happy-little-kitchen-v1` (`loadState()` drops unknown fields and a parse error there would wipe the gallery). Build order: a small playable slice first (levels 1–3, numbers up to 10, change by counting on with coins), then wait for real-play feedback before porting the column-arithmetic engine from game-lilly. Art prompts: `design/PROMPTS-gemini-5.md` (coins, notes and price tags are drawn blank; the game overlays the numbers).

v32 (2026-09-23) shipped Phases 1+2 together: "ร้านของหนู" card next to the free kitchen, levels 1–3 (count the food / take exact money from the customer's purse / give change by counting on), gentle retries with a guided mode, the seal coin bank, restocking by cooking (the recipe plays as usual, then the batch goes on the shelf and the photo into the book without counting as feeding), shop stats and a clear-shop button on the parent page. Not built yet: the market (Phase 3), the column-arithmetic engine and levels 4–6. Waiting for Lilly's first real play before going further.

## Characters

Preferred friends include the seal, turtle, and rabbit already used here. The unlockable friends (cat, penguin, fox, unicorn, dolphin, butterfly, octopus, squirrel) reuse the game-lilly art, resized to 480 px. Avoid adding bears, pigs, hippos, dogs, koalas, or teddy bears.

## Storage

Use the local storage key `happy-little-kitchen-v1`. Keep the legacy key migration so existing saved creations are preserved.
