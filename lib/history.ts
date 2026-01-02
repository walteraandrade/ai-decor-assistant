import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type { HistoryEntry } from './types';

const HISTORY_FILE = join(process.cwd(), 'data', 'history.json');

async function ensureDataDir(): Promise<void> {
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    await mkdir(dataDir, { recursive: true });
  }
}

export async function loadHistory(): Promise<HistoryEntry[]> {
  await ensureDataDir();
  if (!existsSync(HISTORY_FILE)) {
    return [];
  }
  try {
    const content = await readFile(HISTORY_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export async function saveHistory(entries: HistoryEntry[]): Promise<void> {
  await ensureDataDir();
  await writeFile(HISTORY_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

export async function addHistoryEntry(entry: HistoryEntry): Promise<void> {
  const history = await loadHistory();
  history.unshift(entry);
  await saveHistory(history);
}

export async function clearHistory(): Promise<void> {
  await saveHistory([]);
}

