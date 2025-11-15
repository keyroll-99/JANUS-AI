import multer from 'multer';
import path from 'path';
import fs from 'fs';

/**
 * Multer configuration for file uploads
 * Used for importing transaction data from Excel files
 */

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Multer storage configuration
 * Stores uploaded files in memory for immediate processing
 * Files are not saved to disk to avoid cleanup overhead
 */
export const storage = multer.memoryStorage();

/**
 * File filter for Excel files only
 * Accepts .xlsx and .xls files
 */
export const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
): void => {
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ];

  const allowedExtensions = ['.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    callback(null, true);
  } else {
    callback(
      new Error(
        'Invalid file type. Only Excel files (.xlsx, .xls) are allowed.'
      )
    );
  }
};

/**
 * Multer configuration for transaction imports
 * - Max file size: 10MB
 * - Memory storage (no disk writes)
 * - Excel files only
 */
export const uploadConfig = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 1, // Only one file at a time
  },
});
