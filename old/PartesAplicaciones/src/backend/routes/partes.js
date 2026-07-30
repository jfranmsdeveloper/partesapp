const express = require('express');
const router = express.Router();
const Parte = require('../models/Parte');

// Get all partes
router.get('/', async (req, res) => {
    try {
        const partes = await Parte.find().sort({ fecha: -1 });
        res.json(partes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create parte
router.post('/', async (req, res) => {
    try {
        const parte = new Parte(req.body);
        await parte.save();
        res.status(201).json(parte);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update parte
router.put('/:id', async (req, res) => {
    try {
        const parte = await Parte.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(parte);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete parte
router.delete('/:id', async (req, res) => {
    try {
        await Parte.findByIdAndDelete(req.params.id);
        res.json({ message: 'Parte deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Stats
router.get('/stats', async (req, res) => {
    try {
        const totalPartes = await Parte.countDocuments();
        const byStatus = await Parte.aggregate([
            { $group: { _id: '$estado', count: { $sum: 1 } } }
        ]);

        // Example indicators based on Excel
        // "Total Indicadores" might be sum of specific fields or just total actions.
        // For now, let's return the status breakdown.

        res.json({
            totalPartes,
            byStatus
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
