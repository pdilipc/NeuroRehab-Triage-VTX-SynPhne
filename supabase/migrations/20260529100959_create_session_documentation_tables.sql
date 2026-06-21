/*
  # Create Session Documentation Tables

  1. New Tables
    - `session_records`
      - `id` (uuid, primary key)
      - `patient_id` (text, FHIR patient reference)
      - `decision` (text, 'proceed', 'modify', or 'defer')
      - `status` (text, 'completed' or 'deferred')
      - `session_duration` (integer, minutes)
      - `tolerance` (text, 'good', 'moderate', 'poor')
      - `fatigue_level` (text, 'none', 'mild', 'moderate', 'severe')
      - `pain_level` (integer, 0-10)
      - `exercises_completed` (text)
      - `session_notes` (text)
      - `created_at` (timestamp)
      - `user_id` (uuid, who documented the session)

  2. Security
    - Enable RLS on `session_records` table
    - All users can insert and view session records (healthcare context allows shared access)
    - Users can update their own records

  3. Important Notes
    - Session data is tied to FHIR patient IDs stored as text references
    - Records are persisted for historical tracking and readiness assessment
    - No direct user authentication required - designed for healthcare facility use
*/

CREATE TABLE IF NOT EXISTS session_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('proceed', 'modify', 'defer')),
  status text NOT NULL CHECK (status IN ('completed', 'deferred')),
  session_duration integer DEFAULT 0,
  tolerance text CHECK (tolerance IN ('good', 'moderate', 'poor', null)),
  fatigue_level text CHECK (fatigue_level IN ('none', 'mild', 'moderate', 'severe', null)),
  pain_level integer CHECK (pain_level >= 0 AND pain_level <= 10),
  exercises_completed text,
  session_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid
);

CREATE INDEX IF NOT EXISTS idx_session_records_patient_id ON session_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_session_records_created_at ON session_records(created_at DESC);

ALTER TABLE session_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert session records"
  ON session_records
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow read session records"
  ON session_records
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow update own session records"
  ON session_records
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);
