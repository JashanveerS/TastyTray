import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../data/supabase';

interface ProfileCardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ isOpen, onClose }) => {
  const { user, profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setName(profile?.name || user?.user_metadata?.name || '');
      setEmail(user?.email || '');
      setMessage('');
      setError('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen, user, profile]);

  const handleUpdateName = async () => {
    if (!user || !name.trim()) return;
    
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Update or create profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          name: name.trim(),
          email: user.email,
          dietary_restrictions: profile?.dietary_restrictions || [],
          cuisine_preferences: profile?.cuisine_preferences || [],
          allergies: profile?.allergies || [],
          nutritional_goals: profile?.nutritional_goals || {
            dailyCalories: 2000,
            protein: 150,
            carbs: 250,
            fat: 65,
            fiber: 25
          }
        });

      if (profileError) throw profileError;

      // Update auth metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { name: name.trim() }
      });

      if (metadataError) throw metadataError;

      await updateProfile();
      setMessage('Name updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update name');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!user || !email.trim() || !currentPassword) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // First verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword
      });

      if (verifyError) {
        throw new Error('Current password is incorrect');
      }

      // Update email (this will send a confirmation email)
      const { error: emailError } = await supabase.auth.updateUser({
        email: email.trim()
      });

      if (emailError) throw emailError;

      setMessage('Email update initiated! Please check your new email for confirmation.');
      setCurrentPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Update password directly - Supabase will handle verification
      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (passwordError) {
        // Common error handling
        if (passwordError.message.includes('Password')) {
          throw new Error('Failed to update password. Please try again.');
        }
        throw passwordError;
      }

      setMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Password update error:', err);
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Profile Card */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-6 w-full max-w-md z-50 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="heading-2">Profile Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
            <Check size={16} />
            <span className="text-sm">{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Name Section */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Display Name</h3>
            <div className="space-y-3">
              <div className="form-group">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input pl-10"
                    placeholder="Enter your name"
                  />
                </div>
              </div>
              <button
                onClick={handleUpdateName}
                disabled={loading || !name.trim() || name === (profile?.name || user?.user_metadata?.name || '')}
                className="btn-secondary text-sm py-2 px-4"
              >
                {loading ? 'Updating...' : 'Update Name'}
              </button>
            </div>
          </div>

          {/* Email Section */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Email Address</h3>
            <div className="space-y-3">
              <div className="form-group">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10"
                    placeholder="Enter new email"
                  />
                </div>
              </div>
              <div className="form-group">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input pl-10 pr-10"
                    placeholder="Current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <button
                onClick={handleUpdateEmail}
                disabled={loading || !email.trim() || !currentPassword || email === user?.email}
                className="btn-secondary text-sm py-2 px-4"
              >
                {loading ? 'Updating...' : 'Update Email'}
              </button>
            </div>
          </div>

          {/* Password Section */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Change Password</h3>
            <div className="space-y-3">
              <div className="form-group">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input pl-10 pr-10"
                    placeholder="Current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input pl-10 pr-10"
                    placeholder="New password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input pl-10 pr-10"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <button
                onClick={handleUpdatePassword}
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                className="btn-secondary text-sm py-2 px-4"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full btn-outline py-2"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};
