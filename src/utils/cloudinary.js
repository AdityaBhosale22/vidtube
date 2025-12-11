import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
import dotenv from "dotenv"

// Load env variables
dotenv.config()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        // file has been uploaded successfully
        console.log("File uploaded on cloudinary sucessfully. URL: " + response.url);
        
        // Remove the local file
        fs.unlinkSync(localFilePath)
        
        // FIX 2: Return the actual Cloudinary response object
        return response;

    } catch (error) {
        // Remove the local file if operation failed
        fs.unlinkSync(localFilePath)
        
        return null;
    }
}

const deleteFromCloudinary = async (publicId) => {
    try {
        if(!publicId) return null; // Safety check

        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: "auto"
        })
        console.log("File deleted from cloudinary. Public ID: " + publicId);
    } catch (error) {
        console.log("Error deleting file from cloudinary. Public ID: " + publicId, error);
    }
}

export { uploadOnCloudinary, deleteFromCloudinary }