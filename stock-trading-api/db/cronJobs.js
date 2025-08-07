// file: updateStockPrices.js
const db = require('./config'); // Adjust path to your db config

// To keep track of previous price changes per stock between calls
const previousChanges = {};

/**
 * Update stock prices with intelligent simulation within min/max range.
 * Can be called repeatedly, e.g., from a cron job or any scheduler.
 */

// STOCK PRICE SIMULATOR
async function updateStockPrices() {
  try {
    const [stocks] = await db.execute(
      'SELECT stock_id, current_sprice, min_sprice, max_sprice FROM stockdata'
    );

    for (const stock of stocks) {
      const { stock_id, current_sprice, min_sprice, max_sprice } = stock;

      const currentPrice = parseFloat(current_sprice);
      const minPrice = parseFloat(min_sprice);
      const maxPrice = parseFloat(max_sprice);

      // Calculate the new price change using momentum + mean reversion + randomness
      const stepSize = 10;
      const decimalVariation = (Math.random() - 0.5) * 4; // +/- 2 decimal variation
      
      // Determine direction based on current position
      let direction;
      if (currentPrice <= minPrice + stepSize) {
        direction = 1; // Going up
      } else if (currentPrice >= maxPrice - stepSize) {
        direction = -1; // Going down
      } else {
        // Continue previous direction or use stored direction
        direction = previousChanges[stock_id + '_direction'] || 1;
      }
      
      // Calculate new price with step and decimal variation
      let newPrice;
      if (direction === 1) {
        // Moving towards max
        newPrice = Math.min(currentPrice + stepSize + decimalVariation, maxPrice);
        if (newPrice >= maxPrice - stepSize) {
          previousChanges[stock_id + '_direction'] = -1; // Switch direction
        }
      } else {
        // Moving towards min
        newPrice = Math.max(currentPrice - stepSize + decimalVariation, minPrice);
        if (newPrice <= minPrice + stepSize) {
          previousChanges[stock_id + '_direction'] = 1; // Switch direction
        }
      }
      
      newPrice = parseFloat(newPrice.toFixed(2));

      // Store the direction for next iteration
      previousChanges[stock_id + '_direction'] = direction;

      await db.execute(
        'UPDATE stockdata SET current_sprice = ?, last_updated = NOW() WHERE stock_id = ?',
        [newPrice, stock_id]
      );

      // console.log(`Updated stock_id ${stock_id} price from ${currentPrice} to ${newPrice} (direction: ${direction > 0 ? 'UP' : 'DOWN'})`);
    }

    console.log('[Cron] Stock prices updated');

  } catch (error) {
    console.error('Error updating stock prices:', error);
    throw error;
  }
}

// GTT ORDER EXECUTOR
async function executeGTTOrders() {
  const [orders] = await db.execute('SELECT * FROM gtt_orders');

  for (const order of orders) {
    const { gtt_id, user_id, stock_id, target_price, action, quantity } = order;

    const [[stock]] = await db.execute(
      'SELECT current_sprice FROM stockdata WHERE stock_id = ?',
      [stock_id]
    );

    if (!stock) continue;

    const currentPrice = parseFloat(stock.current_sprice);
    const triggerBuy = action === 'BUY' && currentPrice <= target_price;
    const triggerSell = action === 'SELL' && currentPrice >= target_price;

    if (!triggerBuy && !triggerSell) continue;

    const [[user]] = await db.execute('SELECT balance FROM users WHERE user_id = ?', [user_id]);

    if (action === 'BUY' && user.balance < currentPrice * quantity) continue;

    if (action === 'SELL') {
      const [[owned]] = await db.execute(`
        SELECT SUM(CASE WHEN type = 'BUY' THEN quantity ELSE -quantity END) AS qty
        FROM transactions WHERE user_id = ? AND stock_id = ?
      `, [user_id, stock_id]);

      if ((owned.qty || 0) < quantity) continue;
    }

    await db.execute(`
      INSERT INTO transactions (user_id, stock_id, type, quantity, price_at_transaction)
      VALUES (?, ?, ?, ?, ?)`,
      [user_id, stock_id, action, quantity, currentPrice]);

    const balanceChange = currentPrice * quantity * (action === 'BUY' ? -1 : 1);

    await db.execute(`UPDATE users SET balance = balance + ? WHERE user_id = ?`, [balanceChange, user_id]);

    await db.execute(`DELETE FROM gtt_orders WHERE gtt_id = ?`, [gtt_id]);

    console.log(`[GTT] Executed ${action} for user ${user_id} stock ${stock_id} at ${currentPrice}`);
  }
}

module.exports = async function runCronJobs() {
  await updateStockPrices();
  await executeGTTOrders();
};