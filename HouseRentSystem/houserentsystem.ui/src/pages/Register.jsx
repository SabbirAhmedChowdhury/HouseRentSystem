import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';

const Register = () => {
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        nid: '',
        role: 'Tenant',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        try {
            await api.post('/User/register', {
                fullName: form.fullName,
                email: form.email,
                password: form.password,
                phoneNumber: form.phoneNumber,
                nid: form.nid,
                role: form.role,
            });
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <Layout>
            <div className="container my-5">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-5">
                        <div className="card border-0 shadow-lg">
                            <div className="card-body p-5">
                                <h3 className="text-center mb-4 text-primary">Create Account</h3>

                                {error && (
                                    <div className="alert alert-danger small">{error}</div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label">Full Name</label>
                                            <input
                                                type="text"
                                                name="fullName"
                                                className="form-control"
                                                required
                                                value={form.fullName}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                className="form-control"
                                                required
                                                value={form.email}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">Phone</label>
                                            <input
                                                type="tel"
                                                name="phoneNumber"
                                                className="form-control"
                                                required
                                                value={form.phoneNumber}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">NID</label>
                                            <input
                                                type="text"
                                                name="nid"
                                                className="form-control"
                                                required
                                                value={form.nid}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label">Role</label>
                                            <select
                                                name="role"
                                                className="form-select"
                                                value={form.role}
                                                onChange={handleChange}
                                            >
                                                <option value="Tenant">Tenant</option>
                                                <option value="Landlord">Landlord</option>
                                            </select>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">Password</label>
                                            <input
                                                type="password"
                                                name="password"
                                                className="form-control"
                                                required
                                                value={form.password}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">Confirm Password</label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                className="form-control"
                                                required
                                                value={form.confirmPassword}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="col-12 mt-4">
                                            <button type="submit" className="btn btn-primary w-100">
                                                Register
                                            </button>
                                        </div>
                                    </div>
                                </form>

                                <p className="text-center mt-4 small">
                                    Already registered?{' '}
                                    <Link to="/" className="text-primary fw-bold">
                                        Sign In
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Register;