import React, { useEffect, useState } from 'react';
import api from '../api';
import Layout from '../components/Layout';
import { KeyRound, ShieldCheck, ShieldOff, Eye, EyeOff, Loader2 } from 'lucide-react';

const Settings: React.FC = () => {
  // Password reset state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 2FA state
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [twoFAMsg, setTwoFAMsg] = useState('');
  const [twoFAError, setTwoFAError] = useState('');
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    check2FAStatus();
  }, []);

  const check2FAStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await api.get('/auth/2fa/status');
      setIs2FAEnabled(res.data.enabled);
    } catch {
      console.error('Failed to check 2FA status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.put('/auth/reset-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordMsg(res.data.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = typeof err.response?.data === 'string' ? err.response.data : (err.response?.data?.message || 'Failed to reset password');
      setPasswordError(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    setTwoFAError('');
    setTwoFAMsg('');
    setTwoFALoading(true);
    try {
      const res = await api.get('/auth/2fa/setup');
      setQrCode(res.data.qr_code_base64);
      setTotpSecret(res.data.secret);
      setShowSetupModal(true);
    } catch (err: any) {
      const msg = typeof err.response?.data === 'string' ? err.response.data : (err.response?.data?.message || 'Failed to setup 2FA');
      setTwoFAError(msg);
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFAError('');
    setTwoFALoading(true);
    try {
      const res = await api.post('/auth/2fa/verify', { totp_code: verifyCode });
      setTwoFAMsg(res.data.message);
      setIs2FAEnabled(true);
      setShowSetupModal(false);
      setVerifyCode('');
      setQrCode('');
    } catch (err: any) {
      const msg = typeof err.response?.data === 'string' ? err.response.data : (err.response?.data?.message || 'Invalid code');
      setTwoFAError(msg);
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFAError('');
    setTwoFALoading(true);
    try {
      const res = await api.post('/auth/2fa/disable', { password: disablePassword });
      setTwoFAMsg(res.data.message);
      setIs2FAEnabled(false);
      setShowDisableModal(false);
      setDisablePassword('');
    } catch (err: any) {
      const msg = typeof err.response?.data === 'string' ? err.response.data : (err.response?.data?.message || 'Failed to disable 2FA');
      setTwoFAError(msg);
    } finally {
      setTwoFALoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold">Admin Settings</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your account security and preferences.</p>
        </div>

        {/* Reset Password Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-600/20 p-2.5 rounded-lg">
              <KeyRound size={22} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Change Password</h3>
              <p className="text-gray-500 text-xs">Update your admin password</p>
            </div>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                required
                minLength={6}
              />
            </div>

            {passwordMsg && <p className="text-green-400 text-sm flex items-center gap-1.5"><ShieldCheck size={16} />{passwordMsg}</p>}
            {passwordError && <p className="text-red-400 text-sm">{passwordError}</p>}

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-bold text-white transition-colors flex items-center justify-center gap-2"
            >
              {passwordLoading && <Loader2 size={18} className="animate-spin" />}
              Update Password
            </button>
          </form>
        </div>

        {/* 2FA Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${is2FAEnabled ? 'bg-green-600/20' : 'bg-gray-700/50'}`}>
                {is2FAEnabled ? <ShieldCheck size={22} className="text-green-400" /> : <ShieldOff size={22} className="text-gray-500" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Two-Factor Authentication</h3>
                <p className="text-gray-500 text-xs">Add an extra layer of security to your account</p>
              </div>
            </div>
            {!statusLoading && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${is2FAEnabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                {is2FAEnabled ? 'Enabled' : 'Disabled'}
              </span>
            )}
          </div>

          {twoFAMsg && <p className="text-green-400 text-sm mb-4 flex items-center gap-1.5"><ShieldCheck size={16} />{twoFAMsg}</p>}
          {twoFAError && !showSetupModal && !showDisableModal && <p className="text-red-400 text-sm mb-4">{twoFAError}</p>}

          {statusLoading ? (
            <div className="flex justify-center py-4"><Loader2 size={24} className="animate-spin text-gray-500" /></div>
          ) : is2FAEnabled ? (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Your account is protected with two-factor authentication. You'll be asked for a verification code from your authenticator app when you sign in.
              </p>
              <button
                onClick={() => { setShowDisableModal(true); setTwoFAError(''); setDisablePassword(''); }}
                className="w-full py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-bold transition-colors border border-red-800/50"
              >
                Disable 2FA
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Enable two-factor authentication to add an extra security layer. You'll need an authenticator app like <strong className="text-white">Google Authenticator</strong> or <strong className="text-white">Authy</strong>.
              </p>
              <button
                onClick={handleSetup2FA}
                disabled={twoFALoading}
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg font-bold text-white transition-colors flex items-center justify-center gap-2"
              >
                {twoFALoading && <Loader2 size={18} className="animate-spin" />}
                Enable 2FA
              </button>
            </div>
          )}
        </div>

        {/* 2FA Setup Modal */}
        {showSetupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-bold mb-2 text-white">Setup Two-Factor Authentication</h3>
              <p className="text-gray-400 text-sm mb-4">Scan the QR code below with your authenticator app, then enter the 6-digit code to verify.</p>
              
              {qrCode && (
                <div className="flex justify-center mb-4 bg-white rounded-lg p-4">
                  <img src={`data:image/png;base64,${qrCode}`} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              )}

              <div className="mb-4 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <p className="text-xs text-gray-500 mb-1">Manual entry key:</p>
                <p className="text-sm font-mono text-blue-400 break-all select-all">{totpSecret}</p>
              </div>

              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Verification Code</label>
                  <input
                    type="text"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-white text-center text-2xl tracking-[0.5em] font-mono transition-all"
                    placeholder="000000"
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>

                {twoFAError && <p className="text-red-400 text-sm text-center">{twoFAError}</p>}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={twoFALoading || verifyCode.length !== 6}
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg font-bold text-white transition-colors flex items-center justify-center gap-2"
                  >
                    {twoFALoading && <Loader2 size={18} className="animate-spin" />}
                    Verify & Enable
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowSetupModal(false); setTwoFAError(''); }}
                    className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium border border-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Disable 2FA Modal */}
        {showDisableModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm shadow-2xl text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100/10 mb-4">
                <ShieldOff className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">Disable 2FA</h3>
              <p className="text-gray-400 text-sm mb-4">Enter your password to confirm disabling two-factor authentication.</p>
              
              <form onSubmit={handleDisable2FA} className="space-y-4">
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-white transition-all"
                  placeholder="Enter your password"
                  required
                  autoFocus
                />

                {twoFAError && <p className="text-red-400 text-sm">{twoFAError}</p>}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={twoFALoading}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg font-bold text-white transition-colors flex items-center justify-center gap-2"
                  >
                    {twoFALoading && <Loader2 size={18} className="animate-spin" />}
                    Disable
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowDisableModal(false); setTwoFAError(''); }}
                    className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium border border-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Settings;
