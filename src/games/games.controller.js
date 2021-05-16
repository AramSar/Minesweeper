const express = require('express');
const router = express.Router();
const games = require('./games.service');
const asyncHandler = require('express-async-handler');

router.post('/', asyncHandler(async (req, res) => {
    const result = await games.create(req.user.userId, req.body.difficulty);

    res.json(result);
}));

router.patch('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log("Patched");
    const result = await games.openCell(id, req.user.userId, req.body);

    res.json(result);
}));

router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = games.getFullBoard(id, req.user.id);

    res.json(result);
}));

module.exports = router;