require("dotenv").config();
const mysql = require("mysql2/promise");

async function testConnection() {
  console.log("Connecting using:", process.env.DATABASE_URL.substring(0, 30) + "...");
  try {
    const connection = await mysql.createConnection({
      uri: process.env.DATABASE_URL,
      ssl: {
          rejectUnauthorized: false
      }
    });
    console.log("MySQL Base connection successful!");
    
    // Check tables
    const [rows] = await connection.query("SHOW TABLES");
    console.log("Tables:", rows);

    await connection.end();
  } catch (err) {
    console.error("Connection failed:", err.message);
  }
}
testConnection();
