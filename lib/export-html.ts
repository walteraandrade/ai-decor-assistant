import type { HistoryEntry, CostStats } from './types';

export function generateHTML(entries: HistoryEntry[], stats: CostStats): string {
  const entriesHTML = entries.map(entry => `
    <div class="entry">
      <div class="entry-header">
        <h3>${new Date(entry.timestamp).toLocaleString()}</h3>
        <span class="cost">$${entry.cost.toFixed(4)}</span>
      </div>
      <div class="entry-content">
        <div class="prompts">
          <div class="prompt-section">
            <strong>Original:</strong>
            <p>${escapeHtml(entry.originalPrompt)}</p>
          </div>
          <div class="prompt-section">
            <strong>Refined:</strong>
            <p>${escapeHtml(entry.refinedPrompt)}</p>
          </div>
        </div>
        <div class="images">
          ${entry.resultUrl ? `<img src="${entry.resultUrl}" alt="Generated result" />` : '<p>No result image</p>'}
        </div>
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Decor Assistant - History Export</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      margin-bottom: 10px;
      color: #1a1a1a;
    }
    .stats {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 6px;
      margin-bottom: 40px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }
    .stat-item {
      text-align: center;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }
    .stat-label {
      font-size: 14px;
      color: #666;
      margin-top: 4px;
    }
    .entries {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }
    .entry {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 20px;
    }
    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid #e5e7eb;
    }
    .entry-header h3 {
      font-size: 16px;
      color: #374151;
    }
    .cost {
      background: #dbeafe;
      color: #1e40af;
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 14px;
    }
    .prompts {
      margin-bottom: 20px;
    }
    .prompt-section {
      margin-bottom: 15px;
    }
    .prompt-section strong {
      display: block;
      margin-bottom: 6px;
      color: #4b5563;
      font-size: 14px;
    }
    .prompt-section p {
      color: #1f2937;
      padding: 10px;
      background: #f9fafb;
      border-radius: 4px;
      border-left: 3px solid #3b82f6;
    }
    .images {
      margin-top: 20px;
    }
    .images img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Decor Assistant - Generation History</h1>
    <p style="color: #666; margin-bottom: 30px;">Exported on ${new Date().toLocaleString()}</p>
    
    <div class="stats">
      <div class="stat-item">
        <div class="stat-value">${stats.generationCount}</div>
        <div class="stat-label">Total Generations</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">$${stats.totalAllTime.toFixed(2)}</div>
        <div class="stat-label">Total Cost</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">$${stats.currentMonth.toFixed(2)}</div>
        <div class="stat-label">This Month</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">$${stats.monthlyBudget.toFixed(2)}</div>
        <div class="stat-label">Monthly Budget</div>
      </div>
    </div>

    <div class="entries">
      ${entriesHTML || '<p>No history entries</p>'}
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

