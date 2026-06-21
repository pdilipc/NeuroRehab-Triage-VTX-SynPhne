import { useState } from 'react';
import { Save, X } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { rehabReportsService, RehabReportData } from '../services/rehab-reports.service';

interface RehabReportFormProps {
  patientId: string;
  patientName: string;
  onSaved: () => void;
  onCancel: () => void;
}

const EMG_MUSCLES = [
  { key: 'supinator', label: 'Supinator' },
  { key: 'pronator', label: 'Pronator' },
  { key: 'thumb', label: 'Thumb' },
  { key: 'wristExtensor', label: 'Wrist Extensor' },
  { key: 'wristFlexor', label: 'Wrist Flexor' },
  { key: 'fingerExtensor', label: 'Finger Extensor' },
  { key: 'fingerFlexor', label: 'Finger Flexor' },
] as const;

const BodyStateInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => {
  const num = parseFloat(value);
  const isGood = !isNaN(num) && num > 0;
  const isBad = !isNaN(num) && num < -2;

  return (
    <div className="flex items-center gap-3">
      <div className="w-32 text-xs text-gray-600 font-medium flex-shrink-0">{label}</div>
      <div className="flex items-center gap-2 flex-1">
        <input
          type="range"
          min="-6"
          max="1"
          step="0.5"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 accent-blue-600"
        />
        <span className={`text-sm font-bold w-10 text-right ${isGood ? 'text-green-600' : isBad ? 'text-red-600' : 'text-amber-600'}`}>
          {parseFloat(value).toFixed(1)}
        </span>
      </div>
    </div>
  );
};

export function RehabReportForm({ patientId, patientName, onSaved, onCancel }: RehabReportFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionNumber, setSessionNumber] = useState('1');
  const [trainerName, setTrainerName] = useState('');
  const [condition, setCondition] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [clinicalRecommendations, setClinicalRecommendations] = useState('');

  const [emg, setEmg] = useState({
    supinator: '-2',
    pronator: '-1',
    thumb: '-2',
    wristExtensor: '0.5',
    wristFlexor: '-2',
    fingerExtensor: '0.5',
    fingerFlexor: '-2',
  });

  const [eeg, setEeg] = useState({
    brainSymmetryPre: '',
    brainSymmetryPost: '',
    attentionResponseIndex: '',
    smileyIndex: '',
    relativeAlphaPre: '',
    relativeAlphaPost: '',
    dar: '',
    alphaAsymmetry: '',
    totalPowerAsymmetry: '',
  });

  const updateEmg = (key: string, value: string) =>
    setEmg((prev) => ({ ...prev, [key]: value }));

  const updateEeg = (key: string, value: string) =>
    setEeg((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      const data: RehabReportData = {
        patientId,
        patientName,
        sessionDate: new Date(sessionDate).toISOString(),
        sessionNumber: parseInt(sessionNumber),
        trainerName: trainerName || undefined,
        condition: condition || undefined,
        pdfUrl: pdfUrl || undefined,
        emg: {
          supinator: parseFloat(emg.supinator),
          pronator: parseFloat(emg.pronator),
          thumb: parseFloat(emg.thumb),
          wristExtensor: parseFloat(emg.wristExtensor),
          wristFlexor: parseFloat(emg.wristFlexor),
          fingerExtensor: parseFloat(emg.fingerExtensor),
          fingerFlexor: parseFloat(emg.fingerFlexor),
        },
        eeg: {
          brainSymmetryPre: parseFloat(eeg.brainSymmetryPre) || 0,
          brainSymmetryPost: parseFloat(eeg.brainSymmetryPost) || 0,
          attentionResponseIndex: parseFloat(eeg.attentionResponseIndex) || 0,
          smileyIndex: parseFloat(eeg.smileyIndex) || 0,
          relativeAlphaPre: parseFloat(eeg.relativeAlphaPre) || 0,
          relativeAlphaPost: parseFloat(eeg.relativeAlphaPost) || 0,
          dar: parseFloat(eeg.dar) || 0,
          alphaAsymmetry: parseFloat(eeg.alphaAsymmetry) || 0,
          totalPowerAsymmetry: parseFloat(eeg.totalPowerAsymmetry) || 0,
        },
        clinicalRecommendations,
      };

      await rehabReportsService.submitReport(data);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-blue-900">Add SynPhNe Session Report</CardTitle>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-8">

        {/* Session Info */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Session Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input label="Session Date" type="date" value={sessionDate} onChange={setSessionDate} />
            <Input label="Session Number" type="number" value={sessionNumber} onChange={setSessionNumber} />
            <Input label="Trainer Name" value={trainerName} onChange={setTrainerName} />
            <Input label="Condition" value={condition} onChange={setCondition} />
          </div>
          <div className="mt-4">
            <Input label="PDF Report URL (optional)" value={pdfUrl} onChange={setPdfUrl} />
          </div>
        </div>

        {/* EMG Body State */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-1">Body State (EMG)</h3>
          <p className="text-xs text-gray-500 mb-4">Range: -6 (antagonist dominant) to +1 (ideal agonist contraction)</p>
          <div className="space-y-3 bg-gray-50 rounded-xl p-4">
            {EMG_MUSCLES.map((m) => (
              <BodyStateInput
                key={m.key}
                label={m.label}
                value={emg[m.key as keyof typeof emg]}
                onChange={(v) => updateEmg(m.key, v)}
              />
            ))}
          </div>
        </div>

        {/* EEG Metrics */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Brain State (EEG)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Input label="Brain Symmetry Index (Pre)" type="number" value={eeg.brainSymmetryPre} onChange={(v) => updateEeg('brainSymmetryPre', v)} />
            <Input label="Brain Symmetry Index (Post)" type="number" value={eeg.brainSymmetryPost} onChange={(v) => updateEeg('brainSymmetryPost', v)} />
            <Input label="Attention Response Index" type="number" value={eeg.attentionResponseIndex} onChange={(v) => updateEeg('attentionResponseIndex', v)} />
            <Input label="Smiley Index (%)" type="number" value={eeg.smileyIndex} onChange={(v) => updateEeg('smileyIndex', v)} />
            <Input label="Relative Alpha (Pre)" type="number" value={eeg.relativeAlphaPre} onChange={(v) => updateEeg('relativeAlphaPre', v)} />
            <Input label="Relative Alpha (Post)" type="number" value={eeg.relativeAlphaPost} onChange={(v) => updateEeg('relativeAlphaPost', v)} />
            <Input label="Delta to Alpha Ratio (DAR)" type="number" value={eeg.dar} onChange={(v) => updateEeg('dar', v)} />
            <Input label="Alpha Asymmetry" type="number" value={eeg.alphaAsymmetry} onChange={(v) => updateEeg('alphaAsymmetry', v)} />
            <Input label="Total Power Asymmetry" type="number" value={eeg.totalPowerAsymmetry} onChange={(v) => updateEeg('totalPowerAsymmetry', v)} />
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Clinical Recommendations</h3>
          <textarea
            value={clinicalRecommendations}
            onChange={(e) => setClinicalRecommendations(e.target.value)}
            placeholder="Enter clinical recommendations from this session..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
            rows={4}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2 border-t border-gray-200">
          <Button onClick={handleSubmit} loading={saving} variant="primary">
            <Save className="w-4 h-4 mr-2" />
            Save to FHIR &amp; Database
          </Button>
          <Button onClick={onCancel} variant="ghost">Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}
