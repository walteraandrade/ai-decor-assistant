export const dynamic = 'force-dynamic';

import { loadHistory, clearHistory } from '@/lib/history';
import { aggregateCosts } from '@/lib/cost-tracker';
import { generateHTML } from '@/lib/export-html';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const exportHtml = url.searchParams.get('export') === 'html';

    const entries = await loadHistory();
    const stats = aggregateCosts(entries);

    if (exportHtml) {
      const html = generateHTML(entries, stats);
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="decor-history-${Date.now()}.html"`,
        },
      });
    }

    return Response.json({ entries, stats });
  } catch (error) {
    console.error('History error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to load history' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await clearHistory();
    return Response.json({ success: true });
  } catch (error) {
    console.error('Clear history error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to clear history' },
      { status: 500 }
    );
  }
}

