const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { spawn } = require('child_process');

// Handle file upload:
const fileUpload = require('express-fileupload');
router.use(fileUpload());

// Upload video route
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

// // Transcode video route
// router.post('/transcode', (req, res) => {
//   const { filename, format } = req.body;
//   const inputPath = path.join(__dirname, '../uploads/', filename);
//   const outputPath = path.join(__dirname, '../transcoded/', `${path.parse(filename).name}.${format}`);

//   const ffmpegProcess = ffmpeg(inputPath)
//       .toFormat(format)
//       .on('progress', progress => {
//           // Log progress to see it on the server-side
//           console.log(`Processing: ${progress.percent}% done`);
//       })
//       .on('end', () => {
//           res.send('Transcoding finished!');
//       })
//       .on('error', err => {
//           res.status(500).send(`Error: ${err.message}`);
//       })
//       .save(outputPath);
// });
const progressStore = {};

router.post('/transcode', (req, res) => {
    const { filename, format } = req.body;
    const inputPath = path.join(__dirname, '../uploads/', filename);
    const outputPath = path.join(__dirname, '../transcoded/', `${path.parse(filename).name}.${format}`);

    const jobId = filename;

    progressStore[jobId] = 0; 

    ffmpeg(inputPath)
        .toFormat(format)
        .on('progress', progress => {
            progressStore[jobId] = progress.percent;
        })
        .on('end', () => {
            progressStore[jobId] = 100;
            res.status(200).send('Transcoding finished!');
        })
        .on('error', err => {
            delete progressStore[jobId];
            res.status(500).send(`Error: ${err.message}`);
        })
        .save(outputPath);
});

// Route to get transcoding progress
router.get('/transcode/progress/:jobId', (req, res) => {
    const jobId = req.params.jobId;
    const progress = progressStore[jobId] || 0; // Return 0 if no progress is available yet
    res.json({ progress });
});



// Download video route
router.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const uploadPath = path.join(__dirname, '../uploads', filename);
    const transcodedPath = path.join(__dirname, '../transcoded', filename);
  
    // Check if the file exists in the uploads or transcoded directory
    if (fs.existsSync(uploadPath)) {
      res.download(uploadPath);
    } else if (fs.existsSync(transcodedPath)) {
      res.download(transcodedPath);
    } else {
      res.status(404).send('File not found');
    }
  });

  // List uploaded files route
  router.get('/files', (req, res) => {
    const uploadedFiles = fs.readdirSync(path.join(__dirname, '../uploads'));
    const transcodedFiles = fs.readdirSync(path.join(__dirname, '../transcoded'));

    res.json({
        uploadedFiles: uploadedFiles.map(file => ({ filename: file })),
        transcodedFiles: transcodedFiles.map(file => ({ filename: file }))
    });
});

  

module.exports = router;