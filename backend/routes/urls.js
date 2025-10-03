const express = require('express');
const { nanoid } = require('nanoid');
const Url = require('../models/url');
const Click = require('../models/Clicks');

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

router.get('/analytics/:shortId', async (req, res) => {
    try {
        const url = await Url.findOne({ shortId: req.params.shortId });
        if (!url) {
            return res.status(404).json({ error: 'Url not found!' });
        }

        const clicksOverTime = await Click.aggregate([
            {
                $match: { urlId: url._id}
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$timestamp'}
                    },
                    count: { $sum: 1}
                }
            },
            {
                $sort: { _id: 1},
            }
        ])

        res.json({
            totalClicks: url.clicks,
            clicksOverTime
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
})

module.exports = router;