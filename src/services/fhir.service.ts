import { FHIR_CONFIG } from '../config/fhir.config';
import { fhirLogger } from './fhir-logger.service';

class FHIRService {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor() {
    this.baseUrl = FHIR_CONFIG.baseUrl;
    this.headers = {
      'Content-Type': 'application/fhir+json',
      'Authorization': `Bearer ${FHIR_CONFIG.bearerToken}`,
    };
  }

  private async fetchFHIR<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const startTime = performance.now();
    const method = options?.method || 'GET';
    const logId = fhirLogger.logRequest(method, endpoint, options?.body ? JSON.parse(options.body as string) : undefined);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.headers,
          ...options?.headers,
        },
      });

      const duration = Math.round(performance.now() - startTime);

      if (!response.ok) {
        const errorText = await response.text();
        fhirLogger.logResponse(method, endpoint, response.status, { error: errorText }, duration, logId);
        throw new Error(`FHIR API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      fhirLogger.logResponse(method, endpoint, response.status, data, duration, logId);
      return data;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      fhirLogger.logError(method, endpoint, error as Error, duration);
      throw error;
    }
  }

  async getPatients(params?: { name?: string; _count?: number; _offset?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.name) searchParams.append('name', params.name);
    if (params?._count) searchParams.append('_count', params._count.toString());
    if (params?._offset) searchParams.append('_offset', params._offset.toString());

    const queryString = searchParams.toString();
    const endpoint = `/Patient${queryString ? `?${queryString}` : ''}`;

    const count = params?._count || 20;
    const offset = params?._offset || 0;
    fhirLogger.logInfo('Fetching patient list', { count, offset, search: params?.name || 'none' });
    return this.fetchFHIR<fhir.Bundle>(endpoint);
  }

  async getPatient(id: string) {
    fhirLogger.logInfo('Fetching patient details', { patientId: id });
    return this.fetchFHIR<fhir.Patient>(`/Patient/${id}`);
  }

  async getObservations(patientId?: string, category?: string, code?: string) {
    const searchParams = new URLSearchParams();
    if (patientId) searchParams.append('patient', patientId);
    if (category) searchParams.append('category', category);
    if (code) searchParams.append('code', code);
    searchParams.append('_sort', '-date');
    searchParams.append('_count', '100');

    fhirLogger.logInfo('Fetching observations', { patientId, category, code, count: 100 });
    return this.fetchFHIR<fhir.Bundle>(`/Observation?${searchParams.toString()}`);
  }

  async getConditions(patientId: string) {
    const searchParams = new URLSearchParams();
    searchParams.append('patient', patientId);
    searchParams.append('_sort', '-date');

    fhirLogger.logInfo('Fetching conditions', { patientId });
    return this.fetchFHIR<fhir.Bundle>(`/Condition?${searchParams.toString()}`);
  }

  async getMedications(patientId: string) {
    const searchParams = new URLSearchParams();
    searchParams.append('patient', patientId);

    fhirLogger.logInfo('Fetching medications', { patientId });
    return this.fetchFHIR<fhir.Bundle>(`/MedicationRequest?${searchParams.toString()}`);
  }

  async getEncounters(patientId: string) {
    const searchParams = new URLSearchParams();
    searchParams.append('patient', patientId);
    searchParams.append('_sort', '-date');

    fhirLogger.logInfo('Fetching encounters', { patientId });
    return this.fetchFHIR<fhir.Bundle>(`/Encounter?${searchParams.toString()}`);
  }

  async createPatient(patient: fhir.Patient) {
    fhirLogger.logInfo('Creating new patient', { patient });
    return this.fetchFHIR<fhir.Patient>('/Patient', {
      method: 'POST',
      body: JSON.stringify(patient),
    });
  }

  async updatePatient(id: string, patient: fhir.Patient) {
    fhirLogger.logInfo('Updating patient', { patientId: id });
    return this.fetchFHIR<fhir.Patient>(`/Patient/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...patient, id }),
    });
  }

  async createObservation(observation: fhir.Observation) {
    fhirLogger.logInfo('Creating observation', { observation });
    return this.fetchFHIR<fhir.Observation>('/Observation', {
      method: 'POST',
      body: JSON.stringify(observation),
    });
  }

  async createProcedure(procedure: fhir.Procedure) {
    fhirLogger.logInfo('Creating procedure', { procedure });
    return this.fetchFHIR<fhir.Procedure>('/Procedure', {
      method: 'POST',
      body: JSON.stringify(procedure),
    });
  }

  async createQuestionnaireResponse(response: fhir.QuestionnaireResponse) {
    fhirLogger.logInfo('Creating questionnaire response', { response });
    return this.fetchFHIR<fhir.QuestionnaireResponse>('/QuestionnaireResponse', {
      method: 'POST',
      body: JSON.stringify(response),
    });
  }

  async createDiagnosticReport(report: fhir.DiagnosticReport) {
    fhirLogger.logInfo('Creating diagnostic report', { report });
    return this.fetchFHIR<fhir.DiagnosticReport>('/DiagnosticReport', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  }

  async createDocumentReference(docRef: fhir.DocumentReference) {
    fhirLogger.logInfo('Creating document reference', { docRef });
    return this.fetchFHIR<fhir.DocumentReference>('/DocumentReference', {
      method: 'POST',
      body: JSON.stringify(docRef),
    });
  }
}

export const fhirService = new FHIRService();
