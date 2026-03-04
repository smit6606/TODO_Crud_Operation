require("dotenv").config();
const { Sequelize } = require("sequelize");

// Initialize connection directly to the live Railway DB URL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "mysql",
  logging: console.log,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function syncRailwayDB() {
  try {
    console.log("Connecting to Railway Database...");
    await sequelize.authenticate();
    console.log("Connection OK.");
    
    console.log("Loading models...");
    require("./src/models/user");
    require("./src/models/todo");

    console.log("Syncing schemas with alter: true...");
    // This forcibly reads the models in code and applies changes (new columns, modifications) to the live DB
    await sequelize.sync({ alter: true });
    
    console.log("✅ Railway Database schema successfully updated!");
  } catch (err) {
    console.error("❌ Failed to update Railway database schema:", err);
  } finally {
    await sequelize.close();
  }
}

syncRailwayDB();
