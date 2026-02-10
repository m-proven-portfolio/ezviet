/**
 * LRC Voting System
 *
 * Aggregates community feedback to:
 * - Prioritize songs needing review
 * - Detect timing accuracy issues
 * - Fast-track high-consensus edits
 */

export type VoteType = 'accurate' | 'inaccurate' | 'edit';

export type Urgency = 'low' | 'medium' | 'high' | 'critical';

export interface Vote {
  vote_type: VoteType;
  created_at: string;
}

export interface VoteAggregation {
  songId: string;
  totalVotes: number;
  accurateVotes: number;
  inaccurateVotes: number;
  editVotes: number;
  accuracyRatio: number; // 0-1, higher = more accurate votes
  needsReview: boolean;
  urgency: Urgency;
}

// ============================================================================
// Thresholds
// ============================================================================

export const VOTE_THRESHOLDS = {
  // Minimum votes before we consider the data reliable
  MIN_VOTES_FOR_ACTION: 5,

  // If more than 25% vote "inaccurate", flag for review
  INACCURATE_RATIO_WARNING: 0.25,

  // If more than 40% vote "inaccurate", urgent review needed
  INACCURATE_RATIO_URGENT: 0.4,

  // If more than 50% vote "inaccurate", critical - consider priority review
  INACCURATE_RATIO_CRITICAL: 0.5,

  // Only count votes from last 30 days
  VOTE_DECAY_DAYS: 30,

  // Weight recent votes more heavily
  RECENT_VOTE_DAYS: 7,
  RECENT_VOTE_WEIGHT: 2.0,
  OLD_VOTE_WEIGHT: 1.0,
} as const;

// ============================================================================
// Vote Aggregation
// ============================================================================

/**
 * Aggregate votes for a song with time-weighted scoring
 *
 * Recent votes (< 7 days) are weighted 2x to reflect current LRC quality
 */
export function aggregateVotes(songId: string, votes: Vote[]): VoteAggregation {
  if (votes.length === 0) {
    return {
      songId,
      totalVotes: 0,
      accurateVotes: 0,
      inaccurateVotes: 0,
      editVotes: 0,
      accuracyRatio: 1, // No votes = assume accurate
      needsReview: false,
      urgency: 'low',
    };
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - VOTE_THRESHOLDS.RECENT_VOTE_DAYS * 24 * 60 * 60 * 1000);

  let weightedAccurate = 0;
  let weightedInaccurate = 0;
  let editCount = 0;
  let accurateCount = 0;
  let inaccurateCount = 0;

  for (const vote of votes) {
    const voteDate = new Date(vote.created_at);
    const weight =
      voteDate > sevenDaysAgo
        ? VOTE_THRESHOLDS.RECENT_VOTE_WEIGHT
        : VOTE_THRESHOLDS.OLD_VOTE_WEIGHT;

    switch (vote.vote_type) {
      case 'accurate':
        weightedAccurate += weight;
        accurateCount++;
        break;
      case 'inaccurate':
        weightedInaccurate += weight;
        inaccurateCount++;
        break;
      case 'edit':
        editCount++;
        // Edit votes also count as implicit "needs improvement"
        weightedInaccurate += weight * 0.5;
        break;
    }
  }

  const totalWeighted = weightedAccurate + weightedInaccurate;
  const inaccurateRatio = totalWeighted > 0 ? weightedInaccurate / totalWeighted : 0;
  const accuracyRatio = 1 - inaccurateRatio;

  // Determine urgency
  const hasEnoughVotes = votes.length >= VOTE_THRESHOLDS.MIN_VOTES_FOR_ACTION;
  let urgency: Urgency = 'low';

  if (hasEnoughVotes) {
    if (inaccurateRatio >= VOTE_THRESHOLDS.INACCURATE_RATIO_CRITICAL) {
      urgency = 'critical';
    } else if (inaccurateRatio >= VOTE_THRESHOLDS.INACCURATE_RATIO_URGENT) {
      urgency = 'high';
    } else if (inaccurateRatio >= VOTE_THRESHOLDS.INACCURATE_RATIO_WARNING) {
      urgency = 'medium';
    }
  }

  return {
    songId,
    totalVotes: votes.length,
    accurateVotes: accurateCount,
    inaccurateVotes: inaccurateCount,
    editVotes: editCount,
    accuracyRatio,
    needsReview: hasEnoughVotes && inaccurateRatio >= VOTE_THRESHOLDS.INACCURATE_RATIO_WARNING,
    urgency,
  };
}

// ============================================================================
// Review Queue Priority
// ============================================================================

export interface PriorityParams {
  linesChanged: number;
  averageDeltaMagnitude: number;
  songPlayCount: number;
  negativeVoteRatio: number;
  submitterTrustScore: number;
}

/**
 * Calculate priority score for review queue
 *
 * Higher score = more urgent review needed
 * Range: 0-100
 */
export function calculatePriorityScore(params: PriorityParams): number {
  const {
    linesChanged,
    averageDeltaMagnitude,
    songPlayCount,
    negativeVoteRatio,
    submitterTrustScore,
  } = params;

  let score = 0;

  // More lines changed = higher impact (max 25 points)
  score += Math.min(linesChanged * 2.5, 25);

  // Bigger timing changes = higher impact (max 20 points)
  score += Math.min(averageDeltaMagnitude * 10, 20);

  // Popular songs get priority (max 15 points)
  // Using log scale for play count
  score += Math.min(Math.log10(songPlayCount + 1) * 5, 15);

  // High negative vote ratio = urgent (max 25 points)
  if (negativeVoteRatio >= 0.5) {
    score += 25;
  } else if (negativeVoteRatio >= 0.4) {
    score += 20;
  } else if (negativeVoteRatio >= 0.3) {
    score += 15;
  } else if (negativeVoteRatio >= 0.2) {
    score += 10;
  }

  // Lower trust = needs more scrutiny (max 15 points)
  // High trust submitters get lower priority (faster auto-approve path)
  score += Math.round((1 - submitterTrustScore) * 15);

  return Math.min(Math.round(score), 100);
}

// ============================================================================
// Fast-Track Detection
// ============================================================================

export interface FastTrackParams {
  editSubmissionVotes: number;
  positiveVotes: number;
  submitterTrustScore: number;
}

/**
 * Determine if an edit should be fast-tracked (high community agreement)
 *
 * Fast-track when:
 * - At least 3 community votes on the edit
 * - 80%+ positive votes
 * - Submitter trust score > 0.6
 */
export function shouldFastTrack(params: FastTrackParams): boolean {
  const { editSubmissionVotes, positiveVotes, submitterTrustScore } = params;

  // Need at least 3 votes
  if (editSubmissionVotes < 3) return false;

  // 80%+ positive votes
  if (positiveVotes / editSubmissionVotes < 0.8) return false;

  // Submitter trust score > 0.6
  if (submitterTrustScore < 0.6) return false;

  return true;
}

// ============================================================================
// Song Health Score
// ============================================================================

export interface SongHealthScore {
  score: number; // 0-100, higher = healthier
  status: 'excellent' | 'good' | 'needs_attention' | 'critical';
  factors: {
    voteRatio: number;
    recentActivity: boolean;
    pendingEdits: number;
  };
}

/**
 * Calculate overall health score for a song's LRC
 *
 * Useful for dashboards and identifying songs needing attention
 */
export function calculateSongHealth(params: {
  aggregation: VoteAggregation;
  pendingEditCount: number;
  lastEditDate?: Date;
}): SongHealthScore {
  const { aggregation, pendingEditCount, lastEditDate } = params;

  // Start at 100 and subtract for issues
  let score = 100;

  // Subtract for low accuracy ratio (max -40)
  score -= Math.round((1 - aggregation.accuracyRatio) * 40);

  // Subtract for pending edits (max -20)
  score -= Math.min(pendingEditCount * 5, 20);

  // Bonus for recent activity (editing attention)
  const hasRecentActivity =
    lastEditDate !== undefined &&
    Date.now() - lastEditDate.getTime() < 7 * 24 * 60 * 60 * 1000;

  // Subtract for critical/high urgency (max -30)
  if (aggregation.urgency === 'critical') {
    score -= 30;
  } else if (aggregation.urgency === 'high') {
    score -= 20;
  } else if (aggregation.urgency === 'medium') {
    score -= 10;
  }

  score = Math.max(0, Math.min(100, score));

  let status: SongHealthScore['status'];
  if (score >= 80) {
    status = 'excellent';
  } else if (score >= 60) {
    status = 'good';
  } else if (score >= 40) {
    status = 'needs_attention';
  } else {
    status = 'critical';
  }

  return {
    score,
    status,
    factors: {
      voteRatio: aggregation.accuracyRatio,
      recentActivity: hasRecentActivity,
      pendingEdits: pendingEditCount,
    },
  };
}
