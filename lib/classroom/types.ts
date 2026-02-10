/**
 * Classroom Mode Types
 *
 * Types for the classroom system where teachers create classes,
 * students join with codes, and progress is tracked.
 */

// ============================================================================
// Core Types
// ============================================================================

export interface Classroom {
  id: string;
  name: string;
  description: string | null;
  join_code: string;
  teacher_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  settings: ClassroomSettings;
}

export interface ClassroomSettings {
  // Future extensibility: grade level, subject, etc.
  [key: string]: unknown;
}

// Classroom with joined data (for display)
export interface ClassroomWithDetails extends Classroom {
  teacher?: TeacherInfo;
  enrollment_count?: number;
  assignment_count?: number;
}

export interface TeacherInfo {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

// ============================================================================
// Enrollment Types
// ============================================================================

export type EnrollmentStatus = 'active' | 'removed' | 'left';

export interface ClassroomEnrollment {
  id: string;
  classroom_id: string;
  student_id: string;
  enrolled_at: string;
  status: EnrollmentStatus;
}

export interface EnrollmentWithStudent extends ClassroomEnrollment {
  student: StudentInfo;
}

export interface StudentInfo {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

// ============================================================================
// Assignment Types
// ============================================================================

export type AssignmentContentType = 'category' | 'card_set' | 'song' | 'book_unit';

export interface ClassroomAssignment {
  id: string;
  classroom_id: string;
  title: string;
  description: string | null;
  content_type: AssignmentContentType;
  content_ids: string[];
  due_date: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  sort_order: number;
}

export interface AssignmentWithStats extends ClassroomAssignment {
  total_students: number;
  completed_count: number;
  completion_percentage: number;
}

// ============================================================================
// Progress Types
// ============================================================================

export interface ClassroomProgress {
  id: string;
  assignment_id: string;
  student_id: string;
  content_id: string;
  completed_at: string | null;
  progress_data: ProgressData;
  updated_at: string;
}

export interface ProgressData {
  views?: number;
  mastery_level?: number;
  time_spent_seconds?: number;
  // Extensible for future metrics
  [key: string]: unknown;
}

export interface StudentProgressSummary {
  student_id: string;
  student: StudentInfo;
  items_completed: number;
  total_items: number;
  completion_percentage: number;
  last_activity: string | null;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateClassroomRequest {
  name: string;
  description?: string;
}

export interface JoinClassroomRequest {
  join_code: string;
}

export interface CreateAssignmentRequest {
  title: string;
  description?: string;
  content_type: AssignmentContentType;
  content_ids: string[];
  due_date?: string;
}

export interface RecordProgressRequest {
  assignment_id: string;
  content_id: string;
  completed?: boolean;
  progress_data?: Partial<ProgressData>;
}

// ============================================================================
// View Types (for UI)
// ============================================================================

export type ClassroomRole = 'teacher' | 'student';

export interface ClassroomViewContext {
  classroom: ClassroomWithDetails;
  role: ClassroomRole;
  isTeacher: boolean;
}

// Content for assignment picker
export interface ContentOption {
  id: string;
  label: string;
  description?: string;
  imageUrl?: string;
  cardCount?: number; // For categories
}

// ============================================================================
// Constants
// ============================================================================

export const CONTENT_TYPE_LABELS: Record<AssignmentContentType, string> = {
  category: 'Category',
  card_set: 'Card Set',
  song: 'Song',
  book_unit: 'Book Unit',
};

export const CONTENT_TYPE_ICONS: Record<AssignmentContentType, string> = {
  category: 'FolderOpen',
  card_set: 'Layers',
  song: 'Music',
  book_unit: 'BookOpen',
};
