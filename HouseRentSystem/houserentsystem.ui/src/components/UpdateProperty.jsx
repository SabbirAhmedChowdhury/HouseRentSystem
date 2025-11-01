/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';

const UpdateProperty = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [form, setForm] = useState({
        address: '',
        city: '',
        rentAmount: '',
        securityDeposit: '',
        bedrooms: '',
        bathrooms: '',
        amenities: '',
        description: '',
        isAvailable: true,
    });

    const [thumbnail, setThumbnail] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState('');
    const [originalThumbnail, setOriginalThumbnail] = useState('');
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch property on mount
    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const res = await api.get(`/Property/${id}`);
                const data = res.data;
                setForm({
                    address: data.address || '',
                    city: data.city || '',
                    rentAmount: data.rentAmount || '',
                    securityDeposit: data.securityDeposit || '',
                    bedrooms: data.bedrooms || '',
                    bathrooms: data.bathrooms || '',
                    amenities: data.amenities || '',
                    description: data.description || '',
                    isAvailable: data.isAvailable,
                });
                setOriginalThumbnail(data.thumbnail || '');
                setThumbnailPreview(data.thumbnail || '');
                setLoading(false);
            } catch (err) {
                setSubmitError('Failed to load property');
                setLoading(false);
            }
        };
        fetchProperty();
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({
            ...form,
            [name]: type === 'checkbox' ? checked : value,
        });
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setThumbnail(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setThumbnailPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!form.address) newErrors.address = 'Address is required';
        if (!form.city) newErrors.city = 'City is required';
        if (!form.rentAmount || form.rentAmount < 1000) newErrors.rentAmount = 'Rent must be at least 1000';
        if (!form.securityDeposit || form.securityDeposit < 0) newErrors.securityDeposit = 'Valid deposit required';
        if (!form.bedrooms || form.bedrooms < 1) newErrors.bedrooms = 'At least 1 bedroom';
        if (!form.bathrooms || form.bathrooms < 1) newErrors.bathrooms = 'At least 1 bathroom';
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsSubmitting(true);
        setSubmitError('');

        const formData = new FormData();
        Object.keys(form).forEach((key) => {
            formData.append(key, form[key]);
        });
        if (thumbnail) {
            formData.append('thumbnail', thumbnail);
        }

        try {
            await api.put(`/Property/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            navigate('/landlord-dashboard');
        } catch (err) {
            setSubmitError(err.response?.data?.message || 'Failed to update property');
        } finally {
            setIsSubmitting(false);
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
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-lg">
                            <div className="card-header bg-primary text-white">
                                <h4 className="mb-0">
                                    <i className="bi bi-pencil-square me-2"></i>
                                    Update Property
                                </h4>
                            </div>
                            <div className="card-body p-5">

                                {submitError && (
                                    <div className="alert alert-danger">{submitError}</div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="row g-3">
                                        {/* Address & City */}
                                        <div className="col-md-8">
                                            <label className="form-label">Address</label>
                                            <input
                                                type="text"
                                                name="address"
                                                className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                                                value={form.address}
                                                onChange={handleChange}
                                                placeholder="123 Main St, Apt 4B"
                                            />
                                            {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">City</label>
                                            <input
                                                type="text"
                                                name="city"
                                                className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                                                value={form.city}
                                                onChange={handleChange}
                                                placeholder="Dhaka"
                                            />
                                            {errors.city && <div className="invalid-feedback">{errors.city}</div>}
                                        </div>

                                        {/* Rent & Deposit */}
                                        <div className="col-md-6">
                                            <label className="form-label">Monthly Rent (BDT)</label>
                                            <input
                                                type="number"
                                                name="rentAmount"
                                                className={`form-control ${errors.rentAmount ? 'is-invalid' : ''}`}
                                                value={form.rentAmount}
                                                onChange={handleChange}
                                                min="1000"
                                            />
                                            {errors.rentAmount && <div className="invalid-feedback">{errors.rentAmount}</div>}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Security Deposit (BDT)</label>
                                            <input
                                                type="number"
                                                name="securityDeposit"
                                                className={`form-control ${errors.securityDeposit ? 'is-invalid' : ''}`}
                                                value={form.securityDeposit}
                                                onChange={handleChange}
                                                min="0"
                                            />
                                            {errors.securityDeposit && <div className="invalid-feedback">{errors.securityDeposit}</div>}
                                        </div>

                                        {/* Bedrooms & Bathrooms */}
                                        <div className="col-md-6">
                                            <label className="form-label">Bedrooms</label>
                                            <input
                                                type="number"
                                                name="bedrooms"
                                                className={`form-control ${errors.bedrooms ? 'is-invalid' : ''}`}
                                                value={form.bedrooms}
                                                onChange={handleChange}
                                                min="1"
                                                max="10"
                                            />
                                            {errors.bedrooms && <div className="invalid-feedback">{errors.bedrooms}</div>}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Bathrooms</label>
                                            <input
                                                type="number"
                                                name="bathrooms"
                                                className={`form-control ${errors.bathrooms ? 'is-invalid' : ''}`}
                                                value={form.bathrooms}
                                                onChange={handleChange}
                                                min="1"
                                                max="10"
                                            />
                                            {errors.bathrooms && <div className="invalid-feedback">{errors.bathrooms}</div>}
                                        </div>

                                        {/* Amenities */}
                                        <div className="col-12">
                                            <label className="form-label">Amenities (comma-separated)</label>
                                            <input
                                                type="text"
                                                name="amenities"
                                                className="form-control"
                                                value={form.amenities}
                                                onChange={handleChange}
                                                placeholder="WiFi, Parking, Gym"
                                            />
                                        </div>

                                        {/* Description */}
                                        <div className="col-12">
                                            <label className="form-label">Description</label>
                                            <textarea
                                                name="description"
                                                className="form-control"
                                                rows="4"
                                                value={form.description}
                                                onChange={handleChange}
                                                placeholder="Spacious 3BHK with balcony..."
                                            />
                                        </div>

                                        {/* Availability */}
                                        <div className="col-12">
                                            <div className="form-check">
                                                <input
                                                    type="checkbox"
                                                    name="isAvailable"
                                                    className="form-check-input"
                                                    id="isAvailable"
                                                    checked={form.isAvailable}
                                                    onChange={handleChange}
                                                />
                                                <label className="form-check-label" htmlFor="isAvailable">
                                                    Property is currently available
                                                </label>
                                            </div>
                                        </div>

                                        {/* Thumbnail */}
                                        <div className="col-12">
                                            <label className="form-label">Property Thumbnail</label>
                                            {thumbnailPreview && (
                                                <div className="mb-3">
                                                    <img
                                                        src={thumbnailPreview}
                                                        alt="Current thumbnail"
                                                        className="img-fluid rounded"
                                                        style={{ maxHeight: '200px' }}
                                                    />
                                                    {thumbnail && <p className="small text-success mt-1">New image selected</p>}
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                className="form-control"
                                                accept="image/*"
                                                onChange={handleThumbnailChange}
                                            />
                                        </div>

                                        {/* Buttons */}
                                        <div className="col-12 mt-4 d-flex gap-2">
                                            <button
                                                type="submit"
                                                className="btn btn-primary flex-fill"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" />
                                                        Updating...
                                                    </>
                                                ) : (
                                                    'Update Property'
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary flex-fill"
                                                onClick={() => navigate(-1)}
                                                disabled={isSubmitting}
                                            >
                                                Cancel
                                            </button>
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

export default UpdateProperty;