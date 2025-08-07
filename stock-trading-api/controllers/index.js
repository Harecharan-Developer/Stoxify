const db = require('../db/config');

// User Registration
exports.registerUser = async (req, res) => {
    const db = require('../db/config');
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    try {
        await db.execute('INSERT INTO users (username, password,balance,total_profit_loss) VALUES (?, ?,?,?)', [username, password,0,0]);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration Error:', error);    
        res.status(500).json({ error: 'Database error during registration' });
    }   

};

// User Login
exports.loginUser = async (req, res) => {
    const db = require('../db/config');
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
        if (rows.length === 0) {        
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        res.json({ message: 'Login successful', user: rows[0] });
    } catch (error) {   
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Database error during login' });
    }   
};

//Wallet Balance update
exports.updateWalletBalance = async (userId, amount) => {
    const db = require('../db/config');
    try {
        await db.execute(
            'UPDATE users SET balance = balance + ? WHERE user_id = ?',
            [amount, userId]
        );
    } catch (error) {
        console.error('Error updating wallet balance:', error);
        throw error;
    }
};


////get Wallet Balance
// router.get('/wallet/:userId', controller.getWalletBalance);
exports.getWalletBalance = async (req, res) => {
    const db = require('../db/config'); 
    const { userId } = req.params;
    try { 


        const [rows] = await db.execute('SELECT balance FROM users WHERE user_id = ?', [userId]);
        if (rows.length === 0) {  
            return res.status(404).json({ error: 'User not found' });
        } 
        res.json({ balance: rows[0].balance });
    } catch (error) { 
        console.error('Error fetching wallet balance:', error);
        res.status(500).json({ error: 'Database error fetching wallet balance' });
    }
};




exports.updateWalletBalanceHandler = async (req, res) => {
    const { user_id, amount } = req.body;

    try {
        await exports.updateWalletBalance(user_id, amount);
        res.json({ success: true, message: "Balance updated." });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};


// STOCK DATA
exports.getAllStocks = async (req, res) => {
    const db = require('../db/config');
    const [rows] = await db.execute('SELECT * FROM stockdata');
  res.json(rows);
};

exports.getStockById = async (req, res) => {
    const db = require('../db/config');
    const { id } = req.params;
  const [rows] = await db.execute('SELECT * FROM stockdata WHERE stock_id = ?', [id]);
  res.json(rows[0]);
};
exports.buyStock = async (req, res) => {
    const db = require('../db/config');
    const { user_id, stock_id, quantity } = req.body;
  
    if (!user_id || !stock_id || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    const [[user]] = await db.execute('SELECT balance FROM users WHERE user_id = ?', [user_id]);
    const [[stock]] = await db.execute('SELECT current_sprice FROM stockdata WHERE stock_id = ?', [stock_id]);
  
    if (!user || !stock) {
      return res.status(404).json({ error: 'User or stock not found' });
    }
  
    const cost = quantity * stock.current_sprice;
  
    if (user.balance < cost) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
  
    await db.execute(
      'UPDATE users SET balance = balance - ? WHERE user_id = ?',
      [cost, user_id]
    );
  
    await db.execute(
      'INSERT INTO transactions (user_id, stock_id, type, quantity, price_at_transaction) VALUES (?, ?, "BUY", ?, ?)',
      [user_id, stock_id, quantity, stock.current_sprice]
    );
  
    res.json({ message: 'Stock purchased successfully' });
  };

  exports.sellStock = async (req, res) => {
    const db = require('../db/config');
    const { user_id, stock_id, quantity } = req.body;
  
    if (!user_id || !stock_id || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    // Calculate net quantity owned by summing transactions
    const [rows] = await db.execute(
      `SELECT
          SUM(CASE WHEN type = 'BUY' THEN quantity ELSE -quantity END) AS net_quantity
       FROM transactions
       WHERE user_id = ? AND stock_id = ?`,
      [user_id, stock_id]
    );
  
    const netQuantity = rows[0]?.net_quantity || 0;
  
    if (netQuantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock to sell' });
    }
  
    const [[stock]] = await db.execute('SELECT current_sprice FROM stockdata WHERE stock_id = ?', [stock_id]);
  
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
  
    const revenue = quantity * stock.current_sprice;
  
    await db.execute(
      'UPDATE users SET balance = balance + ? WHERE user_id = ?',
      [revenue, user_id]
    );
  
    await db.execute(
      'INSERT INTO transactions (user_id, stock_id, type, quantity, price_at_transaction) VALUES (?, ?, "SELL", ?, ?)',
      [user_id, stock_id, quantity, stock.current_sprice]
    );
  
    res.json({ message: 'Stock sold successfully' });
  };
  

// TRANSACTIONS
exports.getUserTransactions = async (req, res) => {
    const db = require('../db/config');
    const { userId } = req.params;
  const [rows] = await db.execute(
    'SELECT t.*, s.company_name FROM transactions t JOIN stockdata s ON t.stock_id = s.stock_id WHERE t.user_id = ? ORDER BY t.transaction_time DESC',
    [userId]
  );
  res.json(rows);
};


exports.getUserPortfolio = async (req, res) => {
  const db = require('../db/config');
  const { userId } = req.params;

  // Get stock holding summary
  const [holdings] = await db.execute(
    `SELECT t.stock_id, s.company_name, s.current_sprice,
            SUM(CASE WHEN t.type = 'BUY' THEN t.quantity ELSE -t.quantity END) AS quantity
     FROM transactions t
     JOIN stockdata s ON t.stock_id = s.stock_id
     WHERE t.user_id = ?
     GROUP BY t.stock_id
     HAVING quantity > 0`,
    [userId]
  );

  // Get total investment per stock (buy)
  const [buyHistory] = await db.execute(
    `SELECT stock_id, SUM(quantity * price_at_transaction) AS total_investment
     FROM transactions
     WHERE user_id = ? AND type = 'BUY'
     GROUP BY stock_id`,
    [userId]
  );

  // Get total earnings per stock (sell)
  const [sellHistory] = await db.execute(
    `SELECT stock_id, SUM(quantity * price_at_transaction) AS total_earnings
     FROM transactions
     WHERE user_id = ? AND type = 'SELL'
     GROUP BY stock_id`,
    [userId]
  );

  const buyMap = Object.fromEntries(buyHistory.map(b => [b.stock_id, b]));
  const sellMap = Object.fromEntries(sellHistory.map(s => [s.stock_id, s]));

  const portfolio = holdings.map(h => {
    const buy = buyMap[h.stock_id] || { total_investment: 0 };
    const sell = sellMap[h.stock_id] || { total_earnings: 0 };

    const currentValue = h.quantity * h.current_sprice;
    const netInvestment = buy.total_investment - sell.total_earnings;
    const profitLoss = currentValue - netInvestment;

    return {
      stock_id: h.stock_id,
      company_name: h.company_name,
      quantity: h.quantity,
      current_price: h.current_sprice,
      current_value: currentValue,
      net_investment: netInvestment,
      profit_loss: profitLoss
    };
  });

  res.json(portfolio);
};




// GTT ORDERS
exports.createGTTOrder = async (req, res) => {
  const db = require('../db/config');
  const { user_id, stock_id, target_price, action, quantity } = req.body;

  // Validation: Check for undefined or null fields
  if (
    user_id === undefined || stock_id === undefined ||
    target_price === undefined || action === undefined || quantity === undefined
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await db.execute(
      'INSERT INTO gtt_orders (user_id, stock_id, target_price, action, quantity) VALUES (?, ?, ?, ?, ?)',
      [user_id, stock_id, target_price, action, quantity]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('GTT Insert Error:', err);
    res.status(500).json({ error: 'Database insert failed' });
  }
};


exports.getGTTOrders = async (req, res) => {
  const db = require('../db/config');
  const { userId } = req.params;
const [rows] = await db.execute('SELECT * FROM gtt_orders WHERE user_id = ?', [userId]);
res.json(rows);
};

exports.deleteGTTOrder = async (req, res) => {
  const db = require('../db/config');
  const { gtt_id } = req.body;
await db.execute('DELETE FROM gtt_orders WHERE gtt_id = ?', [gtt_id]);
res.json({ success: true });
};




// WATCHLIST
exports.getWatchlist = async (req, res) => {
  const db = require('../db/config');
  const { userId } = req.params;
const [rows] = await db.execute(
  'SELECT s.* FROM stockdata s JOIN watchlist w ON s.stock_id = w.stock_id WHERE w.user_id = ?',
  [userId]
);
res.json(rows);
};

exports.addToWatchlist = async (req, res) => {
  const db = require('../db/config');
  const { user_id, stock_id } = req.body;
await db.execute(
  'INSERT IGNORE INTO watchlist (user_id, stock_id) VALUES (?, ?)',
  [user_id, stock_id]
);
res.json({ success: true });
};

exports.removeFromWatchlist = async (req, res) => {
  const db = require('../db/config');
  const { user_id, stock_id } = req.body;
await db.execute('DELETE FROM watchlist WHERE user_id = ? AND stock_id = ?', [user_id, stock_id]);
res.json({ success: true });
};

// WATCHLIST
exports.getWatchlist = async (req, res) => {
  const db = require('../db/config');
  const { userId } = req.params;
const [rows] = await db.execute(
  'SELECT s.* FROM stockdata s JOIN watchlist w ON s.stock_id = w.stock_id WHERE w.user_id = ?',
  [userId]
);
res.json(rows);
};

exports.addToWatchlist = async (req, res) => {
  const db = require('../db/config');
  const { user_id, stock_id } = req.body;
await db.execute(
  'INSERT IGNORE INTO watchlist (user_id, stock_id) VALUES (?, ?)',
  [user_id, stock_id]
);
res.json({ success: true });
};

exports.removeFromWatchlist = async (req, res) => {
  const db = require('../db/config');
  const { user_id, stock_id } = req.body;
await db.execute('DELETE FROM watchlist WHERE user_id = ? AND stock_id = ?', [user_id, stock_id]);
res.json({ success: true });
};


// // PORTFOLIO + P/L
// exports.getUserPortfolio = async (req, res) => {
//     const db = require('../db/config');
//     const { userId } = req.params;

//   const [stocks] = await db.execute(
//     `SELECT s.stock_id, s.company_name, s.current_sprice, us.quantity
//      FROM user_stocks us
//      JOIN stockdata s ON us.stock_id = s.stock_id
//      WHERE us.user_id = ?`,
//     [userId]
//   );

//   let [buyHistory] = await db.execute(
//     `SELECT stock_id, SUM(quantity * price_at_transaction) AS total_investment, SUM(quantity) AS total_quantity
//      FROM transactions
//      WHERE user_id = ? AND type = 'BUY'
//      GROUP BY stock_id`,
//     [userId]
//   );

//   let [sellHistory] = await db.execute(
//     `SELECT stock_id, SUM(quantity * price_at_transaction) AS total_earnings, SUM(quantity) AS total_sold
//      FROM transactions
//      WHERE user_id = ? AND type = 'SELL'
//      GROUP BY stock_id`,
//     [userId]
//   );

//   const buyMap = Object.fromEntries(buyHistory.map(b => [b.stock_id, b]));
//   const sellMap = Object.fromEntries(sellHistory.map(s => [s.stock_id, s]));

//   const portfolio = stocks.map(s => {
//     const buy = buyMap[s.stock_id] || { total_investment: 0, total_quantity: 0 };
//     const sell = sellMap[s.stock_id] || { total_earnings: 0, total_sold: 0 };

//     const currentValue = s.quantity * s.current_sprice;
//     const netInvestment = (buy.total_investment || 0) - (sell.total_earnings || 0);
//     const profitLoss = currentValue - netInvestment;

//     return {
//       stock_id: s.stock_id,
//       company_name: s.company_name,
//       quantity: s.quantity,
//       current_price: s.current_sprice,
//       current_value: currentValue,
//       net_investment: netInvestment,
//       profit_loss: profitLoss
//     };
//   });

//   res.json(portfolio);
// };
