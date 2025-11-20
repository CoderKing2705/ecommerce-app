import { pool } from '../config/database.js';

export const getProducts = async (req, res) => {
    try {
        const { category, search, sort } = req.query;

        let query = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        if (category && category !== 'All') {
            params.push(category);
            query += ` AND category = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`;
        }

        if (sort === 'price-low') {
            query += ' ORDER BY price ASC';
        } else if (sort === 'price-high') {
            query += ' ORDER BY price DESC';
        } else {
            query += ' ORDER BY created_at DESC';
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const searchProducts = async (req, res) => {
    try {
        const {
            search = '',
            category = '',
            brand = '',
            minPrice = 0,
            maxPrice = 10000,
            minRating = 0,
            inStock = false,
            sortBy = 'name',
            page = 1,
            limit = 12
        } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 12;
        const offset = (pageNum - 1) * limitNum;
        let queryParams = [];
        let whereConditions = [];

        // Base query with inventory and rating info
        let baseQuery = `
            SELECT 
                p.*,
                COALESCE(p.average_rating, 0) as average_rating,
                COALESCE(p.review_count, 0) as review_count,
                COALESCE(i.current_stock, 0) as stock_quantity
            FROM products p
            LEFT JOIN inventory i ON p.id = i.product_id
            WHERE 1=1
        `;

        // Search term
        if (search) {
            whereConditions.push(`(
                p.name ILIKE $${queryParams.length + 1} OR 
                p.description ILIKE $${queryParams.length + 1} OR 
                p.brand ILIKE $${queryParams.length + 1} OR
                p.category ILIKE $${queryParams.length + 1}
            )`);
            queryParams.push(`%${search}%`);
        }

        // Category filter
        if (category) {
            whereConditions.push(`p.category = $${queryParams.length + 1}`);
            queryParams.push(category);
        }

        // Brand filter
        if (brand) {
            whereConditions.push(`p.brand = $${queryParams.length + 1}`);
            queryParams.push(brand);
        }

        // Price range
        if (minPrice > 0) {
            whereConditions.push(`p.price >= $${queryParams.length + 1}`);
            queryParams.push(parseFloat(minPrice));
        }
        if (maxPrice < 10000) {
            whereConditions.push(`p.price <= $${queryParams.length + 1}`);
            queryParams.push(parseFloat(maxPrice));
        }

        // Rating filter
        if (minRating > 0) {
            whereConditions.push(`COALESCE(p.average_rating, 0) >= $${queryParams.length + 1}`);
            queryParams.push(parseFloat(minRating));
        }

        // Stock filter
        if (inStock === 'true') {
            whereConditions.push(`COALESCE(i.current_stock, 0) > 0`);
        }

        // Add WHERE conditions
        if (whereConditions.length > 0) {
            baseQuery += ' AND ' + whereConditions.join(' AND ');
        }

        // Sorting
        let orderBy = 'p.name ASC';
        switch (sortBy) {
            case 'price-low':
                orderBy = 'p.price ASC';
                break;
            case 'price-high':
                orderBy = 'p.price DESC';
                break;
            case 'rating':
                orderBy = 'average_rating DESC';
                break;
            case 'newest':
                orderBy = 'p.created_at DESC';
                break;
            case 'popular':
                orderBy = 'review_count DESC';
                break;
            default:
                orderBy = 'p.name ASC';
        }

        // Count query for pagination
        const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) as filtered`;
        const countResult = await pool.query(countQuery, queryParams);
        const totalCount = parseInt(countResult.rows[0].count);

        // Main query with pagination
        const resultQuery = baseQuery + ` ORDER BY ${orderBy} LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limitNum, offset);

        const result = await pool.query(resultQuery, queryParams);

        // Get filter options for UI (categories, brands, price range)
        const filterOptions = await pool.query(`
            SELECT 
                COALESCE(JSON_AGG(DISTINCT category) FILTER (WHERE category IS NOT NULL), '[]') as categories,
                COALESCE(JSON_AGG(DISTINCT brand) FILTER (WHERE brand IS NOT NULL), '[]') as brands,
                COALESCE(MIN(price), 0) as min_price,
                COALESCE(MAX(price), 1000) as max_price
            FROM products
            WHERE price > 0
        `);

        res.json({
            success: true,
            data: {
                products: result.rows,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalCount / limitNum),
                    totalItems: totalCount,
                    itemsPerPage: limitNum
                },
                filterOptions: filterOptions.rows[0]
            }
        });

    } catch (error) {
        console.error('Search products error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};


export const getSearchSuggestions = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.json({
                success: true,
                data: {
                    products: [],
                    categories: [],
                    brands: []
                }
            });
        }

        const searchTerm = `%${q}%`;

        // Search products
        const productsResult = await pool.query(`
            SELECT id, name, image_url, category, brand 
            FROM products 
            WHERE name ILIKE $1 OR brand ILIKE $1
            LIMIT 5
        `, [searchTerm]);

        // Search categories
        const categoriesResult = await pool.query(`
            SELECT DISTINCT category 
            FROM products 
            WHERE category ILIKE $1
            LIMIT 5
        `, [searchTerm]);

        // Search brands
        const brandsResult = await pool.query(`
            SELECT DISTINCT brand 
            FROM products 
            WHERE brand ILIKE $1
            LIMIT 5
        `, [searchTerm]);

        res.json({
            success: true,
            data: {
                products: productsResult.rows,
                categories: categoriesResult.rows.map(row => row.category),
                brands: brandsResult.rows.map(row => row.brand)
            }
        });

    } catch (error) {
        console.error('Get search suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

export const getFilterOptions = async (req, res) => {
    try {
        const filterOptions = await pool.query(`
            SELECT 
                COALESCE(JSON_AGG(DISTINCT category) FILTER (WHERE category IS NOT NULL), '[]') as categories,
                COALESCE(JSON_AGG(DISTINCT brand) FILTER (WHERE brand IS NOT NULL), '[]') as brands,
                COALESCE(MIN(price), 0) as min_price,
                COALESCE(MAX(price), 1000) as max_price
            FROM products
            WHERE price > 0
        `);

        res.json({
            success: true,
            data: filterOptions.rows[0]
        });

    } catch (error) {
        console.error('Get filter options error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get product by ID error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, image_url, category, brand, size, color, stock_quantity } = req.body;

        const result = await pool.query(
            `INSERT INTO products (name, description, price, image_url, category, brand, size, color, stock_quantity) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [name, description, price, image_url, category, brand, size, color, stock_quantity]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, image_url, category, brand, size, color, stock_quantity } = req.body;

        const result = await pool.query(
            `UPDATE products 
       SET name = $1, description = $2, price = $3, image_url = $4, category = $5, brand = $6, size = $7, color = $8, stock_quantity = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 RETURNING *`,
            [name, description, price, image_url, category, brand, size, color, stock_quantity, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};