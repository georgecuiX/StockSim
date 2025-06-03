import requests
import os
import time
from datetime import datetime

class AlphaVantageClient:
    def __init__(self):
        self.api_key = os.environ.get('ALPHA_VANTAGE_API_KEY')
        self.base_url = 'https://www.alphavantage.co/query'
        self.last_request_time = 0
        self.rate_limit_delay = 12  # 12 seconds between requests (5 requests per minute)
    
    def _make_request(self, params):
        """Make rate-limited request to Alpha Vantage API"""
        # Ensure we don't exceed rate limit
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time
        
        if time_since_last_request < self.rate_limit_delay:
            time.sleep(self.rate_limit_delay - time_since_last_request)
        
        params['apikey'] = self.api_key
        
        try:
            response = requests.get(self.base_url, params=params)
            self.last_request_time = time.time()
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API request failed: {e}")
            return None
    
    def get_stock_quote(self, symbol):
        """Get real-time stock quote"""
        params = {
            'function': 'GLOBAL_QUOTE',
            'symbol': symbol
        }
        
        data = self._make_request(params)
        if not data or 'Global Quote' not in data:
            return None
        
        quote = data['Global Quote']
        
        return {
            'symbol': quote.get('01. symbol'),
            'price': float(quote.get('05. price', 0)),
            'change': float(quote.get('09. change', 0)),
            'change_percent': quote.get('10. change percent', '0%').replace('%', ''),
            'volume': int(quote.get('06. volume', 0)),
            'latest_trading_day': quote.get('07. latest trading day'),
            'previous_close': float(quote.get('08. previous close', 0))
        }
    
    def get_daily_data(self, symbol, outputsize='compact'):
        """Get daily stock data (last 100 days for compact, 20+ years for full)"""
        params = {
            'function': 'TIME_SERIES_DAILY',
            'symbol': symbol,
            'outputsize': outputsize
        }
        
        data = self._make_request(params)
        if not data or 'Time Series (Daily)' not in data:
            return None
        
        # Convert to simple list format for now (we'll add pandas later)
        time_series = data['Time Series (Daily)']
        daily_data = []
        
        for date, values in time_series.items():
            daily_data.append({
                'date': date,
                'open': float(values['1. open']),
                'high': float(values['2. high']),
                'low': float(values['3. low']),
                'close': float(values['4. close']),
                'volume': int(values['5. volume'])
            })
        
        # Sort by date (most recent first)
        daily_data.sort(key=lambda x: x['date'], reverse=True)
        
        return daily_data
    
    def get_company_overview(self, symbol):
        """Get company fundamental data"""
        params = {
            'function': 'OVERVIEW',
            'symbol': symbol
        }
        
        data = self._make_request(params)
        if not data or 'Symbol' not in data:
            return None
        
        return {
            'symbol': data.get('Symbol'),
            'name': data.get('Name'),
            'sector': data.get('Sector'),
            'industry': data.get('Industry'),
            'market_cap': data.get('MarketCapitalization'),
            'pe_ratio': data.get('PERatio'),
            'dividend_yield': data.get('DividendYield'),
            'description': data.get('Description')
        }
    
    def search_stocks(self, keywords):
        """Search for stocks by keywords"""
        params = {
            'function': 'SYMBOL_SEARCH',
            'keywords': keywords
        }
        
        data = self._make_request(params)
        if not data or 'bestMatches' not in data:
            return []
        
        results = []
        for match in data['bestMatches'][:10]:  # Limit to top 10 results
            results.append({
                'symbol': match.get('1. symbol'),
                'name': match.get('2. name'),
                'type': match.get('3. type'),
                'region': match.get('4. region'),
                'currency': match.get('8. currency')
            })
        
        return results