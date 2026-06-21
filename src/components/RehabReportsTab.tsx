import { useState, useEffect } from 'react';
import { Plus, FileText, ExternalLink, Brain, Activity } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { RehabReportForm } from './RehabReportForm';
import { RehabReportsTrendChart } from './RehabReportsTrendChart';
import { rehabReportsService, RehabReport } from '../services/rehab-reports.service';
import { DEMO_REHAB_REPORT } from '../constants/demo-reports';

interface RehabReportsTabProps {
  patientId: string;
  patientName: string;
}

function ReportCard({ report }: { report: RehabReport }) {
  const isDemo = report.id === 'demo';
  const date = new Date(report.session_date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  const avgEmg = (
    (Number(report.emg_supinator) + Number(report.emg_pronator) + Number(report.emg_thumb) +
    Number(report.emg_wrist_extensor) + Number(report.emg_wrist_flexor) +
    Number(report.emg_finger_extensor) + Number(report.emg_finger_flexor)) / 7
  );

  const ariValue = Number(report.eeg_attention_response_index);
  const ariStatus = ariValue < 0.9 ? 'success' : ariValue > 1.1 ? 'danger' : 'warning';
  const smileyValue = Number(report.eeg_smiley_index);
  const smileyStatus = smileyValue >= 70 ? 'success' : smileyValue >= 50 ? 'warning' : 'danger';

  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900">Session {report.session_number}</span>
            {isDemo && <Badge variant="default">Demo</Badge>}
          </div>
          <p className="text-xs text-gray-500">{date}</p>
          {report.trainer_name && <p className="text-xs text-gray-400 mt-0.5">{report.trainer_name}</p>}
          {report.condition && <p className="text-xs text-blue-600 mt-0.5">{report.condition}</p>}
        </div>
        <div className="flex items-center gap-2">
          {report.pdf_url && (
            <a
              href={report.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg px-2 py-1 transition-colors"
            >
              <FileText className="w-3 h-3" />
              PDF
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {report.fhir_diagnostic_report_id && (
            <span className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
              FHIR synced
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500 mb-0.5">Avg EMG</p>
          <p className={`text-sm font-bold ${avgEmg > 0 ? 'text-green-600' : avgEmg > -2 ? 'text-amber-600' : 'text-red-600'}`}>
            {avgEmg > 0 ? '+' : ''}{avgEmg.toFixed(1)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500 mb-0.5">ARI</p>
          <Badge variant={ariStatus} className="text-xs">{ariValue.toFixed(2)}</Badge>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500 mb-0.5">Smiley</p>
          <Badge variant={smileyStatus} className="text-xs">{smileyValue.toFixed(0)}%</Badge>
        </div>
      </div>

      {report.clinical_recommendations && (
        <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-2">
          <p className="text-xs font-medium text-blue-800 mb-1">Recommendations</p>
          <p className="text-xs text-blue-700 line-clamp-2">{report.clinical_recommendations}</p>
        </div>
      )}
    </div>
  );
}

export function RehabReportsTab({ patientId, patientName }: RehabReportsTabProps) {
  const [reports, setReports] = useState<RehabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'trends'>('list');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await rehabReportsService.getReportsByPatient(patientId);
      setReports(data);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [patientId]);

  const allReports = reports.length === 0 && !loading ? [DEMO_REHAB_REPORT, ...reports] : [...reports];
  const chartReports = reports.length > 0 ? reports : [DEMO_REHAB_REPORT];

  const handleSaved = () => {
    setShowForm(false);
    fetchReports();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Brain className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>SynPhNe Rehab Reports</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Longitudinal EMG &amp; EEG data across dosing sessions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setActiveView('list')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeView === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  Sessions
                </button>
                <button
                  onClick={() => setActiveView('trends')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${activeView === 'trends' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Activity className="w-3 h-3" />
                  Trends
                </button>
              </div>
              <Button onClick={() => setShowForm(!showForm)} variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Report
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Add Form */}
      {showForm && (
        <RehabReportForm
          patientId={patientId}
          patientName={patientName}
          onSaved={handleSaved}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Content */}
      {activeView === 'list' && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Loading reports...</div>
          ) : allReports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No rehab reports yet.</p>
                <p className="text-xs text-gray-400 mt-1">Add a SynPhNe session report to begin tracking longitudinal data.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'trends' && (
        <RehabReportsTrendChart reports={chartReports} />
      )}
    </div>
  );
}
