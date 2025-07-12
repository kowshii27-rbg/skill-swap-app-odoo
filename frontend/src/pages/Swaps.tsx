import React, { useState, useEffect } from 'react';
import { swapAPI, userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Send, 
  Inbox, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  MessageSquare,
  Trash2,
  Eye
} from 'lucide-react';

type SwapStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';

interface SwapRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_skill: string;
  receiver_skill: string;
  message: string;
  status: SwapStatus;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    name: string;
    profile_photo?: string;
  };
  receiver?: {
    id: string;
    name: string;
    profile_photo?: string;
  };
  sender_skill_details?: {
    id: string;
    name: string;
  };
  receiver_skill_details?: {
    id: string;
    name: string;
  };
}

export const Swaps: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
  const [sentRequests, setSentRequests] = useState<SwapRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<SwapRequest | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const [sentResponse, receivedResponse] = await Promise.all([
        swapAPI.getMyRequests(),
        swapAPI.getReceivedRequests()
      ]);
      
      setSentRequests(sentResponse.data);
      setReceivedRequests(receivedResponse.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load swap requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, status: SwapStatus) => {
    try {
      await swapAPI.updateStatus(requestId, status);
      toast.success(`Request ${status} successfully`);
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update request status');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await swapAPI.cancelRequest(requestId);
      toast.success('Request cancelled successfully');
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel request');
    }
  };

  const getStatusIcon = (status: SwapStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: SwapStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const currentRequests = activeTab === 'sent' ? sentRequests : receivedRequests;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Swaps</h1>
          <p className="text-gray-600">Manage your swap requests</p>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Swaps</h1>
        <p className="text-gray-600">Manage your swap requests</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('sent')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sent'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Send className="w-4 h-4 inline mr-2" />
            Sent Requests ({sentRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'received'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Inbox className="w-4 h-4 inline mr-2" />
            Received Requests ({receivedRequests.length})
          </button>
        </nav>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {currentRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeTab} requests
            </h3>
            <p className="text-gray-600">
              {activeTab === 'sent' 
                ? "You haven't sent any swap requests yet."
                : "You haven't received any swap requests yet."
              }
            </p>
          </div>
        ) : (
          currentRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(request.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(request.created_at)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {activeTab === 'sent' ? request.receiver?.name : request.sender?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activeTab === 'sent' ? 'Receiver' : 'Sender'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <MessageSquare className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {activeTab === 'sent' 
                            ? `You offer: ${request.sender_skill_details?.name || 'Unknown skill'}`
                            : `${request.sender?.name} offers: ${request.sender_skill_details?.name || 'Unknown skill'}`
                          }
                        </p>
                        <p className="text-xs text-gray-500">
                          {activeTab === 'sent'
                            ? `You want: ${request.receiver_skill_details?.name || 'Unknown skill'}`
                            : `You offer: ${request.receiver_skill_details?.name || 'Unknown skill'}`
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {request.message && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                        "{request.message}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowModal(true);
                    }}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>

                  {request.status === 'pending' && (
                    <>
                      {activeTab === 'received' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStatusUpdate(request.id, 'accepted')}
                            className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-sm"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(request.id, 'rejected')}
                            className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-sm"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                      {activeTab === 'sent' && (
                        <button
                          onClick={() => handleCancelRequest(request.id)}
                          className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for detailed view */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">Swap Request Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Status</p>
                <div className="flex items-center space-x-2 mt-1">
                  {getStatusIcon(selectedRequest.status)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Created</p>
                <p className="text-sm text-gray-600 mt-1">{formatDate(selectedRequest.created_at)}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Message</p>
                <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-3 rounded-md">
                  {selectedRequest.message || 'No message provided'}
                </p>
              </div>

              {selectedRequest.status === 'pending' && (
                <div className="flex space-x-2 pt-4">
                  {activeTab === 'received' && (
                    <>
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedRequest.id, 'accepted');
                          setShowModal(false);
                        }}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedRequest.id, 'rejected');
                          setShowModal(false);
                        }}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {activeTab === 'sent' && (
                    <button
                      onClick={() => {
                        handleCancelRequest(selectedRequest.id);
                        setShowModal(false);
                      }}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 