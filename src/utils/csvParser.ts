/**
 * CSV Parser and Data Normalizer for GDGC Learn with Communities Progress CSVs
 * Supports both 2026 format (GDGC-MCETH [DD Mon].csv) and legacy 2025 format (progress##.csv)
 */

export interface ParticipantProgress {
  rank: number;
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
 * Processes parsed CSV rows into structured summary and sorted participant leaderboard
 */
export function processProgressData(rows: string[][], fileName: string = 'GDGC-MCETH [01 Nov].csv', mtime?: Date): ProgressSummary {
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
    let completedBadgeNames: string[] = [];
    if (badgeNamesRaw) {
      if (badgeNamesRaw.includes('|')) {
        completedBadgeNames = badgeNamesRaw.split('|').map(s => s.trim()).filter(Boolean);
      } else {
        completedBadgeNames = badgeNamesRaw.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    // Try extracting roll number from email or username
    const emailMatch = userEmail.match(/160\d{9}/);
    const nameMatch = userName.match(/160\d{9}/);
    const rollNumber = emailMatch ? emailMatch[0] : (nameMatch ? nameMatch[0] : undefined);

    const accessCodeRedeemed = redemptionRaw.trim().toLowerCase() === 'yes';
    const isComplete = badgeCount >= 10 || milestoneRaw.toLowerCase().includes('milestone 3') || milestoneRaw.trim().toLowerCase() === 'yes';

    participants.push({
      rank: 0, // will assign after sorting
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
    });
  }

  // Sort participants by:
  // 1. Skill badges count descending
  // 2. Milestone rank (Milestone 3 > Milestone 2 > Milestone 1 > No Milestone)
  // 3. GEAR badges completed
  // 4. Redemption status
  // 5. User name alphabetically
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
    if (b.skillBadgesCount !== a.skillBadgesCount) {
      return b.skillBadgesCount - a.skillBadgesCount;
    }
    const mScoreDiff = milestoneScore(b.milestone) - milestoneScore(a.milestone);
    if (mScoreDiff !== 0) return mScoreDiff;

    const gScoreDiff = gearScore(b.gearBadges) - gearScore(a.gearBadges);
    if (gScoreDiff !== 0) return gScoreDiff;

    if (b.accessCodeRedeemed !== a.accessCodeRedeemed) {
      return (b.accessCodeRedeemed ? 1 : 0) - (a.accessCodeRedeemed ? 1 : 0);
    }

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
