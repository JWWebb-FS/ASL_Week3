const express = require('express');
const multer = require('multer');
const router = express.Router();

const { Galaxy, Star } = require('../models');

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
    const galaxy = await Galaxy.create({
      name: req.body.name,
      size: req.body.size || null,
      description: req.body.description || null,
      image: req.file ? req.file.filename : req.body.image || null
    });

    if (wantsJson(req)) {
      return res.status(201).json(galaxy);
    }

    res.redirect('/galaxies');
  } catch (err) {
    if (wantsJson(req)) {
      return res.status(500).json({ error: err.message });
    }
    res.status(500).send(pageLayout('Error', `<h1>Error creating galaxy</h1><p>${err.message}</p>`));
  }
});

// READ ALL
router.get('/', async (req, res) => {
  try {
    const galaxies = await Galaxy.findAll({ include: Star });

    if (wantsJson(req)) {
      return res.status(200).json(galaxies);
    }

    const cards = galaxies.map((galaxy) => `
      <article class="card">
        ${galaxy.image ? `<img class="item-image" src="/uploads/${galaxy.image}" alt="${galaxy.name}" />` : ''}
        <h3>${galaxy.name}</h3>
        <p class="small-text">Size: ${galaxy.size || 'Not listed'}</p>
        <p>${galaxy.description || 'No description added.'}</p>
        <div class="actions">
          <a href="/galaxies/${galaxy.id}">View / Edit</a>
          <form method="POST" action="/galaxies/${galaxy.id}/delete">
            <button class="danger" type="submit">Delete</button>
          </form>
        </div>
      </article>
    `).join('');

    res.send(pageLayout('Galaxies', `
      <section class="hero">
        <h1>Galaxies</h1>
        <p>Create, view, update, and delete galaxies. Images upload into the uploads folder.</p>
      </section>

      <section class="panel">
        <h2>Add Galaxy</h2>
        <form method="POST" action="/galaxies" enctype="multipart/form-data">
          <input name="name" placeholder="Galaxy name" required />
          <input name="size" type="number" placeholder="Size" />
          <textarea name="description" placeholder="Description"></textarea>
          <input name="image" type="file" accept="image/*" />
          <button type="submit">Create Galaxy</button>
        </form>
      </section>

      <section class="grid">
        ${cards || '<p>No galaxies found.</p>'}
      </section>
    `));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ ONE
router.get('/:id', async (req, res) => {
  try {
    const galaxy = await Galaxy.findByPk(req.params.id, { include: Star });

    if (!galaxy) {
      if (wantsJson(req)) {
        return res.status(404).json({ message: 'Galaxy not found' });
      }
      return res.status(404).send(pageLayout('Not Found', '<h1>Galaxy not found</h1>'));
    }

    if (wantsJson(req)) {
      return res.status(200).json(galaxy);
    }

    res.send(pageLayout(galaxy.name, `
      <section class="panel">
        <h1>${galaxy.name}</h1>
        ${galaxy.image ? `<img class="item-image" src="/uploads/${galaxy.image}" alt="${galaxy.name}" />` : ''}
        <form method="POST" action="/galaxies/${galaxy.id}/update" enctype="multipart/form-data">
          <input name="name" value="${galaxy.name}" required />
          <input name="size" type="number" value="${galaxy.size || ''}" placeholder="Size" />
          <textarea name="description" placeholder="Description">${galaxy.description || ''}</textarea>
          <input name="image" type="file" accept="image/*" />
          <button type="submit">Update Galaxy</button>
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

    const [updated] = await Galaxy.update(data, { where: { id: req.params.id } });

    if (!updated) {
      return res.status(404).json({ message: 'Galaxy not found' });
    }

    res.status(200).json({ message: 'Galaxy updated' });
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

    await Galaxy.update(data, { where: { id: req.params.id } });
    res.redirect('/galaxies');
  } catch (err) {
    res.status(500).send(pageLayout('Error', `<h1>Error updating galaxy</h1><p>${err.message}</p>`));
  }
});

// DELETE - JSON DELETE
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Galaxy.destroy({ where: { id: req.params.id } });

    if (!deleted) {
      return res.status(404).json({ message: 'Galaxy not found' });
    }

    res.status(200).json({ message: 'Galaxy deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE - HTML form POST
router.post('/:id/delete', async (req, res) => {
  try {
    await Galaxy.destroy({ where: { id: req.params.id } });
    res.redirect('/galaxies');
  } catch (err) {
    res.status(500).send(pageLayout('Error', `<h1>Error deleting galaxy</h1><p>${err.message}</p>`));
  }
});

module.exports = router;
