import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { AlertTriangle, Thermometer, Heart, Activity, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';

export function AcuteDeteriorationTriage() {
  const sampleData = [
    {
      patientId: 'acute-1',
      patientName: 'Emily Davis',
      news2Score: 7,
      temperature: 38.5,
      heartRate: 112,
      respiratoryRate: 24,
      oxygenSaturation: 91,
      systolicBP: 95,
      consciousness: 'Alert',
      sepsisRisk: 'high',
      lastUpdate: new Date(Date.now() - 300000).toISOString()
    },
    {
      patientId: 'acute-2',
      patientName: 'Michael Brown',
      news2Score: 5,
      temperature: 37.2,
      heartRate: 95,
      respiratoryRate: 18,
      oxygenSaturation: 95,
      systolicBP: 110,
      consciousness: 'Alert',
      sepsisRisk: 'moderate',
      lastUpdate: new Date(Date.now() - 600000).toISOString()
    },
    {
      patientId: 'acute-3',
      patientName: 'Sarah Wilson',
      news2Score: 3,
      temperature: 36.8,
      heartRate: 78,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      systolicBP: 120,
      consciousness: 'Alert',
      sepsisRisk: 'low',
      lastUpdate: new Date(Date.now() - 1200000).toISOString()
    }
  ];

  const getNEWS2Color = (score: number) => {
    if (score >= 7) return 'text-red-600 bg-red-100';
    if (score >= 5) return 'text-amber-600 bg-amber-100';
    if (score >= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  // Vital trend analysis function (reserved for future use)
  const _getVitalTrend = (value: number, normal: [number, number]) => {
    if (value < normal[0]) return { icon: TrendingDown, color: 'text-blue-600' };
    if (value > normal[1]) return { icon: TrendingUp, color: 'text-red-600' };
    return { icon: Minus, color: 'text-green-600' };
  };
  void _getVitalTrend; // Suppress warning

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Acute Deterioration Triage</h1>
          <p className="text-sm text-gray-600 mt-1">
            NEWS2 scores, sepsis screening, and critical telemetry alerts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Card className="px-4 py-2 border-2 border-red-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-bold text-red-600">3 Critical</span>
            </div>
          </Card>
          <Card className="px-4 py-2 border-2 border-amber-200">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-bold text-amber-600">8 Monitor</span>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sampleData.map((data) => {
          return (
            <Card
              key={data.patientId}
              className={`border-l-4 ${
                data.news2Score >= 7 ? 'border-l-red-500 bg-red-50' :
                data.news2Score >= 5 ? 'border-l-amber-500 bg-amber-50' :
                'border-l-green-500 bg-green-50'
              } cursor-pointer hover:shadow-lg transition-all`}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      data.news2Score >= 7 ? 'bg-red-200' :
                      data.news2Score >= 5 ? 'bg-amber-200' :
                      'bg-green-200'
                    }`}>
                      <AlertTriangle className={`w-6 h-6 ${
                        data.news2Score >= 7 ? 'text-red-600' :
                        data.news2Score >= 5 ? 'text-amber-600' :
                        'text-green-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{data.patientName}</h3>
                      <p className="text-xs text-gray-600">
                        Last updated: {new Date(data.lastUpdate).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1.5 rounded-lg ${getNEWS2Color(data.news2Score)}`}>
                      <div className="text-xs font-medium mb-0.5">NEWS2 Score</div>
                      <div className="text-2xl font-bold text-center">{data.news2Score}</div>
                    </div>
                    <Badge variant={data.sepsisRisk === 'high' ? 'danger' : data.sepsisRisk === 'moderate' ? 'warning' : 'success'}>
                      Sepsis: {data.sepsisRisk}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                  <div className="bg-white/70 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Thermometer className="w-3.5 h-3.5 text-orange-600" />
                      <span className="text-xs text-gray-700">Temp</span>
                    </div>
                    <span className={`text-lg font-bold ${
                      data.temperature > 38 || data.temperature < 36 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {data.temperature}°C
                    </span>
                  </div>

                  <div className="bg-white/70 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Heart className="w-3.5 h-3.5 text-red-600" />
                      <span className="text-xs text-gray-700">HR</span>
                    </div>
                    <span className={`text-lg font-bold ${
                      data.heartRate > 100 || data.heartRate < 50 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {data.heartRate}
                    </span>
                  </div>

                  <div className="bg-white/70 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Activity className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-xs text-gray-700">RR</span>
                    </div>
                    <span className={`text-lg font-bold ${
                      data.respiratoryRate > 20 || data.respiratoryRate < 12 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {data.respiratoryRate}
                    </span>
                  </div>

                  <div className="bg-white/70 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Zap className="w-3.5 h-3.5 text-cyan-600" />
                      <span className="text-xs text-gray-700">SpO2</span>
                    </div>
                    <span className={`text-lg font-bold ${
                      data.oxygenSaturation < 95 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {data.oxygenSaturation}%
                    </span>
                  </div>

                  <div className="bg-white/70 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Activity className="w-3.5 h-3.5 text-purple-600" />
                      <span className="text-xs text-gray-700">SBP</span>
                    </div>
                    <span className={`text-lg font-bold ${
                      data.systolicBP > 140 || data.systolicBP < 90 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {data.systolicBP}
                    </span>
                  </div>

                  <div className="bg-white/70 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs text-gray-700">ACVPU</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {data.consciousness}
                    </span>
                  </div>
                </div>

                {data.news2Score >= 7 && (
                  <div className="bg-red-100 border-2 border-red-300 rounded-lg p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-800">Critical Alert - Immediate Review Required</p>
                        <p className="text-xs text-red-700 mt-1">
                          NEWS2 &gt; 7 indicates high risk of clinical deterioration. Consider escalation to critical care team.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Telemetry:</span> Continuous monitoring active
                  </div>
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    View Full Monitor &rarr;
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
