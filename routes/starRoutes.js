const express = require('express');
const multer = require('multer');
const router = express.Router();

const { Star, Galaxy, Planet } = require('../models');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replaceAll(' ', '-'));
  }
});

const upload = multer({ storage });

function wantsJson(req) {
  return req.headers['content-type'] === 'application/json' ||
    req.headers.accept?.includes('application/json') ||
    req.query.format === 'json';
}

function pageLayout(title, body) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
      <link rel="stylesheet" href="/style.css" />
    </head>
    <body>
      <main class="container">
        <div class="nav-links">
          <a href="/">Home</a>
          <a href="/galaxies">Galaxies</a>
          <a href="/stars">Stars</a>
          <a href="/planets">Planets</a>
        </div>
        ${body}
      </main>
    </body>
    </html>
  `;
}

// CREATE
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const star = await Star.create({
      name: req.body.name,
      size: req.body.size || null,
      description: req.body.description || null,
      GalaxyId: req.body.GalaxyId || null,
      image: req.file ? req.file.filename : req.body.image || null
    });

    if (wantsJson(req)) {
      return res.status(201).json(star);
    }

    res.redirect('/stars');
  } catch (err) {
    if (wantsJson(req)) {
      return res.status(500).json({ error: err.message });
    }
    res.status(500).send(pageLayout('Error', `<h1>Error creating star</h1><p>${err.message}</p>`));
  }
});

// GET ALL
router.get('/', async (req, res) => {
  try {
    const stars = await Star.findAll({ include: [Galaxy, Planet] });
    const galaxies = await Galaxy.findAll();

    if (wantsJson(req)) {
      return res.status(200).json(stars);
    }

    const galaxyOptions = galaxies.map((galaxy) => `
      <option value="${galaxy.id}">${galaxy.name}</option>
    `).join('');

    const cards = stars.map((star) => `
      <article class="card">
        ${star.image ? `<img class="item-image" src="/uploads/${star.image}" alt="${star.name}" />` : ''}
        <h3>${star.name}</h3>
        <p class="small-text">Size: ${star.size || 'Not listed'}</p>
        <p class="small-text">Galaxy: ${star.Galaxy ? star.Galaxy.name : 'Not assigned'}</p>
        <p>${star.description || 'No description added.'}</p>
        <div class="actions">
          <a href="/stars/${star.id}">View / Edit</a>
          <form method="POST" action="/stars/${star.id}/delete">
            <button class="danger" type="submit">Delete</button>
          </form>
        </div>
      </article>
    `).join('');

    res.send(pageLayout('Stars', `
      <section class="hero">
        <h1>Stars</h1>
        <p>Create, view, update, and delete stars. Images upload into the uploads folder.</p>
      </section>

      <section class="panel">
        <h2>Add Star</h2>
        <form method="POST" action="/stars" enctype="multipart/form-data">
          <input name="name" placeholder="Star name" required />
          <input name="size" type="number" placeholder="Size" />
          <textarea name="description" placeholder="Description"></textarea>
          <select name="GalaxyId">
            <option value="">No galaxy selected</option>
            ${galaxyOptions}
          </select>
          <input name="image" type="file" accept="image/*" />
          <button type="submit">Create Star</button>
        </form>
      </section>

      <section class="grid">
        ${cards || '<p>No stars found.</p>'}
      </section>
    `));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ONE
router.get('/:id', async (req, res) => {
  try {
    const star = await Star.findByPk(req.params.id, { include: [Galaxy, Planet] });
    const galaxies = await Galaxy.findAll();
    const planets = await Planet.findAll();

    if (!star) {
      if (wantsJson(req)) {
        return res.status(404).json({ message: 'Star not found' });
      }
      return res.status(404).send(pageLayout('Not Found', '<h1>Star not found</h1>'));
    }

    if (wantsJson(req)) {
      return res.status(200).json(star);
    }

    const galaxyOptions = galaxies.map((galaxy) => `
      <option value="${galaxy.id}" ${star.GalaxyId === galaxy.id ? 'selected' : ''}>${galaxy.name}</option>
    `).join('');

    const planetOptions = planets.map((planet) => `
      <option value="${planet.id}">${planet.name}</option>
    `).join('');

    const linkedPlanets = star.Planets && star.Planets.length
      ? star.Planets.map((planet) => `<li>${planet.name}</li>`).join('')
      : '<li>No planets linked yet.</li>';

    res.send(pageLayout(star.name, `
      <section class="panel">
        <h1>${star.name}</h1>
        ${star.image ? `<img class="item-image" src="/uploads/${star.image}" alt="${star.name}" />` : ''}
        <form method="POST" action="/stars/${star.id}/update" enctype="multipart/form-data">
          <input name="name" value="${star.name}" required />
          <input name="size" type="number" value="${star.size || ''}" placeholder="Size" />
          <textarea name="description" placeholder="Description">${star.description || ''}</textarea>
          <select name="GalaxyId">
            <option value="">No galaxy selected</option>
            ${galaxyOptions}
          </select>
          <input name="image" type="file" accept="image/*" />
          <button type="submit">Update Star</button>
        </form>
      </section>

      <section class="panel">
        <h2>Linked Planets</h2>
        <ul>${linkedPlanets}</ul>
        <form method="POST" action="/stars/${star.id}/planets">
          <select name="planetId" required>
            <option value="">Choose planet to link</option>
            ${planetOptions}
          </select>
          <button type="submit">Link Planet</button>
        </form>
      </section>
    `));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE - JSON PUT
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = req.file.filename;

    const [updated] = await Star.update(data, { where: { id: req.params.id } });

    if (!updated) {
      return res.status(404).json({ message: 'Star not found' });
    }

    res.status(200).json({ message: 'Star updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE - HTML form POST
router.post('/:id/update', upload.single('image'), async (req, res) => {
  try {
    const data = {
      name: req.body.name,
      size: req.body.size || null,
      description: req.body.description || null,
      GalaxyId: req.body.GalaxyId || null
    };

    if (req.file) data.image = req.file.filename;

    await Star.update(data, { where: { id: req.params.id } });
    res.redirect('/stars');
  } catch (err) {
    res.status(500).send(pageLayout('Error', `<h1>Error updating star</h1><p>${err.message}</p>`));
  }
});

// DELETE - JSON DELETE
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Star.destroy({ where: { id: req.params.id } });

    if (!deleted) {
      return res.status(404).json({ message: 'Star not found' });
    }

    res.status(200).json({ message: 'Star deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE - HTML form POST
router.post('/:id/delete', async (req, res) => {
  try {
    await Star.destroy({ where: { id: req.params.id } });
    res.redirect('/stars');
  } catch (err) {
    res.status(500).send(pageLayout('Error', `<h1>Error deleting star</h1><p>${err.message}</p>`));
  }
});

// LINK Planet to Star - JSON/API style
router.post('/:starId/planets/:planetId', async (req, res) => {
  try {
    const star = await Star.findByPk(req.params.starId);
    const planet = await Planet.findByPk(req.params.planetId);

    if (!star || !planet) {
      return res.status(404).json({ message: 'Star or Planet not found' });
    }

    await star.addPlanet(planet);
    res.status(200).json({ message: 'Planet linked to star' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LINK Planet to Star - HTML form style
router.post('/:starId/planets', async (req, res) => {
  try {
    const star = await Star.findByPk(req.params.starId);
    const planet = await Planet.findByPk(req.body.planetId);

    if (!star || !planet) {
      return res.status(404).send(pageLayout('Not Found', '<h1>Star or planet not found</h1>'));
    }

    await star.addPlanet(planet);
    res.redirect(`/stars/${req.params.starId}`);
  } catch (err) {
    res.status(500).send(pageLayout('Error', `<h1>Error linking planet</h1><p>${err.message}</p>`));
  }
});

module.exports = router;
