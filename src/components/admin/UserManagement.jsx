// frontend/src/components/admin/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Key, 
  Search,
  CheckCircle,
  XCircle,
  UserPlus,
  Mail,
  Phone,
  Shield,
  Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { ConfirmModal, FormModal } from '../common/Modal';
import Loader from '../common/Loader';
import api from '../../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetPinConfirm, setShowResetPinConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'pos_agent',
    pinCode: '',
    password: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      if (response.data.success) {
        setUsers(response.data.users || []);
      } else {
        toast.error('Failed to fetch users');
        setUsers([]);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill all required fields');
      return;
    }
    if (formData.role === 'pos_agent' && (!formData.pinCode || formData.pinCode.length !== 4)) {
      toast.error('POS agent requires a 4-digit PIN');
      return;
    }
    try {
      const response = await api.post('/users', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        pinCode: formData.pinCode,
        password: formData.password
      });
      if (response.data.success) {
        toast.success('User added successfully');
        fetchUsers();
        setShowAddModal(false);
        resetForm();
      } else {
        toast.error(response.data.message || 'Failed to add user');
      }
    } catch (error) {
      console.error('Add user error:', error);
      toast.error(error.response?.data?.message || 'Failed to add user');
    }
  };

  const handleEditUser = async () => {
    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      };
      if (formData.password) updateData.password = formData.password;
      const response = await api.put(`/users/${selectedUser._id}`, updateData);
      if (response.data.success) {
        toast.success('User updated successfully');
        fetchUsers();
        setShowEditModal(false);
        resetForm();
      } else {
        toast.error(response.data.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Update user error:', error);
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    try {
      const response = await api.delete(`/users/${selectedUser._id}`);
      if (response.data.success) {
        toast.success('User deleted successfully');
        fetchUsers();
        setShowDeleteConfirm(false);
      } else {
        toast.error(response.data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleResetPin = async () => {
    try {
      const response = await api.post(`/users/${selectedUser._id}/reset-pin`);
      if (response.data.success) {
        toast.success(`PIN reset for ${selectedUser.name}. New PIN: ${response.data.newPin || '1234'}`);
        fetchUsers();
        setShowResetPinConfirm(false);
      } else {
        toast.error(response.data.message || 'Failed to reset PIN');
      }
    } catch (error) {
      console.error('Reset PIN error:', error);
      toast.error(error.response?.data?.message || 'Failed to reset PIN');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const response = await api.put(`/users/${user._id}/toggle-status`);
      if (response.data.success) {
        toast.success(`${user.name} ${response.data.isActive ? 'activated' : 'deactivated'} successfully`);
        fetchUsers();
      } else {
        toast.error(response.data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'pos_agent',
      pinCode: '',
      password: ''
    });
    setSelectedUser(null);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      pinCode: '',
      password: ''
    });
    setShowEditModal(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                         (user.email || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role) => {
    return role === 'admin' 
      ? <span className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 px-2.5 py-1 rounded-full text-xs font-semibold">Admin</span>
      : <span className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-2.5 py-1 rounded-full text-xs font-semibold">POS Agent</span>;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader /></div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-600 mt-1">Manage POS agents and administrators</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#2F6BFF] to-[#5A3FFF] text-white rounded-xl hover:shadow-md transition text-sm font-medium"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add New User
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6BFF] bg-white"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="pos_agent">POS Agent</option>
            </select>
          </div>
        </div>

        {/* Users Grid (Cards instead of table) */}
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredUsers.map((user) => (
              <div key={user._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-[#2F6BFF] to-[#5A3FFF] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {(user.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                        <p className="text-xs text-gray-500">ID: {user._id?.slice(-6) || 'N/A'}</p>
                      </div>
                    </div>
                    {getRoleBadge(user.role)}
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      <span>{user.phone || 'No phone'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Shield className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          Last login: {user.lastLogin ? format(new Date(user.lastLogin), 'dd MMM yyyy') : 'Never'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                        } transition`}
                      >
                        {user.isActive ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        {user.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-end gap-2 border-t pt-4">
                    {user.role === 'pos_agent' && (
                      <button
                        onClick={() => { setSelectedUser(user); setShowResetPinConfirm(true); }}
                        className="p-1.5 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-lg transition"
                        title="Reset PIN"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                      title="Edit User"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => { setSelectedUser(user); setShowDeleteConfirm(true); }}
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modals (styles updated to fintech look) */}
        <FormModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add New User"
          onSubmit={handleAddUser}
          submitText="Add User"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#2F6BFF]" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select name="role" value={formData.role} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm">
                <option value="pos_agent">POS Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {formData.role === 'pos_agent' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">4-Digit PIN *</label>
                <input type="password" name="pinCode" maxLength="4" value={formData.pinCode} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm" required />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm" required />
            </div>
          </div>
        </FormModal>

        <FormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit User"
          onSubmit={handleEditUser}
          submitText="Update User"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password (leave blank to keep current)</label>
              <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm" />
            </div>
          </div>
        </FormModal>

        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteUser}
          title="Delete User"
          message={`Are you sure you want to delete ${selectedUser?.name}? This action cannot be undone.`}
          confirmText="Delete"
        />

        <ConfirmModal
          isOpen={showResetPinConfirm}
          onClose={() => setShowResetPinConfirm(false)}
          onConfirm={handleResetPin}
          title="Reset PIN"
          message={`Reset PIN for ${selectedUser?.name}?`}
          confirmText="Reset PIN"
        />
      </div>
    </div>
  );
};

export default UserManagement;