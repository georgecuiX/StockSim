import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      const response = await axios.get('/api/watchlist');
      setWatchlist(response.data.watchlist);
      setError('');
    } catch (error) {
      setError('Failed to load watchlist');
      console.error('Watchlist error:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshPrices = async () => {
    setRefreshing(true);
    try {
      // Fetch updated quotes for all stocks in watchlist
      const updatedWatchlist = await Promise.all(
        watchlist.map(async (item) => {
          try {
            const response = await axios.get(`/api/stocks/${item.symbol}/quote`);
            return {
              ...item,
              stock_data: {
                ...item.stock_data,
                last_price: response.data.quote.price,
                change: response.data.quote.change,
                change_percent: response.data.quote.change_percent
              }
            };
          } catch (error) {
            console.error(`Failed to update ${item.symbol}:`, error);
            return item; // Keep original data if update fails
          }
        })
      );
      setWatchlist(updatedWatchlist);
    } catch (error) {
      setError('Failed to refresh prices');
    } finally {
      setRefreshing(false);
    }
  };

  const removeFromWatchlist = async (symbol) => {
    if (!window.confirm(`Remove ${symbol} from watchlist?`)) return;

    try {
      await axios.delete(`/api/watchlist/${symbol}`);
      setWatchlist(watchlist.filter(item => item.symbol !== symbol));
    } catch (error) {
      setError('Failed to remove stock from watchlist');
      console.error('Remove error:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatPercent = (percent) => {
    const num = parseFloat(percent || 0);
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
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
          <h1 className="text-3xl font-bold text-white">Watchlist</h1>
          <div className="flex gap-3">
            <button
              onClick={refreshPrices}
              disabled={refreshing || watchlist.length === 0}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                refreshing || watchlist.length === 0
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {refreshing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Refreshing...
                </div>
              ) : (
                '🔄 Refresh Prices'
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Watchlist Content */}
        {watchlist.length > 0 ? (
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-700 px-6 py-4">
              <div className="grid grid-cols-6 gap-4 text-gray-300 text-sm font-medium">
                <div>Symbol</div>
                <div>Name</div>
                <div>Price</div>
                <div>Change</div>
                <div>% Change</div>
                <div>Actions</div>
              </div>
            </div>

            {/* Watchlist Items */}
            <div className="divide-y divide-gray-700">
              {watchlist.map((item) => (
                <div key={item.symbol} className="px-6 py-4 hover:bg-gray-750 transition-colors duration-200">
                  <div className="grid grid-cols-6 gap-4 items-center">
                    {/* Symbol */}
                    <div>
                      <div className="font-semibold text-white text-lg">
                        {item.symbol}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {item.stock_data?.sector || 'N/A'}
                      </div>
                    </div>

                    {/* Name */}
                    <div className="text-gray-300">
                      {item.stock_data?.name || 'Loading...'}
                    </div>

                    {/* Price */}
                    <div className="font-semibold text-white">
                      {item.stock_data?.last_price 
                        ? formatCurrency(item.stock_data.last_price)
                        : 'N/A'
                      }
                    </div>

                    {/* Change */}
                    <div className={`font-medium ${
                      (item.stock_data?.change || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {item.stock_data?.change 
                        ? formatCurrency(item.stock_data.change)
                        : 'N/A'
                      }
                    </div>

                    {/* % Change */}
                    <div className={`font-medium ${
                      (item.stock_data?.change_percent || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {item.stock_data?.change_percent 
                        ? formatPercent(item.stock_data.change_percent)
                        : 'N/A'
                      }
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => removeFromWatchlist(item.symbol)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors duration-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
            <div className="text-6xl mb-4">⭐</div>
            <h2 className="text-xl font-bold text-white mb-2">Your watchlist is empty</h2>
            <p className="text-gray-400 mb-6">
              Search for stocks and add them to your watchlist to track their performance.
            </p>
            <button
              onClick={() => window.location.href = '/search'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              🔍 Search for Stocks
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;