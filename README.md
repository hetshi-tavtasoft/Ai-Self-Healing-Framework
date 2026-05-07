# AI Self-Healing Framework

A Playwright-based test automation framework with self-healing capabilities.

## Phase 1: Foundation

This is the initial phase focusing on building a solid automation foundation.

### Tech Stack
- Playwright + TypeScript
- Node.js
- JSON storage (for healing data)

### Project Structure

```
ai-self-healing-framework/
├── framework/           # Core test framework
│   ├── tests/          # Test specs
│   ├── pages/          # Page Object Models
│   ├── fixtures/       # Test fixtures
│   ├── utils/          # Utilities
│   └── config/         # Configuration
├── healing-engine/      # Healing mechanism
│   ├── locator-analyzer/
│   ├── dom-parser/
│   ├── ai-engine/
│   ├── retry-engine/
│   └── similarity-engine/
├── healing-data/        # Healing data storage
├── dashboard/          # Future dashboard
├── infra/             # Infrastructure
└── docs/              # Documentation
```

### Setup

```bash
npm install
npx playwright install
```

### Running Tests

```bash
npm test              # Run all tests
npm run test:headed   # Run with browser visible
npm run test:debug    # Debug mode
npm run test:ui       # UI mode
```

### Next Steps (Phase 2)
- Implement DOM analysis engine
- Build locator healing logic
- Add healing reports
