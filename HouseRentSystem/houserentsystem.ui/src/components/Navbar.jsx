import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getDashboardRoute } from '../utils/navigationUtils';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/', { replace: true }); // Use replace to clear history
    };

    const handleLogoClick = (e) => {
        e.preventDefault();
        const route = user ? getDashboardRoute(user.role) : '/';
        // Use replace: false to allow back button to work properly
        navigate(route, { replace: false });
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
            <div className="container">
                <a 
                    className="navbar-brand d-flex align-items-center" 
                    href={getDashboardRoute()}
                    onClick={handleLogoClick}
                    style={{ cursor: 'pointer', textDecoration: 'none' }}
                >
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className="logo-img me-2"
                        onError={e => e.currentTarget.src = 'https://via.placeholder.com/42?text=HR'}
                    />
                    <button                        
                        className="btn btn-outline-primary"
                        title="Home"
                    >
                        <i className="bi bi-house"></i>
                    </button>
                    <span className="fw-bold text-primary">Home</span>
                </a>

                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#nav"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="nav">
                    <ul className="navbar-nav ms-auto">
                        {user ? (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link btn btn-link text-primary pt-0 px-4" to="/profile">
                                        <i className="bi bi-person me-1"></i> Profile
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className="nav-link btn btn-link text-primary p-0"
                                        onClick={handleLogout}
                                    >
                                        <i className="bi bi-box-arrow-right me-1"></i> Logout
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/">Login</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/register">Register</Link>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;