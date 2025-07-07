import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    symbol: '',
    type: 'buy',
    quantity: '',
    price: '',
    date: new Date().toISOString().split('T')[0] // Today's date
  });
  const [sellForm, setSellForm] = useState({
    symbol: '',
    maxQuantity: 0,
    currentPrice: 0,
    quantity: '',
    price: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);
  const [clearingTransactions, setClearingTransactions] = useState(false);
  const [clearingHoldings, setClearingHoldings] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyForm, setBuyForm] = useState({
    symbol: '',
    currentPrice: 0,
    quantity: '',
    price: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const response = await axios.get('/api/portfolio');
      setPortfolio(response.data);
      setError('');
    } catch (error) {
      setError('Failed to load portfolio');
      console.error('Portfolio error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSellStock = (holding) => {
    setSellForm({
      symbol: holding.symbol,
      maxQuantity: holding.quantity,
      currentPrice: holding.current_price,
      quantity: '',
      price: holding.current_price.toFixed(2),
      date: new Date().toISOString().split('T')[0]
    });
    setShowSellModal(true);
  };

  const handleBuyMoreStock = (holding) => {
    setBuyForm({
      symbol: holding.symbol,
      currentPrice: holding.current_price,
      quantity: '',
      price: holding.current_price.toFixed(2),
      date: new Date().toISOString().split('T')[0]
    });
    setShowBuyModal(true);
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
      
      // Reset form and refresh portfolio
      setTransactionForm({
        symbol: '',
        type: 'buy',
        quantity: '',
        price: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddTransaction(false);
      fetchPortfolio();
      
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to add transaction';
      setError(errorMsg);
      // Don't close the modal if there's an error so user can fix it
    } finally {
      setSubmitting(false);
    }
  };

  const handleSellSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const transactionData = {
        symbol: sellForm.symbol.toUpperCase(),
        type: 'sell',
        quantity: parseInt(sellForm.quantity),
        price: parseFloat(sellForm.price),
        date: `${sellForm.date}T10:00:00`
      };

      await axios.post('/api/portfolio/transaction', transactionData);
      
      // Reset form and refresh portfolio
      setSellForm({
        symbol: '',
        maxQuantity: 0,
        currentPrice: 0,
        quantity: '',
        price: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowSellModal(false);
      fetchPortfolio();
      
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to sell stock');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearTransactions = async () => {
    if (!window.confirm('Are you sure you want to clear all transaction history? This will reset your entire portfolio and cannot be undone.')) {
      return;
    }

    setClearingTransactions(true);
    try {
      await axios.delete('/api/portfolio/clear-all');
      fetchPortfolio();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to clear transaction history');
    } finally {
      setClearingTransactions(false);
    }
  };

  const handleClearHoldings = async () => {
    if (!window.confirm('Are you sure you want to clear ALL holdings and transactions? This will completely reset your portfolio and cannot be undone.')) {
      return;
    }

    setClearingHoldings(true);
    try {
      await axios.delete('/api/portfolio/clear-all');
      fetchPortfolio();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to clear portfolio');
    } finally {
      setClearingHoldings(false);
    }
  };

  const handleBuySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const transactionData = {
        symbol: buyForm.symbol.toUpperCase(),
        type: 'buy',
        quantity: parseInt(buyForm.quantity),
        price: parseFloat(buyForm.price),
        date: `${buyForm.date}T10:00:00`
      };

      await axios.post('/api/portfolio/transaction', transactionData);
      
      // Reset form and refresh portfolio
      setBuyForm({
        symbol: '',
        currentPrice: 0,
        quantity: '',
        price: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowBuyModal(false);
      fetchPortfolio();
      
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to buy stock';
      setError(errorMsg);
      // Don't close the modal if there's an error so user can fix it
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatPercent = (percent) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Portfolio Management</h1>
          <button
            onClick={() => setShowAddTransaction(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            ➕ Add Transaction
          </button>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Portfolio Summary */}
        {portfolio && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-gray-400 text-sm">Total Value</div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(portfolio.summary.total_value)}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-gray-400 text-sm">Total Cost</div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(portfolio.summary.total_cost)}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-gray-400 text-sm">Total Gain/Loss</div>
              <div className={`text-2xl font-bold ${
                portfolio.summary.total_gain_loss >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatCurrency(portfolio.summary.total_gain_loss)}
              </div>
              <div className={`text-sm ${
                portfolio.summary.total_gain_loss >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatPercent(portfolio.summary.total_gain_loss_percent)}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-gray-400 text-sm">Positions</div>
              <div className="text-2xl font-bold text-white">
                {portfolio.summary.positions_count}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Holdings */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Current Holdings</h2>
            </div>
            
            {portfolio?.holdings?.length > 0 ? (
              <div className="space-y-4">
                {portfolio.holdings.map((holding) => (
                  <div key={holding.symbol} className="border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-semibold text-white text-lg">{holding.symbol}</div>
                        <div className="text-gray-400 text-sm">
                          {holding.quantity} shares @ {formatCurrency(holding.avg_cost)} avg
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
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
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleBuyMoreStock(holding)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors duration-200"
                          >
                            📈 Buy
                          </button>
                          <button
                            onClick={() => handleSellStock(holding)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors duration-200"
                          >
                            📉 Sell
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Current Price</div>
                        <div className="text-white">{formatCurrency(holding.current_price)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Total Cost</div>
                        <div className="text-white">{formatCurrency(holding.total_cost)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Market Value</div>
                        <div className="text-white">{formatCurrency(holding.current_value)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-gray-400">No holdings yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Add your first transaction to get started
                </p>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
              {portfolio?.recent_transactions?.length > 0 && (
                <button
                  onClick={handleClearTransactions}
                  disabled={clearingTransactions}
                  className={`px-3 py-1 text-sm rounded transition-colors duration-200 ${
                    clearingTransactions
                      ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {clearingTransactions ? 'Clearing...' : '📜 Clear History'}
                </button>
              )}
            </div>
            
            {portfolio?.recent_transactions?.length > 0 ? (
              <div className="space-y-3">
                {portfolio.recent_transactions.map((transaction) => (
                  <div key={transaction.id} className="border border-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{transaction.symbol}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            transaction.type === 'buy' 
                              ? 'bg-green-900 text-green-400' 
                              : 'bg-red-900 text-red-400'
                          }`}>
                            {transaction.type.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-gray-400 text-sm">
                          {transaction.quantity} shares @ {formatCurrency(transaction.price)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">
                          {formatCurrency(transaction.quantity * transaction.price)}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {formatDate(transaction.date)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-gray-400">No transactions yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Transaction Modal */}
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
                    autoFocus
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

        {/* Buy More Stock Modal */}
        {showBuyModal && (
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
                <h3 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                  Buy More {buyForm.symbol}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowBuyModal(false)}
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

              {/* Current Price Info */}
              <div style={{ 
                marginBottom: '20px', 
                padding: '12px', 
                backgroundColor: '#374151', 
                borderRadius: '6px',
                border: '1px solid #4b5563'
              }}>
                <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>Current Price:</div>
                <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>
                  {formatCurrency(buyForm.currentPrice)}
                </div>
              </div>
              
              <form onSubmit={handleBuySubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                    Stock Symbol
                  </label>
                  <input
                    type="text"
                    value={buyForm.symbol}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#4b5563',
                      border: '1px solid #6b7280',
                      borderRadius: '4px',
                      color: '#e5e7eb',
                      fontSize: '14px'
                    }}
                    readOnly
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                      Quantity to Buy
                    </label>
                    <input
                      type="number"
                      value={buyForm.quantity}
                      onChange={(e) => setBuyForm({...buyForm, quantity: e.target.value})}
                      placeholder="e.g., 5"
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
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                      Price per Share
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={buyForm.price}
                      onChange={(e) => setBuyForm({...buyForm, price: e.target.value})}
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
                    value={buyForm.date}
                    onChange={(e) => setBuyForm({...buyForm, date: e.target.value})}
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

                {/* Purchase Preview */}
                {buyForm.quantity && buyForm.price && (
                  <div style={{ 
                    marginBottom: '20px', 
                    padding: '12px', 
                    backgroundColor: '#16a34a', 
                    borderRadius: '6px',
                    border: '1px solid #22c55e'
                  }}>
                    <div style={{ color: '#bbf7d0', fontSize: '12px', marginBottom: '4px' }}>Purchase Total:</div>
                    <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                      {formatCurrency(parseFloat(buyForm.quantity || 0) * parseFloat(buyForm.price || 0))}
                    </div>
                    <div style={{ color: '#bbf7d0', fontSize: '12px' }}>
                      {buyForm.quantity} shares × {formatCurrency(parseFloat(buyForm.price || 0))}
                    </div>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowBuyModal(false)}
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
                    disabled={submitting || !buyForm.quantity}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      backgroundColor: submitting || !buyForm.quantity ? '#4b5563' : '#16a34a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: submitting || !buyForm.quantity ? 'not-allowed' : 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {submitting ? 'Buying...' : `Buy ${buyForm.quantity || '0'} Shares`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sell Stock Modal */}
        {showSellModal && (
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
                <h3 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                  Sell {sellForm.symbol}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSellModal(false)}
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

              {/* Holding Info */}
              <div style={{ 
                marginBottom: '20px', 
                padding: '12px', 
                backgroundColor: '#374151', 
                borderRadius: '6px',
                border: '1px solid #4b5563'
              }}>
                <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>You Own:</div>
                <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>
                  {sellForm.maxQuantity} shares
                </div>
                <div style={{ color: '#6b7280', fontSize: '12px' }}>
                  Current Price: {formatCurrency(sellForm.currentPrice)}
                </div>
              </div>
              
              <form onSubmit={handleSellSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                    Stock Symbol
                  </label>
                  <input
                    type="text"
                    value={sellForm.symbol}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#4b5563',
                      border: '1px solid #6b7280',
                      borderRadius: '4px',
                      color: '#e5e7eb',
                      fontSize: '14px'
                    }}
                    readOnly
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                      Quantity to Sell
                    </label>
                    <input
                      type="number"
                      value={sellForm.quantity}
                      onChange={(e) => setSellForm({...sellForm, quantity: e.target.value})}
                      placeholder={`Max: ${sellForm.maxQuantity}`}
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
                      max={sellForm.maxQuantity}
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                      Price per Share
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={sellForm.price}
                      onChange={(e) => setSellForm({...sellForm, price: e.target.value})}
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
                    value={sellForm.date}
                    onChange={(e) => setSellForm({...sellForm, date: e.target.value})}
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

                {/* Sale Preview */}
                {sellForm.quantity && sellForm.price && (
                  <div style={{ 
                    marginBottom: '20px', 
                    padding: '12px', 
                    backgroundColor: '#dc2626', 
                    borderRadius: '6px',
                    border: '1px solid #ef4444'
                  }}>
                    <div style={{ color: '#fca5a5', fontSize: '12px', marginBottom: '4px' }}>Sale Total:</div>
                    <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                      {formatCurrency(parseFloat(sellForm.quantity || 0) * parseFloat(sellForm.price || 0))}
                    </div>
                    <div style={{ color: '#fca5a5', fontSize: '12px' }}>
                      {sellForm.quantity} shares × {formatCurrency(parseFloat(sellForm.price || 0))}
                    </div>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowSellModal(false)}
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
                    disabled={submitting || !sellForm.quantity || sellForm.quantity > sellForm.maxQuantity}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      backgroundColor: submitting || !sellForm.quantity || sellForm.quantity > sellForm.maxQuantity ? '#4b5563' : '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: submitting || !sellForm.quantity || sellForm.quantity > sellForm.maxQuantity ? 'not-allowed' : 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {submitting ? 'Selling...' : `Sell ${sellForm.quantity || '0'} Shares`}
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

export default Portfolio;