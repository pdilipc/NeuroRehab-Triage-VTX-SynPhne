import { VITAL_SIGNS_LOINC, NEUROREHAB_LOINC } from '../config/fhir.config';

export interface ObservationData {
  code: string;
  display: string;
  value: number;
  unit: string;
  date: string;
  effectiveDateTime: string;
}

export interface VitalSign {
  code: string;
  display: string;
  value: number;
  unit: string;
  date: string;
  systolic?: number;
  diastolic?: number;
}

export interface FuglMeyerScore {
  upper: number;
  lower: number;
  total: number;
  date: string;
}

export interface SleepData {
  duration: number;
  quality: number;
  date: string;
}

export interface ReadinessStatus {
  heartRate: 'normal' | 'elevated' | 'low';
  bloodPressure: 'normal' | 'elevated' | 'low';
  sleepQuality: 'good' | 'moderate' | 'poor';
  fatigue: 'none' | 'mild' | 'moderate' | 'severe';
  overall: 'ready' | 'caution' | 'defer';
  reasons: string[];
}

const LOINC_DISPLAY_NAMES: Record<string, string> = {
  [VITAL_SIGNS_LOINC.HEART_RATE]: 'Heart Rate',
  [VITAL_SIGNS_LOINC.TEMPERATURE]: 'Temperature',
  [VITAL_SIGNS_LOINC.RESPIRATORY_RATE]: 'Respiratory Rate',
  [VITAL_SIGNS_LOINC.OXYGEN_SATURATION]: 'Oxygen Saturation',
  [VITAL_SIGNS_LOINC.SYSTOLIC_BP]: 'Systolic BP',
  [VITAL_SIGNS_LOINC.DIASTOLIC_BP]: 'Diastolic BP',
  [VITAL_SIGNS_LOINC.HEIGHT]: 'Height',
  [VITAL_SIGNS_LOINC.WEIGHT]: 'Weight',
  [VITAL_SIGNS_LOINC.BMI]: 'BMI',
  [NEUROREHAB_LOINC.FUGL_MEYER_UPPER]: 'Fugl-Meyer Upper Extremity',
  [NEUROREHAB_LOINC.FUGL_MEYER_LOWER]: 'Fugl-Meyer Lower Extremity',
  [NEUROREHAB_LOINC.FUGL_MEYER_TOTAL]: 'Fugl-Meyer Total',
  [NEUROREHAB_LOINC.FATIGUE_SEVERITY]: 'Fatigue Severity',
  [NEUROREHAB_LOINC.PAIN_INTENSITY]: 'Pain Intensity',
  [NEUROREHAB_LOINC.SLEEP_DURATION]: 'Sleep Duration',
  [NEUROREHAB_LOINC.SLEEP_QUALITY]: 'Sleep Quality',
};

export function parseObservation(observation: fhir.Observation): ObservationData | null {
  const code = observation.code?.coding?.[0]?.code || '';
  const effectiveDate = observation.effectiveDateTime || observation.effectivePeriod?.start || '';

  if (!code || !effectiveDate) return null;

  const value = observation.valueQuantity?.value || observation.valueInteger || 0;
  const unit = observation.valueQuantity?.unit || '';
  const display = LOINC_DISPLAY_NAMES[code] || observation.code?.text || code;

  return {
    code,
    display,
    value: typeof value === 'number' ? value : 0,
    unit,
    date: new Date(effectiveDate).toLocaleDateString(),
    effectiveDateTime: effectiveDate,
  };
}

export function groupObservationsByCode(observations: fhir.Observation[]): Map<string, ObservationData[]> {
  const grouped = new Map<string, ObservationData[]>();

  observations.forEach(obs => {
    const parsed = parseObservation(obs);
    if (parsed) {
      const existing = grouped.get(parsed.code) || [];
      existing.push(parsed);
      grouped.set(parsed.code, existing);
    }
  });

  return grouped;
}

export function getLatestVitalSigns(observations: fhir.Observation[]): VitalSign[] {
  const grouped = groupObservationsByCode(observations);
  const vitals: VitalSign[] = [];

  const vitalCodes = Object.values(VITAL_SIGNS_LOINC);
  vitalCodes.forEach(code => {
    const obs = grouped.get(code);
    if (obs && obs.length > 0) {
      const latest = obs.sort((a, b) =>
        new Date(b.effectiveDateTime).getTime() - new Date(a.effectiveDateTime).getTime()
      )[0];

      if (code === VITAL_SIGNS_LOINC.SYSTOLIC_BP) {
        const diastolicObs = grouped.get(VITAL_SIGNS_LOINC.DIASTOLIC_BP);
        const latestDiastolic = diastolicObs?.sort((a, b) =>
          new Date(b.effectiveDateTime).getTime() - new Date(a.effectiveDateTime).getTime()
        )[0];

        vitals.push({
          code: '55284-4',
          display: 'Blood Pressure',
          value: 0,
          unit: 'mmHg',
          date: latest.date,
          systolic: latest.value,
          diastolic: latestDiastolic?.value,
        });
      } else if (code !== VITAL_SIGNS_LOINC.DIASTOLIC_BP) {
        vitals.push({
          code: latest.code,
          display: latest.display,
          value: latest.value,
          unit: latest.unit,
          date: latest.date,
        });
      }
    }
  });

  return vitals;
}

export function getFuglMeyerScores(observations: fhir.Observation[]): FuglMeyerScore[] {
  const grouped = groupObservationsByCode(observations);

  const upperScores = grouped.get(NEUROREHAB_LOINC.FUGL_MEYER_UPPER) || [];
  const lowerScores = grouped.get(NEUROREHAB_LOINC.FUGL_MEYER_LOWER) || [];
  const totalScores = grouped.get(NEUROREHAB_LOINC.FUGL_MEYER_TOTAL) || [];

  const scoreMap = new Map<string, FuglMeyerScore>();

  const ensureDate = (dateKey: string, displayDate: string) => {
    if (!scoreMap.has(dateKey)) {
      scoreMap.set(dateKey, { upper: 0, lower: 0, total: 0, date: displayDate });
    }
  };

  upperScores.forEach(score => {
    const date = score.effectiveDateTime.split('T')[0];
    ensureDate(date, score.date);
    scoreMap.get(date)!.upper = score.value;
  });

  lowerScores.forEach(score => {
    const date = score.effectiveDateTime.split('T')[0];
    ensureDate(date, score.date);
    scoreMap.get(date)!.lower = score.value;
  });

  totalScores.forEach(score => {
    const date = score.effectiveDateTime.split('T')[0];
    ensureDate(date, score.date);
    scoreMap.get(date)!.total = score.value;
  });

  // If total wasn't recorded separately, derive it from upper + lower
  scoreMap.forEach(entry => {
    if (entry.total === 0 && (entry.upper > 0 || entry.lower > 0)) {
      entry.total = entry.upper + entry.lower;
    }
  });

  return Array.from(scoreMap.values()).sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getSleepData(observations: fhir.Observation[]): SleepData[] {
  const grouped = groupObservationsByCode(observations);

  const durationScores = grouped.get(NEUROREHAB_LOINC.SLEEP_DURATION) || [];
  const qualityScores = grouped.get(NEUROREHAB_LOINC.SLEEP_QUALITY) || [];

  const sleepMap = new Map<string, SleepData>();

  const ensureDate = (dateKey: string, displayDate: string) => {
    if (!sleepMap.has(dateKey)) {
      sleepMap.set(dateKey, { duration: 0, quality: 0, date: displayDate });
    }
  };

  durationScores.forEach(score => {
    const date = score.effectiveDateTime.split('T')[0];
    ensureDate(date, score.date);
    sleepMap.get(date)!.duration = score.value;
  });

  qualityScores.forEach(score => {
    const date = score.effectiveDateTime.split('T')[0];
    ensureDate(date, score.date);
    sleepMap.get(date)!.quality = score.value;
  });

  return Array.from(sleepMap.values()).sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// Returns the most recent observation matching a LOINC code, regardless of age.
// If older than staleHours, appends a stale note to reasons.
function latestObs(
  observations: fhir.Observation[],
  code: string,
  staleHours: number,
  reasons: string[],
  staleLabel: string
): fhir.Observation | undefined {
  const matches = observations
    .filter(o => o.code?.coding?.[0]?.code === code)
    .sort((a, b) => {
      const da = new Date(a.effectiveDateTime || a.effectivePeriod?.start || 0).getTime();
      const db = new Date(b.effectiveDateTime || b.effectivePeriod?.start || 0).getTime();
      return db - da;
    });

  if (matches.length === 0) return undefined;

  const obs = matches[0];
  const age = Date.now() - new Date(obs.effectiveDateTime || obs.effectivePeriod?.start || 0).getTime();
  if (age > staleHours * 60 * 60 * 1000) {
    reasons.push(`${staleLabel} data is more than ${staleHours}h old — verify before session`);
  }
  return obs;
}

export function assessReadiness(observations: fhir.Observation[]): ReadinessStatus {
  const reasons: string[] = [];
  let heartRate: 'normal' | 'elevated' | 'low' = 'normal';
  let bloodPressure: 'normal' | 'elevated' | 'low' = 'normal';
  let sleepQuality: 'good' | 'moderate' | 'poor' = 'good';
  let fatigue: 'none' | 'mild' | 'moderate' | 'severe' = 'none';

  const hrObs = latestObs(observations, VITAL_SIGNS_LOINC.HEART_RATE, 24, reasons, 'Heart rate');
  if (hrObs?.valueQuantity?.value) {
    const hr = hrObs.valueQuantity.value;
    if (hr > 100) {
      heartRate = 'elevated';
      reasons.push('Elevated heart rate');
    } else if (hr < 50) {
      heartRate = 'low';
      reasons.push('Low heart rate');
    }
  }

  const systolicObs = latestObs(observations, VITAL_SIGNS_LOINC.SYSTOLIC_BP, 24, reasons, 'Blood pressure');
  if (systolicObs?.valueQuantity?.value) {
    const sbp = systolicObs.valueQuantity.value;
    if (sbp > 140) {
      bloodPressure = 'elevated';
      reasons.push('Elevated blood pressure');
    } else if (sbp < 90) {
      bloodPressure = 'low';
      reasons.push('Low blood pressure');
    }
  }

  const sleepQualityObs = latestObs(observations, NEUROREHAB_LOINC.SLEEP_QUALITY, 36, reasons, 'Sleep quality');
  if (sleepQualityObs?.valueQuantity?.value) {
    const quality = sleepQualityObs.valueQuantity.value;
    if (quality < 5) {
      sleepQuality = 'poor';
      reasons.push('Poor sleep quality last night');
    } else if (quality < 7) {
      sleepQuality = 'moderate';
    }
  }

  const fatigueObs = latestObs(observations, NEUROREHAB_LOINC.FATIGUE_SEVERITY, 24, reasons, 'Fatigue');
  if (fatigueObs?.valueQuantity?.value) {
    const fatigueScore = fatigueObs.valueQuantity.value;
    if (fatigueScore > 7) {
      fatigue = 'severe';
      reasons.push('Severe fatigue reported');
    } else if (fatigueScore > 5) {
      fatigue = 'moderate';
      reasons.push('Moderate fatigue reported');
    } else if (fatigueScore > 3) {
      fatigue = 'mild';
    }
  }

  let overall: 'ready' | 'caution' | 'defer' = 'ready';
  if (reasons.length >= 2) {
    overall = 'defer';
  } else if (reasons.length === 1) {
    overall = 'caution';
  }

  return {
    heartRate,
    bloodPressure,
    sleepQuality,
    fatigue,
    overall,
    reasons,
  };
}
