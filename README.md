# 🚀 AI Self-Healing Framework

A Playwright-based test automation framework with an intelligent self-healing engine that automatically detects and fixes broken locators during test execution. When UI changes cause element selectors to fail, the healing engine analyzes the DOM, scores alternative locators via similarity algorithms and optional OpenAI GPT suggestions, validates replacements, caches them for future runs, and can even auto-fix page object source files.

## Features

- **Self-Healing Engine** — Automatically detects locator failures, parses the live DOM, finds alternative elements, scores candidates using string similarity (ID/class/text/tag), and retries with the best match
- **AI-Powered Healing (Optional)** — Integrates with OpenAI GPT to suggest intelligent locator repairs based on error context and DOM structure
- **Auto-Fix Source Files** — Automatically rewrites page object `.ts` files with healed locators so fixes persist permanently
- **Page Object Model** — Clean, typed page object classes with transparent healing injection through `BasePage`
- **Monitoring Dashboard** — React + Express dashboard visualizing healing history, success rates, flaky locators, and per-page statistics
- **Dockerized** — Full orchestration via Docker Compose: test runner, API backend, and frontend SPA
- **Comprehensive Reporting** — Playwright HTML/JSON reporters, screenshots on failure, video retention, and trace viewing

## Architecture

```
ai-self-healing-framework/
├── framework/                    # Core test framework
│   ├── config/
│   │   └── config.ts             # Central configuration (timeouts, healing, AI provider)
│   ├── fixtures/
│   │   ├── constant.ts           # UI text constants for SauceDemo assertions
│   │   └── pageFixtures.ts       # Playwright custom fixtures with page object injection
│   ├── pages/
│   │   ├── BasePage.ts           # Abstract base with healing-enabled wrappers (click, fill, etc.)
│   │   ├── login/loginPage.ts
│   │   ├── products/productsPage.ts
│   │   ├── yourCart/yourCartPage.ts
│   │   ├── checkout/checkoutInformationPage.ts
│   │   ├── checkout/checkoutOverviewPage.ts
│   │   └── checkout/checkoutCompletePage.ts
│   ├── tests/
│   │   └── e2eTest.spec.ts       # Full purchase E2E flow: login → sort → cart → checkout → verify
│   └── utils/
│       ├── logger.ts             # Singleton logger (INFO, WARN, ERROR, DEBUG)
│       ├── locatorHelper.ts      # Locator utility wrapper
│       ├── locatorHealthChecker.ts # Pre-flight locator validation (reads page classes)
│       ├── testData/testData.ts  # Static SauceDemo credentials
│       └── dataFactory/userData.ts # Faker-generated checkout data
├── healing-engine/                # Self-healing system
│   ├── retry-engine/
│   │   └── RetryEngine.ts        # Central orchestrator — cache check, retries, healing pipeline, auto-fix
│   ├── locator-analyzer/
│   │   └── LocatorAnalyzer.ts    # Captures failure details and DOM snapshots
│   ├── dom-parser/
│   │   └── DomParser.ts          # Parses DOM with cheerio, extracts candidates and locators
│   ├── similarity-engine/
│   │   └── SimilarityEngine.ts   # Scores candidates (ID 40%, class 30%, text 20%, tag 10%)
│   ├── ai-engine/
│   │   └── AIEngine.ts           # OpenAI GPT integration for AI-suggested locators
│   └── healing-validator/
│       └── HealingValidator.ts   # Validates healed locators (exists, visible, unique, clickable)
├── dashboard/
│   ├── backend/                  # Express REST API serving healing data (port 3000)
│   └── frontend/                 # React + Vite + Tailwind + Recharts SPA (port 5173)
├── healing-data/                  # Runtime data (healed locators, snapshots, history)
├── playwright-report/             # Generated HTML/JSON test reports
├── test-results/                  # Test run artifacts (screenshots, videos, traces)
├── global-setup.ts                # Pre-test setup: clears history + runs locator health check
├── docker-compose.yml             # 3-service orchestration
├── Dockerfile                     # Test runner container (mcr.microsoft.com/playwright)
├── playwright.config.ts           # Playwright config (Chromium, Firefox, WebKit)
├── tsconfig.json                  # TypeScript strict config with path aliases
└── package.json                   # Dependencies: playwright, cheerio, openai, string-similarity, faker
```

> **Locator discovery:** Each page object exposes its locators via a `static locators` property (e.g., `LoginPage.locators`). The health checker reads this property directly — locators live only in the page objects, with zero duplication.

### How Healing Works

```
Action fails (click, fill, etc.)
  → Retry original locator up to maxRetries times
  → If all retries fail, trigger healing pipeline:
      1. LocatorAnalyzer captures failure details + DOM snapshot
      2. DomParser finds the failed element in the DOM
      3. If found → SimilarityEngine scores candidates (ID/class/text/tag)
      4. If NOT found → SimilarityEngine uses string-similarity on all DOM elements
      5. HealingValidator checks best candidate (exists, visible, unique, clickable)
      6. [Optional] If similarity fails → AIEngine asks GPT for a suggestion
      7. Auto-fix page object source file with new locator
  → Retry action with healed locator
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Test Runner | Playwright + TypeScript |
| DOM Parsing | cheerio |
| Similarity Scoring | string-similarity + Levenshtein distance |
| AI Engine | OpenAI GPT (optional) |
| Dashboard API | Express.js + TypeScript |
| Dashboard UI | React 19 + Vite + Tailwind CSS 4 + Recharts |
| Containerization | Docker / Docker Compose |
| Test Data | @faker-js/faker |

## Getting Started

### Prerequisites

- Node.js >= 20
- npm

### Setup

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Configuration

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

> **Note:** AI-powered healing is optional. The framework works without it using the local similarity engine.

Key settings in `framework/config/config.ts`:

| Setting | Default | Description |
|---------|---------|-------------|
| `healing.enabled` | `true` | Enable/disable healing engine |
| `healing.maxRetries` | `3` | Max retry attempts per locator before healing |
| `healing.similarityThreshold` | `0.7` | Minimum similarity score (0-1) |
| `healing.strategies` | `['id', 'class', 'text', 'css', 'xpath']` | Locator types to try during healing |
| `healing.autoFixSource` | `true` | Auto-rewrite page object `.ts` files with healed locators |
| `healthCheck.enabled` | `true` | Enable pre-flight locator validation before tests |
| `healthCheck.abortOnFailure` | `false` | Abort test run if locators are broken (default: warn and continue) |
| `ai.enabled` | `true` | Enable AI-powered healing fallback |
| `ai.provider` | `'openai'` | AI provider |
| `ai.model` | `'gpt-4-turbo'` | AI model for locator suggestions |
| `baseUrl` | `https://www.saucedemo.com` | Target application URL |

### Running Tests

```bash
npm test               # Run all tests (headless)
npm run test:headed    # Run with visible browser
npm run test:debug     # Debug mode (Playwright Inspector)
npm run test:ui        # UI mode (Playwright Trace Viewer)
```

### Docker

```bash
docker-compose up --build
```

This starts three services:

| Service | Port | Description |
|---------|------|-------------|
| `framework` | — | Runs tests with healing engine |
| `backend` | `3000` | Express REST API |
| `frontend` | `5173` (maps to `:80`) | React monitoring dashboard |

## Healing Pipeline Details

The healing engine scores candidate locators using four weighted criteria:

| Criterion | Weight | Description |
|-----------|--------|-------------|
| ID Match | 40% | Exact or partial ID attribute match |
| Class Match | 30% | Average similarity across all CSS classes |
| Text Match | 20% | Visible text content similarity |
| Tag Match | 10% | Same HTML tag type |

When the failed element cannot be found in the DOM at all (e.g., the page structure changed completely), the engine falls back to a global string similarity search across all DOM elements.

## Dashboard API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `GET /api/healings` | All healing records (sorted newest-first) |
| `GET /api/healings/summary` | Aggregate statistics (total, success rate, per-page, per-method) |
| `GET /api/healings/flaky?threshold=10` | Flaky locator report |
| `GET /api/runs` | All test run IDs |
| `GET /api/runs/:runId` | Specific run details and healing records |

## Project Status

Fully functional with the complete healing pipeline implemented. The `healing-data/` directory is populated at runtime during test execution. The dashboard auto-polls every 5 seconds for real-time visibility into healing events and test run history. The auto-fix source feature permanently corrects broken locators in page object files.
