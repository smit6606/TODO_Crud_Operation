const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'mysql',
  logging: true,
});

async function test() {
  try {
    await sequelize.authenticate();
    console.log('Connection OK');
  } catch (error) {
    console.error('Connection ERROR:', error.message);
  } finally {
    sequelize.close();
  }
}
test();
