const mysql = require("mysql2/promise");
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    dialect: "mysql",
    host: process.env.DB_HOST,
    timezone: "+05:30",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
  },
);

async function connectDB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    console.log("MySQL Connected");

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`,
    );
    console.log("Database ready");

    await connection.query(`USE ${process.env.DB_NAME}`);
    console.log(`Using ${process.env.DB_NAME} 🚀`);

    return connection;
  } catch (error) {
    console.error("Database Error:", error.message);
    throw error;
  }
}

module.exports = { connectDB, sequelize };
