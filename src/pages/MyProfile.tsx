import React, { useState, useEffect } from 'react';
import { useProfile, AdminProfile, SocietySettings } from '../context/ProfileContext';
import { useFlats } from '../context/FlatsContext';
import { Save, Building2, User, Key, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export default function MyProfile() {
  const { adminProfile, updateAdminProfile, societySettings, updateSocietySettings, isLoading } = useProfile();
  const { flats } = useFlats();
  const [activeTab, setActiveTab] = useState<'profile' | 'society'>('profile');

  // Admin Profile State
  const [profileForm, setProfileForm] = useState<AdminProfile>(adminProfile);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Society Settings State
  const [societyForm, setSocietyForm] = useState<SocietySettings>(societySettings);

  useEffect(() => {
    setProfileForm(adminProfile);
  }, [adminProfile]);

  useEffect(() => {
    setSocietyForm(societySettings);
  }, [societySettings]);

  // UI State
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [societySuccess, setSocietySuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await updateAdminProfile(profileForm);
    setIsSubmitting(false);
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(passwordForm.newPassword)) {
      setPasswordError('Password must be at least 8 characters long, contain 1 uppercase letter and 1 number');
      return;
    }

    // In a real app, we would validate current password and update securely
    setPasswordSuccess(true);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  const handleSocietySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await updateSocietySettings(societyForm);
    setIsSubmitting(false);
    setSocietySuccess(true);
    setTimeout(() => setSocietySuccess(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSocietyForm({ ...societyForm, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading || !profileForm || !societyForm) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={clsx(
            'flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors',
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          )}
        >
          <User size={18} />
          My Profile
        </button>
        <button
          onClick={() => setActiveTab('society')}
          className={clsx(
            'flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors',
            activeTab === 'society'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          )}
        >
          <Building2 size={18} />
          Society Settings
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Basic Information */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              <p className="text-sm text-gray-500">Manage your personal account details.</p>
            </div>
            <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    title="Please enter a valid 10-digit phone number"
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
                {profileSuccess && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle2 size={16} /> Profile updated
                  </span>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save Changes
                </button>
              </div>
            </form>
          </section>

          {/* Account Security */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
              <Key size={20} className="text-gray-500" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Account Security</h2>
                <p className="text-sm text-gray-500">Update your password to keep your account secure.</p>
              </div>
            </div>
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <div className="max-w-md space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Min 8 chars, 1 uppercase, 1 number</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
                {passwordSuccess && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle2 size={16} /> Password updated
                  </span>
                )}
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {activeTab === 'society' && (
        <div className="space-y-6">
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Organization Profile</h2>
              <p className="text-sm text-gray-500">Maintain official society information used in receipts and reports.</p>
            </div>
            <form onSubmit={handleSocietySubmit} className="p-6 space-y-6">
              {/* Logo Upload */}
              <div className="flex items-center gap-6">
                <div className="shrink-0">
                  {societyForm.logoUrl ? (
                    <img src={societyForm.logoUrl} alt="Society Logo" className="h-24 w-24 object-contain border border-gray-200 rounded-lg p-2" />
                  ) : (
                    <div className="h-24 w-24 bg-gray-100 border border-gray-200 border-dashed rounded-lg flex items-center justify-center text-gray-400">
                      <Building2 size={32} />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Society Logo</label>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <Upload size={16} />
                    Upload Image
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                  <p className="mt-2 text-xs text-gray-500">Recommended size: 200x200px (PNG or JPG)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Society Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={societyForm.name}
                    onChange={(e) => setSocietyForm({ ...societyForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    rows={3}
                    value={societyForm.address}
                    onChange={(e) => setSocietyForm({ ...societyForm, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Building Age (Years)</label>
                  <input
                    type="number"
                    min="0"
                    value={societyForm.buildingAge}
                    onChange={(e) => setSocietyForm({ ...societyForm, buildingAge: e.target.value ? Number(e.target.value) : '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Blocks / Towers</label>
                  <input
                    type="number"
                    min="1"
                    value={societyForm.numberOfBlocks}
                    onChange={(e) => setSocietyForm({ ...societyForm, numberOfBlocks: e.target.value ? Number(e.target.value) : '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year of Establishment</label>
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={societyForm.yearOfEstablishment}
                    onChange={(e) => setSocietyForm({ ...societyForm, yearOfEstablishment: e.target.value ? Number(e.target.value) : '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Flats (Auto-calculated)</label>
                  <input
                    type="text"
                    readOnly
                    value={flats.length}
                    className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Society Contact Number</label>
                  <input
                    type="tel"
                    value={societyForm.contactNumber}
                    onChange={(e) => setSocietyForm({ ...societyForm, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Society Email</label>
                  <input
                    type="email"
                    value={societyForm.email}
                    onChange={(e) => setSocietyForm({ ...societyForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
                {societySuccess && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle2 size={16} /> Society details updated
                  </span>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Update Society Details
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
