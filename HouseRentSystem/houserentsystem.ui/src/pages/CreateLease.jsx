/* eslint-disable no-unused-vars */
/**
 * Create Lease Page
 * Allows landlords to create new lease agreements for their properties
 */
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';

const CreateLease = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [form, setForm] = useState({
        propertyId: '',
        tenantEmail: '',
        startDate: '',
        endDate: '',
        monthlyRent: '',
        termsAndConditions: '',
    });
    const [properties, setProperties] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchProperties();
        // Note: In a real application, you might want to fetch a list of verified tenants
        // For now, tenantId will be entered manually
    }, []);

    /**
     * Fetches available properties owned by the landlord
     */
    const fetchProperties = async () => {
        try {
            const res = await api.get(`/Property/landlord/${user.userId}`);
            const availableProperties = (res.data || []).filter((p) => p.isAvailable);
            setProperties(availableProperties);
        } catch (err) {
            setError('Failed to load properties');
        }
    };

    /**
     * Handles form input changes
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
        // Clear error for this field
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
        // Auto-fill rent amount when property is selected
        if (name === 'propertyId') {
            const selectedProperty = properties.find((p) => p.propertyId === parseInt(value));
            if (selectedProperty) {
                setForm({ ...form, propertyId: value, monthlyRent: selectedProperty.rentAmount });
            }
        }
    };

    /**
     * Validates the lease form
     */
    const validateForm = () => {
        const newErrors = {};
        if (!form.propertyId) newErrors.propertyId = 'Property is required';
        if (!form.tenantEmail) {
            newErrors.tenantEmail = 'Tenant email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.tenantEmail)) {
            newErrors.tenantEmail = 'Please enter a valid email address';
        }
        if (!form.startDate) newErrors.startDate = 'Start date is required';
        // End date is now optional
        if (form.endDate && form.startDate && new Date(form.endDate) <= new Date(form.startDate)) {
            newErrors.endDate = 'End date must be after start date';
        }
        if (!form.monthlyRent || form.monthlyRent < 1) newErrors.monthlyRent = 'Valid rent amount is required';
        return newErrors;
    };

    /**
     * Submits the lease creation form
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        setError('');
        try {
            const leaseData = {
                propertyId: parseInt(form.propertyId),
                tenantEmail: form.tenantEmail.trim(),
                startDate: form.startDate,
                endDate: form.endDate || null, // End date is optional
                monthlyRent: parseFloat(form.monthlyRent),
                termsAndConditions: form.termsAndConditions || null,
            };
            await api.post('/Lease', leaseData);
            alert('Lease created successfully!');
            navigate('/landlord-lease-management');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create lease');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-lg">
                            <div className="card-header bg-primary text-white">
                                <h4 className="mb-0">
                                    <i className="bi bi-file-earmark-plus me-2"></i>
                                    Create New Lease
                                </h4>
                            </div>
                            <div className="card-body p-5">
                                {error && (
                                    <div className="alert alert-danger">{error}</div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="row g-3">
                                        {/* Property Selection */}
                                        <div className="col-12">
                                            <label className="form-label">
                                                Property <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                name="propertyId"
                                                className={`form-select ${errors.propertyId ? 'is-invalid' : ''}`}
                                                value={form.propertyId}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="">Select a property</option>
                                                {properties.map((prop) => (
                                                    <option key={prop.propertyId} value={prop.propertyId}>
                                                        {prop.address}, {prop.city} - BDT {prop.rentAmount?.toLocaleString()}/month
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.propertyId && (
                                                <div className="invalid-feedback">{errors.propertyId}</div>
                                            )}
                                            {properties.length === 0 && (
                                                <small className="text-muted">
                                                    No available properties. <Link to="/property/create">Create a property</Link> first.
                                                </small>
                                            )}
                                        </div>

                                        {/* Tenant Email */}
                                        <div className="col-12">
                                            <label className="form-label">
                                                Tenant Email <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                name="tenantEmail"
                                                className={`form-control ${errors.tenantEmail ? 'is-invalid' : ''}`}
                                                value={form.tenantEmail}
                                                onChange={handleChange}
                                                placeholder="tenant@example.com"
                                                required
                                            />
                                            {errors.tenantEmail && (
                                                <div className="invalid-feedback">{errors.tenantEmail}</div>
                                            )}
                                            <small className="text-muted">
                                                Enter the email address of the tenant who will be leasing this property
                                            </small>
                                        </div>

                                        {/* Start Date */}
                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Start Date <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                name="startDate"
                                                className={`form-control ${errors.startDate ? 'is-invalid' : ''}`}
                                                value={form.startDate}
                                                onChange={handleChange}
                                                min={new Date().toISOString().split('T')[0]}
                                                required
                                            />
                                            {errors.startDate && (
                                                <div className="invalid-feedback">{errors.startDate}</div>
                                            )}
                                        </div>

                                        {/* End Date - Optional */}
                                        <div className="col-md-6">
                                            <label className="form-label">
                                                End Date <small className="text-muted">(Optional)</small>
                                            </label>
                                            <input
                                                type="date"
                                                name="endDate"
                                                className={`form-control ${errors.endDate ? 'is-invalid' : ''}`}
                                                value={form.endDate}
                                                onChange={handleChange}
                                                min={form.startDate || new Date().toISOString().split('T')[0]}
                                            />
                                            {errors.endDate && (
                                                <div className="invalid-feedback">{errors.endDate}</div>
                                            )}
                                            <small className="text-muted">
                                                Leave empty for open-ended lease
                                            </small>
                                        </div>

                                        {/* Monthly Rent */}
                                        <div className="col-12">
                                            <label className="form-label">
                                                Monthly Rent (BDT) <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="monthlyRent"
                                                className={`form-control ${errors.monthlyRent ? 'is-invalid' : ''}`}
                                                value={form.monthlyRent}
                                                onChange={handleChange}
                                                min="1"
                                                step="0.01"
                                                required
                                            />
                                            {errors.monthlyRent && (
                                                <div className="invalid-feedback">{errors.monthlyRent}</div>
                                            )}
                                        </div>

                                        {/* Terms and Conditions */}
                                        <div className="col-12">
                                            <label className="form-label">Terms and Conditions</label>
                                            <textarea
                                                name="termsAndConditions"
                                                className="form-control"
                                                rows="5"
                                                value={form.termsAndConditions}
                                                onChange={handleChange}
                                                placeholder="Enter lease terms and conditions (optional)"
                                            />
                                        </div>

                                        {/* Submit Button */}
                                        <div className="col-12 mt-4">
                                            <div className="d-flex gap-2">
                                                <button
                                                    type="submit"
                                                    className="btn btn-primary flex-fill"
                                                    disabled={loading}
                                                >
                                                    {loading ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2" />
                                                            Creating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="bi bi-check-circle me-2"></i>
                                                            Create Lease
                                                        </>
                                                    )}
                                                </button>
                                                <Link
                                                    to="/landlord-lease-management"
                                                    className="btn btn-outline-secondary"
                                                >
                                                    Cancel
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CreateLease;

