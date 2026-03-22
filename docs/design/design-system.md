# Design System Strategy: The Culinary Editorial (monthly-dinner)

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Maître d’."** 

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

### Color Palette
The palette is rooted in soft, warm neutrals with a single, high-contrast primary blue for action and direction.

*   **Surfaces:**
    *   `Surface Base (#fcf9f8)`: The "tablecloth" — the background for the entire experience.
    *   `Surface Low (#f6f3f2)`: Used for section grouping and input fields.
    *   `Surface Lowest (#ffffff)`: Used for actionable cards and "plates."
    *   `Surface High (#ede9e8)`: Used for hover states and secondary depth.
*   **Brand:**
    *   `Primary (#004ac6)`: The color of "Direction." Used for active navigation.
    *   `Primary Container (#2563eb)`: Used for main action buttons and progress indicators.
*   **Status & Feedback:**
    *   `Success (#006242)`: For confirmed attendance and success states.
    *   `Error (#ba1a1a)`: For declines, errors, and the "Danger Zone."
    *   `Warm (#3d2b1f)`: Used for specialized editorial cards (e.g., the "Acta Fundacional").

---

## 3. Component Philosophy

### Borderless Depth
Consistent with our "Digital Maître d’" philosophy, **1px borders are strictly forbidden** for separating content. Instead, use:
1.  **Tonal Shifts:** Changing background colors between surface levels.
2.  **Generous Whitespace:** Using spacing to create mental separation.
3.  **Soft Shadows:** `0 20px 50px -10px rgba(28,27,27,0.13)` for primary cards.

### Buttons & CTAs
Buttons are always rounded (`radius-full`) to feel tactile and friendly.
*   **Primary:** Uses a 45-degree gradient from `Primary` to `Primary Container`.
*   **Secondary:** Uses `Surface High` to blend subtly with the layout.

### Bottom Sheet Logic
For critical mobile interactions (like logging out or confirming an action), the app uses glassmorphism bottom sheets (`backdrop-blur-16px`, `rgba(252,249,248,0.88)`). This provides a physical sense of "overlaying" the menu on the table.

---

## 4. Epic User Journeys
1.  **The Ritual Entrance:** Login flow with warm imagery and a combined OAuth flow.
2.  **Clan Management:** Admin-only views for rotation, membership, and invitation links.
3.  **The Host's Burden:** Dashboard states that change based on whether you are the organizer (focus on checklist) or a guest (focus on attendance).
4.  **Culinary Memory:** An asymmetric, editorial list of past restaurants.