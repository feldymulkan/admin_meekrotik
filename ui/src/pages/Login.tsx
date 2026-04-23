import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { LogIn, ShieldCheck, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: Record<string, string> = { username, password };
      if (requires2FA) {
        payload.totp_code = totpCode;
      }

      const response = await api.post('/auth/login', payload);

      if (response.data.requires_2fa && !response.data.token) {
        setRequires2FA(true);
        setLoading(false);
        return;
      }

      if (response.data.token) {
        login(response.data.token);
        navigate('/');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Login failed';
      setError(msg);
      // If the error says 2FA is required, switch to 2FA mode
      if (err.response?.data?.requires_2fa) {
        setRequires2FA(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setRequires2FA(false);
    setTotpCode('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white w-full">
      <div className="max-w-md w-full p-8 bg-gray-900 rounded-xl shadow-2xl border border-gray-800">
        <div className="flex justify-center mb-6">
          <div className={`p-3 rounded-full ${requires2FA ? 'bg-green-600' : 'bg-blue-600'}`}>
            {requires2FA ? <ShieldCheck size={32} /> : <LogIn size={32} />}
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-2">
          {requires2FA ? 'Two-Factor Authentication' : 'Admin Login'}
        </h2>
        <p className="text-gray-500 text-sm text-center mb-8">
          {requires2FA 
            ? 'Enter the 6-digit code from your authenticator app' 
            : 'Sign in to your Mikhmon Admin account'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!requires2FA ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  required
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Authentication Code</label>
              <input
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none text-center text-3xl tracking-[0.5em] font-mono transition-all"
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
              />
            </div>
          )}

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || (requires2FA && totpCode.length !== 6)}
            className={`w-full py-3 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 ${
              requires2FA 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading && <Loader2 size={20} className="animate-spin" />}
            {requires2FA ? 'Verify' : 'Sign In'}
          </button>

          {requires2FA && (
            <button
              type="button"
              onClick={handleBack}
              className="w-full py-2.5 text-gray-400 hover:text-white transition-colors text-sm"
            >
              ← Back to login
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
