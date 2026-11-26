
import { useState } from 'react';
import { registerUser } from '../services/api.js';

function Register({ onRegistered, onLogin }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        setError('');
        setLoading(true);

        try {
            await registerUser(name, email, password);
            onRegistered();
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main>
            <h1>Criar conta</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name">Nome</label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="password">Senha</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        minLength={8}
                        required
                    />
                </div>

                {error && <p>{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? 'Criando conta...' : 'Cadastrar'}
                </button>
            </form>

            <p>
                Já tem uma conta?
                {' '}
                <button type="button" onClick={onLogin}>
                    Fazer login
                </button>
            </p>
        </main>
    );
}

export default Register;
