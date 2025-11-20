import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        role: 'all',
        verification: 'all',
        sort: 'desc',
    });

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setError('');
            try {
                const params = new URLSearchParams();
                if (filters.role !== 'all') {
                    params.append('role', filters.role);
                }
                if (filters.verification !== 'all') {
                    params.append('isNidVerified', filters.verification === 'verified');
                }
                params.append('sortDirection', filters.sort);
                const res = await api.get(`/user?${params.toString()}`);
                setUsers(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load users');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const getVerificationBadge = (isVerified) => {
        return isVerified ? (
            <span className="badge bg-success">Verified</span>
        ) : (
            <span className="badge bg-warning text-dark">Pending</span>
        );
    };

    const getRoleBadge = (role) => {
        const map = {
            Admin: 'bg-dark',
            Landlord: 'bg-primary',
            Tenant: 'bg-info text-dark',
        };
        return <span className={`badge ${map[role] || 'bg-secondary'}`}>{role}</span>;
    };

    return (
        <Layout>
            <div className="container py-5">
                <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
                    <div>
                        <h2 className="fw-bold mb-1">Admin Dashboard</h2>
                        <p className="text-muted mb-0">Manage and monitor platform users</p>
                    </div>
                </div>

                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-4">
                                <label className="form-label">Filter by Role</label>
                                <select
                                    className="form-select"
                                    name="role"
                                    value={filters.role}
                                    onChange={handleFilterChange}
                                >
                                    <option value="all">All Roles</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Landlord">Landlord</option>
                                    <option value="Tenant">Tenant</option>
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">NID Verification</label>
                                <select
                                    className="form-select"
                                    name="verification"
                                    value={filters.verification}
                                    onChange={handleFilterChange}
                                >
                                    <option value="all">All</option>
                                    <option value="verified">Verified</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">Sort by Created Date</label>
                                <select
                                    className="form-select"
                                    name="sort"
                                    value={filters.sort}
                                    onChange={handleFilterChange}
                                >
                                    <option value="desc">Newest First</option>
                                    <option value="asc">Oldest First</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <div className="card border-0 shadow-sm">
                    <div className="card-header bg-primary text-white">
                        <div className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                                <i className="bi bi-people-fill me-2"></i>
                                Users ({users.length})
                            </h5>
                            <small className="text-white-50">Date sorted: {filters.sort === 'desc' ? 'Newest' : 'Oldest'} first</small>
                        </div>
                    </div>
                    <div className="card-body p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : users.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <i className="bi bi-inbox display-4 d-block mb-3"></i>
                                No users found for the selected filters.
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>User ID</th>
                                            <th>Full Name</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Role</th>
                                            <th>NID</th>
                                            <th>NID Status</th>
                                            <th>Created At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.userId}>
                                                <td>{user.userId}</td>
                                                <td>{user.fullName}</td>
                                                <td>{user.email}</td>
                                                <td>{user.phoneNumber || '-'}</td>
                                                <td>{getRoleBadge(user.role)}</td>
                                                <td>{user.nid || '-'}</td>
                                                <td>{getVerificationBadge(user.isNIDVerified)}</td>
                                                <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AdminDashboard;