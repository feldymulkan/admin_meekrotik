import React, { useEffect, useState } from 'react';
import api from '../api';
import Layout from '../components/Layout';
import { Network, Plus, Trash2, RefreshCw, X, Shield, Globe, Cpu } from 'lucide-react';

interface PortRule {
  id: number;
  description: String;
  protocol: string;
  external_port: number;
  internal_ip: string;
  internal_port: number;
  created_at: string;
}

const PortManager: React.FC = () => {
  const [rules, setRules] = useState<PortRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form state
  const [description, setDescription] = useState('');
  const [protocol, setProtocol] = useState('tcp');
  const [externalPort, setExternalPort] = useState('');
  const [internalIp, setInternalIp] = useState('');
  const [internalPort, setInternalPort] = useState('');

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await api.get('/rules');
      setRules(response.data);
    } catch (err) {
      console.error('Failed to fetch rules', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/rules', {
        description,
        protocol,
        external_port: parseInt(externalPort),
        internal_ip: internalIp,
        internal_port: parseInt(internalPort),
      });
      setShowAddModal(false);
      resetForm();
      fetchRules();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add rule');
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    try {
      await api.delete(`/rules/${id}`);
      fetchRules();
    } catch (err) {
      console.error('Failed to delete rule', err);
    }
  };

  const resetForm = () => {
    setDescription('');
    setProtocol('tcp');
    setExternalPort('');
    setInternalIp('');
    setInternalPort('');
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Port Forwarding Manager
            </h1>
            <p className="text-gray-400 text-sm mt-1">Manage network address translation rules and traffic routing.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchRules}
              className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 transition-all border border-gray-700 active:scale-95"
              title="Refresh"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all font-bold shadow-lg shadow-blue-900/30 active:scale-95"
            >
              <Plus size={18} />
              <span>Create Rule</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                    <Globe size={24} />
                </div>
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Total Rules</p>
                    <p className="text-2xl font-bold">{rules.length}</p>
                </div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
                    <Shield size={24} />
                </div>
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
                    <p className="text-2xl font-bold text-green-500">Active</p>
                </div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                    <Cpu size={24} />
                </div>
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">System</p>
                    <p className="text-2xl font-bold">iptables</p>
                </div>
            </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-800/30 text-gray-400 uppercase text-[10px] font-bold tracking-widest border-b border-gray-800">
                <tr>
                  <th className="px-6 py-5">Description</th>
                  <th className="px-6 py-5">Protocol</th>
                  <th className="px-6 py-5">External Port</th>
                  <th className="px-6 py-5">Internal Target</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-800/40 transition-colors group">
                    <td className="px-6 py-4">
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-200">{rule.description}</span>
                            <span className="text-[10px] text-gray-500 font-mono">{new Date(rule.created_at).toLocaleString()}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        rule.protocol === 'tcp' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {rule.protocol}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-blue-400 font-bold">{rule.external_port}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-gray-300">{rule.internal_ip}</span>
                        <span className="text-gray-600">:</span>
                        <span className="font-mono text-green-400 font-bold">{rule.internal_port}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete Rule"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && rules.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-gray-800/50 rounded-full">
                            <Network size={48} className="text-gray-700" />
                        </div>
                        <p className="text-lg font-medium text-gray-400">No port forwarding rules found.</p>
                        <p className="text-sm max-w-xs mx-auto">Create a new rule to start managing your system traffic.</p>
                      </div>
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-300">
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Create Forwarding Rule</h3>
                <p className="text-gray-500 text-sm">Configure a new NAT entry for your system.</p>
              </div>

              <form onSubmit={handleAddRule} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3.5 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                    placeholder="e.g. Web Server"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Protocol</label>
                        <select
                            value={protocol}
                            onChange={(e) => setProtocol(e.target.value)}
                            className="w-full p-3.5 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all appearance-none cursor-pointer"
                        >
                            <option value="tcp">TCP</option>
                            <option value="udp">UDP</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">External Port</label>
                        <input
                            type="number"
                            value={externalPort}
                            onChange={(e) => setExternalPort(e.target.value)}
                            className="w-full p-3.5 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                            placeholder="80"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Internal IP</label>
                        <input
                            type="text"
                            value={internalIp}
                            onChange={(e) => setInternalIp(e.target.value)}
                            className="w-full p-3.5 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                            placeholder="192.168.1.10"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Internal Port</label>
                        <input
                            type="number"
                            value={internalPort}
                            onChange={(e) => setInternalPort(e.target.value)}
                            className="w-full p-3.5 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                            placeholder="80"
                            required
                        />
                    </div>
                </div>
                
                {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}
                
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white transition-all shadow-lg shadow-blue-900/40">
                    Apply Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-all font-bold border border-gray-700"
                  >
                    Discard
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

export default PortManager;
