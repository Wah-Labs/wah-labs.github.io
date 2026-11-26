import db from "./database.js";

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS portfolios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projetosSENAI (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        portfolio_id INTEGER NOT NULL,
        titulo TEXT NOT NULL,
        informacao TEXT,
        descricao TEXT,
        relatorios_tecnicos TEXT,
        aprendizagens TEXT,
        competencias TEXT,
        autoavaliacao TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (portfolio_id) REFERENCES portfolios(id)
            ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projetosSENAI_id INTEGER NOT NULL,

    categoria TEXT NOT NULL,
    nome_original TEXT NOT NULL,
    nome_guardado TEXT NOT NULL,
    mime_type TEXT,
    file_size INTEGER,
    file_path TEXT NOT NULL,
    uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (projetosSENAI_id) REFERENCES projetosSENAI(id)
        ON DELETE CASCADE
);

    CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id) REFERENCES users(id)
            ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    `);

const portfolioColumns = db.prepare("PRAGMA table_info(portfolios)").all();

const newColumns = [
  ["itinerario", "TEXT"],
  ["turma", "TEXT"],
  ["apresentacao", "TEXT"],
  ["reflexao_anual", "TEXT"],
  ["foto_perfil", "TEXT"],
];

for (const [column, type] of newColumns) {
  const exists = portfolioColumns.some((existing) => existing.name === column);

  if (!exists) {
    db.exec(`ALTER TABLE portfolios ADD COLUMN ${column} ${type}`);
  }
}

const attachmentColumns = db.prepare("PRAGMA table_info(attachments)").all();

const hasLegacyAttachments = attachmentColumns.some(
  (column) => column.name === "registrosSESI_id",
);

const migratePortfolioSchema = db.transaction(() => {
  db.exec(`
        DROP TRIGGER IF EXISTS criar_registrosSESI_padrao;
    `);

  if (hasLegacyAttachments) {
    db.exec(`
            CREATE TABLE attachments_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                projetosSENAI_id INTEGER NOT NULL,
                categoria TEXT NOT NULL,
                nome_original TEXT NOT NULL,
                nome_guardado TEXT NOT NULL,
                mime_type TEXT,
                file_size INTEGER,
                file_path TEXT NOT NULL,
                uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (projetosSENAI_id)
                    REFERENCES projetosSENAI(id)
                    ON DELETE CASCADE
            );

            INSERT INTO attachments_new (
                id,
                projetosSENAI_id,
                categoria,
                nome_original,
                nome_guardado,
                mime_type,
                file_size,
                file_path,
                uploaded_at
            )
            SELECT
                id,
                projetosSENAI_id,
                categoria,
                nome_original,
                nome_guardado,
                mime_type,
                file_size,
                file_path,
                uploaded_at
            FROM attachments
            WHERE projetosSENAI_id IS NOT NULL;

            DROP TABLE attachments;

            ALTER TABLE attachments_new
            RENAME TO attachments;
        `);
  }

  db.exec(`
        DROP TABLE IF EXISTS registrosSESI;
    `);
});

migratePortfolioSchema();

const sessionColumns = db.prepare("PRAGMA table_info(sessions)").all();

if (!sessionColumns.some((column) => column.name === "expires_at")) {
  db.exec(`
        ALTER TABLE sessions
        ADD COLUMN expires_at INTEGER NOT NULL DEFAULT 0
    `);
}

console.log("Tabelas inicializadas.");
