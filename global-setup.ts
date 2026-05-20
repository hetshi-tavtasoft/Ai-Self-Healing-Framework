import * as fs from 'fs';
import * as path from 'path';
import { checkAllLocators, generateHealthReport } from './framework/utils/locatorHealthChecker';

async function globalSetup() {
  const historyDir = path.resolve(__dirname, 'healing-data/healing-history');
  if (fs.existsSync(historyDir)) {
    const files = fs.readdirSync(historyDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        fs.unlinkSync(path.join(historyDir, file));
      } catch {
        // skip
      }
    }
  }

  console.log('Running locator health check...');
  const results = await checkAllLocators();
  const report = generateHealthReport(results);
  const reportPath = path.resolve(__dirname, 'locator-health-report.md');
  fs.writeFileSync(reportPath, report, 'utf-8');

  const failed = results.filter(r => !r.exists || !r.visible);
  if (failed.length > 0) {
    console.error(`\n❌ ${failed.length} locator(s) are broken — aborting test run.\n`);
    for (const f of failed) {
      console.error(`   ${f.pageName}.${f.locatorName}: \`${f.locator}\` → ${!f.exists ? 'not found' : 'not visible'}`);
    }
    console.error('\nRun `npm run check:locators` for the full report.\n');
    process.exit(1);
  }

  console.log(`✅ All ${results.length} locators passed health check.\n`);
}

export default globalSetup;
