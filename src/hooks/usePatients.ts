import { useState, useEffect } from 'react';
import { fhirService } from '../services/fhir.service';
import { sessionService } from '../services/session.service';
import { rehabReportsService, RehabReport } from '../services/rehab-reports.service';

// Cache for patient data
const patientCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function usePatients(searchQuery?: string, page: number = 1, pageSize: number = 20) {
  const [patients, setPatients] = useState<fhir.Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        setError(null);

        const bundle = await fhirService.getPatients({
          name: searchQuery,
          _count: pageSize,
          _offset: (page - 1) * pageSize,
        });

        const patientList = bundle.entry
          ?.map((entry: { resource?: fhir.Resource }) => entry.resource as fhir.Patient)
          .filter(Boolean) || [];

        setPatients(patientList);
        setTotalCount(bundle.total || patientList.length);
        setHasMore(patientList.length === pageSize);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch patients');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [searchQuery, page, pageSize]);

  return { patients, loading, error, totalCount, hasMore };
}

export function usePatient(patientId: string) {
  const [patient, setPatient] = useState<fhir.Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatient = async () => {
      // Check cache first
      const cached = patientCache.get(`patient-${patientId}`);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setPatient(cached.data as fhir.Patient);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await fhirService.getPatient(patientId);
        setPatient(data);

        // Cache the result
        patientCache.set(`patient-${patientId}`, { data, timestamp: Date.now() });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch patient');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchPatient();
    }
  }, [patientId]);

  return { patient, loading, error };
}

export function useObservations(patientId: string, category?: string, code?: string) {
  const [observations, setObservations] = useState<fhir.Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchObservations = async () => {
      // Check cache
      const cacheKey = `obs-${patientId}-${category || 'all'}-${code || 'all'}`;
      const cached = patientCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setObservations(cached.data as fhir.Observation[]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const bundle = await fhirService.getObservations(patientId, category, code);

        const observationList = bundle.entry
          ?.map((entry: { resource?: fhir.Resource }) => entry.resource as fhir.Observation)
          .filter(Boolean) || [];

        setObservations(observationList);

        // Cache the result
        patientCache.set(cacheKey, { data: observationList, timestamp: Date.now() });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch observations');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchObservations();
    }
  }, [patientId, category, code]);

  return { observations, loading, error };
}

export function useNeuroRehabPatients(page: number = 1, pageSize: number = 20) {
  const [patients, setPatients] = useState<fhir.Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchNeuroRehabPatients = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use FHIR's built-in filtering capability to get patients with specific observations
        // First, get observations with Fugl-Meyer code (97711-6)
        const obsBundle = await fhirService.getObservations(
          undefined, // all patients
          undefined,
          '97711-6'  // Fugl-Meyer LOINC code
        );

        // Extract unique patient IDs from observations
        const patientIds = new Set<string>();
        if (obsBundle.entry) {
          for (const entry of obsBundle.entry) {
            const obs = entry.resource as fhir.Observation;
            if (obs.subject?.reference) {
              const patientId = obs.subject.reference.replace('Patient/', '');
              patientIds.add(patientId);
            }
          }
        }

        const allPatientIds = Array.from(patientIds);
        setTotalCount(allPatientIds.length);

        // Paginate: fetch only the patients for current page
        const startIndex = (page - 1) * pageSize;
        const pagePatientIds = allPatientIds.slice(startIndex, startIndex + pageSize);

        // Batch fetch patients (instead of individual requests)
        const patientPromises = pagePatientIds.map(async (id) => {
          // Check cache
          const cached = patientCache.get(`patient-${id}`);
          if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data as fhir.Patient;
          }

          const patient = await fhirService.getPatient(id);
          patientCache.set(`patient-${id}`, { data: patient, timestamp: Date.now() });
          return patient;
        });

        const patientsWithFMA = await Promise.all(patientPromises);
        const validPatients = patientsWithFMA.filter(Boolean);

        setPatients(validPatients);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch neuro-rehab patients');
      } finally {
        setLoading(false);
      }
    };

    fetchNeuroRehabPatients();
  }, [page, pageSize]);

  return { patients, loading, error, totalCount };
}

export function useConditions(patientId: string) {
  const [conditions, setConditions] = useState<fhir.Condition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConditions = async () => {
      // Check cache
      const cacheKey = `conditions-${patientId}`;
      const cached = patientCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setConditions(cached.data as fhir.Condition[]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const bundle = await fhirService.getConditions(patientId);

        const conditionList = bundle.entry
          ?.map((entry: { resource?: fhir.Resource }) => entry.resource as fhir.Condition)
          .filter(Boolean) || [];

        setConditions(conditionList);
        patientCache.set(cacheKey, { data: conditionList, timestamp: Date.now() });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch conditions');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchConditions();
    }
  }, [patientId]);

  return { conditions, loading, error };
}

export function useMedications(patientId: string) {
  const [medications, setMedications] = useState<fhir.MedicationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMedications = async () => {
      // Check cache
      const cacheKey = `medications-${patientId}`;
      const cached = patientCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setMedications(cached.data as fhir.MedicationRequest[]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const bundle = await fhirService.getMedications(patientId);

        const medicationList = bundle.entry
          ?.map((entry: { resource?: fhir.Resource }) => entry.resource as fhir.MedicationRequest)
          .filter(Boolean) || [];

        setMedications(medicationList);
        patientCache.set(cacheKey, { data: medicationList, timestamp: Date.now() });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch medications');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchMedications();
    }
  }, [patientId]);

  return { medications, loading, error };
}

export function useRehabReports(patientId: string) {
  const [reports, setReports] = useState<RehabReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    rehabReportsService.getReportsByPatient(patientId)
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [patientId]);

  return { reports, loading };
}

export function useSessionHistory(patientId: string) {
  const [sessions, setSessions] = useState<Array<{
    id: string;
    patient_id: string;
    decision: 'proceed' | 'modify' | 'defer';
    status: 'completed' | 'deferred';
    session_duration?: number;
    tolerance?: string;
    fatigue_level?: string;
    pain_level?: number;
    exercises_completed?: string;
    session_notes?: string;
    created_at?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await sessionService.getSessionsByPatient(patientId);
        setSessions(data as typeof sessions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch session history');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchSessions();
    }
  }, [patientId]);

  return { sessions, loading, error };
}
