const express = require('express');
const connectDB = require('./db');
require('dotenv').config();

connectDB;
const app = express();

const PORT = process.env.PORT || 3124;

app.get('/', (req, res) => {
    res.send('Hello from Pathly API!')
})

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`)
})