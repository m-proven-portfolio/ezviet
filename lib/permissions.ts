/**
 * Role-based permission system for LRC community editing
 *
 * Three roles with escalating permissions:
 * - user: Can submit edits, vote, view own submissions
 * - moderator: Can review/approve submissions, view queue
 * - admin: Full control, can grant moderator, rollback versions
 */

export type UserRole = 'user' | 'moderator' | 'admin';

export interface UserPermissions {
  // Viewing
  canViewOwnSubmissions: boolean;
  canViewAllSubmissions: boolean;
  canViewReviewQueue: boolean;
  canViewAllVotes: boolean;
  canViewVersionHistory: boolean;

  // Actions
  canSubmitEdits: boolean;
  canVote: boolean;
  canReviewSubmissions: boolean;
  canApproveSubmissions: boolean;
  canMergeToProduction: boolean;

  // Admin-only
  canGrantModerator: boolean;
  canRevokeModerator: boolean;
  canOverrideDecisions: boolean;
  canRollbackVersions: boolean;
}

/**
 * Permission matrix by role
 */
const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  user: {
    canViewOwnSubmissions: true,
    canViewAllSubmissions: false,
    canViewReviewQueue: false,
    canViewAllVotes: false,
    canViewVersionHistory: true, // Transparency

    canSubmitEdits: true,
    canVote: true,
    canReviewSubmissions: false,
    canApproveSubmissions: false,
    canMergeToProduction: false,

    canGrantModerator: false,
    canRevokeModerator: false,
    canOverrideDecisions: false,
    canRollbackVersions: false,
  },

  moderator: {
    canViewOwnSubmissions: true,
    canViewAllSubmissions: true,
    canViewReviewQueue: true,
    canViewAllVotes: true,
    canViewVersionHistory: true,

    canSubmitEdits: true,
    canVote: true,
    canReviewSubmissions: true,
    canApproveSubmissions: true,
    canMergeToProduction: true,

    canGrantModerator: false,
    canRevokeModerator: false,
    canOverrideDecisions: false, // Cannot override admin decisions
    canRollbackVersions: false,
  },

  admin: {
    canViewOwnSubmissions: true,
    canViewAllSubmissions: true,
    canViewReviewQueue: true,
    canViewAllVotes: true,
    canViewVersionHistory: true,

    canSubmitEdits: true,
    canVote: true,
    canReviewSubmissions: true,
    canApproveSubmissions: true,
    canMergeToProduction: true,

    canGrantModerator: true,
    canRevokeModerator: true,
    canOverrideDecisions: true,
    canRollbackVersions: true,
  },
};

/**
 * Profile shape expected by permission functions
 */
export interface ProfileFlags {
  is_admin?: boolean | null;
  is_moderator?: boolean | null;
}

/**
 * Determine user role from profile flags
 */
export function getUserRole(profile: ProfileFlags | null | undefined): UserRole {
  if (!profile) return 'user';
  if (profile.is_admin) return 'admin';
  if (profile.is_moderator) return 'moderator';
  return 'user';
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): UserPermissions {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if a profile has a specific permission
 */
export function hasPermission(
  profile: ProfileFlags | null | undefined,
  permission: keyof UserPermissions
): boolean {
  const role = getUserRole(profile);
  return ROLE_PERMISSIONS[role][permission];
}

/**
 * Check if user is at least a moderator (moderator or admin)
 */
export function isModeratorOrAbove(profile: ProfileFlags | null | undefined): boolean {
  const role = getUserRole(profile);
  return role === 'moderator' || role === 'admin';
}

/**
 * Check if user is admin
 */
export function isAdmin(profile: ProfileFlags | null | undefined): boolean {
  return getUserRole(profile) === 'admin';
}

// ============================================================================
// Auto-Approval Rules
// ============================================================================

export interface AutoApprovalParams {
  submitterTrustScore: number;
  linesChanged: number;
  maxDeltaMagnitude: number; // Largest timing change in seconds
}

/**
 * Determine if an edit submission should be auto-approved
 *
 * Auto-approval is granted when:
 * - User has very high trust (> 0.85)
 * - The change is small (≤5 lines)
 * - Timing changes are minor (< 0.3s difference)
 */
export function shouldAutoApprove(params: AutoApprovalParams): boolean {
  const { submitterTrustScore, linesChanged, maxDeltaMagnitude } = params;

  // Trust score must be very high
  if (submitterTrustScore < 0.85) return false;

  // Only for small changes
  if (linesChanged > 5) return false;

  // Only for minor timing adjustments
  if (maxDeltaMagnitude > 0.3) return false;

  return true;
}

// ============================================================================
// Moderator Eligibility
// ============================================================================

export interface ModeratorEligibility {
  isEligible: boolean;
  reason: string;
  trustScore: number;
  totalPoints: number;
  songsContributed: number;
}

/**
 * Check if a contributor is eligible to become a moderator
 *
 * Requirements:
 * - Trust score ≥ 0.5
 * - At least 500 points
 * - Contributed to at least 10 songs
 */
export function checkModeratorEligibility(contributor: {
  trust_score: number;
  total_points: number;
  songs_synced: number;
}): ModeratorEligibility {
  const { trust_score, total_points, songs_synced } = contributor;

  const checks = [
    { pass: trust_score >= 0.5, reason: 'Trust score must be at least 0.5' },
    { pass: total_points >= 500, reason: 'Must have at least 500 points' },
    { pass: songs_synced >= 10, reason: 'Must have contributed to at least 10 songs' },
  ];

  const failedCheck = checks.find((c) => !c.pass);

  return {
    isEligible: !failedCheck,
    reason: failedCheck?.reason || 'Eligible for moderator role',
    trustScore: trust_score,
    totalPoints: total_points,
    songsContributed: songs_synced,
  };
}
