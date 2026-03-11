# 🌐 Enterprise Travel UI System v3.0

## 🏗️ Design Tokens (The "Source of Truth")
- **Spacing Scale:** 8px base (4px, 8px, 16px, 24px, 32px, 48px, 64px). 
- **Border Radius:** 12px for containers; 6px for interactive elements.
- **Typography:** - Primary: 'Inter', system-ui, -apple-system, sans-serif.
  - Weights: Regular (400), Medium (500), Semi-bold (600).
  - Line Height: 1.5 for body; 1.2 for headings.

## 🌗 Smart Theming & Accessibility (A11y)
- **Contrast Ratios:** Must pass WCAG 2.1 Level AA (min 4.5:1).
- **Auto-Theme Logic:**
  - Background is primary anchor. Use `prefers-color-scheme` media queries to allow user-level overrides.
  - For dark backgrounds, use high-legibility white (#FAFAFA) and muted borders (rgba(255,255,255,0.1)).
- **Interactive Elements:** All links must have a visible `:focus` state (2px outline) for keyboard navigation.

	## 📊 Data Visualization (The Trip Table)
	- **Compactness:** Use "Comfortable" density for desktop, "Compact" for mobile.
	- **Header:** Sticky headers (`position: sticky`) so the itinerary day is always visible while scrolling.
	- **Visual Cues:** Use icons (SVG only) next to activity types (e.g., 🍽️ for meals, 🏛️ for museums).

## 📱 Performance & Responsiveness
- **Lazy Loading:** Ensure any images in the MD are exported with `loading="lazy"`.
- **Fluid Layout:** Use CSS Grid for the itinerary layout to allow cards to wrap naturally on smaller screens without breaking the table logic.

## 🔗 Interactive Elements
- **Navigation:** - Desktop only: Fixed sidebar with active-state tracking. Sidebar shall use Auto-Dark Mode
  - Mobile: Horizontal scrollable pill row pinned to top.

## 📱 Universal Sticky Navigation Rules for mobile
- **Positioning:** Use both `position: -webkit-sticky;` and `position: sticky;` for maximum compatibility.
- **Top Offset:** Explicitly set `top: 0;`. To handle phone notches, use `top: env(safe-area-inset-top, 0);`.
- **Z-Index:** Set `z-index: 1000;` to ensure the navigation stays above all other content layers.
- **Layout Integrity (Critical):** Do NOT apply `overflow: hidden`, `overflow: auto`, or `overflow: scroll` to any parent container (like `body` or a main wrapper). Stickiness only works if the scroll happens on the root level.
- **Width:** Ensure the sticky element has `width: 100%;` or is a flex/grid item that spans the full viewport width.