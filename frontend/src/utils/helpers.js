// Safe rating helper
export const getSafeRating = (rating) => {
    const numRating = parseFloat(rating);
    return !isNaN(numRating) ? numRating : 0;
};

// Format rating for display
export const formatRating = (rating) => {
    const safeRating = getSafeRating(rating);
    return safeRating > 0 ? safeRating.toFixed(1) : '0.0';
};