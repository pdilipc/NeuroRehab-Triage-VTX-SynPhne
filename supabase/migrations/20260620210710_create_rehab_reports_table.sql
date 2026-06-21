CREATE TABLE IF NOT EXISTS rehab_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id text NOT NULL,
  session_date timestamptz NOT NULL,
  session_number integer NOT NULL,
  fhir_diagnostic_report_id text,
  fhir_document_reference_id text,
  pdf_url text,
  emg_supinator numeric(4,2),
  emg_pronator numeric(4,2),
  emg_thumb numeric(4,2),
  emg_wrist_extensor numeric(4,2),
  emg_wrist_flexor numeric(4,2),
  emg_finger_extensor numeric(4,2),
  emg_finger_flexor numeric(4,2),
  eeg_brain_symmetry_pre numeric(6,4),
  eeg_brain_symmetry_post numeric(6,4),
  eeg_attention_response_index numeric(6,4),
  eeg_smiley_index numeric(5,2),
  eeg_relative_alpha_pre numeric(6,4),
  eeg_relative_alpha_post numeric(6,4),
  eeg_dar numeric(6,4),
  eeg_alpha_asymmetry numeric(6,4),
  eeg_total_power_asymmetry numeric(6,4),
  clinical_recommendations text,
  trainer_name text,
  condition text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_rehab_reports_patient ON rehab_reports(patient_id);
CREATE INDEX idx_rehab_reports_date ON rehab_reports(session_date DESC);

ALTER TABLE rehab_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_rehab_reports" ON rehab_reports FOR SELECT TO public USING (true);
CREATE POLICY "insert_rehab_reports" ON rehab_reports FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "update_rehab_reports" ON rehab_reports FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "delete_rehab_reports" ON rehab_reports FOR DELETE TO public USING (true);
