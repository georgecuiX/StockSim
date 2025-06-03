import React, { useState } from 'react';
import axios from 'axios';

const StockSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockQuote, setStockQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addingToWatchlist, setAddingToWatchlist] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

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
                placeholder="Search for stocks (e.g., AAPL, Apple, Microsoft)"
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
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Search Results */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Search Results</h2>
            
            {searchResults.length > 0 ? (
              <div className="space-y-3">
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
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-gray-400">
                  {searchQuery ? 'No results found' : 'Search for stocks to get started'}
                </p>
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
                    <button
                      onClick={() => addToWatchlist(selectedStock.symbol)}
                      disabled={addingToWatchlist}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        addingToWatchlist
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-yellow-600 hover:bg-yellow-700'
                      } text-white`}
                    >
                      {addingToWatchlist ? 'Adding...' : '⭐ Add to Watchlist'}
                    </button>
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
                  Select a stock from search results to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockSearch;