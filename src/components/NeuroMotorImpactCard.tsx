import { Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { RehabReport } from '../services/rehab-reports.service';
import { getFuglMeyerScores } from '../utils/observationUtils';

interface NeuroMotorImpactCardProps {
  reports: RehabReport[];
  observations: fhir.Observation[];
}

const EMG_MUSCLES = [
  { key: 'emg_supinator', label: 'Supinator', snomed: 'Forearm supination' },
  { key: 'emg_pronator', label: 'Pronator', snomed: 'Forearm pronation' },
  { key: 'emg_thumb', label: 'Thumb', snomed: 'Thumb abduction' },
  { key: 'emg_wrist_extensor', label: 'Wrist Extensor', snomed: 'Wrist extension' },
  { key: 'emg_wrist_flexor', label: 'Wrist Flexor', snomed: 'Wrist flexion' },
  { key: 'emg_finger_extensor', label: 'Finger Extensor', snomed: 'Finger extension' },
  { key: 'emg_finger_flexor', label: 'Finger Flexor', snomed: 'Finger flexion' },
] as const;

function ImpairmentBar({ value, label }: { value: number; label: string }) {
  const impairment = Math.max(0, (-value / 6) * 100);
  const variant: 'danger' | 'warning' | 'success' =
    value < -3 ? 'danger' : value < -1 ? 'warning' : 'success';
  const statusLabel =
    value < -3 ? 'Severe' : value < -1 ? 'Moderate' : value < 0 ? 'Mild' : 'Good';

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600 w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 relative overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all ${variant === 'danger' ? 'bg-red-500' : variant === 'warning' ? 'bg-amber-500' : 'bg-green-500'}`}
          style={{ width: `${Math.max(impairment, 3)}%` }}
        />
      </div>
      <Badge variant={variant} className="text-xs w-16 justify-center">{statusLabel}</Badge>
    </div>
  );
}

export function NeuroMotorImpactCard({ reports, observations }: NeuroMotorImpactCardProps) {
  const latest = reports.length > 0 ? reports[reports.length - 1] : null;
  const fmaScores = getFuglMeyerScores(observations);
  const latestFMA = fmaScores.length > 0 ? fmaScores[0] : null;

  const impaired = latest
    ? EMG_MUSCLES.filter((m) => Number(latest[m.key as keyof RehabReport]) < -1)
        .sort((a, b) => Number(latest[a.key as keyof RehabReport]) - Number(latest[b.key as keyof RehabReport]))
    : [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
            <Zap className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <CardTitle className="text-sm">Neuro-Motor Functional Impact</CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">SynPhNe EMG + Fugl-Meyer assessment</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">

        {/* Fugl-Meyer Summary */}
        {latestFMA ? (
          <div className="grid grid-cols-3 gap-2 bg-blue-50 rounded-xl p-3">
            <div className="text-center">
              <p className="text-xs text-blue-600 font-medium">Upper Extremity</p>
              <p className="text-lg font-bold text-blue-800">{latestFMA.upper}<span className="text-xs text-blue-500">/66</span></p>
              <div className="mt-1 h-1.5 bg-blue-100 rounded-full">
                <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${(latestFMA.upper / 66) * 100}%` }} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-blue-600 font-medium">Lower Extremity</p>
              <p className="text-lg font-bold text-blue-800">{latestFMA.lower}<span className="text-xs text-blue-500">/34</span></p>
              <div className="mt-1 h-1.5 bg-blue-100 rounded-full">
                <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${(latestFMA.lower / 34) * 100}%` }} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-blue-600 font-medium">Total Score</p>
              <p className="text-lg font-bold text-blue-800">{latestFMA.total}<span className="text-xs text-blue-500">/100</span></p>
              <div className="mt-1 h-1.5 bg-blue-100 rounded-full">
                <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${latestFMA.total}%` }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-400">No Fugl-Meyer assessment recorded.</div>
        )}

        {/* EMG Muscle Impairment */}
        {latest ? (
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">EMG Impairment by Muscle Group</p>
            <div className="space-y-2">
              {EMG_MUSCLES.map((m) => (
                <ImpairmentBar
                  key={m.key}
                  label={m.label}
                  value={Number(latest[m.key as keyof RehabReport])}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">No SynPhNe session data available.</p>
        )}

        {/* Most Impaired Muscles Summary */}
        {impaired.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3">
            <p className="text-xs font-medium text-red-800 mb-1">Priority rehabilitation targets</p>
            <div className="flex flex-wrap gap-1">
              {impaired.map((m) => (
                <span key={m.key} className="text-xs bg-red-100 text-red-700 rounded px-1.5 py-0.5">
                  {m.label} ({Number(latest![m.key as keyof RehabReport]).toFixed(1)})
                </span>
              ))}
            </div>
          </div>
        )}

        {latest && (
          <p className="text-xs text-gray-400">
            Based on SynPhNe session {latest.session_number} · {new Date(latest.session_date).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
