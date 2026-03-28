# Design System Strategy: The Culinary Editorial (monthly-dinner)

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Maître d'."**

Unlike standard utility apps that feel like spreadsheets, this system is built on the philosophy of high-end editorial layouts—think boutique restaurant menus and architectural digests. It prioritizes hospitality through design: generous white space suggests a "set table," while tonal layering replaces the rigid, "boxed-in" feel of traditional web interfaces.

By utilizing intentional asymmetry, sophisticated serif italics, and glassmorphism, we move away from "app-like" patterns into an experience that feels curated, effortless, and premium. We don't just coordinate dinners; we set the stage for them.

### Design Pillars:
*   **Editorial Authority:** Layouts that mirror premium culinary journals, using asymmetric headers and bold typography.
*   **Soft Minimalism:** A clean, borderless approach that relies on depth and whitespace rather than explicit lines.
*   **Tonal Layering:** Hierarchy is established through subtle shifts in background surfaces, creating a "layered plate" effect.
*   **Latin Warmth:** Visuals and copy that celebrate the communal, recurring ritual of meeting with friends.

---

## 2. Visual Identity & Brand

### Typography
The system uses a high-contrast pairing to balance editorial flair with functional clarity.

*   **Display Header (DM Serif Display):** Used for headlines, titles, and emphasis. Provides the "journal" feel.
    *   *Letter-spacing:* -0.02em for a tighter, more premium look.
    *   *Italics:* Use italic for one emotive word or verb in a headline to create visual interest (e.g., *Next* Dinner). Italic only on secondary lines — never for entire paragraphs.
    *   *Usage:* Event titles, greetings, and high-level summaries.
*   **Body & UI (DM Sans):** Used for all functional elements, labels, and descriptions.
    *   *Weights:* 500 (Medium) for general readability, 600 (Semi-bold) for emphasis. Avoid weight 400 on colored backgrounds to maintain accessibility.
    *   *Usage:* Forms, metadata, descriptions, and button labels.

### Type Scale
Concrete sizes used across components. All values in `px` as rendered — translate to `rem` as needed.

| Role | Font | Size | Weight | Letter-spacing | Transform |
|---|---|---|---|---|---|
| Display large | DM Serif Display | 32–40px | 400 | -0.02em | — |
| Display medium | DM Serif Display | 26–28px | 400 | -0.02em | — |
| Display small | DM Serif Display | 20–24px | 400 | -0.02em | italic for subtitles |
| Body medium | DM Sans | 13–14px | 500 | 0 | — |
| Body small | DM Sans | 11–12px | 400 | 0 | — |
| Label | DM Sans | 10–12px | 600 | +0.04em to +0.05em | uppercase |

> **Rule:** Labels are always `uppercase` + tight `letter-spacing`. Never use a label size as body copy.
> Display sizes use `italic` only for secondary lines or a single emphasis word.

---

### Color Palette
The palette is rooted in soft, warm neutrals that mimic fine linen and ceramics, contrasted by a deep, authoritative "Blueprint Blue."

#### The "No-Line" Rule
**Standard 1px borders are strictly prohibited.** To define sections, use the Spacing Scale (specifically `spacing-8` to `spacing-16`) or background color shifts. A section ends when the color transitions from `surface` (#fcf9f8) to `surface-container-low` (#f6f3f2).

#### Surfaces — hierarchy of layers
Treat the UI as a physical stack of materials.

| Token | Hex | Layer | Usage |
|---|---|---|---|
| `surface` | `#fcf9f8` | Base Layer | The "tablecloth" — background for the entire experience |
| `surface_low` | `#f6f3f2` | Sectional Layer | Section grouping, input field backgrounds, de-prioritized content |
| `surface_lowest` | `#ffffff` | Action Layer | Actionable cards — the "plates" that float above the base |
| `surface_high` | `#ede9e8` | Interaction Layer | Hover states, secondary depth, subsets of content |

#### Brand
| Token | Hex | Usage |
|---|---|---|
| `primary` | `#004ac6` | The color of Direction — active navigation only |
| `primary_container` | `#2563eb` | Main CTAs, progress indicators, gradient endpoint |
| `on_surface` | `#1c1b1b` | Primary text — high contrast. Never use pure #000000 |
| `secondary` | `#585f6c` | Secondary text, metadata, labels |

#### Status & Feedback
| Token | Hex | Usage |
|---|---|---|
| `tertiary` | `#006242` | Confirmed attendance, success states |
| `tertiary_fixed` | `#6ffbbe` | Success pill background, live indicator dot |
| `secondary_fixed` | `#dce2f3` | Pending / tal vez pill background |
| `error` | `#ba1a1a` | Declined attendance, errors, danger actions |
| `error_container` | `#ffdad6` | Error pill background |
| `outline_variant` | `#c3c6d7` | Ghost borders — only when accessibility requires it. Use at 15% opacity. |

#### Editorial
| Token | Hex | Usage |
|---|---|---|
| `warm` | `#3d2b1f` | Specialized editorial cards (e.g. "Acta Fundacional") |
| `warm_accent` | `#a8896a` | Secondary text on warm backgrounds |

#### Shadows
| Name | Value | Usage |
|---|---|---|
| `shadow` | `0px 10px 30px -5px rgba(28,27,27,0.07)` | Default card elevation |
| `shadow_md` | `0px 20px 50px -10px rgba(28,27,27,0.13)` | Primary cards, modals, focused elements |

> Shadow tint uses `on_surface` (#1c1b1b) so it reads as a natural warm shadow, not a gray smudge.

---

## 3. Elevation & Depth

We eschew the "Material Design" shadow-everywhere approach in favor of **Tonal Layering.**

*   **The Layering Principle:** Place a `surface_lowest` (#ffffff) card directly onto a `surface_low` (#f6f3f2) background. The subtle 2% contrast difference creates a sophisticated, quiet elevation without shadows.
*   **Ambient Shadows:** Reserve `shadow_md` only for elements that require significant "lift" — the main Dinner Invite Card, modals, focused elements.
*   **The Ghost Border:** If a boundary is required for accessibility (e.g., an input field), use `outline_variant` (#c3c6d7) at **15% opacity**. It should be felt, not seen.

---

## 4. Component Philosophy

### Borderless Depth
Consistent with our "Digital Maître d'" philosophy, **1px borders are strictly forbidden** for separating content. Instead, use:
1.  **Tonal Shifts:** Changing background colors between surface levels.
2.  **Generous Whitespace:** `spacing-8` to `spacing-16` for top-level page margins.
3.  **Soft Shadows:** `shadow_md` only for primary cards.

### Buttons & CTAs
Buttons are always fully rounded (`border-radius: 9999px`) to feel tactile and friendly.
*   **Primary:** 135° linear gradient from `primary` (#004ac6) → `primary_container` (#2563eb). White text, DM Sans 600. No shadow on the button itself — the gradient provides perceived volume.
*   **Secondary:** `surface_high` background. `on_surface` text. No border.
*   **Ghost / Tertiary:** Plain text in `primary`. No box, no border.

### Status Pills
Attendance and poll states are rendered as pills (`border-radius: 9999px`, `padding: 3px 10px`).

| State | Background | Text color |
|---|---|---|
| Va / Confirmed | `tertiary_fixed` (`#6ffbbe`) | `tertiary` (`#006242`) |
| Tal vez / Pending | `secondary_fixed` (`#dce2f3`) | `#3d4663` |
| No va / Declined | `error_container` (`#ffdad6`) | `error` (`#ba1a1a`) |
| Sin respuesta | `surface_high` (`#ede9e8`) | `outline_variant` (`#c3c6d7`) |

### Input Fields
*   Background: `surface_low`. No border at rest.
*   Focus: `2px solid primary`.
*   Labels: label size (11–12px, uppercase, +0.05em tracking), positioned 8px above the field. Never as placeholder.

### Narrative Cards
*   **No divider lines.** Content within cards is separated by `spacing-4` (1.4rem) of white space.
*   **Radius:** `20px`.
*   **Asymmetric padding:** Larger top padding (`spacing-8`) than bottom (`spacing-6`) to give content breathing room.
*   **Surface:** `surface_lowest` (#ffffff) on a `surface_low` background for quiet elevation.

### Live Indicator
A pulsing dot used for real-time sections (confirmations, active poll).
*   Dot: 8px, `border-radius: 50%`, `background: tertiary` (#006242).
*   Pulse ring: `inset: -3px`, `opacity: 0.3`, `animation: ping 1.6–1.8s ease-in-out infinite`, extending ~4px outward.
*   Usage: next to "Cena en curso" or "Votación abierta."

### Floating Navigation (Glass Bottom Nav)
*   **Shape:** Floating pill — `border-radius: xl`.
*   **Surface:** `rgba(252,249,248,0.88)` + `backdrop-filter: blur(16px)`.
*   **Active state:** A subtle `primary` dot below the icon. Never a background fill.
*   `border: 1px solid rgba(255,255,255,0.6)` — the one exception to the no-border rule, used exclusively for glassmorphism elements.

---

## 5. Spacing Scale (reference)

| Token | Value | Typical use |
|---|---|---|
| `spacing-4` | ~1rem | Card internal section separation |
| `spacing-6` | ~1.5rem | Card bottom padding |
| `spacing-8` | ~2rem | Card top padding, section breaks |
| `spacing-12` | ~3rem | Page section margins |
| `spacing-16` | ~4rem | Top-level page margins |

> **Rule:** Lean into `spacing-12` and `spacing-16` for top-level page margins to maintain the premium feel.

---

## 6. Do's and Don'ts

| ✅ DO | ❌ DON'T |
|---|---|
| Use `DM Serif Display Italic` for one word in a headline to create visual interest | Use dividers (`<hr>`) — use tonal background shifts instead |
| Use `surface_low` to wrap "suggested" or "past" content to visually de-prioritize it | Use 1px borders to separate list items |
| Add 25% more space than seems sufficient — lean into `spacing-12` and `spacing-16` | Use pure black (#000000) — always use `on_surface` (#1c1b1b) |
| Mobile-first with sheets that slide up from the bottom (glassmorphism), not centered modals | Use `primary` blue for static headers or decorative elements |
| Use asymmetry — display title left, date label right | Use square corners — everything should be softened via `lg` or `full` radius |

---

## 7. Epic User Journeys
1.  **The Ritual Entrance:** Login flow with warm imagery and a combined OAuth flow. Maps to E01 (Acceso & Autenticación).
2.  **Clan Management:** Admin-only views for rotation, membership, and invitation links. Maps to E00 (Creación de grupo) and E03 (Turno rotativo).
3.  **The Host's Burden:** Dashboard states that change based on whether you are the organizer (focus on checklist) or a guest (focus on attendance). Maps to E02 (Panel de evento), E04 (Confirmación), E06 (Votación) and E07 (Checklist).
4.  **Culinary Memory:** An asymmetric, editorial list of past restaurants. Maps to E05 (Historial de restaurantes).

---

*monthly-dinner · Design System · Marzo 2026*
