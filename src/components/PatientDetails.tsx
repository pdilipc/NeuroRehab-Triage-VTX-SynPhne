import { useState } from 'react';
import { ArrowLeft, User, Calendar, Activity, Clock, CheckCircle2, XCircle, AlertTriangle, Brain, Moon } from 'lucide-react';
import { usePatient, useObservations, useConditions, useMedications, useSessionHistory, useRehabReports } from '../hooks/usePatients';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { LoadingSpinner, ErrorState } from './ui/LoadingSpinner';
import { VitalSignsPanel } from './VitalSignsPanel';
import { FuglMeyerChart } from './FuglMeyerChart';
import { ReadinessDashboard } from './ReadinessDashboard';
import { RehabReportsTab } from './RehabReportsTab';
import { DozeeTab } from './DozeeTab';
import { SynPhNeSummaryCard } from './SynPhNeSummaryCard';
import { NeuroMotorImpactCard } from './NeuroMotorImpactCard';
import { RehabReportsTrendChart } from './RehabReportsTrendChart';
import { groupObservationsByCode } from '../utils/observationUtils';
import { VITAL_SIGNS_LOINC, NEUROREHAB_LOINC } from '../config/fhir.config';
import { DEMO_REHAB_REPORT } from '../constants/demo-reports';

interface PatientDetailsProps {
  patientId: string;
  onBack: () => void;
  onStartSession: () => void;
}

type TabId = 'overview' | 'assessments' | 'conditions' | 'medications' | 'dozee' | 'sessions' | 'rehab-reports';

export function PatientDetails({ patientId, onBack, onStartSession }: PatientDetailsProps) {
  const { patient, loading: patientLoading, error: patientError } = usePatient(patientId);
  const { observations, loading: obsLoading } = useObservations(patientId);
  const { conditions, loading: conditionsLoading } = useConditions(patientId);
  const { medications, loading: medsLoading } = useMedications(patientId);
  const { sessions, loading: sessionsLoading } = useSessionHistory(patientId);
  const { reports } = useRehabReports(patientId);

  const loading = patientLoading || obsLoading || conditionsLoading || medsLoading || sessionsLoading;

  // Always show demo data when no real SynPhNe sessions exist — keeps all views consistent
  const displayReports = reports.length === 0 ? [DEMO_REHAB_REPORT] : reports;

  const [activeTab, setActiveTab] = useState<TabId>('overview');

  if (patientLoading) return <LoadingSpinner />;
  if (patientError) return <ErrorState message={patientError} onRetry={() => window.location.reload()} />;
  if (!patient) return null;

  const getPatientName = (p: fhir.Patient) => {
    const name = p.name?.[0];
    return name?.text || `${name?.given?.join(' ') || ''} ${name?.family || ''}`.trim();
  };

  const getPatientAge = (birthDate?: string) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const tabs: { id: TabId; label: string; count: number | null }[] = [
    { id: 'overview', label: 'Overview', count: null },
    { id: 'assessments', label: 'Assessments', count: observations.length },
    { id: 'conditions', label: 'Conditions', count: conditions.length },
    { id: 'medications', label: 'Medications', count: medications.length },
    { id: 'dozee', label: 'Dozee', count: null },
    { id: 'sessions', label: 'Session History', count: sessions.length },
    { id: 'rehab-reports', label: 'Rehab Reports', count: reports.length || null },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Patient List</span>
        </button>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-8 py-6 flex items-start justify-between">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="text-white">
                <h1 className="text-2xl font-bold mb-1">{getPatientName(patient)}</h1>
                <div className="flex items-center gap-4 text-sm text-blue-100">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(patient.birthDate)}
                  </span>
                  <span>{getPatientAge(patient.birthDate)} years old</span>
                  <Badge variant="default" className="bg-white/20 text-white border-white/30">
                    {patient.gender || 'Unknown'}
                  </Badge>
                </div>
                {patient.id && (
                  <div className="mt-2 text-xs text-blue-200 font-mono">Patient ID: {patient.id}</div>
                )}
              </div>
            </div>

            <button
              onClick={onStartSession}
              className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Activity className="w-5 h-5 inline mr-2" />
              Start Session
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex gap-6 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Overview ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ReadinessDashboard observations={observations} />
            <VitalSignsPanel observations={observations} loading={loading} />
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Conditions</span>
                    <span className="text-lg font-semibold text-gray-900">{conditions.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Medications</span>
                    <span className="text-lg font-semibold text-gray-900">{medications.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Observations</span>
                    <span className="text-lg font-semibold text-gray-900">{observations.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Brain className="w-3.5 h-3.5 text-purple-500" /> SynPhNe Sessions
                    </span>
                    <span className="text-lg font-semibold text-gray-900">{displayReports.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <SynPhNeSummaryCard
              reports={displayReports}
              onViewReports={() => setActiveTab('rehab-reports')}
            />

            <Card>
              <CardHeader>
                <CardTitle>Recent Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                {conditions.length === 0 ? (
                  <p className="text-sm text-gray-500">No conditions recorded</p>
                ) : (
                  <div className="space-y-3">
                    {conditions.slice(0, 5).map((condition) => (
                      <div key={condition.id} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {condition.code?.text || condition.code?.coding?.[0]?.display || 'Unknown'}
                          </p>
                          {condition.onsetDateTime && (
                            <p className="text-xs text-gray-500">Onset: {formatDate(condition.onsetDateTime)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Assessments: Fugl-Meyer + SynPhNe trends ── */}
      {activeTab === 'assessments' && (
        <div className="space-y-6">
          <FuglMeyerChart observations={observations} />
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600" />
              SynPhNe Longitudinal Trends
              {reports.length === 0 && (
                <span className="ml-1 text-xs font-normal text-purple-400 normal-case tracking-normal">(demo data)</span>
              )}
            </h3>
            <RehabReportsTrendChart reports={displayReports} />
          </div>
        </div>
      )}

      {/* ── Conditions ── */}
      {activeTab === 'conditions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Medical Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                {conditions.length === 0 ? (
                  <p className="text-sm text-gray-500">No conditions recorded</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Condition</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Onset Date</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conditions.map((condition) => (
                          <tr key={condition.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {condition.code?.text || condition.code?.coding?.[0]?.display || 'Unknown'}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {formatDate(condition.onsetDateTime)}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={condition.clinicalStatus?.coding?.[0]?.code === 'active' ? 'success' : 'default'}>
                                {condition.clinicalStatus?.coding?.[0]?.code || 'Unknown'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div>
            <NeuroMotorImpactCard reports={displayReports} observations={observations} />
          </div>
        </div>
      )}

      {/* ── Medications ── */}
      {activeTab === 'medications' && (
        <Card>
          <CardHeader>
            <CardTitle>Medications</CardTitle>
          </CardHeader>
          <CardContent>
            {medications.length === 0 ? (
              <p className="text-sm text-gray-500">No medications recorded</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Medication</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medications.map((med) => (
                      <tr key={med.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {med.medicationCodeableConcept?.text || med.medicationCodeableConcept?.coding?.[0]?.display || 'Unknown'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={med.status === 'active' ? 'success' : med.status === 'stopped' ? 'danger' : 'default'}>
                            {med.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {med.dosageInstruction?.[0]?.text || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Dozee ── */}
      {activeTab === 'dozee' && (
        <DozeeTab observations={observations} />
      )}

      {/* ── Session History ── */}
      {activeTab === 'sessions' && (
        <Card>
          <CardHeader>
            <CardTitle>Session History</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-500">No session records found</p>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => {
                  const isCompleted = session.status === 'completed';
                  const isDeferred = session.status === 'deferred';

                  const sessionTs = session.created_at ? new Date(session.created_at).getTime() : 0;

                  const matchedReport = displayReports.find((r) =>
                    r.id !== 'demo' && Math.abs(new Date(r.session_date).getTime() - sessionTs) < 86400000 * 1.5
                  );

                  const sleepObs = groupObservationsByCode(observations).get(NEUROREHAB_LOINC.SLEEP_QUALITY) || [];
                  const matchedSleep = sleepObs
                    .filter((o) => Math.abs(new Date(o.effectiveDateTime).getTime() - sessionTs) < 86400000 * 1.5)
                    .sort((a, b) => Math.abs(new Date(a.effectiveDateTime).getTime() - sessionTs) - Math.abs(new Date(b.effectiveDateTime).getTime() - sessionTs))[0];

                  const matchedHR = (groupObservationsByCode(observations).get(VITAL_SIGNS_LOINC.HEART_RATE) || [])
                    .filter((o) => Math.abs(new Date(o.effectiveDateTime).getTime() - sessionTs) < 86400000 * 1.5)
                    .sort((a, b) => Math.abs(new Date(a.effectiveDateTime).getTime() - sessionTs) - Math.abs(new Date(b.effectiveDateTime).getTime() - sessionTs))[0];

                  return (
                    <div
                      key={session.id}
                      className={`border rounded-lg p-4 ${
                        isDeferred ? 'border-red-200 bg-red-50'
                        : session.decision === 'modify' ? 'border-amber-200 bg-amber-50'
                        : 'border-green-200 bg-green-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          {isDeferred ? (
                            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                          ) : session.decision === 'modify' ? (
                            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <h4 className={`font-semibold ${
                              isDeferred ? 'text-red-900'
                              : session.decision === 'modify' ? 'text-amber-900'
                              : 'text-green-900'
                            }`}>
                              {isDeferred ? 'Session Deferred'
                                : session.decision === 'modify' ? 'Modified Session'
                                : 'Session Completed'}
                            </h4>
                            {session.created_at && (
                              <p className={`text-xs mt-1 flex items-center gap-1 ${
                                isDeferred ? 'text-red-700'
                                : session.decision === 'modify' ? 'text-amber-700'
                                : 'text-green-700'
                              }`}>
                                <Clock className="w-3 h-3" />
                                {new Date(session.created_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start gap-2 flex-wrap justify-end">
                          {matchedSleep && (
                            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${matchedSleep.value >= 7 ? 'bg-green-50 text-green-700 border-green-200' : matchedSleep.value >= 5 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                              <Moon className="w-3 h-3" />
                              Sleep {matchedSleep.value.toFixed(1)}/10
                            </span>
                          )}
                          {matchedHR && (
                            <span className={`text-xs px-2 py-1 rounded-full border ${matchedHR.value > 100 || matchedHR.value < 50 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                              HR {matchedHR.value.toFixed(0)} bpm
                            </span>
                          )}
                          {matchedReport && (
                            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
                              <Brain className="w-3 h-3" />
                              SynPhNe S{matchedReport.session_number}
                            </span>
                          )}
                          <Badge variant={isDeferred ? 'danger' : session.decision === 'modify' ? 'warning' : 'success'}>
                            {isDeferred ? 'Deferred' : session.decision === 'modify' ? 'Modified' : 'Completed'}
                          </Badge>
                        </div>
                      </div>

                      {matchedReport && (
                        <div className="mb-3 bg-purple-50 border border-purple-100 rounded-lg p-2.5 flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Brain className="w-3.5 h-3.5 text-purple-600" />
                            <span className="text-xs font-medium text-purple-800">SynPhNe Session {matchedReport.session_number}</span>
                          </div>
                          <span className="text-xs text-purple-700">
                            Avg EMG: <strong className={Number(matchedReport.emg_wrist_extensor) > 0 ? 'text-green-700' : 'text-red-700'}>
                              {((Number(matchedReport.emg_supinator) + Number(matchedReport.emg_pronator) + Number(matchedReport.emg_wrist_extensor) + Number(matchedReport.emg_wrist_flexor) + Number(matchedReport.emg_finger_extensor) + Number(matchedReport.emg_finger_flexor) + Number(matchedReport.emg_thumb)) / 7).toFixed(1)}
                            </strong>
                          </span>
                          <span className="text-xs text-purple-700">
                            ARI: <strong className={Number(matchedReport.eeg_attention_response_index) < 0.9 ? 'text-green-700' : Number(matchedReport.eeg_attention_response_index) > 1.1 ? 'text-red-700' : 'text-amber-700'}>
                              {Number(matchedReport.eeg_attention_response_index).toFixed(2)}
                            </strong>
                          </span>
                          <span className="text-xs text-purple-700">
                            Smiley: <strong className={Number(matchedReport.eeg_smiley_index) >= 70 ? 'text-green-700' : 'text-amber-700'}>
                              {Number(matchedReport.eeg_smiley_index).toFixed(0)}%
                            </strong>
                          </span>
                        </div>
                      )}

                      {isCompleted && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 bg-white/50 rounded-lg p-3">
                          {session.session_duration && (
                            <div>
                              <p className="text-xs text-gray-600">Duration</p>
                              <p className="text-sm font-medium text-gray-900">{session.session_duration} min</p>
                            </div>
                          )}
                          {session.tolerance && (
                            <div>
                              <p className="text-xs text-gray-600">Tolerance</p>
                              <p className="text-sm font-medium text-gray-900 capitalize">{session.tolerance}</p>
                            </div>
                          )}
                          {session.fatigue_level && (
                            <div>
                              <p className="text-xs text-gray-600">Fatigue Level</p>
                              <p className="text-sm font-medium text-gray-900 capitalize">{session.fatigue_level}</p>
                            </div>
                          )}
                          {session.pain_level !== undefined && (
                            <div>
                              <p className="text-xs text-gray-600">Pain Level</p>
                              <p className="text-sm font-medium text-gray-900">{session.pain_level} / 10</p>
                            </div>
                          )}
                        </div>
                      )}

                      {session.session_notes && (
                        <div className="bg-white/50 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">Notes</p>
                          <p className="text-sm text-gray-700">{session.session_notes}</p>
                        </div>
                      )}

                      {isCompleted && session.exercises_completed && (
                        <div className="mt-2 bg-white/50 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">Exercises Completed</p>
                          <p className="text-sm text-gray-700">{session.exercises_completed}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Rehab Reports ── */}
      {activeTab === 'rehab-reports' && (
        <RehabReportsTab patientId={patientId} patientName={getPatientName(patient)} />
      )}
    </div>
  );
}
