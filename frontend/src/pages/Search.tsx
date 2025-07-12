import React, { useState, useEffect } from 'react';
import { userAPI, swapAPI } from '../services/api';
import { SkillChip } from '../components/SkillChip';
import toast from 'react-hot-toast';
import { 
  Search as SearchIcon, 
  Filter, 
  MapPin, 
  Clock, 
  Star, 
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Users,
  X,
  Send,
  User
} from 'lucide-react';

interface SearchUser {
  id: string;
  name: string;
  skills_offered: string[];
  skills_wanted: string[];
  availability?: string;
  profile_photo?: string;
  rating: number;
  location?: string;
}

interface SearchResults {
  users: SearchUser[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const Search: React.FC = () => {
  const [searchResults, setSearchResults] = useState<SearchResults>({
    users: [],
    total: 0,
    page: 1,
    limit: 12,
    pages: 0
  });
  const [loading, setLoading] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<Array<{id: string, name: string}>>([]);
  
  // Search filters
  const [filters, setFilters] = useState({
    skill: '',
    type: '',
    availability: ''
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Swap request modal
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [swapMessage, setSwapMessage] = useState('');
  const [selectedOfferedSkill, setSelectedOfferedSkill] = useState('');
  const [selectedWantedSkill, setSelectedWantedSkill] = useState('');
  const [userSkills, setUserSkills] = useState<Array<{id: string, name: string, type: string}>>([]);

  useEffect(() => {
    loadAvailableSkills();
    performSearch();
  }, [filters, currentPage]);

  const loadAvailableSkills = async () => {
    try {
      const response = await userAPI.getAvailableSkills();
      setAvailableSkills(response.data);
    } catch (error) {
      console.error('Failed to load available skills');
    }
  };

  const loadUserSkills = async () => {
    try {
      const response = await userAPI.getSkills();
      if (response.data && Array.isArray(response.data)) {
        setUserSkills(response.data);
      } else {
        console.error('Invalid user skills response:', response);
        setUserSkills([]);
      }
    } catch (error) {
      console.error('Failed to load user skills:', error);
      setUserSkills([]);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: currentPage,
        limit: 12
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params] === '') {
          delete params[key as keyof typeof params];
        }
      });

      const response = await userAPI.searchUsers(params);
      setSearchResults(response.data);
    } catch (error: any) {
      toast.error('Failed to search users');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      skill: '',
      type: '',
      availability: ''
    });
    setCurrentPage(1);
  };

  const openSwapModal = async (user: SearchUser) => {
    setSelectedUser(user);
    setSwapMessage(`Hi ${user.name}! I'd like to initiate a skill swap with you.`);
    setSelectedOfferedSkill('');
    setSelectedWantedSkill('');
    await loadUserSkills();
    setShowSwapModal(true);
  };

  const sendSwapRequest = async () => {
    if (!selectedUser || !selectedOfferedSkill || !selectedWantedSkill) {
      toast.error('Please select both skills for the swap');
      return;
    }

    try {
      await swapAPI.createRequest({
        target_user_id: selectedUser.id,
        message: swapMessage
      });
      toast.success('Swap request sent successfully!');
      setShowSwapModal(false);
    } catch (error: any) {
      console.error('Swap request error:', error);
      let errorMessage = 'Failed to send swap request';
      
      if (error.response?.data?.detail) {
        errorMessage = String(error.response.data.detail);
      } else if (error.message) {
        errorMessage = String(error.message);
      }
      
      toast.error(errorMessage);
    }
  };

  const renderUserCard = (user: SearchUser) => (
    <div key={user.id} className="card-hover">
      <div className="flex items-start space-x-4">
        {/* Profile Photo */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {user.profile_photo ? (
              <img
                src={user.profile_photo}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                <span className="text-xl font-bold text-primary-600">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {user.name}
            </h3>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">{user.rating}</span>
            </div>
          </div>

          {/* Location and Availability */}
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
            {user.location && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{user.location}</span>
              </div>
            )}
            {user.availability && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{user.availability}</span>
              </div>
            )}
          </div>

          {/* Skills */}
          <div className="space-y-2">
            {user.skills_offered && user.skills_offered.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Skills Offered
                </h4>
                <div className="flex flex-wrap gap-1">
                  {user.skills_offered && user.skills_offered.slice(0, 3).map((skill, index) => {
                    const skillName = String(skill || 'Unknown Skill');
                    return (
                      <SkillChip 
                        key={index} 
                        skill={{ id: index.toString(), name: skillName }} 
                        type="offered"
                        className="text-xs"
                      />
                    );
                  })}
                  {user.skills_offered && user.skills_offered.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{(user.skills_offered ? user.skills_offered.length : 0) - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {user.skills_wanted && user.skills_wanted.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Skills Wanted
                </h4>
                <div className="flex flex-wrap gap-1">
                  {user.skills_wanted && user.skills_wanted.slice(0, 3).map((skill, index) => {
                    const skillName = String(skill || 'Unknown Skill');
                    return (
                      <SkillChip 
                        key={index} 
                        skill={{ id: index.toString(), name: skillName }} 
                        type="wanted"
                        className="text-xs"
                      />
                    );
                  })}
                  {user.skills_wanted && user.skills_wanted.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{(user.skills_wanted ? user.skills_wanted.length : 0) - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-4">
            <button
              onClick={() => openSwapModal(user)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              <Send className="h-4 w-4" />
              <span>Send Swap Request</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPagination = () => {
    if (searchResults.pages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(searchResults.pages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-2 rounded-lg border ${
              currentPage === page
                ? 'bg-primary-600 text-white border-primary-600'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage(prev => Math.min(searchResults.pages, prev + 1))}
          disabled={currentPage === searchResults.pages}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find Skill Partners</h1>
          <p className="text-gray-600">Search for users to swap skills with</p>
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-secondary flex items-center space-x-2"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Search Filters */}
      {showFilters && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Search Filters</h2>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
            >
              <X className="h-4 w-4" />
              <span>Clear All</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Skill Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skill
              </label>
              <input
                type="text"
                placeholder="Search for skills..."
                value={filters.skill}
                onChange={(e) => handleFilterChange('skill', e.target.value)}
                className="input"
              />
            </div>

            {/* Skill Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skill Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="input"
              >
                <option value="">All Skills</option>
                <option value="offered">Skills Offered</option>
                <option value="wanted">Skills Wanted</option>
              </select>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <select
                value={filters.availability}
                onChange={(e) => handleFilterChange('availability', e.target.value)}
                className="input"
              >
                <option value="">Any Availability</option>
                <option value="Weekdays">Weekdays</option>
                <option value="Weekends">Weekends</option>
                <option value="Evenings">Evenings</option>
                <option value="Flexible">Flexible</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-gray-500" />
                <span className="text-gray-600">
                  Found {searchResults.total} user{searchResults.total !== 1 ? 's' : ''}
                </span>
              </div>
              
              {searchResults.total > 0 && (
                <span className="text-sm text-gray-500">
                  Page {currentPage} of {searchResults.pages}
                </span>
              )}
            </div>

                         {/* Results Grid */}
             {searchResults.total === 0 && !loading ? (
               <div className="text-center py-12">
                 <SearchIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                 <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                 <p className="text-gray-600">
                   Try adjusting your search filters or browse all users
                 </p>
                 <button
                   onClick={clearFilters}
                   className="btn-primary mt-4"
                 >
                   Clear Filters
                 </button>
               </div>
             ) : searchResults.users && searchResults.users.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.users.map(renderUserCard)}
                             </div>
             ) : null}

                         {/* Pagination */}
             {renderPagination()}
           </div>
         )}
      </div>

      {/* Swap Request Modal */}
      {showSwapModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">Send Swap Request</h3>
              <button
                onClick={() => setShowSwapModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-3 mb-6 p-3 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {selectedUser.profile_photo ? (
                  <img
                    src={selectedUser.profile_photo}
                    alt={selectedUser.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary-600">
                      {(selectedUser.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{selectedUser.name || 'Unknown User'}</h4>
                <p className="text-sm text-gray-500">
                  {(selectedUser.skills_offered?.length || 0)} skills offered, {(selectedUser.skills_wanted?.length || 0)} skills wanted
                </p>
              </div>
            </div>

            {/* Skill Selection */}
            <div className="space-y-4">
              {/* Your Offered Skill */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Offered Skill
                </label>
                <select
                  value={selectedOfferedSkill}
                  onChange={(e) => setSelectedOfferedSkill(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a skill you can offer</option>
                  {userSkills
                    .filter(skill => skill.type === 'offered')
                    .map(skill => (
                      <option key={skill.id} value={skill.id}>
                        {skill.name || 'Unknown Skill'}
                      </option>
                    ))}
                </select>
              </div>

              {/* Their Offered Skill */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skill You Want from {selectedUser.name || 'User'}
                </label>
                <select
                  value={selectedWantedSkill}
                  onChange={(e) => setSelectedWantedSkill(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a skill you want</option>
                  {(selectedUser.skills_offered || []).map((skill, index) => (
                    <option key={index} value={skill || `skill-${index}`}>
                      {skill || 'Unknown Skill'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={swapMessage}
                  onChange={(e) => setSwapMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a personal message to your swap request..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowSwapModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={sendSwapRequest}
                disabled={!selectedOfferedSkill || !selectedWantedSkill}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 