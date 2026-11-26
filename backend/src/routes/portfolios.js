import { Router } from 'express';
import db from '../config/database.js';
import authenticate from '../middleware/authenticate.js';
import upload, { uploadProfile } from '../middleware/upload.js';
import path from 'path';
import fs from 'fs';

const router = Router();


router.post(
    '/sobre-mim/foto',
    authenticate,
    uploadProfile.single('foto'),
    async (req, res, next) => {
        if (!req.file) {
            return res.status(400).json({
                message: 'Nenhuma foto enviada.'
            });
        }

        const portfolio = db.prepare(`
            SELECT id, foto_perfil
            FROM portfolios
            WHERE user_id = ?
        `).get(req.user.id);

        if (!portfolio) {
            await fs.promises.unlink(req.file.path);

            return res.status(404).json({
                message: 'Portfólio não encontrado.'
            });
        }

        const filePath = path.relative(
            process.cwd(),
            req.file.path
        );

        try {
            db.prepare(`
                UPDATE portfolios
                SET foto_perfil = ?
                WHERE id = ?
            `).run(filePath, portfolio.id);

            if (portfolio.foto_perfil) {
                const oldPath = path.resolve(
                    process.cwd(),
                    portfolio.foto_perfil
                );

                await fs.promises.unlink(oldPath).catch(error => {
                    if (error.code !== 'ENOENT') throw error;
                });
            }

            return res.status(200).json({
                message: 'Foto de perfil atualizada com sucesso!',
                foto_perfil: filePath
            });
        } catch (error) {
            await fs.promises.unlink(req.file.path).catch(() => {});
            return next(error);
        }
    }
);



router.put('/sobre-mim', authenticate, (req, res) => {
    const {
        itinerario,
        turma,
        apresentacao,
        reflexao_anual
    } = req.body;

    const fields = [
        itinerario,
        turma,
        apresentacao,
        reflexao_anual
    ];

    if (!fields.every(field => typeof field === 'string')) {
        return res.status(400).json({
            message: 'Todos os campos devem conter textos.'
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

    db.prepare(`
        UPDATE portfolios
        SET
            itinerario = ?,
            turma = ?,
            apresentacao = ?,
            reflexao_anual = ?
        WHERE id = ?
    `).run(
        itinerario.trim(),
        turma.trim(),
        apresentacao.trim(),
        reflexao_anual.trim(),
        portfolio.id
    );

    return res.status(200).json({
        message: 'Informações atualizadas com sucesso!'
    });
});


router.get('/', authenticate, (req, res) => {
    const portfolio = db.prepare(`
        SELECT *
        FROM portfolios
        WHERE user_id = ?
    `).get(req.user.id);

    if (!portfolio) {
        return res.status(404).json({
            message: 'Portfólio não encontrado.'
        });
    }

    const projetosSENAI = db.prepare(`
        SELECT *
        FROM projetosSENAI
        WHERE portfolio_id = ?
        ORDER BY created_at DESC
    `).all(portfolio.id);

    return res.status(200).json({
        portfolio: {
            ...portfolio,
            projetosSENAI
        }
    });
});


router.get('/:id/foto', (req, res, next) => {
    const portfolioId = Number(req.params.id);

    if (!Number.isInteger(portfolioId) || portfolioId <= 0) {
        return res.status(400).json({
            message: 'ID de portfólio inválido.'
        });
    }

    const portfolio = db.prepare(`
        SELECT foto_perfil
        FROM portfolios
        WHERE id = ?
    `).get(portfolioId);

    if (!portfolio || !portfolio.foto_perfil) {
        return res.status(404).json({
            message: 'Foto de perfil não encontrada.'
        });
    }

    const imagesDirectory = path.resolve(
        process.cwd(),
        'uploads/images'
    );

    const filePath = path.resolve(
        process.cwd(),
        portfolio.foto_perfil
    );

    const relativePath = path.relative(
        imagesDirectory,
        filePath
    );

    if (
        relativePath === '..' ||
        relativePath.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relativePath)
    ) {
        return res.status(403).json({
            message: 'Acesso ao arquivo não permitido.'
        });
    }

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

router.get('/:id', (req, res) => {
    const portfolioId = Number(req.params.id);

    if (!Number.isInteger(portfolioId) || portfolioId <= 0) {
        return res.status(400).json({
            message: 'ID de portfólio inválido.'
        });
    }

const portfolio = db.prepare(`
    SELECT
        portfolios.id,
        portfolios.created_at,
        portfolios.itinerario,
        portfolios.turma,
        portfolios.apresentacao,
        portfolios.reflexao_anual,
        portfolios.foto_perfil,
        users.name
    FROM portfolios
    JOIN users
        ON users.id = portfolios.user_id
    WHERE portfolios.id = ?
`).get(portfolioId);

    if (!portfolio) {
        return res.status(404).json({
            message: 'Portfólio não encontrado.'
        });
    }

    const projetosSENAI = db.prepare(`
        SELECT *
        FROM projetosSENAI
        WHERE portfolio_id = ?
        ORDER BY created_at DESC
    `).all(portfolioId);

return res.status(200).json({
    portfolio: {
        ...portfolio,
        foto_perfil: portfolio.foto_perfil
            ? `/api/portfolio/${portfolio.id}/foto`
            : null,
        projetosSENAI
    }
});
});

export default router;