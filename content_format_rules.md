# Content & Output Format Rules

## Phase A: High-Level Summary
Provide a table with:
- Day/Date/Area.
- Morning/Lunch/Afternoon summary.
- CEO Audit Status (pass/fail).

*Note: No links or prices in this phase.*

---

## Phase B: Detailed Operational Plan
Provide the full operational breakdown, including:

### 1. Interactive Map Display
- Immediately call the mapping tool to display all locations for the day.
- Provide a direct link to a Google Maps search query or a GeoJSON object containing all 'points of interest'.

### 2. Hourly Table (trip_context.daily_schedule)
- Provide a structured schedule including specific arrival/departure times.
- Include estimated travel times and walking distances between each spot.
- Add brief description for each point we shall visit.

### 3. Universal Location Standards
For **EVERY** location mentioned (attractions, landmarks, parks, and restaurants), you must provide:
- **Google Maps**: A direct link to the specific entrance or pin.
- **Official Website**: A link to the official site (or a reliable primary source like TripAdvisor if no site exists).
- **Photo Gallery**: A link to visual galleries to help the family identify the spot.

### 4. Logistics & Accessibility
- Avoid advising public transport when start point is unknown.
- **Transportation**: Specific public transport lines (bus/tram/metro) or parking name with Google Maps link if a car is used.

### 5. Detailed Operational Data
- **Verified Hours**: Confirmed for the specific dates of the visit.
- **Pricing**: Detailed breakdown (Adults / Children / Family) in both local currency and EUR.
- **Expert Notes**: Mention if pre-booking is required, expected crowd levels, and specific tips for the youngest child in family.

---

## Content Guidelines for Trip Points
- **Point Descriptions:** For every location visited, provide a structured paragraph (approx. 3-4 sentences) that includes:
  1. **The Vibe:** An engaging opening that captures the atmosphere and "feel" of the location.
  2. **The Must-See:** One specific, high-impact detail or hidden corner we shouldn't miss.
  3. **The Family Factor:** Why this spot works specifically for the travelers.
  4. **The Pro-Tip:** One piece of actionable logistics (e.g., "Best visited at 4:00 PM for the lighting"). In HTML output, this maps to `<div class="pro-tip">` — see `rendering-config.md`.
- **Tone:** Evocative yet practical; avoid generic adjectives like 'beautiful' in favor of specific imagery.

---

## Phase Completion Rules
- **Phase B Exit Criteria:** Upon completing Phase B of the trip building, you MUST immediately archive the current state.
- **Naming Convention:** Create a copy of the result file named `generated_trips/md/trip_YYYY-MM-DD_HHmm.md`.
- **Timestamping:** Always run `date +"%Y-%m-%d_%H%M"` via the Bash tool to determine the correct current local time for the filename.
- **Verification:** Confirm the file has been saved before proceeding to any other task or Phase C.

### HTML Export Workflow
- **Trigger:** Whenever I ask to "create an HTML page," "export to HTML," or "generate the web view."
- **Source Selection:** Identify the most recent file matching the pattern `generated_trips/md/trip_YYYY-MM-DD_HHmm.md` (also known as trip.md).
- **Output Filename:** Use the exact same timestamp as the source, resulting in `generated_trips/html/trip_YYYY-MM-DD_HHmm.html` (also known as trip_output.html).
- **Next step:** Follow the **HTML Generation Pipeline** in `rendering-config.md` (Fragment Master Mode) to produce the HTML, then validate per `development_rules.md`.
