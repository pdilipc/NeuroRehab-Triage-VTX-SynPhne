import { Activity, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { getFuglMeyerScores } from '../utils/observationUtils';

interface FuglMeyerChartProps {
  observations: fhir.Observation[];
}

export function FuglMeyerChart({ observations }: FuglMeyerChartProps) {
  const scores = getFuglMeyerScores(observations);

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getProgressWidth = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    return Math.min(percentage, 100);
  };

  const getProgressColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (scores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Fugl-Meyer Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No Fugl-Meyer assessments available</p>
        </CardContent>
      </Card>
    );
  }

  const latestScore = scores[0];
  const previousScore = scores.length > 1 ? scores[1] : null;
  const improvement = previousScore
    ? latestScore.total - previousScore.total
    : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Fugl-Meyer Assessment
          </CardTitle>
          {improvement !== null && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              improvement > 0 ? 'bg-green-100 text-green-700' : improvement < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
            }`}>
              <TrendingUp className={`w-3 h-3 ${improvement >= 0 ? '' : 'rotate-180'}`} />
              <span>{improvement > 0 ? '+' : ''}{improvement} pts</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Upper Extremity</span>
              <span className="text-xs text-blue-700 font-mono">/66</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${getScoreColor(latestScore.upper, 66)}`}>
                {latestScore.upper}
              </span>
              <span className="text-sm text-blue-700">points</span>
            </div>
            <div className="mt-3 h-2 bg-blue-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor(latestScore.upper, 66)} transition-all duration-500`}
                style={{ width: `${getProgressWidth(latestScore.upper, 66)}%` }}
              ></div>
            </div>
            <div className="mt-1 text-xs text-right text-blue-700">
              {Math.round(getProgressWidth(latestScore.upper, 66))}%
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-teal-900">Lower Extremity</span>
              <span className="text-xs text-teal-700 font-mono">/34</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${getScoreColor(latestScore.lower, 34)}`}>
                {latestScore.lower}
              </span>
              <span className="text-sm text-teal-700">points</span>
            </div>
            <div className="mt-3 h-2 bg-teal-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor(latestScore.lower, 34)} transition-all duration-500`}
                style={{ width: `${getProgressWidth(latestScore.lower, 34)}%` }}
              ></div>
            </div>
            <div className="mt-1 text-xs text-right text-teal-700">
              {Math.round(getProgressWidth(latestScore.lower, 34))}%
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-900">Total Score</span>
              <span className="text-xs text-green-700 font-mono">/100</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${getScoreColor(latestScore.total, 100)}`}>
                {latestScore.total}
              </span>
              <span className="text-sm text-green-700">points</span>
            </div>
            <div className="mt-3 h-2 bg-green-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor(latestScore.total, 100)} transition-all duration-500`}
                style={{ width: `${getProgressWidth(latestScore.total, 100)}%` }}
              ></div>
            </div>
            <div className="mt-1 text-xs text-right text-green-700">
              {Math.round(getProgressWidth(latestScore.total, 100))}%
            </div>
          </div>
        </div>

        {scores.length > 1 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Progress Over Time</h4>
            <div className="overflow-x-auto">
              <div className="min-w-[600px] h-32 flex items-end gap-2 px-4">
                {scores.slice(0, 10).reverse().map((score, index) => {
                  const height = (score.total / 100) * 100;
                  return (
                    <div key={index} className="flex flex-col items-center gap-1 flex-1">
                      <div className="relative w-full group">
                        <div
                          className="w-full rounded-t-lg transition-all duration-300 group-hover:scale-105 cursor-pointer"
                          style={{
                            height: `${height}%`,
                            minHeight: '20px',
                            maxHeight: '100px',
                          }}
                        >
                          <div className="w-full h-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg relative">
                            <div
                              className="absolute bottom-0 w-full bg-gradient-to-t from-teal-500 to-teal-400 rounded-t-lg"
                              style={{ height: `${(score.lower / 100) * 100}%` }}
                            ></div>
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-t-lg"></div>
                          </div>
                        </div>
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            {score.total} pts
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1">{score.date.split('/')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-t from-blue-500 to-blue-400 rounded"></div>
                <span className="text-xs text-gray-600">Total</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-t from-teal-500 to-teal-400 rounded"></div>
                <span className="text-xs text-gray-600">Lower Extremity</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">Last assessment: {latestScore.date}</p>
        </div>
      </CardContent>
    </Card>
  );
}
