import fs from 'node:fs';
import path from 'node:path';
import { parseCSV, processProgressData, type ProgressSummary } from './csvParser.ts';

/**
 * Server-side loader that scans src/data/progress for the latest CSV file
 * and returns the processed summary and leaderboard.
 */
export function loadLatestProgressData(): ProgressSummary {
  const progressDir = path.resolve(process.cwd(), 'src/data/progress');

  if (!fs.existsSync(progressDir)) {
    return processProgressData([]);
  }

  const files = fs.readdirSync(progressDir).filter(f => f.toLowerCase().endsWith('.csv'));

  if (files.length === 0) {
    return processProgressData([]);
  }

  // Rank files to find the latest
  const scoredFiles = files.map(file => {
    const fullPath = path.join(progressDir, file);
    const stats = fs.statSync(fullPath);
    let score = stats.mtimeMs;

    // Check for progress(\d+)
    const numMatch = file.match(/progress_?(\d+)/i);
    if (numMatch) {
      score += parseInt(numMatch[1], 10) * 1000000000;
    }

    // Check for [DD Mon] pattern (e.g. [01 Nov])
    const dateMatch = file.match(/\[(\d{1,2})\s+([A-Za-z]+)\]/);
    if (dateMatch) {
      const day = parseInt(dateMatch[1], 10);
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const monthIdx = months.indexOf(dateMatch[2].toLowerCase());
      if (monthIdx !== -1) {
        const estDate = new Date(2026, monthIdx, day).getTime();
        score += estDate;
      }
    }

    return { file, fullPath, stats, score };
  });

  scoredFiles.sort((a, b) => b.score - a.score);

  const latest = scoredFiles[0];
  const fileContent = fs.readFileSync(latest.fullPath, 'utf8');
  const rows = parseCSV(fileContent);

  return processProgressData(rows, latest.file, latest.stats.mtime);
}
