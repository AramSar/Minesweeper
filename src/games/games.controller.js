const express = require('express');
const router = express.Router();
const games = require('./games.service');
const asyncHandler = require('express-async-handler');

router.post('/', asyncHandler(async (req, res) => {
    const result = await games.create(req.user.id, req.body.difficulty);

    res.json(result);
}))

router.patch('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const cell = req.body;
    const result = await games.openCell(id, req.user.id, cell);

    res.json(result);
}));

router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = games.getFullBoard(id);

    res.json(result);
}));

module.exports = router;