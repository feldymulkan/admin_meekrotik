import React, { useEffect, useState } from 'react';
import api from '../api';
import Layout from '../components/Layout';
import { UserPlus, Trash2, ToggleLeft, ToggleRight, RefreshCw, Edit, X, Users } from 'lucide-react';

interface User {
  id: number;
  unique_id: string;
  username: string;
  is_active: boolean;
  theme?: string;
  created_date?: string;
  expired_date?: string;
}

const Dashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newCreatedDate, setNewCreatedDate] = useState(new Date().toISOString().split('T')[0]);
  const [newExpiredDate, setNewExpiredDate] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editCreatedDate, setEditCreatedDate] = useState('');
  const [editExpiredDate, setEditExpiredDate] = useState('');
  const [editError, setEditError] = useState('');

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users', { 
        username: newUsername, 
        password: newPassword,
        created_date: newCreatedDate,
        expired_date: newExpiredDate || null
      });
      setNewUsername('');
      setNewPassword('');
      setShowAddForm(false);
      fetchUsers();
    } catch (err: any) {
      const errorMsg = typeof err.response?.data === 'string' ? err.response.data : (err.response?.data?.error || 'Failed to add user');
      setError(errorMsg);
    }
  };

  const handleToggle = async (uniqueId: string) => {
    try {
      await api.patch(`/users/${uniqueId}/toggle`);
      setUsers(users.map(u => u.unique_id === uniqueId ? { ...u, is_active: !u.is_active } : u));
    } catch (err) {
      console.error('Failed to toggle user', err);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      const payload: any = { 
        username: editUsername,
        created_date: editCreatedDate,
        expired_date: editExpiredDate || null
      };
      if (editPassword) {
        payload.password = editPassword;
      }
      
      await api.put(`/users/${editingUser.unique_id}`, payload);
      setShowEditModal(false);
      setEditingUser(null);
      setEditPassword('');
      fetchUsers();
    } catch (err: any) {
      const errorMsg = typeof err.response?.data === 'string' ? err.response.data : (err.response?.data?.error || 'Failed to update user');
      setEditError(errorMsg);
    }
  };

  const handleDeleteClick = (uniqueId: string) => {
    setUserToDelete(uniqueId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/users/${userToDelete}`);
      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      console.error('Failed to delete user', err);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-gray-400 text-sm">Manage administrative access to the system.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchUsers}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium shadow-lg shadow-blue-900/20"
            >
              <UserPlus size={18} /> 
              <span>Add User</span>
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
              <button 
                onClick={() => setShowAddForm(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-xl font-bold mb-6 text-white">Create New User</h3>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Username</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                    placeholder="Enter username"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                    placeholder="Enter password"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Created Date</label>
                    <input
                      type="date"
                      value={newCreatedDate}
                      onChange={(e) => setNewCreatedDate(e.target.value)}
                      className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Expired Date</label>
                    <input
                      type="date"
                      value={newExpiredDate}
                      onChange={(e) => setNewExpiredDate(e.target.value)}
                      className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                    />
                  </div>
                </div>
                
                {error && <p className="text-red-400 text-sm">{error}</p>}
                
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-white transition-colors">
                    Create User
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium border border-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
              <button 
                onClick={() => setShowEditModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-xl font-bold mb-6 text-white">Edit User</h3>
              <form onSubmit={handleEditUser} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Username</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                    placeholder="Enter username"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">New Password (Optional)</label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                    placeholder="Leave blank to keep current"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Created Date</label>
                    <input
                      type="date"
                      value={editCreatedDate}
                      onChange={(e) => setEditCreatedDate(e.target.value)}
                      className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Expired Date</label>
                    <input
                      type="date"
                      value={editExpiredDate}
                      onChange={(e) => setEditExpiredDate(e.target.value)}
                      className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                    />
                  </div>
                </div>
                
                {editError && <p className="text-red-400 text-sm">{editError}</p>}
                
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-white transition-colors">
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium border border-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-800/50 text-gray-400 uppercase text-[10px] font-bold tracking-widest">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4">Expired Date</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map((user) => (
                  <tr key={user.unique_id} className="hover:bg-gray-800/30 transition-colors group">
                    <td className="px-6 py-4 text-gray-500 text-sm">#{user.id}</td>
                    <td className="px-6 py-4 font-medium">{user.username}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={`text-xs font-medium ${user.is_active ? 'text-green-400' : 'text-red-400'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {user.created_date || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {user.expired_date ? (
                        <span className={(user.expired_date && new Date(user.expired_date).getTime() < new Date().getTime()) ? 'text-red-400 font-bold' : ''}>
                          {user.expired_date}
                        </span>
                      ) : (
                        <span className="text-gray-600 italic">No Expiry</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setEditUsername(user.username);
                            setEditPassword('');
                            setEditCreatedDate(user.created_date || '');
                            setEditExpiredDate(user.expired_date || '');
                            setEditError('');
                            setShowEditModal(true);
                          }}
                          title="Edit User"
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleToggle(user.unique_id)}
                          title="Toggle Status"
                          className={`p-2 rounded-lg transition-all ${user.is_active ? 'text-yellow-500 hover:bg-yellow-500/10' : 'text-green-500 hover:bg-green-500/10'}`}
                        >
                          {user.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user.unique_id)}
                          title="Delete User"
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Users size={48} className="text-gray-800" />
                        <p className="italic">No users found in the system.</p>
                      </div>
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm shadow-2xl relative text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100/10 mb-4">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">Delete User</h3>
              <p className="text-gray-400 text-sm mb-6">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-white transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium border border-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
