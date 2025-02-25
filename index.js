const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nifya_db')
  .then(() => {
    console.log('MongoDB Connected');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// CORS configuration with specific origin
const corsOptions = {
  origin: ['https://clever-kelpie-60c3a6.netlify.app', 'http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Allow cookies to be sent with requests
  maxAge: 86400 // Cache preflight requests for 24 hours
};

// Apply middleware
app.use(cors(corsOptions)); // Apply configured CORS
app.use(helmet()); // Security headers
app.use(morgan('combined')); // Logging
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import route modules
const authRoutes = require('./routes/auth');
// const userRoutes = require('./routes/users');
// const dataRoutes = require('./routes/data');

// Register routes
app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/data', dataRoutes);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Testing endpoint for auth system
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: {
      message: err.message || 'An unexpected error occurred',
      status: err.status || 500
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// For graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  // Close database connections
  mongoose.connection.close();
  process.exit(0);
});

module.exports = app; 