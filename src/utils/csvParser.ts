/**
 * CSV Parser and Data Normalizer for GDGC Learn with Communities Progress CSVs
 * Supports both 2026 format (GDGC-MCETH [DD Mon].csv) and legacy 2025 format (progress##.csv)
 */

import studentRollMap from '../data/studentRollMap.json' with { type: 'json' };

export interface ParticipantHistory {
  completedAtReport?: string;
  completedAtTimestamp?: number;
  badgeAchievedTimestamp?: number;
}

export interface ParticipantProgress {
  rank: number;
  uuid: string; // Google Skills Profile UUID (Primary Key)
  userName: string;
  userEmail: string;
  rollNumber?: string;
  skillsProfileUrl: string;
  skillsProfileStatus: string;
  accessCodeRedeemed: boolean;
  milestone: string;
  gearBadges: string;
  skillBadgesCount: number;
  completedBadgeNames: string[];
  isComplete: boolean;
  completedAtReport?: string;
  completedAtTimestamp?: number;
  badgeAchievedTimestamp?: number;
}

export interface ProgressSummary {
  lastUpdated: string;
  fileName: string;
  totalParticipants: number;
  completedAll: number;
  inProgress: number;
  notStarted: number;
  totalBadgesCompleted: number;
  creditsRedeemed: number;
  gearBadgeEarned: number;
  participants: ParticipantProgress[];
  top3: ParticipantProgress[];
}

/**
 * Extracts the 36-character UUID from a Google Skills Profile URL.
 * Standardizes to lowercase.
 */
export function extractProfileUuid(urlOrId: string): string {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  const uuidMatch = trimmed.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
  if (uuidMatch) {
    return uuidMatch[0].toLowerCase();
  }
  const match = trimmed.match(/public_profiles\/([a-zA-Z0-9-]+)/i);
  if (match) {
    return match[1].toLowerCase();
  }
  return trimmed.toLowerCase();
}

/**
 * Robust CSV parser that handles quoted strings containing commas, line breaks, and escaped quotes.
 */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuote = false;

  const len = text.length;
  for (let i = 0; i < len; i++) {
    const char = text[i];
    const nextChar = i + 1 < len ? text[i + 1] : '';

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n in \r\n
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some(cell => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(cell => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Safely parses comma- or pipe-separated badge names from the progress report.
 * Handles known badges with internal commas (e.g. "Store, Process, and Manage Data on Google Cloud - Console")
 * so they are not erroneously split into separate items.
 */
export function parseCompletedBadgeNames(raw: string): string[] {
  if (!raw || !raw.trim()) return [];

  // If piped (e.g. legacy format)
  if (raw.includes('|')) {
    return raw.split('|').map(s => s.trim()).filter(Boolean);
  }

  // Protect known badges that contain commas
  const PLACEHOLDER = '___STORE_PROCESS_MANAGE_CONSOLE___';
  let sanitized = raw.replace(
    /Store,\s*Process,\s*and\s*Manage\s*Data\s*on\s*Google\s*Cloud\s*-\s*Console/gi,
    PLACEHOLDER
  );

  // Also handle without "- Console" if it appears in some exports
  sanitized = sanitized.replace(
    /Store,\s*Process,\s*and\s*Manage\s*Data\s*on\s*Google\s*Cloud/gi,
    PLACEHOLDER
  );

  const parts = sanitized.split(',').map(s => s.trim()).filter(Boolean);

  const results: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === PLACEHOLDER) {
      results.push('Store, Process, and Manage Data on Google Cloud - Console');
    } else if (
      // Fallback: If already broken into "Store", "Process", and "and Manage Data on Google Cloud..."
      part.toLowerCase() === 'store' &&
      parts[i + 1]?.toLowerCase() === 'process' &&
      parts[i + 2]?.toLowerCase().startsWith('and manage data on google cloud')
    ) {
      results.push('Store, Process, and Manage Data on Google Cloud - Console');
      i += 2;
    } else {
      results.push(part);
    }
  }

  return results;
}

/**
 * Extracts a human-readable "Last Updated" string from the CSV filename or date
 */
export function extractLastUpdated(fileName: string, mtime?: Date): string {
  // Check for "[01 Nov]" or "[15 Oct]" pattern in filename
  const bracketDateMatch = fileName.match(/\[(\d{1,2}\s+[A-Za-z]+)\]/);
  if (bracketDateMatch) {
    const dateStr = bracketDateMatch[1];
    return `${dateStr} 2026`;
  }

  // Check for progress21.csv or progress_21.csv
  const progressNumMatch = fileName.match(/progress_?(\d+)/i);
  if (progressNumMatch) {
    return `Progress Update #${progressNumMatch[1]}`;
  }

  // Fallback to mtime if available
  if (mtime) {
    const d = new Date(mtime);
    const day = d.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${day} ${month} ${year}, ${hour12}:${minutes} ${ampm}`;
  }

  return 'Recently Updated';
}

/**
 * Processes parsed CSV rows into structured summary and sorted participant leaderboard.
 * Prioritizes participants who completed early across chronological progress reports.
 * Uses UUID exclusively as the primary key.
 */
export function processProgressData(
  rows: string[][],
  fileName: string = 'GDGC-MCETH [01 Nov].csv',
  mtime?: Date,
  historyMap?: Map<string, ParticipantHistory>
): ProgressSummary {
  if (rows.length < 2) {
    return {
      lastUpdated: extractLastUpdated(fileName, mtime),
      fileName,
      totalParticipants: 0,
      completedAll: 0,
      inProgress: 0,
      notStarted: 0,
      totalBadgesCompleted: 0,
      creditsRedeemed: 0,
      gearBadgeEarned: 0,
      participants: [],
      top3: [],
    };
  }

  const headerRow = rows[0].map(h => h.trim().toLowerCase());

  // Find column indices by multiple possible aliases (2026 & 2025 formats)
  const colIndex = {
    userName: headerRow.findIndex(h => h.includes('user name') || h === 'name'),
    userEmail: headerRow.findIndex(h => h.includes('user email') || h === 'email'),
    skillsUrl: headerRow.findIndex(h => h.includes('google skills profile url') || h.includes('google cloud skills boost profile url') || h.includes('profile url')),
    skillsStatus: headerRow.findIndex(h => h.includes('skills profile status') || h.includes('profile url status')),
    redemption: headerRow.findIndex(h => h.includes('access code redemption status') || h.includes('redemption status')),
    milestone: headerRow.findIndex(h => h.includes('milestone completed') || h.includes('all skill badges & games completed')),
    gearBadges: headerRow.findIndex(h => h.includes('gear digital badges') || h.includes('# of arcade games completed')),
    badgeCount: headerRow.findIndex(h => h.includes('skill badges completed count') || h.includes('# of skill badges completed')),
    badgeNames: headerRow.findIndex(h => h.includes('skill badges completed names') || h.includes('names of completed skill badges')),
  };

  const participants: ParticipantProgress[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length <= 1) continue;

    const userName = (colIndex.userName >= 0 ? row[colIndex.userName] : '') || 'Anonymous';
    const userEmail = (colIndex.userEmail >= 0 ? row[colIndex.userEmail] : '') || '';
    const skillsProfileUrl = (colIndex.skillsUrl >= 0 ? row[colIndex.skillsUrl] : '') || '';
    const skillsProfileStatus = (colIndex.skillsStatus >= 0 ? row[colIndex.skillsStatus] : 'All Good') || 'All Good';
    const redemptionRaw = (colIndex.redemption >= 0 ? row[colIndex.redemption] : '') || 'No';
    const milestoneRaw = (colIndex.milestone >= 0 ? row[colIndex.milestone] : '') || 'No Milestone';
    const gearRaw = (colIndex.gearBadges >= 0 ? row[colIndex.gearBadges] : '') || 'Not applicable';
    const badgeCountRaw = colIndex.badgeCount >= 0 ? parseInt(row[colIndex.badgeCount] || '0', 10) : 0;
    const badgeCount = isNaN(badgeCountRaw) ? 0 : badgeCountRaw;

    const badgeNamesRaw = (colIndex.badgeNames >= 0 ? row[colIndex.badgeNames] : '') || '';
    const completedBadgeNames = parseCompletedBadgeNames(badgeNamesRaw);

    // Primary Key: Google Skills Boost Profile UUID
    const uuid = extractProfileUuid(skillsProfileUrl);

    // Roll number lookup ONLY by UUID (Primary Key)
    const rollNumber = (studentRollMap as any).byUuid?.[uuid];

    const accessCodeRedeemed = redemptionRaw.trim().toLowerCase() === 'yes';
    const isComplete = badgeCount >= 10 || milestoneRaw.toLowerCase().includes('milestone 3') || milestoneRaw.trim().toLowerCase() === 'yes';

    // Historical milestone tracking from chronological progress reports
    const history = historyMap?.get(uuid);
    const completedAtReport = history?.completedAtReport;
    const completedAtTimestamp = history?.completedAtTimestamp;
    const badgeAchievedTimestamp = history?.badgeAchievedTimestamp;

    participants.push({
      rank: 0, // will assign after sorting
      uuid,
      userName,
      userEmail,
      rollNumber,
      skillsProfileUrl,
      skillsProfileStatus,
      accessCodeRedeemed,
      milestone: milestoneRaw,
      gearBadges: gearRaw,
      skillBadgesCount: badgeCount,
      completedBadgeNames,
      isComplete,
      completedAtReport,
      completedAtTimestamp,
      badgeAchievedTimestamp,
    });
  }

  // Sort participants by:
  // 1. Skill badges count descending (10 > 9 > 8 ...)
  // 2. Early Completion: Participants who completed all 10 badges in an earlier report rank higher
  // 3. Early badge progression: Participants who reached their current badge count earlier rank higher
  // 4. Milestone rank (Milestone 3 > Milestone 2 > Milestone 1 > No Milestone)
  // 5. GEAR badges completed
  // 6. Redemption status (Yes > No)
  // 7. Tie-breaker: Alphabetical by user name
  const milestoneScore = (m: string) => {
    const lower = m.toLowerCase();
    if (lower.includes('milestone 3') || lower === 'yes') return 3;
    if (lower.includes('milestone 2')) return 2;
    if (lower.includes('milestone 1')) return 1;
    return 0;
  };

  const gearScore = (g: string) => {
    if (!g || g.toLowerCase() === 'not applicable' || g.toLowerCase() === 'no badge' || g === '0') return 0;
    return 1;
  };

  participants.sort((a, b) => {
    // 1. Skill badges count descending
    if (b.skillBadgesCount !== a.skillBadgesCount) {
      return b.skillBadgesCount - a.skillBadgesCount;
    }

    // 2. Early Completion priority:
    // If both completed all 10 badges / isComplete, whoever reached it in an earlier report ranks higher
    if (a.isComplete && b.isComplete) {
      const timeA = a.completedAtTimestamp ?? Infinity;
      const timeB = b.completedAtTimestamp ?? Infinity;
      if (timeA !== timeB) {
        return timeA - timeB; // smaller timestamp = earlier date = higher rank
      }
    }

    // 3. Early badge progression priority for same badge counts
    if (a.badgeAchievedTimestamp && b.badgeAchievedTimestamp && a.badgeAchievedTimestamp !== b.badgeAchievedTimestamp) {
      return a.badgeAchievedTimestamp - b.badgeAchievedTimestamp;
    }

    // 4. Milestone rank
    const mScoreDiff = milestoneScore(b.milestone) - milestoneScore(a.milestone);
    if (mScoreDiff !== 0) return mScoreDiff;

    // 5. GEAR badges completed
    const gScoreDiff = gearScore(b.gearBadges) - gearScore(a.gearBadges);
    if (gScoreDiff !== 0) return gScoreDiff;

    // 6. Redemption status
    if (b.accessCodeRedeemed !== a.accessCodeRedeemed) {
      return (b.accessCodeRedeemed ? 1 : 0) - (a.accessCodeRedeemed ? 1 : 0);
    }

    // 7. Tie-breaker: Alphabetical by user name
    return a.userName.localeCompare(b.userName);
  });

  // Assign ranks
  participants.forEach((p, idx) => {
    p.rank = idx + 1;
  });

  const totalParticipants = participants.length;
  const completedAll = participants.filter(p => p.isComplete).length;
  const inProgress = participants.filter(p => p.skillBadgesCount > 0 && !p.isComplete).length;
  const notStarted = participants.filter(p => p.skillBadgesCount === 0).length;
  const totalBadgesCompleted = participants.reduce((acc, p) => acc + p.skillBadgesCount, 0);
  const creditsRedeemed = participants.filter(p => p.accessCodeRedeemed).length;
  const gearBadgeEarned = participants.filter(p => gearScore(p.gearBadges) > 0).length;

  const top3 = participants.slice(0, 3);

  return {
    lastUpdated: extractLastUpdated(fileName, mtime),
    fileName,
    totalParticipants,
    completedAll,
    inProgress,
    notStarted,
    totalBadgesCompleted,
    creditsRedeemed,
    gearBadgeEarned,
    participants,
    top3,
  };
}
