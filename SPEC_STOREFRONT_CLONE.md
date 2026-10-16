# TÀI LIỆU ĐẶC TẢ GIAO DIỆN & TÍNH NĂNG 
## DỰ ÁN: CỬA HÀNG THỜI TRANG NỮ HENNI SHOP
**Công nghệ:** HTML5, CSS3 thuần, JavaScript ES6+ (Vanilla JS), SQLite Client-side (`sql.js`)  
**Mục tiêu:** Tái tạo trung thực 100% giao diện, trải nghiệm người dùng và tính năng từ bản mẫu React tại `http://localhost:5173/`, sẵn sàng triển khai trên GitHub Pages.

---

## 1. THIẾT KẾ HỆ THỐNG GIAO DIỆN (DESIGN SYSTEM - LIGHT THEME)

### 1.1. Nguyên tắc thị giác
- **Tone màu chủ đạo:** Nền trắng tinh khôi (`#FFFFFF`), kết hợp các khoảng xám/nude cực nhẹ (`#F9FAFB`, `#F3F4F6`) để phân tách khối nội dung.
- **Màu chữ & Nhấn:**
  - Chữ chính: Đen than (`#111827`), độ đậm vừa phải, font sans-serif hiện đại (Inter, Roboto hoặc Segoe UI).
  - Chữ phụ/metadata: Xám nhạt (`#6B7280`).
  - Nút bấm chính (CTA): Nền đen tuyền (`#111827`), chữ trắng, bo góc nhẹ (`4px` - `6px`), hover chuyển sắc sang xám đen (`#374151`).
  - Màu nhấn giá / Giảm giá: Đỏ đô thời trang (`#DC2626` hoặc `#E11D48`).
- **Logo thương hiệu:** Hiển thị tệp logo có sẵn trong thư mục `images/logo.png`, kích thước chuẩn chiều cao $36\text{px} - 42\text{px}$.

---

## 2. BỐ CỤC KHUNG TOÀN CỤC (GLOBAL LAYOUT)

### 2.1. Thanh thông báo đầu trang (Top Announcement Bar)
- Chiều cao: $32\text{px}$, nền `#111827`, chữ trắng nhỏ $12\text{px}$, căn giữa:
  `"MIỄN PHÍ VẬN CHUYỂN TOÀN QUỐC CHO ĐƠN HÀNG TỪ 800.000₫ • ĐỔI TRẢ TRONG VÒNG 7 NGÀY"`

### 2.2. Thanh điều hướng chính (Header / Navbar)
- Dạng dính cố định khi cuộn trang (`position: sticky; top: 0; z-index: 50; background: #FFF; border-bottom: 1px solid #E5E7EB`).
- **Cấu trúc 3 cụm:**
  1. **Bên trái (Brand):** Logo `images/logo.png` dẫn về `index.html`.
  2. **Ở giữa (Menu danh mục chính):**
     - `Trang chủ` (`index.html`)
     - `Sản phẩm` (`san-pham.html`)
     - `Áo` (`san-pham.html?category=ao`)
     - `Quần` (`san-pham.html?category=quan-1`)
     - `Chân váy` (`san-pham.html?category=chan-vay`)
     - `Đầm` (`san-pham.html?category=vay`)
  3. **Bên phải (Actions):**
     - Ô tìm kiếm mở rộng (Search modal/input).
     - Nút Tra cứu đơn hàng (`don-hang.html`).
     - Biểu tượng Giỏ hàng kèm badge số lượng nổi bật (`#cart-count`).

### 2.3. Chân trang (Footer)
- Nền trắng/xám nhẹ `#F9FAFB`, đường kẻ viền mảnh trên cùng.
- 4 cột thông tin:
  - Cột 1: Giới thiệu Henni Shop, cam kết chất liệu và đường may cao cấp.
  - Cột 2: Danh mục thời trang (Áo, Quần, Chân váy, Đầm).
  - Cột 3: Hỗ trợ khách hàng (Chính sách đổi trả, Hướng dẫn chọn size, Tra cứu đơn).
  - Cột 4: Đăng ký nhận bản tin (Form input email kèm nút gửi).

---

## 3. CHI TIẾT TỪNG MÀN HÌNH CHÍNH (THEO LOCALHOST:5173)

### 3.1. Trang Chủ (`index.html`)
1. **Hero Slider Banner:**
   - Chiều cao lớn ($450\text{px} - 550\text{px}$), hiển thị hình ảnh bộ sưu tập mới.
   - Text overlay: Tiêu đề lớn, phụ đề thanh lịch và nút CTA `"Khám phá ngay"` trỏ tới `san-pham.html`.
2. **Khối Danh mục nổi bật (Featured Categories):**
   - 4 thẻ hiển thị hình ảnh đại diện của 4 danh mục: Áo, Quần, Chân váy, Đầm.
   - Hover zoom nhẹ ảnh, kèm text đếm số lượng sản phẩm từ SQLite.
3. **Lưới sản phẩm mới (New Arrivals):**
   - Truy vấn 8 sản phẩm mới nhất từ SQLite (`SELECT * FROM products ORDER BY id DESC LIMIT 8`).
   - Thẻ sản phẩm chuẩn thương mại điện tử:
     - Ảnh sản phẩm (tự động đổi ảnh thứ 2 khi hover chuột).
     - Tên sản phẩm, giá niêm yết (định dạng `xxx.000₫`).
     - Hàng swatch màu sắc tròn nhỏ bên dưới.
     - Nút "Thêm nhanh vào giỏ" (Quick Add) khi hover.
4. **Cam kết dịch vụ (Trust Badges):**
   - 4 icon: Giao hàng hỏa tốc, Đổi trả dễ dàng, 100% hình thật tự chụp, Hỗ trợ 24/7.

---

### 3.2. Trang Danh Mục & Bộ Lọc (`san-pham.html`)
Tương tự trang `/san-pham` của bản mẫu, chia làm 2 cột:

1. **Cột bên trái (Sidebar Filters - $260\text{px}$):**
   - **Tìm kiếm:** Input tìm kiếm từ khóa.
   - **Lọc theo Danh mục:** Checkbox / Radio chọn Áo, Quần, Chân váy, Đầm.
   - **Lọc theo Kích thước:** Nút bấm vuông chọn size (`XS`, `S`, `M`, `L`, `FS`).
   - **Lọc theo Màu sắc:** Bảng chọn màu trực quan (Trắng, Đen, Xanh dương, Vàng, Xám,...).
   - **Lọc theo Khoảng giá:** Các mốc: Dưới 300k, 300k - 500k, Trên 500k.
   - Nút `"Xóa bộ lọc"` để reset về mặc định.
2. **Cột bên phải (Product Grid):**
   - Thanh công cụ trên cùng: Hiển thị số lượng tìm thấy (ví dụ: `Hiển thị 20 sản phẩm`) + Dropdown Sắp xếp (`Mới nhất`, `Giá tăng dần`, `Giá giảm dần`, `Tên A-Z`).
   - Lưới sản phẩm responsive (3 cột trên desktop, 2 cột trên mobile).
   - Phân trang (Pagination) mượt mà không load lại trang.

---

### 3.3. Trang Chi Tiết Sản Phẩm (`chi-tiet.html?slug=...`)
Nhận tham số URL `slug` để truy vấn dữ liệu từ SQLite:
1. **Khối bên trái (Gallery ảnh):**
   - Cột dọc ảnh nhỏ thumbnail và 1 khung ảnh lớn xem chi tiết.
   - Hiệu ứng zoom ảnh khi rê chuột hoặc click đổi ảnh chính.
2. **Khối bên phải (Thông tin & Mua hàng):**
   - Tên sản phẩm cỡ lớn, danh mục liên kết.
   - Giá bán chuẩn VNĐ.
   - **Bộ chọn Màu sắc:** Hiển thị danh sách màu có sẵn của sản phẩm đó.
   - **Bộ chọn Kích thước:** Hiển thị danh sách size khả dụng.
   - **Bộ chọn Số lượng:** Ô tăng/giảm số lượng (tối thiểu 1).
   - **Nút hành động:**
     - Nút `"THÊM VÀO GIỎ HÀNG"` (Viền đen, chữ đen).
     - Nút `"MUA NGAY"` (Nền đen, chữ trắng, chuyển hướng ngay sang trang giỏ hàng).
   - Tab chi tiết: Mô tả chất liệu, kiểu dáng và bảng quy chuẩn chọn size.
3. **Cụm sản phẩm tương tự:**
   - Tải 4 sản phẩm cùng danh mục từ SQLite đặt ở cuối trang.

---

### 3.4. Trang Giỏ Hàng & Đặt Hàng (`gio-hang.html`)
Giao diện 2 cột liền mạch (Checkout 1 trang):
1. **Cột 1: Danh sách sản phẩm trong giỏ:**
   - Danh sách các item gồm: Ảnh đại diện, Tên, Màu đã chọn, Size đã chọn, Đơn giá, Cụm tăng/giảm số lượng, Nút xóa món hàng.
   - **Thanh tiến trình Freeship:**
     - Nếu tổng tiền < 800.000₫: Hiển thị thanh tiến trình và thông báo `"Mua thêm X.000₫ để được MIỄN PHÍ VẬN CHUYỂN"`.
     - Nếu tổng tiền $\ge$ 800.000₫: Hiển thị biểu tượng tích xanh `"Bạn đã đủ điều kiện Miễn phí vận chuyển!"`.
2. **Cột 2: Form thông tin giao hàng & Tổng kết:**
   - Form nhập: Họ và tên, Số điện thoại, Email, Địa chỉ, Tỉnh/Thành phố, Ghi chú giao hàng.
   - Phương thức vận chuyển: Tiêu chuẩn (30.000₫ hoặc 0₫ nếu đủ điều kiện).
   - Phương thức thanh toán: COD (Thanh toán khi nhận hàng), Chuyển khoản ngân hàng.
   - Bảng cộng tiền: Tạm tính, Phí ship, **Tổng thanh toán**.
   - Nút `"HOÀN TẤT ĐẶT HÀNG"`: Khi bấm, tự động sinh mã đơn dạng `HN261016-xxxx`, lưu vào bảng `orders` của SQLite và xóa giỏ hàng `localStorage`.

---

### 3.5. Trang Tra Cứu & Lịch Sử Đơn Hàng (`don-hang.html`)
- Ô tìm kiếm mã đơn hàng (ví dụ: `HN261016-5219`).
- Hiển thị danh sách các đơn hàng đã đặt trên trình duyệt này:
  - Mã đơn, ngày giờ đặt, trạng thái đơn (`Đang xử lý`, `Đang giao`, `Hoàn thành`).
  - Bảng danh sách sản phẩm trong đơn, địa chỉ giao hàng và tổng tiền.

---

## 4. TƯƠNG THÍCH MÔI TRƯỜNG THỰC THI (FILE VS LIVE SERVER / GITHUB PAGES)

Để giữ nguyên tiêu chí kỹ thuật đồ án giống hệt bản mẫu:
- **Mở trực tiếp tệp (`file:///`):** JS kiểm tra `window.location.protocol === 'file:'`. Nếu đúng, hiển thị màn hình chờ:  
  `"Đang nạp dữ liệu cửa hàng..."` kèm spinner xoay tròn để đảm bảo an toàn chính sách bảo mật trình duyệt.
- **Mở qua Web Server (Live Server `http://127.0.0.1:5500` hoặc GitHub Pages `https://`):**  
  Tự động kích hoạt WebAssembly nạp `hennishop.db`, ẩn màn hình chờ và render toàn bộ cửa hàng đầy đủ ngay lập tức.