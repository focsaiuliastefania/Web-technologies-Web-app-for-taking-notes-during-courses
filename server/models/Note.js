const { DataTypes } = require('sequelize');
const sequelize = require('../db'); 

const Note = sequelize.define('Note', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  attachmentUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tags: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = Note;