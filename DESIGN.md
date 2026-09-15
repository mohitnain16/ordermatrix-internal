# Ordermatrix — DESIGN.md

## Overview

Ordermatrix is a warm, editorial B2B SaaS interface — not the cool gray-white
every ops/SaaS tool defaults to. The base atmosphere is a **tinted cream
canvas** (`{colors.canvas}` — #F4F1EB). Headlines run **Bricolage
Grotesque** at weight 500–600 with slight negative letter-spacing; body
runs **DM Sans**. The pairing should feel considered and editorial, not
generic-dashboard.

Brand voltage comes from the **cream + coral pairing** — coral
(`{colors.primary}` — #EC6240) is the Ordermatrix accent, used on every
primary CTA, the wordmark, and full-bleed callout cards. Warm coral, never
blue/cyan/purple — that's the counter-positioning against every other
"Shopify app" and generic B2B SaaS blue.

Three surface modes alternate page-by-page:

1. **Cream canvas** (`{colors.canvas}`) — default body floor
2. **Light cream cards** (`{colors.surface-card}`) — feature/content cards
3. **Dark near-black product surfaces** (`{colors.surface-dark}`) —
   dashboard mockups, order-workflow screenshots, pricing feature-tier
   highlight, pre-footer CTA, footer

Dark surfaces are where Ordermatrix shows real product chrome — the
Business Dashboard, Dispatch Queue, order timeline, WhatsApp reply
previews — never abstract marketing illustrations. Cream-to-dark contrast
is the pacing rhythm across the landing page.

**Key characteristics:**

- Warm cream canvas (#F4F1EB) with near-black text (#0B0D10)
- Coral primary CTA (#EC6240) — scarce on buttons, generous on full-bleed callout cards
- Bricolage Grotesque display headlines, DM Sans body — editorial, not corporate-sans
- Dark near-black product mockup cards carrying real dashboard/dispatch/order-timeline screenshots
- Light cream feature cards, one step darker than canvas
- Color-block-first, shadow-rare elevation — depth comes from surface contrast, not drop shadows
- Border radius hierarchical: 8px buttons/inputs, 12px content cards, 16px hero container, pill badges

## Colors

### Brand & Accent

- **Coral / Primary** `{colors.primary}` — #EC6240. Every primary CTA, full-bleed coral callout cards, wordmark accent.
- **Coral Active** `{colors.primary-active}` — #C94E2F. Press/hover-darker.
- **Coral Disabled** `{colors.primary-disabled}` — #E8DDD4.
- **Accent Teal** `{colors.accent-teal}` — #5DB8A6. Sparing use: "active"/live status dots (courier tracking, WhatsApp connected).
- **Accent Amber** `{colors.accent-amber}` — #E8A55A. Category badges, inline highlights.

### Surface

- **Canvas** `{colors.canvas}` — #F4F1EB. Default page floor.
- **Surface Soft** `{colors.surface-soft}` — #EFE9DE. Section dividers, soft bands.
- **Surface Card** `{colors.surface-card}` — #E8E0D2. Feature/content cards.
- **Surface Cream Strong** `{colors.surface-cream-strong}` — #E0D5C0. Selected tabs, emphasized bands.
- **Surface Dark** `{colors.surface-dark}` — #0B0D10. Dashboard mockups, footer.
- **Surface Dark Elevated** `{colors.surface-dark-elevated}` — #181B1F. Elevated cards inside dark bands.
- **Surface Dark Soft** `{colors.surface-dark-soft}` — #131518. Inner panels inside larger dark cards.
- **Hairline** `{colors.hairline}` — #E8DDD4. 1px border on cream surfaces.
- **Hairline Soft** `{colors.hairline-soft}` — #EDE6DB.

### Text

- **Ink** `{colors.ink}` — #0B0D10. Headlines, primary text.
- **Body Strong** `{colors.body-strong}` — #1C1E21.
- **Body** `{colors.body}` — #38393C.
- **Muted** `{colors.muted}` — #6B6A66.
- **Muted Soft** `{colors.muted-soft}` — #8E8B85.
- **On Primary** `{colors.on-primary}` — #FFFFFF. Text on coral buttons.
- **On Dark** `{colors.on-dark}` — #F4F1EB. Cream-tinted white on dark surfaces (echoes canvas).
- **On Dark Soft** `{colors.on-dark-soft}` — #A09D97. Footer body, secondary labels in dark mockups.

### Semantic

- **Success** #5DB872 — order confirmed / delivered / connected states
- **Warning** #D4A017 — pending action, low stock
- **Error** #C64545 — failed payment, RTO, validation errors

## Typography

- **Display**: Bricolage Grotesque, weight 500–600, slight negative tracking (-0.3 to -1px at large sizes). h1/h2/h3, hero, pricing tier price, section heads.
- **Body**: DM Sans, weight 400–500. Body copy, nav, buttons, labels, captions.
- **Mono**: JetBrains Mono (or system mono) for order IDs, tracking numbers, API/webhook payload displays.

| Token               | Size    | Weight | Line Height | Tracking | Use                                   |
| ------------------- | ------- | ------ | ----------- | -------- | ------------------------------------- |
| `display-xl`        | 56–64px | 600    | 1.05        | -1px     | Homepage h1 ("Har order ka logic.")   |
| `display-lg`        | 44px    | 600    | 1.1         | -0.7px   | Section heads                         |
| `display-md`        | 32px    | 500    | 1.15        | -0.4px   | Sub-section heads                     |
| `display-sm`        | 26px    | 500    | 1.2         | -0.2px   | Pricing tier price, callout headlines |
| `title-lg`          | 20px    | 500    | 1.3         | 0        | Pricing plan name                     |
| `title-md`          | 18px    | 500    | 1.4         | 0        | Feature card titles                   |
| `title-sm`          | 16px    | 500    | 1.4         | 0        | Connector/integration tile titles     |
| `body-md`           | 16px    | 400    | 1.55        | 0        | Default running text                  |
| `body-sm`           | 14px    | 400    | 1.55        | 0        | Footer, fine print                    |
| `caption`           | 13px    | 500    | 1.4         | 0        | Badge labels                          |
| `caption-uppercase` | 12px    | 500    | 1.4         | 1.5px    | Category tags, "NEW"/"LIVE" badges    |
| `button`            | 14px    | 500    | 1.0         | 0        | Button labels                         |
| `nav-link`          | 14px    | 500    | 1.4         | 0        | Top-nav menu items                    |

Display stays weight 500–600 (never full bold/800+). Negative tracking at
large sizes is what keeps Bricolage Grotesque from reading generic. Body
stays DM Sans 400/500 only — no font mixing beyond display/body/mono.

## Layout

- **Base unit:** 4px. Tokens: xxs 4 · xs 8 · sm 12 · md 16 · lg 24 · xl 32 · xxl 48 · section 96.
- **Section padding:** 96px (desktop).
- **Card internal padding:** 32px (feature/pricing/dashboard cards), 24px (connector tiles, dashboard-mockup inner panels).
- **Max content width:** ~1200px centered.
- **Feature card grids:** 3-up desktop / 2-up tablet / 1-up mobile — **4-up variant**: use a 2×2 grid at desktop/tablet (never a lopsided 4-1 or 3+1 row), collapsing to 1-up mobile.
- **Connector/integration tile grids:** 4-up or 6-up desktop, 2-up tablet, 1-up mobile.
- **Pricing grid:** up to 4-up desktop (Free/Starter/Growth/Pro), 1-up mobile.

## Elevation

Color-block first, shadow rare. Depth comes from cream-vs-dark surface
contrast, not drop shadows.

| Level              | Treatment                             | Use                          |
| ------------------ | ------------------------------------- | ---------------------------- |
| Flat               | No shadow/border                      | Body sections, top nav, hero |
| Soft hairline      | 1px hairline border                   | Inputs, sub-nav              |
| Cream card         | surface-card bg, no shadow            | Feature/content cards        |
| Dark surface card  | surface-dark bg, no shadow            | Dashboard/dispatch mockups   |
| Subtle drop shadow | `0 1px 3px rgba(11,13,16,0.08)`, rare | Hover-elevated states only   |

## Shapes

| Token          | Value  | Use                                   |
| -------------- | ------ | ------------------------------------- |
| `rounded-xs`   | 4px    | Badge accents                         |
| `rounded-sm`   | 6px    | Small inline buttons, dropdown items  |
| `rounded-md`   | 8px    | CTA buttons, inputs, tabs             |
| `rounded-lg`   | 12px   | Content cards                         |
| `rounded-xl`   | 16px   | Hero illustration/dashboard container |
| `rounded-pill` | 9999px | Badges                                |

## Components

- **`top-nav`** — 64px, cream bg. Wordmark left, menu center-left, "Sign in" text-link + coral `button-primary` ("Start free" / "Try Ordermatrix") right.
- **`button-primary`** — coral bg, white text, 14px/500, 12×20px padding, 40px height, 8px radius. Active → darkens to `primary-active`.
- **`button-secondary`** — cream bg, ink text, 1px hairline border, same sizing as primary.
- **`button-secondary-on-dark`** — surface-dark-elevated bg, on-dark text. Never inverts to light-on-dark.
- **`text-link`** — inline coral link, underline on press.
- **`hero-band`** — cream hero, 6/6 grid: h1 + sub-headline + CTA row left, dashboard mockup or illustration right. 96px vertical padding.
- **`feature-card`** — surface-card bg, 12px radius, 32px padding. Icon + title-md + body-md description. **This is the card type for the homepage's 4-card section — see 4-up grid rule above.**
- **`dashboard-mockup-card-dark`** — surface-dark bg, 12px radius, 32px padding. Shows real product chrome (Business Dashboard, Dispatch Queue, order timeline, WhatsApp reply preview) — never abstract illustration.
- **`pricing-tier-card`** — cream bg, hairline border, 12px radius, 32px padding. Plan name (title-lg), price (display-sm), feature checklist, `button-primary` at bottom.
- **`pricing-tier-card-featured`** — flips to surface-dark bg, on-dark text. Dark surface IS the featured-tier signal (e.g. Growth plan).
- **`callout-card-coral`** — full-bleed coral bg, white text, 12px radius, 48px padding. Inverted (cream/canvas) button style inside.
- **`connector-tile`** — cream bg, hairline border, 12px radius, 20px padding. Logo/icon top, title-sm name, short description. Used for courier/payment/channel integrations grid.
- **`cta-band-coral`** / **`cta-band-dark`** — pre-footer bands, 64px padding, display-sm headline (still Bricolage), sub-line, CTA.
- **`footer`** — surface-dark bg, on-dark-soft text. Multi-column link list, 64px vertical padding. Never inverts.

## Do's and Don'ts

**Do**

- Anchor every page on cream canvas — never pure white.
- Bricolage Grotesque for every display headline; DM Sans body. Slight negative tracking on display.
- Reserve coral for primary CTAs and full-bleed coral callouts.
- Use `dashboard-mockup-card-dark` to show real Ordermatrix product screens, not illustrations.
- Alternate cream-card / dark-mockup bands — that rhythm carries the page.
- 96px between major bands.

**Don't**

- Don't use cool gray or pure white canvas.
- Don't bold display weight past 600.
- Don't use blue/cyan as accent — coral is the only brand voltage.
- Don't repeat the same surface mode in two consecutive bands.
- Don't lay out the 4-card homepage section as 3+1 or any uneven row — 2×2 grid at desktop/tablet.

## Responsive

| Name    | Width       | Key changes                                                                                               |
| ------- | ----------- | --------------------------------------------------------------------------------------------------------- |
| Mobile  | <768px      | Hamburger nav; hero stacks; feature grid 1-up; connector tiles 2-up; pricing 1-up                         |
| Tablet  | 768–1024px  | Feature cards 2-up (4-card section: 2×2); connector tiles 3-up; pricing 2-up                              |
| Desktop | 1024–1440px | Feature cards 3-up generally, but **4-card section stays 2×2**; connector tiles 4–6up; pricing up to 4-up |
| Wide    | >1440px     | Same as desktop, max content width caps at 1200px                                                         |
