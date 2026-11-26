
import { Router } from 'express';
import db from '../config/database.js';
import authenticate from '../middleware/authenticate.js';
import upload from '../middleware/upload.js';
import path from 'path';
import fs from 'fs';

const router = Router();

const verifyProjectOwnership = (req, res, next) => {
    const projectId = Number(req.params.id);

    if (!Number.isInteger(projectId) || projectId <= 0) {
        return res.status(400).json({
            message: 'ID de projeto inválido.'
        });
    }

    const project = db.prepare(`
        SELECT projetosSENAI.id
        FROM projetosSENAI
        JOIN portfolios
            ON portfolios.id = projetosSENAI.portfolio_id
        WHERE projetosSENAI.id = ?
        AND portfolios.user_id = ?
    `).get(projectId, req.user.id);

    if (!project) {
        return res.status(404).json({
            message: 'Projeto não encontrado.'
        });
    }

    next();
};

const allowedFields = [
    'titulo',
    'informacao',
    'descricao',
    'relatorios_tecnicos',
    'aprendizagens',
    'competencias',
    'autoavaliacao'
];

router.post('/', authenticate, (req, res) => {
    const submittedFields = Object.keys(req.body);

    if (
        submittedFields.some(field => !allowedFields.includes(field))
    ) {
        return res.status(400).json({
            message: 'Campo inválido.'
        });
    }

    if (
        typeof req.body.titulo !== 'string' ||
        !req.body.titulo.trim()
    ) {
        return res.status(400).json({
            message: 'O título do projeto é obrigatório.'
        });
    }

    const optionalFields = allowedFields.slice(1);

    if (
        !optionalFields.every(field =>
            req.body[field] === undefined ||
            typeof req.body[field] === 'string'
        )
    ) {
        return res.status(400).json({
            message: 'Os campos devem conter textos.'
        });
    }

    const portfolio = db.prepare(`
        SELECT id
        FROM portfolios
        WHERE user_id = ?
    `).get(req.user.id);

    if (!portfolio) {
        return res.status(404).json({
            message: 'Portfólio não encontrado.'
        });
    }

    const result = db.prepare(`
        INSERT INTO projetosSENAI (
            portfolio_id,
            titulo,
            informacao,
            descricao,
            relatorios_tecnicos,
            aprendizagens,
            competencias,
            autoavaliacao
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        portfolio.id,
        req.body.titulo.trim(),
        req.body.informacao ?? null,
        req.body.descricao ?? null,
        req.body.relatorios_tecnicos ?? null,
        req.body.aprendizagens ?? null,
        req.body.competencias ?? null,
        req.body.autoavaliacao ?? null
    );

    return res.status(201).json({
        message: 'Projeto SENAI criado com sucesso!',
        projectId: result.lastInsertRowid
    });
});


const editableFields = [
    'titulo',
    'informacao',
    'descricao',
    'relatorios_tecnicos',
    'aprendizagens',
    'competencias',
    'autoavaliacao'
];

router.put('/:id', authenticate, (req, res) => {
    const projectId = Number(req.params.id);

    if (!Number.isInteger(projectId) || projectId <= 0) {
        return res.status(400).json({
            message: 'ID de projeto inválido.'
        });
    }

    const submittedFields = Object.keys(req.body);

    if (
        submittedFields.length !== editableFields.length ||
        !editableFields.every(field => submittedFields.includes(field))
    ) {
        return res.status(400).json({
            message: 'Envie todos os campos permitidos.'
        });
    }

    if (
        !editableFields.every(field =>
            typeof req.body[field] === 'string'
        )
    ) {
        return res.status(400).json({
            message: 'Todos os campos devem conter textos.'
        });
    }

    if (!req.body.titulo.trim()) {
        return res.status(400).json({
            message: 'O título do projeto é obrigatório.'
        });
    }

    const project = db.prepare(`
        SELECT projetosSENAI.id
        FROM projetosSENAI
        JOIN portfolios
            ON portfolios.id = projetosSENAI.portfolio_id
        WHERE projetosSENAI.id = ?
        AND portfolios.user_id = ?
    `).get(projectId, req.user.id);

    if (!project) {
        return res.status(404).json({
            message: 'Projeto não encontrado.'
        });
    }

    db.prepare(`
        UPDATE projetosSENAI
        SET
            titulo = ?,
            informacao = ?,
            descricao = ?,
            relatorios_tecnicos = ?,
            aprendizagens = ?,
            competencias = ?,
            autoavaliacao = ?
        WHERE id = ?
    `).run(
        req.body.titulo.trim(),
        req.body.informacao,
        req.body.descricao,
        req.body.relatorios_tecnicos,
        req.body.aprendizagens,
        req.body.competencias,
        req.body.autoavaliacao,
        projectId
    );

    return res.status(200).json({
        message: 'Projeto SENAI atualizado com sucesso!'
    });
});

router.post(
    '/:id/attachments',
    authenticate,
    verifyProjectOwnership,
    upload.single('arquivo'),
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                message: 'Nenhum arquivo enviado.'
            });
        }

        const category = path.basename(req.file.destination);

        const filePath = path.relative(
            process.cwd(),
            req.file.path
        );

        const result = db.prepare(`
            INSERT INTO attachments (
                projetosSENAI_id,
                categoria,
                nome_original,
                nome_guardado,
                mime_type,
                file_size,
                file_path
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            Number(req.params.id),
            category,
            req.file.originalname,
            req.file.filename,
            req.file.mimetype,
            req.file.size,
            filePath
        );

        return res.status(201).json({
            message: 'Arquivo enviado com sucesso!',
            attachmentId: result.lastInsertRowid
        });
    }
);

router.get('/:id/attachments', (req, res) => {
    const projectId = Number(req.params.id);

    if (!Number.isInteger(projectId) || projectId <= 0) {
        return res.status(400).json({
            message: 'ID de projeto inválido.'
        });
    }

    const project = db.prepare(`
        SELECT id
        FROM projetosSENAI
        WHERE id = ?
    `).get(projectId);

    if (!project) {
        return res.status(404).json({
            message: 'Projeto não encontrado.'
        });
    }

    const attachments = db.prepare(`
        SELECT
            id,
            categoria,
            nome_original,
            mime_type,
            file_size,
            uploaded_at
        FROM attachments
        WHERE projetosSENAI_id = ?
        ORDER BY uploaded_at DESC
    `).all(projectId);

    return res.json({
        attachments: attachments.map(file => ({
            id: file.id,
            nome: file.nome_original,
            categoria: file.categoria,
            tipo: file.mime_type,
            tamanho: file.file_size,
            enviadoEm: file.uploaded_at,
            url: `/api/senai/${projectId}/attachments/${file.id}`
        }))
    });
});

router.get('/:id/attachments/:attachmentId', (req, res, next) => {
    const projectId = Number(req.params.id);
    const attachmentId = Number(req.params.attachmentId);

    if (
        !Number.isInteger(projectId) || projectId <= 0 ||
        !Number.isInteger(attachmentId) || attachmentId <= 0
    ) {
        return res.status(400).json({
            message: 'ID inválido.'
        });
    }

    const attachment = db.prepare(`
        SELECT *
        FROM attachments
        WHERE id = ?
        AND projetosSENAI_id = ?
    `).get(attachmentId, projectId);

    if (!attachment) {
        return res.status(404).json({
            message: 'Arquivo não encontrado.'
        });
    }

    const uploadsDirectory = path.resolve(process.cwd(), 'uploads');
    const filePath = path.resolve(process.cwd(), attachment.file_path);
    const relativePath = path.relative(uploadsDirectory, filePath);

    if (
        relativePath.startsWith('..') ||
        path.isAbsolute(relativePath)
    ) {
        return res.status(403).json({
            message: 'Acesso ao arquivo não permitido.'
        });
    }

    res.setHeader(
        'Content-Type',
        attachment.mime_type || 'application/octet-stream'
    );

    res.setHeader('X-Content-Type-Options', 'nosniff');

    res.setHeader(
        'Content-Disposition',
        attachment.categoria === 'images'
            ? 'inline'
            : 'attachment'
    );

    res.sendFile(filePath, (error) => {
        if (error) {
            if (error.code === 'ENOENT') {
                return res.status(404).json({
                    message: 'Arquivo não encontrado no servidor.'
                });
            }

            if (!res.headersSent) {
                return next(error);
            }
        }
    });
});

router.delete(
    '/:id/attachments/:attachmentId',
    authenticate,
    verifyProjectOwnership,
    async (req, res, next) => {
        const attachmentId = Number(req.params.attachmentId);

        if (!Number.isInteger(attachmentId) || attachmentId <= 0) {
            return res.status(400).json({
                message: 'ID de arquivo inválido.'
            });
        }

        const attachment = db.prepare(`
            SELECT *
            FROM attachments
            WHERE id = ?
            AND projetosSENAI_id = ?
        `).get(attachmentId, Number(req.params.id));

        if (!attachment) {
            return res.status(404).json({
                message: 'Arquivo não encontrado.'
            });
        }

        const uploadsDirectory = path.resolve(process.cwd(), 'uploads');
        const filePath = path.resolve(process.cwd(), attachment.file_path);
        const relativePath = path.relative(uploadsDirectory, filePath);

        if (
            relativePath.startsWith('..') ||
            path.isAbsolute(relativePath)
        ) {
            return res.status(403).json({
                message: 'Acesso ao arquivo não permitido.'
            });
        }

        try {
            await fs.promises.unlink(filePath);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                return next(error);
            }
        }

        db.prepare(`
            DELETE FROM attachments
            WHERE id = ?
        `).run(attachmentId);

        return res.json({
            message: 'Arquivo excluído com sucesso.'
        });
    }
);

router.delete('/:id', authenticate, async (req, res, next) => {
    const projectId = Number(req.params.id);

    if (!Number.isInteger(projectId) || projectId <= 0) {
        return res.status(400).json({
            message: 'ID de projeto inválido.'
        });
    }

    const project = db.prepare(`
        SELECT projetosSENAI.id
        FROM projetosSENAI
        JOIN portfolios
            ON portfolios.id = projetosSENAI.portfolio_id
        WHERE projetosSENAI.id = ?
        AND portfolios.user_id = ?
    `).get(projectId, req.user.id);

    if (!project) {
        return res.status(404).json({
            message: 'Projeto não encontrado.'
        });
    }

    const attachments = db.prepare(`
        SELECT file_path
        FROM attachments
        WHERE projetosSENAI_id = ?
    `).all(projectId);

    const uploadsDirectory = path.resolve(process.cwd(), 'uploads');

    try {
        for (const attachment of attachments) {
            const filePath = path.resolve(
                process.cwd(),
                attachment.file_path
            );

            const relativePath = path.relative(
                uploadsDirectory,
                filePath
            );

            if (
                relativePath.startsWith('..') ||
                path.isAbsolute(relativePath)
            ) {
                return res.status(403).json({
                    message: 'Acesso a um dos arquivos não permitido.'
                });
            }

            try {
                await fs.promises.unlink(filePath);
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    throw error;
                }
            }
        }

        db.prepare(`
            DELETE FROM projetosSENAI
            WHERE id = ?
        `).run(projectId);

        return res.status(200).json({
            message: 'Projeto SENAI excluído com sucesso!'
        });

    } catch (error) {
        return next(error);
    }
});

export default router;