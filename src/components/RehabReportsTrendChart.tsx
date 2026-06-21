import { RehabReport } from '../services/rehab-reports.service';

interface RehabReportsTrendChartProps {
  reports: RehabReport[];
}

const EMG_MUSCLES = [
  { key: 'emg_supinator', label: 'Supinator', color: '#3b82f6' },
  { key: 'emg_pronator', label: 'Pronator', color: '#8b5cf6' },
  { key: 'emg_thumb', label: 'Thumb', color: '#ec4899' },
  { key: 'emg_wrist_extensor', label: 'Wrist Ext.', color: '#10b981' },
  { key: 'emg_wrist_flexor', label: 'Wrist Flex.', color: '#f59e0b' },
  { key: 'emg_finger_extensor', label: 'Finger Ext.', color: '#06b6d4' },
  { key: 'emg_finger_flexor', label: 'Finger Flex.', color: '#ef4444' },
] as const;

function MiniLineChart({
  values,
  min,
  max,
  color,
  label,
  unit = '',
  height = 60,
}: {
  values: number[];
  min: number;
  max: number;
  color: string;
  label: string;
  unit?: string;
  height?: number;
}) {
  const w = 200;
  const h = height;
  const pad = 8;

  if (values.length < 2) {
    const x = w / 2;
    const range = max - min || 1;
    const y = h - pad - ((values[0] - min) / range) * (h - pad * 2);
    return (
      <div className="flex flex-col">
        <div className="text-xs font-medium text-gray-600 mb-1">{label}</div>
        <svg width={w} height={h} className="overflow-visible">
          <circle cx={x} cy={y} r={4} fill={color} />
          <text x={x} y={y - 8} textAnchor="middle" fontSize={9} fill="#6b7280">
            {values[0]?.toFixed(2)}{unit}
          </text>
        </svg>
      </div>
    );
  }

  const range = max - min || 1;
  const xStep = (w - pad * 2) / (values.length - 1);

  const points = values.map((v, i) => ({
    x: pad + i * xStep,
    y: h - pad - ((v - min) / range) * (h - pad * 2),
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col">
      <div className="text-xs font-medium text-gray-600 mb-1">{label}</div>
      <svg width={w} height={h} className="overflow-visible">
        <line x1={pad} y1={h - pad - ((0 - min) / range) * (h - pad * 2)} x2={w - pad} y2={h - pad - ((0 - min) / range) * (h - pad * 2)} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="3,3" />
        <polyline points={polyline} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
        ))}
        <text x={points[points.length - 1].x} y={points[points.length - 1].y - 6} textAnchor="end" fontSize={9} fill={color}>
          {values[values.length - 1]?.toFixed(2)}{unit}
        </text>
      </svg>
    </div>
  );
}

function BodyStateBar({ value, label, color }: { value: number; label: string; color: string }) {
  const pct = ((value + 6) / 7) * 100;
  const isGood = value > 0;
  const isBad = value < -2;

  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs text-gray-600 flex-shrink-0">{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-3 relative">
        <div
          className="h-3 rounded-full transition-all"
          style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: isGood ? '#10b981' : isBad ? '#ef4444' : '#f59e0b' }}
        />
        <div className="absolute left-[6/7*100%] top-0 h-full w-px bg-gray-400" style={{ left: `${(6 / 7) * 100}%` }} />
      </div>
      <span className={`text-xs font-bold w-10 text-right ${isGood ? 'text-green-600' : isBad ? 'text-red-600' : 'text-amber-600'}`}>
        {value > 0 ? '+' : ''}{value.toFixed(1)}
      </span>
    </div>
  );
}

export function RehabReportsTrendChart({ reports }: RehabReportsTrendChartProps) {
  if (reports.length === 0) return null;

  const latest = reports[reports.length - 1];

  return (
    <div className="space-y-6">
      {/* Latest Session EMG Body State */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800">Latest EMG Body State</h3>
          <span className="text-xs text-gray-500">Session {latest.session_number} — {new Date(latest.session_date).toLocaleDateString()}</span>
        </div>
        <div className="space-y-2">
          {EMG_MUSCLES.map((m) => (
            <BodyStateBar
              key={m.key}
              label={m.label}
              value={Number(latest[m.key as keyof RehabReport]) ?? 0}
              color={m.color}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Good (&gt;0)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" /> Moderate (-2 to 0)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Poor (&lt;-2)</span>
        </div>
      </div>

      {/* Longitudinal EMG Trends */}
      {reports.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">EMG Trends Across Sessions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-x-auto">
            {EMG_MUSCLES.map((m) => (
              <MiniLineChart
                key={m.key}
                label={m.label}
                values={reports.map((r) => Number(r[m.key as keyof RehabReport]) ?? 0)}
                min={-6}
                max={1}
                color={m.color}
              />
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-400">Sessions 1–{reports.length} · Target range: 0 to +1</div>
        </div>
      )}

      {/* EEG Metrics */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">
          {reports.length > 1 ? 'EEG Metric Trends' : 'Latest EEG Metrics'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <MiniLineChart
            label="Brain Symmetry Index (Pre)"
            values={reports.map((r) => Number(r.eeg_brain_symmetry_pre))}
            min={-2} max={2} color="#6366f1"
          />
          <MiniLineChart
            label="Brain Symmetry Index (Post)"
            values={reports.map((r) => Number(r.eeg_brain_symmetry_post))}
            min={-2} max={2} color="#8b5cf6"
          />
          <MiniLineChart
            label="Attention Response Index"
            values={reports.map((r) => Number(r.eeg_attention_response_index))}
            min={0} max={5} color="#0ea5e9"
          />
          <MiniLineChart
            label="Smiley Index"
            values={reports.map((r) => Number(r.eeg_smiley_index))}
            min={0} max={100} color="#22c55e" unit="%"
          />
          <MiniLineChart
            label="Relative Alpha (Pre)"
            values={reports.map((r) => Number(r.eeg_relative_alpha_pre))}
            min={0} max={0.3} color="#f59e0b"
          />
          <MiniLineChart
            label="Delta:Alpha Ratio (DAR)"
            values={reports.map((r) => Number(r.eeg_dar))}
            min={0} max={100} color="#ef4444"
          />
        </div>

        {/* EEG Reference ranges */}
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-gray-500 border-t border-gray-100 pt-4">
          <div><span className="font-medium text-gray-700">Brain Symmetry:</span> &lt;0 = right dominant, &gt;0 = left dominant, 0 = ideal</div>
          <div><span className="font-medium text-gray-700">Attention (ARI):</span> &lt;0.9 good, 0.9–1.1 neutral, &gt;1.1 poor</div>
          <div><span className="font-medium text-gray-700">Smiley Index:</span> &gt;70% ideal learning state</div>
        </div>
      </div>
    </div>
  );
}
