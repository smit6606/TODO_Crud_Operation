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

module.exports = {
    deleteCloudinaryImage,
};
