import { useState, useMemo } from 'react';
import { Search, User, Calendar, Users } from 'lucide-react';
import { usePatients } from '../hooks/usePatients';
import { Card, CardContent } from './ui/Card';
import { LoadingSpinner, EmptyState, ErrorState } from './ui/LoadingSpinner';
import { Badge } from './ui/Badge';

interface PatientListProps {
  onSelectPatient: (patientId: string) => void;
}

export function PatientList({ onSelectPatient }: PatientListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { patients, loading, error } = usePatients(debouncedSearch || undefined);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
    return () => clearTimeout(timeout);
  };

  const filteredPatients = useMemo(() => {
    if (!searchQuery) return patients;
    const query = searchQuery.toLowerCase();
    return patients.filter((patient) => {
      const name = patient.name?.[0]?.text ||
        `${patient.name?.[0]?.given?.join(' ') || ''} ${patient.name?.[0]?.family || ''}`.toLowerCase();
      return name.includes(query);
    });
  }, [patients, searchQuery]);

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

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patient Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Search and manage neurorehabilitation patients
            </p>
          </div>
          <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-lg">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {filteredPatients.length} patients
            </span>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients by name..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
          />
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <EmptyState
          title="No Patients Found"
          message={searchQuery ? "Try adjusting your search query" : "No patients are available in the system"}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <Card
              key={patient.id}
              hover
              onClick={() => patient.id && onSelectPatient(patient.id)}
              className="group"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant={patient.gender === 'male' ? 'info' : 'default'} size="sm">
                    {patient.gender || 'Unknown'}
                  </Badge>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {getPatientName(patient)}
                </h3>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {patient.birthDate
                        ? `${getPatientAge(patient.birthDate)} years old`
                        : 'Age unknown'}
                    </span>
                  </div>

                  {patient.birthDate && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>DOB: {formatDate(patient.birthDate)}</span>
                    </div>
                  )}
                </div>

                {patient.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 font-mono">ID: {patient.id}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
