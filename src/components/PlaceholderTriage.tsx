import { Card, CardContent } from './ui/Card';
import { BedDouble, Shield, LogOut, Users, AlertCircle } from 'lucide-react';

interface PlaceholderTriageProps {
  type: 'operational' | 'preventative' | 'throughput';
}

const triageConfig = {
  operational: {
    title: 'Resource Tracking',
    description: 'Bed tracking, nursing acuity, and isolation logistics',
    icon: <BedDouble className="w-8 h-8 text-amber-600" />,
    features: [
      'Real-time bed availability',
      'Nursing staff-to-patient ratios',
      'Isolation room tracking',
      'Equipment availability status',
      'Support team assignments'
    ]
  },
  preventative: {
    title: 'Preventative Care',
    description: 'DVT timelines, catheter windows, and fall risk assessments',
    icon: <Shield className="w-8 h-8 text-green-600" />,
    features: [
      'DVT prophylaxis tracking',
      'Catheter replacement windows',
      'Fall risk scoring',
      'Prophylaxis compliance monitoring',
      'Risk assessment timelines'
    ]
  },
  throughput: {
    title: 'Discharge Planning',
    description: 'Insurance authorizations, DME matching, and length of stay metrics',
    icon: <LogOut className="w-8 h-8 text-cyan-600" />,
    features: [
      'Insurance authorization status',
      'DME (Durable Medical Equipment) matching',
      'Length of stay tracking',
      'Discharge readiness assessment',
      'Post-acute care coordination'
    ]
  }
};

export function PlaceholderTriage({ type }: PlaceholderTriageProps) {
  const config = triageConfig[type];

  return (
    <div className="p-6">
      <Card className="max-w-3xl mx-auto">
        <CardContent className="p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              {config.icon}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{config.title}</h1>
              <p className="text-gray-600">{config.description}</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Coming Soon</p>
                <p className="text-sm text-blue-700 mt-1">
                  This triage module is currently under development. Check back soon for full functionality.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Planned Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {config.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-gray-50 rounded-lg p-3"
                >
                  <div className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>Requires additional FHIR resource mappings and real-time data streams</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
