const express = require('express');

const homeController = require('../controllers/home');

const router = express.Router();

//GET /
router.get('/', homeController.getHome);

module.exports = router;
