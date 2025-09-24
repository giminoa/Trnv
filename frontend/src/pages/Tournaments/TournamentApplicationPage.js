import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  TrophyIcon, 
  UsersIcon,
  CalendarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import api from '../../services/api';

const TournamentApplicationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [userTeam, setUserTeam] = useState(null);
  const [existingApplication, setExistingApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Turnuva bilgilerini getir
        const tournamentResponse = await api.get(`/tournaments/${id}`);
        if (tournamentResponse.success) {
          setTournament(tournamentResponse.data.tournament);
        }

        // Kullanıcının takımını getir
        const teamResponse = await api.get('/teams/my-team');
        if (teamResponse.success && teamResponse.data.team) {
          setUserTeam(teamResponse.data.team);
        }

        // Mevcut başvuruyu kontrol et
        const applicationsResponse = await api.get('/applications/my-applications');
        if (applicationsResponse.success) {
          const existingApp = applicationsResponse.data.applications.find(
            app => app.tournament_id === parseInt(id)
          );
          if (existingApp) {
            setExistingApplication(existingApp);
          }
        }

      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        toast.error('Veriler yüklenirken bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };

    if (id && user) {
      fetchData();
    }
  }, [id, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await api.post(`/applications/tournaments/${id}/apply`, {
        message: message.trim() || null
      });

      if (response.success) {
        toast.success(response.message);
        navigate(`/turnuva/${id}`);
      } else {
        toast.error(response.message || 'Başvuru gönderilirken bir hata oluştu');
      }
    } catch (error) {
      toast.error('Başvuru gönderilirken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelApplication = async () => {
    if (!existingApplication || !window.confirm('Başvurunuzu iptal etmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await api.delete(`/applications/applications/${existingApplication.id}`);
      
      if (response.success) {
        toast.success('Başvuru başarıyla iptal edildi');
        setExistingApplication(null);
      } else {
        toast.error(response.message || 'Başvuru iptal edilirken bir hata oluştu');
      }
    } catch (error) {
      toast.error('Başvuru iptal edilirken bir hata oluştu');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center py-12">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <TrophyIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Turnuva Bulunamadı</h1>
          <p className="text-gray-600">Aradığınız turnuva mevcut değil.</p>
        </div>
      </div>
    );
  }

  if (!userTeam) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Takım Gerekli</h1>
          <p className="text-gray-600 mb-4">
            Turnuvaya başvuru yapmak için önce bir takım oluşturmalısınız.
          </p>
          <button
            onClick={() => navigate('/takım-olustur')}
            className="btn-primary"
          >
            Takım Oluştur
          </button>
        </div>
      </div>
    );
  }

  const canApply = tournament.status === 'registration' && 
                   tournament.current_participants < tournament.max_participants;

  const getStatusMessage = () => {
    if (tournament.status !== 'registration') {
      return {
        type: 'warning',
        message: 'Bu turnuva için başvuru kabul edilmiyor'
      };
    }
    
    if (tournament.current_participants >= tournament.max_participants) {
      return {
        type: 'warning',
        message: 'Turnuva dolu'
      };
    }
    
    return {
      type: 'success',
      message: 'Başvuru yapabilirsiniz'
    };
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <button
                onClick={() => navigate('/turnuvalar')}
                className="text-gray-400 hover:text-gray-500"
              >
                Turnuvalar
              </button>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <button
                  onClick={() => navigate(`/turnuva/${id}`)}
                  className="ml-4 text-gray-400 hover:text-gray-500"
                >
                  {tournament.name}
                </button>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-4 text-gray-500">Başvuru</span>
              </div>
            </li>
          </ol>
        </nav>
        
        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Turnuva Başvurusu
        </h1>
        <p className="mt-2 text-gray-600">
          {tournament.name} turnuvasına başvuru yapın
        </p>
      </div>

      {/* Existing Application */}
      {existingApplication && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <CheckCircleIcon className="h-6 w-6 text-blue-600 mt-0.5" />
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-blue-900">
                Başvuru Durumu
              </h3>
              <div className="mt-2">
                <p className="text-blue-700">
                  Bu turnuvaya zaten başvuru yapmışsınız.
                </p>
                <div className="mt-3 flex items-center space-x-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    existingApplication.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    existingApplication.status === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {existingApplication.status === 'pending' ? 'Beklemede' :
                     existingApplication.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                  </span>
                  <span className="text-sm text-blue-600">
                    Başvuru Tarihi: {new Date(existingApplication.application_date).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                {existingApplication.group_name && (
                  <p className="mt-2 text-sm text-blue-700">
                    <strong>Grup:</strong> {existingApplication.group_name}
                  </p>
                )}
                {existingApplication.status === 'pending' && (
                  <button
                    onClick={handleCancelApplication}
                    className="mt-3 text-sm text-red-600 hover:text-red-700"
                  >
                    Başvuruyu İptal Et
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Application Form */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Başvuru Formu
              </h2>
            </div>
            
            <div className="p-6">
              {/* Status Alert */}
              <div className={`mb-6 p-4 rounded-md ${
                statusMessage.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex">
                  {statusMessage.type === 'success' ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                  )}
                  <div className="ml-3">
                    <p className={`text-sm ${
                      statusMessage.type === 'success' ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      {statusMessage.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Team Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Başvuru Yapan Takım
                </h3>
                <div className="flex items-center space-x-4">
                  {userTeam.logo ? (
                    <img
                      src={userTeam.logo}
                      alt={`${userTeam.name} logosu`}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <UsersIcon className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {userTeam.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Menejer: {userTeam.manager_name}
                    </p>
                    {userTeam.stadium_name && (
                      <p className="text-sm text-gray-600">
                        Stadyum: {userTeam.stadium_name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Application Form */}
              {!existingApplication && canApply && (
                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Başvuru Mesajı (Opsiyonel)
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="input-field"
                      placeholder="Turnuvaya neden katılmak istediğinizi, takımınız hakkında bilgileri veya organizatöre iletmek istediğiniz mesajları yazabilirsiniz..."
                      maxLength={500}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {message.length}/500 karakter
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary"
                    >
                      {isSubmitting ? <LoadingSpinner size="small" /> : 'Başvuru Gönder'}
                    </button>
                  </div>
                </form>
              )}

              {!canApply && !existingApplication && (
                <div className="text-center py-8">
                  <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">
                    Bu turnuva için şu anda başvuru yapılamıyor.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tournament Info Sidebar */}
        <div className="space-y-6">
          {/* Tournament Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Turnuva Bilgileri
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center text-sm">
                <TrophyIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Tip:</span>
                <span className="ml-2 font-medium">
                  {tournament.type === 'league' ? 'Lig' :
                   tournament.type === 'group' ? 'Grup' :
                   tournament.type === 'world_cup' ? 'Dünya Kupası' : 'Şampiyonlar Ligi'}
                </span>
              </div>

              <div className="flex items-center text-sm">
                <UsersIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Katılımcı:</span>
                <span className="ml-2 font-medium">
                  {tournament.current_participants}/{tournament.max_participants}
                </span>
              </div>

              {tournament.start_date && (
                <div className="flex items-center text-sm">
                  <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Başlangıç:</span>
                  <span className="ml-2 font-medium">
                    {new Date(tournament.start_date).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Rules */}
          {tournament.rules && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Kurallar
              </h3>
              <div className="text-sm text-gray-600 whitespace-pre-wrap">
                {tournament.rules}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentApplicationPage;