/**
 * Utility functions for handling image URLs
 * Constructs proper URLs for images stored on the server
 */

// Get the API base URL without the /api suffix for static file serving
const getBaseUrl = () => {
    // Try to get from environment variable first
    let apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    
    // If not set, extract from the api instance baseURL or use default
    if (!apiBaseUrl) {
        // Default to the same host/port as the API but without /api
        apiBaseUrl = 'https://localhost:7194';
    }
    
    // Remove /api if present, as static files are served from root
    return apiBaseUrl.replace('/api', '').replace(/\/$/, ''); // Also remove trailing slash
};

/**
 * Constructs a full URL for an image path stored in the database
 * @param {string} imagePath - Relative image path from database (e.g., "/FileStorage/images/...")
 * @returns {string} Full URL to access the image
 */
export const getImageUrl = (imagePath) => {
    if (!imagePath) {
        return null;
    }

    // If already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }

    // Ensure path starts with /
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    
    // Construct full URL
    const baseUrl = getBaseUrl();
    return `${baseUrl}${normalizedPath}`;
};

/**
 * Constructs URLs for multiple images
 * @param {string[]|Array<{imagePath: string}>} images - Array of image paths or objects with imagePath property
 * @returns {string[]} Array of full image URLs
 */
export const getImageUrls = (images) => {
    if (!images || !Array.isArray(images)) {
        return [];
    }

    return images.map(img => {
        if (typeof img === 'string') {
            return getImageUrl(img);
        } else if (img && img.imagePath) {
            return getImageUrl(img.imagePath);
        }
        return null;
    }).filter(url => url !== null);
};

export default {
    getImageUrl,
    getImageUrls
};

