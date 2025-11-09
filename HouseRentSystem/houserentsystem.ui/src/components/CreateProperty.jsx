//import React, { useState, useContext } from 'react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';

const CreateProperty = () => {
    //const { user } = useContext(AuthContext);
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

    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle text input change
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({
            ...form,
            [name]: type === 'checkbox' ? checked : value,
        });
        // Clear field error on change
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    /**
     * Handles multiple image file selection
     * Supports selecting multiple images at once
     */
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Validate file count (max 10 images)
        if (images.length + files.length > 10) {
            setSubmitError('Maximum 10 images allowed');
            return;
        }

        // Validate file types and sizes
        const validFiles = [];
        const invalidFiles = [];

        files.forEach(file => {
            if (!file.type.startsWith('image/')) {
                invalidFiles.push(file.name + ' (not an image)');
            } else if (file.size > 5 * 1024 * 1024) { // 5MB limit
                invalidFiles.push(file.name + ' (file too large, max 5MB)');
            } else {
                validFiles.push(file);
            }
        });

        if (invalidFiles.length > 0) {
            setSubmitError(`Invalid files: ${invalidFiles.join(', ')}`);
        }

        if (validFiles.length > 0) {
            const newImages = [...images, ...validFiles];
            setImages(newImages);

            // Create previews for new images
            validFiles.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreviews(prev => [...prev, reader.result]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    /**
     * Removes an image from the selection
     */
    const handleRemoveImage = (index) => {
        const newImages = images.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        setImages(newImages);
        setImagePreviews(newPreviews);
    };

    // Client-side validation
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

    // Submit handler
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
        
        // Append multiple images
        images.forEach((image, index) => {
            formData.append('Images', image);
        });

        try {
            await api.post('/Property', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            navigate('/landlord-dashboard');
        } catch (err) {
            setSubmitError(err.response?.data?.message || 'Failed to create property');
        } finally {
            setIsSubmitting(false);
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
                                    <i className="bi bi-plus-circle me-2"></i>
                                    List a New Property
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

                                        {/* Multiple Images Upload */}
                                        <div className="col-12">
                                            <label className="form-label">
                                                Property Images <span className="text-danger">*</span>
                                                <small className="text-muted ms-2">(Select multiple images, max 10)</small>
                                            </label>
                                            <input
                                                type="file"
                                                className="form-control"
                                                accept="image/*"
                                                multiple
                                                onChange={handleImageChange}
                                            />
                                            <small className="text-muted d-block mt-1">
                                                First image will be used as thumbnail. Supported formats: JPG, PNG, GIF. Max size: 5MB per image.
                                            </small>
                                            
                                            {/* Image Previews */}
                                            {imagePreviews.length > 0 && (
                                                <div className="mt-3">
                                                    <div className="row g-2">
                                                        {imagePreviews.map((preview, index) => (
                                                            <div key={index} className="col-md-3 col-sm-4 col-6">
                                                                <div className="position-relative">
                                                                    <img
                                                                        src={preview}
                                                                        alt={`Preview ${index + 1}`}
                                                                        className="img-fluid rounded border"
                                                                        style={{ 
                                                                            height: '150px', 
                                                                            width: '100%', 
                                                                            objectFit: 'cover',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    />
                                                                    {index === 0 && (
                                                                        <span className="badge bg-primary position-absolute top-0 start-0 m-1">
                                                                            Thumbnail
                                                                        </span>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                                                                        onClick={() => handleRemoveImage(index)}
                                                                        title="Remove image"
                                                                    >
                                                                        <i className="bi bi-x"></i>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <small className="text-muted d-block mt-2">
                                                        {imagePreviews.length} image(s) selected. Drag to reorder (coming soon).
                                                    </small>
                                                </div>
                                            )}
                                        </div>

                                        {/* Submit */}
                                        <div className="col-12 mt-4 d-flex gap-2">
                                            <button
                                                type="submit"
                                                className="btn btn-primary flex-fill"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" />
                                                        Creating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-check-circle me-2"></i>
                                                        Create Property
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                onClick={() => navigate('/landlord-dashboard')}
                                                disabled={isSubmitting}
                                                title="Cancel and go to dashboard"
                                            >
                                                <i className="bi bi-x-circle me-1"></i>
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

export default CreateProperty;