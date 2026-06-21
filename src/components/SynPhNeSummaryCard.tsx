import { Brain, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { RehabReport } from '../services/rehab-reports.service';

interface SynPhNeSummaryCardProps {
  reports: RehabReport[];
  onViewReports: () => void;
}

const EMG_MUSCLES = [
  { key: 'emg_supinator', label: 'Sup.' },
  { key: 'emg_pronator', label: 'Pro.' },
  { key: 'emg_thumb', label: 'Thumb' },
  { key: 'emg_wrist_extensor', label: 'W.Ext' },
  { key: 'emg_wrist_flexor', label: 'W.Flex' },
  { key: 'emg_finger_extensor', label: 'F.Ext' },
  { key: 'emg_finger_flexor', label: 'F.Flex' },
] as const;

function MicroBar({ value }: { value: number }) {
  const pct = ((value + 6) / 7) * 100;
  const color = value > 0 ? '#10b981' : value > -2 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
      <div className="h-1.5 rounded-full" style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: color }} />
    </div>
  );
}

export function SynPhNeSummaryCard({ reports, onViewReports }: SynPhNeSummaryCardProps) {
  const latest = reports.length > 0 ? reports[reports.length - 1] : null;

  const avgEmg = latest
    ? (EMG_MUSCLES.reduce((sum, m) => sum + Number(latest[m.key as keyof RehabReport]), 0) / EMG_MUSCLES.length)
    : null;

  const ari = latest ? Number(latest.eeg_attention_response_index) : null;
  const smiley = latest ? Number(latest.eeg_smiley_index) : null;

  const ariVariant = ari === null ? 'default' : ari < 0.9 ? 'success' : ari > 1.1 ? 'danger' : 'warning';
  const ariLabel = ari === null ? '—' : ari < 0.9 ? 'Good' : ari > 1.1 ? 'Poor' : 'Neutral';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
              <Brain className="w-4 h-4 text-purple-600" />
            </div>
            <CardTitle className="text-sm">SynPhNe Status</CardTitle>
          </div>
          <button
            onClick={onViewReports}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            <TrendingUp className="w-3 h-3" />
            {reports.length} session{reports.length !== 1 ? 's' : ''}
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {!latest ? (
          <p className="text-xs text-gray-400 italic">No SynPhNe sessions recorded yet.</p>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-gray-500">
              Session {latest.session_number} · {new Date(latest.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>

            {/* EEG Key Metrics */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Avg EMG</p>
                <p className={`text-sm font-bold ${avgEmg !== null && avgEmg > 0 ? 'text-green-600' : avgEmg !== null && avgEmg > -2 ? 'text-amber-600' : 'text-red-600'}`}>
                  {avgEmg !== null ? (avgEmg > 0 ? '+' : '') + avgEmg.toFixed(1) : '—'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500 mb-0.5">Attention</p>
                <Badge variant={ariVariant} className="text-xs px-1">{ariLabel}</Badge>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Smiley</p>
                <p className={`text-sm font-bold ${smiley !== null && smiley >= 70 ? 'text-green-600' : smiley !== null && smiley >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                  {smiley !== null ? `${smiley.toFixed(0)}%` : '—'}
                </p>
              </div>
            </div>

            {/* EMG Muscle Bars */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500">EMG Body State</p>
              {EMG_MUSCLES.map((m) => (
                <div key={m.key} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-10 flex-shrink-0">{m.label}</span>
                  <MicroBar value={Number(latest[m.key as keyof RehabReport])} />
                  <span className="text-xs text-gray-500 w-8 text-right">
                    {Number(latest[m.key as keyof RehabReport]) > 0 ? '+' : ''}{Number(latest[m.key as keyof RehabReport]).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>

            {/* BSI */}
            <div className="bg-purple-50 rounded-lg p-2">
              <p className="text-xs text-purple-700">
                <span className="font-medium">Brain Symmetry (post): </span>
                {Number(latest.eeg_brain_symmetry_post).toFixed(3)}
                <span className="ml-1 text-purple-500">
                  {Number(latest.eeg_brain_symmetry_post) < 0 ? '(right dominant)' : '(left dominant)'}
                </span>
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
