require("dotenv").config(); /* Sets up the environment variables from your .env file*/
const Sequelize = require("sequelize");

const db = new Sequelize(process.env.DATABASE_URL || "postgres://localhost:5432/messenger", {
  logging: Boolean(process.env.SEQUELIZE_LOGGING ?? false)
});

module.exports = db;
