// server.js
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cached MongoDB connection for serverless
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// Schema
const reportSchema = new mongoose.Schema({
  lat: Number,
  long: Number,
  comment: String,
  imageUrl: String,
  timestamp: { type: Date, default: Date.now },
});
const Report = mongoose.models.Report || mongoose.model("Report", reportSchema);

// Multer storage (Cloudinary)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "disaster-reports",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});
const upload = multer({ storage });

// Routes
app.get("/", (req, res) => {
  res.status(200).json({ status: "OK", message: "Backend running on Vercel" });
});

app.post("/api/reports", upload.single("image"), async (req, res) => {
  try {
    await connectDB();

    const { lat, long, comment } = req.body;
    const imageUrl = req.file?.path || null; // Cloudinary secure URL

    const newReport = new Report({ lat, long, comment, imageUrl });
    await newReport.save();

    res.status(201).json({ message: "Report submitted successfully" });
  } catch (err) {
    console.error("❌ Report submission error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Export app for Vercel serverless
module.exports = app;
