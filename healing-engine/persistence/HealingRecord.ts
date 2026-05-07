export interface HealingRecord {
  id: string;
  testName: string;
  pageName: string;
  originalLocator: string;
  healedLocator: string;
  confidenceScore: number;
  healingMethod: 'similarity' | 'ai' | 'unknown';
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  screenshot?: string;
  domSnapshot?: string;
  url?: string;
  successCount: number;
  lastUsed?: string;
}

export interface HealingRunSummary {
  runId: string;
  timestamp: string;
  totalHealings: number;
  successfulHealings: number;
  failedHealings: number;
  successRate: number;
  pages: Record<string, number>;
  methods: Record<string, number>;
}
