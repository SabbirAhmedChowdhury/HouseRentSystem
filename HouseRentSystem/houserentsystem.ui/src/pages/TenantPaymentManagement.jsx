/* eslint-disable no-unused-vars */
/**
 * Tenant Payment Management Page
 * Allows tenants to view their payment history, pending payments, upload payment slips, and track payment status
 */
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';

const TenantPaymentManagement = () => {
    const { user } = useContext(AuthContext);
    const [payments, setPayments] = useState([]);
    const [pendingPayments, setPendingPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [slipFile, setSlipFile] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchPayments();
    }, []);

    /**
     * Fetches all payment history and pending payments for the current tenant
     */
    const fetchPayments = async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch payment history
            const historyRes = await api.get(`/payments/tenant/${user.userId}/history`).catch(() => ({ data: [] }));
            const allPayments = Array.isArray(historyRes.data) ? historyRes.data : [];
            setPayments(allPayments);

            // Fetch pending payments
            const pendingRes = await api.get(`/payments/tenant/${user.userId}/pending`).catch(() => ({ data: [] }));
            const pending = Array.isArray(pendingRes.data) ? pendingRes.data : [];
            setPendingPayments(pending);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load payments');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handles payment slip upload
     * @param {number} paymentId - The ID of the payment to upload slip for
     */
    const handleUploadSlip = async (paymentId) => {
        if (!slipFile) {
            alert('Please select a file to upload');
            return;
        }

        const formData = new FormData();
        formData.append('slipFile', slipFile);

        try {
            await api.post(`/payments/${paymentId}/slip`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            alert('Payment slip uploaded successfully');
            window.location.reload();
            setSelectedPayment(null);
            setSlipFile(null);
            fetchPayments();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to upload payment slip');
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
     * Filters payments based on selected status
     */
    const filteredPayments = payments.filter((payment) => {
        const statusText = getStatusText(payment.status);
        if (filterStatus === 'all') return true;
        if (filterStatus === 'overdue') return isOverdue(payment);
        return statusText.toLowerCase() === filterStatus.toLowerCase();
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
                    <p className="lead text-muted">View and manage your rent payments</p>
                </div>

                {error && (
                    <div className="alert alert-danger text-center">{error}</div>
                )}

                {/* Pending Payments Section */}
                {pendingPayments.length > 0 && (
                    <div className="card border-0 shadow-lg mb-5">
                        <div className="card-header bg-warning text-dark">
                            <h5 className="mb-0">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                Pending Payments ({pendingPayments.length})
                            </h5>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Property</th>
                                            <th>Type</th>
                                            <th>Due Date</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingPayments.map((payment) => (
                                            <tr key={payment.paymentId} className={isOverdue(payment) ? 'table-danger' : ''}>
                                                <td>
                                                    <strong>{payment.lease?.property?.address || 'N/A'}</strong>
                                                    <br />
                                                    <small className="text-muted">{payment.lease?.property?.city || ''}</small>
                                                </td>
                                                <td>
                                                    <span className={`badge ${(payment.paymentType === 1 || payment.paymentType === 'Rent') ? 'bg-primary' : 'bg-info'}`}>
                                                        {getPaymentTypeText(payment.paymentType)}
                                                    </span>
                                                </td>
                                                <td>
                                                    {new Date(payment.dueDate).toLocaleDateString()}
                                                    {isOverdue(payment) && (
                                                        <>
                                                            <br />
                                                            <small className="text-danger">Overdue</small>
                                                        </>
                                                    )}
                                                </td>
                                                <td>BDT {payment.amountPaid?.toLocaleString() || '0'}</td>
                                                <td>
                                                    <span className={getStatusBadge(payment.status)}>
                                                        {getStatusText(payment.status)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => setSelectedPayment(payment)}
                                                        data-bs-toggle="modal"
                                                        data-bs-target="#uploadSlipModal"
                                                    >
                                                        <i className="bi bi-upload me-1"></i>
                                                        Upload Slip
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment History Section */}
                <div className="card border-0 shadow-lg">
                    <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">
                            <i className="bi bi-clock-history me-2"></i>
                            Payment History
                        </h5>
                        <div className="d-flex gap-2">
                            <select
                                className="form-select form-select-sm"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                style={{ width: 'auto' }}
                            >
                                <option value="all">All Payments</option>
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="overdue">Overdue</option>
                            </select>
                        </div>
                    </div>
                    <div className="card-body p-0">
                        {filteredPayments.length === 0 ? (
                            <div className="p-5 text-center text-muted">
                                <i className="bi bi-inbox display-1 d-block mb-3"></i>
                                <p>No payment history found.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Property</th>
                                            <th>Type</th>
                                            <th>Due Date</th>
                                            <th>Payment Date</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            {/*<th>Actions</th>*/}
                                        </tr>
                                    </thead>
                                        <tbody>
                                        {filteredPayments.map((payment) => (
                                            <tr key={payment.paymentId} className={isOverdue(payment) ? 'table-danger' : ''}>
                                                <td>
                                                    <strong>{payment.propertyAddress || payment.lease?.property?.address || 'N/A'}</strong>
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
                                                <td>
                                                    <span className={getStatusBadge(payment.status)}>
                                                        {getStatusText(payment.status)}
                                                    </span>
                                                </td>
                                                {/*<td>*/}
                                                {/*    {getStatusText(payment.status) === 'Pending' && (*/}
                                                {/*        <button*/}
                                                {/*            className="btn btn-sm btn-primary"*/}
                                                {/*            onClick={() => setSelectedPayment(payment)}*/}
                                                {/*            data-bs-toggle="modal"*/}
                                                {/*            data-bs-target="#uploadSlipModal"*/}
                                                {/*        >*/}
                                                {/*            <i className="bi bi-upload me-1"></i>*/}
                                                {/*            Upload Slip*/}
                                                {/*        </button>*/}
                                                {/*    )}*/}
                                                {/*    {payment.paymentSlipPath && (*/}
                                                {/*        <a*/}
                                                {/*            href={payment.paymentSlipPath}*/}
                                                {/*            target="_blank"*/}
                                                {/*            rel="noopener noreferrer"*/}
                                                {/*            className="btn btn-sm btn-outline-info ms-1"*/}
                                                {/*        >*/}
                                                {/*            <i className="bi bi-file-earmark-pdf"></i>*/}
                                                {/*        </a>*/}
                                                {/*    )}*/}
                                                {/*</td>*/}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Upload Slip Modal */}
                <div className="modal fade" id="uploadSlipModal" tabIndex="-1" aria-labelledby="uploadSlipModalLabel" aria-hidden="true">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="uploadSlipModalLabel">Upload Payment Slip</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body">
                                {selectedPayment && (
                                    <div className="mb-3">
                                        <p><strong>Property:</strong> {selectedPayment.lease?.property?.address || 'N/A'}</p>
                                        <p><strong>Amount:</strong> BDT {selectedPayment.amountPaid?.toLocaleString() || '0'}</p>
                                        <p><strong>Due Date:</strong> {new Date(selectedPayment.dueDate).toLocaleDateString()}</p>
                                    </div>
                                )}
                                <div className="mb-3">
                                    <label htmlFor="slipFile" className="form-label">Payment Slip (PDF/Image)</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        id="slipFile"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => setSlipFile(e.target.files[0])}
                                    />
                                    <small className="form-text text-muted">Upload your payment receipt or slip</small>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => selectedPayment && handleUploadSlip(selectedPayment.paymentId)}
                                    disabled={!slipFile}
                                >
                                    Upload
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default TenantPaymentManagement;

