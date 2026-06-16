export const config = {
  baseUrl: process.env.BASE_URL || 'https://www.saucedemo.com',
  timeout: {
    default: 30000,
    action: 10000,
    navigation: 30000
  },
  healing: {
    enabled: true,
    maxRetries: 3,
    similarityThreshold: 0.7,
    autoFixSource: true,
    strategies: ['id', 'class', 'text', 'css', 'xpath']
  },
  healthCheck: {
    enabled: true,
    abortOnFailure: false
  },
  reporting: {
    screenshots: true,
    videos: true,
    traces: true,
    healingLogs: true
  },
  ai: {
    enabled: true,
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY || ''
  }
};
