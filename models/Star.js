const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Star = sequelize.define('Star', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  size: {
    type: DataTypes.INTEGER
  },
  description: {
    type: DataTypes.TEXT
  }
});

module.exports = Star;