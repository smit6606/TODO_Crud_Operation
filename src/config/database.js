const mysql = require("mysql2/promise");
const { Sequelize } = require("sequelize");

// Setup Sequelize: Use DATABASE_URL if available, otherwise fallback to separated variables
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
    dialect: "mysql",
    timezone: "+05:30",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  })
  : new Sequelize(
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
    if (process.env.DATABASE_URL) {
      // In production (Railway), the database already exists. Just test connection.
      await sequelize.authenticate();
      if (process.env.NODE_ENV !== "production") {
        console.log("Connected to Database via URL");
      }
    } else {
      // Local setup: connect via root and ensure database is created
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      });

      if (process.env.NODE_ENV !== "production") {
        console.log("MySQL Connected");
      }

      await connection.query(
        `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`,
      );
      if (process.env.NODE_ENV !== "production") {
        console.log("Database ready");
      }

      await connection.query(`USE ${process.env.DB_NAME}`);
      if (process.env.NODE_ENV !== "production") {
        console.log(`Using ${process.env.DB_NAME} 🚀`);
      }

      await connection.end(); // close raw connection since Sequelize takes over
    }
  } catch (error) {
    console.error("Database Error:", error.message);
    throw error;
  }
}

module.exports = { connectDB, sequelize };
