
import { useEffect, useState } from 'react';
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useNavigate
} from 'react-router-dom';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Portfolio from './pages/Portfolio.jsx';
import Home from './pages/Home.jsx';
import Navbar from './components/Navbar.jsx';

import {
    getCurrentUser,
    logoutUser
} from './services/api.js';

function AppContent() {
    const [user, setUser] = useState(null);
    const [checkingSession, setCheckingSession] = useState(true);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        async function checkSession() {
            try {
                const data = await getCurrentUser();
                setUser(data.user);
            } catch {
                setUser(null);
            } finally {
                setCheckingSession(false);
            }
        }

        checkSession();
    }, []);

    async function handleLogout() {
        setError('');

        try {
            await logoutUser();
            setUser(null);
            navigate('/login');
        } catch (error) {
            setError(error.message);
        }
    }

    if (checkingSession) {
        return <p>Verificando sessão...</p>;
    }

    return (
        <>
            <Navbar user={user} onLogout={handleLogout} />

            {error && <p>Erro: {error}</p>}

            <Routes>
                <Route
                    path="/"
                    element={<Home user={user} />}
                />

                <Route
                    path="/login"
                    element={
                        user ? (
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <Login
                                onLogin={(loggedUser) => {
                                    setUser(loggedUser);
                                    navigate('/dashboard');
                                }}
                                onRegister={() => navigate('/register')}
                            />
                        )
                    }
                />

                <Route
                    path="/register"
                    element={
                        user ? (
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <Register
                                onRegistered={() => navigate('/login')}
                                onLogin={() => navigate('/login')}
                            />
                        )
                    }
                />

                <Route
                    path="/dashboard"
                    element={
                        user ? (
                            <Dashboard
                                user={user}
                                onLogout={handleLogout}
                            />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                <Route
                    path="/portfolio/:id"
                    element={<Portfolio />}
                />

                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />
            </Routes>
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

export default App;
