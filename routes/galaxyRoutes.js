const express = require('express');
const router = express.Router();

const { Galaxy, Star } = require('../models');

// CREATE
router.post('/', async (req, res) => {
  try {
    const galaxy = await Galaxy.create(req.body);
    res.json(galaxy);
  } catch (err) {
    res.status(500).json(err);
  }
});

// READ ALL
router.get('/', async (req, res) => {
  try {
    const galaxies = await Galaxy.findAll({
      include: Star
    });
    res.json(galaxies);
  } catch (err) {
    res.status(500).json(err);
  }
});

// READ ONE
router.get('/:id', async (req, res) => {
  try {
    const galaxy = await Galaxy.findByPk(req.params.id, {
      include: Star
    });
    res.json(galaxy);
  } catch (err) {
    res.status(500).json(err);
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    await Galaxy.update(req.body, {
      where: { id: req.params.id }
    });
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json(err);
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await Galaxy.destroy({
      where: { id: req.params.id }
    });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;