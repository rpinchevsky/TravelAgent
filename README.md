# Budapest Travel Planner

A family-centric trip planning tool that generates detailed itineraries in Markdown and renders them as standalone HTML pages.

## Project Structure

```
Budapest/
├── automation/              # Test automation
│   ├── Code/                # Playwright tests & config
│   ├── TestPlans/           # QA test plans
│   └── Reports/             # Regression HTML reports
├── generated_trips/         # Generated trip output
│   ├── md/                  # Trip itineraries (Markdown)
│   └── html/                # Trip itineraries (HTML)
├── base_layout.html         # HTML template shell
├── rendering_style_config.css  # Design system styles
├── rendering-config.md      # SVG/icon mapping config
├── trip_details.md          # Trip input data (travelers, preferences, dates)
└── CLAUDE.md                # AI agent instructions
```

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- npm (included with Node.js)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/rpinchevsky/TravelAgent.git
   cd TravelAgent
   ```

2. **Install automation dependencies**
   ```bash
   cd automation/code
   npm install
   ```

3. **Install Playwright browsers**
   ```bash
   npx playwright install
   ```

### Running Tests

From the `automation/code/` directory:

```bash
# Run all regression tests
npx playwright test

# Run a specific test file
npx playwright test tests/regression/navigation.spec.ts

# Run tests with UI mode
npx playwright test --ui

# View the last test report
npx playwright show-report
```

Test reports are saved to `automation/Reports/` with the naming convention `automation_report_YYYY-MM-DD_HHmm/`.

### Viewing Trip Output

Open any file from `generated_trips/html/` directly in a browser. The HTML files are fully self-contained and require no server.
