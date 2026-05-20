import * as fs from 'fs';
import * as path from 'path';
import { HealingRecord, HealingRunSummary } from './HealingRecord';

export class HealingPersistence {
  private static instance: HealingPersistence;
  private healingDataDir: string;
  private currentRunId: string;

  private constructor() {
    this.healingDataDir = path.resolve(__dirname, '../../healing-data');
    this.currentRunId = `run-${Date.now()}`;
    this.ensureDirectories();
  }

  static getInstance(): HealingPersistence {
    if (!HealingPersistence.instance) {
      HealingPersistence.instance = new HealingPersistence();
    }
    return HealingPersistence.instance;
  }

  private ensureDirectories(): void {
    const dirs = [
      path.join(this.healingDataDir, 'healing-history'),
      path.join(this.healingDataDir, 'screenshots'),
      path.join(this.healingDataDir, 'dom-snapshots')
    ];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async saveHealingRecord(record: HealingRecord): Promise<void> {
    const runFile = this.getCurrentRunFile();
    let records: HealingRecord[] = [];

    if (fs.existsSync(runFile)) {
      try {
        const data = fs.readFileSync(runFile, 'utf-8');
        records = JSON.parse(data) as HealingRecord[];
      } catch {
        records = [];
      }
    }

    records.push(record);
    fs.writeFileSync(runFile, JSON.stringify(records, null, 2));
  }

  async saveHealingWithScreenshot(
    record: HealingRecord,
    page: any
  ): Promise<void> {
    if (page && record.status === 'failed') {
      try {
        const screenshotPath = path.join(
          this.healingDataDir,
          'screenshots',
          `${record.id}.png`
        );
        await page.screenshot({ path: screenshotPath, fullPage: true });
        record.screenshot = screenshotPath;
      } catch (error) {
        console.error('Failed to capture screenshot:', error);
      }
    }

    await this.saveHealingRecord(record);
  }

  getHealingHistory(): HealingRecord[] {
    const historyDir = path.join(this.healingDataDir, 'healing-history');
    if (!fs.existsSync(historyDir)) {
      return [];
    }

    const files = fs.readdirSync(historyDir).filter(f => f.endsWith('.json'));
    let allRecords: HealingRecord[] = [];

    files.forEach(file => {
      try {
        const data = fs.readFileSync(path.join(historyDir, file), 'utf-8');
        const records = JSON.parse(data) as HealingRecord[];
        allRecords = allRecords.concat(records);
      } catch {
        // Skip invalid files
      }
    });

    return allRecords.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  getRunSummary(): HealingRunSummary | null {
    const runFile = this.getCurrentRunFile();
    if (!fs.existsSync(runFile)) {
      return null;
    }

    try {
      const records = JSON.parse(fs.readFileSync(runFile, 'utf-8')) as HealingRecord[];
      const summary: HealingRunSummary = {
        runId: this.currentRunId,
        timestamp: new Date().toISOString(),
        totalHealings: records.length,
        successfulHealings: records.filter(r => r.status === 'success').length,
        failedHealings: records.filter(r => r.status === 'failed').length,
        successRate: 0,
        pages: {},
        methods: {}
      };

      summary.successRate = summary.totalHealings > 0
        ? (summary.successfulHealings / summary.totalHealings) * 100
        : 0;

      records.forEach(r => {
        summary.pages[r.pageName] = (summary.pages[r.pageName] || 0) + 1;
        summary.methods[r.healingMethod] = (summary.methods[r.healingMethod] || 0) + 1;
      });

      return summary;
    } catch {
      return null;
    }
  }

  private getCurrentRunFile(): string {
    return path.join(
      this.healingDataDir,
      'healing-history',
      `${this.currentRunId}.json`
    );
  }

  getRunId(): string {
    return this.currentRunId;
  }

  getAllRunIds(): string[] {
    const historyDir = path.join(this.healingDataDir, 'healing-history');
    if (!fs.existsSync(historyDir)) {
      return [];
    }

    return fs.readdirSync(historyDir)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
      .sort()
      .reverse();
  }

  getRunById(runId: string): HealingRecord[] {
    const filePath = path.join(this.healingDataDir, 'healing-history', `${runId}.json`);
    if (!fs.existsSync(filePath)) {
      return [];
    }

    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as HealingRecord[];
    } catch {
      return [];
    }
  }

  getFlakyLocators(threshold: number = 10): HealingRecord[] {
    const records = this.getHealingHistory();
    const locatorCounts: Record<string, number> = {};

    records.forEach(r => {
      const key = `${r.pageName}:${r.originalLocator}`;
      locatorCounts[key] = (locatorCounts[key] || 0) + 1;
    });

    const flakyKeys = Object.keys(locatorCounts).filter(k => locatorCounts[k] >= threshold);

    return records.filter(r => 
      flakyKeys.includes(`${r.pageName}:${r.originalLocator}`)
    );
  }
}
