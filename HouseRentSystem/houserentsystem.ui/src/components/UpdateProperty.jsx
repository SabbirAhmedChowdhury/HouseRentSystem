/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';
import { getImageUrl } from '../utils/imageUtils';
import { getDashboardRoute } from '../utils/navigationUtils';

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

    const [existingImages, setExistingImages] = useState([]); // Images from server with IDs
    const [newImages, setNewImages] = useState([]); // New images to upload
    const [newImagePreviews, setNewImagePreviews] = useState([]);
    const [deletedImageIds, setDeletedImageIds] = useState([]); // IDs of images to delete
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
                
                // Set existing images from server (use ImageDetails if available, fallback to Images)
                // Convert relative paths to full URLs for display
                if (data.imageDetails && data.imageDetails.length > 0) {
                    setExistingImages(data.imageDetails.map(img => ({
                        imageId: img.imageId,
                        imagePath: getImageUrl(img.imagePath) // Convert to full URL
                    })));
                } else if (data.images && data.images.length > 0) {
                    // Fallback: create image details from paths (without IDs for deletion)
                    setExistingImages(data.images.map((path, index) => ({ 
                        imageId: null, 
                        imagePath: getImageUrl(path) // Convert to full URL
                    })));
                }
                
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

    /**
     * Handles multiple new image file selection
     */
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Calculate total images (existing + new)
        const totalImages = existingImages.filter(img => !deletedImageIds.includes(img.imageId)).length + newImages.length;
        
        // Validate file count (max 10 images total)
        if (totalImages + files.length > 10) {
            setSubmitError('Maximum 10 images allowed total');
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
            const updatedNewImages = [...newImages, ...validFiles];
            setNewImages(updatedNewImages);

            // Create previews for new images
            validFiles.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setNewImagePreviews(prev => [...prev, reader.result]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    /**
     * Removes a new image from the selection
     */
    const handleRemoveNewImage = (index) => {
        const updatedNewImages = newImages.filter((_, i) => i !== index);
        const updatedPreviews = newImagePreviews.filter((_, i) => i !== index);
        setNewImages(updatedNewImages);
        setNewImagePreviews(updatedPreviews);
    };

    /**
     * Marks an existing image for deletion
     */
    const handleDeleteExistingImage = (imageId) => {
        if (imageId) {
            setDeletedImageIds(prev => [...prev, imageId]);
        }
    };

    /**
     * Restores a previously marked image for deletion
     */
    const handleRestoreImage = (imageId) => {
        setDeletedImageIds(prev => prev.filter(id => id !== imageId));
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

        try {
            // First, delete marked images
            for (const imageId of deletedImageIds) {
                try {
                    await api.delete(`/Property/images/${imageId}`);
                } catch (err) {
                    console.error(`Failed to delete image ${imageId}:`, err);
                }
            }

            // Then, update property with new images if any
            if (newImages.length > 0) {
                const formData = new FormData();
                Object.keys(form).forEach((key) => {
                    if (form[key] !== null && form[key] !== undefined) {
                        formData.append(key, form[key]);
                    }
                });
                
                // Append new images
                newImages.forEach((image) => {
                    formData.append('Images', image);
                });

                await api.put(`/Property/${id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                // Just update property data without images
                const formData = new FormData();
                Object.keys(form).forEach((key) => {
                    if (form[key] !== null && form[key] !== undefined) {
                        formData.append(key, form[key]);
                    }
                });

                await api.put(`/Property/${id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

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

                                        {/* Property Images */}
                                        <div className="col-12">
                                            <label className="form-label">
                                                Property Images
                                                <small className="text-muted ms-2">(Add more images, max 10 total)</small>
                                            </label>
                                            
                                            {/* Existing Images */}
                                            {existingImages.length > 0 && (
                                                <div className="mb-3">
                                                    <h6 className="text-muted">Existing Images</h6>
                                                    <div className="row g-2">
                                                        {existingImages.map((img, index) => {
                                                            const isDeleted = img.imageId && deletedImageIds.includes(img.imageId);
                                                            const canDelete = img.imageId !== null && img.imageId !== undefined;
                                                            return (
                                                                <div key={img.imageId || `img-${index}`} className="col-md-3 col-sm-4 col-6">
                                                                    <div className={`position-relative ${isDeleted ? 'opacity-50' : ''}`}>
                                                                        <img
                                                                            src={img.imagePath}
                                                                            alt={`Property ${index + 1}`}
                                                                            className="img-fluid rounded border"
                                                                            style={{ 
                                                                                height: '150px', 
                                                                                width: '100%', 
                                                                                objectFit: 'cover'
                                                                            }}
                                                                        />
                                                                        {index === 0 && !isDeleted && (
                                                                            <span className="badge bg-primary position-absolute top-0 start-0 m-1">
                                                                                Thumbnail
                                                                            </span>
                                                                        )}
                                                                        {canDelete && (
                                                                            <button
                                                                                type="button"
                                                                                className={`btn btn-sm position-absolute top-0 end-0 m-1 ${
                                                                                    isDeleted ? 'btn-success' : 'btn-danger'
                                                                                }`}
                                                                                onClick={() => 
                                                                                    isDeleted 
                                                                                        ? handleRestoreImage(img.imageId) 
                                                                                        : handleDeleteExistingImage(img.imageId)
                                                                                }
                                                                                title={isDeleted ? 'Restore image' : 'Delete image'}
                                                                            >
                                                                                <i className={`bi ${isDeleted ? 'bi-arrow-counterclockwise' : 'bi-trash'}`}></i>
                                                                            </button>
                                                                        )}
                                                                        {isDeleted && (
                                                                            <div className="position-absolute bottom-0 start-0 end-0 bg-danger text-white text-center p-1">
                                                                                Will be deleted
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* New Images Upload */}
                                            <div className="mb-3">
                                                <input
                                                    type="file"
                                                    className="form-control"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={handleImageChange}
                                                />
                                                <small className="text-muted d-block mt-1">
                                                    Add more images. Supported formats: JPG, PNG, GIF. Max size: 5MB per image.
                                                </small>
                                            </div>

                                            {/* New Image Previews */}
                                            {newImagePreviews.length > 0 && (
                                                <div className="mt-3">
                                                    <h6 className="text-muted">New Images to Upload</h6>
                                                    <div className="row g-2">
                                                        {newImagePreviews.map((preview, index) => (
                                                            <div key={index} className="col-md-3 col-sm-4 col-6">
                                                                <div className="position-relative">
                                                                    <img
                                                                        src={preview}
                                                                        alt={`New preview ${index + 1}`}
                                                                        className="img-fluid rounded border"
                                                                        style={{ 
                                                                            height: '150px', 
                                                                            width: '100%', 
                                                                            objectFit: 'cover'
                                                                        }}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                                                                        onClick={() => handleRemoveNewImage(index)}
                                                                        title="Remove image"
                                                                    >
                                                                        <i className="bi bi-x"></i>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <small className="text-muted d-block">
                                                Total images: {existingImages.filter(img => !img.imageId || !deletedImageIds.includes(img.imageId)).length + newImages.length} / 10
                                            </small>
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
                                                className="btn btn-outline-secondary"
                                                onClick={() => navigate('/landlord-dashboard')}
                                                disabled={isSubmitting}
                                                title="Cancel and go to dashboard"
                                            >
                                                <i className="bi bi-x-circle me-1"></i>
                                                Cancel
                                            </button>
                                            {user && (
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-primary"
                                                    onClick={() => navigate(getDashboardRoute(user.role))}
                                                    disabled={isSubmitting}
                                                    title="Go to Dashboard"
                                                >
                                                    <i className="bi bi-house"></i>
                                                </button>
                                            )}
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