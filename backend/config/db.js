const mysql = require('mysql2');

// Create a connection pool (better for performance)
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',        // Default XAMPP username
    password: '',        // Default XAMPP password is empty
    database: 'fundipluss',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Convert pool to use promises (so we can use async/await)
const promisePool = pool.promise();

// Test the connection
async function testConnection() {
    try {
        const [rows] = await promisePool.query('SELECT 1 + 1 AS solution');
        console.log('✅ MySQL Connected successfully');
        return true;
    } catch (error) {
        console.error('❌ MySQL Connection error:', error.message);
        return false;
    }
}

module.exports = { promisePool, testConnection };