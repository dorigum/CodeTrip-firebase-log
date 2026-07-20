# Design System: The Daylight Terminal

## 1. Overview & Creative North Star: "The Solar Compiler"
The Creative North Star for this design system is **"The Solar Compiler."** We are moving away from the "hacker in a dark room" cliché and toward the aesthetic of a high-end, daylight-filled architectural studio for engineers. It is an editorial take on developer tools—precise, high-contrast, and unapologetically functional, yet elevated through sophisticated spatial relationships.

This system breaks the "template" look by rejecting the standard 12-column grid in favor of **Intentional Asymmetry.** Layouts should feel like a well-organized code editor: a heavy sidebar, a wide primary stage, and a metadata "gutter." We prioritize "Breathing Room" over density; the whitespace is not empty—it is structural. By using a crisp typography scale and a "Terminal Nomad" spirit, we create an environment that feels like a high-performance instrument.

---

## 2. Colors: Tonal Logic over Line Work
Our palette is rooted in the high-contrast clarity of a premium light-themed IDE. 

### The Palette
- **Primary Stage:** `primary` (#006879) and `primary_container` (#00B8D4) act as our syntax "keyword" accents. Use these for momentum and critical actions.
- **The Warning Loop:** `tertiary` (#B62034) is reserved for "breaking changes" or high-priority alerts, mimicking a compiler error on a white screen.
- **The Canvas:** `background` (#F8F9FB) is our base. It is a cool, clinical white that prevents eye fatigue.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section off the UI. Sectioning must be achieved through **Background Color Shifts**. For example, a navigation sidebar should use `surface_container_low` (#F2F4F6) against the `background` (#F8F9FB) stage. Boundaries are felt through tonal changes, not drawn with lines.

### The "Glass & Gradient" Rule
To prevent the UI from feeling "flat" or "cheap," floating elements (like command palettes or dropdowns) must utilize **Glassmorphism**. Use a semi-transparent `surface_container_lowest` (#FFFFFF) with a 12px-20px backdrop blur. 
*   **Signature Texture:** For primary CTAs or Hero sections, apply a subtle linear gradient from `primary` (#006879) to `primary_container` (#00B8D4) at a 135-degree angle. This provides a "liquid" depth that solid hex codes cannot replicate.

---

## 3. Typography: Editorial Precision
We pair the technical rigidity of **Space Grotesk** with the humanist clarity of **Inter**.

- **Display & Headlines (Space Grotesk):** These are our "Statement" layers. Use `display-lg` (3.5rem) with tight tracking (-0.02em) to create an authoritative, editorial feel. This font represents the "Terminal" in "Terminal Nomad."
- **Titles & Body (Inter):** Inter handles the "Data" layers. It provides high legibility for long-form documentation or code-adjacent strings.
- **Labels (Space Grotesk):** Used for micro-copy and metadata. The monospaced-adjacent feel of Space Grotesk at `label-sm` (0.6875rem) reinforces the developer aesthetic.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are largely banished. We convey hierarchy through **Tonal Stacking**.

### The Layering Principle
Think of the UI as stacked sheets of vellum.
1.  **Level 0 (Base):** `background` (#F8F9FB)
2.  **Level 1 (Sub-section):** `surface_container_low` (#F2F4F6)
3.  **Level 2 (Cards/Modules):** `surface_container_lowest` (#FFFFFF)
4.  **Level 3 (Interactive/Floating):** Glassmorphism (White @ 80% opacity + blur).

### Ambient Shadows
When a floating effect is mandatory (e.g., a Modal), use an **Ambient Shadow**:
- `box-shadow: 0 20px 40px rgba(25, 28, 30, 0.06);`
The shadow is a tinted version of `on_surface`, stretched wide and kept extremely faint to mimic natural daylight.

### The "Ghost Border" Fallback
If contrast testing fails, use a **Ghost Border**: `outline_variant` (#BBC9CD) at 15% opacity. It should be just visible enough to define a shape, never to "contain" it.

---

## 5. Components: The Terminal Primitives

- **Buttons**: 
    - **Primary**: Solid `primary_container` (#00B8D4) with `on_primary_container` (#00444F) text. Minimal roundness (`DEFAULT`: 0.25rem).
    - **Secondary**: A "Ghost" style. No background, only a `primary` text label.
- **Input Fields**: No bottom lines or full boxes. Use a `surface_container_high` (#E6E8EA) background with a `DEFAULT` (0.25rem) corner radius. On focus, shift the background to `surface_container_lowest` (#FFFFFF) with a 1px `primary` ghost border.
- **Cards & Lists**: **Strictly no dividers.** Separate list items using 8px or 12px of vertical white space. For cards, use the shift from `surface_container_low` to `surface_container_lowest`.
- **The "Syntax" Chip**: Use `secondary_container` (#DCE0E7) with `on_secondary_container` (#5E6369) text. These should look like tags in a code editor.
- **Command Palette (Signature Component)**: A floating `surface_container_lowest` module with high backdrop-blur, utilizing `display-sm` for the input text to emphasize the "Terminal" intent.

---

## 6. Do’s and Don’ts

### Do:
- **Do** lean into asymmetry. Place your labels in a "gutter" to the left of your content.
- **Do** use `primary_fixed` (#A8EDFF) for subtle highlights in tables or code blocks; it mimics the "selection" color in a high-end IDE.
- **Do** prioritize `Space Grotesk` for numbers and data points to emphasize the technical nature of the system.

### Don’t:
- **Don't** use 100% black (#000000). Use `on_surface` (#191C1E) for high-contrast text to keep the "Daylight" feel soft.
- **Don't** use rounded corners larger than `lg` (0.5rem). This system is about precision and "engineered" edges.
- **Don't** use standard "drop shadows" on cards. If the card doesn't pop via tonal shift, your background colors are too similar.
- **Don't** use icons with rounded, bubbly ends. Use sharp, linear icon sets (1.5px stroke weight) to match the `Space Grotesk` aesthetic.