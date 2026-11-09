import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const skillBadgesPath = path.resolve('src/data/skillBadges.json');
const skillBadges = JSON.parse(fs.readFileSync(skillBadgesPath, 'utf8'));

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Google Cloud Learn with Communities 2026 - Student Guide & Challenge Handbook</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');

    @page {
      size: A4 portrait;
      margin: 10mm 12mm 12mm 12mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      font-size: 8.5pt;
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    :root {
      --gc-blue: #1A73E8;
      --gc-green: #1E8E3E;
      --gc-yellow: #B45309;
      --gc-red: #D93025;
      --border: #E2E8F0;
      --bg-soft: #F8FAFC;
    }

    .page {
      page-break-after: always;
      position: relative;
    }

    .page:last-child {
      page-break-after: auto;
    }

    .header-banner {
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
      color: #FFFFFF;
      padding: 14px 18px;
      border-radius: 8px;
      margin-bottom: 10px;
      border: 1px solid #334155;
      position: relative;
      overflow: hidden;
    }

    .header-banner::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #4285F4 0%, #34A853 35%, #FBBC04 70%, #EA4335 100%);
    }

    .badge-super {
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 6.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 2px 6px;
      border-radius: 3px;
      background: rgba(66, 133, 244, 0.25);
      border: 1px solid rgba(66, 133, 244, 0.5);
      color: #93C5FD;
      margin-bottom: 4px;
    }

    h1 {
      font-family: 'Google Sans', 'Inter', sans-serif;
      font-size: 14pt;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #FFFFFF;
      margin-bottom: 2px;
      line-height: 1.25;
      padding-bottom: 2px;
    }

    .header-subtitle {
      font-size: 8pt;
      color: #94A3B8;
      line-height: 1.35;
      margin-bottom: 8px;
    }

    .header-meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
    }

    .meta-item {
      display: flex;
      flex-direction: column;
    }

    .meta-item .label {
      font-size: 6.5pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94A3B8;
    }

    .meta-item .value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.5pt;
      font-weight: 700;
      color: #F8FAFC;
    }

    .quest-section {
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 9px;
    }

    .quest-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border);
      padding-bottom: 5px;
      margin-bottom: 8px;
    }

    .quest-title-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .quest-number {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--gc-blue);
      color: #FFFFFF;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.5pt;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .quest-number.green { background: var(--gc-green); }
    .quest-number.purple { background: #7C3AED; }

    h2 {
      font-family: 'Google Sans', 'Inter', sans-serif;
      font-size: 10.5pt;
      font-weight: 700;
      color: #0F172A;
      line-height: 1.25;
      padding-bottom: 2px;
    }

    .quest-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 6.5pt;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 3px;
    }

    .quest-badge.closed { background: #FEE2E2; color: #B91C1C; }
    .quest-badge.ready { background: #E0E7FF; color: #3730A3; }
    .quest-badge.active { background: #DCFCE7; color: #166534; }

    .callout-box {
      background: var(--bg-soft);
      border: 1px solid #CBD5E1;
      border-left: 3px solid var(--gc-blue);
      border-radius: 5px;
      padding: 8px 10px;
      margin: 6px 0;
      font-size: 7.8pt;
    }

    .callout-box.danger {
      background: #FEF2F2;
      border-color: #FECACA;
      border-left: 3px solid var(--gc-red);
      color: #991B1B;
    }

    .callout-box.success {
      background: #F0FDF4;
      border-color: #BBF7D0;
      border-left: 3px solid var(--gc-green);
      color: #166534;
    }

    .callout-box.warning {
      background: #FFFBEB;
      border-color: #FDE68A;
      border-left: 3px solid var(--gc-yellow);
      color: #92400E;
    }

    .callout-title {
      font-weight: 700;
      font-size: 8.2pt;
      margin-bottom: 2px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    ol.steps-list {
      margin-left: 16px;
      margin-top: 4px;
      margin-bottom: 4px;
    }

    ol.steps-list li {
      margin-bottom: 3px;
      padding-left: 2px;
      font-size: 7.8pt;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin: 6px 0;
    }

    .feature-card {
      background: var(--bg-soft);
      border: 1px solid var(--border);
      border-radius: 5px;
      padding: 6px 8px;
    }

    .feature-card .feat-icon { font-size: 9pt; margin-bottom: 1px; }
    .feature-card .feat-title { font-size: 7.5pt; font-weight: 700; color: #0F172A; }
    .feature-card .feat-desc { font-size: 6.8pt; color: #64748B; line-height: 1.25; }

    .resource-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin: 6px 0;
    }

    .resource-box {
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 8px 10px;
      background: #F8FAFC;
    }

    .resource-box h4 {
      font-size: 8pt;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 1px;
    }

    .resource-box p {
      font-size: 7pt;
      color: #64748B;
      margin-bottom: 4px;
    }

    .resource-box a {
      font-size: 7.5pt;
      color: var(--gc-blue);
      font-weight: 600;
      text-decoration: underline;
    }

    table.badges-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      font-size: 7.8pt;
    }

    table.badges-table th {
      background: #F1F5F9;
      color: #334155;
      font-family: 'Google Sans', 'Inter', sans-serif;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 6.8pt;
      letter-spacing: 0.04em;
      padding: 6px 8px;
      text-align: left;
      border-bottom: 2px solid #CBD5E1;
    }

    table.badges-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #E2E8F0;
      vertical-align: middle;
    }

    table.badges-table tr:nth-child(even) { background: #F8FAFC; }

    .badge-id {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      color: #64748B;
      font-size: 7pt;
    }

    .badge-name { font-weight: 600; color: #0F172A; font-size: 8pt; }
    .badge-desc { font-size: 6.8pt; color: #64748B; margin-top: 1px; line-height: 1.25; }

    .badge-category-tag {
      display: inline-block;
      font-size: 6pt;
      font-weight: 700;
      text-transform: uppercase;
      padding: 1px 5px;
      border-radius: 3px;
    }

    .tag-infra { background: #E0F2FE; color: #0369A1; }
    .tag-security { background: #FEE2E2; color: #B91C1C; }
    .tag-ai { background: #FEF3C7; color: #B45309; }
    .tag-data { background: #DCFCE7; color: #15803D; }

    .credits-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 6.8pt;
      font-weight: 700;
      color: #475569;
      background: #F1F5F9;
      padding: 2px 5px;
      border-radius: 3px;
      white-space: nowrap;
    }

    .credits-tag.free { background: #DCFCE7; color: #15803D; }
    .link-btn { color: #1A73E8; text-decoration: underline; font-weight: 600; font-size: 7.2pt; }

    .handbook-footer {
      border-top: 1px solid #CBD5E1;
      padding-top: 8px;
      margin-top: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 7pt;
      color: #64748B;
    }
  </style>
</head>
<body>

  <!-- PAGE 1: Overview, Quest 1, Quest 2, and Quest 3 Introduction -->
  <div class="page">
    <div class="header-banner">
      <span class="badge-super">Official Student Handbook & Challenge Guide</span>
      <h1>Google Cloud: Learn with Communities 2026</h1>
      <p class="header-subtitle">
        A step-by-step roadmap to completing the challenge labs, claiming your 200 cloud credits, 
        earning all 10 Skill Badges, and fulfilling the community milestone criteria.
      </p>

      <div class="header-meta-grid">
        <div class="meta-item">
          <span class="label">Chapter</span>
          <span class="value">GDG on Campus MCET</span>
        </div>
        <div class="meta-item">
          <span class="label">Referral Code</span>
          <span class="value">GDGC-MCETH</span>
        </div>
        <div class="meta-item">
          <span class="label">Curriculum Scope</span>
          <span class="value">10 Skill Badges</span>
        </div>
        <div class="meta-item">
          <span class="label">Challenge Deadline</span>
          <span class="value">15 Nov 2026 23:59 IST</span>
        </div>
      </div>
    </div>

    <!-- Quest 1 -->
    <div class="quest-section">
      <div class="quest-header">
        <div class="quest-title-wrap">
          <div class="quest-number">1</div>
          <h2>Quest 1: The Induction (Registration & Account Setup)</h2>
        </div>
        <span class="quest-badge closed">Registrations Closed</span>
      </div>

      <div class="features-grid">
        <div class="feature-card">
          <div class="feat-icon">☁️</div>
          <div class="feat-title">Practical Skills</div>
          <div class="feat-desc">Hands-on training in Compute, Security, Storage & Gemini.</div>
        </div>
        <div class="feature-card">
          <div class="feat-icon">🧪</div>
          <div class="feat-title">Interactive Labs</div>
          <div class="feat-desc">Real cloud console environments without local setup.</div>
        </div>
        <div class="feature-card">
          <div class="feat-icon">🏆</div>
          <div class="feat-title">Verifiable Badges</div>
          <div class="feat-desc">Official Google Cloud Skill Badges for your profile.</div>
        </div>
        <div class="feature-card">
          <div class="feat-icon">🎁</div>
          <div class="feat-title">Swag Milestones</div>
          <div class="feat-desc">Unlock physical goodies and campus recognition.</div>
        </div>
      </div>

      <div class="callout-box">
        <div class="callout-title">📝 Registration Summary (Archived Reference)</div>
        <ol class="steps-list">
          <li><strong>Skills Boost Account:</strong> Visited <a href="https://www.skills.google/" style="color: #1A73E8;">skills.google</a> and registered with primary Google account.</li>
          <li><strong>Public Profile URL:</strong> Set profile to <strong>Public</strong> to allow automated periodic progress verification.</li>
          <li><strong>Campus Referral:</strong> Enrolled students registered with chapter referral code <strong>GDGC-MCETH</strong>.</li>
        </ol>
        <div style="font-size: 7.2pt; color: #64748B; margin-top: 2px;">
          Setup Walkthrough Video: <a href="https://youtu.be/o0nYT08DI64?si=No2w6Su0-PsBz2J-" style="color: #1A73E8;">YouTube Account Setup Guide</a>
        </div>
      </div>
    </div>

    <!-- Quest 2 -->
    <div class="quest-section">
      <div class="quest-header">
        <div class="quest-title-wrap">
          <div class="quest-number green">2</div>
          <h2>Quest 2: Fuel The Forge (Redeem Your 200 Cloud Credits)</h2>
        </div>
        <span class="quest-badge ready">Essential Step</span>
      </div>

      <div class="callout-box success">
        <div class="callout-title">💰 Credit Redemption Walkthrough</div>
        <ol class="steps-list">
          <li><strong>Check Email:</strong> Open your registered email inbox for the access code email from Google Cloud.</li>
          <li><strong>Sign In:</strong> Log into <a href="https://www.skills.google/" style="color: #1A73E8;">skills.google</a> with your registered Google account.</li>
          <li><strong>Redeem Code:</strong> Input your unique 200 credits access code into the redemption portal.</li>
          <li><strong>Verify Balance:</strong> Check that your profile reflects 200 credits available to launch labs.</li>
        </ol>
        <div style="font-size: 7.2pt; margin-top: 2px;">
          ▶️ Walkthrough Video: <a href="https://youtu.be/WVdUW1wJwyI?si=NsEKp-8ENY9ahKAh" style="color: #1A73E8; font-weight: 600;">How to Redeem Your Credits on YouTube</a>
        </div>
      </div>
    </div>

    <!-- Quest 3 Intro -->
    <div class="quest-section">
      <div class="quest-header">
        <div class="quest-title-wrap">
          <div class="quest-number purple">3</div>
          <h2>Quest 3: The Gauntlet (Conquer the 10 Challenge Labs)</h2>
        </div>
        <span class="quest-badge active">Active Objective</span>
      </div>

      <div class="callout-box danger">
        <div class="callout-title">🔴 CRUCIAL GOLDEN RULE FOR COMPLETION</div>
        <p style="font-size: 8pt; line-height: 1.35;">
          <strong>You ONLY need to complete the final Challenge Lab for each skill badge course!</strong><br />
          You do not need to sit through all the practice readings or preliminary labs. Passing the final assessment Challenge Lab in each module triggers immediate issuance of the verifiable Google Cloud Skill Badge on your public profile. Repeat for all 10 badges to achieve Milestone 3!
        </p>
      </div>

      <div class="resource-row">
        <div class="resource-box">
          <h4>▶️ Step-by-Step Lab Playlist</h4>
          <p>Official student video walkthroughs demonstrating how to clear each lab successfully:</p>
          <a href="https://youtube.com/playlist?list=PLNPCsw6Vr8qk&si=hPyt2sJ1jq7jvpU3">Open Lab Solutions Playlist on YouTube</a>
        </div>
        <div class="resource-box">
          <h4>📊 Official Curriculum Spreadsheet</h4>
          <p>Live spreadsheet tracking course template IDs and challenge lab names:</p>
          <a href="https://docs.google.com/spreadsheets/d/e/2PACX-1vTVMEFW24yi5IVcBblZFEK5xMdQyeF9pndf-wxE37BKu5hyOghhSkYiCHW6rSLjNJd5U3OI_E_I9vZi/pubhtml?gid=411469390&single=true">View Curriculum Spreadsheet</a>
        </div>
      </div>
    </div>
  </div>

  <!-- PAGE 2: Complete 10 Skill Badges Catalog Table & Milestones -->
  <div class="page">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
      <h2>🎖️ Complete 10 Skill Badges Catalog & Lab Direct Links</h2>
      <span style="font-size: 7.5pt; font-family: 'JetBrains Mono', monospace; color: #64748B;">All 10 Labs Required for Milestone 3</span>
    </div>
    <p style="font-size: 7.8pt; color: #475569; margin-bottom: 8px;">
      Click any course link below to open the official lab module on Google Cloud Skills Boost. Clear the final challenge lab in each module.
    </p>

    <table class="badges-table">
      <thead>
        <tr>
          <th style="width: 5%;">#</th>
          <th style="width: 14%;">Domain</th>
          <th style="width: 38%;">Skill Badge Course Name</th>
          <th style="width: 10%;">Cost</th>
          <th style="width: 33%;">Direct Lab Link</th>
        </tr>
      </thead>
      <tbody>
        ${skillBadges.map(badge => `
          <tr>
            <td class="badge-id">#${String(badge.id).padStart(2, '0')}</td>
            <td>
              <span class="badge-category-tag tag-${badge.category}">${badge.categoryLabel}</span>
            </td>
            <td>
              <div class="badge-name">${badge.name}</div>
              <div class="badge-desc">${badge.description}</div>
            </td>
            <td>
              <span class="credits-tag ${badge.credits === 0 ? 'free' : ''}">
                ${badge.credits === 0 ? 'Free (0)' : `${badge.credits} Credits`}
              </span>
            </td>
            <td>
              <a href="${badge.url}" class="link-btn">${badge.url.replace('https://www.', '')}</a>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Milestones & FAQ Section -->
    <div style="margin-top: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
      <div class="callout-box warning" style="margin: 0;">
        <div class="callout-title">🎁 Milestone Swag Thresholds</div>
        <ul style="margin-left: 14px; margin-top: 3px; font-size: 7.5pt; line-height: 1.35;">
          <li><strong>Milestone 1:</strong> 4 Skill Badges completed.</li>
          <li><strong>Milestone 2:</strong> 7 Skill Badges completed.</li>
          <li><strong>Milestone 3 (Apex):</strong> All 10 Skill Badges completed.</li>
          <li><strong>GEAR Bonus:</strong> 1 Google Cloud Arcade Digital Badge.</li>
        </ul>
      </div>

      <div class="callout-box" style="margin: 0;">
        <div class="callout-title">⚠️ Essential Verification Checklist</div>
        <ul style="margin-left: 14px; margin-top: 3px; font-size: 7.5pt; line-height: 1.35;">
          <li>Keep your Google Skills Boost profile set to <strong>Public</strong>.</li>
          <li>Confirm each badge displays a checkmark under your earned badges.</li>
          <li>Final deadline to complete all labs: <strong>15 Nov 2026, 23:59:59 IST</strong>.</li>
          <li>Check chapter rankings on the official community leaderboard.</li>
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <div class="handbook-footer">
      <div>
        <strong>GDG on Campus MCET</strong> | Methodist College of Engineering & Technology, Hyderabad
      </div>
      <div>
        Dashboard: <a href="https://gdgc-mcet.github.io/gc-lwc-2026-dashboard/">gc-lwc-2026-dashboard</a>
      </div>
    </div>
  </div>

</body>
</html>
`;

const tempHtmlPath = path.resolve('scratch_guide_tight.html');
fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');

const publicPdfPath = path.resolve('public', 'Google-Cloud-LwC-2026-Guide.pdf');
const rootPdfPath = path.resolve('Google-Cloud-LwC-2026-Guide.pdf');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

console.log('Generating compact 2-page Guide PDF via Headless Chrome...');
execSync(`"${chromePath}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${publicPdfPath}" "${tempHtmlPath}"`);

fs.copyFileSync(publicPdfPath, rootPdfPath);

if (fs.existsSync(tempHtmlPath)) {
  fs.unlinkSync(tempHtmlPath);
}

const stats = fs.statSync(publicPdfPath);
console.log(`Successfully created 2-page PDF!`);
console.log(`- Path 1: ${publicPdfPath} (${Math.round(stats.size / 1024)} KB)`);
console.log(`- Path 2: ${rootPdfPath} (${Math.round(stats.size / 1024)} KB)`);
