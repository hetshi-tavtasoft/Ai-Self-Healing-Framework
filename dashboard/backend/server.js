const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const HEALING_DATA_DIR = path.resolve(__dirname, '../../healing-data/healing-history');

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/healings', (req, res) => {
  try {
    if (!fs.existsSync(HEALING_DATA_DIR)) {
      return res.json([]);
    }

    const files = fs.readdirSync(HEALING_DATA_DIR).filter(f => f.endsWith('.json'));
    let allRecords = [];

    files.forEach(file => {
      try {
        const data = fs.readFileSync(path.join(HEALING_DATA_DIR, file), 'utf-8');
        const records = JSON.parse(data);
        allRecords = allRecords.concat(records);
      } catch (error) {
        console.error(`Error reading ${file}:`, error);
      }
    });

    res.json(allRecords.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch healing records' });
  }
});

app.get('/api/healings/summary', (req, res) => {
  try {
    if (!fs.existsSync(HEALING_DATA_DIR)) {
      return res.json({
        totalHealings: 0,
        successfulHealings: 0,
        failedHealings: 0,
        successRate: 0,
        pages: {},
        methods: {}
      });
    }

    const files = fs.readdirSync(HEALING_DATA_DIR).filter(f => f.endsWith('.json'));
    let allRecords = [];

    files.forEach(file => {
      try {
        const data = fs.readFileSync(path.join(HEALING_DATA_DIR, file), 'utf-8');
        const records = JSON.parse(data);
        allRecords = allRecords.concat(records);
      } catch (error) {
        // Skip invalid files
      }
    });

    const summary = {
      totalHealings: allRecords.length,
      successfulHealings: allRecords.filter(r => r.status === 'success').length,
      failedHealings: allRecords.filter(r => r.status === 'failed').length,
      successRate: 0,
      pages: {},
      methods: {}
    };

    summary.successRate = summary.totalHealings > 0
      ? (summary.successfulHealings / summary.totalHealings) * 100
      : 0;

    allRecords.forEach(r => {
      summary.pages[r.pageName] = (summary.pages[r.pageName] || 0) + 1;
      summary.methods[r.healingMethod] = (summary.methods[r.healingMethod] || 0) + 1;
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

app.get('/api/healings/flaky', (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    
    if (!fs.existsSync(HEALING_DATA_DIR)) {
      return res.json([]);
    }

    const files = fs.readdirSync(HEALING_DATA_DIR).filter(f => f.endsWith('.json'));
    let allRecords = [];

    files.forEach(file => {
      try {
        const data = fs.readFileSync(path.join(HEALING_DATA_DIR, file), 'utf-8');
        const records = JSON.parse(data);
        allRecords = allRecords.concat(records);
      } catch (error) {
        // Skip invalid files
      }
    });

    const locatorCounts = {};
    allRecords.forEach(r => {
      const key = `${r.pageName}:${r.originalLocator}`;
      locatorCounts[key] = (locatorCounts[key] || 0) + 1;
    });

    const flakyKeys = Object.keys(locatorCounts).filter(k => locatorCounts[k] >= threshold);
    const flakyRecords = allRecords.filter(r => 
      flakyKeys.includes(`${r.pageName}:${r.originalLocator}`)
    );

    res.json(flakyRecords);
  } catch (error) {
    res.status(500).json({ error: 'Failed to find flaky locators' });
  }
});

app.get('/api/runs', (req, res) => {
  try {
    if (!fs.existsSync(HEALING_DATA_DIR)) {
      return res.json([]);
    }

    const files = fs.readdirSync(HEALING_DATA_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
      .sort()
      .reverse();

    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch runs' });
  }
});

app.get('/api/runs/:runId', (req, res) => {
  try {
    const { runId } = req.params;
    const filePath = path.join(HEALING_DATA_DIR, `${runId}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Run not found' });
    }

    const data = fs.readFileSync(filePath, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch run data' });
  }
});

app.listen(PORT, () => {
  console.log(`Healing Dashboard Backend running on http://localhost:${PORT}`);
});
