const express = require('express');
const usersController = require('../controllers/users.controller');

const router = express.Router();

router.get('/members', usersController.getMembers);

module.exports = router;
