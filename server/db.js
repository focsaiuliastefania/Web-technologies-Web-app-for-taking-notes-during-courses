const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('notes_db', 'postgres', '1', {
  host: 'localhost',
  dialect: 'postgres', 
  port: 5432,
  logging: false
});

module.exports = sequelize;