
import { createHash } from 'node:crypto';
import db from '../config/database.js';

function authenticate(req, res, next) {
    const token = req.cookies?.portfolio_session;

    if (!token) {
        return res.status(401).json({
            message: 'Autenticação necessária.'
        });
    }

    const tokenHash = createHash('sha256')
        .update(token)
        .digest('hex');

    const session = db.prepare(`
        SELECT
            sessions.user_id,
            sessions.expires_at,
            users.name,
            users.email
        FROM sessions
        JOIN users ON users.id = sessions.user_id
        WHERE sessions.token_hash = ?
    `).get(tokenHash);

    if (!session) {
        return res.status(401).json({
            message: 'Sessão inválida.'
        });
    }

    if (session.expires_at <= Date.now()) {
        db.prepare(`
            DELETE FROM sessions
            WHERE token_hash = ?
        `).run(tokenHash);

        res.clearCookie('portfolio_session', {
            path: '/'
        });

        return res.status(401).json({
            message: 'Sua sessão expirou. Faça login novamente.'
        });
    }

    req.user = {
        id: session.user_id,
        name: session.name,
        email: session.email
    };

    next();
}

export default authenticate;
