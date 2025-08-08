const app = require('./app');
const cron = require('node-cron');
const updateStockPrices = require('./db/cronJobs');

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