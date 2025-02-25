const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Apply middleware
app.use(cors());
app.use(helmet()); // Security headers
app.use(morgan('combined')); // Logging
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import route modules (uncomment and adjust as needed)
// const authRoutes = require('./routes/auth');
// const userRoutes = require('./routes/users');
// const dataRoutes = require('./routes/data');

// Register routes
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/data', dataRoutes);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
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
  // Close database connections here if applicable
  process.exit(0);
});

module.exports = app; 