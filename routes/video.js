const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

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

// Transcode video route
router.post('/transcode', (req, res) => {
    const { filename, format } = req.body;
    const inputPath = path.join(__dirname, '../uploads/', filename);
    const outputPath = path.join(__dirname, '../transcoded/', `${path.parse(filename).name}.${format}`);
  
    ffmpeg(inputPath)
      .toFormat(format)
      .on('end', () => {
        res.send('Transcoding finished!');
      })
      .on('error', err => {
        res.status(500).send(`Error: ${err.message}`);
      })
      .save(outputPath);
  });

module.exports = router;