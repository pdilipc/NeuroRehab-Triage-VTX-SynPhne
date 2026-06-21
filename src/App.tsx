import { useState, useEffect } from 'react';
import { Settings, Bell, HelpCircle } from 'lucide-react';
import { Sidebar, TriageCategory } from './components/Sidebar';
import { PatientRoster } from './components/PatientRoster';
import { PatientDetails } from './components/PatientDetails';
import { SessionPlanner } from './components/SessionPlanner';
import { SessionDocumentation } from './components/SessionDocumentation';
import { NeuroRehabTriage } from './components/NeuroRehabTriage';
import { AcuteDeteriorationTriage } from './components/AcuteDeteriorationTriage';
import { PlaceholderTriage } from './components/PlaceholderTriage';
import { FhirTerminal } from './components/FhirTerminal';
import { fhirService } from './services/fhir.service';

type View = 'list' | 'details' | 'session' | 'documentation';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TriageCategory>('roster');
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<fhir.Patient | null>(null);
  const [observations, setObservations] = useState<fhir.Observation[]>([]);
  const [sessionDecision, setSessionDecision] = useState<'proceed' | 'modify' | 'defer' | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setCurrentView('details');
  };

  const handleStartSession = () => {
    setCurrentView('session');
  };

  const handleDocumentSession = (decision: 'proceed' | 'modify' | 'defer') => {
    setSessionDecision(decision);
    setCurrentView('documentation');
  };

  const handleComplete = () => {
    setCurrentView('list');
    setSelectedPatientId(null);
    setSelectedPatient(null);
    setObservations([]);
    setSessionDecision(null);
  };

  const handleBackToList = () => {
    setCurrentView('list');
  };

  const handleCategoryChange = (category: TriageCategory) => {
    setActiveCategory(category);
    setCurrentView('list');
    setSelectedPatientId(null);
    setSelectedPatient(null);
    setObservations([]);
  };

  // Load patient data when patient is selected
  useEffect(() => {
    const loadPatientData = async () => {
      if (selectedPatientId && currentView === 'details') {
        try {
          const patient = await fhirService.getPatient(selectedPatientId);
          setSelectedPatient(patient);

          const obsBundle = await fhirService.getObservations(selectedPatientId);
          const obsList = obsBundle.entry?.map((e: { resource?: fhir.Resource }) => e.resource as fhir.Observation).filter(Boolean) || [];
          setObservations(obsList);
        } catch (err) {
          console.error('Failed to load patient data:', err);
        }
      }
    };

    loadPatientData();
  }, [selectedPatientId, currentView]);

  const renderTriageContent = () => {
    if (activeCategory !== 'roster' && currentView !== 'list') {
      // Handle other views
    }

    if (currentView === 'details' && selectedPatientId) {
      return (
        <PatientDetails
          patientId={selectedPatientId}
          onBack={handleBackToList}
          onStartSession={handleStartSession}
        />
      );
    }

    if (currentView === 'session' && selectedPatient) {
      return (
        <SessionPlanner
          patient={selectedPatient}
          observations={observations}
          onBack={handleBackToList}
          onDocument={handleDocumentSession}
        />
      );
    }

    if (currentView === 'documentation' && selectedPatient && sessionDecision) {
      return (
        <SessionDocumentation
          patientId={selectedPatientId!}
          patient={selectedPatient}
          decision={sessionDecision}
          onBack={() => setCurrentView('session')}
          onComplete={handleComplete}
        />
      );
    }

    switch (activeCategory) {
      case 'roster':
        return <PatientRoster onSelectPatient={handleSelectPatient} />;
      case 'neurorehab':
        return <NeuroRehabTriage onSelectPatient={handleSelectPatient} />;
      case 'acute':
        return <AcuteDeteriorationTriage />;
      case 'operational':
        return <PlaceholderTriage type="operational" />;
      case 'preventative':
        return <PlaceholderTriage type="preventative" />;
      case 'throughput':
        return <PlaceholderTriage type="throughput" />;
      default:
        return <PatientRoster onSelectPatient={handleSelectPatient} />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900">
              {activeCategory === 'roster' && 'Patient Roster'}
              {activeCategory === 'neurorehab' && 'Neuro-Rehab Triage'}
              {activeCategory === 'acute' && 'Acute Deterioration Triage'}
              {activeCategory === 'operational' && 'Resource Tracking'}
              {activeCategory === 'preventative' && 'Preventative Care'}
              {activeCategory === 'throughput' && 'Discharge Planning'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {renderTriageContent()}
        </main>

        <footer className="bg-white border-t border-gray-200 px-6 py-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Verada NeuroRehab Readiness Application</span>
            <span>FHIR R4 Integrated Platform | Connected to sandbox</span>
          </div>
        </footer>
      </div>

      <FhirTerminal isOpen={terminalOpen} onToggle={() => setTerminalOpen(!terminalOpen)} />
    </div>
  );
}

export default App;
