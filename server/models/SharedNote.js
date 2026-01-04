const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const SharedNote = sequelize.define('SharedNote', {
  permission: {
    type: DataTypes.STRING,
    defaultValue: 'read' 
  }
});

module.exports = SharedNote;