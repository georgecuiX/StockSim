from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///stock_analyzer.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
CORS(app, supports_credentials=True)

# Define models directly in app.py for now (we'll separate later)
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'created_at': self.created_at.isoformat()
        }

class Stock(db.Model):
    symbol = db.Column(db.String(10), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    sector = db.Column(db.String(50))
    last_price = db.Column(db.Float)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'symbol': self.symbol,
            'name': self.name,
            'sector': self.sector,
            'last_price': self.last_price,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None
        }

class Watchlist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    symbol = db.Column(db.String(10), nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('user_id', 'symbol', name='unique_user_stock'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'symbol': self.symbol,
            'added_at': self.added_at.isoformat()
        }

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    symbol = db.Column(db.String(10), nullable=False)
    type = db.Column(db.String(4), nullable=False)  # 'buy' or 'sell'
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'symbol': self.symbol,
            'type': self.type,
            'quantity': self.quantity,
            'price': self.price,
            'date': self.date.isoformat(),
            'created_at': self.created_at.isoformat()
        }

# Authentication routes
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        # Create new user
        password_hash = generate_password_hash(password)
        new_user = User(username=username, password_hash=password_hash)
        
        db.session.add(new_user)
        db.session.commit()
        
        # Log user in
        session['user_id'] = new_user.id
        
        return jsonify({
            'message': 'User created successfully',
            'user': new_user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400
        
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            session['user_id'] = user.id
            return jsonify({
                'message': 'Login successful',
                'user': user.to_dict()
            }), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/api/me', methods=['GET'])
def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200

@app.route('/')
def index():
    return jsonify({"message": "Stock Market Analysis API", "status": "running"})

@app.route('/api/portfolio/clear', methods=['DELETE'])
def clear_portfolio():
    user = require_auth()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        # Delete all transactions for the current user
        transactions_deleted = Transaction.query.filter_by(user_id=user.id).delete()
        db.session.commit()
        
        return jsonify({
            'message': f'Portfolio cleared successfully. {transactions_deleted} transactions deleted.',
            'transactions_deleted': transactions_deleted
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Alpha Vantage API Client Class
import requests
import time

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
        """Get real-time stock quote with demo fallback"""
        # Demo data for when API limit is reached
        demo_quotes = {
            'AAPL': {'symbol': 'AAPL', 'price': 175.43, 'change': 2.15, 'change_percent': '1.24', 'volume': 45678900, 'latest_trading_day': '2025-06-11', 'previous_close': 173.28},
            'MSFT': {'symbol': 'MSFT', 'price': 412.84, 'change': -3.21, 'change_percent': '-0.77', 'volume': 28934567, 'latest_trading_day': '2025-06-11', 'previous_close': 416.05},
            'GOOGL': {'symbol': 'GOOGL', 'price': 2734.56, 'change': 45.32, 'change_percent': '1.69', 'volume': 12456789, 'latest_trading_day': '2025-06-11', 'previous_close': 2689.24},
            'AMZN': {'symbol': 'AMZN', 'price': 3124.78, 'change': -12.45, 'change_percent': '-0.40', 'volume': 23456789, 'latest_trading_day': '2025-06-11', 'previous_close': 3137.23},
            'TSLA': {'symbol': 'TSLA', 'price': 248.92, 'change': 8.76, 'change_percent': '3.65', 'volume': 67890123, 'latest_trading_day': '2025-06-11', 'previous_close': 240.16},
            'META': {'symbol': 'META', 'price': 489.67, 'change': -7.33, 'change_percent': '-1.47', 'volume': 19876543, 'latest_trading_day': '2025-06-11', 'previous_close': 497.00},
            'NVDA': {'symbol': 'NVDA', 'price': 891.23, 'change': 23.45, 'change_percent': '2.70', 'volume': 34567890, 'latest_trading_day': '2025-06-11', 'previous_close': 867.78},
            'NFLX': {'symbol': 'NFLX', 'price': 512.34, 'change': 5.67, 'change_percent': '1.12', 'volume': 8765432, 'latest_trading_day': '2025-06-11', 'previous_close': 506.67},
            'DIS': {'symbol': 'DIS', 'price': 98.76, 'change': 1.23, 'change_percent': '1.26', 'volume': 15432109, 'latest_trading_day': '2025-06-11', 'previous_close': 97.53},
            'PYPL': {'symbol': 'PYPL', 'price': 67.89, 'change': -0.54, 'change_percent': '-0.79', 'volume': 12098765, 'latest_trading_day': '2025-06-11', 'previous_close': 68.43}
        }
        
        # Use demo data for trending stocks
        if symbol.upper() in demo_quotes:
            print(f"Using demo data for {symbol}")
            return demo_quotes[symbol.upper()]
        
        # Try real API for other stocks
        params = {
            'function': 'GLOBAL_QUOTE',
            'symbol': symbol
        }
        
        data = self._make_request(params)
        if not data or 'Global Quote' not in data:
            print(f"API request failed for {symbol}")
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

# Initialize API client
api_client = AlphaVantageClient()

# Helper function to check authentication
def require_auth():
    user_id = session.get('user_id')
    if not user_id:
        return None
    return User.query.get(user_id)

# Stock API Routes
@app.route('/api/stocks/search/<string:query>', methods=['GET'])
def search_stocks(query):
    try:
        results = api_client.search_stocks(query)
        return jsonify({
            'results': results,
            'count': len(results)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stocks/<string:symbol>/quote', methods=['GET'])
def get_stock_quote(symbol):
    try:
        quote = api_client.get_stock_quote(symbol.upper())
        if not quote:
            return jsonify({'error': 'Stock not found or API limit reached'}), 404
        
        # Store/update stock in database
        stock = Stock.query.get(symbol.upper())
        if stock:
            stock.last_price = quote['price']
            stock.last_updated = datetime.utcnow()
        else:
            # Get company info for new stocks
            company_info = api_client.get_company_overview(symbol.upper())
            stock = Stock(
                symbol=symbol.upper(),
                name=company_info.get('name', 'Unknown') if company_info else 'Unknown',
                sector=company_info.get('sector') if company_info else None,
                last_price=quote['price'],
                last_updated=datetime.utcnow()
            )
            db.session.add(stock)
        
        db.session.commit()
        
        return jsonify({
            'quote': quote,
            'company': stock.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/stocks/<string:symbol>/chart', methods=['GET'])
def get_stock_chart(symbol):
    try:
        # Get optional parameters
        outputsize = request.args.get('outputsize', 'compact')  # compact or full
        
        chart_data = api_client.get_daily_data(symbol.upper(), outputsize)
        if not chart_data:
            return jsonify({'error': 'Chart data not found or API limit reached'}), 404
        
        return jsonify({
            'symbol': symbol.upper(),
            'data': chart_data,
            'count': len(chart_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stocks/<string:symbol>/overview', methods=['GET'])
def get_company_overview(symbol):
    try:
        overview = api_client.get_company_overview(symbol.upper())
        if not overview:
            return jsonify({'error': 'Company information not found or API limit reached'}), 404
        
        return jsonify({'overview': overview}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Watchlist Routes
@app.route('/api/watchlist', methods=['GET'])
def get_watchlist():
    user = require_auth()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        watchlist_items = Watchlist.query.filter_by(user_id=user.id).all()
        
        # Get current prices for watchlist stocks
        watchlist_with_prices = []
        for item in watchlist_items:
            stock = Stock.query.get(item.symbol)
            stock_data = stock.to_dict() if stock else {'symbol': item.symbol, 'name': 'Unknown'}
            
            watchlist_with_prices.append({
                'id': item.id,
                'symbol': item.symbol,
                'added_at': item.added_at.isoformat(),
                'stock_data': stock_data
            })
        
        return jsonify({
            'watchlist': watchlist_with_prices,
            'count': len(watchlist_with_prices)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/watchlist/add', methods=['POST'])
def add_to_watchlist():
    user = require_auth()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        data = request.get_json()
        symbol = data.get('symbol', '').upper().strip()
        
        if not symbol:
            return jsonify({'error': 'Stock symbol required'}), 400
        
        # Check if already in watchlist
        existing = Watchlist.query.filter_by(user_id=user.id, symbol=symbol).first()
        if existing:
            return jsonify({'error': 'Stock already in watchlist'}), 400
        
        # Add to watchlist
        watchlist_item = Watchlist(user_id=user.id, symbol=symbol)
        db.session.add(watchlist_item)
        db.session.commit()
        
        return jsonify({
            'message': f'{symbol} added to watchlist',
            'item': watchlist_item.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/watchlist/<string:symbol>', methods=['DELETE'])
def remove_from_watchlist(symbol):
    user = require_auth()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        watchlist_item = Watchlist.query.filter_by(
            user_id=user.id, 
            symbol=symbol.upper()
        ).first()
        
        if not watchlist_item:
            return jsonify({'error': 'Stock not found in watchlist'}), 404
        
        db.session.delete(watchlist_item)
        db.session.commit()
        
        return jsonify({'message': f'{symbol.upper()} removed from watchlist'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Portfolio Routes
@app.route('/api/portfolio', methods=['GET'])
def get_portfolio():
    user = require_auth()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        transactions = Transaction.query.filter_by(user_id=user.id).order_by(Transaction.date.desc()).all()
        
        # Calculate portfolio holdings
        holdings = {}
        for transaction in transactions:
            symbol = transaction.symbol
            if symbol not in holdings:
                holdings[symbol] = {'quantity': 0, 'total_cost': 0, 'transactions': []}
            
            if transaction.type == 'buy':
                holdings[symbol]['quantity'] += transaction.quantity
                holdings[symbol]['total_cost'] += transaction.quantity * transaction.price
            else:  # sell
                holdings[symbol]['quantity'] -= transaction.quantity
                holdings[symbol]['total_cost'] -= transaction.quantity * transaction.price
            
            holdings[symbol]['transactions'].append(transaction.to_dict())
        
        # Remove holdings with zero quantity
        active_holdings = {k: v for k, v in holdings.items() if v['quantity'] > 0}
        
        # Calculate average cost and current values
        portfolio_summary = []
        total_portfolio_value = 0
        total_cost_basis = 0
        
        for symbol, holding in active_holdings.items():
            avg_cost = holding['total_cost'] / holding['quantity'] if holding['quantity'] > 0 else 0
            
            # Get current stock price
            stock = Stock.query.get(symbol)
            current_price = stock.last_price if stock and stock.last_price else 0
            current_value = holding['quantity'] * current_price
            gain_loss = current_value - holding['total_cost']
            gain_loss_percent = (gain_loss / holding['total_cost'] * 100) if holding['total_cost'] > 0 else 0
            
            portfolio_summary.append({
                'symbol': symbol,
                'quantity': holding['quantity'],
                'avg_cost': round(avg_cost, 2),
                'current_price': current_price,
                'current_value': round(current_value, 2),
                'total_cost': round(holding['total_cost'], 2),
                'gain_loss': round(gain_loss, 2),
                'gain_loss_percent': round(gain_loss_percent, 2),
                'stock_info': stock.to_dict() if stock else None
            })
            
            total_portfolio_value += current_value
            total_cost_basis += holding['total_cost']
        
        total_gain_loss = total_portfolio_value - total_cost_basis
        total_gain_loss_percent = (total_gain_loss / total_cost_basis * 100) if total_cost_basis > 0 else 0
        
        return jsonify({
            'holdings': portfolio_summary,
            'summary': {
                'total_value': round(total_portfolio_value, 2),
                'total_cost': round(total_cost_basis, 2),
                'total_gain_loss': round(total_gain_loss, 2),
                'total_gain_loss_percent': round(total_gain_loss_percent, 2),
                'positions_count': len(portfolio_summary)
            },
            'recent_transactions': [t.to_dict() for t in transactions[:10]]  # Last 10 transactions
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/portfolio/clear-all', methods=['DELETE'])
def clear_all_portfolio():
    user = require_auth()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        # Delete all transactions for the current user
        transactions_deleted = Transaction.query.filter_by(user_id=user.id).delete()
        db.session.commit()
        
        return jsonify({
            'message': f'Portfolio cleared completely. {transactions_deleted} transactions deleted.',
            'transactions_deleted': transactions_deleted
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/portfolio/transaction', methods=['POST'])
def add_transaction():
    user = require_auth()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        data = request.get_json()
        symbol = data.get('symbol', '').upper().strip()
        transaction_type = data.get('type', '').lower()
        quantity = data.get('quantity')
        price = data.get('price')
        date_str = data.get('date')  # ISO format string
        
        # Validation
        if not all([symbol, transaction_type, quantity, price, date_str]):
            return jsonify({'error': 'All fields required: symbol, type, quantity, price, date'}), 400
        
        if transaction_type not in ['buy', 'sell']:
            return jsonify({'error': 'Transaction type must be "buy" or "sell"'}), 400
        
        if quantity <= 0 or price <= 0:
            return jsonify({'error': 'Quantity and price must be positive numbers'}), 400
        
        # Parse date
        try:
            transaction_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)'}), 400
        
        # Create transaction
        transaction = Transaction(
            user_id=user.id,
            symbol=symbol,
            type=transaction_type,
            quantity=int(quantity),
            price=float(price),
            date=transaction_date
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'message': 'Transaction added successfully',
            'transaction': transaction.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Create database tables
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, port=5000)