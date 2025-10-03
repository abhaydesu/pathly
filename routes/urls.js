const express = require('express');
const { nanoid } = require('nanoid');
const Url = require('../models/url');

const router = express.Router();

router.post('/shorten', async (req, res) => {
    const { originalUrl } = req.body;

    if (!originalUrl) {
        return res.status(400).json({ error: 'Original URL is required'});
    }

    try { 
        let url = await Url.findOne({ originalUrl });

        if (url) {
            res.json(url);
        } else {
            const shortId = nanoid(7);

            url = new Url({
                originalUrl,
                shortId,
            });

            await url.save();
            res.status(201).json(url);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error '});
    }
})

module.exports = router;