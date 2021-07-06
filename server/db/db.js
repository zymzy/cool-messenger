const Sequelize = require("sequelize");

const db = new Sequelize(process.env.DATABASE_URL || "postgres://localhost:5432/messenger", {
  logging: process.env.SEQUELIZE_LOGGING ?? false
});

module.exports = db;
