const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();

// Configure Cloudinary using env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB Atlas using env var
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Atlas connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Report Schema
const reportSchema = new mongoose.Schema({
  lat: Number,
  long: Number,
  comment: String,
  imageUrl: String, // Cloudinary URL
  timestamp: { type: Date, default: Date.now },
});

const Report = mongoose.model('Report', reportSchema);

// Multer storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'disaster-reports',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});
const upload = multer({ storage });

// Route to submit report
app.post('/api/reports', upload.single('image'), async (req, res) => {
  try {
    const { lat, long, comment } = req.body;
    const imageUrl = req.file ? req.file.path : null;

    const newReport = new Report({ lat, long, comment, imageUrl });
    await newReport.save();

    res.status(201).json({ message: 'Report submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = app;