import {
  LayoutDashboard,
  AlertTriangle,
  BedDouble,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users,
  Brain,
  Clock
} from 'lucide-react';

export type TriageCategory =
  | 'roster'
  | 'neurorehab'
  | 'acute'
  | 'operational'
  | 'preventative'
  | 'throughput';

interface SidebarProps {
  activeCategory: TriageCategory;
  onCategoryChange: (category: TriageCategory) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface MenuItem {
  id: TriageCategory;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'roster',
    label: 'System Roster',
    description: 'All active patients sorted by name/unit',
    icon: <Users className="w-5 h-5" />,
    color: 'blue'
  },
  {
    id: 'neurorehab',
    label: 'Neuro-Rehab',
    description: 'Sleep, autonomic stability, robotic matching',
    icon: <Brain className="w-5 h-5" />,
    color: 'teal'
  },
  {
    id: 'acute',
    label: 'Acute Deterioration',
    description: 'Sepsis, NEWS2 scores, critical alerts',
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'red'
  },
  {
    id: 'operational',
    label: 'Resource Tracking',
    description: 'Bed tracking, nursing acuity, logistics',
    icon: <BedDouble className="w-5 h-5" />,
    color: 'amber'
  },
  {
    id: 'preventative',
    label: 'Preventative Care',
    description: 'DVT timelines, catheter windows, fall risks',
    icon: <Shield className="w-5 h-5" />,
    color: 'green'
  },
  {
    id: 'throughput',
    label: 'Discharge Planning',
    description: 'Insurance auth, DME matching, LOS logs',
    icon: <LogOut className="w-5 h-5" />,
    color: 'cyan'
  }
];

const colorClasses: Record<string, { bg: string; border: string; text: string; hover: string }> = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', hover: 'hover:bg-blue-100' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-500', text: 'text-teal-700', hover: 'hover:bg-teal-100' },
  red: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', hover: 'hover:bg-red-100' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-700', hover: 'hover:bg-amber-100' },
  green: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', hover: 'hover:bg-green-100' },
  cyan: { bg: 'bg-cyan-50', border: 'border-cyan-500', text: 'text-cyan-700', hover: 'hover:bg-cyan-100' }
};

export function Sidebar({ activeCategory, onCategoryChange, isCollapsed, onToggleCollapse }: SidebarProps) {
  return (
    <div className={`bg-white border-r border-gray-200 min-h-screen flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">Triage Board</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = activeCategory === item.id;
          const colors = colorClasses[item.color];

          return (
            <button
              key={item.id}
              onClick={() => onCategoryChange(item.id)}
              className={`w-full text-left rounded-lg transition-all duration-200 ${
                isActive
                  ? `${colors.bg} border-l-4 ${colors.border} ${colors.text}`
                  : 'hover:bg-gray-50 text-gray-700'
              } ${isCollapsed ? 'p-3 flex items-center justify-center' : 'p-3'}`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className={isCollapsed ? '' : 'flex items-start gap-3'}>
                <div className={isCollapsed ? '' : 'mt-0.5'}>
                  {item.icon}
                </div>
                {!isCollapsed && (
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-200 space-y-2">
        {!isCollapsed && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Active Patients</span>
              <span className="font-semibold text-gray-900">247</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Requiring Review</span>
              <span className="font-semibold text-red-600">38</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-teal-500 w-3/4 rounded-full"></div>
            </div>
          </div>
        )}
        <button
          className={`w-full flex items-center gap-2 p-2.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <Clock className="w-4 h-4" />
          {!isCollapsed && <span className="text-sm">Last synced: 2m ago</span>}
        </button>
      </div>
    </div>
  );
}
