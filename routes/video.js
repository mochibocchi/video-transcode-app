const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { spawn } = require('child_process');
const progressStore = {};

// Handle file upload:
const fileUpload = require('express-fileupload');
router.use(fileUpload());

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const BUCKET_NAME = 'n10526889-assessment-2';

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

router.post('/transcode', (req, res) => {
  const { filename, format } = req.body;
  const inputPath = path.join(__dirname, '../uploads/', filename);
  const outputPath = path.join(__dirname, '../transcoded/', `${path.parse(filename).name}.${format}`);

  const jobId = filename;

  progressStore[jobId] = 0;

  // Send an initial response to the client immediately
  res.status(202).json({ message: 'Transcoding started', jobId });

  ffmpeg(inputPath)
      .toFormat(format)
      .on('progress', progress => {
          console.log(`Processing: ${progress.percent}% done`);
          progressStore[jobId] = progress.percent;
      })
      .on('end', () => {
          console.log(`Transcoding complete for ${jobId}`);
          progressStore[jobId] = 100;
      })
      .on('error', err => {
          console.error(`Error during transcoding: ${err.message}`);
          delete progressStore[jobId];
      })
      .save(outputPath);
});


// Endpoint to get transcoding progress
router.get('/transcode/progress/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  const progress = progressStore[jobId] || 0; 
  
  // Disable caching
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
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

// Route to generate pre-signed URL for uploading video
router.get('/upload-url', (req, res) => {
  const { filename, fileType } = req.query;

  const params = {
      Bucket: BUCKET_NAME,
      Key: filename,
      Expires: 60, // URL expiration time (in seconds)
      ContentType: fileType,
      ACL: 'public-read'
  };

  s3.getSignedUrl('putObject', params, (err, url) => {
      if (err) {
          console.error('Error generating signed URL', err);
          return res.status(500).json({ error: 'Error generating signed URL' });
      }
      res.json({ uploadURL: url });
  });
});

// Route to generate pre-signed URL for downloading video
router.get('/download-url', (req, res) => {
  const { filename } = req.query;

  const params = {
      Bucket: BUCKET_NAME,
      Key: filename,  
      Expires: 60     // URL expiration time (in seconds)
  };

  s3.getSignedUrl('getObject', params, (err, url) => {
      if (err) {
          console.error('Error generating download URL', err);
          return res.status(500).json({ error: 'Error generating download URL' });
      }
      res.json({ downloadURL: url });
  });
});


module.exports = router;