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
    const [leases, setLeases] = useState([]);
    const [overduePayments, setOverduePayments] = useState([]);
    const [maintenanceRequests, setMaintenanceRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [renewDates, setRenewDates] = useState({});

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError('');
        try {
            const [statsRes, propsRes, leasesRes, overdueRes, requestsRes] = await Promise.all([
                api.get('/Property/landlord/stats'),
                api.get('/Property'),
                api.get('/Lease'),
                api.get('/api/payments/overdue'),
                api.get('/api/maintenance/property/all'), // Assuming an endpoint to get all requests for landlord's properties
            ]);

            setStats(statsRes.data);
            setProperties(propsRes.data.filter(p => p.landlordId === user.userId));
            setLeases(leasesRes.data);
            setOverduePayments(overdueRes.data);
            setMaintenanceRequests(requestsRes.data);
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

    const handleStatusUpdate = async (requestId, newStatus) => {
        try {
            await api.put(`/api/maintenance/${requestId}/status`, { status: newStatus });
            fetchDashboardData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };

    const handleEndLease = async (leaseId) => {
        if (window.confirm('End this lease?')) {
            try {
                await api.put(`/Lease/${leaseId}/end`);
                fetchDashboardData();
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to end lease');
            }
        }
    };

    const handleRenewLease = async (leaseId) => {
        const newEndDate = renewDates[leaseId];
        if (!newEndDate) {
            alert('Please select a new end date');
            return;
        }
        try {
            await api.put(`/Lease/${leaseId}/renew`, { newEndDate });
            fetchDashboardData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to renew lease');
        }
    };

    const handleRenewDateChange = (leaseId, date) => {
        setRenewDates({ ...renewDates, [leaseId]: date });
    };

    const handleVerifyPayment = async (paymentId) => {
        try {
            await api.post(`/api/payments/${paymentId}/verify`);
            fetchDashboardData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to verify payment');
        }
    };

    const handleUpdatePaymentStatus = async (paymentId, newStatus) => {
        try {
            await api.put(`/api/payments/${paymentId}/status`, { status: newStatus });
            fetchDashboardData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update payment status');
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
                            <i className="bi bi-currency-exchange display-4 text-info mb-3"></i>
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
                <div className="card border-0 shadow-lg mb-5">
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
                                                        className={`badge ${p.isAvailable ? 'bg-success' : 'bg-secondary'}`}
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

                {/* Leases Section */}
                <div className="card border-0 shadow-lg mb-5">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">
                            <i className="bi bi-file-earmark-text me-2"></i>
                            Active Leases
                        </h5>
                    </div>
                    <div className="card-body p-0">
                        {leases.length === 0 ? (
                            <div className="p-5 text-center text-muted">
                                <i className="bi bi-file-earmark display-1 d-block mb-3"></i>
                                <p>No active leases.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Property</th>
                                            <th>Tenant</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                            <th>Rent</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leases.map((l) => (
                                            <tr key={l.leaseId}>
                                                <td>{properties.find(p => p.propertyId === l.propertyId)?.address}</td>
                                                <td>{l.tenantId}</td>
                                                <td>{new Date(l.startDate).toLocaleDateString()}</td>
                                                <td>{new Date(l.endDate).toLocaleDateString()}</td>
                                                <td>BDT {l.monthlyRent.toLocaleString()}</td>
                                                <td>
                                                    <div className="btn-group" role="group">
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleEndLease(l.leaseId)}
                                                        >
                                                            End
                                                        </button>
                                                        <input
                                                            type="date"
                                                            className="form-control form-control-sm d-inline-block w-auto me-1"
                                                            value={renewDates[l.leaseId] || ''}
                                                            onChange={(e) => handleRenewDateChange(l.leaseId, e.target.value)}
                                                        />
                                                        <button
                                                            className="btn btn-sm btn-outline-success"
                                                            onClick={() => handleRenewLease(l.leaseId)}
                                                        >
                                                            Renew
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

                {/* Overdue Payments Section */}
                <div className="card border-0 shadow-lg mb-5">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            Overdue Payments
                        </h5>
                    </div>
                    <div className="card-body p-0">
                        {overduePayments.length === 0 ? (
                            <div className="p-5 text-center text-muted">
                                <i className="bi bi-check-circle display-1 d-block mb-3"></i>
                                <p>No overdue payments.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Lease ID</th>
                                            <th>Tenant</th>
                                            <th>Due Date</th>
                                            <th>Amount</th>
                                            <th>Late Fee</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {overduePayments.map((p) => (
                                            <tr key={p.paymentId}>
                                                <td>{p.leaseId}</td>
                                                <td>{p.lease.tenant.fullName}</td>
                                                <td>{new Date(p.dueDate).toLocaleDateString()}</td>
                                                <td>BDT {p.amountPaid.toLocaleString()}</td>
                                                <td>BDT {p.lateFee.toLocaleString()}</td>
                                                <td>
                                                    <span className={`badge ${p.status === 'Pending' ? 'bg-warning' : 'bg-success'}`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="btn-group" role="group">
                                                        <button
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => handleVerifyPayment(p.paymentId)}
                                                            disabled={p.status !== 'Pending'}
                                                        >
                                                            Verify
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline-success"
                                                            onClick={() => handleUpdatePaymentStatus(p.paymentId, 'Paid')}
                                                            disabled={p.status === 'Paid'}
                                                        >
                                                            Mark Paid
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

                {/* Maintenance Requests Section */}
                <div className="card border-0 shadow-lg">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">
                            <i className="bi bi-wrench me-2"></i>
                            Maintenance Requests
                        </h5>
                    </div>
                    <div className="card-body p-0">
                        {maintenanceRequests.length === 0 ? (
                            <div className="p-5 text-center text-muted">
                                <i className="bi bi-check-circle display-1 d-block mb-3"></i>
                                <p>No maintenance requests for your properties.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Property</th>
                                            <th>Tenant</th>
                                            <th>Description</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {maintenanceRequests.map((r) => (
                                            <tr key={r.requestId}>
                                                <td>{r.property.address}, {r.property.city}</td>
                                                <td>{r.tenant.fullName}</td>
                                                <td>{r.description}</td>
                                                <td>{new Date(r.requestDate).toLocaleDateString()}</td>
                                                <td>
                                                    <span
                                                        className={`badge ${r.status === 'Pending' ? 'bg-warning' :
                                                            r.status === 'InProgress' ? 'bg-info' :
                                                                r.status === 'Resolved' ? 'bg-success' : 'bg-secondary'
                                                            }`}
                                                    >
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="btn-group" role="group">
                                                        <button
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => handleStatusUpdate(r.requestId, 'InProgress')}
                                                            disabled={r.status !== 'Pending'}
                                                        >
                                                            Start
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline-success"
                                                            onClick={() => handleStatusUpdate(r.requestId, 'Resolved')}
                                                            disabled={r.status === 'Resolved'}
                                                        >
                                                            Resolve
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