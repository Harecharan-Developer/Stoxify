
        //chiru2
# STOXIFY Stock Trading API Documentation

## Base URL
http://localhost:3069/api

## Database Tables Reference
From db.txt, the following tables are used:
- users: user_id, username, password, balance, total_profit_loss
- stockdata: stock_id, company_name, ticker, min_sprice, max_sprice, current_sprice, last_updated
- transactions: transaction_id, user_id, stock_id, type, quantity, price_at_transaction, transaction_time
- watchlist: user_id, stock_id
- gtt_orders: gtt_id, user_id, stock_id, target_price, action, quantity, created_at
- portfolio: user_id, stock_id, quantity, avg_buy_price

## API Endpoints

### 1. User Authentication

#### Register User
- Path: POST /register
- Input: 
  {
    "username": "string",
    "password": "string"
  }
- Output: 
  {
    "message": "User registered successfully"
  }
- Data Types: username (VARCHAR), password (VARCHAR)

#### User Login
- Path: POST /login
- Input: 
  {
    "username": "string",
    "password": "string"
  }
- Output: 
  {
    "message": "Login successful",
    "user": {
      "user_id": "number",
      "username": "string",
      "balance": "number",
      "total_profit_loss": "number"
    }
  }
- Data Types: Returns user data from users table

### 2. Wallet Management

#### Get Wallet Balance
- Path: GET /wallet/:userId
- Input: URL parameter userId (number)
- Output: 
  {
    "balance": "number"
  }
- Data Types: balance (DECIMAL(10,2))

#### Update Wallet Balance
- Path: POST /update-balance
- Input: 
  {
    "user_id": "number",
    "amount": "number"
  }
- Output: 
  {
    "success": "boolean",
    "message": "string"
  }
- Data Types: Updates balance in users table

### 3. Stock Data

#### Get All Stocks
- Path: GET /stocks
- Input: None
- Output: 
  [
    {
      "stock_id": "number",
      "company_name": "string",
      "ticker": "string",
      "min_sprice": "number",
      "max_sprice": "number",
      "current_sprice": "number",
      "last_updated": "datetime"
    }
  ]
- Data Types: Returns all columns from stockdata table

#### Get Stock by ID
- Path: GET /stocks/:id
- Input: URL parameter id (number)
- Output: 
  {
    "stock_id": "number",
    "company_name": "string",
    "ticker": "string",
    "min_sprice": "number",
    "max_sprice": "number",
    "current_sprice": "number",
    "last_updated": "datetime"
  }
- Data Types: Single record from stockdata table

### 4. Trading Operations

#### Buy Stock
- Path: POST /buy
- Input: 
  {
    "user_id": "number",
    "stock_id": "number",
    "quantity": "number"
  }
- Output: 
  {
    "message": "Stock purchased successfully"
  }
- Data Types: Creates record in transactions table, updates balance in users

#### Sell Stock
- Path: POST /sell
- Input: 
  {
    "user_id": "number",
    "stock_id": "number",
    "quantity": "number"
  }
- Output: 
  {
    "message": "Stock sold successfully"
  }
- Data Types: Creates record in transactions table, updates balance in users

### 5. Portfolio Management

#### Get User Portfolio
- Path: GET /portfolio/:userId
- Input: URL parameter userId (number)
- Output: 
  [
    {
      "stock_id": "number",
      "company_name": "string",
      "quantity": "number",
      "current_price": "number",
      "current_value": "number",
      "net_investment": "number",
      "profit_loss": "number"
    }
  ]
- Data Types: Calculated from transactions and stockdata tables

### 6. Transaction History

#### Get User Transactions
- Path: GET /transactions/:userId
- Input: URL parameter userId (number)
- Output: 
  [
    {
      "transaction_id": "number",
      "user_id": "number",
      "stock_id": "number",
      "type": "string",
      "quantity": "number",
      "price_at_transaction": "number",
      "transaction_time": "datetime",
      "company_name": "string"
    }
  ]
- Data Types: Join of transactions and stockdata tables

### 7. Watchlist Management

#### Get User Watchlist
- Path: GET /watchlist/:userId
- Input: URL parameter userId (number)
- Output: 
  [
    {
      "stock_id": "number",
      "company_name": "string",
      "ticker": "string",
      "current_sprice": "number"
    }
  ]
- Data Types: Join of watchlist and stockdata tables

#### Add to Watchlist
- Path: POST /watchlist/add
- Input: 
  {
    "user_id": "number",
    "stock_id": "number"
  }
- Output: 
  {
    "success": "boolean"
  }
- Data Types: Creates record in watchlist table

#### Remove from Watchlist
- Path: POST /watchlist/remove
- Input: 
  {
    "user_id": "number",
    "stock_id": "number"
  }
- Output: 
  {
    "success": "boolean"
  }
- Data Types: Deletes record from watchlist table

### 8. GTT (Good Till Triggered) Orders

#### Create GTT Order
- Path: POST /gtt
- Input: 
  {
    "user_id": "number",
    "stock_id": "number",
    "target_price": "number",
    "action": "string",
    "quantity": "number"
  }
- Output: 
  {
    "success": "boolean"
  }
- Data Types: action is ENUM('BUY', 'SELL'), creates record in gtt_orders table

#### Get GTT Orders
- Path: GET /gtt/:userId
- Input: URL parameter userId (number)
- Output: 
  [
    {
      "gtt_id": "number",
      "user_id": "number",
      "stock_id": "number",
      "target_price": "number",
      "action": "string",
      "quantity": "number",
      "created_at": "datetime"
    }
  ]
- Data Types: All columns from gtt_orders table

#### Delete GTT Order
- Path: POST /gtt/delete
- Input: 
  {
    "gtt_id": "number"
  }
- Output: 
  {
    "success": "boolean"
  }
- Data Types: Deletes record from gtt_orders table by gtt_id

## Error Responses
All endpoints return error responses in the format:
{
  "error": "string"
}

Common HTTP status codes:
- 400: Bad Request (missing fields, validation errors)
- 401: Unauthorized (invalid credentials)
- 404: Not Found (user/stock not found)
- 500: Internal Server Error (database errors)

## Data Type Specifications
- Numbers: All prices use DECIMAL(10,2) for precision
- IDs: All IDs are INT with AUTO_INCREMENT
- Strings: VARCHAR(255) for names, VARCHAR(20) for tickers
- Enums: type and action fields use ENUM('BUY', 'SELL')
- Timestamps: DATETIME with DEFAULT CURRENT_TIMESTAMP

## Notes
- All POST requests require Content-Type: application/json
- User authentication should be implemented for protected routes
- Error handling is implemented for all database operations
- Stock prices are managed in real-time through the stockdata table
- Portfolio calculations are done

