import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrophyIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowLeftIcon,
  PlayIcon,
  PauseIcon,
  StopIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import TournamentDetailModal from '../../components/Admin/TournamentDetailModal';
import TournamentEditModal from '../../components/Admin/TournamentEditModal';
import api from '../../services/api';

const TournamentsPage = () => {
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [tournamentToEdit, setTournamentToEdit] = useState(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/tournaments');
      
      if (response.success) {
        setTournaments(response.data.tournaments || []);
      } else {
        // Varsayılan turnuvalar (API yoksa)
        setTournaments([
          {
            id: 1,
            name: 'Yaz Kupası 2024',
            description: 'Yaz sezonunun en büyük turnuvası',
            startDate: '2024-07-01',
            endDate: '2024-07-31',
            registrationDeadline: '2024-06-15',
            maxTeams: 16,
            entryFee: 500,
            prizePool: 10000,
            status: 'active',
            format: 'knockout',
            location: 'İstanbul',
            createdAt: '2024-05-01T00:00:00Z',
            applicationsCount: 12,
            teamsCount: 8
          },
          {
            id: 2,
            name: 'Kış Ligi 2024',
            description: 'Kış sezonunun lig formatı turnuvası',
            startDate: '2024-12-01',
            endDate: '2025-03-31',
            registrationDeadline: '2024-11-15',
            maxTeams: 20,
            entryFee: 750,
            prizePool: 15000,
            status: 'draft',
            format: 'league',
            location: 'Ankara',
            createdAt: '2024-10-01T00:00:00Z',
            applicationsCount: 5,
            teamsCount: 0
          },
          {
            id: 3,
            name: 'Bahar Kupası 2024',
            description: 'Bahar sezonunun heyecan dolu turnuvası',
            startDate: '2024-04-01',
            endDate: '2024-04-30',
            registrationDeadline: '2024-03-15',
            maxTeams: 12,
            entryFee: 300,
            prizePool: 5000,
            status: 'completed',
            format: 'knockout',
            location: 'İzmir',
            createdAt: '2024-02-01T00:00:00Z',
            applicationsCount: 12,
            teamsCount: 12
          }
        ]);
      }
    } catch (error) {
      console.error('Turnuvalar yüklenirken hata:', error);
      toast.error('Turnuvalar yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTournamentSave = async (tournamentId, tournamentData) => {
    try {
      const response = await api.put(`/admin/tournaments/${tournamentId}`, tournamentData);
      
      if (response.success) {
        // Turnuva listesini güncelle
        setTournaments(tournaments.map(tournament => 
          tournament.id === tournamentId 
            ? { ...tournament, ...tournamentData }
            : tournament
        ));
        return Promise.resolve();
      } else {
        return Promise.reject(new Error(response.message || 'Güncelleme hatası'));
      }
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const handleDeleteTournament = async (tournamentId) => {
    try {
      const response = await api.delete(`/admin/tournaments/${tournamentId}`);
      
      if (response.success) {
        setTournaments(tournaments.filter(tournament => tournament.id !== tournamentId));
        toast.success('Turnuva başarıyla silindi');
      } else {
        toast.error(response.message || 'Turnuva silinirken hata oluştu');
      }
    } catch (error) {
      toast.error('Turnuva silinirken hata oluştu');
    }
    setShowDeleteModal(false);
    setTournamentToDelete(null);
  };

  const handleStatusChange = async (tournamentId, newStatus) => {
    try {
      const response = await api.put(`/admin/tournaments/${tournamentId}/status`, {
        status: newStatus
      });
      
      if (response.success) {
        setTournaments(tournaments.map(tournament => 
          tournament.id === tournamentId 
            ? { ...tournament, status: newStatus }
            : tournament
        ));
        toast.success(`Turnuva durumu ${getStatusLabel(newStatus)} olarak güncellendi`);
      } else {
        toast.error(response.message || 'Durum güncellenirken hata oluştu');
      }
    } catch (error) {
      toast.error('Durum güncellenirken hata oluştu');
    }
  };

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tournament.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tournament.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || tournament.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const badges = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: ClockIcon, label: 'Taslak' },
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, label: 'Aktif' },
      completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircleIcon, label: 'Tamamlandı' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, label: 'İptal' }
    };

    const badge = badges[status] || badges.draft;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Taslak',
      active: 'Aktif',
      completed: 'Tamamlandı',
      cancelled: 'İptal'
    };
    return labels[status] || 'Bilinmeyen';
  };

  const getFormatLabel = (format) => {
    const labels = {
      knockout: 'Eleme',
      league: 'Lig',
      group: 'Grup'
    };
    return labels[format] || format;
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
          <div className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <TrophyIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Turnuva Yönetimi</h1>
            <p className="text-gray-600">{filteredTournaments.length} turnuva bulundu</p>
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
              placeholder="Turnuva ara..."
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
            <option value="draft">Taslak</option>
            <option value="active">Aktif</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancelled">İptal</option>
          </select>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              Aktif: {tournaments.filter(t => t.status === 'active').length}
            </span>
            <span className="text-sm text-gray-500">|</span>
            <span className="text-sm text-gray-500">
              Taslak: {tournaments.filter(t => t.status === 'draft').length}
            </span>
          </div>

          <button className="btn-primary">
            <PlusIcon className="h-4 w-4 mr-2" />
            Yeni Turnuva
          </button>
        </div>
      </div>

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTournaments.map((tournament) => (
          <div key={tournament.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Tournament Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{tournament.name}</h3>
                    {getStatusBadge(tournament.status)}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{tournament.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>📍 {tournament.location}</span>
                    <span>🏆 {getFormatLabel(tournament.format)}</span>
                    <span>👥 {tournament.teamsCount}/{tournament.maxTeams}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tournament Details */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Başlangıç</p>
                  <p className="text-sm font-medium">
                    {new Date(tournament.startDate).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Bitiş</p>
                  <p className="text-sm font-medium">
                    {new Date(tournament.endDate).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Kayıt Sonu</p>
                  <p className="text-sm font-medium">
                    {new Date(tournament.registrationDeadline).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Başvuru</p>
                  <p className="text-sm font-medium">{tournament.applicationsCount} başvuru</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Katılım Ücreti</p>
                  <p className="text-sm font-medium">₺{tournament.entryFee?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ödül Havuzu</p>
                  <p className="text-sm font-medium text-green-600">₺{tournament.prizePool?.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedTournament(tournament);
                      setShowDetailModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                    title="Detayları Görüntüle"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setTournamentToEdit(tournament);
                      setShowEditModal(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-900"
                    title="Düzenle"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setTournamentToDelete(tournament);
                      setShowDeleteModal(true);
                    }}
                    className="text-red-600 hover:text-red-900"
                    title="Sil"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  {tournament.status === 'draft' && (
                    <button
                      onClick={() => handleStatusChange(tournament.id, 'active')}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                    >
                      <PlayIcon className="h-3 w-3 mr-1" />
                      Başlat
                    </button>
                  )}
                  {tournament.status === 'active' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(tournament.id, 'completed')}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                      >
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Tamamla
                      </button>
                      <button
                        onClick={() => handleStatusChange(tournament.id, 'cancelled')}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                      >
                        <StopIcon className="h-3 w-3 mr-1" />
                        İptal
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTournaments.length === 0 && (
        <div className="text-center py-12">
          <TrophyIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Turnuva bulunamadı</h3>
          <p className="text-gray-500">Arama kriterlerinize uygun turnuva bulunamadı.</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && tournamentToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                Turnuvayı Sil
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  <strong>{tournamentToDelete.name}</strong> turnuvasını silmek istediğinizden emin misiniz?
                  Bu işlem geri alınamaz.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setTournamentToDelete(null);
                  }}
                  className="btn-secondary"
                >
                  İptal
                </button>
                <button
                  onClick={() => handleDeleteTournament(tournamentToDelete.id)}
                  className="btn-danger"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tournament Detail Modal */}
      <TournamentDetailModal
        tournament={selectedTournament}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedTournament(null);
        }}
      />

      {/* Tournament Edit Modal */}
      <TournamentEditModal
        tournament={tournamentToEdit}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setTournamentToEdit(null);
        }}
        onSave={handleTournamentSave}
      />
    </div>
  );
};

export default TournamentsPage;