import * as fs from 'fs';
import * as path from 'path';

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
}

export default globalSetup;
