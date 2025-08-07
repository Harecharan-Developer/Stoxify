// app.js

const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const routes = require('./routes/index');
const db = require('./db/config');
const path = require('path');

dotenv.config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make db accessible in requests (optional but useful)
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Serve the frontend index.html as the landing page
app.use(express.static(path.join(__dirname, '../frontend')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});
// Use routes
app.use('/api', routes);

// Health check
app.get('/', (req, res) => {
  res.send('Stoxify API is running ✅');
});

const PORT = process.env.PORT || 3069;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
