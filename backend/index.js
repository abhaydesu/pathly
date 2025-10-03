require('dotenv').config();
const express = require('express');
const connectDB = require('./db');
const urlRoutes = require('./routes/urls')
const Url = require('./models/url');
const cors = require('cors');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3124;

app.get('/:shortId', async (req, res) => {
    try {
        const url = await Url.findOne({ shortId: req.params.shortId });

        if (url) {
            url.clicks++;
            await url.save();

            return res.redirect(url.originalUrl);
        } else {
            return res.status(404).json({ error: 'No URL found '});
        }
    } catch (error) {
        console.error(error)
        res.status(500).json({error: 'Server Error'});
    }
})

app.use('/api', urlRoutes)

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`)
})