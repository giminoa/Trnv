import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  UserGroupIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import TeamDetailModal from '../../components/Admin/TeamDetailModal';
import api from '../../services/api';

const TeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [teamToApprove, setTeamToApprove] = useState(null);
  const [approvalAction, setApprovalAction] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/admin/teams');
      
      if (response.success) {
        setTeams(response.data.teams || []);
      } else {
        // Varsayılan takımlar (API yoksa)
        setTeams([
          {
            id: 1,
            name: 'Admin Takımı',
            shortName: 'ADM',
            managerName: 'Admin Menejer',
            stadiumName: 'Admin Stadyumu',
            motto: 'Admin Motto',
            logo: null,
            primaryColor: '#FF0000',
            secondaryColor: '#00FF00',
            isApproved: true,
            isUserTeam: true,
            captainId: 1,
            createdAt: '2024-01-01T00:00:00Z',
            captain: {
              username: 'admin',
              email: 'admin@turnuva.taktisyen.net'
            }
          },
          {
            id: 2,
            name: 'Test Takımı',
            shortName: 'TST',
            managerName: 'Test Menejer',
            stadiumName: 'Test Stadyumu',
            motto: 'Test Motto',
            logo: null,
            primaryColor: '#3B82F6',
            secondaryColor: '#1E40AF',
            isApproved: true,
            isUserTeam: true,
            captainId: 2,
            createdAt: '2024-01-15T00:00:00Z',
            captain: {
              username: 'testuser',
              email: 'test@example.com'
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Takımlar yüklenirken hata:', error);
      toast.error('Takımlar yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveTeam = async (teamId, action) => {
    try {
      const response = await api.put(`/admin/teams/${teamId}/approval`, {
        isApproved: action === 'approve'
      });
      
      if (response.success) {
        setTeams(teams.map(team => 
          team.id === teamId 
            ? { ...team, isApproved: action === 'approve' }
            : team
        ));
        toast.success(`Takım ${action === 'approve' ? 'onaylandı' : 'reddedildi'}`);
      } else {
        toast.error(response.message || 'İşlem sırasında hata oluştu');
      }
    } catch (error) {
      toast.error('İşlem sırasında hata oluştu');
    }
    setShowApprovalModal(false);
    setTeamToApprove(null);
    setApprovalAction('');
  };

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.shortName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.managerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.captain?.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'approved' && team.isApproved) ||
                         (filterStatus === 'pending' && !team.isApproved);
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (isApproved) => {
    if (isApproved) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Onaylandı
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <ClockIcon className="h-3 w-3 mr-1" />
          Beklemede
        </span>
      );
    }
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
          <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center">
            <UserGroupIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Takım Yönetimi</h1>
            <p className="text-gray-600">{filteredTeams.length} takım bulundu</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Takım ara..."
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
            <option value="approved">Onaylandı</option>
            <option value="pending">Beklemede</option>
          </select>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              Bekleyen: {teams.filter(t => !t.isApproved).length}
            </span>
            <span className="text-sm text-gray-500">|</span>
            <span className="text-sm text-gray-500">
              Onaylı: {teams.filter(t => t.isApproved).length}
            </span>
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <div key={team.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Team Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {team.logo ? (
                    <img
                      src={team.logo}
                      alt={`${team.name} logosu`}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div 
                      className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: team.primaryColor || '#3B82F6' }}
                    >
                      {team.shortName || team.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                    <p className="text-sm text-gray-500">@{team.captain?.username}</p>
                  </div>
                </div>
                {getStatusBadge(team.isApproved)}
              </div>
            </div>

            {/* Team Details */}
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Kısaltma:</span>
                  <span className="font-medium">{team.shortName || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Menejer:</span>
                  <span className="font-medium">{team.managerName || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Stadyum:</span>
                  <span className="font-medium">{team.stadiumName || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Kayıt:</span>
                  <span className="font-medium">
                    {new Date(team.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                {team.motto && (
                  <div className="text-sm">
                    <span className="text-gray-500">Motto:</span>
                    <p className="italic text-gray-700 mt-1">"{team.motto}"</p>
                  </div>
                )}
                {team.primaryColor && team.secondaryColor && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Renkler:</span>
                    <div className="flex space-x-1">
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: team.primaryColor }}
                      ></div>
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: team.secondaryColor }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedTeam(team);
                      setShowDetailModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                    title="Detayları Görüntüle"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      // Edit team - düzenleme modalı açabilir
                      toast.success(`${team.name} takımı düzenleniyor`);
                    }}
                    className="text-indigo-600 hover:text-indigo-900"
                    title="Düzenle"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                </div>
                
                {!team.isApproved && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setTeamToApprove(team);
                        setApprovalAction('reject');
                        setShowApprovalModal(true);
                      }}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                    >
                      <XMarkIcon className="h-3 w-3 mr-1" />
                      Reddet
                    </button>
                    <button
                      onClick={() => {
                        setTeamToApprove(team);
                        setApprovalAction('approve');
                        setShowApprovalModal(true);
                      }}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                    >
                      <CheckIcon className="h-3 w-3 mr-1" />
                      Onayla
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTeams.length === 0 && (
        <div className="text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Takım bulunamadı</h3>
          <p className="text-gray-500">Arama kriterlerinize uygun takım bulunamadı.</p>
        </div>
      )}

      {/* Approval Confirmation Modal */}
      {showApprovalModal && teamToApprove && (
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
                Takımı {approvalAction === 'approve' ? 'Onayla' : 'Reddet'}
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  <strong>{teamToApprove.name}</strong> takımını {approvalAction === 'approve' ? 'onaylamak' : 'reddetmek'} istediğinizden emin misiniz?
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setTeamToApprove(null);
                    setApprovalAction('');
                  }}
                  className="btn-secondary"
                >
                  İptal
                </button>
                <button
                  onClick={() => handleApproveTeam(teamToApprove.id, approvalAction)}
                  className={approvalAction === 'approve' ? 'btn-primary' : 'btn-danger'}
                >
                  {approvalAction === 'approve' ? 'Onayla' : 'Reddet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Detail Modal */}
      <TeamDetailModal
        team={selectedTeam}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedTeam(null);
        }}
      />
    </div>
  );
};

export default TeamsPage;