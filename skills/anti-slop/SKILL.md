---
name: anti-slop
description: Behavioral design guardrails to prevent generic AI UI defaults.
---

# Anti-Slop Design Guardrails

You are assisting with frontend development. Standard AI models possess statistical biases that result in generic, templated UI (often called "AI slop"). When generating or modifying UI code, you must aggressively avoid these defaults.

## 1. The "Absolute Zero" Bans
If your generated code includes ANY of the following, it is considered a failure:
* **Em-dashes (`—` or `–`):** Completely banned in headlines, labels, body copy, and button text. Use a period, a comma, or a regular hyphen.
* **Banned Fonts:** Do not default to `Inter`, `Roboto`, or `Arial`. Assume the project uses premium fonts (like `Geist`, `Cabinet Grotesk`, or `Satoshi`) unless `context/UI.md` specifies otherwise.
* **Banned Colors:** No default AI purple/blue glowing gradients. No pure black (`#000000`). Use off-black (e.g., `zinc-950`) and neutral backgrounds with a single locked accent color.
* **Cheap Meta-Labels:** Do not use decorative status dots or cheap eyebrows like "SECTION 01", "ABOUT US", or "QUESTION 05". Use plain language.

## 2. Layout & Spacing Discipline
* **Hero Restraint:** Never generate a 6-line wrapped H1. Headlines must breathe. Keep them to 2-3 lines maximum by using wide containers.
* **Gapless Grids:** When building bento grids, there must be zero empty spaces. Interlock cells perfectly and use `grid-flow-dense`.
* **Break the Box:** Do not wrap every section in the same rigid, centered container. Use full-bleed breakouts or asymmetrical layouts to create visual tension.

## 3. Physicality & Interaction
* **Nested Architecture (Double-Bezel):** Never place a card flatly on a background. Use nested enclosures (an inner core inside an outer shell) with mathematically concentric border radii.
* **Motion Physics:** Never use default `linear` or `ease-in-out` transitions. Animate exclusively via `transform` and `opacity` using spring physics to simulate physical mass.
