// server/models/Subject.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db'); 

const Subject = sequelize.define('Subject', {
  name: {
    type: DataTypes.STRING,
    allowNull: false 
  },
  professor: {
    type: DataTypes.STRING,
    allowNull: true 
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true 
  }
  
});

module.exports = Subject;