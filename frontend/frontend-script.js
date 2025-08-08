// STOXIFY Front-End Logic, Simplified Per Requirements

// ======= Simple Session — Prompt for username on load =======
let currentUser = null;
let stocksData = [];
let portfolio = [];
let watchlist = [];
let transactions = [];
let gttOrders = [];

const API_BASE = 'http://localhost:3069/api';

window.addEventListener('DOMContentLoaded', async function () {
    // Simple session: prompt for username if not already set
    let username = sessionStorage.getItem('username');
    if (!username) {
        username = "testuser"
        if (!username) {
            alert('Username required!');
            return;
        }
        sessionStorage.setItem('username', username);
    }
    currentUser = await fetchUserByUsername(username);
    if (!currentUser) {
        alert('User not found or login failed.');
        sessionStorage.clear();
        location.reload();
        return;
    }
    document.getElementById('userAvatar').innerText = username.charAt(0).toUpperCase();
    await loadAllDataTables();
});

async function fetchUserByUsername(username) {
    // Here we ask the user for their password — in real app, replace with login.html or a modal.
    const password = sessionStorage.getItem('password') || "password123";
    const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    if (response.ok) {
        const { user } = await response.json();
        sessionStorage.setItem('userId', user.user_id);
        return user;
    }
    return null;
}

async function loadAllDataTables() {
    await Promise.all([
        loadAllStocks(),
        loadPortfolio(),
        loadWatchlist(),
        loadTransactions(),
        loadGttOrders(),
        loadUserBalance()
    ]);
    // Update top section after all data is loaded
    updateTopSectionSummary();
}

// ========== ALL STOCKS =============
async function loadAllStocks() {
    setLoading('stocksContent');
    const response = await fetch(`${API_BASE}/stocks`);
    if (!response.ok) return setEmpty('stocksContent', 'No Stocks Available');
    stocksData = await response.json();
    renderStocksTable();
    populateGTTStockSelect(); // Populate GTT modal dropdown
}

function renderStocksTable() {
    // Reuse previous style, but fields as per API
    let html = `<table class="table table-modern"><thead>
    <tr><th>Stock</th><th>Current Price</th><th>Day High</th><th>Day Low</th><th>Watchlist</th><th>Actions</th></tr>
    </thead><tbody>`;
    for (const stock of stocksData) {
        html += `<tr>
      <td>
        <div class="stock-symbol">${stock.ticker}</div>
        <div class="text-muted" style="font-size: 0.8rem;">ID: ${stock.stock_id}</div>
        <div class="stock-name">${stock.company_name}</div>
      </td>
      <td class="price-positive">₹${parseFloat(stock.current_sprice).toLocaleString()}</td>
      <td>₹${parseFloat(stock.max_sprice).toLocaleString()}</td>
      <td>₹${parseFloat(stock.min_sprice).toLocaleString()}</td>
      <td>
        <button class="btn btn-watchlist${isInWatchlist(stock.stock_id) ? ' active' : ''}"
          onclick="toggleWatchlist(${stock.stock_id})">
          <i class="fas ${isInWatchlist(stock.stock_id) ? 'fa-star' : 'fa-star-o'}"></i>
        </button>
      </td>
      <td>
        <button class="btn btn-action btn-buy" onclick="openTradeModal(${stock.stock_id}, 'BUY')">
          <i class="fas fa-arrow-up me-1"></i>Buy
        </button>
        <button class="btn btn-action btn-sell" onclick="openTradeModal(${stock.stock_id}, 'SELL')">
          <i class="fas fa-arrow-down me-1"></i>Sell
        </button>
        <button class="btn btn-action" style="background: linear-gradient(135deg, #6610f2, #17a2b8); color: white;" 
          onclick="openGTTModal(${stock.stock_id})">
          <i class="fas fa-clock me-1"></i>GTT
        </button>
      </td></tr>`;
    }
    html += '</tbody></table>';
    document.getElementById('stocksContent').innerHTML = html;
}
function updatePortfolioSummary() {
    if (!portfolio.length) {
        document.getElementById('portfolioValue').textContent = '₹0';
        document.getElementById('totalProfitLoss').textContent = '₹0';
        return;
    }

    // Calculate total portfolio value and P&L
    let totalValue = 0;
    let totalPnL = 0;

    for (const holding of portfolio) {
        const currentValue = (holding.quantity || 0) * (holding.current_price || 0);
        const pnl = holding.profit_loss || (currentValue - (holding.net_investment || 0));

        totalValue += currentValue;
        totalPnL += pnl;
    }

    // Update the correct elements
    document.getElementById('portfolioValue').textContent = `₹${Number(totalValue).toLocaleString()}`;
    document.getElementById('totalProfitLoss').textContent = `₹${Number(totalPnL).toLocaleString()}`;
    document.getElementById('totalProfitLoss').className = `stats-value ${totalPnL >= 0 ? 'text-success' : 'text-danger'}`;
}




// ========== PORTFOLIO ===========
async function loadPortfolio() {
    setLoading('portfolioContent');
    const userId = sessionStorage.getItem('userId');
    const response = await fetch(`${API_BASE}/portfolio/${userId}`);
    if (!response.ok) return setEmpty('portfolioContent', 'No Holdings');
    portfolio = await response.json();
    renderPortfolioTable();
    updatePortfolioSummary(); // Add this line
}

function renderPortfolioTable() {
    if (!portfolio.length) return setEmpty('portfolioContent', 'No Holdings');
    
    let html = `<table class="table table-modern">
        <thead>
            <tr>
                <th>Stock</th>
                <th>Quantity</th>
                <th>Current Price</th>
                <th>Current Value</th>
                <th>P&L</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>`;
    
    for (const p of portfolio) {
        const pnlClass = p.profit_loss >= 0 ? 'price-positive' : 'price-negative';
        const pnlIcon = p.profit_loss >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
        
        html += `<tr>
            <td>
                <div class="stock-symbol">${p.ticker}</div>
                <div class="stock-name">${p.company_name}</div>
            </td>
            <td class="fw-bold">${p.quantity}</td>
            <td class="fw-bold">₹${Number(p.current_price || 0).toLocaleString()}</td>
            <td class="fw-bold">₹${Number(p.current_value || 0).toLocaleString()}</td>
            <td class="${pnlClass}">
                <i class="fas ${pnlIcon} me-1"></i>
                ₹${Number(Math.abs(p.profit_loss || 0)).toLocaleString()}
            </td>
            <td>
                <button class="btn btn-action btn-sell" onclick="openTradeModal(${p.stock_id}, 'SELL')">
                    <i class="fas fa-arrow-down me-1"></i>Sell
                </button>
                <button class="btn btn-action btn-buy" onclick="openTradeModal(${p.stock_id}, 'BUY')">
                    <i class="fas fa-arrow-up me-1"></i>Buy More
                </button>
            </td>
        </tr>`;
    }
    
    html += '</tbody></table>';
    document.getElementById('portfolioContent').innerHTML = html;
}

function updateWatchlistCount() {
    // Update watchlist count in top section
    document.getElementById('watchlistCount').textContent = watchlist.length;

    const watchlistCountElement = document.querySelector('.watchlist-count');
    if (watchlistCountElement) {
        watchlistCountElement.textContent = watchlist.length;
    }

    // Alternative selector if the element has different class/id
    const altWatchlistElement = document.querySelector('[data-watchlist-count]');
    if (altWatchlistElement) {
        altWatchlistElement.textContent = watchlist.length;
    }
}

// ========== WATCHLIST ===========
async function loadWatchlist() {
    setLoading('watchlistContent');
    const userId = sessionStorage.getItem('userId');
    const response = await fetch(`${API_BASE}/watchlist/${userId}`);
    if (!response.ok) return setEmpty('watchlistContent', 'No Watchlist Items');
    watchlist = await response.json();
    renderWatchlistTable();
    updateWatchlistCount(); // Add this line
}




function renderWatchlistTable() {
    if (!watchlist.length) return setEmpty('watchlistContent', 'No Watchlist Items');
    let html = `<table class="table table-modern"><thead>
        <tr><th>Stock</th><th>Current Price</th><th>Actions</th></tr></thead><tbody>`;
    for (const w of watchlist) {
        html += `<tr>
          <td><div class="stock-symbol">${w.ticker}</div>
              <div class="stock-name">${w.company_name}</div></td>
          <td>₹${Number(w.current_sprice || 0).toLocaleString()}</td>
          <td>
            <button class="btn btn-action btn-buy" onclick="openTradeModal(${w.stock_id}, 'BUY')">
              <i class="fas fa-arrow-up me-1"></i>Buy
            </button>
            <button class="btn btn-action btn-sell" onclick="openTradeModal(${w.stock_id}, 'SELL')">
              <i class="fas fa-arrow-down me-1"></i>Sell
            </button>
            <button class="btn btn-action" style="background: linear-gradient(135deg, #dc3545, #fd7e14); color: white;"
              onclick="removeFromWatchlist(${w.stock_id})">
              <i class="fas fa-trash me-1"></i>Remove
            </button>
          </td>
        </tr>`;
    }
    html += '</tbody></table>';
    document.getElementById('watchlistContent').innerHTML = html;
}
function isInWatchlist(stockId) {
    return watchlist.some(w => w.stock_id == stockId);
}
async function toggleWatchlist(stockId) {
    const userId = sessionStorage.getItem('userId');
    const inList = isInWatchlist(stockId);
    await fetch(`${API_BASE}/watchlist/${inList ? 'remove' : 'add'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: Number(userId), stock_id: Number(stockId) })
    });
    await loadAllStocks();
    await loadWatchlist();
}
async function removeFromWatchlist(stockId) {
    await toggleWatchlist(stockId);
}

// ========== TRANSACTIONS ===========
async function loadTransactions() {
    setLoading('transactionsContent');
    const userId = sessionStorage.getItem('userId');
    const response = await fetch(`${API_BASE}/transactions/${userId}`);
    if (!response.ok) return setEmpty('transactionsContent', 'No Transactions');
    transactions = await response.json();
    renderTransactionsTable();
}
function renderTransactionsTable() {
    if (!transactions.length) return setEmpty('transactionsContent', 'No Transactions');
    let html = `<table class="table table-modern"><thead>
        <tr><th>Date</th><th>Stock</th><th>Type</th><th>Quantity</th><th>Price</th><th>Total</th><th>P&amp;L</th></tr>
        </thead><tbody>`;
    for (const t of transactions) {
        html += `<tr>
          <td>${(t.transaction_time || '').split('T')[0]}</td>
          <td>${t.company_name || t.ticker || ''}</td>
          <td><span class="badge ${t.type === 'BUY' ? 'bg-success' : 'bg-danger'}">${t.type || ''}</span></td>
          <td>${t.quantity}</td>
          <td>₹${Number(t.price_at_transaction).toLocaleString()}</td>
          <td>₹${Number((t.price_at_transaction || 0) * (t.quantity || 1)).toLocaleString()}</td>
          <td>-</td>
        </tr>`;
    }
    html += '</tbody></table>';
    document.getElementById('transactionsContent').innerHTML = html;
}
// Update the loadGttOrders function to call loadGTTOrders (notice the capital letters)
async function loadGttOrders() {
    return await loadGTTOrders(); // Call the existing function
}

// Or make sure your existing loadGTTOrders function is renamed correctly
async function loadGTTOrders() {
    setLoading('gttContent');
    const userId = sessionStorage.getItem('userId');
    if (!userId) return;

    try {
        const response = await fetch(`${API_BASE}/gtt/${userId}`);
        if (!response.ok) return setEmpty('gttContent', 'No GTT Orders');
        gttOrders = await response.json();
        renderGttTable();
        updateTopSectionSummary();
    } catch (error) {
        console.error('Error loading GTT orders:', error);
        setEmpty('gttContent', 'Error loading GTT orders');
    }
}

function renderGttTable() {
    if (!gttOrders.length) return setEmpty('gttContent', 'No GTT Orders');

    // Add Create GTT button at the top
    let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="mb-0"><i class="fas fa-clock me-2"></i>GTT Orders</h5>
          <div>
            <button class="btn btn-outline-primary" onclick="loadGttOrders()">
              <i class="fas fa-refresh me-2"></i>Refresh
            </button>
            <button class="btn btn-primary ms-2" onclick="openGTTModal()">
              <i class="fas fa-plus me-2"></i>Create GTT
            </button>
          </div>
        </div>
        <table class="table table-modern">
          <thead>
            <tr><th>Stock</th><th>Action</th><th>Target Price</th><th>Quantity</th><th>Created</th><th>Actions</th></tr>
          </thead>
          <tbody>`;

    for (const gtt of gttOrders) {
        html += `<tr>
          <td>${gtt.ticker || gtt.stock_id}</td>
          <td><span class="badge ${gtt.action === 'BUY' ? 'bg-success' : 'bg-danger'}">${gtt.action}</span></td>
          <td>₹${Number(gtt.target_price).toLocaleString()}</td>
          <td>${gtt.quantity}</td>
          <td>${(gtt.created_at || '').split('T')[0]}</td>
          <td>
            <button class="btn btn-action" style="background: linear-gradient(135deg, #dc3545, #fd7e14); color: white;"
             onclick="deleteGttOrder(${gtt.gtt_id})">
             <i class="fas fa-trash me-1"></i>Cancel
            </button>
          </td>
        </tr>`;
    }

    html += '</tbody></table>';
    document.getElementById('gttContent').innerHTML = html;
}

// ========== GTT MODAL FUNCTIONS ===========
function populateGTTStockSelect() {
    const select = document.getElementById('gttStockSelect');
    if (!select) return; // Element might not exist yet
    select.innerHTML = '<option value="">Select Stock</option>';
    for (const stock of stocksData) {
        select.innerHTML += `<option value="${stock.stock_id}">${stock.ticker} - ${stock.company_name}</option>`;
    }
}

function openGTTModal(stockId = null) {
    const modal = new bootstrap.Modal(document.getElementById('gttModal'));

    // Reset form
    document.getElementById('gttForm').reset();

    // If stockId provided, pre-select the stock
    if (stockId) {
        const selectElement = document.getElementById('gttStockSelect');
        if (selectElement) {
            selectElement.value = stockId;

            // Pre-fill current price as suggestion
            const stock = stocksData.find(s => s.stock_id == stockId);
            if (stock) {
                document.getElementById('gttTargetPrice').placeholder = `Current: ₹${stock.current_sprice}`;
            }
        }
    }

    modal.show();
}

async function createGTTOrder() {
    const userId = sessionStorage.getItem('userId');
    const stockId = document.getElementById('gttStockSelect').value;
    const action = document.getElementById('gttAction').value;
    const targetPrice = document.getElementById('gttTargetPrice').value;
    const quantity = document.getElementById('gttQuantity').value;

    if (!stockId || !action || !targetPrice || !quantity) {
        alert('Please fill all fields');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/gtt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: Number(userId),
                stock_id: Number(stockId),
                action: action,
                target_price: Number(targetPrice),
                quantity: Number(quantity)
            })
        });

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('gttModal')).hide();
            await loadGttOrders();
            alert('GTT Order created successfully!');
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to create GTT order');
        }
    } catch (error) {
        console.error('Error creating GTT order:', error);
        alert('Error creating GTT order');
    }
}

async function deleteGttOrder(gttId) {
    if (!confirm('Are you sure you want to cancel this GTT order?')) return;

    try {
        const response = await fetch(`${API_BASE}/gtt/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gtt_id: gttId })
        });

        if (response.ok) {
            await loadGttOrders();
            alert('GTT Order cancelled successfully!');
        } else {
            const error = await response.json();
            alert('Failed to cancel GTT order');
        }
    } catch (error) {
        console.error('Error deleting GTT order:', error);
        alert('Error cancelling GTT order');
    }
}

// ========== WALLET ===========
async function loadUserBalance() {
    const userId = sessionStorage.getItem('userId');
    const response = await fetch(`${API_BASE}/wallet/${userId}`);
    let balance = 0;
    if (response.ok) {
        const data = await response.json();
        balance = data.balance || 0;
    }
    document.getElementById('userBalance').textContent = `₹${Number(balance).toLocaleString()}`;
    document.getElementById('totalBalance').textContent = `₹${Number(balance).toLocaleString()}`;
}

// ======= Trade =========
function openTradeModal(stockId, action) {
    // Store data for modal
    const stock = stocksData.find(s => s.stock_id == stockId);
    if (!stock) return alert('Stock not found!');
    const stockName = stock.company_name || stock.ticker;
    const modal = new bootstrap.Modal(document.getElementById('tradeModal'));
    document.getElementById('tradeModalTitle').innerText = `${action} ${stockName}`;
    document.getElementById('tradeStockName').textContent = stock.ticker;
    document.getElementById('tradeStockPrice').textContent = `Current Price: ₹${stock.current_sprice.toLocaleString()}`;
    document.getElementById('tradeQuantity').value = 1;
    document.getElementById('confirmTradeBtn').onclick = () => confirmTrade(stockId, action);
    document.getElementById('confirmTradeBtn').className = `btn ${action === 'BUY' ? 'btn-success' : 'btn-danger'}`;
    modal.show();
}

async function confirmTrade(stockId, action) {
    const userId = sessionStorage.getItem('userId');
    const quantity = Number(document.getElementById('tradeQuantity').value) || 1;
    const stock = stocksData.find(s => s.stock_id == stockId);
    if (!stock) return;
    const route = action === 'BUY' ? 'buy' : 'sell';
    await fetch(`${API_BASE}/${route}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: Number(userId), stock_id: Number(stockId), quantity })
    });
    bootstrap.Modal.getInstance(document.getElementById('tradeModal')).hide();
    await loadAllDataTables();
}

function setLoading(containerId) {
    document.getElementById(containerId).innerHTML = `
        <div class="loading"><div class="spinner"></div></div>`;
}
function setEmpty(containerId, msg) {
    document.getElementById(containerId).innerHTML = `
        <div class="empty-state"><i class="fas fa-info-circle"></i><h4>${msg}</h4></div>`;
}

// ======== REFRESH BUTTON HANDLERS =======
document.addEventListener('click', function (e) {
    if (e.target.closest('button')) {
        const btn = e.target.closest('button');
        if (btn.textContent.includes('Refresh')) {
            if (btn.closest('#stocks')) loadAllStocks();
            if (btn.closest('#portfolio')) loadPortfolio();
            if (btn.closest('#watchlist')) loadWatchlist();
            if (btn.closest('#transactions')) loadTransactions();
            if (btn.closest('#gtt')) loadGttOrders();
        }
    }
});




// ========== UPDATE ALL TOP SECTION VALUES ===========
function updateTopSectionSummary() {
    updatePortfolioSummary();
    updateWatchlistCount();

    // Update holdings count
    const holdingsCountElement = document.querySelector('.holdings-count');
    if (holdingsCountElement) {
        holdingsCountElement.textContent = portfolio.length;
    }

    // Update GTT orders count
    const gttCountElement = document.querySelector('.gtt-count');
    if (gttCountElement) {
        gttCountElement.textContent = gttOrders.length;
    }
}

// Update toggle watchlist to refresh counts
async function toggleWatchlist(stockId) {
    const userId = sessionStorage.getItem('userId');
    const inList = isInWatchlist(stockId);
    await fetch(`${API_BASE}/watchlist/${inList ? 'remove' : 'add'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: Number(userId), stock_id: Number(stockId) })
    });
    await loadAllStocks();
    await loadWatchlist(); // This will now update the count automatically
}

// Update confirmTrade to refresh portfolio values
async function confirmTrade(stockId, action) {
    const userId = sessionStorage.getItem('userId');
    const quantity = Number(document.getElementById('tradeQuantity').value) || 1;
    const stock = stocksData.find(s => s.stock_id == stockId);
    if (!stock) return;
    const route = action === 'BUY' ? 'buy' : 'sell';
    await fetch(`${API_BASE}/${route}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: Number(userId), stock_id: Number(stockId), quantity })
    });
    bootstrap.Modal.getInstance(document.getElementById('tradeModal')).hide();
    await loadAllDataTables(); // This will update everything including top section
}



// ========== WALLET FUNCTIONS ===========
async function loadUserBalance() {
  const userId = sessionStorage.getItem('userId');
  const response = await fetch(`${API_BASE}/wallet/${userId}`);
  let balance = 0;
  if (response.ok) {
    const data = await response.json();
    balance = data.balance || 0;
  }
  document.getElementById('userBalance').textContent = `₹${Number(balance).toLocaleString()}`;
  document.getElementById('totalBalance').textContent = `₹${Number(balance).toLocaleString()}`;
}

async function updateWalletBalance(amount) {
  const userId = sessionStorage.getItem('userId');
  
  if (!userId) {
    alert('User not logged in');
    return false;
  }
  
  if (!amount || amount === 0) {
    alert('Please enter a valid amount');
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE}/update-balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: Number(userId),
        amount: Number(amount)
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        // Reload balance to reflect changes
        await loadUserBalance();
        alert(result.message || 'Balance updated successfully!');
        return true;
      } else {
        alert(result.message || 'Failed to update balance');
        return false;
      }
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to update balance');
      return false;
    }
  } catch (error) {
    console.error('Error updating wallet balance:', error);
    alert('Error updating balance');
    return false;
  }
}

// Helper functions for common operations
async function addMoneyToWallet(amount) {
  if (amount <= 0) {
    alert('Amount must be positive');
    return false;
  }
  return await updateWalletBalance(Math.abs(amount));
}

async function deductMoneyFromWallet(amount) {
  if (amount <= 0) {
    alert('Amount must be positive');
    return false;
  }
  return await updateWalletBalance(-Math.abs(amount));
}

// Function to open add money modal (if you want to create one)
function openAddMoneyModal() {
  const amount = prompt('Enter amount to add to wallet:');
  if (amount && !isNaN(amount) && Number(amount) > 0) {
    addMoneyToWallet(Number(amount));
  }
}

// ...existing code...

function openAddMoneyModal() {
  const modal = new bootstrap.Modal(document.getElementById('addMoneyModal'));
  
  // Reset form
  document.getElementById('addMoneyAmount').value = '';
  
  // Update current balance display
  const currentBalance = document.getElementById('userBalance').textContent;
  document.getElementById('currentBalanceDisplay').textContent = currentBalance;
  
  modal.show();
}

async function confirmAddMoney() {
  const amount = document.getElementById('addMoneyAmount').value;
  
  if (!amount || amount <= 0) {
    alert('Please enter a valid amount');
    return;
  }
  
  const success = await addMoneyToWallet(Number(amount));
  
  if (success) {
    // Close modal and refresh balance
    bootstrap.Modal.getInstance(document.getElementById('addMoneyModal')).hide();
    await loadUserBalance();
  }
}

// ...existing code...

function openWithdrawMoneyModal() {
  const modal = new bootstrap.Modal(document.getElementById('withdrawMoneyModal'));
  
  // Reset form
  document.getElementById('withdrawMoneyAmount').value = '';
  
  // Update current balance display
  const currentBalance = document.getElementById('userBalance').textContent;
  document.getElementById('currentBalanceDisplayWithdraw').textContent = currentBalance;
  
  modal.show();
}

async function confirmWithdrawMoney() {
  const amount = document.getElementById('withdrawMoneyAmount').value;
  
  if (!amount || amount <= 0) {
    alert('Please enter a valid amount');
    return;
  }
  
  // Get current balance to check if withdrawal is possible
  const currentBalanceText = document.getElementById('userBalance').textContent;
  const currentBalance = parseFloat(currentBalanceText.replace('₹', '').replace(',', ''));
  
  if (Number(amount) > currentBalance) {
    alert('Insufficient balance! You cannot withdraw more than your current balance.');
    return;
  }
  
  // Use negative amount for withdrawal (reusing updateWalletBalance)
  const success = await updateWalletBalance(-Number(amount));
  
  if (success) {
    // Close modal and refresh balance
    bootstrap.Modal.getInstance(document.getElementById('withdrawMoneyModal')).hide();
    await loadUserBalance();
  }
}

// Optional: Update the existing helper function for clarity
async function withdrawMoneyFromWallet(amount) {
  if (amount <= 0) {
    alert('Amount must be positive');
    return false;
  }
  
  // Get current balance to check if withdrawal is possible
  const currentBalanceText = document.getElementById('userBalance').textContent;
  const currentBalance = parseFloat(currentBalanceText.replace('₹', '').replace(',', ''));
  
  if (amount > currentBalance) {
    alert('Insufficient balance!');
    return false;
  }
  
  return await updateWalletBalance(-Math.abs(amount));
}


// ...existing code...

function openWithdrawMoneyModal() {
  const modal = new bootstrap.Modal(document.getElementById('withdrawMoneyModal'));
  
  // Reset form
  document.getElementById('withdrawMoneyAmount').value = '';
  
  // Update current balance display
  const currentBalance = document.getElementById('userBalance').textContent;
  document.getElementById('currentBalanceDisplayWithdraw').textContent = currentBalance;
  
  modal.show();
}

async function confirmWithdrawMoney() {
  const amount = document.getElementById('withdrawMoneyAmount').value;
  
  if (!amount || amount <= 0) {
    alert('Please enter a valid amount');
    return;
  }
  
  // Get current balance to check if withdrawal is possible
  const currentBalanceText = document.getElementById('userBalance').textContent;
  const currentBalance = parseFloat(currentBalanceText.replace('₹', '').replace(/,/g, ''));
  
  if (Number(amount) > currentBalance) {
    alert('Insufficient balance! You cannot withdraw more than your current balance.');
    return;
  }
  
  // Use negative amount for withdrawal (reusing updateWalletBalance)
  const success = await updateWalletBalance(-Number(amount));
  
  if (success) {
    // Close modal and refresh balance
    bootstrap.Modal.getInstance(document.getElementById('withdrawMoneyModal')).hide();
    await loadUserBalance();
  }
}

// ...existing code...

// Search functionality for stocks
function filterStocks() {
  const searchTerm = document.getElementById('stockSearchInput').value.toLowerCase();
  const stockRows = document.querySelectorAll('#stocksContent tbody tr');
  
  stockRows.forEach(row => {
    const symbol = row.cells[0]?.textContent.toLowerCase() || '';
    const name = row.cells[1]?.textContent.toLowerCase() || '';
    
    if (symbol.includes(searchTerm) || name.includes(searchTerm)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// Clear search when switching tabs
document.addEventListener('DOMContentLoaded', function() {
  const tabTriggers = document.querySelectorAll('[data-bs-toggle="tab"]');
  tabTriggers.forEach(trigger => {
    trigger.addEventListener('shown.bs.tab', function(e) {
      if (e.target.id !== 'stocks-tab') {
        document.getElementById('stockSearchInput').value = '';
      }
    });
  });
});

// ...existing code...
