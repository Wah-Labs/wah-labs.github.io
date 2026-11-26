import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadPath = path.resolve(__dirname, '../../uploads');

const allowedFiles = {
    images: {
        '.jpg': ['image/jpeg'],
        '.jpeg': ['image/jpeg'],
        '.png': ['image/png'],
        '.webp': ['image/webp'],
        '.gif': ['image/gif']
    },

    videos: {
        '.mp4': ['video/mp4'],
        '.webm': ['video/webm']
    },

    documents: {
        '.pdf': ['application/pdf'],
        '.docx': [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
    },

    code: {
        '.js': ['text/javascript', 'application/javascript', 'text/plain'],
        '.jsx': ['text/javascript', 'application/javascript', 'text/plain'],
        '.ts': ['text/plain', 'application/typescript'],
        '.tsx': ['text/plain', 'application/typescript'],
        '.py': ['text/x-python', 'text/plain'],
        '.java': ['text/x-java-source', 'text/plain'],
        '.c': ['text/x-c', 'text/plain'],
        '.cpp': ['text/x-c++', 'text/plain'],
        '.h': ['text/plain'],
        '.hpp': ['text/plain'],
        '.html': ['text/html'],
        '.css': ['text/css'],
        '.sql': ['text/plain', 'application/sql'],
        '.json': ['application/json', 'text/plain'],
        '.txt': ['text/plain']
    }
};

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();

        const category = Object.keys(allowedFiles).find(
            folder => allowedFiles[folder][extension]
        );

        if (!category) {
            return callback(new Error('Tipo de arquivo não permitido.'));
        }

        const destination = path.join(uploadPath, category);

        fs.mkdirSync(destination, { recursive: true });

        callback(null, destination);
    },

    filename: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();

        callback(null, `${randomUUID()}${extension}`);
    }
});

const fileFilter = (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const category = Object.keys(allowedFiles).find(
        folder => allowedFiles[folder][extension]
    );

    if (!category) {
        return callback(
            new Error('Tipo de arquivo não permitido.')
        );
    }

    const allowedMimes = allowedFiles[category][extension];

    if (!allowedMimes.includes(file.mimetype)) {
        return callback(
            new Error('Formato de arquivo inválido.')
        );
    }

    callback(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024,
        files: 1
    }
});


const imageFileFilter = (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const allowedMimes = allowedFiles.images[extension];

    if (!allowedMimes || !allowedMimes.includes(file.mimetype)) {
        return callback(new Error('Envie apenas arquivos de imagem.'));
    }

    callback(null, true);
};

export const uploadProfile = multer({
    storage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    }
});

export default upload;