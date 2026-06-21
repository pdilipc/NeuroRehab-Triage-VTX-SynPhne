import { useState } from 'react';
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Activity, MessageSquare, Clock, TrendingUp } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { ReadinessDashboard } from './ReadinessDashboard';
import { VitalSignsPanel } from './VitalSignsPanel';
import { FuglMeyerChart } from './FuglMeyerChart';
import { SleepQualityChart } from './SleepQualityChart';
import { assessReadiness, getFuglMeyerScores } from '../utils/observationUtils';

interface SessionPlannerProps {
  patient: fhir.Patient;
  observations: fhir.Observation[];
  onBack: () => void;
  onDocument: (decision: 'proceed' | 'modify' | 'defer') => void;
}

type Decision = 'proceed' | 'modify' | 'defer';

export function SessionPlanner({ patient, observations, onBack, onDocument }: SessionPlannerProps) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [sessionNotes, setSessionNotes] = useState('');
  const [showFullContext, setShowFullContext] = useState(false);

  const readiness = assessReadiness(observations);

  const getPatientName = (p: fhir.Patient) => {
    const name = p.name?.[0];
    return name?.text || `${name?.given?.join(' ') || ''} ${name?.family || ''}`.trim();
  };

  const getDecisionConfig = (dec: Decision) => {
    switch (dec) {
      case 'proceed':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'bg-green-50 hover:bg-green-100 border-green-200',
          activeBg: 'bg-green-600 text-white',
          label: 'Proceed with Session',
          description: 'Patient is ready to proceed with standard therapy session',
        };
      case 'modify':
        return {
          icon: AlertTriangle,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
          activeBg: 'bg-amber-600 text-white',
          label: 'Modify Session',
          description: 'Proceed with modified intensity or duration',
        };
      case 'defer':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50 hover:bg-red-100 border-red-200',
          activeBg: 'bg-red-600 text-white',
          label: 'Defer Session',
          description: 'Postpone session based on current patient status',
        };
    }
  };

  const modificationOptions = [
    { value: 'reduced_intensity', label: 'Reduced Intensity' },
    { value: 'shorter_duration', label: 'Shorter Duration' },
    { value: 'alternative_exercises', label: 'Alternative Exercises' },
    { value: 'rest_breaks', label: 'More Rest Breaks' },
    { value: 'focus_upper_extremity', label: 'Focus on Upper Extremity' },
    { value: 'focus_lower_extremity', label: 'Focus on Lower Extremity' },
    { value: 'light_stretching', label: 'Light Stretching Only' },
    { value: 'other', label: 'Other' },
  ];

  const recommendedDecision = readiness.overall;

  const handleConfirm = () => {
    if (decision) {
      onDocument(decision);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Patient Details</span>
      </button>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="w-6 h-6 text-white" />
                  <CardTitle className="text-white">Session Planning</CardTitle>
                </div>
                {recommendedDecision && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-blue-100">Recommended:</span>
                    <Badge
                      variant={readiness.overall === 'ready' ? 'success' : readiness.overall === 'caution' ? 'warning' : 'danger'}
                      className="bg-white/20 text-white border-white/30"
                    >
                      {readiness.overall === 'ready' ? 'Proceed' : readiness.overall === 'caution' ? 'Modify' : 'Defer'}
                    </Badge>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Session for {getPatientName(patient)}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    Neurorehabilitation Session
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {(['proceed', 'modify', 'defer'] as Decision[]).map((dec) => {
                  const config = getDecisionConfig(dec);
                  const Icon = config.icon;
                  const isSelected = decision === dec;

                  return (
                    <button
                      key={dec}
                      onClick={() => setDecision(dec)}
                      className={`relative p-5 rounded-lg border-2 transition-all duration-200 ${
                        isSelected ? config.activeBg + ' border-transparent shadow-lg' : config.bgColor + ' border'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-3">
                        <Icon className={`w-8 h-8 ${isSelected ? '' : config.color}`} />
                      </div>
                      <h4 className={`text-sm font-semibold mb-1 ${isSelected ? '' : 'text-gray-900'}`}>
                        {config.label}
                      </h4>
                      <p className={`text-xs ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                        {config.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {decision === 'modify' && (
                <div className="mb-6 space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modification Reason
                    </label>
                    <textarea
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      placeholder="Describe the modifications needed..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modifications
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {modificationOptions.map((option) => (
                        <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {decision === 'defer' && (
                <div className="mb-6 space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deferral Reason
                    </label>
                    <textarea
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      placeholder="Explain why the session is being deferred..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">
                      Consider rescheduling this session within the next 24-48 hours or consulting with the care team.
                    </p>
                  </div>
                </div>
              )}

              {decision === 'proceed' && (
                <div className="mb-6 animate-fade-in">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      Patient is cleared to proceed with standard neurorehabilitation session based on current readiness indicators.
                    </p>
                  </div>
                </div>
              )}

              {decision && (
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleConfirm}
                    variant={decision === 'defer' ? 'danger' : decision === 'modify' ? 'warning' : 'success'}
                  >
                    {decision === 'proceed' && 'Start Session'}
                    {decision === 'modify' && 'Start Modified Session'}
                    {decision === 'defer' && 'Confirm Deferral'}
                  </Button>
                  <Button onClick={onBack} variant="ghost">
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div>
            <button
              onClick={() => setShowFullContext(!showFullContext)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors mb-4"
            >
              <MessageSquare className="w-5 h-5" />
              {showFullContext ? 'Hide Full Context' : 'Show Full Patient Context'}
            </button>

            {showFullContext && (
              <div className="space-y-6 animate-fade-in">
                <ReadinessDashboard observations={observations} />
                <VitalSignsPanel observations={observations} loading={false} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FuglMeyerChart observations={observations} />
                  <SleepQualityChart observations={observations} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <ReadinessDashboard observations={observations} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Assessment Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const scores = getFuglMeyerScores(observations);
                if (scores.length === 0) {
                  return <p className="text-sm text-gray-500">No Fugl-Meyer assessments available</p>;
                }

                const latest = scores[0];
                const previous = scores.length > 1 ? scores[1] : null;
                const improvement = previous ? latest.total - previous.total : null;

                return (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-900">Fugl-Meyer Total</span>
                        {improvement !== null && (
                          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                            improvement > 0 ? 'bg-green-100 text-green-700' :
                            improvement < 0 ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            <TrendingUp className={`w-3 h-3 ${improvement >= 0 ? '' : 'rotate-180'}`} />
                            {improvement > 0 ? '+' : ''}{improvement}
                          </div>
                        )}
                      </div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-3xl font-bold text-blue-900">{latest.total}</span>
                        <span className="text-sm text-blue-700">/ 100 points</span>
                      </div>
                      <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                          style={{ width: `${latest.total}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-3">
                        <p className="text-xs text-teal-700 mb-1">Upper Extremity</p>
                        <p className="text-2xl font-bold text-teal-900">{latest.upper}</p>
                        <p className="text-xs text-teal-600 mt-1">/ 66 points</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3">
                        <p className="text-xs text-green-700 mb-1">Lower Extremity</p>
                        <p className="text-2xl font-bold text-green-900">{latest.lower}</p>
                        <p className="text-xs text-green-600 mt-1">/ 34 points</p>
                      </div>
                    </div>

                    {readiness.reasons.length > 0 && (
                      <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                        <p className="text-xs font-medium text-amber-800 mb-2">Clinical Considerations:</p>
                        <ul className="space-y-1">
                          {readiness.reasons.map((reason, idx) => (
                            <li key={idx} className="text-xs text-amber-700 flex items-start gap-2">
                              <span className="flex-shrink-0">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
