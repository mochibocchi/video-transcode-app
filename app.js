const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/video');

app.use('/auth', authRoutes);
app.use('/video', videoRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/transcoded', express.static(path.join(__dirname, 'transcoded')));

// Redirect root to the login page
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: "ASIA5DYSEEJ45BCRJC5H",
    secretAccessKey: "AyhibQAVIR1uxQ3vkdReBL7K71UsdcgCfxbnLmwQ",
    region: 'ap-southeast-2'
});

const s3 = new AWS.S3();