const express = require('express');
const path = require('path');
const app = express();

const { sequelize } = require('./models');

const galaxyRoutes = require('./routes/galaxyRoutes');
const starRoutes = require('./routes/starRoutes');
const planetRoutes = require('./routes/planetRoutes');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Star Tracker Library</title>
      <link rel="stylesheet" href="/style.css" />
    </head>
    <body>
      <main class="container">
        <section class="hero">
          <h1>Star Tracker Library</h1>
          <p>Manage galaxies, stars, and planets from the browser or with JSON API requests.</p>
          <div class="nav-links">
            <a href="/galaxies">Galaxies</a>
            <a href="/stars">Stars</a>
            <a href="/planets">Planets</a>
          </div>
        </section>
      </main>
    </body>
    </html>
  `);
});

app.use('/galaxies', galaxyRoutes);
app.use('/stars', starRoutes);
app.use('/planets', planetRoutes);

// alter:true helps add the new image column without dropping your existing tables.
sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced');

  app.listen(3000, () => {
    console.log('Server running on port 3000');
  });
});