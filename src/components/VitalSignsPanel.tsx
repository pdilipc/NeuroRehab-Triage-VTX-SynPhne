import { useState } from 'react';
import { Heart, Thermometer, Wind, Droplet, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { getLatestVitalSigns } from '../utils/observationUtils';

interface VitalSignsPanelProps {
  observations: fhir.Observation[];
  loading: boolean;
}

export function VitalSignsPanel({ observations, loading }: VitalSignsPanelProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'chart'>('grid');
  const vitals = getLatestVitalSigns(observations);

  const getVitalIcon = (code: string) => {
    switch (code) {
      case '8867-4': return Heart;
      case '8310-5': return Thermometer;
      case '9279-3': return Wind;
      case '59408-5': return Droplet;
      case '55284-4': return Activity;
      default: return Activity;
    }
  };

  const getVitalColor = (code: string) => {
    switch (code) {
      case '8867-4': return 'from-red-500 to-red-600';
      case '8310-5': return 'from-orange-500 to-orange-600';
      case '9279-3': return 'from-teal-500 to-teal-600';
      case '59408-5': return 'from-cyan-500 to-cyan-600';
      case '55284-4': return 'from-rose-500 to-rose-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  const getVitalTrend = (value: number, code: string) => {
    const normalRanges: Record<string, [number, number]> = {
      '8867-4': [60, 100],
      '8310-5': [36.1, 37.2],
      '9279-3': [12, 20],
      '59408-5': [95, 100],
      '55284-4': [90, 120],
    };

    const range = normalRanges[code];
    if (!range) return { icon: Minus, color: 'text-gray-400', label: 'N/A' };

    if (value < range[0]) {
      return { icon: TrendingDown, color: 'text-amber-500', label: 'Low' };
    } else if (value > range[1]) {
      return { icon: TrendingUp, color: 'text-red-500', label: 'High' };
    }
    return { icon: Minus, color: 'text-green-500', label: 'Normal' };
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (vitals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vital Signs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No vital signs data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Vital Signs</CardTitle>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('chart')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'chart' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Table
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {vitals.map((vital) => {
              const Icon = getVitalIcon(vital.code);
              const gradientColor = getVitalColor(vital.code);
              const trend = getVitalTrend(
                vital.systolic || vital.value,
                vital.code === '55284-4' ? '55284-4' : vital.code
              );
              const TrendIcon = trend.icon;

              return (
                <div
                  key={vital.code}
                  className="group relative bg-gray-50 rounded-xl p-4 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradientColor} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <TrendIcon className={`w-5 h-5 ${trend.color}`} />
                  </div>

                  <div className="mb-1">
                    <p className="text-xs text-gray-500">{vital.display}</p>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-gray-900">
                      {vital.systolic !== undefined
                        ? `${vital.systolic}/${vital.diastolic || '--'}`
                        : vital.value}
                    </p>
                    <p className="text-sm text-gray-500">{vital.unit}</p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-400">{vital.date}</p>
                  </div>

                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      trend.label === 'Normal' ? 'bg-green-100 text-green-700' :
                      trend.label === 'High' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {trend.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Vital Sign</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Value</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {vitals.map((vital) => {
                  const trend = getVitalTrend(
                    vital.systolic || vital.value,
                    vital.code === '55284-4' ? '55284-4' : vital.code
                  );

                  return (
                    <tr key={vital.code} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {vital.display}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {vital.systolic !== undefined
                          ? `${vital.systolic}/${vital.diastolic || '--'} ${vital.unit}`
                          : `${vital.value} ${vital.unit}`}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{vital.date}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          trend.label === 'Normal' ? 'bg-green-100 text-green-700' :
                          trend.label === 'High' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {trend.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
