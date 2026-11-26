import express from "express";
import cors from "cors";
import usersRouter from './routes/users.js';
import authRouter from './routes/auth.js';
import cookieParser from 'cookie-parser';
import portfoliosRouter from './routes/portfolios.js';
import senaiRouter from './routes/senai.js';

const app = express();
const PORT = 3000;

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/portfolio', portfoliosRouter);
app.use('/api/senai', senaiRouter);

app.get("/", (req, res) => {
    res.send("Servidor do portfólio está ligado.");
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

import './config/initDatabase.js';