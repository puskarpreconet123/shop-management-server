const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { Readable } = require('stream');

const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary with env credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'freshmart/products',
    allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
  },
});

const upload = multer({ storage: storage });

/**
 * Upload a Buffer (from multer memoryStorage) to Cloudinary.
 * Returns { url, publicId }
 */
const uploadBuffer = (buffer, mimetype) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'freshmart/products',
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    // Convert Buffer to a readable stream and pipe into Cloudinary
    Readable.from(buffer).pipe(stream);
  });
};

/**
 * Upload a base64 data URI (camera capture) directly to Cloudinary.
 * Returns { url, publicId }
 */
const uploadBase64 = async (base64DataUri) => {
  const result = await cloudinary.uploader.upload(base64DataUri, {
    folder: 'freshmart/products',
    transformation: [
      { width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
    ],
  });
  return { url: result.secure_url, publicId: result.public_id };
};

/**
 * Delete an image from Cloudinary by its public_id.
 * Safe to call with null/undefined — does nothing.
 */
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

module.exports = { cloudinary, upload, uploadBuffer, uploadBase64, deleteFromCloudinary };