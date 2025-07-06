import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        phoneNumber: '',
        nid: '',
        role: 'Tenant',
    });
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const validatePassword = (password) => {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;
        return regex.test(password);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validatePassword(formData.password)) {
            setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
            return;
        }
        try {
            const response = await api.post('/User/register', formData);
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
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="auth-container">
            <h2 className="auth-header">Register to House Rent System</h2>
            {error && <div className="error-message mb-3">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <input
                        type="text"
                        name="fullName"
                        className="form-control"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                        type="email"
                        name="email"
                        className="form-control"
                        value={formData.email}
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
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Phone Number</label>
                    <input
                        type="tel"
                        name="phoneNumber"
                        className="form-control"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">NID</label>
                    <input
                        type="text"
                        name="nid"
                        className="form-control"
                        value={formData.nid}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Role</label>
                    <select
                        name="role"
                        className="form-select"
                        value={formData.role}
                        onChange={handleChange}
                        required
                    >
                        <option value="Tenant">Tenant</option>
                        <option value="Landlord">Landlord</option>
                        <option value="Admin">Admin</option>
                    </select>
                </div>
                <button type="submit" className="btn btn-primary w-100">Register</button>
            </form>
            <p className="mt-3 text-center">
                Already have an account? <Link to="/" className="link">Login</Link>
            </p>
        </div>
    );
};

export default Register;