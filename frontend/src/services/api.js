import axios from 'axios';

// Base API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/giris';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verifyToken: () => api.get('/auth/verify'),
  getProfile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout'),
};

// Users API
export const usersAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  updateUserRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  updateUserStatus: (id, isActive) => api.put(`/users/${id}/status`, { isActive }),
  changePassword: (id, passwords) => api.put(`/users/${id}/password`, passwords),
};

// Tournaments API
export const tournamentsAPI = {
  getTournaments: (params) => api.get('/tournaments', { params }),
  getTournament: (id) => api.get(`/tournaments/${id}`),
  createTournament: (data) => api.post('/tournaments', data),
  updateTournament: (id, data) => api.put(`/tournaments/${id}`, data),
  updateTournamentStatus: (id, status) => api.put(`/tournaments/${id}/status`, { status }),
  deleteTournament: (id) => api.delete(`/tournaments/${id}`),
};

// Teams API
export const teamsAPI = {
  getTournamentTeams: (tournamentId, params) => 
    api.get(`/teams/tournament/${tournamentId}`, { params }),
  getTeam: (id) => api.get(`/teams/${id}`),
  createTeam: (data) => api.post('/teams', data),
  updateTeam: (id, data) => api.put(`/teams/${id}`, data),
  approveTeam: (id, approved, groupId) => 
    api.put(`/teams/${id}/approval`, { approved, groupId }),
  deleteTeam: (id) => api.delete(`/teams/${id}`),
  addPlayer: (teamId, playerData) => api.post(`/teams/${teamId}/players`, playerData),
};

// Matches API
export const matchesAPI = {
  getTournamentMatches: (tournamentId, params) => 
    api.get(`/matches/tournament/${tournamentId}`, { params }),
  getMatch: (id) => api.get(`/matches/${id}`),
  createMatch: (data) => api.post('/matches', data),
  updateMatchResult: (id, result) => api.put(`/matches/${id}/result`, result),
  addMatchEvent: (matchId, event) => api.post(`/matches/${matchId}/events`, event),
  generateFixtures: (tournamentId) => 
    api.post(`/matches/tournament/${tournamentId}/generate-fixtures`),
};

// Standings API
export const standingsAPI = {
  getTournamentStandings: (tournamentId, params) => 
    api.get(`/standings/tournament/${tournamentId}`, { params }),
  getGroupStandings: (groupId) => api.get(`/standings/group/${groupId}`),
  getTeamStats: (teamId) => api.get(`/standings/team/${teamId}`),
  getTournamentStats: (tournamentId) => 
    api.get(`/standings/tournament/${tournamentId}/stats`),
  recalculateStandings: (tournamentId) => 
    api.post(`/standings/tournament/${tournamentId}/recalculate`),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

// File upload helper
export const uploadFile = async (file, endpoint) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Error handler helper
export const handleAPIError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'Bir hata oluştu. Lütfen tekrar deneyin.';
};

export default api;