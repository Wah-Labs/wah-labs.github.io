
import { useState } from 'react';
import { loginUser } from '../services/api.js';

function Login({ onLogin, onRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        setError('');
        setLoading(true);

        try {
            const data = await loginUser(email, password);
            onLogin(data.user);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main>
            <h1>Login</h1>

            <form onSubmit={handleSubmit}>
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
                        required
                    />
                </div>

                {error && <p>{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>
            </form>

            <p>
                Ainda não tem uma conta?
                {' '}
                <button type="button" onClick={onRegister}>
                    Criar conta
                </button>
            </p>
        </main>
    );
}

export default Login;
