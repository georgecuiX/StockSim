# 📈 StockSim - Stock Market Analysis & Portfolio Management Platform

<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios" />
  <img src="https://img.shields.io/badge/Alpha_Vantage-FF6B35?style=for-the-badge" alt="Alpha Vantage API" />
</div>

<div align="center">
  <p><em>A comprehensive full-stack platform for real-time stock analysis, portfolio tracking, and investment simulation</em></p>
</div>

https://github.com/user-attachments/assets/864baa5b-1d97-43e7-89a0-49367c6927b9

## 🌟 Overview

StockSim is a powerful financial platform that combines real-time stock market data, sophisticated portfolio management, and paper trading simulation capabilities. Built with modern web technologies, it provides investors, traders, and financial enthusiasts with professional-grade tools to analyze markets, track investments, and make informed financial decisions.

Whether you're a beginner learning about investing or an experienced trader looking for a comprehensive portfolio management solution, StockSim offers an intuitive interface with robust functionality to meet your financial analysis needs.

## ✨ Key Features

### 🔐 Secure Authentication System
- **User Registration & Login** - Secure account creation with password encryption
- **Session Management** - Persistent login sessions with Flask-based authentication
- **Protected Routes** - Role-based access control for all financial data

### 📊 Real-Time Stock Analysis
- **Live Market Data** - Real-time stock quotes powered by Alpha Vantage API
- **Company Information** - Comprehensive company overviews, fundamentals, and metrics
- **Market Search** - Advanced stock search with symbol and company name lookup
- **Trending Stocks** - Pre-loaded list of popular stocks with instant access
- **Price Charts** - Historical price data and daily market movements

### 💼 Advanced Portfolio Management
- **Transaction Tracking** - Comprehensive buy/sell transaction recording
- **Portfolio Analytics** - Real-time profit/loss calculations and performance metrics
- **Holdings Overview** - Detailed breakdown of current positions and asset allocation
- **Average Cost Basis** - Automatic calculation of average purchase prices
- **Performance Metrics** - Total returns, percentage gains/losses, and portfolio value tracking

### ⭐ Smart Watchlist System
- **Stock Monitoring** - Track favorite stocks with real-time price updates
- **Quick Actions** - Easy add/remove functionality with one-click management
- **Price Alerts** - Visual indicators for price movements and daily changes
- **Sector Organization** - Categorized view of watchlisted stocks by industry

## 🏗️ Tech Stack

### Frontend
- **React** - Modern UI library with hooks and functional components
- **React Router DOM** - Client-side routing and navigation
- **Axios** - HTTP client for API communication
- **Chart.js** - Data visualization and charting capabilities
- **Custom CSS** - Tailwind-inspired utility classes for consistent styling

### Backend
- **Flask** - Lightweight Python web framework
- **Flask-SQLAlchemy** - Database ORM for data management
- **Flask-CORS** - Cross-origin resource sharing support
- **Werkzeug** - Password hashing and security utilities
- **Requests** - HTTP library for external API calls
- **Python-dotenv** - Environment variable management

### External APIs
- **Alpha Vantage API** - Real-time and historical stock market data
- **Demo Data System** - Fallback data for popular stocks when API limits are reached

## 🛠️ Installation & Setup

### Prerequisites
- **Python 3.8+** - Backend runtime environment
- **Node.js 16+** - Frontend development environment
- **npm or yarn** - Package manager for frontend dependencies

### Installation Steps

**1. Clone the Repository**
```bash
git clone https://github.com/yourusername/stocksim.git
cd stocksim
```

**2. Backend Setup**
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**3. Frontend Setup**
```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install
```

**4. Database Initialization**
```bash
# The database will be automatically created when you first run the backend
cd backend
python app.py
```

**5. Start the Application**

**Backend Server** (Terminal 1):
```bash
cd backend
python app.py
```

**Frontend Application** (Terminal 2):
```bash
cd frontend
npm start
```

## 🚀 Usage Guide

### Getting Started
1. **Create Account** - Register with a username and secure password
2. **Search Stocks** - Use the search feature to find companies and stocks
3. **Add to Watchlist** - Track interesting stocks for monitoring
4. **Record Transactions** - Add buy/sell transactions to build your portfolio
5. **Monitor Performance** - View your dashboard for portfolio analytics

## 📄 License

This project is licensed under the MIT License
