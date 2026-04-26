const express = require('express');
const router = express.Router();

const { Star, Galaxy, Planet } = require('../models');

// CREATE
router.post('/', async (req, res) => {
  try {
    const star = await Star.create(req.body);
    res.json(star);
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET ALL
router.get('/', async (req, res) => {
  try {
    const stars = await Star.findAll({
      include: [Galaxy, Planet]
    });
    res.json(stars);
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET ONE
router.get('/:id', async (req, res) => {
  try {
    const star = await Star.findByPk(req.params.id, {
      include: [Galaxy, Planet]
    });
    res.json(star);
  } catch (err) {
    res.status(500).json(err);
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    await Star.update(req.body, {
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
    await Star.destroy({
      where: { id: req.params.id }
    });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json(err);
  }
});

// 🔗 LINK Planet to Star (Many-to-Many)
router.post('/:starId/planets/:planetId', async (req, res) => {
  try {
    const star = await Star.findByPk(req.params.starId);
    const planet = await Planet.findByPk(req.params.planetId);

    if (!star || !planet) {
      return res.status(404).json({ message: 'Star or Planet not found' });
    }

    await star.addPlanet(planet);

    res.json({ message: 'Planet linked to star' });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;