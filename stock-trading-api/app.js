const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const routes = require('./routes/index');
const db = require('./db/config');
const path = require('path');
const updateStockPrices = require('./db/cronJobs');
const cron = require('node-cron');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(require('express-status-monitor')());

// Make db accessible in requests
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Serve the frontend
app.use(express.static(path.join(__dirname, '../frontend')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/userlogin.html'));
});

// Use routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Only start server and cron if not in test environment
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3069;
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    
    // Start cron jobs after server starts
    cron.schedule('*/2 * * * * *', async () => {
      try {
        await updateStockPrices();
      } catch (error) {
        console.error('Error running cron job:', error);
      }
    });
    
    console.log('Cron job for updating stock prices initialized');
  });
}

module.exports = app;