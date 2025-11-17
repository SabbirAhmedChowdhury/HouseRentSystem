/* eslint-disable no-unused-vars */
/**
 * Landlord Payment Management Page
 * Allows landlords to view all payments for their properties, verify payments, update payment status, and track overdue payments
 */
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';
import { getImageUrl, getImageUrls } from '../utils/imageUtils';

const LandlordPaymentManagement = () => {
    const { user } = useContext(AuthContext);
    const [payments, setPayments] = useState([]);
    const [overduePayments, setOverduePayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterProperty, setFilterProperty] = useState('all');
    const [properties, setProperties] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    /**
     * Fetches all payments for the landlord's properties and overdue payments
     */
    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch properties
            const propsRes = await api.get(`/Property/landlord/${user.userId}`).catch(() => ({ data: [] }));
            const propertiesList = Array.isArray(propsRes.data) ? propsRes.data : [];
            setProperties(propertiesList);

            // Fetch all payments for landlord's properties
            const paymentsRes = await api.get(`/payments/landlord/${user.userId}`).catch(() => ({ data: [] }));
            const allPayments = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
            setPayments(allPayments);

            // Fetch overdue payments
            const overdueRes = await api.get('/payments/overdue').catch(() => ({ data: [] }));
            const overdue = Array.isArray(overdueRes.data) ? overdueRes.data : [];
            // Filter to only show overdue payments for this landlord's properties
            const landlordOverdue = overdue.filter(p => 
                allPayments.some(ap => ap.paymentId === p.paymentId)
            );
            setOverduePayments(landlordOverdue);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load payments');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Verifies a payment after reviewing the payment slip
     * @param {number} paymentId - The ID of the payment to verify
     */
    const handleVerifyPayment = async (paymentId) => {
        try {
            await api.post(`/payments/${paymentId}/verify`);
            alert('Payment verified successfully');
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to verify payment');
        }
    };

    /**
     * Updates the payment status
     * @param {number} paymentId - The ID of the payment
     * @param {string} newStatus - New status (Paid, Pending, Overdue)
     */
    const handleUpdatePaymentStatus = async (paymentId, newStatus) => {
        if (!window.confirm(`Are you sure you want to mark this payment as ${getStatusText(newStatus)}?`)) {
            return;
        }
        try {
            await api.put(`/payments/${paymentId}/status`, { status: newStatus });
            alert('Payment status updated successfully');
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update payment status');
        }
    };

    /**
     * Converts status enum/number to text
     * @param {string|number} status - Payment status (can be enum value or number)
     * @returns {string} Status text
     */
    const getStatusText = (status) => {
        if (typeof status === 'number') {
            const statusMap = {
                0: 'Pending',
                1: 'Paid',
                2: 'Overdue'
            };
            return statusMap[status] || 'Unknown';
        }
        return status || 'Unknown';
    };

    /**
     * Gets the status badge class based on payment status
     * @param {string|number} status - Payment status
     * @returns {string} Badge class name
     */
    const getStatusBadge = (status) => {
        const statusText = getStatusText(status);
        const map = {
            Pending: 'bg-warning',
            Paid: 'bg-success',
            Overdue: 'bg-danger',
        };
        return `badge ${map[statusText] || 'bg-secondary'}`;
    };

    /**
     * Gets the payment type text
     * @param {string|number} paymentType - Payment type (can be enum value or number)
     * @returns {string} Payment type text
     */
    const getPaymentTypeText = (paymentType) => {
        if (typeof paymentType === 'number') {
            const typeMap = {
                1: 'Rent',
                2: 'Security Deposit'
            };
            return typeMap[paymentType] || 'Unknown';
        }
        // Handle string enum values
        if (paymentType === 'Rent') return 'Rent';
        if (paymentType === 'SecurityDeposit') return 'Security Deposit';
        return paymentType || 'Unknown';
    };

    /**
     * Checks if a payment is overdue
     * @param {object} payment - Payment object
     * @returns {boolean} True if payment is overdue
     */
    const isOverdue = (payment) => {
        return getStatusText(payment.status) === 'Pending' && new Date(payment.dueDate) < new Date();
    };

    /**
     * Filters payments based on selected status and property
     */
    const filteredPayments = payments.filter((payment) => {
        const statusText = getStatusText(payment.status);
        const matchesStatus = filterStatus === 'all' || 
            statusText.toLowerCase() === filterStatus.toLowerCase() ||
            (filterStatus === 'overdue' && isOverdue(payment));
        const matchesProperty = filterProperty === 'all' || 
            payment.lease?.propertyId === parseInt(filterProperty);
        return matchesStatus && matchesProperty;
    });

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
                {/* Header */}
                <div className="mb-5">
                    <h1 className="display-5 fw-bold text-primary">Payment Management</h1>
                    <p className="lead text-muted">Manage rent payments for your properties</p>
                </div>

                {error && (
                    <div className="alert alert-danger text-center">{error}</div>
                )}

                {/* Payment Statistics */}
                <div className="row g-4 mb-5">
                    <div className="col-md-3">
                        <div className="card border-0 shadow-lg text-center p-4">
                            <i className="bi bi-cash-coin display-4 text-primary mb-3"></i>
                            <h3 className="mb-1">{payments.length}</h3>
                            <p className="text-muted">Total Payments</p>
                            <small className="text-muted">
                                Rent: {payments.filter(p => (p.paymentType === 1 || p.paymentType === 'Rent')).length} | 
                                Deposit: {payments.filter(p => (p.paymentType === 2 || p.paymentType === 'SecurityDeposit')).length}
                            </small>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-lg text-center p-4">
                            <i className="bi bi-check-circle display-4 text-success mb-3"></i>
                            <h3 className="mb-1">
                                {payments.filter(p => getStatusText(p.status) === 'Paid').length}
                            </h3>
                            <p className="text-muted">Paid</p>
                            <small className="text-muted">
                                Rent: {payments.filter(p => getStatusText(p.status) === 'Paid' && (p.paymentType === 1 || p.paymentType === 'Rent')).length} | 
                                Deposit: {payments.filter(p => getStatusText(p.status) === 'Paid' && (p.paymentType === 2 || p.paymentType === 'SecurityDeposit')).length}
                            </small>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-lg text-center p-4">
                            <i className="bi bi-clock-history display-4 text-warning mb-3"></i>
                            <h3 className="mb-1">
                                {payments.filter(p => getStatusText(p.status) === 'Pending').length}
                            </h3>
                            <p className="text-muted">Pending</p>
                            <small className="text-muted">
                                Rent: {payments.filter(p => getStatusText(p.status) === 'Pending' && (p.paymentType === 1 || p.paymentType === 'Rent')).length} | 
                                Deposit: {payments.filter(p => getStatusText(p.status) === 'Pending' && (p.paymentType === 2 || p.paymentType === 'SecurityDeposit')).length}
                            </small>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-lg text-center p-4">
                            <i className="bi bi-exclamation-triangle display-4 text-danger mb-3"></i>
                            <h3 className="mb-1">{overduePayments.length}</h3>
                            <p className="text-muted">Overdue</p>
                            <small className="text-muted">
                                Rent: {overduePayments.filter(p => (p.paymentType === 1 || p.paymentType === 'Rent')).length} | 
                                Deposit: {overduePayments.filter(p => (p.paymentType === 2 || p.paymentType === 'SecurityDeposit')).length}
                            </small>
                        </div>
                    </div>
                </div>

                {/* Overdue Payments Section */}
                {overduePayments.length > 0 && (
                    <div className="card border-0 shadow-lg mb-5">
                        <div className="card-header bg-danger text-white">
                            <h5 className="mb-0">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                Overdue Payments ({overduePayments.length})
                            </h5>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Property</th>
                                            <th>Tenant</th>
                                            <th>Type</th>
                                            <th>Due Date</th>
                                            <th>Amount</th>
                                            <th>Late Fee</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {overduePayments.map((payment) => (
                                            <tr key={payment.paymentId} className="table-danger">
                                                <td>
                                                    <strong>{payment.lease?.property?.address || 'N/A'}</strong>
                                                    <br />
                                                    <small className="text-muted">{payment.lease?.property?.city || ''}</small>
                                                </td>
                                                <td>
                                                    {payment.lease?.tenant?.fullName || `Tenant #${payment.lease?.tenantId || 'N/A'}`}
                                                    <br />
                                                    <small className="text-muted">{payment.lease?.tenant?.email || ''}</small>
                                                </td>
                                                <td>
                                                    <span className={`badge ${(payment.paymentType === 1 || payment.paymentType === 'Rent') ? 'bg-primary' : 'bg-info'}`}>
                                                        {getPaymentTypeText(payment.paymentType)}
                                                    </span>
                                                </td>
                                                <td>{new Date(payment.dueDate).toLocaleDateString()}</td>
                                                <td>BDT {payment.amountPaid?.toLocaleString() || '0'}</td>
                                                <td>BDT {(payment.lateFee || 0).toLocaleString()}</td>
                                                <td>
                                                    <span className={getStatusBadge(payment.status)}>
                                                        {getStatusText(payment.status)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="btn-group" role="group">
                                                        {payment.paymentSlipPath && (
                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => handleVerifyPayment(payment.paymentId)}
                                                                disabled={getStatusText(payment.status) !== 'Pending'}
                                                                title="Verify Payment"
                                                            >
                                                                <i className="bi bi-check-circle"></i>
                                                            </button>
                                                        )}
                                                        <button
                                                            className="btn btn-sm btn-outline-success"
                                                            onClick={() => handleUpdatePaymentStatus(payment.paymentId, 1)} ////1 means Paid
                                                            disabled={getStatusText(payment.status) === 'Paid'}
                                                            title="Mark as Paid"
                                                        >
                                                            <i className="bi bi-check"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="card border-0 shadow-lg mb-4">
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label">Filter by Property</label>
                                <select
                                    className="form-select"
                                    value={filterProperty}
                                    onChange={(e) => setFilterProperty(e.target.value)}
                                >
                                    <option value="all">All Properties</option>
                                    {properties.map((prop) => (
                                        <option key={prop.propertyId} value={prop.propertyId}>
                                            {prop.address}, {prop.city}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Filter by Status</label>
                                <select
                                    className="form-select"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="overdue">Overdue</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* All Payments Section */}
                <div className="card border-0 shadow-lg">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">
                            <i className="bi bi-list-ul me-2"></i>
                            All Payments ({filteredPayments.length})
                        </h5>
                    </div>
                    <div className="card-body p-0">
                        {filteredPayments.length === 0 ? (
                            <div className="p-5 text-center text-muted">
                                <i className="bi bi-inbox display-1 d-block mb-3"></i>
                                <p>No payments found matching your filters.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Property</th>
                                            <th>Tenant</th>
                                            <th>Type</th>
                                            <th>Due Date</th>
                                            <th>Payment Date</th>
                                            <th>Amount</th>
                                            <th>Late Fee</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPayments.map((payment) => (
                                            <tr key={payment.paymentId} className={isOverdue(payment) ? 'table-danger' : ''}>
                                                <td>
                                                    <strong>{payment.lease?.property?.address || 'N/A'}</strong>
                                                    <br />
                                                    <small className="text-muted">{payment.lease?.property?.city || ''}</small>
                                                </td>
                                                <td>
                                                    {payment.lease?.tenant?.fullName || `Tenant #${payment.lease?.tenantId || 'N/A'}`}
                                                    <br />
                                                    <small className="text-muted">{payment.lease?.tenant?.email || ''}</small>
                                                </td>
                                                <td>
                                                    <span className={`badge ${(payment.paymentType === 1 || payment.paymentType === 'Rent') ? 'bg-primary' : 'bg-info'}`}>
                                                        {getPaymentTypeText(payment.paymentType)}
                                                    </span>
                                                </td>
                                                <td>{new Date(payment.dueDate).toLocaleDateString()}</td>
                                                <td>
                                                    {payment.paymentDate
                                                        ? new Date(payment.paymentDate).toLocaleDateString()
                                                        : '-'}
                                                </td>
                                                <td>BDT {payment.amountPaid?.toLocaleString() || '0'}</td>
                                                <td>BDT {(payment.lateFee || 0).toLocaleString()}</td>
                                                <td>
                                                    <span className={getStatusBadge(payment.status)}>
                                                        {getStatusText(payment.status)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="btn-group" role="group">
                                                        {payment.paymentSlipPath && getStatusText(payment.status) === 'Pending' && (
                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => handleVerifyPayment(payment.paymentId)}
                                                                title="Verify Payment"
                                                            >
                                                                <i className="bi bi-check-circle"></i>
                                                            </button>
                                                        )}
                                                        {getStatusText(payment.status) !== 'Paid' && (
                                                            <button
                                                                className="btn btn-sm btn-outline-success"
                                                                onClick={() => handleUpdatePaymentStatus(payment.paymentId, 1)} //1 means Paid
                                                                title="Mark as Paid"
                                                            >
                                                                <i className="bi bi-check"></i>
                                                            </button>
                                                        )}
                                                        {payment.paymentSlipPath && (
                                                            <a
                                                                href={getImageUrl(payment.paymentSlipPath)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn btn-sm btn-outline-info"
                                                                title="View Payment Slip"
                                                            >
                                                                <i className="bi bi-file-earmark-pdf"></i>
                                                            </a>
                                                        )}
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

export default LandlordPaymentManagement;

