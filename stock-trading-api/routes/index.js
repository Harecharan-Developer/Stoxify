const express = require('express');
const router = express.Router();
const controller = require('../controllers/index');

// User Registration
router.post('/register', controller.registerUser);

//User Login
router.post('/login', controller.loginUser);

//updateWalletBalance
router.post('/update-balance', controller.updateWalletBalanceHandler);

// Stock Data
router.get('/stocks', controller.getAllStocks);
router.get('/stocks/:id', controller.getStockById);

// User Actions
router.post('/buy', controller.buyStock);
router.post('/sell', controller.sellStock);

// Watchlist


// Transactions
router.get('/transactions/:userId', controller.getUserTransactions);

// Portfolio
router.get('/portfolio/:userId', controller.getUserPortfolio);

module.exports = router;

