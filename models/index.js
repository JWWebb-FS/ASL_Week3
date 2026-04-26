const sequelize = require('../config/database');

const Galaxy = require('./Galaxy');
const Star = require('./Star');
const Planet = require('./Planet');

// Galaxy -> Star (1 to many)
Galaxy.hasMany(Star);
Star.belongsTo(Galaxy);

// Star <-> Planet (many to many)
Star.belongsToMany(Planet, { through: 'StarsPlanets' });
Planet.belongsToMany(Star, { through: 'StarsPlanets' });

module.exports = {
  sequelize,
  Galaxy,
  Star,
  Planet
};