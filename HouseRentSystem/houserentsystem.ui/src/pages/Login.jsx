import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

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
            const response = await api.post('/User/login', credentials);
            login(response.data.userProfile, response.data.token);
            switch (response.data.userProfile.role) {
                case 'Landlord':
                    navigate('/landlord-dashboard');
                    break;
                case 'Tenant':
                    navigate('/tenant-dashboard');
                    break;
                case 'Admin':
                    navigate('/admin-dashboard');
                    break;
                default:
                    setError('Unknown role');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="auth-container">
            <h2 className="auth-header">Login to House Rent System</h2>
            {error && <div className="error-message mb-3">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                        type="email"
                        name="email"
                        className="form-control"
                        value={credentials.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                        type="password"
                        name="password"
                        className="form-control"
                        value={credentials.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary w-100">Login</button>
            </form>
            <p className="mt-3 text-center">
                Don't have an account? <Link to="/register" className="link">Register</Link>
            </p>
        </div>
    );
};

export default Login;