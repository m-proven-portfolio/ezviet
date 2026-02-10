/**
 * Classroom Utility Functions
 *
 * Helper functions for classroom operations including join code generation,
 * formatting, and validation.
 */

// ============================================================================
// Join Code Generation
// ============================================================================

/**
 * Characters used for join codes.
 * Excludes confusing chars: 0/O, 1/I/L
 */
const JOIN_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Generates a random 6-character join code.
 * Uses only uppercase letters and numbers, avoiding confusing characters.
 *
 * @returns 6-character alphanumeric code (e.g., "ABC123")
 */
export function generateJoinCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += JOIN_CODE_CHARS.charAt(
      Math.floor(Math.random() * JOIN_CODE_CHARS.length)
    );
  }
  return code;
}

/**
 * Validates a join code format.
 * Must be 6 characters, uppercase alphanumeric.
 *
 * @param code - The code to validate
 * @returns true if valid format
 */
export function isValidJoinCodeFormat(code: string): boolean {
  if (!code || code.length !== 6) return false;
  const upperCode = code.toUpperCase();
  return /^[A-Z0-9]{6}$/.test(upperCode);
}

/**
 * Normalizes a join code for comparison.
 * Converts to uppercase and trims whitespace.
 *
 * @param code - The code to normalize
 * @returns Normalized code
 */
export function normalizeJoinCode(code: string): string {
  return code.trim().toUpperCase();
}

// ============================================================================
// Formatting Helpers
// ============================================================================

/**
 * Formats a join code for display with optional spacing.
 *
 * @param code - The join code
 * @param spaced - Whether to add space in middle (e.g., "ABC 123")
 * @returns Formatted code
 */
export function formatJoinCode(code: string, spaced = false): string {
  const normalized = normalizeJoinCode(code);
  if (spaced && normalized.length === 6) {
    return `${normalized.slice(0, 3)} ${normalized.slice(3)}`;
  }
  return normalized;
}

/**
 * Formats the enrollment count for display.
 *
 * @param count - Number of students
 * @returns Formatted string (e.g., "12 students", "1 student")
 */
export function formatEnrollmentCount(count: number): string {
  return `${count} ${count === 1 ? 'student' : 'students'}`;
}

/**
 * Formats completion percentage for display.
 *
 * @param percentage - Number 0-100
 * @returns Formatted string (e.g., "75%")
 */
export function formatCompletionPercentage(percentage: number): string {
  return `${Math.round(percentage)}%`;
}

/**
 * Formats a due date relative to now.
 *
 * @param dueDate - ISO date string
 * @returns Relative string (e.g., "Due in 3 days", "Overdue by 2 days")
 */
export function formatDueDate(dueDate: string | null): string | null {
  if (!dueDate) return null;

  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return `Overdue by ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'}`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`;
  } else {
    return `Due ${due.toLocaleDateString()}`;
  }
}

// ============================================================================
// Progress Helpers
// ============================================================================

/**
 * Calculates completion percentage from progress items.
 *
 * @param completed - Number of completed items
 * @param total - Total number of items
 * @returns Percentage 0-100
 */
export function calculateCompletionPercentage(
  completed: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Gets a color class based on completion percentage.
 * For Tailwind styling.
 *
 * @param percentage - Completion percentage
 * @returns Tailwind color class
 */
export function getCompletionColorClass(percentage: number): string {
  if (percentage >= 100) return 'text-green-600';
  if (percentage >= 75) return 'text-emerald-600';
  if (percentage >= 50) return 'text-yellow-600';
  if (percentage >= 25) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Gets a background color class based on completion percentage.
 * For progress bars.
 *
 * @param percentage - Completion percentage
 * @returns Tailwind bg color class
 */
export function getCompletionBgClass(percentage: number): string {
  if (percentage >= 100) return 'bg-green-500';
  if (percentage >= 75) return 'bg-emerald-500';
  if (percentage >= 50) return 'bg-yellow-500';
  if (percentage >= 25) return 'bg-orange-500';
  return 'bg-red-500';
}

// ============================================================================
// Sorting & Filtering
// ============================================================================

/**
 * Sorts students by completion (highest first).
 *
 * @param students - Array of students with completion data
 * @returns Sorted array
 */
export function sortByCompletion<T extends { completion_percentage: number }>(
  students: T[]
): T[] {
  return [...students].sort(
    (a, b) => b.completion_percentage - a.completion_percentage
  );
}

/**
 * Sorts students by name alphabetically.
 *
 * @param students - Array of students with display_name
 * @returns Sorted array
 */
export function sortByName<T extends { student: { display_name: string | null } }>(
  students: T[]
): T[] {
  return [...students].sort((a, b) => {
    const nameA = a.student.display_name || '';
    const nameB = b.student.display_name || '';
    return nameA.localeCompare(nameB);
  });
}

// ============================================================================
// URL Helpers
// ============================================================================

/**
 * Generates the shareable join URL for a classroom.
 *
 * @param joinCode - The classroom join code
 * @returns Full URL to join page
 */
export function getJoinUrl(joinCode: string): string {
  // Use relative URL that works in both dev and prod
  return `/classroom/join?code=${normalizeJoinCode(joinCode)}`;
}

/**
 * Generates the classroom detail URL.
 *
 * @param classroomId - The classroom UUID
 * @returns Classroom URL
 */
export function getClassroomUrl(classroomId: string): string {
  return `/classroom/${classroomId}`;
}

/**
 * Generates the assignment detail URL.
 *
 * @param classroomId - The classroom UUID
 * @param assignmentId - The assignment UUID
 * @returns Assignment URL
 */
export function getAssignmentUrl(
  classroomId: string,
  assignmentId: string
): string {
  return `/classroom/${classroomId}/assignments/${assignmentId}`;
}
