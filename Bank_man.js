require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors()); // Allow requests from all origins for now, adjust as needed
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
    3

    
  }
}

// Endpoint to add an account
app.post('/accounts', async (req, res) => {
  const { Acc_no, Name_emp, balance } = req.body;

  // Check for valid data before inserting
  if (!Acc_no || Acc_no <= 0 || !Name_emp || balance <= 0) {
    return res.status(400).send('Invalid account details');
  }

  try {
    const connection = await connectToDatabase();
    const sql = 'INSERT INTO accc (Acc_no, Name_emp, balance) VALUES (?, ?, ?)';
    await connection.query(sql, [Acc_no, Name_emp, balance]);
    console.log('Account added successfully');
    res.send('Account added successfully');
  } catch (error) {
    console.error('Error adding account:', error);
    res.status(500).send('Error adding account');
  }
});

// Endpoint to fetch all accounts
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

// Endpoint to search for accounts
app.get('/accounts/search', async (req, res) => {
  const searchTerm = req.query.searchTerm;
  try {
    const connection = await connectToDatabase();
    const sql = 'SELECT * FROM accc WHERE Acc_no = ? OR Name_emp = ?';
    const [rows] = await connection.query(sql, [searchTerm, searchTerm]); // Both conditions use the same search term
    if (rows.length === 0) {
      res.json([]);
    } else {
      res.json(rows);
    }
  } catch (error) {
    console.error('Error searching accounts:', error);
    res.status(500).send('Error searching accounts');
  }
});

// Endpoint to delete an account
app.delete('/accounts/:acc_no', async (req, res) => {
  const acc_no = parseInt(req.params.acc_no);

  // Check if 'acc_no' is a valid number
  if (isNaN(acc_no)) {
    return res.status(400).json({ success: false, message: 'Invalid account number' });
  }

  try {
    const connection = await connectToDatabase();
    const sql = 'DELETE FROM accc WHERE Acc_no = ?';
    const [result] = await connection.query(sql, [acc_no]);

    if (result.affectedRows === 1) {
      res.json({ success: true, message: 'Account deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Account not found' });
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).send('Internal server error');
  }
});

// Endpoint to update an account
app.put('/accounts/:acc_No', async (req, res) => {
  const accNo = parseInt(req.params.acc_No, 10);

  if (!isNaN(accNo)) {
    const newName = req.body.newName;

    if (newName) {
      const sql = 'UPDATE accc SET Name_emp = ? WHERE Acc_no = ?';
      const values = [newName, accNo];

      try {
        const connection = await connectToDatabase();
        await connection.query(sql, values);
        res.send({ message: 'Account updated successfully' });
      } catch (error) {
        console.error('Error updating account:', error);
        res.status(400).send({ message: 'Error updating account', error: error.message });
      }
    } else {
      res.status(400).send({ message: 'Missing required parameters' });
    }
  } else {
    res.status(400).send({ message: 'Invalid account number' });
  }
});

// Endpoint to deposit funds into an account
app.put('/accounts/:accNo/deposit', async (req, res) => {
  const accNo = parseInt(req.params.accNo);
  const amount = parseFloat(req.body.amount);

  try {
    const connection = await connectToDatabase();
    const sql = 'UPDATE accc SET balance = balance + ? WHERE Acc_no = ?';
    const [result] = await connection.query(sql, [amount, accNo]);

    if (result.affectedRows === 1) {
      res.send({ message: 'Deposit successful' });
    } else {
      res.status(404).json({ success: false, message: 'Account not found' });
    }
  } catch (error) {
    console.error('Error depositing funds:', error);
    res.status(500).send('Internal server error');
  }
});

// Endpoint to withdraw funds from an account
app.put('/accounts/:accNo/withdraw', async (req, res) => {
  const accNo = parseInt(req.params.accNo);
  const amount = parseFloat(req.body.amount);

  try {
    const connection = await connectToDatabase();
    const sql = 'UPDATE accc SET balance = balance - ? WHERE Acc_no = ? AND balance >= ?';
    const [result] = await connection.query(sql, [amount, accNo, amount]);

    if (result.affectedRows === 1) {
      res.send({ message: 'Withdrawal successful' });
    } else {
      res.status(404).json({ success: false, message: 'Account not found or insufficient balance' });
    }
  } catch (error) {
    console.error('Error withdrawing funds:', error);
    res.status(500).send('Internal server error');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
