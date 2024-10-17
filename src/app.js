const express = require('express');
const routes = require('./routes');

const app = express();

app.use(express.json());

// Use routes
app.use('/api', routes);

module.exports = app;