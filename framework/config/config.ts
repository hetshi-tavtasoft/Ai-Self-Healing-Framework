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
  reporting: {
    screenshots: true,
    videos: true,
    traces: true,
    healingLogs: true
  },
  ai: {
    enabled: true,
    provider: 'openai',
    model: 'gpt-4-turbo',
    apiKey: process.env.OPENAI_API_KEY || ''
  }
};
