const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const { v4: uuidv4 } = require('uuid');

class FileService {
    constructor() {
        // Configure multer for file uploads
        this.storage = multer.diskStorage({
            destination: async (req, file, cb) => {
                const uploadDir = path.join(__dirname, '../../uploads');
                try {
                    await fs.mkdir(uploadDir, { recursive: true });
                    cb(null, uploadDir);
                } catch (error) {
                    cb(error);
                }
            },
            filename: (req, file, cb) => {
                const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
                cb(null, uniqueName);
            }
        });

        this.upload = multer({
            storage: this.storage,
            limits: {
                fileSize: 10 * 1024 * 1024 // 10MB
            },
            fileFilter: (req, file, cb) => {
                const allowedTypes = /pdf|txt|doc|docx/;
                const extname = allowedTypes.test(
                    path.extname(file.originalname).toLowerCase()
                );
                const mimetype = allowedTypes.test(file.mimetype);

                if (extname && mimetype) {
                    return cb(null, true);
                }
                cb(new Error('Only PDF, TXT, DOC, DOCX files are allowed'));
            }
        });
    }

    /**
     * Extract text from PDF
     */
    async extractPDFText(filePath) {
        try {
            const dataBuffer = await fs.readFile(filePath);
            const data = await pdfParse(dataBuffer);
            return data.text;
        } catch (error) {
            console.error('PDF extraction error:', error);
            throw new Error('Failed to extract PDF text');
        }
    }

    /**
     * Extract text from TXT file
     */
    async extractTXTText(filePath) {
        try {
            return await fs.readFile(filePath, 'utf-8');
        } catch (error) {
            console.error('TXT extraction error:', error);
            throw new Error('Failed to extract TXT text');
        }
    }

    /**
     * Process uploaded file and extract text
     */
    async processFile(file) {
        try {
            const ext = path.extname(file.originalname).toLowerCase();
            let text = '';

            if (ext === '.pdf') {
                text = await this.extractPDFText(file.path);
            } else if (ext === '.txt') {
                text = await this.extractTXTText(file.path);
            } else {
                throw new Error('Unsupported file type');
            }

            return {
                filename: file.originalname,
                path: file.path,
                text: text.trim(),
                size: file.size,
                mimetype: file.mimetype
            };
        } catch (error) {
            // Clean up file if processing fails
            await this.deleteFile(file.path);
            throw error;
        }
    }

    /**
     * Delete file from disk
     */
    async deleteFile(filePath) {
        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.error('File deletion error:', error);
        }
    }

    /**
     * Clean up old files (older than 30 days)
     */
    async cleanupOldFiles() {
        try {
            const uploadDir = path.join(__dirname, '../../uploads');
            const files = await fs.readdir(uploadDir);
            const now = Date.now();
            const thirtyDays = 30 * 24 * 60 * 60 * 1000;

            for (const file of files) {
                const filePath = path.join(uploadDir, file);
                const stats = await fs.stat(filePath);
                
                if (now - stats.mtimeMs > thirtyDays) {
                    await this.deleteFile(filePath);
                    console.log(`Deleted old file: ${file}`);
                }
            }
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }

    /**
     * Get multer middleware for single file upload
     */
    getUploadMiddleware(fieldName = 'file') {
        return this.upload.single(fieldName);
    }

    /**
     * Get multer middleware for multiple files
     */
    getMultipleUploadMiddleware(fieldName = 'files', maxCount = 5) {
        return this.upload.array(fieldName, maxCount);
    }
}

module.exports = new FileService();
