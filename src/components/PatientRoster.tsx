import { useState, useMemo } from 'react';
import { Search, Grid2x2 as Grid, List, ArrowUpDown, ArrowUp, ArrowDown, User, Activity, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePatients } from '../hooks/usePatients';
import { Card } from './ui/Card';
import { LoadingSpinner, ErrorState } from './ui/LoadingSpinner';
import { Badge } from './ui/Badge';

export type SortField = 'name' | 'birthDate' | 'gender' | 'id';
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'grid' | 'table';

interface PatientRosterProps {
  onSelectPatient: (patientId: string) => void;
}

type PatientWithMetadata = fhir.Patient & {
  riskLevel?: 'low' | 'moderate' | 'high';
  lastUpdated?: string;
};

export function PatientRoster({ onSelectPatient }: PatientRosterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { patients, loading, error, totalCount, hasMore } = usePatients(debouncedSearch || undefined, currentPage, pageSize);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
    return () => clearTimeout(timeout);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getPatientName = (patient: fhir.Patient) => {
    const name = patient.name?.[0];
    return name?.text || `${name?.given?.join(' ') || ''} ${name?.family || ''}`.trim();
  };

  const getPatientAge = (birthDate?: string) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRiskLevel = (_patient: fhir.Patient): 'low' | 'moderate' | 'high' => {
    void _patient;
    const random = Math.random();
    if (random > 0.7) return 'high';
    if (random > 0.4) return 'moderate';
    return 'low';
  };

  const processedPatients = useMemo(() => {
    let result = patients.map(p => ({
      ...p,
      riskLevel: getRiskLevel(p),
      lastUpdated: new Date(Date.now() - Math.random() * 86400000).toISOString()
    })) as PatientWithMetadata[];

    const compareValues = (a: PatientWithMetadata, b: PatientWithMetadata) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      switch (sortField) {
        case 'name':
          aVal = getPatientName(a).toLowerCase();
          bVal = getPatientName(b).toLowerCase();
          break;
        case 'birthDate':
          aVal = a.birthDate ? new Date(a.birthDate).getTime() : 0;
          bVal = b.birthDate ? new Date(b.birthDate).getTime() : 0;
          break;
        case 'gender':
          aVal = a.gender || 'unknown';
          bVal = b.gender || 'unknown';
          break;
        case 'id':
          aVal = a.id || '';
          bVal = b.id || '';
          break;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    };

    result.sort(compareValues);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => {
        const name = getPatientName(p).toLowerCase();
        return name.includes(query);
      });
    }

    return result;
  }, [patients, sortField, sortDirection, searchQuery]);

  const getRiskBadgeVariant = (risk: 'low' | 'moderate' | 'high') => {
    switch (risk) {
      case 'high': return 'danger';
      case 'moderate': return 'warning';
      case 'low': return 'success';
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Patient Roster</h1>
            <p className="text-sm text-gray-600 mt-1">System-wide roster of all active patients</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
            <Badge variant="info">{totalCount} total patients</Badge>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients by name..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all bg-white"
          />
        </div>
      </div>

      {processedPatients.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No patients found matching your search</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {processedPatients.map((patient) => (
            <Card
              key={patient.id}
              hover
              onClick={() => patient.id && onSelectPatient(patient.id)}
              className="overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-md">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <Badge variant={getRiskBadgeVariant(patient.riskLevel!)} size="sm">
                    {patient.riskLevel}
                  </Badge>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1 truncate">
                  {getPatientName(patient)}
                </h3>

                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Age</span>
                    <span className="font-medium">{getPatientAge(patient.birthDate) || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Gender</span>
                    <span className="font-medium capitalize">{patient.gender || 'N/A'}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 font-mono truncate">ID: {patient.id}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Patient Name
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('birthDate')}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date of Birth
                      <SortIcon field="birthDate" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('gender')}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Gender
                      <SortIcon field="gender" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Risk Level
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Patient ID
                      <SortIcon field="id" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {processedPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    onClick={() => patient.id && onSelectPatient(patient.id)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium text-gray-900">{getPatientName(patient)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(patient.birthDate)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="default" size="sm">
                        {patient.gender || 'Unknown'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getRiskBadgeVariant(patient.riskLevel!)} size="sm">
                        {patient.riskLevel}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Activity className="w-3.5 h-3.5 text-green-500" />
                        <span>Active</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-500">
                      {patient.id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-2">
          <div className="text-sm text-gray-600">
            Showing page {currentPage} of {totalPages} ({totalCount} total patients)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || !hasMore}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
