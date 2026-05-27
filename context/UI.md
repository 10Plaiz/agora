# UI.md

Current-state visual design system. Update values in place, no history, no log.
If a visual decision is architecturally significant, record it in `context/DECISIONS.md`.

## Aesthetic

Direction: Clean, developer-friendly, high-contrast. (TBD based on actual application design)
Reference: N/A

## Tokens

```css
:root {
  --bg:       ;   /* page background */
  --surface:  ;   /* card / panel background */
  --primary:  ;   /* main brand color */
  --accent:   ;   /* highlights, links, decorative */
  --text:     ;   /* primary text */
  --muted:    ;   /* secondary / caption text */
  --border:   ;   /* border / divider */
}
```

## Type

- Font:
- Scale:
- Weight:

## Radius

- Small:
- Medium:
- Full:

## Spacing

- Base unit:
- Scale:

## Rules

<!-- Fill Tokens and Type above before treating these as active constraints. They record decisions made for this project, not defaults for every project. -->

1. **Hero Constraints:** H1 headlines must use wide containers to guarantee they flow in 2-3 lines max. Subtext must be under 20 words. BANNED: Eyebrow badges/pills above the H1 (e.g., 'Now in Public Beta', 'Beta', 'Launch'). Hero top padding must provide enough vertical breathing room under the nav.
2. **Physical Interactions:** Primary buttons must use full-pill shapes. Nest trailing icons (e.g., `->`) in a circular background disc inside the button's right padding. Animate exclusively via transform and opacity using spring physics; no default ease-in-out.
3. **Layout Breakouts:** Ban wrapping every section in the same rigid, centered container. Break the box: use full-bleed sections (e.g., edge-to-edge background dividers or infinite marquees) and asymmetric breakouts while text remains aligned to the baseline.
4. **Readability & Contrast:** Secondary text and ghost CTAs must remain legible. Avoid low-contrast grays that blend into the background. Use opacity-based coloring to guarantee WCAG AA contrast across light and dark modes.
5. **Vertical Grid Alignment:** Multi-column layouts must align items vertically to prevent massive empty voids when one column's content is significantly shorter than the other's.
6. **Display Leading & Tracking:** Large display headers (H1/H2) must use tight line-height and tight tracking to maintain visual cohesion and prevent lines from drifting apart.
