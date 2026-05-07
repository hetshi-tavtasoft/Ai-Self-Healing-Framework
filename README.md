# AI Self-Healing Framework

A Playwright-based test automation framework with an intelligent self-healing engine that automatically detects and fixes broken locators during test execution. When UI changes cause element selectors to fail, the healing engine analyzes the DOM, scores alternative locators via similarity algorithms and optional OpenAI GPT suggestions, validates replacements, and caches them for future runs.

## Features

- **Self-Healing Engine** — Automatically detects locator failures, parses the live DOM, finds alternative elements, scores candidates using string similarity analysis, and retries with the best match
- **AI-Powered Healing (Optional)** — Integrates with OpenAI GPT to suggest intelligent locator repairs based on error context and DOM structure
- **Page Object Model** — Clean, typed page object classes with transparent healing injection through `BasePage`
- **Monitoring Dashboard** — React + Express dashboard visualizing healing history, success rates, flaky locators, and per-page statistics
- **Dockerized** — Full orchestration via Docker Compose: test runner, API backend, and frontend SPA
- **Comprehensive Reporting** — Playwright HTML/JSON reporters, screenshots on failure, video retention, and trace viewing

## Architecture

```
ai-self-healing-framework/
├── framework/               # Core test framework
│   ├── config/              # Central configuration (timeouts, healing settings, AI provider)
│   ├── fixtures/            # Playwright fixtures & UI constants
│   ├── pages/               # Page Object Models (BasePage with healing integration)
│   ├── tests/               # Test specs (E2E flow + healing demo)
│   └── utils/               # Logger, locator helpers, test data factories
├── healing-engine/           # Self-healing system
│   ├── retry-engine/        # Central orchestrator — tries original locator, triggers healing on failure
│   ├── locator-analyzer/    # Captures failure details and DOM snapshots
│   ├── dom-parser/          # Parses DOM with cheerio, extracts candidates
│   ├── similarity-engine/   # Scores candidates (ID, class, text, tag) with string-similarity
│   ├── healing-validator/   # Validates healed locators (exists, visible, unique, clickable)
│   ├── ai-engine/           # OpenAI GPT integration for AI-suggested locators
│   ├── healing-storage/     # JSON file-based persistence for healed/failed locators
│   └── persistence/         # Run history, summary stats, flaky detection
├── dashboard/
│   ├── backend/             # Express REST API serving healing data
│   └── frontend/            # React SPA with charts and healing record tables
├── healing-data/            # Runtime data (healed locators, snapshots, history)
├── playwright-report/       # Generated HTML/JSON test reports
└── test-results/            # Test run artifacts (screenshots, videos, traces)
```

### How Healing Works

```
Action fails
  → Check cache for previously healed locators
  → Capture failure details + DOM snapshot
  → Parse DOM with cheerio → find similar elements
  → Score candidates with string-similarity (ID 40%, class 30%, text 20%, tag 10%)
  → [Optional] Ask GPT for AI-suggested repair
  → Validate best candidate (exists, visible, unique, clickable)
  → Store healed locator for future use
  → Retry the action with healed locator
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Test Runner | Playwright + TypeScript |
| DOM Parsing | cheerio |
| Similarity Scoring | string-similarity |
| AI Engine | OpenAI GPT (optional) |
| Dashboard API | Express.js + TypeScript |
| Dashboard UI | React + Vite + Recharts |
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
| `healing.maxRetries` | `3` | Max retry attempts per locator |
| `healing.similarityThreshold` | `0.6` | Minimum similarity score (0-1) |
| `healing.strategies` | `['similarity']` | Healing strategies: `similarity`, `ai` |
| `ai.provider` | `'openai'` | AI provider |
| `ai.model` | `'gpt-4'` | AI model for locator suggestions |

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
| `self-healing-framework` | — | Runs tests with healing engine |
| `healing-backend` | `3000` | Express REST API |
| `healing-frontend` | `5173` | React monitoring dashboard |

## Test Structure

- **Page Object Model** — All page interactions inherit from `BasePage`, which wraps Playwright actions through the `RetryEngine` for transparent healing
- **Custom Fixtures** — Playwright fixtures inject page objects directly into test specs
- **Test Data** — Static credentials for SauceDemo + dynamic Faker-generated checkout data

### Test Files

| File | Description |
|------|-------------|
| `framework/tests/e2eTest.spec.ts` | Full purchase E2E flow: login → sort → add to cart → checkout → verify |
| `framework/tests/healingDemo.spec.ts` | Demonstration of healing engine with intentionally broken locators |

## Dashboard API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `GET /api/healings` | All healing records |
| `GET /api/healings/summary` | Aggregate statistics |
| `GET /api/healings/flaky` | Flaky locator report |
| `GET /api/runs` | All test runs |
| `GET /api/runs/:runId` | Specific run details |

## Project Status

The framework is fully functional with the healing pipeline implemented. The `healing-data/` directory is populated at runtime during test execution. The dashboard provides real-time visibility into healing events and test run history.
