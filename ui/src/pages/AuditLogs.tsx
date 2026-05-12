import React, { useEffect, useState } from 'react';
import api from '../api';
import Layout from '../components/Layout';
import { History, Search, Filter, RefreshCw, User, Clock } from 'lucide-react';

interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/audit-logs');
      setLogs(response.data);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Audit Logs
            </h1>
            <p className="text-gray-400 text-sm mt-1">Track system changes and administrative activities.</p>
          </div>
          <button
            onClick={fetchLogs}
            className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 transition-all border border-gray-700 active:scale-95"
            title="Refresh"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search logs by action or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-2xl transition-all font-bold border border-gray-700">
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-800/30 text-gray-400 uppercase text-[10px] font-bold tracking-widest border-b border-gray-800">
                <tr>
                  <th className="px-6 py-5">Event</th>
                  <th className="px-6 py-5">User</th>
                  <th className="px-6 py-5">Action</th>
                  <th className="px-6 py-5">Details</th>
                  <th className="px-6 py-5">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-800/40 transition-colors group">
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                <Clock size={16} />
                            </div>
                            <span className="text-xs text-gray-400 font-mono">
                                {new Date(log.created_at).toLocaleString()}
                            </span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <User size={14} className="text-gray-500" />
                            <span className="text-sm font-medium">#{log.user_id}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                        log.action === 'ADD_RULE' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                        log.action === 'DELETE_RULE' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                        'bg-gray-700/50 text-gray-300 border border-gray-600/30'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                        <p className="text-sm text-gray-300 truncate" title={log.details}>
                            {log.details}
                        </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-gray-500">{log.ip_address}</span>
                    </td>
                  </tr>
                ))}
                {!loading && filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-gray-800/50 rounded-full">
                            <History size={48} className="text-gray-700" />
                        </div>
                        <p className="text-lg font-medium text-gray-400">No logs found.</p>
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
      </div>
    </Layout>
  );
};

export default AuditLogs;
