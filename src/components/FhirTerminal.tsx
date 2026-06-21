import { useState, useEffect, useRef } from 'react';
import { Terminal, ChevronDown, Trash2, CheckCircle, XCircle, AlertCircle, Info, Send, Clock } from 'lucide-react';
import { fhirLogger } from '../services/fhir-logger.service';

interface FhirTerminalProps {
  isOpen: boolean;
  onToggle: () => void;
}

type LogEntry = {
  id: string;
  timestamp: Date;
  level: 'info' | 'success' | 'error' | 'warning' | 'request' | 'response';
  method: string;
  endpoint: string;
  message: string;
  data?: string;
  duration?: number;
  statusCode?: number;
};

type FilterLevel = 'all' | 'request' | 'success' | 'error' | 'info';

export function FhirTerminal({ isOpen, onToggle }: FhirTerminalProps) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterLevel, setFilterLevel] = useState<FilterLevel>('all');
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = fhirLogger.subscribe(setEntries);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = 0;
    }
  }, [entries, autoScroll]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedEntries(newExpanded);
  };

  const clearTerminal = () => {
    fhirLogger.clear();
  };

  const filteredEntries = entries.filter(entry => {
    if (filterLevel === 'all') return true;
    if (filterLevel === 'request') return entry.level === 'request';
    if (filterLevel === 'success') return entry.level === 'success';
    if (filterLevel === 'error') return entry.level === 'error';
    if (filterLevel === 'info') return entry.level === 'info';
    return true;
  });

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case 'request': return <Send className="w-4 h-4 text-sky-400" />;
      case 'response': return <Clock className="w-4 h-4 text-gray-400" />;
      default: return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return 'border-l-emerald-500 bg-emerald-50/30';
      case 'error': return 'border-l-red-500 bg-red-50/30';
      case 'warning': return 'border-l-amber-500 bg-amber-50/30';
      case 'request': return 'border-l-sky-500 bg-sky-50/30';
      case 'response': return 'border-l-gray-400 bg-gray-50/30';
      default: return 'border-l-gray-300 bg-gray-50/30';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'text-sky-300 bg-sky-900/30 border border-sky-700/50';
      case 'POST': return 'text-emerald-300 bg-emerald-900/30 border border-emerald-700/50';
      case 'PUT': return 'text-amber-300 bg-amber-900/30 border border-amber-700/50';
      case 'DELETE': return 'text-red-300 bg-red-900/30 border border-red-700/50';
      default: return 'text-gray-300 bg-gray-900/30 border border-gray-700/50';
    }
  };

  const formatTimestamp = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ms = String(date.getMilliseconds()).padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl hover:from-gray-700 hover:to-gray-800 transition-all flex items-center gap-3 z-50 border border-gray-700"
      >
        <Terminal className="w-5 h-5" />
        <span className="text-sm font-medium">FHIR Terminal</span>
        {entries.length > 0 && (
          <span className="bg-sky-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
            {entries.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-[900px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-t-2xl shadow-2xl z-50 overflow-hidden border-2 border-gray-700">
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-gray-800 to-gray-850 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <span className="font-mono text-white font-medium">FHIR Server Interaction</span>
          <span className="text-xs text-gray-400 font-mono bg-gray-700 px-2 py-0.5 rounded">
            {filteredEntries.length} / {entries.length} logs
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as FilterLevel)}
            className="bg-gray-700 text-white text-xs px-3 py-1.5 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">All Requests</option>
            <option value="request">Requests</option>
            <option value="success">Success</option>
            <option value="error">Errors</option>
            <option value="info">Info</option>
          </select>
          <button
            onClick={clearTerminal}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Clear terminal"
          >
            <Trash2 className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Minimize"
          >
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div
        ref={terminalRef}
        className="h-[450px] overflow-y-auto p-4 font-mono text-sm"
        style={{ maxHeight: '450px' }}
      >
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Terminal className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-base">Waiting for FHIR server interactions...</p>
            <p className="text-xs mt-1 opacity-60">Requests will appear here automatically</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className={`border-l-4 ${getLevelColor(entry.level)} rounded-lg overflow-hidden transition-all`}
              >
                <div
                  className="flex items-center gap-3 px-4 py-3 bg-gray-800/40 hover:bg-gray-800/60 cursor-pointer transition-colors"
                  onClick={() => toggleExpand(entry.id)}
                >
                  {getLevelIcon(entry.level)}

                  <span className="text-gray-400 text-xs shrink-0 font-mono">
                    {formatTimestamp(entry.timestamp)}
                  </span>

                  {entry.method && (
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${getMethodColor(entry.method)}`}>
                      {entry.method}
                    </span>
                  )}

                  {entry.endpoint && (
                    <span className="text-emerald-300 truncate max-w-[250px] font-mono text-sm" title={entry.endpoint}>
                      {entry.endpoint}
                    </span>
                  )}

                  <span className="text-gray-200 flex-1 truncate text-sm">
                    {entry.message}
                  </span>

                  {entry.statusCode && (
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      entry.statusCode >= 200 && entry.statusCode < 300
                        ? 'text-emerald-300 bg-emerald-900/40'
                        : 'text-red-300 bg-red-900/40'
                    }`}>
                      {entry.statusCode}
                    </span>
                  )}

                  {entry.duration && (
                    <span className="text-gray-400 text-xs bg-gray-700 px-2 py-1 rounded">
                      {entry.duration}ms
                    </span>
                  )}

                  {entry.data && (
                    <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform ${
                      expandedEntries.has(entry.id) ? 'rotate-180' : ''
                    }`} />
                  )}
                </div>

                {expandedEntries.has(entry.id) && entry.data && (
                  <div className="px-4 py-3 bg-gray-900/60 border-t border-gray-700">
                    <pre className="text-xs text-gray-200 leading-relaxed overflow-x-auto">
                      {entry.data}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-5 py-3 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-gray-300">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> Success
          </span>
          <span className="flex items-center gap-1.5 text-gray-300">
            <XCircle className="w-4 h-4 text-red-400" /> Error
          </span>
          <span className="flex items-center gap-1.5 text-gray-300">
            <Send className="w-4 h-4 text-sky-400" /> Request
          </span>
          <span className="flex items-center gap-1.5 text-gray-300">
            <Info className="w-4 h-4 text-gray-400" /> Info
          </span>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="w-3.5 h-3.5 rounded bg-gray-700 border-gray-600 text-sky-500 focus:ring-sky-500"
          />
          Auto-scroll
        </label>
      </div>
    </div>
  );
}
