import { Moon, Heart, Wind, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { VITAL_SIGNS_LOINC, NEUROREHAB_LOINC } from '../config/fhir.config';
import { groupObservationsByCode } from '../utils/observationUtils';

interface DozeeMonitoringPanelProps {
  observations: fhir.Observation[];
}

function Sparkline({ values, color, min, max }: { values: number[]; color: string; min: number; max: number }) {
  if (values.length < 2) return <div className="h-8 flex items-center text-xs text-gray-400">—</div>;
  const w = 80;
  const h = 32;
  const pad = 4;
  const range = max - min || 1;
  const xStep = (w - pad * 2) / (values.length - 1);
  const pts = values.map((v, i) => `${pad + i * xStep},${h - pad - ((v - min) / range) * (h - pad * 2)}`).join(' ');
  return (
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={pad + (values.length - 1) * xStep} cy={h - pad - ((values[values.length - 1] - min) / range) * (h - pad * 2)} r={3} fill={color} />
    </svg>
  );
}

function MetricRow({
  icon: Icon,
  label,
  latestValue,
  unit,
  historicalValues,
  color,
  normalRange,
  min,
  max,
}: {
  icon: React.ElementType;
  label: string;
  latestValue: number | null;
  unit: string;
  historicalValues: number[];
  color: string;
  normalRange: string;
  min: number;
  max: number;
}) {
  const isNormal =
    latestValue === null ? null :
    label === 'Heart Rate' ? latestValue >= 60 && latestValue <= 100 :
    label === 'SpO2' ? latestValue >= 95 :
    label === 'Respiratory Rate' ? latestValue >= 12 && latestValue <= 20 :
    label === 'Sleep Quality' ? latestValue >= 7 :
    true;

  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-0.5">
          <span className="text-xs font-medium text-gray-700">{label}</span>
          <span className={`text-xs font-bold ${isNormal === null ? 'text-gray-400' : isNormal ? 'text-green-600' : 'text-red-600'}`}>
            {latestValue !== null ? `${latestValue.toFixed(label === 'SpO2' || label === 'Sleep Quality' ? 1 : 0)} ${unit}` : '—'}
          </span>
        </div>
        <div className="text-xs text-gray-400">Normal: {normalRange}</div>
      </div>
      <Sparkline values={historicalValues} color={color} min={min} max={max} />
    </div>
  );
}

export function DozeeMonitoringPanel({ observations }: DozeeMonitoringPanelProps) {
  const grouped = groupObservationsByCode(observations);

  const sorted = (code: string) =>
    (grouped.get(code) || [])
      .sort((a, b) => new Date(a.effectiveDateTime).getTime() - new Date(b.effectiveDateTime).getTime())
      .slice(-14);

  const hrSeries = sorted(VITAL_SIGNS_LOINC.HEART_RATE);
  const spo2Series = sorted(VITAL_SIGNS_LOINC.OXYGEN_SATURATION);
  const rrSeries = sorted(VITAL_SIGNS_LOINC.RESPIRATORY_RATE);
  const sleepSeries = sorted(NEUROREHAB_LOINC.SLEEP_QUALITY);

  const latest = (series: typeof hrSeries) =>
    series.length > 0 ? series[series.length - 1].value : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
            <Activity className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <CardTitle className="text-sm">Dozee Continuous Monitoring</CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">Overnight vitals relevant to medication response</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <MetricRow
          icon={Heart}
          label="Heart Rate"
          latestValue={latest(hrSeries)}
          unit="bpm"
          historicalValues={hrSeries.map(d => d.value)}
          color="#ef4444"
          normalRange="60–100 bpm"
          min={40}
          max={140}
        />
        <MetricRow
          icon={Activity}
          label="SpO2"
          latestValue={latest(spo2Series)}
          unit="%"
          historicalValues={spo2Series.map(d => d.value)}
          color="#3b82f6"
          normalRange="≥95%"
          min={85}
          max={100}
        />
        <MetricRow
          icon={Wind}
          label="Respiratory Rate"
          latestValue={latest(rrSeries)}
          unit="br/min"
          historicalValues={rrSeries.map(d => d.value)}
          color="#8b5cf6"
          normalRange="12–20 br/min"
          min={8}
          max={30}
        />
        <MetricRow
          icon={Moon}
          label="Sleep Quality"
          latestValue={latest(sleepSeries)}
          unit="/10"
          historicalValues={sleepSeries.map(d => d.value)}
          color="#f59e0b"
          normalRange="≥7/10"
          min={0}
          max={10}
        />
        {hrSeries.length === 0 && spo2Series.length === 0 && (
          <p className="text-xs text-gray-400 italic pt-2">No Dozee monitoring data recorded yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
