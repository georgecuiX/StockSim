import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    symbol: '',
    type: 'buy',
    quantity: '',
    price: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [portfolioResponse, watchlistResponse] = await Promise.all([
        axios.get('/api/portfolio'),
        axios.get('/api/watchlist')
      ]);

      setPortfolio(portfolioResponse.data);
      setWatchlist(watchlistResponse.data.watchlist);
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const transactionData = {
        ...transactionForm,
        symbol: transactionForm.symbol.toUpperCase(),
        quantity: parseInt(transactionForm.quantity),
        price: parseFloat(transactionForm.price),
        date: `${transactionForm.date}T10:00:00`
      };

      await axios.post('/api/portfolio/transaction', transactionData);
      
      setTransactionForm({
        symbol: '',
        type: 'buy',
        quantity: '',
        price: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddTransaction(false);
      fetchDashboardData(); // Refresh data
      
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercent = (percent) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user.username}! 👋
          </h1>
          <p className="text-gray-400">
            Here's an overview of your investment portfolio
          </p>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-400 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Portfolio Value</p>
                <p className="text-2xl font-bold text-white">
                  {portfolio?.summary ? formatCurrency(portfolio.summary.total_value) : '$0.00'}
                </p>
              </div>
              <div className="text-3xl">💼</div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Gain/Loss</p>
                <p className={`text-2xl font-bold ${
                  portfolio?.summary?.total_gain_loss >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {portfolio?.summary ? formatCurrency(portfolio.summary.total_gain_loss) : '$0.00'}
                </p>
                <p className={`text-sm ${
                  portfolio?.summary?.total_gain_loss_percent >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {portfolio?.summary ? formatPercent(portfolio.summary.total_gain_loss_percent) : '0.00%'}
                </p>
              </div>
              <div className="text-3xl">
                {portfolio?.summary?.total_gain_loss >= 0 ? '📈' : '📉'}
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Positions</p>
                <p className="text-2xl font-bold text-white">
                  {portfolio?.summary?.positions_count || 0}
                </p>
              </div>
              <div className="text-3xl">🎯</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Portfolio Holdings */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="mr-2">💼</span>
              Portfolio Holdings
            </h2>
            
            {portfolio?.holdings?.length > 0 ? (
              <div className="space-y-4">
                {portfolio.holdings.slice(0, 5).map((holding) => (
                  <div key={holding.symbol} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-b-0">
                    <div>
                      <div className="font-semibold text-white">{holding.symbol}</div>
                      <div className="text-sm text-gray-400">
                        {holding.quantity} shares @ {formatCurrency(holding.avg_cost)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-white">
                        {formatCurrency(holding.current_value)}
                      </div>
                      <div className={`text-sm ${
                        holding.gain_loss >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatCurrency(holding.gain_loss)} ({formatPercent(holding.gain_loss_percent)})
                      </div>
                    </div>
                  </div>
                ))}
                {portfolio.holdings.length > 5 && (
                  <div className="text-center pt-4">
                    <button className="text-blue-400 hover:text-blue-300 text-sm">
                      View all {portfolio.holdings.length} holdings →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-gray-400">No portfolio holdings yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Start by adding some transactions in the Portfolio section
                </p>
              </div>
            )}
          </div>

          {/* Watchlist */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="mr-2">⭐</span>
              Watchlist
            </h2>
            
            {watchlist.length > 0 ? (
              <div className="space-y-4">
                {watchlist.slice(0, 5).map((item) => (
                  <div key={item.symbol} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-b-0">
                    <div>
                      <div className="font-semibold text-white">{item.symbol}</div>
                      <div className="text-sm text-gray-400">
                        {item.stock_data?.name || 'Loading...'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-white">
                        {item.stock_data?.last_price ? formatCurrency(item.stock_data.last_price) : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {item.stock_data?.sector || ''}
                      </div>
                    </div>
                  </div>
                ))}
                {watchlist.length > 5 && (
                  <div className="text-center pt-4">
                    <button className="text-blue-400 hover:text-blue-300 text-sm">
                      View all {watchlist.length} stocks →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">⭐</div>
                <p className="text-gray-400">No stocks in watchlist</p>
                <p className="text-sm text-gray-500 mt-2">
                  Search for stocks and add them to your watchlist
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/search')}
              className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors duration-200 flex flex-col items-center"
            >
              <span className="text-2xl mb-2">🔍</span>
              <span className="text-sm">Search Stocks</span>
            </button>
            <button 
              onClick={() => setShowAddTransaction(true)}
              className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors duration-200 flex flex-col items-center"
            >
              <span className="text-2xl mb-2">➕</span>
              <span className="text-sm">Add Transaction</span>
            </button>
            <button 
              onClick={() => navigate('/portfolio')}
              className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors duration-200 flex flex-col items-center"
            >
              <span className="text-2xl mb-2">📊</span>
              <span className="text-sm">View Portfolio</span>
            </button>
            <button 
              onClick={() => navigate('/watchlist')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white p-4 rounded-lg transition-colors duration-200 flex flex-col items-center"
            >
              <span className="text-2xl mb-2">⭐</span>
              <span className="text-sm">Manage Watchlist</span>
            </button>
          </div>
        </div>

        {/* Add Transaction Modal - Super Simple */}
        {showAddTransaction && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: '#1f2937',
              borderRadius: '8px',
              padding: '24px',
              width: '100%',
              maxWidth: '400px',
              border: '1px solid #374151'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Add Transaction</h3>
                <button
                  type="button"
                  onClick={() => setShowAddTransaction(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '5px'
                  }}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleTransactionSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                    Stock Symbol
                  </label>
                  <input
                    type="text"
                    value={transactionForm.symbol}
                    onChange={(e) => setTransactionForm({...transactionForm, symbol: e.target.value})}
                    placeholder="e.g., AAPL"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#374151',
                      border: '1px solid #4b5563',
                      borderRadius: '4px',
                      color: 'white',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                    Transaction Type
                  </label>
                  <select
                    value={transactionForm.type}
                    onChange={(e) => setTransactionForm({...transactionForm, type: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#374151',
                      border: '1px solid #4b5563',
                      borderRadius: '4px',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  >
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={transactionForm.quantity}
                      onChange={(e) => setTransactionForm({...transactionForm, quantity: e.target.value})}
                      placeholder="10"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#374151',
                        border: '1px solid #4b5563',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '14px'
                      }}
                      required
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                      Price per Share
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={transactionForm.price}
                      onChange={(e) => setTransactionForm({...transactionForm, price: e.target.value})}
                      placeholder="150.00"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#374151',
                        border: '1px solid #4b5563',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '14px'
                      }}
                      required
                      min="0.01"
                    />
                  </div>
                </div>
                
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={transactionForm.date}
                    onChange={(e) => setTransactionForm({...transactionForm, date: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#374151',
                      border: '1px solid #4b5563',
                      borderRadius: '4px',
                      color: 'white',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddTransaction(false)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      backgroundColor: '#4b5563',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      backgroundColor: submitting ? '#4b5563' : '#16a34a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {submitting ? 'Adding...' : 'Add Transaction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;