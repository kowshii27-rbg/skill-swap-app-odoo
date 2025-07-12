import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';
import { SkillChip } from '../components/SkillChip';
import { 
  Edit, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Camera,
  MapPin,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';

interface Skill {
  id: string;
  name: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  location?: string;
  profile_photo?: string;
  is_public: boolean;
  availability?: string;
  role: string;
  created_at: string;
  updated_at: string;
  skills_offered: Skill[];
  skills_wanted: Skill[];
}

export const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    availability: '',
    is_public: true,
    profile_photo: '',
    skills_offered: [] as Skill[],
    skills_wanted: [] as Skill[]
  });

  // Skills modal state
  const [skillsModalData, setSkillsModalData] = useState({
    skills_offered: [] as Skill[],
    skills_wanted: [] as Skill[],
    newSkillName: '',
    selectedSkillId: ''
  });

  useEffect(() => {
    loadProfile();
    loadAvailableSkills();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      setProfile(response.data);
      setFormData({
        name: response.data.name,
        location: response.data.location || '',
        availability: response.data.availability || '',
        is_public: response.data.is_public,
        profile_photo: response.data.profile_photo || '',
        skills_offered: response.data.skills_offered,
        skills_wanted: response.data.skills_wanted
      });
    } catch (error: any) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSkills = async () => {
    try {
      const response = await userAPI.getAvailableSkills();
      setAvailableSkills(response.data);
    } catch (error: any) {
      console.error('Failed to load available skills');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await userAPI.updateProfileComplete(formData);
      await loadProfile(); // Reload profile
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSkillsSave = async () => {
    try {
      const updatedFormData = {
        ...formData,
        skills_offered: skillsModalData.skills_offered,
        skills_wanted: skillsModalData.skills_wanted
      };
      await userAPI.updateProfileComplete(updatedFormData);
      setFormData(updatedFormData);
      setShowSkillsModal(false);
      toast.success('Skills updated successfully!');
    } catch (error: any) {
      toast.error('Failed to update skills');
    }
  };

  const addSkill = (type: 'offered' | 'wanted') => {
    if (!skillsModalData.selectedSkillId) return;
    
    const selectedSkill = availableSkills.find(s => s.id === skillsModalData.selectedSkillId);
    if (!selectedSkill) return;

    const currentSkills = type === 'offered' ? skillsModalData.skills_offered : skillsModalData.skills_wanted;
    
    // Check if skill already exists
    if (currentSkills.some(s => s.id === selectedSkill.id)) {
      toast.error('Skill already added');
      return;
    }

    // Check max limit
    if (currentSkills.length >= 10) {
      toast.error(`Maximum 10 skills allowed for ${type} skills`);
      return;
    }

    const updatedSkills = [...currentSkills, selectedSkill];
    setSkillsModalData(prev => ({
      ...prev,
      [type === 'offered' ? 'skills_offered' : 'skills_wanted']: updatedSkills
    }));
  };

  const removeSkill = (type: 'offered' | 'wanted', skillId: string) => {
    const currentSkills = type === 'offered' ? skillsModalData.skills_offered : skillsModalData.skills_wanted;
    const updatedSkills = currentSkills.filter(s => s.id !== skillId);
    
    setSkillsModalData(prev => ({
      ...prev,
      [type === 'offered' ? 'skills_offered' : 'skills_wanted']: updatedSkills
    }));
  };

  const openSkillsModal = () => {
    setSkillsModalData({
      skills_offered: formData.skills_offered,
      skills_wanted: formData.skills_wanted,
      newSkillName: '',
      selectedSkillId: ''
    });
    setShowSkillsModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <div className="flex space-x-3">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Profile</span>
            </button>
          )}
          {isEditing && (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="btn-secondary flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Photo Section */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Photo</h2>
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {formData.profile_photo ? (
                  <img
                    src={formData.profile_photo}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary-600">
                      {formData.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700">
                  <Camera className="h-4 w-4" />
                </button>
              )}
            </div>
            {isEditing && (
              <input
                type="text"
                placeholder="Profile photo URL"
                value={formData.profile_photo}
                onChange={(e) => setFormData(prev => ({ ...prev, profile_photo: e.target.value }))}
                className="input text-sm"
              />
            )}
          </div>
        </div>

        {/* Basic Info Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{formData.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{profile?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="input mt-1"
                    placeholder="Enter your location"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{formData.location || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Availability
                </label>
                {isEditing ? (
                  <select
                    value={formData.availability}
                    onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                    className="input mt-1"
                  >
                    <option value="">Select availability</option>
                    <option value="Weekdays">Weekdays</option>
                    <option value="Weekends">Weekends</option>
                    <option value="Evenings">Evenings</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{formData.availability || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  {formData.is_public ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                  Profile Visibility
                </label>
                {isEditing ? (
                  <label className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      checked={formData.is_public}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Make profile public</span>
                  </label>
                ) : (
                  <p className="mt-1 text-sm text-gray-900">
                    {formData.is_public ? 'Public' : 'Private'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Skills</h2>
              <button
                onClick={openSkillsModal}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Manage Skills</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Skills Offered</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.skills_offered.length > 0 ? (
                    formData.skills_offered.map((skill) => (
                      <SkillChip key={skill.id} skill={skill} type="offered" />
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No skills offered yet</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Skills Wanted</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.skills_wanted.length > 0 ? (
                    formData.skills_wanted.map((skill) => (
                      <SkillChip key={skill.id} skill={skill} type="wanted" />
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No skills wanted yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Management Modal */}
      {showSkillsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Manage Skills</h3>
                <button
                  onClick={() => setShowSkillsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Add Skill Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add Skill</label>
                  <div className="flex space-x-2">
                    <select
                      value={skillsModalData.selectedSkillId}
                      onChange={(e) => setSkillsModalData(prev => ({ ...prev, selectedSkillId: e.target.value }))}
                      className="input flex-1"
                    >
                      <option value="">Select a skill</option>
                      {availableSkills.map((skill) => (
                        <option key={skill.id} value={skill.id}>
                          {skill.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => addSkill('offered')}
                      className="btn-primary text-sm"
                    >
                      Add to Offered
                    </button>
                    <button
                      onClick={() => addSkill('wanted')}
                      className="btn-success text-sm"
                    >
                      Add to Wanted
                    </button>
                  </div>
                </div>

                {/* Skills Lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Skills Offered ({skillsModalData.skills_offered.length}/10)</h4>
                    <div className="flex flex-wrap gap-2">
                      {skillsModalData.skills_offered.map((skill) => (
                        <SkillChip 
                          key={skill.id} 
                          skill={skill} 
                          type="offered" 
                          onRemove={(skillId) => removeSkill('offered', skillId)}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Skills Wanted ({skillsModalData.skills_wanted.length}/10)</h4>
                    <div className="flex flex-wrap gap-2">
                      {skillsModalData.skills_wanted.map((skill) => (
                        <SkillChip 
                          key={skill.id} 
                          skill={skill} 
                          type="wanted" 
                          onRemove={(skillId) => removeSkill('wanted', skillId)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowSkillsModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSkillsSave}
                    className="btn-primary"
                  >
                    Save Skills
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 