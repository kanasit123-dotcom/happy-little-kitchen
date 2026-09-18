# Project Memory

## Purpose

`Happy Little Kitchen` is a separate, open-ended creative game for children. It must remain independent from the lesson game, including its URL, saved data, and deployment.

## Product Rules

- Thai and English are both welcome. Keep a visible language switch.
- Picture-first controls, large touch targets, and short spoken prompts are preferred for children who are still learning to read.
- Never add scores, countdowns, wrong-answer states, advertisements, subscriptions, or pressure to continue.
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

Market research (Toca Kitchen 2, Dr. Panda Restaurant, Sago Mini) showed the strongest hooks are character reactions and "a friend asks for a dish". The kitchen now has a daily order bubble, four reactions (love / yum / sneeze / full — all positive or funny, never disappointed), and eight extra friends that unlock at 3, 6, 10, 14, 18, 22, 26, 30 feedings. Done 2026-09-18: slicing/cracking prep step, finger-drawn frosting, 10 toppings per recipe (37 topping images), drawn expression art for seal/turtle/rabbit (the other eight friends still use CSS motion; prompts for them are section B of `design/PROMPTS-gemini-2.md`). Still planned: sandbox "mystery dish" mode (plate/bowl/glass art is already in `assets/dishes/`), sound effects. Art prompts for all of these are in `design/PROMPTS-gemini-2.md`.

## Characters

Preferred friends include the seal, turtle, and rabbit already used here. The unlockable friends (cat, penguin, fox, unicorn, dolphin, butterfly, octopus, squirrel) reuse the game-lilly art, resized to 480 px. Avoid adding bears, pigs, hippos, dogs, koalas, or teddy bears.

## Storage

Use the local storage key `happy-little-kitchen-v1`. Keep the legacy key migration so existing saved creations are preserved.
