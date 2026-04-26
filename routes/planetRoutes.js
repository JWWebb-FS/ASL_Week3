const express = require('express');
const router = express.Router();

const { Planet, Star } = require('../models');

// CREATE
router.post('/', async (req, res) => {
  try {
    const planet = await Planet.create(req.body);
    res.json(planet);
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET ALL
router.get('/', async (req, res) => {
  try {
    const planets = await Planet.findAll({
      include: Star
    });
    res.json(planets);
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET ONE
router.get('/:id', async (req, res) => {
  try {
    const planet = await Planet.findByPk(req.params.id, {
      include: Star
    });
    res.json(planet);
  } catch (err) {
    res.status(500).json(err);
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    await Planet.update(req.body, {
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
    await Planet.destroy({
      where: { id: req.params.id }
    });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;