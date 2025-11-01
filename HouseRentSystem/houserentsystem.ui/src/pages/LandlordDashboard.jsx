/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';

const LandlordDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        total: 0,
        available: 0,
        occupied: 0,
        revenue: 0,
    });
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError('');
        try {
            const [statsRes, propsRes] = await Promise.all([
                api.get('/Property/landlord/stats'),
                api.get(`/Property/landlord/${user.userId}`),
            ]);

            setStats(statsRes.data);
            setProperties(propsRes.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (propertyId, isAvailable) => {
        if (!isAvailable) {
            alert('Cannot delete an occupied property');
            return;
        }

        if (window.confirm('Delete this property?')) {
            try {
                await api.delete(`/Property/${propertyId}`);
                fetchDashboardData();
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to delete');
            }
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="container py-5 text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container py-5">
                {/* Welcome */}
                <div className="mb-5 text-center">
                    <h1 className="display-5 fw-bold text-primary">
                        Welcome back, {user?.fullName}!
                    </h1>
                    <p className="lead text-muted">Manage your rental properties</p>
                </div>

                {error && (
                    <div className="alert alert-danger text-center">{error}</div>
                )}

                {/* Stats Cards */}
                <div className="row g-4 mb-5">
                    <div className="col-md-3">
                        <div className="card border-0 shadow-lg text-center p-4">
                            <i className="bi bi-house-door display-4 text-primary mb-3"></i>
                            <h3 className="mb-1">{stats.total}</h3>
                            <p className="text-muted">Total Properties</p>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-lg text-center p-4">
                            <i className="bi bi-check-circle display-4 text-success mb-3"></i>
                            <h3 className="mb-1">{stats.available}</h3>
                            <p className="text-muted">Available</p>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-lg text-center p-4">
                            <i className="bi bi-people display-4 text-warning mb-3"></i>
                            <h3 className="mb-1">{stats.occupied}</h3>
                            <p className="text-muted">Occupied</p>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-lg text-center p-4">
                            <i className="bi bi-currency-bitcoin display-4 text-info mb-3"></i>
                            <h3 className="mb-1">BDT {stats.revenue.toLocaleString()}</h3>
                            <p className="text-muted">Monthly Revenue</p>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <div className="text-end mb-4">
                    <Link
                        to="/property/create"
                        className="btn btn-primary btn-lg"
                    >
                        <i className="bi bi-plus-circle me-2"></i>
                        Add New Property
                    </Link>
                </div>

                {/* Properties Table */}
                <div className="card border-0 shadow-lg">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">
                            <i className="bi bi-list-ul me-2"></i>
                            Your Properties
                        </h5>
                    </div>
                    <div className="card-body p-0">
                        {properties.length === 0 ? (
                            <div className="p-5 text-center text-muted">
                                <i className="bi bi-inbox display-1 d-block mb-3"></i>
                                <p>No properties yet. Click "Add New Property" to get started.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Thumbnail</th>
                                            <th>Address</th>
                                            <th>Rent</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {properties.map((p) => (
                                            <tr key={p.propertyId}>
                                                <td>
                                                    {p.thumbnail ? (
                                                        <img
                                                            src={p.thumbnail}
                                                            alt="Thumb"
                                                            className="rounded"
                                                            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <div
                                                            className="bg-light rounded d-flex align-items-center justify-content-center"
                                                            style={{ width: '60px', height: '60px' }}
                                                        >
                                                            <i className="bi bi-house text-muted"></i>
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <strong>{p.address}</strong>
                                                    <br />
                                                    <small className="text-muted">{p.city}</small>
                                                </td>
                                                <td>BDT {p.rentAmount.toLocaleString()}</td>
                                                <td>
                                                    <span
                                                        className={`badge ${p.isAvailable ? 'bg-success' : 'bg-secondary'
                                                            }`}
                                                    >
                                                        {p.isAvailable ? 'Available' : 'Occupied'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="btn-group" role="group">
                                                        <Link
                                                            to={`/property/${p.propertyId}`}
                                                            className="btn btn-sm btn-outline-primary"
                                                            title="View"
                                                        >
                                                            <i className="bi bi-eye"></i>
                                                        </Link>
                                                        <Link
                                                            to={`/property/edit/${p.propertyId}`}
                                                            className="btn btn-sm btn-outline-secondary"
                                                            title="Edit"
                                                        >
                                                            <i className="bi bi-pencil"></i>
                                                        </Link>
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleDelete(p.propertyId, p.isAvailable)}
                                                            disabled={!p.isAvailable}
                                                            title={
                                                                !p.isAvailable
                                                                    ? 'Cannot delete occupied property'
                                                                    : 'Delete'
                                                            }
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
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

export default LandlordDashboard;