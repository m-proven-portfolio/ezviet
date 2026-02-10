-- Classroom Mode
-- Teachers create classrooms, students join with codes, track learning progress

-- ============================================
-- JOIN CODE GENERATION FUNCTION
-- ============================================
-- Generates a unique 6-character alphanumeric code
-- Avoids confusing chars: 0/O, 1/I/L

CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CLASSROOMS TABLE
-- ============================================
CREATE TABLE classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  description text,
  join_code varchar(8) UNIQUE NOT NULL DEFAULT generate_join_code(),
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_classrooms_teacher_id ON classrooms(teacher_id);
CREATE INDEX idx_classrooms_join_code ON classrooms(join_code) WHERE is_active = true;

-- ============================================
-- CLASSROOM ENROLLMENTS TABLE
-- ============================================
CREATE TABLE classroom_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  status varchar(20) DEFAULT 'active' CHECK (status IN ('active', 'removed', 'left')),

  UNIQUE(classroom_id, student_id)
);

-- Indexes
CREATE INDEX idx_enrollments_classroom_id ON classroom_enrollments(classroom_id);
CREATE INDEX idx_enrollments_student_id ON classroom_enrollments(student_id);

-- ============================================
-- CLASSROOM ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE classroom_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  description text,
  content_type varchar(50) NOT NULL CHECK (content_type IN ('category', 'card_set', 'song', 'book_unit')),
  content_ids text[] NOT NULL,
  due_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0
);

-- Indexes
CREATE INDEX idx_assignments_classroom_id ON classroom_assignments(classroom_id);
CREATE INDEX idx_assignments_due_date ON classroom_assignments(due_date);

-- ============================================
-- CLASSROOM PROGRESS TABLE
-- ============================================
CREATE TABLE classroom_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES classroom_assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_id varchar(255) NOT NULL,
  completed_at timestamptz,
  progress_data jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),

  UNIQUE(assignment_id, student_id, content_id)
);

-- Indexes
CREATE INDEX idx_progress_assignment_id ON classroom_progress(assignment_id);
CREATE INDEX idx_progress_student_id ON classroom_progress(student_id);
CREATE INDEX idx_progress_completed ON classroom_progress(completed_at) WHERE completed_at IS NOT NULL;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_progress ENABLE ROW LEVEL SECURITY;

-- CLASSROOMS POLICIES

-- Teachers can manage their own classrooms
CREATE POLICY "Teachers can manage own classrooms"
  ON classrooms
  FOR ALL
  USING (teacher_id = auth.uid());

-- Students can view classrooms they're enrolled in
CREATE POLICY "Students can view enrolled classrooms"
  ON classrooms
  FOR SELECT
  USING (
    id IN (
      SELECT classroom_id
      FROM classroom_enrollments
      WHERE student_id = auth.uid() AND status = 'active'
    )
  );

-- Anyone can look up classroom by join code (for joining)
CREATE POLICY "Anyone can lookup by join code"
  ON classrooms
  FOR SELECT
  USING (is_active = true);

-- ENROLLMENTS POLICIES

-- Teachers can view enrollments for their classrooms
CREATE POLICY "Teachers can view classroom enrollments"
  ON classroom_enrollments
  FOR SELECT
  USING (
    classroom_id IN (
      SELECT id FROM classrooms WHERE teacher_id = auth.uid()
    )
  );

-- Teachers can manage enrollments (remove students)
CREATE POLICY "Teachers can manage enrollments"
  ON classroom_enrollments
  FOR ALL
  USING (
    classroom_id IN (
      SELECT id FROM classrooms WHERE teacher_id = auth.uid()
    )
  );

-- Students can view own enrollments
CREATE POLICY "Students can view own enrollments"
  ON classroom_enrollments
  FOR SELECT
  USING (student_id = auth.uid());

-- Students can join classrooms (insert own enrollment)
CREATE POLICY "Students can join classrooms"
  ON classroom_enrollments
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Students can leave classrooms (update own enrollment status)
CREATE POLICY "Students can leave classrooms"
  ON classroom_enrollments
  FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- ASSIGNMENTS POLICIES

-- Teachers can manage assignments for their classrooms
CREATE POLICY "Teachers can manage assignments"
  ON classroom_assignments
  FOR ALL
  USING (
    classroom_id IN (
      SELECT id FROM classrooms WHERE teacher_id = auth.uid()
    )
  );

-- Students can view assignments for enrolled classrooms
CREATE POLICY "Students can view assignments"
  ON classroom_assignments
  FOR SELECT
  USING (
    classroom_id IN (
      SELECT classroom_id
      FROM classroom_enrollments
      WHERE student_id = auth.uid() AND status = 'active'
    )
  );

-- PROGRESS POLICIES

-- Teachers can view progress for their classroom assignments
CREATE POLICY "Teachers can view assignment progress"
  ON classroom_progress
  FOR SELECT
  USING (
    assignment_id IN (
      SELECT a.id
      FROM classroom_assignments a
      JOIN classrooms c ON a.classroom_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- Students can manage own progress
CREATE POLICY "Students can manage own progress"
  ON classroom_progress
  FOR ALL
  USING (student_id = auth.uid());

-- ============================================
-- AUTO-UPDATE TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_classroom_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER classrooms_updated_at
  BEFORE UPDATE ON classrooms
  FOR EACH ROW
  EXECUTE FUNCTION update_classroom_updated_at();

CREATE TRIGGER assignments_updated_at
  BEFORE UPDATE ON classroom_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_classroom_updated_at();

CREATE TRIGGER progress_updated_at
  BEFORE UPDATE ON classroom_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_classroom_updated_at();

-- ============================================
-- HELPER: GET CLASSROOM ENROLLMENT COUNT
-- ============================================
CREATE OR REPLACE FUNCTION get_classroom_enrollment_count(p_classroom_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM classroom_enrollments
    WHERE classroom_id = p_classroom_id AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- HELPER: GET ASSIGNMENT COMPLETION STATS
-- ============================================
CREATE OR REPLACE FUNCTION get_assignment_completion_stats(p_assignment_id uuid)
RETURNS TABLE(
  total_students integer,
  completed_count integer,
  completion_percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(DISTINCT e.student_id)::integer
     FROM classroom_enrollments e
     JOIN classroom_assignments a ON a.classroom_id = e.classroom_id
     WHERE a.id = p_assignment_id AND e.status = 'active') as total_students,
    (SELECT COUNT(DISTINCT p.student_id)::integer
     FROM classroom_progress p
     WHERE p.assignment_id = p_assignment_id AND p.completed_at IS NOT NULL) as completed_count,
    CASE
      WHEN (SELECT COUNT(DISTINCT e.student_id)
            FROM classroom_enrollments e
            JOIN classroom_assignments a ON a.classroom_id = e.classroom_id
            WHERE a.id = p_assignment_id AND e.status = 'active') = 0
      THEN 0
      ELSE ROUND(
        (SELECT COUNT(DISTINCT p.student_id)::numeric
         FROM classroom_progress p
         WHERE p.assignment_id = p_assignment_id AND p.completed_at IS NOT NULL) * 100.0 /
        (SELECT COUNT(DISTINCT e.student_id)::numeric
         FROM classroom_enrollments e
         JOIN classroom_assignments a ON a.classroom_id = e.classroom_id
         WHERE a.id = p_assignment_id AND e.status = 'active'),
        1
      )
    END as completion_percentage;
END;
$$ LANGUAGE plpgsql STABLE;
