const express = require('express');
const router = express.Router();
const controller = require('../controllers/index');

// User Registration
router.post('/register', controller.registerUser);

//User Login
router.post('/login', controller.loginUser);

//updateWalletBalance
router.post('/update-balance', controller.updateWalletBalanceHandler);
//get Wallet Balance
router.get('/wallet/:userId', controller.getWalletBalance);

// Stock Data
router.get('/stocks', controller.getAllStocks);
router.get('/stocks/:id', controller.getStockById);

// User Actions
router.post('/buy', controller.buyStock);
router.post('/sell', controller.sellStock);

// Watchlist
router.get('/watchlist/:userId', controller.getWatchlist);
router.post('/watchlist/add', controller.addToWatchlist);
router.post('/watchlist/remove', controller.removeFromWatchlist);

// GTT Orders
router.post('/gtt', controller.createGTTOrder);
router.get('/gtt/:userId', controller.getGTTOrders);
router.post('/gtt/delete', controller.deleteGTTOrder);


// Transactions
router.get('/transactions/:userId', controller.getUserTransactions);

// Portfolio
router.get('/portfolio/:userId', controller.getUserPortfolio);

module.exports = router;

