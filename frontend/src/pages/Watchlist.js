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
                change_percent: response.data.quote.change_percent,
                volume: response.data.quote.volume,
                previous_close: response.data.quote.previous_close,
                latest_trading_day: response.data.quote.latest_trading_day
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
    <div className="min-h-screen dashboard-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Watchlist</h1>
            <p className="text-gray-400 mt-1">
              {watchlist.length} stock{watchlist.length !== 1 ? 's' : ''} being tracked
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={refreshPrices}
              disabled={refreshing || watchlist.length === 0}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${
                refreshing || watchlist.length === 0
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {refreshing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  🔄 Refresh Prices
                </>
              )}
            </button>
            <button
              onClick={() => window.location.href = '/search'}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              ➕ Add Stocks
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {watchlist.map((item) => (
              <div
                key={item.symbol}
                className="bg-gray-800 rounded-lg border border-gray-700 p-6 transition-all duration-200"
              >
                {/* Stock Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white transition-colors">
                      {item.symbol}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {item.stock_data?.name || 'Loading...'}
                    </p>
                    {item.stock_data?.sector && (
                      <span className="inline-block bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs mt-1">
                        {item.stock_data.sector}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromWatchlist(item.symbol)}
                    className="text-gray-400 hover:text-red-400 p-1 rounded hover:bg-gray-700 transition-colors"
                    title="Remove from watchlist"
                  >
                    ✕
                  </button>
                </div>

                {/* Price Information */}
                <div className="space-y-3">
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {item.stock_data?.last_price 
                        ? formatCurrency(item.stock_data.last_price)
                        : 'N/A'
                      }
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-lg font-semibold ${
                        (item.stock_data?.change || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {item.stock_data?.change 
                          ? formatCurrency(item.stock_data.change)
                          : 'N/A'
                        }
                      </div>
                      <div className="text-gray-400 text-sm">Daily Change</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${
                        (item.stock_data?.change_percent || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {item.stock_data?.change_percent 
                          ? formatPercent(item.stock_data.change_percent)
                          : 'N/A'
                        }
                      </div>
                      <div className="text-gray-400 text-sm">% Change</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
            <div className="text-6xl mb-6">⭐</div>
            <h2 className="text-2xl font-bold text-white mb-3">Your watchlist is empty</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Start tracking your favorite stocks by searching for companies and adding them to your watchlist.
            </p>
            <button
              onClick={() => window.location.href = '/search'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 inline-flex items-center gap-2"
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