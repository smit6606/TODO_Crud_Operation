require("dotenv").config();
const cloudinary = require("./src/config/cloudinary");
const { uploadCloudinaryBuffer } = require("./src/utils/cloudinaryHelper");
const fs = require("fs");

async function testCloudinary() {
    try {
        console.log("Testing Cloudinary with keys:", process.env.CLOUD_NAME ? "PRESENT" : "MISSING");
        // Create a fake tiny 1px transparent png buffer
        const buffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
        
        console.log("Uploading buffer...");
        const result = await uploadCloudinaryBuffer(buffer);
        console.log("Upload Success! URL:", result.secure_url);
    } catch (e) {
        console.error("Upload Failed! Error:", e.message || e);
    }
}

testCloudinary();
