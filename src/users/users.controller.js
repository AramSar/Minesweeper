const express = require('express');
const router = express.Router();
const users = require('./users.service');
const asyncHandler = require('express-async-handler');


router.get('/leaderbord/:mode', asyncHandler(async (req, res) => {
    const { mode } = req.params;
    const result = await users.findAll(mode);
    res.json(result);
}))

router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await users.findOne(id);
    res.json(result);
}))

router.post('/', asyncHandler(async (req, res) => {
    const body = req.body;
    const result = await users.create(body);
    res.status(201).json(result);
}))

router.delete('/:id', asyncHandler(async (req, res) => {
    const {id} = req.params;
    const result = await users.delete(id);
    res.json(result);
}))

module.exports = router;