const cloudinary = require("../config/cloudinary");

const deleteCloudinaryImage = async (imageUrl) => {
    if (!imageUrl || !imageUrl.includes("/upload/")) return;

    try {
        const uploadStr = "/upload/";
        const uploadIdx = imageUrl.indexOf(uploadStr);
        const publicId = imageUrl.substring(
            imageUrl.indexOf("/", uploadIdx + uploadStr.length) + 1,
            imageUrl.lastIndexOf(".")
        );

        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
    }
};

const uploadCloudinaryBuffer = (buffer, folder = "User and Todo Crud") => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
};

module.exports = {
    deleteCloudinaryImage,
    uploadCloudinaryBuffer,
};
