-- ======================================================================
-- SCRIPT KHỞI TẠO CƠ SỞ DỮ LIỆU SQLITE CHO HENNI SHOP
-- File: data/schema.sql
-- Nguồn dữ liệu: Dựa trên data/products.local.json
-- ======================================================================

PRAGMA foreign_keys = ON;

-- 1. BẢNG DANH MỤC (CATEGORIES)
DROP TABLE IF EXISTS product_colors;
DROP TABLE IF EXISTS product_sizes;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;

CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL
);

-- 2. BẢNG SẢN PHẨM (PRODUCTS)
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER NOT NULL,
    description TEXT DEFAULT '',
    base_price INTEGER NOT NULL,
    sale_price INTEGER DEFAULT NULL,
    source_url VARCHAR(500) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

-- 3. BẢNG HÌNH ẢNH SẢN PHẨM (PRODUCT_IMAGES)
CREATE TABLE product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 4. BẢNG KÍCH CỠ SẢN PHẨM (PRODUCT_SIZES)
CREATE TABLE product_sizes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    size VARCHAR(20) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE (product_id, size)
);

-- 5. BẢNG MÀU SẮC SẢN PHẨM (PRODUCT_COLORS)
CREATE TABLE product_colors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    color VARCHAR(50) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE (product_id, color)
);

-- 6. BẢNG ĐƠN HÀNG (ORDERS)
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(30) NOT NULL UNIQUE,
    subtotal INTEGER NOT NULL,
    shipping_fee INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL,
    shipping_method VARCHAR(50) DEFAULT 'standard',
    payment_method VARCHAR(50) DEFAULT 'cod',
    status VARCHAR(30) DEFAULT 'Đang xử lý',
    shipping_full_name VARCHAR(150) NOT NULL,
    shipping_phone VARCHAR(20) NOT NULL,
    shipping_email VARCHAR(150) NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_province VARCHAR(100) NOT NULL,
    shipping_note TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. BẢNG CHI TIẾT ĐƠN HÀNG (ORDER_ITEMS)
CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER,
    product_name VARCHAR(255) NOT NULL,
    color VARCHAR(50) NOT NULL,
    size VARCHAR(20) NOT NULL,
    unit_price INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- ======================================================================
-- NẠP DỮ LIỆU SEED TỪ products.local.json
-- ======================================================================

-- Danh mục
INSERT INTO categories (id, slug, name) VALUES 
(1, 'ao', 'Áo'),
(2, 'quan-1', 'Quần'),
(3, 'chan-vay', 'Chân váy'),
(4, 'vay', 'Đầm');

-- Sản phẩm 1
INSERT INTO products (id, slug, name, category_id, description, base_price, sale_price, source_url) VALUES 
(1, 'quan-ong-loe-thun-ren-white-lace-low-waist-pants', 'Quần ống loe thun ren White Lace Low Waist Pants', 2, 'Quần ống loe 2 lớp chất liệu ren thun và lưới, thiết kế thoải mái, thanh lịch. Chất liệu co giãn linh hoạt, phù hợp phối cùng áo thun, áo casual hoặc áo croptop.', 590000, NULL, 'https://www.olv.vn/products/quan-ong-loe-thun-ren-white-lace-low-waist-pants');
INSERT INTO product_colors (product_id, color) VALUES (1, 'Trắng');
INSERT INTO product_sizes (product_id, size) VALUES (1, 'S'), (1, 'M'), (1, 'L');
INSERT INTO product_images (product_id, url, sort_order) VALUES 
(1, 'images/quan-ong-loe-thun-ren-white-lace-low-waist-pants/01.jpg', 0),
(1, 'images/quan-ong-loe-thun-ren-white-lace-low-waist-pants/02.jpg', 1),
(1, 'images/quan-ong-loe-thun-ren-white-lace-low-waist-pants/03.jpg', 2),
(1, 'images/quan-ong-loe-thun-ren-white-lace-low-waist-pants/04.jpg', 3);

-- Sản phẩm 2
INSERT INTO products (id, slug, name, category_id, description, base_price, sale_price, source_url) VALUES 
(2, 'ao-sat-nach-co-v-phoi-vien-ren-blue-ribbed-v-neck-tank-top', 'Áo sát nách cổ V phối viền ren Blue Ribbed V Neck Tank Top', 1, 'Áo thun 1 lớp sát nách, thiết kế trẻ trung gọn gàng. Vải thun mềm mại, độ co giãn nhiều, thoải mái khi mặc. Phù hợp phối với quần jeans, short hoặc chân váy.', 190000, NULL, 'https://www.olv.vn/products/ao-sat-nach-co-v-phoi-vien-ren-blue-ribbed-v-neck-tank-top');
INSERT INTO product_colors (product_id, color) VALUES (2, 'Xanh dương');
INSERT INTO product_sizes (product_id, size) VALUES (2, 'S'), (2, 'M'), (2, 'L');
INSERT INTO product_images (product_id, url, sort_order) VALUES 
(2, 'images/ao-sat-nach-co-v-phoi-vien-ren-blue-ribbed-v-neck-tank-top/01.jpg', 0),
(2, 'images/ao-sat-nach-co-v-phoi-vien-ren-blue-ribbed-v-neck-tank-top/02.jpg', 1),
(2, 'images/ao-sat-nach-co-v-phoi-vien-ren-blue-ribbed-v-neck-tank-top/03.jpg', 2),
(2, 'images/ao-sat-nach-co-v-phoi-vien-ren-blue-ribbed-v-neck-tank-top/04.jpg', 3),
(2, 'images/ao-sat-nach-co-v-phoi-vien-ren-blue-ribbed-v-neck-tank-top/05.jpg', 4);

-- Sản phẩm 3
INSERT INTO products (id, slug, name, category_id, description, base_price, sale_price, source_url) VALUES 
(3, 'ao-yem-thun-ren-blanc-fleur-lace-halter-top', 'Áo yếm thun ren Blanc Fleur Lace Halter Top', 1, 'Thiết kế áo yếm 1 lớp kiểu dáng nữ tính, trẻ trung, gọn gàng. Chất liệu thun ren mềm mại, độ co giãn tốt. Dễ phối với quần jeans, quần short hoặc chân váy.', 190000, NULL, 'https://www.olv.vn/products/ao-yem-thun-ren-blanc-fleur-lace-halter-top');
INSERT INTO product_colors (product_id, color) VALUES (3, 'Trắng');
INSERT INTO product_sizes (product_id, size) VALUES (3, 'S'), (3, 'M'), (3, 'L');
INSERT INTO product_images (product_id, url, sort_order) VALUES 
(3, 'images/ao-yem-thun-ren-blanc-fleur-lace-halter-top/01.jpg', 0),
(3, 'images/ao-yem-thun-ren-blanc-fleur-lace-halter-top/02.jpg', 1),
(3, 'images/ao-yem-thun-ren-blanc-fleur-lace-halter-top/03.jpg', 2),
(3, 'images/ao-yem-thun-ren-blanc-fleur-lace-halter-top/04.jpg', 3),
(3, 'images/ao-yem-thun-ren-blanc-fleur-lace-halter-top/05.jpg', 4);

-- Sản phẩm 4
INSERT INTO products (id, slug, name, category_id, description, base_price, sale_price, source_url) VALUES 
(4, 'quan-shorts-thun-tron-yellow-ribbed-low-waist-shorts', 'Quần shorts thun trơn Ribbed Low Waist Shorts', 2, 'Quần short 1 lớp kiểu dáng gọn gàng, trẻ trung, năng động. Chất liệu thun mềm mại, độ co giãn cao. Phù hợp phối với áo thun hoặc áo hai dây.', 250000, NULL, 'https://www.olv.vn/products/quan-shorts-thun-tron-yellow-ribbed-low-waist-shorts');
INSERT INTO product_colors (product_id, color) VALUES (4, 'Vàng'), (4, 'Xám');
INSERT INTO product_sizes (product_id, size) VALUES (4, 'S'), (4, 'M'), (4, 'L');
INSERT INTO product_images (product_id, url, sort_order) VALUES 
(4, 'images/quan-shorts-thun-tron-yellow-ribbed-low-waist-shorts/01.jpg', 0),
(4, 'images/quan-shorts-thun-tron-yellow-ribbed-low-waist-shorts/02.jpg', 1),
(4, 'images/quan-shorts-thun-tron-yellow-ribbed-low-waist-shorts/03.jpg', 2),
(4, 'images/quan-shorts-thun-tron-yellow-ribbed-low-waist-shorts/04.jpg', 3),
(4, 'images/quan-shorts-thun-tron-yellow-ribbed-low-waist-shorts/05.jpg', 4);

-- Sản phẩm 5
INSERT INTO products (id, slug, name, category_id, description, base_price, sale_price, source_url) VALUES 
(5, 'ao-so-mi-linen-ke-soc-tay-dai-striped-long-sleeves-shirt-nhieu-mau', 'Áo sơ mi linen kẻ sọc tay dài Striped Long Sleeves Shirt', 1, 'Áo sơ mi form rộng 1 lớp tay dài, chất linen mang lại vẻ ngoài phóng khoáng, thanh lịch, thoải mái. Thiết kế rộng tạo cảm giác nhẹ nhàng.', 490000, NULL, 'https://www.olv.vn/products/ao-so-mi-linen-ke-soc-tay-dai-striped-long-sleeves-shirt-nhieu-mau');
INSERT INTO product_colors (product_id, color) VALUES (5, 'Xanh Quilt'), (5, 'Trắng'), (5, 'Xám'), (5, 'Vàng');
INSERT INTO product_sizes (product_id, size) VALUES (5, 'FS');
INSERT INTO product_images (product_id, url, sort_order) VALUES 
(5, 'images/ao-so-mi-linen-ke-soc-tay-dai-striped-long-sleeves-shirt-nhieu-mau/01.jpg', 0),
(5, 'images/ao-so-mi-linen-ke-soc-tay-dai-striped-long-sleeves-shirt-nhieu-mau/02.jpg', 1),
(5, 'images/ao-so-mi-linen-ke-soc-tay-dai-striped-long-sleeves-shirt-nhieu-mau/03.png', 2),
(5, 'images/ao-so-mi-linen-ke-soc-tay-dai-striped-long-sleeves-shirt-nhieu-mau/04.jpg', 3);

-- Sản phẩm 6
INSERT INTO products (id, slug, name, category_id, description, base_price, sale_price, source_url) VALUES 
(6, 'chan-vay-ngan-gau-phoi-ren-white-plain-gauze-mini-skirt', 'Chân váy ngắn gấu phối ren White Plain Gauze Mini Skirt', 3, 'Chân váy 2 lớp chất liệu xô thêu hoa, tạo điểm nhấn nữ tính. Họa tiết thêu hoa nổi bật trên nền vải nhẹ, phom váy ngắn trẻ trung, duyên dáng.', 490000, NULL, 'https://www.olv.vn/products/chan-vay-ngan-gau-phoi-ren-white-plain-gauze-mini-skirt');
INSERT INTO product_colors (product_id, color) VALUES (6, 'Xanh Navy');
INSERT INTO product_sizes (product_id, size) VALUES (6, 'S'), (6, 'M'), (6, 'L');
INSERT INTO product_images (product_id, url, sort_order) VALUES 
(6, 'images/chan-vay-ngan-gau-phoi-ren-white-plain-gauze-mini-skirt/01.jpg', 0),
(6, 'images/chan-vay-ngan-gau-phoi-ren-white-plain-gauze-mini-skirt/02.jpg', 1),
(6, 'images/chan-vay-ngan-gau-phoi-ren-white-plain-gauze-mini-skirt/03.jpg', 2),
(6, 'images/chan-vay-ngan-gau-phoi-ren-white-plain-gauze-mini-skirt/04.jpg', 3),
(6, 'images/chan-vay-ngan-gau-phoi-ren-white-plain-gauze-mini-skirt/05.jpg', 4);

-- Sản phẩm 7
INSERT INTO products (id, slug, name, category_id, description, base_price, sale_price, source_url) VALUES 
(7, 'ao-tay-dai-dang-om-body-gray-vneck-buttoned-mid-sleeve-top', 'Áo tay dài dáng ôm body Gray Vneck Buttoned Mid Sleeve Top', 1, 'Áo tay dài 1 lớp phom dáng gọn gàng, trẻ trung, dễ phối đồ. Chất liệu thun mềm mại, độ co giãn tốt, phù hợp mặc hàng ngày hoặc phối layer.', 290000, NULL, 'https://www.olv.vn/products/ao-tay-dai-dang-om-body-gray-vneck-buttoned-mid-sleeve-top');
INSERT INTO product_colors (product_id, color) VALUES (7, 'Xám');
INSERT INTO product_sizes (product_id, size) VALUES (7, 'S'), (7, 'M'), (7, 'L');
INSERT INTO product_images (product_id, url, sort_order) VALUES 
(7, 'images/ao-tay-dai-dang-om-body-gray-vneck-buttoned-mid-sleeve-top/01.jpg', 0),
(7, 'images/ao-tay-dai-dang-om-body-gray-vneck-buttoned-mid-sleeve-top/02.jpg', 1);

-- Sản phẩm 8
INSERT INTO products (id, slug, name, category_id, description, base_price, sale_price, source_url) VALUES 
(8, 'ao-hai-day-kieu-yellow-plain-ruched-cami-top', 'Áo hai dây kiểu Plain Ruched Cami Top', 1, 'Áo hai dây 1 lớp phom ôm gọn, chất liệu thun mềm mại, độ co giãn tốt. Kiểu dáng ngắn gọn, dễ phối với quần jeans, chân váy hoặc layer bên ngoài.', 190000, NULL, 'https://www.olv.vn/products/ao-hai-day-kieu-yellow-plain-ruched-cami-top');
INSERT INTO product_colors (product_id, color) VALUES (8, 'Vàng');
INSERT INTO product_sizes (product_id, size) VALUES (8, 'S'), (8, 'M'), (8, 'L');
INSERT INTO product_images (product_id, url, sort_order) VALUES 
(8, 'images/ao-hai-day-kieu-yellow-plain-ruched-cami-top/01.jpg', 0),
(8, 'images/ao-hai-day-kieu-yellow-plain-ruched-cami-top/02.jpg', 1),
(8, 'images/ao-hai-day-kieu-yellow-plain-ruched-cami-top/03.jpg', 2),
(8, 'images/ao-hai-day-kieu-yellow-plain-ruched-cami-top/04.jpg', 3),
(8, 'images/ao-hai-day-kieu-yellow-plain-ruched-cami-top/05.jpg', 4);

-- Sản phẩm 9
INSERT INTO products (id, slug, name, category_id, description, base_price, sale_price, source_url) VALUES 
(9, 'set-ao-hai-day-tron-kem-cardigan-blue-plain-wrap-ruched-top', 'Áo hai dây trơn kèm cardigan Blue Plain Wrap Ruched Top', 1, 'Áo hai dây 1 lớp phom dáng ôm gọn, trẻ trung, nữ tính. Chất liệu jersey mềm mại, co giãn tốt, tôn dáng phần trước.', 490000, NULL, 'https://www.olv.vn/products/set-ao-hai-day-tron-kem-cardigan-blue-plain-wrap-ruched-top');
INSERT INTO product_colors (product_id, color) VALUES (9, 'Xanh dương');
INSERT INTO product_sizes (product_id, size) VALUES (9, 'S'), (9, 'M'), (9, 'L');
INSERT INTO product_images (product_id, url, sort_order) VALUES 
(9, 'images/set-ao-hai-day-tron-kem-cardigan-blue-plain-wrap-ruched-top/01.jpg', 0),
(9, 'images/set-ao-hai-day-tron-kem-cardigan-blue-plain-wrap-ruched-top/02.jpg', 1),
(9, 'images/set-ao-hai-day-tron-kem-cardigan-blue-plain-wrap-ruched-top/03.jpg', 2),
(9, 'images/set-ao-hai-day-tron-kem-cardigan-blue-plain-wrap-ruched-top/04.jpg', 3);

-- Sản phẩm 10
INSERT INTO products (id, slug, name, category_id, description, base_price, sale_price, source_url) VALUES 
(10, 'ao-cardigan-dang-ngan-gray-plain-buttoned-crop-cardigan', 'Áo cardigan dáng ngắn Gray Plain Buttoned Crop Cardigan', 1, 'Áo cardigan tay dài 1 lớp phom dáng gọn gàng, ôm nhẹ cơ thể. Chất liệu thun mềm, co giãn tốt, kiểu tối giản dễ phối đồ.', 390000, NULL, 'https://www.olv.vn/products/ao-cardigan-dang-ngan-gray-plain-buttoned-crop-cardigan');
INSERT INTO product_colors (product_id, color) VALUES (10, 'Xám');
INSERT INTO product_sizes (product_id, size) VALUES (10, 'S'), (10, 'M'), (10, 'L');
INSERT INTO product_images (product_id, url, sort_order) VALUES 
(10, 'images/ao-cardigan-dang-ngan-gray-plain-buttoned-crop-cardigan/01.jpg', 0),
(10, 'images/ao-cardigan-dang-ngan-gray-plain-buttoned-crop-cardigan/02.jpg', 1);

-- Sản phẩm 11
INSERT INTO products (id, slug, name, category_id, description, base_price, sale_price, source_url) VALUES 
(11, 'ao-hai-day-phoi-ren-sheer-lace-cami-top-nhieu-mau', 'Áo hai dây phối ren Sheer Lace Cami Top', 1, 'Áo hai dây 1 lớp chất liệu thun ren, mang đến vẻ ngoài nữ tính, nhẹ nhàng. Phom dáng ôm gọn tôn đường nét cơ thể, độ co giãn tốt.', 190000, NULL, 'https://www.olv.vn/products/ao-hai-day-phoi-ren-sheer-lace-cami-top-nhieu-mau');
INSERT INTO product_colors (product_id, color) VALUES (11, 'Trắng'), (11, 'Kem'), (11, 'Xanh dương');
INSERT INTO product_sizes (product_id, size) VALUES (11, 'S'), (11, 'M'), (11, 'L');
INSERT INTO product_images (product_id, url, sort_order) VALUES 
(11, 'images/ao-hai-day-phoi-ren-sheer-lace-cami-top-nhieu-mau/01.jpg', 0),
(11, 'images/ao-hai-day-phoi-ren-sheer-lace-cami-top-nhieu-mau/02.jpg', 1),
(11, 'images/ao-hai-day-phoi-ren-sheer-lace-cami-top-nhieu-mau/03.jpg', 2),
(11, 'images/ao-hai-day-phoi-ren-sheer-lace-cami-top-nhieu-mau/04.jpg', 3),
(11, 'images/ao-hai-day-phoi-ren-sheer-lace-cami-top-nhieu-mau/05.jpg', 4);

-- Sản phẩm 12
INSERT INTO products (id, slug, name, category_id, description, base_price, sale_price, source_url) VALUES 
(12, 'ao-tay-dai-ke-soc-striped-vneck-buttoned-mid-sleeve-top-nhieu-mau-2', 'Áo tay dài kẻ sọc Striped Vneck Buttoned Mid Sleeve Top', 1, 'Áo tay dài 1 lớp phom dáng gọn gàng, trẻ trung. Chất liệu knit mềm mại, co giãn, mang lại cảm giác thoải mái, linh hoạt.', 320000, NULL, 'https://www.olv.vn/products/ao-tay-dai-ke-soc-striped-vneck-buttoned-mid-sleeve-top-nhieu-mau-2');
INSERT INTO product_colors (product_id, color) VALUES (12, 'Xanh lá'), (12, 'Xám');
INSERT INTO product_sizes (product_id, size) VALUES (12, 'S'), (12, 'M'), (12, 'L');
INSERT INTO product_images (product_id, url, sort_order) VALUES 
(12, 'images/ao-tay-dai-ke-soc-striped-vneck-buttoned-mid-sleeve-top-nhieu-mau-2/01.jpg', 0),
(12, 'images/ao-tay-dai-ke-soc-striped-vneck-buttoned-mid-sleeve-top-nhieu-mau-2/02.jpg', 1),
(12, 'images/ao-tay-dai-ke-soc-striped-vneck-buttoned-mid-sleeve-top-nhieu-mau-2/03.jpg', 2),
(12, 'images/ao-tay-dai-ke-soc-striped-vneck-buttoned-mid-sleeve-top-nhieu-mau-2/04.jpg', 3),
(12, 'images/ao-tay-dai-ke-soc-striped-vneck-buttoned-mid-sleeve-top-nhieu-mau-2/05.jpg', 4);

-- Sản phẩm 13
INSERT INTO products (id, slug, name, category_id, description, base_price, sale_price, source_url) VALUES 
(13, 'chan-vay-to-cham-bi-black-dot-chiffon-tiered-mini-skirt', 'Chân váy tơ chấm bi Black Dot Chiffon Tiered Mini Skirt', 3, 'Chân váy 2 lớp với điểm nhấn thêu và in logo ở eo. Phom váy ngắn nữ tính, hiện đại, chất liệu tơ nhẹ mềm mại.', 390000, NULL, 'https://www.olv.vn/products/chan-vay-to-cham-bi-black-dot-chiffon-tiered-mini-skirt');
INSERT INTO product_colors (product_id, color) VALUES (13, 'Đen');
INSERT INTO product_sizes (product_id, size) VALUES (13, 'S'), (13, 'M'), (13, 'L');
INSERT INTO product_images (product_id, url, sort_order) VALUES 
(13, 'images/chan-vay-to-cham-bi-black-dot-chiffon-tiered-mini-skirt/01.jpg', 0),
(13, 'images/chan-vay-to-cham-bi-black-dot-chiffon-tiered-mini-skirt/02.jpg', 1),
(13, 'images/chan-vay-to-cham-bi-black-dot-chiffon-tiered-mini-skirt/03.jpg', 2),
(13, 'images/chan-vay-to-cham-bi-black-dot-chiffon-tiered-mini-skirt/04.jpg', 3);

-- Sản phẩm 14
INSERT INTO products (id, slug, name, category_id, description, base_price, sale_price, source_url) VALUES 
(14, 'ao-so-mi-tay-phong-cham-bi-black-dot-chiffon-short-sleeves-shirt', 'Áo sơ mi tay phồng chấm bi Black Dot Chiffon Short Sleeves Shirt', 1, 'Áo sơ mi 1 lớp tay ngắn kiểu dáng thanh lịch, trẻ trung, năng động. Chất liệu tơ nhẹ nhàng, mềm mại. Dễ phối với quần jeans, chân váy hoặc quần short.', 320000, NULL, 'https://www.olv.vn/products/ao-so-mi-tay-phong-cham-bi-black-dot-chiffon-short-sleeves-shirt');
INSERT INTO product_colors (product_id, color) VALUES (14, 'Đen chấm bi');
INSERT INTO product_sizes (product_id, size) VALUES (14, 'S'), (14, 'M');
INSERT INTO product_images (product_id, url, sort_order) VALUES 
(14, 'images/ao-so-mi-tay-phong-cham-bi-black-dot-chiffon-short-sleeves-shirt/01.jpg', 0),
(14, 'images/ao-so-mi-tay-phong-cham-bi-black-dot-chiffon-short-sleeves-shirt/02.png', 1),
(14, 'images/ao-so-mi-tay-phong-cham-bi-black-dot-chiffon-short-sleeves-shirt/03.jpg', 2),
(14, 'images/ao-so-mi-tay-phong-cham-bi-black-dot-chiffon-short-sleeves-shirt/04.jpg', 3);

-- Sản phẩm 15
INSERT INTO products (id, slug, name, category_id, description, base_price, sale_price, source_url) VALUES 
(15, 'ao-hai-day-ngoi-sao-white-black-star-cotton-cami-top', 'Áo hai dây ngôi sao White Black Star Cotton Cami Top', 1, 'Áo hai dây 1 lớp với điểm nhấn chi tiết ngôi sao đính trên ngực. Phom ôm vừa, dễ phối với quần jeans, chân váy hoặc trang phục thường ngày.', 290000, NULL, 'https://www.olv.vn/products/ao-hai-day-ngoi-sao-white-black-star-cotton-cami-top');
INSERT INTO product_colors (product_id, color) VALUES (15, 'Xanh Navy');
INSERT INTO product_sizes (product_id, size) VALUES (15, 'S'), (15, 'M');
INSERT INTO product_images (product_id, url, sort_order) VALUES 
(15, 'images/ao-hai-day-ngoi-sao-white-black-star-cotton-cami-top/01.jpg', 0),
(15, 'images/ao-hai-day-ngoi-sao-white-black-star-cotton-cami-top/02.png', 1),
(15, 'images/ao-hai-day-ngoi-sao-white-black-star-cotton-cami-top/03.jpg', 2),
(15, 'images/ao-hai-day-ngoi-sao-white-black-star-cotton-cami-top/04.jpg', 3);

-- Sản phẩm 16
INSERT INTO products (id, slug, name, category_id, description, base_price, sale_price, source_url) VALUES 
(16, 'chan-vay-lua-phoi-ren-white-silky-plain-lace-skirt', 'Chân váy lụa phối ren White Silky Plain Lace Skirt', 3, 'Chân váy lụa phối ren, thiết kế sang trọng và thanh lịch, kết hợp chất liệu lụa mềm mại với chi tiết ren tinh tế.', 390000, NULL, 'https://www.olv.vn/products/chan-vay-lua-phoi-ren-white-silky-plain-lace-skirt');
INSERT INTO product_colors (product_id, color) VALUES (16, 'Trắng');
INSERT INTO product_sizes (product_id, size) VALUES (16, 'S'), (16, 'M');
INSERT INTO product_images (product_id, url, sort_order) VALUES 
(16, 'images/chan-vay-lua-phoi-ren-white-silky-plain-lace-skirt/01.jpg', 0),
(16, 'images/chan-vay-lua-phoi-ren-white-silky-plain-lace-skirt/02.jpg', 1),
(16, 'images/chan-vay-lua-phoi-ren-white-silky-plain-lace-skirt/03.jpg', 2);

-- Sản phẩm 17
INSERT INTO products (id, slug, name, category_id, description, base_price, sale_price, source_url) VALUES 
(17, 'ao-sat-nach-co-co-baby-blue-knit-dot-polo-top', 'Áo sát nách có cổ Baby Knit Dot Polo Top', 1, 'Áo polo sát nách 1 lớp chất liệu knit, phom dáng ôm gọn. Chất liệu mềm mại, co giãn nhẹ, tạo cảm giác thoải mái tự nhiên. Dễ phối với quần jeans, chân váy hoặc layer.', 490000, NULL, 'https://www.olv.vn/products/ao-sat-nach-co-co-baby-blue-knit-dot-polo-top');
INSERT INTO product_colors (product_id, color) VALUES (17, 'Xanh baby'), (17, 'Vàng');
INSERT INTO product_sizes (product_id, size) VALUES (17, 'S'), (17, 'M');
INSERT INTO product_images (product_id, url, sort_order) VALUES 
(17, 'images/ao-sat-nach-co-co-baby-blue-knit-dot-polo-top/01.jpg', 0),
(17, 'images/ao-sat-nach-co-co-baby-blue-knit-dot-polo-top/02.jpg', 1),
(17, 'images/ao-sat-nach-co-co-baby-blue-knit-dot-polo-top/03.jpg', 2),
(17, 'images/ao-sat-nach-co-co-baby-blue-knit-dot-polo-top/04.jpg', 3);

-- Sản phẩm 18
INSERT INTO products (id, slug, name, category_id, description, base_price, sale_price, source_url) VALUES 
(18, 'set-so-mi-dai-stevie-dress-in-light-blue', 'Đầm sơ mi kẻ sọc suông dài Stevie Dress in Light Blue', 4, 'Đầm sơ mi 2 lớp thiết kế thanh lịch, nữ tính với 2 cúc thật phía trên, túi giả và dây thun eo tạo cảm giác thoải mái. Chất liệu cotton mềm mại, thoáng khí.', 690000, NULL, 'https://www.olv.vn/products/set-so-mi-dai-stevie-dress-in-light-blue');
INSERT INTO product_colors (product_id, color) VALUES (18, 'Xanh nhạt');
INSERT INTO product_sizes (product_id, size) VALUES (18, 'S'), (18, 'M'), (18, 'L');
INSERT INTO product_images (product_id, url, sort_order) VALUES 
(18, 'images/set-so-mi-dai-stevie-dress-in-light-blue/01.jpg', 0),
(18, 'images/set-so-mi-dai-stevie-dress-in-light-blue/02.jpg', 1),
(18, 'images/set-so-mi-dai-stevie-dress-in-light-blue/03.jpg', 2);

-- Sản phẩm 19
INSERT INTO products (id, slug, name, category_id, description, base_price, sale_price, source_url) VALUES 
(19, 'ao-thun-tay-phong-white-cotton-short-sleeves-top', 'Áo Thun Tay Phồng White Cotton Short Sleeves Top', 1, 'Áo thun cổ tròn cơ bản, chất liệu cotton mềm mại, thoải mái, độ co giãn ít. Kiểu dáng đơn giản, dễ phối với quần jeans, quần short hoặc chân váy.', 250000, NULL, 'https://www.olv.vn/products/ao-thun-tay-phong-white-cotton-short-sleeves-top');
INSERT INTO product_colors (product_id, color) VALUES (19, 'Trắng');
INSERT INTO product_sizes (product_id, size) VALUES (19, 'S'), (19, 'M'), (19, 'L');
INSERT INTO product_images (product_id, url, sort_order) VALUES 
(19, 'images/ao-thun-tay-phong-white-cotton-short-sleeves-top/01.jpg', 0),
(19, 'images/ao-thun-tay-phong-white-cotton-short-sleeves-top/02.jpg', 1),
(19, 'images/ao-thun-tay-phong-white-cotton-short-sleeves-top/03.jpg', 2);

-- Sản phẩm 20
INSERT INTO products (id, slug, name, category_id, description, base_price, sale_price, source_url) VALUES 
(20, 'originvol3-1', 'Chân váy Gray Cotton Tie Skirt', 3, 'Chân váy ngắn 2 lớp với điểm nhấn đính nơ lệch một bên, tạo vẻ nữ tính, trẻ trung. Chất liệu chino cotton, form đứng, ít co giãn, giữ dáng tốt.', 490000, NULL, 'https://www.olv.vn/products/originvol3-1');
INSERT INTO product_colors (product_id, color) VALUES (20, 'Xám');
INSERT INTO product_sizes (product_id, size) VALUES (20, 'XS'), (20, 'S'), (20, 'M'), (20, 'L');
INSERT INTO product_images (product_id, url, sort_order) VALUES 
(20, 'images/originvol3-1/01.jpg', 0),
(20, 'images/originvol3-1/02.jpg', 1),
(20, 'images/originvol3-1/03.jpg', 2),
(20, 'images/originvol3-1/04.jpg', 3),
(20, 'images/originvol3-1/05.jpg', 4);