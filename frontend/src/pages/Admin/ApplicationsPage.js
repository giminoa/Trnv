import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  CalendarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import ApplicationDetailModal from '../../components/Admin/ApplicationDetailModal';
import api from '../../services/api';

const ApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTournament, setFilterTournament] = useState('all');
  const [tournaments, setTournaments] = useState([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [applicationToApprove, setApplicationToApprove] = useState(null);
  const [approvalAction, setApprovalAction] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    fetchApplications();
    fetchTournaments();
  }, []);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/admin/applications');
      
      if (response.success) {
        setApplications(response.data.applications || []);
      } else {
        // Varsayılan başvurular (API yoksa)
        setApplications([
          {
            id: 1,
            tournamentId: 1,
            tournamentName: 'Yaz Kupası 2024',
            teamId: 1,
            teamName: 'Gençlerbirliği',
            teamLogo: 'https://tmssl.akamaized.net//images/wappen/head/820.png?lm=1753429938',
            captainName: 'Admin User',
            captainEmail: 'admin@turnuva.taktisyen.net',
            status: 'pending',
            applicationDate: '2024-06-01T10:30:00Z',
            notes: 'Takımımız bu turnuvaya katılmak için çok heyecanlı.',
            playerCount: 11,
            experienceLevel: 'intermediate'
          }
        ]);
      }
    } catch (error) {
      console.error('Başvurular yüklenirken hata:', error);
      toast.error('Başvurular yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTournaments = async () => {
    try {
      const response = await api.get('/tournaments');
      if (response.success) {
        setTournaments(response.data.tournaments || []);
      } else {
        setTournaments([
          { id: 1, name: 'Yaz Kupası 2024' },
          { id: 2, name: 'Kış Ligi 2024' },
          { id: 3, name: 'Bahar Kupası 2024' }
        ]);
      }
    } catch (error) {
      console.error('Turnuvalar yüklenirken hata:', error);
    }
  };

  const handleApproveApplication = async (applicationId, action) => {
    try {
      const response = await api.put(`/admin/applications/${applicationId}/status`, {
        status: action === 'approve' ? 'approved' : 'rejected'
      });
      
      if (response.success) {
        setApplications(applications.map(app => 
          app.id === applicationId 
            ? { ...app, status: action === 'approve' ? 'approved' : 'rejected' }
            : app
        ));
        toast.success(`Başvuru ${action === 'approve' ? 'onaylandı' : 'reddedildi'}`);
      } else {
        toast.error(response.message || 'İşlem sırasında hata oluştu');
      }
    } catch (error) {
      toast.error('İşlem sırasında hata oluştu');
    }
    setShowApprovalModal(false);
    setApplicationToApprove(null);
    setApprovalAction('');
  };

  const filteredApplications = applications.filter(application => {
    const matchesSearch = application.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         application.tournamentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         application.captainName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || application.status === filterStatus;
    const matchesTournament = filterTournament === 'all' || application.tournamentId.toString() === filterTournament;
    
    return matchesSearch && matchesStatus && matchesTournament;
  });

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, label: 'Beklemede' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, label: 'Onaylandı' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, label: 'Reddedildi' }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  const getExperienceBadge = (level) => {
    const badges = {
      beginner: { color: 'bg-gray-100 text-gray-800', label: 'Başlangıç' },
      intermediate: { color: 'bg-blue-100 text-blue-800', label: 'Orta' },
      advanced: { color: 'bg-purple-100 text-purple-800', label: 'İleri' }
    };

    const badge = badges[level] || badges.beginner;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center py-12">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              to="/admin"
              className="inline-flex items-center text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-1" />
              Admin Panel
            </Link>
          </div>
        </div>
        <div className="mt-4 flex items-center space-x-3">
          <div className="h-10 w-10 bg-orange-600 rounded-lg flex items-center justify-center">
            <DocumentTextIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Başvuru Yönetimi</h1>
            <p className="text-gray-600">{filteredApplications.length} başvuru bulundu</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Başvuru ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-field"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="pending">Beklemede</option>
            <option value="approved">Onaylandı</option>
            <option value="rejected">Reddedildi</option>
          </select>

          <select
            value={filterTournament}
            onChange={(e) => setFilterTournament(e.target.value)}
            className="input-field"
          >
            <option value="all">Tüm Turnuvalar</option>
            {tournaments.map(tournament => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.name}
              </option>
            ))}
          </select>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              Bekleyen: {applications.filter(a => a.status === 'pending').length}
            </span>
            <span className="text-sm text-gray-500">|</span>
            <span className="text-sm text-gray-500">
              Onaylı: {applications.filter(a => a.status === 'approved').length}
            </span>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.map((application) => (
          <div key={application.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Team Logo */}
                  <div className="flex-shrink-0">
                    {application.teamLogo ? (
                      <img
                        src={application.teamLogo}
                        alt={`${application.teamName} logosu`}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <UserGroupIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Application Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{application.teamName}</h3>
                      {getStatusBadge(application.status)}
                      {getExperienceBadge(application.experienceLevel)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">
                          <strong>Turnuva:</strong> {application.tournamentName}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Kaptan:</strong> {application.captainName}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Email:</strong> {application.captainEmail}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          <strong>Oyuncu Sayısı:</strong> {application.playerCount}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Başvuru Tarihi:</strong> {new Date(application.applicationDate).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>

                    {application.notes && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-700">
                          <strong>Notlar:</strong> {application.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex-shrink-0 ml-4">
                  {getStatusBadge(application.status)}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedApplication(application);
                      setShowDetailModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                    title="Detayları Görüntüle"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                </div>
                
                {application.status === 'pending' && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setApplicationToApprove(application);
                        setApprovalAction('reject');
                        setShowApprovalModal(true);
                      }}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                    >
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      Reddet
                    </button>
                    <button
                      onClick={() => {
                        setApplicationToApprove(application);
                        setApprovalAction('approve');
                        setShowApprovalModal(true);
                      }}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                    >
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Onayla
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredApplications.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Başvuru bulunamadı</h3>
          <p className="text-gray-500">Arama kriterlerinize uygun başvuru bulunamadı.</p>
        </div>
      )}

      {/* Approval Confirmation Modal */}
      {showApprovalModal && applicationToApprove && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${
                approvalAction === 'approve' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {approvalAction === 'approve' ? (
                  <CheckIcon className="h-6 w-6 text-green-600" />
                ) : (
                  <XMarkIcon className="h-6 w-6 text-red-600" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                Başvuruyu {approvalAction === 'approve' ? 'Onayla' : 'Reddet'}
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  <strong>{applicationToApprove.teamName}</strong> takımının 
                  <strong> {applicationToApprove.tournamentName}</strong> turnuvasına başvurusunu {approvalAction === 'approve' ? 'onaylamak' : 'reddetmek'} istediğinizden emin misiniz?
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setApplicationToApprove(null);
                    setApprovalAction('');
                  }}
                  className="btn-secondary"
                >
                  İptal
                </button>
                <button
                  onClick={() => handleApproveApplication(applicationToApprove.id, approvalAction)}
                  className={approvalAction === 'approve' ? 'btn-primary' : 'btn-danger'}
                >
                  {approvalAction === 'approve' ? 'Onayla' : 'Reddet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Detail Modal */}
      <ApplicationDetailModal
        application={selectedApplication}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedApplication(null);
        }}
      />
    </div>
  );
};

export default ApplicationsPage;