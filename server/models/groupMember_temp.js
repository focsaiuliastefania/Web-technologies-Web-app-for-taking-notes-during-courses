const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const GroupMember = sequelize.define('GroupMember', {
  role: {
    type: DataTypes.STRING,
    defaultValue: 'member' 
  }
});

module.exports = GroupMember;