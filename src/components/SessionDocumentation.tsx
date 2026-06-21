import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Save, FileText } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { fhirService } from '../services/fhir.service';
import { sessionService } from '../services/session.service';

interface SessionDocumentationProps {
  patientId: string;
  patient: fhir.Patient;
  decision: 'proceed' | 'modify' | 'defer';
  onBack: () => void;
  onComplete: () => void;
}

export function SessionDocumentation({
  patientId,
  patient,
  decision,
  onBack,
  onComplete
}: SessionDocumentationProps) {
  const [sessionDuration, setSessionDuration] = useState('60');
  const [tolerance, setTolerance] = useState<'good' | 'moderate' | 'poor'>('good');
  const [fatigueLevel, setFatigueLevel] = useState<'none' | 'mild' | 'moderate' | 'severe'>('none');
  const [painLevel, setPainLevel] = useState('0');
  const [exercisesCompleted, setExercisesCompleted] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPatientName = (p: fhir.Patient) => {
    const name = p.name?.[0];
    return name?.text || `${name?.given?.join(' ') || ''} ${name?.family || ''}`.trim();
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      const now = new Date().toISOString();

      if (decision === 'defer') {
        const questionnaireResponse: fhir.QuestionnaireResponse = {
          resourceType: 'QuestionnaireResponse',
          status: 'completed',
          subject: {
            reference: `Patient/${patientId}`,
            display: getPatientName(patient)
          },
          authored: now,
          item: [
            {
              linkId: '1',
              text: 'Session Decision',
              answer: [{ valueString: 'Deferred' }]
            },
            {
              linkId: '2',
              text: 'Deferral Reason',
              answer: [{ valueString: sessionNotes }]
            }
          ]
        };

        await fhirService.createQuestionnaireResponse(questionnaireResponse);
      } else {
        const procedure: fhir.Procedure = {
          resourceType: 'Procedure',
          status: 'completed',
          category: {
            coding: [{
              system: 'http://snomed.info/sct',
              code: '394602003',
              display: 'Rehabilitation'
            }]
          },
          code: {
            coding: [{
              system: 'http://snomed.info/sct',
              code: '91251008',
              display: 'Physical therapy procedure'
            }],
            text: `Neurorehabilitation Session - ${decision === 'modify' ? 'Modified' : 'Standard'}`
          },
          subject: {
            reference: `Patient/${patientId}`,
            display: getPatientName(patient)
          },
          performedPeriod: {
            start: new Date(Date.now() - parseInt(sessionDuration) * 60000).toISOString(),
            end: now
          },
          outcome: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/condition-outcome',
              code: tolerance === 'good' ? 'successful' : tolerance === 'moderate' ? 'partial' : 'unsuccessful'
            }],
            text: sessionNotes
          }
        };

        await fhirService.createProcedure(procedure);

        const obsCodes = [
          { code: '89259-6', display: 'Session Duration', value: parseInt(sessionDuration), unit: 'min' },
          { code: '8867-4', display: 'Fatigue Level After Session', value: fatigueLevel === 'none' ? 0 : fatigueLevel === 'mild' ? 3 : fatigueLevel === 'moderate' ? 6 : 10, unit: '{score}' },
          { code: '72132-0', display: 'Pain Intensity', value: parseInt(painLevel), unit: '{score}' }
        ];

        for (const obs of obsCodes) {
          const observation: fhir.Observation = {
            resourceType: 'Observation',
            status: 'final',
            category: [{
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: 'vital-signs',
                display: 'Vital Signs'
              }]
            }],
            code: {
              coding: [{
                system: 'http://loinc.org',
                code: obs.code,
                display: obs.display
              }],
              text: obs.display
            },
            subject: {
              reference: `Patient/${patientId}`,
              display: getPatientName(patient)
            },
            effectiveDateTime: now,
            valueQuantity: {
              value: obs.value,
              unit: obs.unit
            }
          };

          await fhirService.createObservation(observation);
        }

        const questionnaireResponse: fhir.QuestionnaireResponse = {
          resourceType: 'QuestionnaireResponse',
          status: 'completed',
          subject: {
            reference: `Patient/${patientId}`,
            display: getPatientName(patient)
          },
          authored: now,
          item: [
            {
              linkId: '1',
              text: 'Tolerance',
              answer: [{ valueString: tolerance }]
            },
            {
              linkId: '2',
              text: 'Exercises Completed',
              answer: [{ valueString: exercisesCompleted }]
            },
            {
              linkId: '3',
              text: 'Session Notes',
              answer: [{ valueString: sessionNotes }]
            },
            {
              linkId: '4',
              text: 'Session Type',
              answer: [{ valueString: decision === 'modify' ? 'Modified' : 'Standard' }]
            }
          ]
        };

        await fhirService.createQuestionnaireResponse(questionnaireResponse);
      }

      await sessionService.saveSession({
        patient_id: patientId,
        decision,
        status: decision === 'defer' ? 'deferred' : 'completed',
        session_duration: decision === 'defer' ? undefined : parseInt(sessionDuration),
        tolerance: decision === 'defer' ? undefined : tolerance,
        fatigue_level: decision === 'defer' ? undefined : fatigueLevel,
        pain_level: decision === 'defer' ? undefined : parseInt(painLevel),
        exercises_completed: decision === 'defer' ? undefined : exercisesCompleted,
        session_notes: sessionNotes
      });

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save session documentation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-white" />
            <CardTitle className="text-white">
              {decision === 'defer' ? 'Deferral Documentation' : 'Post-Session Documentation'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {decision === 'defer' ? (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  The session was deferred based on patient readiness assessment. Please document the reason for deferral.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deferral Reason
                </label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Explain why the session was deferred..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={5}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800">
                    Session completed - {decision === 'modify' ? 'Modified' : 'Standard'} session for {getPatientName(patient)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Session Duration (minutes)"
                  type="number"
                  value={sessionDuration}
                  onChange={setSessionDuration}
                />
                <Input
                  label="Pain Level (0-10)"
                  type="number"
                  value={painLevel}
                  onChange={setPainLevel}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Patient Tolerance
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['good', 'moderate', 'poor'] as const).map((tol) => (
                    <button
                      key={tol}
                      onClick={() => setTolerance(tol)}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        tolerance === tol
                          ? tol === 'good' ? 'bg-green-600 text-white border-green-600' :
                            tol === 'moderate' ? 'bg-amber-600 text-white border-amber-600' :
                            'bg-red-600 text-white border-red-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="text-sm font-medium capitalize">{tol}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Fatigue Level After Session
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {(['none', 'mild', 'moderate', 'severe'] as const).map((fat) => (
                    <button
                      key={fat}
                      onClick={() => setFatigueLevel(fat)}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        fatigueLevel === fat
                          ? fat === 'none' ? 'bg-green-600 text-white border-green-600' :
                            fat === 'mild' ? 'bg-blue-600 text-white border-blue-600' :
                            fat === 'moderate' ? 'bg-amber-600 text-white border-amber-600' :
                            'bg-red-600 text-white border-red-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="text-sm font-medium capitalize">{fat}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exercises Completed
                </label>
                <textarea
                  value={exercisesCompleted}
                  onChange={(e) => setExercisesCompleted(e.target.value)}
                  placeholder="List exercises performed during the session..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Notes
                </label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Document patient response, observations, and recommendations..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={5}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-6 border-t border-gray-200 mt-6">
            <Button
              onClick={handleSubmit}
              loading={saving}
              variant={decision === 'defer' ? 'danger' : 'success'}
              className="min-w-[200px]"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Documentation
            </Button>
            <Button onClick={onBack} variant="ghost">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
