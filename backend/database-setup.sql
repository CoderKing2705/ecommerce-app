-- Create database (run this separately in psql)
-- CREATE DATABASE ecommerce_db;

-- Connect to ecommerce_db and run the following:

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'USER',
    google_id VARCHAR(255),
    avatar VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    category VARCHAR(100),
    brand VARCHAR(100),
    size VARCHAR(50),
    color VARCHAR(50),
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart table
CREATE TABLE IF NOT EXISTS cart (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Insert sample products
INSERT INTO products (name, description, price, image_url, category, brand, size, color, stock_quantity) VALUES
('Classic White T-Shirt', 'Premium quality cotton t-shirt for everyday wear. Made from 100% organic cotton for maximum comfort.', 29.99, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop', 'T-Shirts', 'BasicWear', 'M', 'White', 50),
('Designer Blue Jeans', 'Comfortable and stylish denim jeans with modern fit. Perfect for casual outings and everyday wear.', 89.99, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop', 'Jeans', 'DenimCo', '32', 'Blue', 30),
('Floral Summer Dress', 'Beautiful floral pattern dress for summer occasions. Lightweight and breathable fabric.', 59.99, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop', 'Dresses', 'SummerStyle', 'S', 'Multicolor', 25),
('Sports Jacket', 'Water-resistant sports jacket for outdoor activities. Features multiple pockets and adjustable cuffs.', 129.99, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop', 'Jackets', 'ActiveWear', 'L', 'Black', 20),
('Running Shoes', 'High-performance running shoes with cushioned soles. Ideal for marathon training and daily jogging.', 79.99, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', 'Shoes', 'RunFast', '42', 'Red', 40),
('Leather Handbag', 'Genuine leather handbag with multiple compartments. Elegant design suitable for both casual and formal occasions.', 149.99, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop', 'Accessories', 'LuxuryBags', 'One Size', 'Brown', 15),
('Striped Polo Shirt', 'Classic striped polo shirt with collar. Made from pique cotton for a premium look and feel.', 45.99, 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=400&fit=crop', 'T-Shirts', 'PoloStyle', 'L', 'Navy Blue', 35),
('Winter Coat', 'Warm winter coat with insulation. Features faux fur hood and waterproof exterior.', 199.99, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=400&fit=crop', 'Jackets', 'WinterGear', 'M', 'Beige', 10),
('Casual Sneakers', 'Comfortable casual sneakers for everyday wear. Available in multiple colors with memory foam insoles.', 69.99, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop', 'Shoes', 'UrbanSteps', '43', 'White', 60),
('Summer Shorts', 'Lightweight cotton shorts perfect for summer. Elastic waistband with adjustable drawstring.', 35.99, 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop', 'Shorts', 'BeachWear', 'M', 'Khaki', 45);

-- Create an admin user (password: admin123)
INSERT INTO users (email, password, name, role) VALUES (
  'admin@example.com', 
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdCv3rKn5rj5qCO', 
  'Admin User', 
  'ADMIN'
);

-- Create a regular user (password: user123)
INSERT INTO users (email, password, name) VALUES (
  'user@example.com', 
  '$2a$12$6aYZN7el/.QPrWrZ8PuS7.V1pR6/.Lj/GjbK1jUf8k.Y1bTfR4t8e', 
  'Regular User'
);