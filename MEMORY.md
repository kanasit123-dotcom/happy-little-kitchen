# Project Memory

## Purpose

`Happy Little Kitchen` is a separate, open-ended creative game for children. It must remain independent from the lesson game, including its URL, saved data, and deployment.

## Product Rules

- Thai and English are both welcome. Keep a visible language switch.
- Picture-first controls, large touch targets, and short spoken prompts are preferred for children who are still learning to read.
- Never add scores, countdowns, wrong-answer states, advertisements, subscriptions, or pressure to continue.
- Let every spoken prompt finish before advancing to the next prompt or game step.
- Support direct taps and touch dragging on iPad.
- Finished food can be fed to several friends, with each friend accepting one serving per dish.
- Long presses and drags must never trigger browser text selection, image dragging, copy menus, or page zoom.
- Use original visuals and mechanics. Do not copy another children's app's art, brand, characters, or screen layout.
- Keep activities playful and creative, with several valid outcomes.

## Recipes and art (2026-09-17)

Nine recipes: cupcake, pizza, smoothie, omelet, noodle soup, cookie, ice cream, toast, birthday cake. Six appliances: oven, blender, pan, pot, freezer, toaster. Five mixing tools: spoon, whisk, ladle, rolling pin, butter knife. All food, appliance, ingredient, tool and topping art is Gemini-drawn PNG in the kitchen's pastel picture-book style (no faces on food). Emoji are no longer used for game objects; keep new content illustrated the same way via `design/PROMPTS-gemini.md`.

The user generates art in Gemini themselves; the AI writes prompts, cuts backgrounds and integrates. Ideas held in reserve for later recipes: fried rice, popcorn (shaking pot), hot cocoa, donut, rice ball.

## Characters

Preferred friends include the seal, turtle, and rabbit already used here. Avoid adding bears, pigs, hippos, dogs, koalas, or teddy bears.

## Storage

Use the local storage key `happy-little-kitchen-v1`. Keep the legacy key migration so existing saved creations are preserved.
