type LogLevel = 'info' | 'success' | 'error' | 'warning' | 'request' | 'response';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  method: string;
  endpoint: string;
  message: string;
  data?: string;
  duration?: number;
  statusCode?: number;
}

class FHIRLoggerService {
  private entries: LogEntry[] = [];
  private maxEntries = 100;
  private listeners: Set<(entries: LogEntry[]) => void> = new Set();

  private formatData(data: unknown): string | undefined {
    if (!data) return undefined;

    // Create a summary instead of full JSON
    if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;

      // For bundles, show summary
      if (obj.resourceType === 'Bundle') {
        const total = obj.total as number || 0;
        const entryCount = (obj.entry as unknown[])?.length || 0;
        return `Bundle: ${entryCount} entries returned (total: ${total})`;
      }

      // For patients, show minimal info
      if (obj.resourceType === 'Patient') {
        const name = (obj.name as Array<{ given?: string[]; family?: string }>)?.[0];
        const patientName = name ? `${name.given?.join(' ') || ''} ${name.family || ''}`.trim() : 'Unknown';
        return `Patient: ${patientName} (ID: ${obj.id || 'N/A'})`;
      }

      // For observations, show summary
      if (obj.resourceType === 'Observation') {
        const code = (obj.code as { coding?: Array<{ display?: string; code?: string }> })?.coding?.[0];
        const value = (obj as unknown as { valueQuantity?: { value?: number } }).valueQuantity?.value;
        return `Observation: ${code?.display || code?.code || 'Unknown'} = ${value || 'N/A'}`;
      }

      // For procedures, show minimal info
      if (obj.resourceType === 'Procedure') {
        const code = (obj.code as { coding?: Array<{ display?: string }> })?.coding?.[0]?.display;
        const status = obj.status;
        return `Procedure: ${code || 'Unknown'} (${status})`;
      }

      // For search params, show as object
      if (Object.keys(obj).length <= 5) {
        try {
          return JSON.stringify(obj);
        } catch {
          return String(data);
        }
      }

      // For generic objects, show type and size
      return `${obj.resourceType || 'Object'} (${JSON.stringify(obj).length} bytes)`;
    }

    try {
      const str = String(data);
      return str.length > 100 ? str.substring(0, 100) + '...' : str;
    } catch {
      return 'Data unavailable';
    }
  }

  log(
    level: LogLevel,
    method: string,
    endpoint: string,
    message: string,
    data?: unknown,
    duration?: number,
    statusCode?: number
  ): string {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      method,
      endpoint,
      message,
      data: this.formatData(data),
      duration,
      statusCode,
    };

    this.entries.unshift(entry);

    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }

    this.notifyListeners();
    return entry.id;
  }

  logRequest(method: string, endpoint: string, data?: unknown): string {
    return this.log('request', method, endpoint, 'Sending request...', data);
  }

  logResponse(method: string, endpoint: string, statusCode: number, data: unknown, duration: number, requestId?: string): void {
    const level = statusCode >= 200 && statusCode < 300 ? 'success' : 'error';
    const message = statusCode >= 200 && statusCode < 300 ? 'Request successful' : 'Request failed';

    if (requestId) {
      const existingIndex = this.entries.findIndex(e => e.id === requestId);
      if (existingIndex !== -1) {
        this.entries[existingIndex] = {
          ...this.entries[existingIndex],
          level,
          message,
          data: this.formatData(data),
          duration,
          statusCode,
        };
        this.notifyListeners();
        return;
      }
    }

    this.log(level, method, endpoint, message, data, duration, statusCode);
  }

  logError(method: string, endpoint: string, error: Error, duration?: number): void {
    this.log('error', method, endpoint, `Error: ${error.message}`, { error: error.message }, duration);
  }

  logInfo(message: string, data?: unknown): void {
    this.log('info', 'INFO', '', message, data);
  }

  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  subscribe(listener: (entries: LogEntry[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const entries = this.getEntries();
    this.listeners.forEach(listener => listener(entries));
  }

  clear(): void {
    this.entries = [];
    this.notifyListeners();
  }
}

export const fhirLogger = new FHIRLoggerService();
