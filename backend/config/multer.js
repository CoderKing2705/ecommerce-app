import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
const createUploadDirs = () => {
    const dirs = [
        'uploads',
        'uploads/reviews',
        'uploads/products',
        'uploads/users',
        'uploads/profile'
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

createUploadDirs();

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = 'uploads/';

        // Determine folder based on route
        if (req.originalUrl.includes('upload-profile-image')) {
            uploadPath += 'profile/';
        } else if (req.originalUrl.includes('/reviews')) {
            uploadPath += 'reviews/';
        } else if (req.originalUrl.includes('/products')) {
            uploadPath += 'products/';
        } else if (req.originalUrl.includes('/users')) {
            uploadPath += 'users/';
        } else {
            uploadPath += 'general/';
        }

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: timestamp-randomnumber-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, 'image-' + uniqueSuffix + fileExtension);
    }
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
        files: 5 // Max 5 files per upload
    }
});

// Custom error handling middleware for multer
export const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large. Maximum size is 5MB.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Too many files. Maximum 5 files allowed.'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                error: 'Unexpected field name for file upload.'
            });
        }
    } else if (error) {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
    next();
};

export default upload;