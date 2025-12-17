const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

// Ensure env vars are loaded
dotenv.config();

console.log("🔍 CLOUDINARY CONFIG CHECK:");
console.log("   - Cloud Name:", process.env.CLOUD_NAME ? process.env.CLOUD_NAME : "❌ MISSING");
console.log("   - API Key:", process.env.CLOUD_API_KEY ? "✅ Present" : "❌ MISSING");
// Show only the first 3 characters of the secret to check if it loaded
const secret = process.env.CLOUD_API_SECRET || "";
console.log("   - API Secret (First 3 chars):", secret.length > 0 ? secret.substring(0, 3) + "..." : "❌ MISSING");
console.log("   - API Secret Length:", secret.length);

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

module.exports = cloudinary;