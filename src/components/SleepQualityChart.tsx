import { Moon, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { getSleepData } from '../utils/observationUtils';

interface SleepQualityChartProps {
  observations: fhir.Observation[];
}

export function SleepQualityChart({ observations }: SleepQualityChartProps) {
  const sleepData = getSleepData(observations);

  const getQualityColor = (quality: number) => {
    if (quality >= 7) return 'text-green-600';
    if (quality >= 5) return 'text-amber-600';
    return 'text-red-600';
  };

  const getQualityBgColor = (quality: number) => {
    if (quality >= 7) return 'from-green-50 to-green-100';
    if (quality >= 5) return 'from-amber-50 to-amber-100';
    return 'from-red-50 to-red-100';
  };

  const getDurationCategory = (hours: number) => {
    if (hours >= 7 && hours <= 9) return { label: 'Optimal', color: 'bg-green-100 text-green-700' };
    if (hours >= 6 || hours <= 10) return { label: 'Adequate', color: 'bg-amber-100 text-amber-700' };
    return { label: 'Poor', color: 'bg-red-100 text-red-700' };
  };

  if (sleepData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-blue-600" />
            Sleep Quality
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No sleep data available</p>
        </CardContent>
      </Card>
    );
  }

  const latestSleep = sleepData[0];
  const previousSleep = sleepData.length > 1 ? sleepData[1] : null;
  const durationCategory = getDurationCategory(latestSleep.duration);

  const avgDuration = sleepData.reduce((sum, s) => sum + s.duration, 0) / sleepData.length;
  const avgQuality = sleepData.reduce((sum, s) => sum + s.quality, 0) / sleepData.length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-200">
        <CardTitle className="flex items-center gap-2">
          <Moon className="w-5 h-5 text-indigo-600" />
          Sleep Quality
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className={`bg-gradient-to-br ${getQualityBgColor(latestSleep.quality)} rounded-xl p-5`}>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Duration</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-900">{latestSleep.duration}</span>
              <span className="text-lg text-gray-600">hours</span>
            </div>
            <div className="mt-3">
              <span className={`text-xs px-2 py-1 rounded-full ${durationCategory.color}`}>
                {durationCategory.label}
              </span>
            </div>
          </div>

          <div className={`bg-gradient-to-br ${getQualityBgColor(latestSleep.quality)} rounded-xl p-5`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Quality Score</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${getQualityColor(latestSleep.quality)}`}>
                {latestSleep.quality}
              </span>
              <span className="text-lg text-gray-600">/ 10</span>
            </div>
            <div className="mt-3">
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    latestSleep.quality >= 7 ? 'bg-green-500' :
                    latestSleep.quality >= 5 ? 'bg-amber-500' : 'bg-red-500'
                  } transition-all duration-500`}
                  style={{ width: `${(latestSleep.quality / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {previousSleep && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Change from previous night</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {latestSleep.duration > previousSleep.duration ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : latestSleep.duration < previousSleep.duration ? (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    ) : (
                      <span className="w-4 h-4 text-gray-400 text-xs flex items-center justify-center">—</span>
                    )}
                    <span className={`text-sm font-medium ${
                      latestSleep.duration > previousSleep.duration ? 'text-green-600' :
                      latestSleep.duration < previousSleep.duration ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {latestSleep.duration > previousSleep.duration ? '+' : ''}{(latestSleep.duration - previousSleep.duration).toFixed(1)}h
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {latestSleep.quality > previousSleep.quality ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : latestSleep.quality < previousSleep.quality ? (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    ) : (
                      <span className="w-4 h-4 text-gray-400 text-xs flex items-center justify-center">—</span>
                    )}
                    <span className={`text-sm font-medium ${
                      latestSleep.quality > previousSleep.quality ? 'text-green-600' :
                      latestSleep.quality < previousSleep.quality ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {latestSleep.quality > previousSleep.quality ? '+' : ''}{(latestSleep.quality - previousSleep.quality).toFixed(1)} pts
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">7-day averages</p>
                <p className="text-sm font-medium text-gray-700">
                  {avgDuration.toFixed(1)}h | {avgQuality.toFixed(1)} pts
                </p>
              </div>
            </div>
          </div>
        )}

        {sleepData.length > 1 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Weekly Trend</h4>
            <div className="overflow-x-auto">
              <div className="min-w-[500px] h-24 flex items-end gap-2 px-4">
                {sleepData.slice(0, 7).reverse().map((sleep, index) => {
                  const height = (sleep.quality / 10) * 100;
                  return (
                    <div key={index} className="flex flex-col items-center gap-1 flex-1">
                      <div className="relative w-full group">
                        <div
                          className="w-full rounded-t-lg transition-all duration-300 group-hover:scale-105 cursor-pointer"
                          style={{
                            height: `${height}%`,
                            minHeight: '20px',
                            maxHeight: '80px',
                          }}
                        >
                          <div
                            className={`w-full h-full ${
                              sleep.quality >= 7 ? 'bg-gradient-to-t from-green-500 to-green-400' :
                              sleep.quality >= 5 ? 'bg-gradient-to-t from-amber-500 to-amber-400' :
                              'bg-gradient-to-t from-red-500 to-red-400'
                            } rounded-t-lg`}
                          ></div>
                        </div>
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            {sleep.duration}h / {sleep.quality} pts
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1">
                        {sleep.date.split('/')[1] || sleep.date.split('/')[0].slice(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">Last recorded: {latestSleep.date}</p>
        </div>
      </CardContent>
    </Card>
  );
}
