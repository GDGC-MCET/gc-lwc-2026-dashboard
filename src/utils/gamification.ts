import skillBadges from '../data/skillBadges.json' with { type: 'json' };
import type { ParticipantProgress } from './csvParser.ts';

export interface PlayerTier {
  id: 'champion' | 'diamond' | 'gold' | 'silver' | 'initiate';
  name: string;
  divisionLabel: string;
  badgeMin: number;
  badgeMax: number;
  icon: string;
  color: string;
  glowColor: string;
  badgeClass: string;
}

export const PLAYER_TIERS: Record<string, PlayerTier> = {
  champion: {
    id: 'champion',
    name: 'Grandmaster Champion',
    divisionLabel: 'Division I • Apex',
    badgeMin: 10,
    badgeMax: 10,
    icon: '👑',
    color: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    badgeClass: 'tier-champion',
  },
  diamond: {
    id: 'diamond',
    name: 'Diamond League',
    divisionLabel: 'Division II • Elite',
    badgeMin: 7,
    badgeMax: 9,
    icon: '💎',
    color: '#06B6D4',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    badgeClass: 'tier-diamond',
  },
  gold: {
    id: 'gold',
    name: 'Gold League',
    divisionLabel: 'Division III • Pro',
    badgeMin: 4,
    badgeMax: 6,
    icon: '🥇',
    color: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    badgeClass: 'tier-gold',
  },
  silver: {
    id: 'silver',
    name: 'Silver Challenger',
    divisionLabel: 'Division IV • Contender',
    badgeMin: 1,
    badgeMax: 3,
    icon: '🥈',
    color: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.35)',
    badgeClass: 'tier-silver',
  },
  initiate: {
    id: 'initiate',
    name: 'Initiate',
    divisionLabel: 'Unranked • Enrolled',
    badgeMin: 0,
    badgeMax: 0,
    icon: '🛡️',
    color: '#64748B',
    glowColor: 'rgba(100, 116, 139, 0.25)',
    badgeClass: 'tier-initiate',
  },
};

export interface PlayerAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'Legendary' | 'Epic' | 'Rare' | 'Common';
  color: string;
}

export interface PlayerBadgeSlot {
  id: number;
  name: string;
  description: string;
  category: string;
  categoryLabel: string;
  credits: number;
  url: string;
  isUnlocked: boolean;
}

export interface PlayerProfileStats {
  participant: ParticipantProgress;
  tier: PlayerTier;
  xp: number;
  level: number;
  completionPct: number;
  badgeSlots: PlayerBadgeSlot[];
  achievements: PlayerAchievement[];
}

/**
 * Determines a participant's tournament tier based on verifiable badge progress.
 */
export function getPlayerTier(badgeCount: number): PlayerTier {
  if (badgeCount >= 10) return PLAYER_TIERS.champion;
  if (badgeCount >= 7) return PLAYER_TIERS.diamond;
  if (badgeCount >= 4) return PLAYER_TIERS.gold;
  if (badgeCount >= 1) return PLAYER_TIERS.silver;
  return PLAYER_TIERS.initiate;
}

/**
 * Computes verifiable XP, Level, Tier, Badge inventory, and Achievements for a participant.
 */
export function getPlayerProfileStats(p: ParticipantProgress): PlayerProfileStats {
  const tier = getPlayerTier(p.skillBadgesCount);

  const hasGear = Boolean(
    p.gearBadges &&
    p.gearBadges.toLowerCase() !== 'not applicable' &&
    p.gearBadges.toLowerCase() !== 'no badge' &&
    p.gearBadges !== '0'
  );

  // Verifiable XP Formula: 100 XP per badge, +50 for GEAR arcade, +25 for redeemed credits
  const xp = (p.skillBadgesCount * 100) + (hasGear ? 50 : 0) + (p.accessCodeRedeemed ? 25 : 0);
  const level = Math.max(1, Math.floor(xp / 100));
  const completionPct = Math.min(100, Math.round((p.skillBadgesCount / 10) * 100));

  // Match the participant's completedBadgeNames against the official 10 curriculum badges
  const completedNormalized = (p.completedBadgeNames || []).map(b => b.trim().toLowerCase());

  const badgeSlots: PlayerBadgeSlot[] = skillBadges.map(badge => {
    const badgeNameNorm = badge.name.trim().toLowerCase();
    const isUnlocked = completedNormalized.some(name => {
      return name === badgeNameNorm ||
        name.includes(badgeNameNorm) ||
        badgeNameNorm.includes(name);
    });

    return {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      category: badge.category,
      categoryLabel: badge.categoryLabel,
      credits: badge.credits,
      url: badge.url,
      isUnlocked,
    };
  });

  // Calculate unlockable achievements
  const achievements: PlayerAchievement[] = [];

  if (p.isComplete) {
    achievements.push({
      id: 'apex_champion',
      name: 'Apex Champion',
      description: 'Conquered all 10 Google Cloud Skill Badges',
      icon: '👑',
      rarity: 'Legendary',
      color: '#10B981',
    });
  }

  if (p.completedAtReport && p.isComplete) {
    achievements.push({
      id: 'pioneer_speedrun',
      name: 'Pioneer Vanguard',
      description: `First cohort completion locked in ${p.completedAtReport} report`,
      icon: '⚡',
      rarity: 'Legendary',
      color: '#F59E0B',
    });
  }

  if (hasGear) {
    achievements.push({
      id: 'gear_operative',
      name: 'GEAR Operative',
      description: 'Completed Google Cloud Arcade & GEAR Digital Badge',
      icon: '⚙️',
      rarity: 'Epic',
      color: '#A855F7',
    });
  }

  if (p.accessCodeRedeemed) {
    achievements.push({
      id: 'fuel_primed',
      name: 'Fuel Primed',
      description: 'Successfully redeemed 200 Google Cloud credits',
      icon: '🎟️',
      rarity: 'Rare',
      color: '#3B82F6',
    });
  }

  if (p.skillBadgesCount >= 1) {
    achievements.push({
      id: 'first_strike',
      name: 'First Strike',
      description: 'Earned first official Google Cloud skill badge',
      icon: '🎯',
      rarity: 'Common',
      color: '#60A5FA',
    });
  }

  return {
    participant: p,
    tier,
    xp,
    level,
    completionPct,
    badgeSlots,
    achievements,
  };
}
