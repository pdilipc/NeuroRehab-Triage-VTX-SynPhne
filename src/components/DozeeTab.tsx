import { Moon, Heart, Wind, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { SleepQualityChart } from './SleepQualityChart';
import { groupObservationsByCode, getSleepData } from '../utils/observationUtils';
import { VITAL_SIGNS_LOINC, NEUROREHAB_LOINC } from '../config/fhir.config';

interface DozeeTabProps {
  observations: fhir.Observation[];
}

function Sparkline({ values, color, min, max }: { values: number[]; color: string; min: number; max: number }) {
  if (values.length === 0) return <span className="text-xs text-gray-400">No data</span>;
  if (values.length < 2) {
    return <span className="text-xs font-medium" style={{ color }}>{values[0].toFixed(1)}</span>;
  }
  const w = 100;
  const h = 36;
  const pad = 4;
  const range = max - min || 1;
  const xStep = (w - pad * 2) / (values.length - 1);
  const pts = values
    .map((v, i) => `${pad + i * xStep},${h - pad - ((Math.min(Math.max(v, min), max) - min) / range) * (h - pad * 2)}`)
    .join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle
        cx={pad + (values.length - 1) * xStep}
        cy={h - pad - ((Math.min(Math.max(values[values.length - 1], min), max) - min) / range) * (h - pad * 2)}
        r={3}
        fill={color}
      />
    </svg>
  );
}

function TrendIcon({ values }: { values: number[] }) {
  if (values.length < 2) return <Minus className="w-3 h-3 text-gray-400" />;
  const delta = values[values.length - 1] - values[0];
  if (delta > 0.5) return <TrendingUp className="w-3 h-3 text-green-500" />;
  if (delta < -0.5) return <TrendingDown className="w-3 h-3 text-red-500" />;
  return <Minus className="w-3 h-3 text-gray-400" />;
}

function VitalCard({
  icon: Icon,
  label,
  latestValue,
  unit,
  historicalValues,
  color,
  normalRange,
  isNormal,
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
  isNormal: boolean | null;
  min: number;
  max: number;
}) {
  const avg = historicalValues.length > 0
    ? (historicalValues.reduce((s, v) => s + v, 0) / historicalValues.length)
    : null;
  const min7 = historicalValues.length > 0 ? Math.min(...historicalValues) : null;
  const max7 = historicalValues.length > 0 ? Math.max(...historicalValues) : null;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{label}</p>
              <p className="text-xs text-gray-400">Normal: {normalRange}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {latestValue !== null ? latestValue.toFixed(unit === 'bpm' || unit === 'br/min' ? 0 : 1) : '—'}
            </p>
            <p className="text-xs text-gray-500">{unit}</p>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div className="space-y-1">
            {avg !== null && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <TrendIcon values={historicalValues} />
                <span>Avg {avg.toFixed(1)} · Min {min7?.toFixed(1)} · Max {max7?.toFixed(1)}</span>
              </div>
            )}
            <Badge variant={isNormal === null ? 'default' : isNormal ? 'success' : 'danger'} className="text-xs">
              {isNormal === null ? 'No data' : isNormal ? 'Within range' : 'Out of range'}
            </Badge>
          </div>
          <Sparkline values={historicalValues} color={color} min={min} max={max} />
        </div>
      </CardContent>
    </Card>
  );
}

export function DozeeTab({ observations }: DozeeTabProps) {
  const grouped = groupObservationsByCode(observations);
  const sleepData = getSleepData(observations);

  const series = (code: string, days = 14) =>
    (grouped.get(code) || [])
      .sort((a, b) => new Date(a.effectiveDateTime).getTime() - new Date(b.effectiveDateTime).getTime())
      .slice(-days);

  const hrSeries = series(VITAL_SIGNS_LOINC.HEART_RATE);
  const spo2Series = series(VITAL_SIGNS_LOINC.OXYGEN_SATURATION);
  const rrSeries = series(VITAL_SIGNS_LOINC.RESPIRATORY_RATE);
  const sleepQSeries = series(NEUROREHAB_LOINC.SLEEP_QUALITY);

  const latest = (s: typeof hrSeries) => s.length > 0 ? s[s.length - 1].value : null;

  const hrLatest = latest(hrSeries);
  const spo2Latest = latest(spo2Series);
  const rrLatest = latest(rrSeries);
  const sleepQLatest = latest(sleepQSeries);

  const latestSleep = sleepData[0];
  const avg7Sleep = sleepData.slice(0, 7).reduce((s, d) => s + d.quality, 0) / Math.max(sleepData.slice(0, 7).length, 1);

  return (
    <div className="space-y-6">
      {/* Dozee Device Summary */}
      <Card className="bg-gradient-to-r from-teal-600 to-teal-700 border-0">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-5 h-5 text-teal-100" />
                <h2 className="text-lg font-bold text-white">Dozee Continuous Monitoring</h2>
              </div>
              <p className="text-teal-100 text-sm">Contactless overnight vitals &amp; sleep analytics</p>
            </div>
            <div className="text-right">
              <p className="text-teal-100 text-xs mb-1">7-day sleep quality avg</p>
              <p className={`text-3xl font-bold ${avg7Sleep >= 7 ? 'text-green-300' : avg7Sleep >= 5 ? 'text-amber-300' : 'text-red-300'}`}>
                {sleepData.length > 0 ? avg7Sleep.toFixed(1) : '—'}<span className="text-lg text-teal-200">/10</span>
              </p>
            </div>
          </div>

          {latestSleep && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <Moon className="w-4 h-4 text-teal-200 mx-auto mb-1" />
                <p className="text-xs text-teal-200">Last night sleep</p>
                <p className="text-lg font-bold text-white">{latestSleep.duration.toFixed(1)}h</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <Heart className="w-4 h-4 text-teal-200 mx-auto mb-1" />
                <p className="text-xs text-teal-200">Night HR</p>
                <p className="text-lg font-bold text-white">{hrLatest?.toFixed(0) ?? '—'}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <Activity className="w-4 h-4 text-teal-200 mx-auto mb-1" />
                <p className="text-xs text-teal-200">SpO2</p>
                <p className={`text-lg font-bold ${spo2Latest && spo2Latest < 95 ? 'text-red-300' : 'text-white'}`}>
                  {spo2Latest?.toFixed(1) ?? '—'}%
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sleep Quality Chart */}
      <SleepQualityChart observations={observations} />

      {/* Vital Signs Trend Cards */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Overnight Vital Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VitalCard
            icon={Heart}
            label="Heart Rate"
            latestValue={hrLatest}
            unit="bpm"
            historicalValues={hrSeries.map(d => d.value)}
            color="#ef4444"
            normalRange="60–100 bpm"
            isNormal={hrLatest === null ? null : hrLatest >= 60 && hrLatest <= 100}
            min={40}
            max={140}
          />
          <VitalCard
            icon={Activity}
            label="Blood Oxygen (SpO2)"
            latestValue={spo2Latest}
            unit="%"
            historicalValues={spo2Series.map(d => d.value)}
            color="#3b82f6"
            normalRange="≥95%"
            isNormal={spo2Latest === null ? null : spo2Latest >= 95}
            min={85}
            max={100}
          />
          <VitalCard
            icon={Wind}
            label="Respiratory Rate"
            latestValue={rrLatest}
            unit="br/min"
            historicalValues={rrSeries.map(d => d.value)}
            color="#8b5cf6"
            normalRange="12–20 br/min"
            isNormal={rrLatest === null ? null : rrLatest >= 12 && rrLatest <= 20}
            min={8}
            max={30}
          />
          <VitalCard
            icon={Moon}
            label="Sleep Quality Score"
            latestValue={sleepQLatest}
            unit="/10"
            historicalValues={sleepQSeries.map(d => d.value)}
            color="#f59e0b"
            normalRange="≥7/10"
            isNormal={sleepQLatest === null ? null : sleepQLatest >= 7}
            min={0}
            max={10}
          />
        </div>
      </div>

      {hrSeries.length === 0 && spo2Series.length === 0 && rrSeries.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">No Dozee monitoring data</p>
            <p className="text-xs text-gray-400 mt-1">Overnight vitals will appear here once the device begins recording.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
