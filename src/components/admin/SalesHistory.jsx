// frontend/src/components/admin/SalesHistory.jsx
import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  Download,
  Eye,
  Receipt,
  TrendingUp,
  Package,
  DollarSign,
  AlertCircle,
  User,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Filter
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import Modal from '../common/Modal';
import { TableSkeleton } from '../common/Loader';
import api from '../../services/api';

const SalesHistory = () => {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';
  
  const getStartOfMonth = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
  };
  const getTodayDate = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: getStartOfMonth(),
    endDate: getTodayDate()
  });
  const [stats, setStats] = useState({
    totalSales: 0,
    averageTransaction: 0,
    totalTransactions: 0,
    topProduct: ''
  });
  const [error, setError] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    if (isAdmin) fetchAgents();
    fetchTransactions();
  }, [dateRange, filterStatus, selectedAgent]);

  const fetchAgents = async () => {
    try {
      const response = await api.get('/users/agents');
      if (response.data.success) setAgents(response.data.agents || []);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: 100
      };
      if (filterStatus !== 'all') params.status = filterStatus;
      if (!isAdmin) params.posAgentId = user?._id;
      else if (selectedAgent !== 'all') {
        const agent = agents.find(a => a.name === selectedAgent);
        if (agent) params.posAgentId = agent._id;
      }
      
      const response = await api.get('/sales', { params });
      if (response.data.success) {
        const salesData = response.data.transactions || [];
        setTransactions(salesData);
        const totalSales = salesData.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
        const totalTransactions = salesData.length;
        const productMap = new Map();
        salesData.forEach(transaction => {
          if (transaction.items?.length) {
            transaction.items.forEach(item => {
              const existing = productMap.get(item.productName) || { name: item.productName, quantity: 0 };
              existing.quantity += (item.quantityPacks || 0) * (item.packSize || 1) + (item.quantityUnits || 0);
              productMap.set(item.productName, existing);
            });
          }
        });
        const topProductEntry = Array.from(productMap.values()).sort((a,b)=>b.quantity - a.quantity)[0];
        setStats({
          totalSales,
          averageTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0,
          totalTransactions,
          topProduct: topProductEntry ? `${topProductEntry.name} (${topProductEntry.quantity} units)` : 'No data'
        });
      } else {
        setTransactions([]);
        toast.error(response.data.message || 'Failed to load transactions');
      }
    } catch (error) {
      console.error('Fetch transactions error:', error);
      setError(error.response?.data?.message || 'Failed to load transactions');
      toast.error('Failed to load transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => toast.success('Sales report exported successfully');
  const handlePrintReceipt = async (transactionId) => {
    try {
      const response = await api.get(`/sales/${transactionId}/receipt`);
      if (response.data && typeof response.data === 'string') {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(response.data);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    } catch (error) {
      console.error('Print receipt error:', error);
      toast.error('Failed to print receipt');
    }
  };
  const handleRefund = async (transactionId) => {
    if (!isAdmin) return toast.error('Only administrators can process refunds');
    if (window.confirm('Are you sure you want to refund this transaction?')) {
      try {
        const response = await api.post(`/sales/${transactionId}/refund`, { reason: 'Customer refund request' });
        if (response.data.success) {
          toast.success('Transaction refunded successfully');
          fetchTransactions();
        } else toast.error(response.data.message || 'Failed to process refund');
      } catch (error) {
        console.error('Refund error:', error);
        toast.error(error.response?.data?.message || 'Failed to process refund');
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleString('en-NG', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return 'Invalid date'; }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-secondary uppercase tracking-wide">{title}</p>
          <p className="text-2xl md:text-3xl font-extrabold text-primary mt-1">
            {typeof value === 'number' ? `₦${value.toLocaleString()}` : value}
          </p>
        </div>
        <div className={`p-3 rounded-xl bg-${color}-50`}>
          <Icon className={`h-5 w-5 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const NoDataMessage = () => (
    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
      <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500">No transactions found</p>
      <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or date range</p>
    </div>
  );

  const filteredTransactions = transactions.filter(t => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (t.transactionId || '').toLowerCase().includes(term) || (t.receiptNumber || '').toLowerCase().includes(term);
  });

  const activeFiltersCount = (filterStatus !== 'all' ? 1 : 0) + (searchTerm ? 1 : 0) + (selectedAgent !== 'all' ? 1 : 0);

  if (loading) return <div className="p-6"><TableSkeleton rows={10} columns={7} /></div>;
  if (error && transactions.length === 0) return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to Load Transactions</h3>
        <p className="text-red-600">{error}</p>
        <button onClick={fetchTransactions} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales History</h1>
            <p className="text-sm text-gray-600 mt-1">
              {isAdmin ? 'View and manage all sales transactions' : 'View your sales transactions'}
            </p>
          </div>
          <button onClick={handleExport} className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#2F6BFF] to-[#5A3FFF] text-white rounded-xl hover:shadow-md transition text-sm font-medium">
            <Download className="h-4 w-4 mr-2" /> Export Report
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard title="Total Sales" value={stats.totalSales} icon={DollarSign} color="green" />
          <StatCard title="Total Transactions" value={stats.totalTransactions} icon={ShoppingCart} color="blue" />
          <StatCard title="Average Transaction" value={stats.averageTransaction} icon={TrendingUp} color="purple" />
          <StatCard title="Top Product" value={stats.topProduct || 'N/A'} icon={Package} color="orange" />
        </div>

        {/* Filters card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by receipt or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]"
              />
            </div>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setSearchTerm(''); }} className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm">
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="refunded">Refunded</option>
            </select>
            <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})} className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm" />
            <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})} className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm" />
          </div>
          {isAdmin && agents.length > 0 && (
            <div className="mt-4">
              <select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)} className="w-full sm:w-64 px-4 py-2.5 border border-gray-300 rounded-xl text-sm">
                <option value="all">All Agents</option>
                {agents.map(agent => <option key={agent._id} value={agent.name}>{agent.name}</option>)}
              </select>
            </div>
          )}
          {!isAdmin && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl flex items-center gap-2 text-blue-700 text-sm">
              <User className="h-4 w-4" /> Showing sales for: {user?.name}
            </div>
          )}
          <button onClick={() => {
            setSearchTerm('');
            setFilterStatus('all');
            setDateRange({ startDate: getStartOfMonth(), endDate: getTodayDate() });
            if (isAdmin) setSelectedAgent('all');
          }} className="mt-4 text-sm text-[#2F6BFF] hover:text-[#5A3FFF] flex items-center gap-1">
            <Filter className="h-3 w-3" /> Clear Filters
          </button>
        </div>

        {/* Transactions - Card Grid (replaces table) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Transaction History</h2>
          {filteredTransactions.length === 0 ? (
            <NoDataMessage />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTransactions.map((tx) => (
                <div key={tx._id || tx.transactionId} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-secondary">Receipt</p>
                      <p className="font-mono text-sm font-semibold text-primary">{tx.receiptNumber || 'N/A'}</p>
                      <p className="text-xs text-secondary mt-0.5">{tx.transactionId}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                      tx.status === 'refunded' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {tx.status || 'pending'}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-secondary">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDate(tx.createdAt)}</span>
                  </div>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondary">Agent:</span>
                      <span className="font-medium">{tx.posAgentId?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Items:</span>
                      <span>{tx.items?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Payment:</span>
                      <span className="capitalize">{tx.paymentMethod || 'cash'}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-primary">₦{(tx.totalAmount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button onClick={() => { setSelectedTransaction(tx); setShowDetailsModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View Details">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => handlePrintReceipt(tx._id)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Print Receipt">
                      <Receipt className="h-4 w-4" />
                    </button>
                    {isAdmin && tx.status === 'completed' && (
                      <button onClick={() => handleRefund(tx._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="Refund">
                        <ShoppingCart className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transaction Details Modal (unchanged logic, only minor styling preserved) */}
        <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} title="Transaction Details" size="lg">
          {selectedTransaction && (
            <div className="space-y-5">
              <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-secondary">Receipt:</span> <span className="font-semibold">{selectedTransaction.receiptNumber || 'N/A'}</span></div>
                <div><span className="text-secondary">Transaction ID:</span> <span className="font-mono">{selectedTransaction.transactionId || 'N/A'}</span></div>
                <div><span className="text-secondary">Date & Time:</span> <span>{formatDate(selectedTransaction.createdAt)}</span></div>
                <div><span className="text-secondary">POS Agent:</span> <span>{selectedTransaction.posAgentId?.name || 'Unknown'}</span></div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Items Sold</h3>
                <div className="border rounded-xl overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Item</th><th className="px-4 py-2 text-right">Qty</th><th className="px-4 py-2 text-right">Price</th><th className="px-4 py-2 text-right">Total</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedTransaction.items?.map((item, idx) => (
                        <tr key={idx}><td className="px-4 py-2">{item.productName}</td><td className="px-4 py-2 text-right">{(item.quantityPacks||0)*(item.packSize||1)+(item.quantityUnits||0)} units</td><td className="px-4 py-2 text-right">₦{(item.unitPrice||0).toLocaleString()}</td><td className="px-4 py-2 text-right">₦{(item.totalPrice||0).toLocaleString()}</td></tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50"><tr><td colSpan="3" className="px-4 py-2 text-right font-semibold">Total:</td><td className="px-4 py-2 text-right font-bold">₦{(selectedTransaction.totalAmount||0).toLocaleString()}</td></tr></tfoot>
                  </table>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-secondary">Payment Method:</span> <span className="capitalize font-medium">{selectedTransaction.paymentMethod || 'cash'}</span></div>
                <div><span className="text-secondary">Status:</span> <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${selectedTransaction.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{selectedTransaction.status || 'pending'}</span></div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default SalesHistory;