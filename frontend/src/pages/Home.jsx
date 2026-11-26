
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { searchPortfolios } from '../services/api.js';

function Home({ user }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    async function handleSearch(event) {
        event.preventDefault();

        if (query.trim().length < 2) {
            setError('Digite pelo menos 2 caracteres.');
            setResults([]);
            setSearched(false);
            return;
        }

        setLoading(true);
        setError('');
        setSearched(true);

        try {
            const portfolios = await searchPortfolios(query.trim());
            setResults(portfolios);
        } catch (error) {
            setError(error.message);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main>
            <h1>Meu Portfólio</h1>

            <p>
                Bem-vindo à plataforma de portfólios estudantis.
            </p>

            <p>
                Aqui você pode apresentar suas informações,
                projetos, aprendizagens e experiências.
            </p>

            <section>
                <h2>Encontrar um portfólio</h2>

                <p>
                    Pesquise pelo nome de um estudante para acessar
                    seu portfólio público.
                </p>

                <form onSubmit={handleSearch}>
                    <input
                        type="search"
                        placeholder="Nome do estudante..."
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? 'Pesquisando...' : 'Pesquisar'}
                    </button>
                </form>

                {error && <p role="alert">{error}</p>}

                {searched && !loading && !error && (
                    <div>
                        <h3>Resultados</h3>

                        {results.length === 0 ? (
                            <p>Nenhum portfólio encontrado.</p>
                        ) : (
                            <ul>
                                {results.map((portfolio) => (
                                    <li key={portfolio.id}>
                                        <Link to={`/portfolio/${portfolio.id}`}>
                                            {portfolio.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </section>

            {user ? (
                <Link to="/dashboard">
                    Acessar meu Dashboard
                </Link>
            ) : (
                <>
                    <Link to="/login">
                        Entrar na minha conta
                    </Link>

                    <p>
                        Ainda não tem uma conta?
                        {' '}
                        <Link to="/register">
                            Cadastre-se
                        </Link>
                    </p>
                </>
            )}
        </main>
    );
}

export default Home;
