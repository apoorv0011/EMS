-- Seed data for testing

-- Insert sample categories
INSERT INTO categories (name, slug, description, is_active) VALUES
('Electronics', 'electronics', 'Electronic devices and accessories', true),
('Clothing', 'clothing', 'Fashion and apparel', true),
('Home & Garden', 'home-garden', 'Home improvement and garden supplies', true),
('Sports', 'sports', 'Sports equipment and fitness gear', true),
('Books', 'books', 'Books and literature', true);

-- Insert sample memberships
INSERT INTO memberships (name, description, price, duration_days, features, is_active) VALUES
('Basic', 'Basic membership with limited features', 0.00, 365, '{"max_products": 10, "support": "email"}', true),
('Pro', 'Professional membership with advanced features', 29.99, 365, '{"max_products": 100, "support": "priority", "analytics": true}', true),
('Enterprise', 'Enterprise membership with unlimited features', 99.99, 365, '{"max_products": -1, "support": "dedicated", "analytics": true, "api_access": true}', true);
