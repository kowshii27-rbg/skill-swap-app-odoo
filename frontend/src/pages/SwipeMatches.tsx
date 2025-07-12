import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI, swapAPI } from '../services/api';
import { toast } from 'react-hot-toast';

// Define User and Skill types locally (should be moved to a types file if available)
type Skill = {
  id: string;
  name: string;
};

type User = {
  id: string;
  name: string;
  username?: string; // For backward compatibility
  photo?: string;
  profile_photo?: string;
  location?: string;
  skills?: Skill[];
  skills_offered?: string[];
  skills_wanted?: string[];
  availability?: string;
  bio?: string;
  rating?: number;
};

interface SwipeMatchesProps {
  filters?: {
    skill?: string;
    type?: string;
    availability?: string;
  };
}

const SwipeMatches: React.FC<SwipeMatchesProps> = ({ filters = {} }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swipedUsers, setSwipedUsers] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching users with filters:', filters);
      console.log('Current user:', user);
      
      // Test if backend is accessible
      try {
        const testResponse = await fetch('http://localhost:8000/docs');
        console.log('Backend accessible:', testResponse.ok);
      } catch (backendError) {
        console.error('Backend not accessible:', backendError);
        throw new Error('Backend server is not running. Please start the backend server.');
      }
      
      // Test authentication
      if (!user) {
        throw new Error('User not authenticated. Please log in again.');
      }
      
      const response = await userAPI.searchUsers({
        ...filters,
        page: 1,
        size: 50, // Fetch more users for swipe experience
      });
      
      console.log('API response:', response);
      console.log('Response data:', response.data);
      
      // Check if response.data exists and has users property
      if (!response.data || !response.data.users) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }
      
      // Filter out current user and already swiped users
      const swipedUserIds = Array.from(swipedUsers);
      const filteredUsers = response.data.users.filter(
        (u: User) => u.id !== user?.id && !swipedUserIds.includes(u.id)
      );
      
      console.log('Filtered users:', filteredUsers);
      setUsers(filteredUsers);
      setCurrentIndex(0);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      
      let errorMessage = 'Failed to load potential matches';
      if (error.response?.status === 401) {
        errorMessage = 'Please log in again';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error - please try again later';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      // Set empty array to show no matches state
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const onSwipe = async (direction: 'left' | 'right', swipedUser: User) => {
    console.log(`Swiped ${direction} on ${swipedUser.name || swipedUser.username}`);
    
    // Add to swiped set
    setSwipedUsers(prev => new Set(Array.from(prev).concat(swipedUser.id)));
    
    if (direction === 'right') {
      // Send swap request
      try {
        await swapAPI.createRequest({
          target_user_id: swipedUser.id,
          message: `Hi! I'm interested in swapping skills with you. Let's connect!`
        });
        
        toast.success(`Swap request sent to ${swipedUser.name || swipedUser.username}!`);
      } catch (error) {
        console.error('Error sending swap request:', error);
        toast.error('Failed to send swap request');
      }
    }
    
    // Move to next user
    setCurrentIndex(prev => prev + 1);
    setSwipeDirection(null);
    setDragOffset({ x: 0, y: 0 });
    
    // If we're running low on users, fetch more
    if (currentIndex >= users.length - 3) {
      fetchUsers();
    }
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      // Remove from swiped set
      const lastSwipedUser = users[currentIndex - 1];
      setSwipedUsers(prev => {
        const arr = Array.from(prev);
        const newSet = new Set(arr);
        newSet.delete(lastSwipedUser.id);
        return newSet;
      });
    }
  };

  // Touch/Mouse event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - dragStart.x;
    const deltaY = currentY - dragStart.y;
    
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = 100;
    if (Math.abs(dragOffset.x) > threshold) {
      const direction = dragOffset.x > 0 ? 'right' : 'left';
      onSwipe(direction, users[currentIndex]);
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = 100;
    if (Math.abs(dragOffset.x) > threshold) {
      const direction = dragOffset.x > 0 ? 'right' : 'left';
      onSwipe(direction, users[currentIndex]);
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchUsers}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Finding your perfect skill matches...</p>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No More Matches</h2>
          <p className="text-gray-600 mb-6">
            We've shown you all available matches with your current filters.
          </p>
          <button
            onClick={fetchUsers}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Matches
          </button>
        </div>
      </div>
    );
  }

  const currentUser = users[currentIndex];
  if (!currentUser) return null;

  const cardStyle = {
    transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.1}deg)`,
    transition: isDragging ? 'none' : 'transform 0.3s ease-out',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Find Your Skill Match</h1>
          <p className="text-gray-600">Swipe right to send a swap request, left to skip</p>
        </div>

        {/* Card Container */}
        <div className="flex justify-center">
          <div className="relative w-80 h-96">
            <div
              ref={cardRef}
              className="absolute w-full h-full cursor-grab active:cursor-grabbing"
              style={cardStyle}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-full">
                {/* User Photo */}
                <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 relative">
                  {currentUser.profile_photo || currentUser.photo ? (
                    <img
                      src={currentUser.profile_photo || currentUser.photo}
                      alt={currentUser.name || currentUser.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-6xl">
                      👤
                    </div>
                  )}
                  
                  {/* Swipe Indicators */}
                  <div className="absolute top-4 right-4">
                    <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold mb-2 transform -rotate-12">
                      NOPE
                    </div>
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold transform rotate-12">
                      LIKE
                    </div>
                  </div>
                </div>

                {/* User Info */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      {currentUser.name || currentUser.username}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {currentUser.location || 'Location not set'}
                    </span>
                  </div>

                  {/* Skills Offered */}
                  {currentUser.skills_offered && currentUser.skills_offered.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-600 mb-2">Skills Offered</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentUser.skills_offered.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {currentUser.skills_offered.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{currentUser.skills_offered.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Skills Wanted */}
                  {currentUser.skills_wanted && currentUser.skills_wanted.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-600 mb-2">Skills Wanted</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentUser.skills_wanted.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {currentUser.skills_wanted.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{currentUser.skills_wanted.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Legacy Skills Support */}
                  {currentUser.skills && currentUser.skills.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-600 mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentUser.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill.id}
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                          >
                            {skill.name}
                          </span>
                        ))}
                        {currentUser.skills.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{currentUser.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Availability */}
                  {currentUser.availability && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-600 mb-1">Availability</h4>
                      <span className="text-sm text-gray-700">{currentUser.availability}</span>
                    </div>
                  )}

                  {/* Bio */}
                  {currentUser.bio && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-1">About</h4>
                      <p className="text-sm text-gray-700 line-clamp-2">{currentUser.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={() => onSwipe('left', currentUser)}
            className="bg-red-500 text-white p-4 rounded-full hover:bg-red-600 transition-colors shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            onClick={handleUndo}
            disabled={currentIndex === 0}
            className="bg-gray-500 text-white p-4 rounded-full hover:bg-gray-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>

          <button
            onClick={() => onSwipe('right', currentUser)}
            className="bg-green-500 text-white p-4 rounded-full hover:bg-green-600 transition-colors shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Progress */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            {currentIndex + 1} of {users.length} matches
          </p>
        </div>
      </div>
    </div>
  );
};

export default SwipeMatches; 