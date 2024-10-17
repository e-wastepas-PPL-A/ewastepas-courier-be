const express = require('express');
const router = express.Router();

const exampleController = require('../controllers/helloController');

router.get('/hello', exampleController.getHello);

module.exports = router;