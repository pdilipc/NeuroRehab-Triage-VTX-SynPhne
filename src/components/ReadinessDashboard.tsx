import { AlertCircle, CheckCircle2, AlertTriangle, XCircle, Heart, Activity, Moon, Battery } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { assessReadiness, ReadinessStatus } from '../utils/observationUtils';

interface ReadinessDashboardProps {
  observations: fhir.Observation[];
}

export function ReadinessDashboard({ observations }: ReadinessDashboardProps) {
  const readiness = assessReadiness(observations);

  const getStatusConfig = (status: ReadinessStatus['overall']) => {
    switch (status) {
      case 'ready':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'from-green-50 to-green-100',
          borderColor: 'border-green-200',
          titleColor: 'text-green-900',
          label: 'Ready for Session',
          description: 'Patient is in good condition to proceed with neurorehabilitation session',
        };
      case 'caution':
        return {
          icon: AlertTriangle,
          color: 'text-amber-600',
          bgColor: 'from-amber-50 to-amber-100',
          borderColor: 'border-amber-200',
          titleColor: 'text-amber-900',
          label: 'Proceed with Caution',
          description: 'Consider modifying the session intensity or duration based on current status',
        };
      case 'defer':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'from-red-50 to-red-100',
          borderColor: 'border-red-200',
          titleColor: 'text-red-900',
          label: 'Consider Deferring',
          description: 'Patient may not be ready for therapy session. Review concerns before proceeding',
        };
    }
  };

  const getIndicatorConfig = (type: string, value: string) => {
    if (type === 'heartRate' || type === 'bloodPressure') {
      if (value === 'elevated') return { icon: '↑', color: 'text-red-600', bg: 'bg-red-100', label: 'Elevated' };
      if (value === 'low') return { icon: '↓', color: 'text-amber-600', bg: 'bg-amber-100', label: 'Low' };
      return { icon: '✓', color: 'text-green-600', bg: 'bg-green-100', label: 'Normal' };
    }

    if (type === 'sleepQuality') {
      if (value === 'poor') return { icon: '!', color: 'text-red-600', bg: 'bg-red-100', label: 'Poor' };
      if (value === 'moderate') return { icon: '○', color: 'text-amber-600', bg: 'bg-amber-100', label: 'Moderate' };
      return { icon: '✓', color: 'text-green-600', bg: 'bg-green-100', label: 'Good' };
    }

    if (type === 'fatigue') {
      if (value === 'severe') return { icon: '!!', color: 'text-red-600', bg: 'bg-red-100', label: 'Severe' };
      if (value === 'moderate') return { icon: '!', color: 'text-amber-600', bg: 'bg-amber-100', label: 'Moderate' };
      if (value === 'mild') return { icon: '○', color: 'text-blue-600', bg: 'bg-blue-100', label: 'Mild' };
      return { icon: '✓', color: 'text-green-600', bg: 'bg-green-100', label: 'None' };
    }

    return { icon: '?', color: 'text-gray-600', bg: 'bg-gray-100', label: 'Unknown' };
  };

  const config = getStatusConfig(readiness.overall);
  const StatusIcon = config?.icon || AlertCircle;

  if (!config) return null;

  return (
    <Card className={`overflow-hidden border-2 ${config.borderColor}`}>
      <div className={`bg-gradient-to-r ${config.bgColor} px-6 py-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl ${config.bgColor} border-2 ${config.borderColor} flex items-center justify-center shadow-md`}>
              <StatusIcon className={`w-8 h-8 ${config.color}`} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${config.titleColor}`}>{config.label}</h2>
              <p className="text-sm text-gray-600 mt-0.5">{config.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Session Readiness</p>
            <div className={`text-2xl font-bold ${config.color}`}>
              {readiness.overall === 'ready' ? '✓' : readiness.overall === 'caution' ? '!' : '✗'}
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <Heart className="w-5 h-5 text-red-600" />
              </div>
              {(() => {
                const indicator = getIndicatorConfig('heartRate', readiness.heartRate);
                return (
                  <span className={`text-xs px-2 py-1 rounded-full ${indicator.bg} ${indicator.color} font-medium`}>
                    {indicator.label}
                  </span>
                );
              })()}
            </div>
            <p className="text-sm font-medium text-gray-900">Heart Rate</p>
            <p className="text-xs text-gray-500 mt-1">{readiness.heartRate}</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                <Activity className="w-5 h-5 text-rose-600" />
              </div>
              {(() => {
                const indicator = getIndicatorConfig('bloodPressure', readiness.bloodPressure);
                return (
                  <span className={`text-xs px-2 py-1 rounded-full ${indicator.bg} ${indicator.color} font-medium`}>
                    {indicator.label}
                  </span>
                );
              })()}
            </div>
            <p className="text-sm font-medium text-gray-900">Blood Pressure</p>
            <p className="text-xs text-gray-500 mt-1">{readiness.bloodPressure}</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Moon className="w-5 h-5 text-indigo-600" />
              </div>
              {(() => {
                const indicator = getIndicatorConfig('sleepQuality', readiness.sleepQuality);
                return (
                  <span className={`text-xs px-2 py-1 rounded-full ${indicator.bg} ${indicator.color} font-medium`}>
                    {indicator.label}
                  </span>
                );
              })()}
            </div>
            <p className="text-sm font-medium text-gray-900">Sleep Quality</p>
            <p className="text-xs text-gray-500 mt-1">{readiness.sleepQuality}</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Battery className="w-5 h-5 text-amber-600" />
              </div>
              {(() => {
                const indicator = getIndicatorConfig('fatigue', readiness.fatigue);
                return (
                  <span className={`text-xs px-2 py-1 rounded-full ${indicator.bg} ${indicator.color} font-medium`}>
                    {indicator.label}
                  </span>
                );
              })()}
            </div>
            <p className="text-sm font-medium text-gray-900">Fatigue Level</p>
            <p className="text-xs text-gray-500 mt-1">{readiness.fatigue}</p>
          </div>
        </div>

        {readiness.reasons.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Considerations:</p>
                <ul className="space-y-2">
                  {readiness.reasons.map((reason, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
