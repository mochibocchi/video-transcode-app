const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Handle file upload:
const fileUpload = require('express-fileupload');
router.use(fileUpload());

// Upload Video route
router.post('/upload', (req, res) => {
    if (!req.files || !req.files.video) {
        return res.status(400).send('Please try again. Did not upload video.');
    }

    const video = req.files.video;
    const uploadPath = path.join(__dirname, '../uploads/', video.name);

    video.mv(uploadPath, err => {
        if (err) {
            return res.status(500).send(err);
        }
        res.send('Video uploaded successfully!');
    });
});

module.exports = router;