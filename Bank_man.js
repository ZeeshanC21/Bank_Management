require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
// const bcrypt = require('bcrypt');

const app = express();
const port = 4000;

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// Function to establish database connection
async function connectToDatabase() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');
    return connection;
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
}

app.post('/account-manager/login', async (req, res) => {
  const { name, password } = req.body;

  try {
    const connection = await connectToDatabase();
    const [rows] = await connection.query('SELECT password FROM account_manager WHERE name = ?', [name]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Manager not found' });
    }

    const storedPassword = rows[0].password;

    if (password === storedPassword) {
      res.json({ success: true, message: 'Login successful' });
    } else {
      res.status(401).json({ success: false, message: 'Incorrect password' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// ✅ Add Account Manager (For Setup)
app.post('/account-manager/add', async (req, res) => {
  const { name, password } = req.body;

  try {
    const connection = await connectToDatabase();
    await connection.query('INSERT INTO account_manager (name, password) VALUES (?, ?)', [name, password]);

    res.json({ success: true, message: 'Account manager added successfully' });
  } catch (error) {
    console.error('Error adding account manager:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// ✅ Fetch All Accounts
app.get('/accounts', async (req, res) => {
  try {
    const connection = await connectToDatabase();
    const [rows] = await connection.query('SELECT * FROM accc');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).send('Error fetching accounts');
  }
});

// ✅ Search for Accounts
app.get('/accounts/search', async (req, res) => {
  const searchTerm = req.query.searchTerm;
  try {
    const connection = await connectToDatabase();
    const sql = 'SELECT * FROM accc WHERE Acc_no = ? OR Name_emp = ?';
    const [rows] = await connection.query(sql, [searchTerm, searchTerm]);

    res.json(rows.length > 0 ? rows : []);
  } catch (error) {
    console.error('Error searching accounts:', error);
    res.status(500).send('Error searching accounts');
  }
});

// ✅ Add Account
app.post('/accounts', async (req, res) => {
  const { Acc_no, Name_emp, balance } = req.body;

  if (!Acc_no || Acc_no <= 0 || !Name_emp || balance <= 0) {
    return res.status(400).send('Invalid account details');
  }

  try {
    const connection = await connectToDatabase();
    const sql = 'INSERT INTO accc (Acc_no, Name_emp, balance) VALUES (?, ?, ?)';
    await connection.query(sql, [Acc_no, Name_emp, balance]);

    res.send('Account added successfully');
  } catch (error) {
    console.error('Error adding account:', error);
    res.status(500).send('Error adding account');
  }
});

// ✅ Delete Account
app.delete('/accounts/:acc_no', async (req, res) => {
  const acc_no = parseInt(req.params.acc_no);

  if (isNaN(acc_no)) {
    return res.status(400).json({ success: false, message: 'Invalid account number' });
  }

  try {
    const connection = await connectToDatabase();
    const sql = 'DELETE FROM accc WHERE Acc_no = ?';
    const [result] = await connection.query(sql, [acc_no]);

    res.json(result.affectedRows === 1
      ? { success: true, message: 'Account deleted successfully' }
      : { success: false, message: 'Account not found' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).send('Internal server error');
  }
});

// ✅ Update Account Name
app.put('/accounts/:accNo', async (req, res) => {
  const accNo = parseInt(req.params.accNo);
  const newName = req.body.newName;

  if (!isNaN(accNo) && newName) {
    try {
      const connection = await connectToDatabase();
      await connection.query('UPDATE accc SET Name_emp = ? WHERE Acc_no = ?', [newName, accNo]);

      res.send({ message: 'Account updated successfully' });
    } catch (error) {
      console.error('Error updating account:', error);
      res.status(500).send({ message: 'Error updating account' });
    }
  } else {
    res.status(400).send({ message: 'Invalid input' });
  }
});

// ✅ Deposit Funds
app.put('/accounts/:accNo/deposit', async (req, res) => {
  const accNo = parseInt(req.params.accNo);
  const amount = parseFloat(req.body.amount);

  try {
    const connection = await connectToDatabase();
    const sql = 'UPDATE accc SET balance = balance + ? WHERE Acc_no = ?';
    const [result] = await connection.query(sql, [amount, accNo]);

    res.json(result.affectedRows === 1
      ? { message: 'Deposit successful' }
      : { success: false, message: 'Account not found' });
  } catch (error) {
    console.error('Error depositing funds:', error);
    res.status(500).send('Internal server error');
  }
});

// ✅ Withdraw Funds
app.put('/accounts/:accNo/withdraw', async (req, res) => {
  const accNo = parseInt(req.params.accNo);
  const amount = parseFloat(req.body.amount);

  try {
    const connection = await connectToDatabase();
    const sql = 'UPDATE accc SET balance = balance - ? WHERE Acc_no = ? AND balance >= ?';
    const [result] = await connection.query(sql, [amount, accNo, amount]);

    res.json(result.affectedRows === 1
      ? { message: 'Withdrawal successful' }
      : { success: false, message: 'Account not found or insufficient balance' });
  } catch (error) {
    console.error('Error withdrawing funds:', error);
    res.status(500).send('Internal server error');
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
