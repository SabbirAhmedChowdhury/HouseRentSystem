import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
//import Navbar from '../components/Navbar';

const Login = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/User/login', credentials);
            login(res.data.userProfile, res.data.token);

            const role = res.data.userProfile.role;
            const routes = {
                Landlord: '/landlord-dashboard',
                Tenant: '/tenant-dashboard',
                Admin: '/admin-dashboard',
            };
            navigate(routes[role] ?? '/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <>
            {/*<Navbar />*/}
            {/* Hero Banner */}
            {/*<div className="hero-banner text-center py-5">*/}
            {/*    <div className="container">*/}
            {/*        <h1 className="display-4 fw-bold">Find Your Perfect Home</h1>*/}
            {/*        <p className="lead">Secure, modern, and hassle-free renting</p>*/}
            {/*    </div>*/}
            {/*</div>*/}

            <div className="container my-5">
                <div className="row justify-content-center">
                    <div className="col-md-5 col-lg-4">
                        <div className="card border-0 shadow-lg">
                            <div className="card-body p-5">
                                <h3 className="text-center mb-4 text-primary">Sign In</h3>

                                {error && (
                                    <div className="alert alert-danger small">{error}</div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="form-control"
                                            required
                                            value={credentials.email}
                                            onChange={handleChange}
                                            placeholder="you@example.com"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label">Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            className="form-control"
                                            required
                                            value={credentials.password}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                        />
                                    </div>

                                    <button type="submit" className="btn btn-primary w-100">
                                        Login
                                    </button>
                                </form>

                                <p className="text-center mt-4 small">
                                    New here?{' '}
                                    <Link to="/register" className="text-primary fw-bold">
                                        Create an account
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;