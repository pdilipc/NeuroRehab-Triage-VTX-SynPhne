import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface SessionRecord {
  id?: string;
  patient_id: string;
  decision: 'proceed' | 'modify' | 'defer';
  status: 'completed' | 'deferred';
  session_duration?: number;
  tolerance?: 'good' | 'moderate' | 'poor';
  fatigue_level?: 'none' | 'mild' | 'moderate' | 'severe';
  pain_level?: number;
  exercises_completed?: string;
  session_notes?: string;
  created_at?: string;
  updated_at?: string;
}

class SessionService {
  async saveSession(record: SessionRecord): Promise<SessionRecord | null> {
    try {
      const { data, error } = await supabase
        .from('session_records')
        .insert([{
          patient_id: record.patient_id,
          decision: record.decision,
          status: record.status,
          session_duration: record.session_duration,
          tolerance: record.tolerance,
          fatigue_level: record.fatigue_level,
          pain_level: record.pain_level,
          exercises_completed: record.exercises_completed,
          session_notes: record.session_notes,
        }])
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to save session:', error);
      return null;
    }
  }

  async getSessionsByPatient(patientId: string): Promise<SessionRecord[]> {
    try {
      const { data, error } = await supabase
        .from('session_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      return [];
    }
  }

  async getLatestSession(patientId: string): Promise<SessionRecord | null> {
    try {
      const { data, error } = await supabase
        .from('session_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch latest session:', error);
      return null;
    }
  }

  async updateSession(id: string, updates: Partial<SessionRecord>): Promise<SessionRecord | null> {
    try {
      const { data, error } = await supabase
        .from('session_records')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to update session:', error);
      return null;
    }
  }
}

export const sessionService = new SessionService();
