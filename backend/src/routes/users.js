
import { Router } from 'express';
import { randomBytes, scryptSync } from 'node:crypto';
import db from '../config/database.js';

const router = Router();

// Search public portfolios by student name
router.get('/search', (req, res) => {
    const query = req.query.q?.trim();

    if (!query || query.length < 2) {
        return res.status(400).json({
            message: 'Digite pelo menos 2 caracteres.'
        });
    }

    try {
        const portfolios = db.prepare(`
            SELECT
                portfolios.id AS id,
                users.name AS name
            FROM portfolios
            JOIN users ON users.id = portfolios.user_id
            WHERE users.name LIKE ?
            ORDER BY users.name ASC
            LIMIT 20
        `).all(`%${query}%`);

        return res.json({ portfolios });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: 'Erro ao pesquisar portfólios.'
        });
    }
});

router.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: 'Preencha todos os campos.'
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            message: 'A senha deve ter pelo menos 8 caracteres.'
        });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const salt = randomBytes(16).toString('hex');

    const passwordHash = scryptSync(password, salt, 64).toString('hex');
    const storedPassword = `${salt}:${passwordHash}`;

    try {
        const createAccount = db.transaction(() => {
            const user = db.prepare(`
                INSERT INTO users (name, email, password)
                VALUES (?, ?, ?)
            `).run(name.trim(), normalizedEmail, storedPassword);

            db.prepare(`
                INSERT INTO portfolios (user_id)
                VALUES (?)
            `).run(user.lastInsertRowid);

            return user.lastInsertRowid;
        });

        const userId = createAccount();

        return res.status(201).json({
            message: 'Conta criada com sucesso!',
            userId
        });

    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({
                message: 'Este e-mail já está cadastrado.'
            });
        }

        console.error(error);

        return res.status(500).json({
            message: 'Erro ao criar a conta.'
        });
    }
});

export default router;
