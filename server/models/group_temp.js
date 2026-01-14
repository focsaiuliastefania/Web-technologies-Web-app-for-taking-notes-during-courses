const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Group = sequelize.define('Group', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING
  },
  code: {
    type: DataTypes.STRING,
    unique: true,
    defaultValue: DataTypes.UUIDV4 
  }
});

module.exports = Group;