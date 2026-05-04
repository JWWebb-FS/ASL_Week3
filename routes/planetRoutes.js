const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const { Planet, Star } = require('../models');

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

// CREATE - supports JSON and HTML form data with image upload
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const planet = await Planet.create({
      name: req.body.name,
      size: req.body.size || null,
      description: req.body.description || null,
      image: req.file ? req.file.filename : req.body.image || null
    });

    if (wantsJson(req)) {
      return res.status(201).json(planet);
    }

    res.redirect('/planets');
  } catch (err) {
    if (wantsJson(req)) {
      return res.status(500).json({ error: err.message });
    }

    res.status(500).send(pageLayout('Error', `<h1>Error creating planet</h1><p>${err.message}</p>`));
  }
});

// GET ALL
router.get('/', async (req, res) => {
  try {
    const planets = await Planet.findAll({ include: Star });

    if (wantsJson(req)) {
      return res.status(200).json(planets);
    }

    const cards = planets.map((planet) => `
      <article class="card">
        ${planet.image ? `<img class="item-image" src="/uploads/${planet.image}" alt="${planet.name}" />` : ''}
        <h3>${planet.name}</h3>
        <p class="small-text">Size: ${planet.size || 'Not listed'}</p>
        <p>${planet.description || 'No description added.'}</p>
        <div class="actions">
          <a href="/planets/${planet.id}">View / Edit</a>
          <form method="POST" action="/planets/${planet.id}/delete">
            <button class="danger" type="submit">Delete</button>
          </form>
        </div>
      </article>
    `).join('');

    res.send(pageLayout('Planets', `
      <section class="hero">
        <h1>Planets</h1>
        <p>Create, view, update, and delete planets. Images upload into the uploads folder.</p>
      </section>

      <section class="panel">
        <h2>Add Planet</h2>
        <form method="POST" action="/planets" enctype="multipart/form-data">
          <input name="name" placeholder="Planet name" required />
          <input name="size" type="number" placeholder="Size" />
          <textarea name="description" placeholder="Description"></textarea>
          <input name="image" type="file" accept="image/*" />
          <button type="submit">Create Planet</button>
        </form>
      </section>

      <section class="grid">
        ${cards || '<p>No planets found.</p>'}
      </section>
    `));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ONE
router.get('/:id', async (req, res) => {
  try {
    const planet = await Planet.findByPk(req.params.id, { include: Star });

    if (!planet) {
      if (wantsJson(req)) {
        return res.status(404).json({ message: 'Planet not found' });
      }
      return res.status(404).send(pageLayout('Not Found', '<h1>Planet not found</h1>'));
    }

    if (wantsJson(req)) {
      return res.status(200).json(planet);
    }

    res.send(pageLayout(planet.name, `
      <section class="panel">
        <h1>${planet.name}</h1>
        ${planet.image ? `<img class="item-image" src="/uploads/${planet.image}" alt="${planet.name}" />` : ''}
        <form method="POST" action="/planets/${planet.id}/update" enctype="multipart/form-data">
          <input name="name" value="${planet.name}" required />
          <input name="size" type="number" value="${planet.size || ''}" placeholder="Size" />
          <textarea name="description" placeholder="Description">${planet.description || ''}</textarea>
          <input name="image" type="file" accept="image/*" />
          <button type="submit">Update Planet</button>
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

    const [updated] = await Planet.update(data, { where: { id: req.params.id } });

    if (!updated) {
      return res.status(404).json({ message: 'Planet not found' });
    }

    res.status(200).json({ message: 'Planet updated' });
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
      description: req.body.description || null
    };

    if (req.file) data.image = req.file.filename;

    await Planet.update(data, { where: { id: req.params.id } });
    res.redirect('/planets');
  } catch (err) {
    res.status(500).send(pageLayout('Error', `<h1>Error updating planet</h1><p>${err.message}</p>`));
  }
});

// DELETE - JSON DELETE
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Planet.destroy({ where: { id: req.params.id } });

    if (!deleted) {
      return res.status(404).json({ message: 'Planet not found' });
    }

    res.status(200).json({ message: 'Planet deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE - HTML form POST
router.post('/:id/delete', async (req, res) => {
  try {
    await Planet.destroy({ where: { id: req.params.id } });
    res.redirect('/planets');
  } catch (err) {
    res.status(500).send(pageLayout('Error', `<h1>Error deleting planet</h1><p>${err.message}</p>`));
  }
});

module.exports = router;
