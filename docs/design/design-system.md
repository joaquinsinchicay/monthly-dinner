# Design System Strategy: The Culinary Editorial (monthly-dinner)

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Maître d'."** 

Unlike standard utility apps that prioritize speed and efficiency at the cost of soul, this app is designed to feel like a high-end dinner party host: sophisticated, attentive, and effortlessly elegant. The goal is to transform the chore of "organizing a dinner" into a premium, editorial experience.

### Design Pillars:
*   **Editorial Authority:** Layouts that mirror premium culinary journals, using asymmetric headers and bold typography.
*   **Soft Minimalism:** A clean, borderless approach that relies on depth and whitespace rather than explicit lines.
*   **Tonal Layering:** Hierarchy is established through subtle shifts in background surfaces, creating a "layered plate" effect.
*   **Latin Warmth:** Visuals and copy that celebrate the communal, recurring ritual of meeting with friends.

---

## 2. Visual Identity & Brand

### Typography
The system uses a high-contrast pairing to balance editorial flair with functional clarity.

*   **Display Header (DM Serif Display):** Used for headlines, titles, and emphasis. It provides the "journal" feel.
    *   *Letter-spacing:* -0.02em for a tighter, more premium look.
    *   *Usage:* Event titles, greetings, and high-level summaries.
*   **Body & UI (DM Sans):** Used for all functional elements, labels, and descriptions.
    *   *Weights:* 400 (Regular), 500 (Medium), 600 (Semi-bold).
    *   *Usage:* Forms, metadata, descriptions, and button labels.

### Type Scale
Concrete sizes used across components. All values in `px` as rendered — translate to `rem` as needed.

| Role | Font | Size | Weight | Letter-spacing | Transform |
|---|---|---|---|---|---|
| Display large | DM Serif Display | 32–40px | 400 | -0.02em | — |
| Display medium | DM Serif Display | 26–28px | 400 | -0.02em | — |
| Display small | DM Serif Display | 20–24px | 400 | -0.02em | italic for subtitles |
| Body medium | DM Sans | 13–14px | 400–500 | 0 | — |
| Body small | DM Sans | 11–12px | 400 | 0 | — |
| Label | DM Sans | 10–11px | 600 | +0.04em to +0.05em | uppercase |

> **Rule:** Labels are always `uppercase` + tight `letter-spacing`. Never use a label size as body copy.
> Display sizes use `italic` only for secondary lines (e.g. restaurant name under event title).

---

### Color Palette
The palette is rooted in soft, warm neutrals with a single, high-contrast primary blue for action and direction.

#### Surfaces
| Token | Hex | Usage |
|---|---|---|
| `surface` | `#fcf9f8` | The "tablecloth" — background for the entire experience |
| `surface_low` | `#f6f3f2` | Section grouping and input field backgrounds |
| `surface_lowest` | `#ffffff` | Actionable cards — the "plates" |
| `surface_high` | `#ede9e8` | Hover states and secondary depth |

#### Brand
| Token | Hex | Usage |
|---|---|---|
| `primary` | `#004ac6` | The color of Direction — active navigation only |
| `primary_container` | `#2563eb` | Main CTAs, progress indicators, gradient endpoint |
| `on_surface` | `#1c1b1b` | Primary text — high contrast |
| `secondary` | `#585f6c` | Secondary text, metadata, labels |

#### Status & Feedback
| Token | Hex | Usage |
|---|---|---|
| `tertiary` | `#006242` | Confirmed attendance, success states |
| `tertiary_fixed` | `#6ffbbe` | Success pill background, live indicator dot |
| `secondary_fixed` | `#dce2f3` | Pending / tal vez pill background |
| `error` | `#ba1a1a` | Declined attendance, errors, danger actions |
| `error_container` | `#ffdad6` | Error pill background |
| `outline_variant` | `#c3c6d7` | Ghost borders — only when accessibility requires it. Use at 20% opacity. |

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

---

## 3. Component Philosophy

### Borderless Depth
Consistent with our "Digital Maître d'" philosophy, **1px borders are strictly forbidden** for separating content. Instead, use:
1.  **Tonal Shifts:** Changing background colors between surface levels.
2.  **Generous Whitespace:** Using spacing to create mental separation.
3.  **Soft Shadows:** `shadow_md` for primary cards.

### Buttons & CTAs
Buttons are always rounded (`border-radius: 9999px`) to feel tactile and friendly.
*   **Primary:** 45-degree gradient from `primary` → `primary_container`. White text. `box-shadow: 0 4px 16px rgba(0,74,198,0.25)`.
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
*   Labels: label size (11px, uppercase, +0.05em tracking), positioned 8px above the field. Never as placeholder.

### Live Indicator
A pulsing dot used for real-time sections (confirmations, active poll).
*   Dot: 8px, `border-radius: 50%`, `background: tertiary`.
*   Pulse ring: `inset: -3px`, `opacity: 0.3`, `animation: ping 1.6–1.8s ease-in-out infinite`.

### Bottom Sheet Logic
For critical mobile interactions (like logging out or confirming an action), the app uses glassmorphism bottom sheets. This provides a physical sense of "overlaying" the menu on the table.
*   `background: rgba(252,249,248,0.88)`
*   `backdrop-filter: blur(16px)`
*   `border-radius: 9999px` on the floating nav pill
*   `border: 1px solid rgba(255,255,255,0.6)` — the one exception to the no-border rule, used only for glassmorphism elements

---

## 4. Epic User Journeys
1.  **The Ritual Entrance:** Login flow with warm imagery and a combined OAuth flow. Maps to E01 (Acceso & Autenticación).
2.  **Clan Management:** Admin-only views for rotation, membership, and invitation links. Maps to E00 (Creación de grupo) and E03 (Turno rotativo).
3.  **The Host's Burden:** Dashboard states that change based on whether you are the organizer (focus on checklist) or a guest (focus on attendance). Maps to E02 (Panel de evento), E04 (Confirmación), E06 (Votación) and E07 (Checklist).
4.  **Culinary Memory:** An asymmetric, editorial list of past restaurants. Maps to E05 (Historial de restaurantes).

---

*monthly-dinner · Design System · Marzo 2026*