const express = require('express');
const app = express();

const { sequelize } = require('./models');

const galaxyRoutes = require('./routes/galaxyRoutes');

const starRoutes = require('./routes/starRoutes')

const planetRoutes = require('./routes/planetRoutes');

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Star Tracker API running');
});

app.use('/galaxies', galaxyRoutes);

app.use('/stars', starRoutes);

app.use('/planets', planetRoutes);

// sync DB
sequelize.sync().then(() => {
  console.log('Database synced');

  app.listen(3000, () => {
    console.log('Server running on port 3000');
  });
});