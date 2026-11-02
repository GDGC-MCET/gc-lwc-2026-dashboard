import fs from 'node:fs';
import path from 'node:path';
import {
  parseCSV,
  extractProfileUuid,
  processProgressData,
  extractLastUpdated,
  type ParticipantHistory,
  type ProgressSummary
} from './csvParser.ts';

export interface ProgressFileInfo {
  file: string;
  fullPath: string;
  stats: fs.Stats;
  chronologicalTimestamp: number;
  reportDateLabel: string;
}

/**
 * Extracts a reliable chronological timestamp and display label from a progress report filename.
 * Prioritizes [DD Mon] dates (e.g. [01 Nov]), then legacy progress## numbers, with mtime as fallback.
 */
export function parseFileReportDate(fileName: string, mtime: Date): { timestamp: number; label: string } {
  // Check for [DD Mon] pattern (e.g. [01 Nov], [15 Oct])
  const bracketMatch = fileName.match(/\[(\d{1,2})\s+([A-Za-z]+)\]/);
  if (bracketMatch) {
    const day = parseInt(bracketMatch[1], 10);
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthIdx = months.indexOf(bracketMatch[2].toLowerCase());
    if (monthIdx !== -1) {
      const d = new Date(2026, monthIdx, day, 12, 0, 0);
      const capMonth = months[monthIdx].charAt(0).toUpperCase() + months[monthIdx].slice(1);
      return {
        timestamp: d.getTime(),
        label: `${day.toString().padStart(2, '0')} ${capMonth} 2026`,
      };
    }
  }

  // Check for progress(\d+) pattern (e.g. progress21.csv)
  const progMatch = fileName.match(/progress_?(\d+)/i);
  if (progMatch) {
    const num = parseInt(progMatch[1], 10);
    const base = new Date(2025, 9, 1).getTime();
    return {
      timestamp: base + num * 86400000,
      label: `Progress Update #${num}`,
    };
  }

  // Fallback to file mtime
  return {
    timestamp: mtime.getTime(),
    label: extractLastUpdated(fileName, mtime),
  };
}

/**
 * Server-side loader that scans src/data/progress for all CSV files,
 * processes them in chronological order to record early completion dates,
 * and returns the processed summary and leaderboard for the latest report.
 */
export function loadLatestProgressData(): ProgressSummary {
  const progressDir = path.resolve(process.cwd(), 'src/data/progress');

  if (!fs.existsSync(progressDir)) {
    return processProgressData([]);
  }

  const fileNames = fs.readdirSync(progressDir).filter(f => f.toLowerCase().endsWith('.csv'));

  if (fileNames.length === 0) {
    return processProgressData([]);
  }

  // Map and rank all files chronologically
  const progressFiles: ProgressFileInfo[] = fileNames.map(file => {
    const fullPath = path.join(progressDir, file);
    const stats = fs.statSync(fullPath);
    const { timestamp, label } = parseFileReportDate(file, stats.mtime);
    return {
      file,
      fullPath,
      stats,
      chronologicalTimestamp: timestamp,
      reportDateLabel: label,
    };
  });

  // Sort chronologically: oldest first, newest last
  progressFiles.sort((a, b) => a.chronologicalTimestamp - b.chronologicalTimestamp);

  // Track historical completion and badge milestone timestamps across reports
  // Primary key is the participant's Google Skills Profile UUID
  const historyMap = new Map<string, ParticipantHistory & { highestBadges?: number }>();

  for (const fileInfo of progressFiles) {
    try {
      const content = fs.readFileSync(fileInfo.fullPath, 'utf8');
      const rows = parseCSV(content);
      if (rows.length < 2) continue;

      const headerRow = rows[0].map(h => h.trim().toLowerCase());
      const skillsUrlIdx = headerRow.findIndex(h => h.includes('skills profile url') || h.includes('profile url'));
      const badgeCountIdx = headerRow.findIndex(h => h.includes('skill badges completed count') || h.includes('# of skill badges completed'));
      const milestoneIdx = headerRow.findIndex(h => h.includes('milestone completed') || h.includes('all skill badges & games completed'));

      if (skillsUrlIdx < 0) continue;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length <= 1) continue;

        const skillsUrl = row[skillsUrlIdx] || '';
        const uuid = extractProfileUuid(skillsUrl);
        if (!uuid) continue;

        const badgeCount = badgeCountIdx >= 0 ? parseInt(row[badgeCountIdx] || '0', 10) || 0 : 0;
        const milestoneRaw = milestoneIdx >= 0 ? (row[milestoneIdx] || '') : '';
        const isComplete = badgeCount >= 10 || milestoneRaw.toLowerCase().includes('milestone 3') || milestoneRaw.trim().toLowerCase() === 'yes';

        let hist = historyMap.get(uuid);
        if (!hist) {
          hist = {};
          historyMap.set(uuid, hist);
        }

        // If completed and not yet recorded, lock in the earliest report date
        if (isComplete && !hist.completedAtTimestamp) {
          hist.completedAtTimestamp = fileInfo.chronologicalTimestamp;
          hist.completedAtReport = fileInfo.reportDateLabel;
        }

        // Track when badge progression occurred
        if (hist.highestBadges === undefined || badgeCount > hist.highestBadges) {
          hist.highestBadges = badgeCount;
          hist.badgeAchievedTimestamp = fileInfo.chronologicalTimestamp;
        }
      }
    } catch (err) {
      console.error(`Error reading progress report ${fileInfo.file}:`, err);
    }
  }

  // The latest file is the newest chronologically
  const latest = progressFiles[progressFiles.length - 1];
  const latestContent = fs.readFileSync(latest.fullPath, 'utf8');
  const latestRows = parseCSV(latestContent);

  return processProgressData(latestRows, latest.file, latest.stats.mtime, historyMap);
}
