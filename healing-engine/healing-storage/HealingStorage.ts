import * as fs from 'fs';
import * as path from 'path';

export interface HealedLocator {
  originalLocator: string;
  healedLocator: string;
  url: string;
  pageName: string;
  timestamp: string;
  lastUsed?: string;
  successCount: number;
}

export class HealingStorage {
  private healedLocatorsPath: string;
  private failedLocatorsPath: string;
  private domSnapshotsPath: string;

  constructor() {
    const healingDataDir = path.resolve(__dirname, '../../healing-data');
    this.healedLocatorsPath = path.join(healingDataDir, 'healed-locators/healed.json');
    this.failedLocatorsPath = path.join(healingDataDir, 'failed-locators/failed.json');
    this.domSnapshotsPath = path.join(healingDataDir, 'dom-snapshots');
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    const dirs = [
      path.dirname(this.healedLocatorsPath),
      path.dirname(this.failedLocatorsPath),
      this.domSnapshotsPath
    ];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  getHealedLocators(): HealedLocator[] {
    if (!fs.existsSync(this.healedLocatorsPath)) {
      return [];
    }
    try {
      const data = fs.readFileSync(this.healedLocatorsPath, 'utf-8');
      return JSON.parse(data) as HealedLocator[];
    } catch {
      return [];
    }
  }

  saveHealedLocator(entry: HealedLocator): void {
    const locators = this.getHealedLocators();
    const existingIndex = locators.findIndex(
      l => l.originalLocator === entry.originalLocator && l.pageName === entry.pageName
    );

    if (existingIndex >= 0) {
      locators[existingIndex] = entry;
    } else {
      locators.push(entry);
    }

    fs.writeFileSync(this.healedLocatorsPath, JSON.stringify(locators, null, 2));
  }

  findHealedLocator(originalLocator: string, pageName: string): HealedLocator | null {
    const locators = this.getHealedLocators();
    return locators.find(
      l => l.originalLocator === originalLocator && l.pageName === pageName
    ) || null;
  }

  saveFailedLocator(data: any): void {
    const failedPath = this.failedLocatorsPath;
    let failed: any[] = [];
    if (fs.existsSync(failedPath)) {
      try {
        failed = JSON.parse(fs.readFileSync(failedPath, 'utf-8'));
      } catch {
        failed = [];
      }
    }
    failed.push({ ...data, timestamp: new Date().toISOString() });
    fs.writeFileSync(failedPath, JSON.stringify(failed, null, 2));
  }

  saveDomSnapshot(pageName: string, dom: string): string {
    const filePath = path.join(this.domSnapshotsPath, `${pageName}_${Date.now()}.html`);
    fs.writeFileSync(filePath, dom);
    return filePath;
  }

  cleanupDomSnapshots(pageName: string): void {
    if (!fs.existsSync(this.domSnapshotsPath)) return;
    const files = fs.readdirSync(this.domSnapshotsPath)
      .filter(f => f.startsWith(pageName) && f.endsWith('.html'));
    for (const file of files) {
      try {
        fs.unlinkSync(path.join(this.domSnapshotsPath, file));
      } catch {
        // skip
      }
    }
  }

  incrementSuccessCount(originalLocator: string, pageName: string): void {
    const locators = this.getHealedLocators();
    const entry = locators.find(
      l => l.originalLocator === originalLocator && l.pageName === pageName
    );
    if (entry) {
      entry.successCount = (entry.successCount || 0) + 1;
      entry.lastUsed = new Date().toISOString();
      fs.writeFileSync(this.healedLocatorsPath, JSON.stringify(locators, null, 2));
    }
  }
}
