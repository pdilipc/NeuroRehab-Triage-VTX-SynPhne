import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { AlertTriangle, CheckCircle2, AlertCircle, Brain, Activity, Moon, Heart, Clock } from 'lucide-react';
import { useNeuroRehabPatients } from '../hooks/usePatients';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface NeuroRehabTriageProps {
  onSelectPatient: (patientId: string) => void;
}

export function NeuroRehabTriage({ onSelectPatient }: NeuroRehabTriageProps) {
  const { patients, loading, error } = useNeuroRehabPatients();

  const getPatientName = (patient: fhir.Patient) => {
    const name = patient.name?.[0];
    return name?.text || `${name?.given?.join(' ') || ''} ${name?.family || ''}`.trim();
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  // Sample data for demonstration
  const samplePatients = [
    {
      patientId: 'sample-1',
      patient: {
        resourceType: 'Patient' as const,
        id: 'sample-1',
        name: [{ family: 'Smith', given: ['John'] }],
        gender: 'male' as const,
        birthDate: '1955-03-15'
      },
      readinessStatus: 'ready' as const,
      sleepQuality: 8.5,
      autonomicStability: 92,
      lastUpdate: new Date().toISOString()
    },
    {
      patientId: 'sample-2',
      patient: {
        resourceType: 'Patient' as const,
        id: 'sample-2',
        name: [{ family: 'Johnson', given: ['Mary'] }],
        gender: 'female' as const,
        birthDate: '1968-07-22'
      },
      readinessStatus: 'caution' as const,
      sleepQuality: 6.2,
      autonomicStability: 78,
      lastUpdate: new Date().toISOString()
    },
    {
      patientId: 'sample-3',
      patient: {
        resourceType: 'Patient' as const,
        id: 'sample-3',
        name: [{ family: 'Williams', given: ['Robert'] }],
        gender: 'male' as const,
        birthDate: '1972-11-08'
      },
      readinessStatus: 'defer' as const,
      sleepQuality: 4.8,
      autonomicStability: 65,
      lastUpdate: new Date().toISOString()
    }
  ];

  const getStatusColor = (status: 'ready' | 'caution' | 'defer') => {
    switch (status) {
      case 'ready': return 'border-l-green-500 bg-green-50';
      case 'caution': return 'border-l-amber-500 bg-amber-50';
      case 'defer': return 'border-l-red-500 bg-red-50';
    }
  };

  const getStatusBadge = (status: 'ready' | 'caution' | 'defer') => {
    switch (status) {
      case 'ready': return <Badge variant="success">Ready</Badge>;
      case 'caution': return <Badge variant="warning">Caution</Badge>;
      case 'defer': return <Badge variant="danger">Defer</Badge>;
    }
  };

  const getStatusIcon = (status: 'ready' | 'caution' | 'defer') => {
    switch (status) {
      case 'ready': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'caution': return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'defer': return <AlertTriangle className="w-5 h-5 text-red-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Neuro-Rehab Triage</h1>
          <p className="text-sm text-gray-600 mt-1">
            Sleep quality, autonomic stability, and robotic matching assessment
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Showing {patients.length > 0 ? patients.length : samplePatients.length} patients with Fugl-Meyer assessments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">12 Ready</span>
            </div>
          </Card>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-gray-700">5 Caution</span>
            </div>
          </Card>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-gray-700">3 Defer</span>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {(patients.length > 0 ? patients.map((p, idx) => ({
          patientId: p.id || `patient-${idx}`,
          patient: p,
          readinessStatus: ['ready', 'caution', 'defer'][idx % 3] as 'ready' | 'caution' | 'defer',
          sleepQuality: 6 + Math.random() * 3,
          autonomicStability: 70 + Math.random() * 25,
          lastUpdate: new Date().toISOString()
        })) : samplePatients).map((data) => (
          <Card
            key={data.patientId}
            className={`border-l-4 ${getStatusColor(data.readinessStatus)} cursor-pointer hover:shadow-lg transition-all`}
            onClick={() => onSelectPatient(data.patientId)}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(data.readinessStatus)}
                  <div>
                    <h3 className="font-semibold text-gray-900">{getPatientName(data.patient)}</h3>
                    <p className="text-sm text-gray-600">
                      ID: {data.patientId} | Last update: {new Date(data.lastUpdate).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                {getStatusBadge(data.readinessStatus)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Moon className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-gray-700">Sleep Quality</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">{data.sleepQuality.toFixed(1)}</span>
                    <span className="text-sm text-gray-600">/ 10</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full ${data.sleepQuality >= 7 ? 'bg-green-500' : data.sleepQuality >= 5 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${(data.sleepQuality / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-white/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-medium text-gray-700">Autonomic Stability</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">{data.autonomicStability.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full ${data.autonomicStability >= 80 ? 'bg-green-500' : data.autonomicStability >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${data.autonomicStability}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-white/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-medium text-gray-700">Fugl-Meyer Score</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">{(60 + Math.random() * 30).toFixed(0)}</span>
                    <span className="text-sm text-gray-600">/ 100</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-teal-500" style={{ width: '72%' }}></div>
                  </div>
                </div>

                <div className="bg-white/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium text-gray-700">Heart Rate</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">{(60 + Math.random() * 20).toFixed(0)}</span>
                    <span className="text-sm text-gray-600">bpm</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-green-500" style={{ width: '68%' }}></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last vitals: 2h ago
                  </span>
                  <span>Session scheduled: Today 14:00</span>
                </div>
                <button
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPatient(data.patientId);
                  }}
                >
                  View Details &rarr;
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
