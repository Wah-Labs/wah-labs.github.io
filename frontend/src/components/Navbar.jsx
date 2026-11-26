
import { Link, NavLink } from 'react-router-dom';

function Navbar({ user, onLogout }) {
    return (
        <nav className="navbar">
            <Link to="/" className="navbar-logo">
                Meu Portfólio
            </Link>

            <div className="navbar-links">
                <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                        isActive ? 'nav-link active' : 'nav-link'
                    }
                >
                    Início
                </NavLink>

                {user ? (
                    <>
                        <NavLink
                            to="/dashboard"
                            className={({ isActive }) =>
                                isActive ? 'nav-link active' : 'nav-link'
                            }
                        >
                            Dashboard
                        </NavLink>

                        <button
                            type="button"
                            className="nav-button"
                            onClick={onLogout}
                        >
                            Sair
                        </button>
                    </>
                ) : (
                    <>
                        <NavLink
                            to="/login"
                            className={({ isActive }) =>
                                isActive ? 'nav-link active' : 'nav-link'
                            }
                        >
                            Entrar
                        </NavLink>

                        <NavLink
                            to="/register"
                            className={({ isActive }) =>
                                isActive ? 'nav-link active' : 'nav-link'
                            }
                        >
                            Criar conta
                        </NavLink>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;
