import { createClient } from '@supabase/supabase-js';
import { fhirService } from './fhir.service';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface RehabReportData {
  patientId: string;
  patientName: string;
  sessionDate: string;
  sessionNumber: number;
  trainerName?: string;
  condition?: string;
  // EMG body state values: -6 to +1
  emg: {
    supinator: number;
    pronator: number;
    thumb: number;
    wristExtensor: number;
    wristFlexor: number;
    fingerExtensor: number;
    fingerFlexor: number;
  };
  // EEG metrics
  eeg: {
    brainSymmetryPre: number;
    brainSymmetryPost: number;
    attentionResponseIndex: number;
    smileyIndex: number;
    relativeAlphaPre: number;
    relativeAlphaPost: number;
    dar: number;
    alphaAsymmetry: number;
    totalPowerAsymmetry: number;
  };
  clinicalRecommendations: string;
  pdfUrl?: string;
}

export interface RehabReport {
  id: string;
  patient_id: string;
  session_date: string;
  session_number: number;
  trainer_name?: string;
  condition?: string;
  fhir_diagnostic_report_id?: string;
  fhir_document_reference_id?: string;
  pdf_url?: string;
  emg_supinator: number;
  emg_pronator: number;
  emg_thumb: number;
  emg_wrist_extensor: number;
  emg_wrist_flexor: number;
  emg_finger_extensor: number;
  emg_finger_flexor: number;
  eeg_brain_symmetry_pre: number;
  eeg_brain_symmetry_post: number;
  eeg_attention_response_index: number;
  eeg_smiley_index: number;
  eeg_relative_alpha_pre: number;
  eeg_relative_alpha_post: number;
  eeg_dar: number;
  eeg_alpha_asymmetry: number;
  eeg_total_power_asymmetry: number;
  clinical_recommendations: string;
  created_at: string;
}

const EMG_MUSCLES = [
  { key: 'supinator', label: 'Supinator' },
  { key: 'pronator', label: 'Pronator' },
  { key: 'thumb', label: 'Thumb' },
  { key: 'wristExtensor', label: 'Wrist Extensor' },
  { key: 'wristFlexor', label: 'Wrist Flexor' },
  { key: 'fingerExtensor', label: 'Finger Extensor' },
  { key: 'fingerFlexor', label: 'Finger Flexor' },
] as const;

class RehabReportsService {
  async submitReport(data: RehabReportData): Promise<void> {
    const now = data.sessionDate;

    // 1. POST EMG Observations to FHIR
    const observationRefs: string[] = [];

    for (const muscle of EMG_MUSCLES) {
      const value = data.emg[muscle.key as keyof typeof data.emg];
      const obs = await fhirService.createObservation({
        resourceType: 'Observation',
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'therapy',
            display: 'Therapy'
          }]
        }],
        code: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: '251968004',
            display: 'Muscle function assessment'
          }],
          text: `EMG Body State - ${muscle.label}`
        },
        subject: { reference: `Patient/${data.patientId}`, display: data.patientName },
        effectiveDateTime: now,
        valueQuantity: { value, unit: '{body-state}', system: 'http://unitsofmeasure.org', code: '{body-state}' }
      });
      if (obs.id) observationRefs.push(`Observation/${obs.id}`);
    }

    // 2. POST EEG Observations to FHIR
    const eegMetrics = [
      { key: 'brainSymmetryPre', label: 'Brain Symmetry Index (Pre-Session)', value: data.eeg.brainSymmetryPre },
      { key: 'brainSymmetryPost', label: 'Brain Symmetry Index (Post-Session)', value: data.eeg.brainSymmetryPost },
      { key: 'attentionResponseIndex', label: 'Attention Response Index', value: data.eeg.attentionResponseIndex },
      { key: 'smileyIndex', label: 'Smiley Index', value: data.eeg.smileyIndex, unit: '%' },
      { key: 'relativeAlphaPre', label: 'Relative Alpha Power (Pre-Session)', value: data.eeg.relativeAlphaPre },
      { key: 'relativeAlphaPost', label: 'Relative Alpha Power (Post-Session)', value: data.eeg.relativeAlphaPost },
      { key: 'dar', label: 'Delta to Alpha Ratio (DAR)', value: data.eeg.dar },
      { key: 'alphaAsymmetry', label: 'Alpha Asymmetry', value: data.eeg.alphaAsymmetry },
      { key: 'totalPowerAsymmetry', label: 'Total Power Asymmetry', value: data.eeg.totalPowerAsymmetry },
    ];

    for (const metric of eegMetrics) {
      const obs = await fhirService.createObservation({
        resourceType: 'Observation',
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'therapy',
            display: 'Therapy'
          }]
        }],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: 'LP29684-5',
            display: 'EEG Brain activity'
          }],
          text: metric.label
        },
        subject: { reference: `Patient/${data.patientId}`, display: data.patientName },
        effectiveDateTime: now,
        valueQuantity: {
          value: metric.value,
          unit: metric.unit || '{index}',
          system: 'http://unitsofmeasure.org',
          code: metric.unit || '{index}'
        }
      });
      if (obs.id) observationRefs.push(`Observation/${obs.id}`);
    }

    // 3. POST DiagnosticReport to FHIR (system of record)
    const report = await fhirService.createDiagnosticReport({
      resourceType: 'DiagnosticReport',
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
          code: 'PT',
          display: 'Physical Therapy'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '11506-3',
          display: 'Physical Therapy Assessment'
        }],
        text: 'SynPhNe Neurorehabilitation Session Report'
      },
      subject: { reference: `Patient/${data.patientId}`, display: data.patientName },
      effectiveDateTime: now,
      result: observationRefs.map(ref => ({ reference: ref })),
      conclusion: data.clinicalRecommendations,
      ...(data.pdfUrl ? {
        presentedForm: [{
          contentType: 'application/pdf',
          url: data.pdfUrl,
          title: 'SynPhNe Session Report PDF'
        }]
      } : {})
    });

    const diagnosticReportId = report.id;

    // 4. POST DocumentReference for PDF if URL provided
    let documentReferenceId: string | undefined;
    if (data.pdfUrl) {
      const docRef = await fhirService.createDocumentReference({
        resourceType: 'DocumentReference',
        status: 'current',
        type: {
          coding: [{
            system: 'http://loinc.org',
            code: '34117-2',
            display: 'History and physical note'
          }],
          text: 'SynPhNe Rehab Session Report'
        },
        subject: { reference: `Patient/${data.patientId}`, display: data.patientName },
        date: now,
        description: `SynPhNe Session ${data.sessionNumber} - ${data.sessionDate}`,
        content: [{
          attachment: {
            contentType: 'application/pdf',
            url: data.pdfUrl,
            title: `SynPhNe_Session_${data.sessionNumber}_Report.pdf`,
            creation: now
          }
        }],
        context: diagnosticReportId ? {
          related: [{ reference: `DiagnosticReport/${diagnosticReportId}` }]
        } : undefined
      });
      documentReferenceId = docRef.id;
    }

    // 5. Cache in Supabase
    await supabase.from('rehab_reports').insert({
      patient_id: data.patientId,
      session_date: data.sessionDate,
      session_number: data.sessionNumber,
      trainer_name: data.trainerName,
      condition: data.condition,
      fhir_diagnostic_report_id: diagnosticReportId,
      fhir_document_reference_id: documentReferenceId,
      pdf_url: data.pdfUrl,
      emg_supinator: data.emg.supinator,
      emg_pronator: data.emg.pronator,
      emg_thumb: data.emg.thumb,
      emg_wrist_extensor: data.emg.wristExtensor,
      emg_wrist_flexor: data.emg.wristFlexor,
      emg_finger_extensor: data.emg.fingerExtensor,
      emg_finger_flexor: data.emg.fingerFlexor,
      eeg_brain_symmetry_pre: data.eeg.brainSymmetryPre,
      eeg_brain_symmetry_post: data.eeg.brainSymmetryPost,
      eeg_attention_response_index: data.eeg.attentionResponseIndex,
      eeg_smiley_index: data.eeg.smileyIndex,
      eeg_relative_alpha_pre: data.eeg.relativeAlphaPre,
      eeg_relative_alpha_post: data.eeg.relativeAlphaPost,
      eeg_dar: data.eeg.dar,
      eeg_alpha_asymmetry: data.eeg.alphaAsymmetry,
      eeg_total_power_asymmetry: data.eeg.totalPowerAsymmetry,
      clinical_recommendations: data.clinicalRecommendations
    });
  }

  async getReportsByPatient(patientId: string): Promise<RehabReport[]> {
    const { data, error } = await supabase
      .from('rehab_reports')
      .select('*')
      .eq('patient_id', patientId)
      .order('session_date', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as RehabReport[];
  }
}

export const rehabReportsService = new RehabReportsService();
