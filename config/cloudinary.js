const uploadToCloud = async function (localFilePath) {
  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: "public", // Specify the folder in Cloudinary
      public_id: localFilePath.split(".")[0], // Specify the public ID for the uploaded file
      overwrite: true,
      unique_filename: true
    });
    fs.unlinkSync(localFilePath); // Remove file from local uploads folder
    return {
      message: "Success",
      url: result.secure_url
    };
  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error);
    return { message: "Upload Fail" };
  }
};

module.exports = uploadToCloud;
