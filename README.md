# Intelligent Inventory Management System - Backend

A comprehensive AI-powered inventory management system backend built with Node.js, TypeScript, and TensorFlow.js.

## 🚀 Features

### Core Functionality
- **Product Management**: Complete CRUD operations for inventory items
- **Stock Tracking**: Real-time stock level monitoring and movement tracking
- **Supplier Management**: Supplier information and performance tracking
- **Location Management**: Warehouse and zone-based inventory organization

### AI-Powered Features
- **Demand Forecasting**: Neural network-based demand prediction
- **Stock Optimization**: AI-driven optimal stock level recommendations
- **Anomaly Detection**: Automatic detection of unusual demand patterns
- **Intelligent Alerts**: Smart notifications based on AI insights
- **Predictive Analytics**: Advanced analytics and trend analysis

### Real-time Features
- **WebSocket Integration**: Real-time updates for inventory changes
- **Live Dashboards**: Real-time KPI monitoring
- **Instant Notifications**: Immediate alerts for critical events

### Advanced Capabilities
- **Automated Scheduling**: Cron-based AI model training and optimization
- **Bulk Operations**: Batch processing for large-scale operations
- **Caching Layer**: Redis-based caching with fallback support
- **Model Management**: Dynamic AI model training and deployment

## 🛠 Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **AI/ML**: TensorFlow.js, ML-Regression, Simple Statistics
- **Real-time**: Socket.io
- **Caching**: Redis (with in-memory fallback)
- **Authentication**: JWT
- **Validation**: Zod
- **Scheduling**: Node-cron

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- Redis 6+ (optional)
- npm or yarn

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd inventory-backend
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your database and configuration details
```

### 3. Database Setup
```bash
# Generate Prisma client
npm run generate

# Run database migrations
npm run migrate

# Seed the database with sample data
npm run seed
```

### 4. Start Development Server
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 📊 AI Models

### Demand Forecasting
- **Algorithm**: Neural Network (TensorFlow.js) with statistical fallback
- **Features**: Historical demand, seasonality, day-of-week patterns
- **Training**: Automatic retraining weekly with new data
- **Accuracy**: Typically 85-95% depending on data quality

### Stock Optimization
- **Algorithm**: Economic Order Quantity (EOQ) with safety stock
- **Factors**: Demand variability, lead times, holding costs
- **Output**: Optimal stock levels, reorder points, expected savings

### Anomaly Detection
- **Algorithm**: Z-score based statistical analysis
- **Threshold**: Configurable anomaly sensitivity
- **Real-time**: Continuous monitoring with instant alerts

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
```

### Products
```
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
```

### AI Services
```
GET  /api/ai/forecast/:productId
POST /api/ai/forecast/:productId/generate
GET  /api/ai/optimize/:productId
POST /api/ai/optimize/:productId/apply
GET  /api/ai/anomalies/:productId
GET  /api/ai/insights/:productId
POST /api/ai/models/retrain
```

### Real-time Events
```
WebSocket Events:
- stock-updated
- new-alert
- forecast-updated
- optimization-available
- anomalies-detected
```

## 🤖 AI Scheduler

The system includes an automated scheduler that runs:

- **Daily (2 AM)**: Forecast generation for all products
- **Hourly**: Stock optimization checks for high-risk items
- **Every 4 hours**: Anomaly detection across inventory
- **Weekly (Sunday 3 AM)**: AI model retraining
- **Every 6 hours**: Database cleanup and maintenance

## 🔧 Configuration

### Environment Variables
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/inventory_db
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### AI Model Configuration
- Models are stored in `./models/` directory
- Automatic model versioning and backup
- Configurable training parameters
- Support for multiple model types per category

## 📈 Performance

### Optimization Features
- **Caching**: Redis-based caching with 1-hour TTL
- **Batch Processing**: Bulk operations for large datasets
- **Connection Pooling**: Optimized database connections
- **Memory Management**: Automatic TensorFlow model cleanup

### Monitoring
- Real-time performance metrics
- AI model accuracy tracking
- System health endpoints
- Error logging and alerting

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --grep "AI Service"
npm test -- --grep "Product Controller"
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build image
docker build -t inventory-backend .

# Run with docker-compose
docker-compose up -d
```

### Production Considerations
- Set `NODE_ENV=production`
- Use strong JWT secrets
- Configure proper database connections
- Set up Redis cluster for high availability
- Enable SSL/TLS
- Configure proper logging

## 📚 API Documentation

Once running, visit:
- Swagger UI: `http://localhost:3000/api-docs`
- Health Check: `http://localhost:3000/health`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API examples

## 🔮 Roadmap

- [ ] Advanced ML models (LSTM, ARIMA)
- [ ] Multi-location optimization
- [ ] Supplier performance prediction
- [ ] Mobile app API support
- [ ] Advanced reporting engine
- [ ] Integration with ERP systems