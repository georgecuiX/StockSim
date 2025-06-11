import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StockSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockQuote, setStockQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addingToWatchlist, setAddingToWatchlist] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    symbol: '',
    type: 'buy',
    quantity: '',
    price: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Top trending stocks with search keywords
  const trendingStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'Equity', region: 'United States', keywords: ['apple', 'iphone', 'mac', 'ios'] },
    { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Equity', region: 'United States', keywords: ['microsoft', 'windows', 'xbox', 'office', 'azure'] },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Equity', region: 'United States', keywords: ['google', 'alphabet', 'youtube', 'android', 'search'] },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'Equity', region: 'United States', keywords: ['amazon', 'aws', 'prime', 'ecommerce', 'retail'] },
    { symbol: 'TSLA', name: 'Tesla Inc.', type: 'Equity', region: 'United States', keywords: ['tesla', 'electric', 'ev', 'musk', 'automotive'] },
    { symbol: 'META', name: 'Meta Platforms Inc.', type: 'Equity', region: 'United States', keywords: ['meta', 'facebook', 'instagram', 'whatsapp', 'social'] },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'Equity', region: 'United States', keywords: ['nvidia', 'gpu', 'graphics', 'ai', 'gaming'] },
    { symbol: 'NFLX', name: 'Netflix Inc.', type: 'Equity', region: 'United States', keywords: ['netflix', 'streaming', 'movies', 'tv', 'entertainment'] },
    { symbol: 'DIS', name: 'Walt Disney Co (The)', type: 'Equity', region: 'United States', keywords: ['disney', 'walt', 'movies', 'parks', 'entertainment', 'pixar'] },
    { symbol: 'PYPL', name: 'PayPal Holdings Inc.', type: 'Equity', region: 'United States', keywords: ['paypal', 'payment', 'fintech', 'digital', 'venmo'] }
  ];

  // Enhanced filter function for trending stocks
  const filteredTrendingStocks = trendingStocks.filter(stock => {
    const query = searchQuery.toLowerCase();
    return (
      stock.symbol.toLowerCase().includes(query) ||
      stock.name.toLowerCase().includes(query) ||
      stock.keywords.some(keyword => keyword.toLowerCase().includes(query))
    );
  });

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError('');
    setSearchResults([]);
    setSelectedStock(null);
    setStockQuote(null);

    try {
      const response = await axios.get(`/api/stocks/search/${searchQuery}`);
      setSearchResults(response.data.results);
      
      if (response.data.results.length === 0) {
        setError('No stocks found matching your search.');
      }
    } catch (error) {
      setError('Search failed. Please try again.');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStockSelect = async (stock) => {
    setSelectedStock(stock);
    setStockQuote(null);
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`/api/stocks/${stock.symbol}/quote`);
      setStockQuote(response.data.quote);
    } catch (error) {
      setError('Failed to load stock quote.');
      console.error('Quote error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (symbol) => {
    setAddingToWatchlist(true);
    try {
      await axios.post('/api/watchlist/add', { symbol });
      alert(`${symbol} added to watchlist!`);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to add to watchlist';
      alert(errorMsg);
    } finally {
      setAddingToWatchlist(false);
    }
  };

  const handleAddTransaction = () => {
    if (selectedStock && stockQuote) {
      setTransactionForm({
        symbol: selectedStock.symbol,
        type: 'buy',
        quantity: '',
        price: stockQuote.price.toFixed(2),
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddTransaction(true);
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
      alert(`Transaction added successfully! ${transactionData.type.toUpperCase()} ${transactionData.quantity} shares of ${transactionData.symbol}`);
      
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add transaction');
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
    const num = parseFloat(percent);
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Stock Search</h1>
        
        {/* Search Form */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search stocks (e.g., AAPL, Apple, Disney, Tesla) or browse trending stocks below"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
                loading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {loading ? 'Searching...' : 'Search API'}
            </button>
          </form>
          
          {searchQuery && (
            <div className="mt-4 text-sm text-gray-400">
              {searchQuery.trim() 
                ? `Filtering trending stocks for "${searchQuery}" • Use "Search API" button for broader search`
                : 'Showing all trending stocks'
              }
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Results */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                {searchQuery.trim() && searchResults.length === 0 && !loading 
                  ? 'API Search Results'
                  : searchQuery.trim() 
                    ? `Trending Stocks (${filteredTrendingStocks.length})`
                    : 'Top 10 Trending Stocks'
                }
              </h2>
              {searchQuery.trim() && searchResults.length === 0 && !loading && (
                <span className="text-xs text-gray-500">Try "Search API" for more results</span>
              )}
            </div>
            
            {/* Show API search results if available */}
            {searchResults.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm text-blue-400 mb-3">
                  📡 API Results for "{searchQuery}":
                </div>
                {searchResults.map((stock, index) => (
                  <div
                    key={index}
                    onClick={() => handleStockSelect(stock)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors duration-200 ${
                      selectedStock?.symbol === stock.symbol
                        ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                        : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white text-lg">
                          {stock.symbol}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {stock.name}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {stock.type} • {stock.region}
                        </div>
                      </div>
                      <div className="text-blue-400">
                        →
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Show trending stocks (filtered if search query exists) */
              <div>
                {filteredTrendingStocks.length > 0 ? (
                  <div className="space-y-3">
                    {searchQuery.trim() && (
                      <div className="text-sm text-yellow-400 mb-3">
                        📈 Filtered trending stocks:
                      </div>
                    )}
                    {filteredTrendingStocks.map((stock, index) => (
                      <div
                        key={index}
                        onClick={() => handleStockSelect(stock)}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors duration-200 ${
                          selectedStock?.symbol === stock.symbol
                            ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                            : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-white text-lg">
                              {stock.symbol}
                            </div>
                            <div className="text-gray-400 text-sm">
                              {stock.name}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {stock.type} • {stock.region}
                            </div>
                          </div>
                          <div className="text-blue-400">
                            →
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery.trim() ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🔍</div>
                    <p className="text-gray-400">
                      No trending stocks match "{searchQuery}"
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Try using the "Search API" button for broader results
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🔍</div>
                    <p className="text-gray-400">
                      Browse trending stocks or search for specific companies
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stock Details */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Stock Details</h2>
            
            {selectedStock && stockQuote ? (
              <div className="space-y-4">
                {/* Stock Header */}
                <div className="border-b border-gray-700 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-bold text-white">
                      {selectedStock.symbol}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addToWatchlist(selectedStock.symbol)}
                        disabled={addingToWatchlist}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                          addingToWatchlist
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-yellow-600 hover:bg-yellow-700'
                        } text-white`}
                      >
                        {addingToWatchlist ? 'Adding...' : '⭐ Watchlist'}
                      </button>
                      <button
                        onClick={handleAddTransaction}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        💰 Add Transaction
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-400">{selectedStock.name}</p>
                </div>

                {/* Price Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Current Price</div>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(stockQuote.price)}
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Daily Change</div>
                    <div className={`text-xl font-bold ${
                      stockQuote.change >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(stockQuote.change)}
                    </div>
                    <div className={`text-sm ${
                      stockQuote.change >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatPercent(stockQuote.change_percent)}
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-700">
                    <span className="text-gray-400">Previous Close</span>
                    <span className="text-white">{formatCurrency(stockQuote.previous_close)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-700">
                    <span className="text-gray-400">Volume</span>
                    <span className="text-white">{stockQuote.volume.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">Last Trading Day</span>
                    <span className="text-white">{stockQuote.latest_trading_day}</span>
                  </div>
                </div>
              </div>
            ) : selectedStock && loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-400">Loading stock details...</span>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-gray-400">
                  Select a stock to view live market data
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Click on any stock from the trending list or search results
                </p>
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
                <h3 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                  Add Transaction - {selectedStock?.symbol}
                </h3>
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
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#4b5563',
                      border: '1px solid #6b7280',
                      borderRadius: '4px',
                      color: '#e5e7eb',
                      fontSize: '14px'
                    }}
                    required
                    readOnly
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
                      value={transactionForm.price}
                      onChange={(e) => setTransactionForm({...transactionForm, price: e.target.value})}
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

                {/* Transaction Preview */}
                {transactionForm.quantity && transactionForm.price && (
                  <div style={{ 
                    marginBottom: '20px', 
                    padding: '12px', 
                    backgroundColor: '#374151', 
                    borderRadius: '6px',
                    border: '1px solid #4b5563'
                  }}>
                    <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>Transaction Total:</div>
                    <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                      {formatCurrency(parseFloat(transactionForm.quantity || 0) * parseFloat(transactionForm.price || 0))}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '12px' }}>
                      {transactionForm.quantity} shares × {formatCurrency(parseFloat(transactionForm.price || 0))}
                    </div>
                  </div>
                )}
                
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
                    {submitting ? 'Adding...' : `${transactionForm.type === 'buy' ? 'Buy' : 'Sell'} ${transactionForm.symbol}`}
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

export default StockSearch;