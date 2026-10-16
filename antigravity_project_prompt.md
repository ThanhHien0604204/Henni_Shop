# SYSTEM PROMPT CHO ANTIGRAVITY: WEBSITE SHOP QUẦN ÁO HENNI

---

## 1. MỤC TIÊU DỰ ÁN & VAI TRÒ
Bạn là một chuyên gia lập trình Front-end cấp cao (Senior Front-end Architect). Hãy xây dựng mã nguồn hoàn chỉnh cho website thương mại điện tử **Shop Quần áo Henni** theo chuẩn mực sạch sẽ, tinh gọn và tối ưu trải nghiệm người dùng.

### Các ràng buộc kỹ thuật cốt lõi:
1. **Công nghệ:** **HTML5, CSS3, JavaScript ES6+ thuần (Vanilla JS)**. Tuyệt đối **KHÔNG** sử dụng Framework (không dùng React, Vue, Angular) và **KHÔNG dùng Backend server** (không NodeJS, không Python/FastAPI).
2. **Cơ sở dữ liệu (Database):** **SQLite Client-side**.
   - Tích hợp SQLite trực tiếp trên trình duyệt thông qua thư viện chuẩn WebAssembly **`sql.js`** (`https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.js`).
   - Tệp cơ sở dữ liệu `hennishop.db` được nạp vào bộ nhớ hoặc đọc trực tiếp từ thư mục dự án khi chạy qua Local Server.
3. **Màu sắc & Giao diện:**
   - **Tông màu sáng, nền trắng chủ đạo (`#ffffff` và `#f9fafb`)**, phong cách thời trang nữ thanh lịch, hiện đại, tối giản (Minimalist Chic).
   - Màu nhấn (Accent/CTA): Đen tuyền (`#111827`) hoặc hồng pastel/rose gold nhẹ nhàng, typography trang nhã.
   - Logo thương hiệu: Sử dụng tệp logo có sẵn trong thư mục dự án (`images/logo.png` hoặc `assets/logo.svg`).

---

## 2. CẤU TRÚC THƯ MỤC DỰ ÁN (PROJECT DIRECTORY)

```text
Shop_Quan_Ao_Henni/
├── index.html                   # Trang chủ (Banner, Danh mục hot, Sản phẩm mới)
├── san-pham.html                # Trang cửa hàng & Bộ lọc sản phẩm (Catalog, Filters, Sort)
├── chi-tiet.html                # Trang chi tiết sản phẩm (Gallery, Chọn Size/Màu, Đánh giá)
├── gio-hang.html                # Trang Giỏ hàng & Form đặt hàng (Checkout)
├── don-hang.html                # Tra cứu đơn hàng đã lưu
├── admin.html                   # Trang Quản trị nội bộ (CRUD Sản phẩm, Danh mục, Đơn hàng)
│
├── css/
│   ├── base.css                 # Reset CSS, CSS Variables, Typography nền trắng
│   ├── components.css           # Header, Footer, Nút bấm, Thẻ sản phẩm, Modal, Toast
│   ├── pages.css                # Layout chi tiết từng trang
│   └── responsive.css           # Tương thích Mobile, Tablet, Desktop
│
├── js/
│   ├── database.js              # Quản lý kết nối sql.js, thực thi truy vấn SQLite & LocalStorage
│   ├── app.js                   # Logic dùng chung (Header, Mini Cart counter, Toast)
│   ├── home.js                  # Logic trang chủ (Slider, Render 8 sản phẩm mới)
│   ├── catalog.js               # Logic lọc theo Danh mục, Size, Màu, Giá, Tìm kiếm
│   ├── detail.js                # Logic trang chi tiết (Gallery ảnh, chọn biến thể, thêm vào giỏ)
│   ├── cart.js                  # Logic giỏ hàng, tính cước vận chuyển, Lưu đơn hàng vào SQLite
│   └── admin.js                 # Logic quản trị SQLite (Thêm, sửa, xóa sản phẩm, đổi trạng thái đơn)
│
├── data/
│   ├── hennishop.db             # File nhị phân CSDL SQLite
│   ├── schema.sql               # Script DDL tạo bảng và dữ liệu mẫu (Seed Data)
│   └── products.local.json      # File dữ liệu nguồn
│
└── images/                      # Thư mục ảnh sản phẩm và logo
    ├── logo.png                 # Logo Henni Shop
    └── ...                      # Các thư mục ảnh theo slug sản phẩm
```

---

## 3. THIẾT KẾ GIAO DIỆN & TÔNG MÀU (LIGHT THEME)

### 3.1. Bảng màu CSS chuẩn
```css
:root {
  --bg-primary: #ffffff;          /* Nền trắng tinh khôi */
  --bg-secondary: #f8f9fa;        /* Nền phụ, thẻ sản phẩm, input */
  --bg-tertiary: #f1f3f5;         /* Nền hover, borders nhẹ */
  
  --text-primary: #1a1a1a;        /* Chữ đen đậm nét */
  --text-secondary: #666666;      /* Chữ phụ, mô tả ngắn */
  --text-muted: #999999;          /* Chữ mờ, placeholder */
  
  --accent-color: #000000;        /* Nút hành động chính (Black Minimalist) */
  --accent-hover: #333333;
  --accent-soft: #fdf2f4;         /* Điểm nhấn hồng/nude nhạt */
  --price-color: #d9383a;         /* Màu giá tiền nổi bật */
  
  --border-light: #e5e7eb;
  --border-focus: #111827;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06);
  --radius-sm: 4px;
  --radius-md: 8px;
}
```

---

## 4. CƠ CHẾ SQLITE VỚI SQL.JS TRONG TRÌNH DUYỆT (`js/database.js`)

Vì hệ thống thuần Front-end không có máy chủ, Antigravity cần hiện thực module nạp CSDL SQLite theo chu trình sau:

```javascript
/**
 * js/database.js - SQLite Client Layer via sql.js (WebAssembly)
 */
class HenniDatabase {
  constructor() {
    this.db = null;
    this.SQL = null;
  }

  async init() {
    // 1. Tải sql.js WebAssembly
    this.SQL = await window.initSqlJs({
      locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
    });

    // 2. Kiểm tra xem trong LocalStorage/IndexedDB đã có bản sao DB chưa
    const savedDb = localStorage.getItem("henni_sqlite_backup");
    if (savedDb) {
      const uInt8Array = new Uint8Array(JSON.parse(savedDb));
      this.db = new this.SQL.Database(uInt8Array);
      console.log("Đã tải CSDL Henni từ Local Cache.");
      return;
    }

    // 3. Nếu chưa có, nạp file nhị phân hennishop.db hoặc khởi tạo từ schema.sql
    try {
      const response = await fetch("data/hennishop.db");
      if (response.ok) {
        const buf = await response.arrayBuffer();
        this.db = new this.SQL.Database(new Uint8Array(buf));
        console.log("Đã tải CSDL từ data/hennishop.db thành công.");
      } else {
        await this.initFromSchema();
      }
    } catch (e) {
      console.warn("Không thể tải file .db trực tiếp. Đang khởi tạo CSDL mẫu từ schema...");
      await this.initFromSchema();
    }
  }

  async initFromSchema() {
    this.db = new this.SQL.Database();
    const res = await fetch("data/schema.sql");
    const sqlScript = await res.text();
    this.db.run(sqlScript);
    this.persist();
  }

  persist() {
    // Lưu lại trạng thái DB vào LocalStorage để khi F5 không bị mất dữ liệu vừa thêm/sửa
    const data = this.db.export();
    localStorage.setItem("henni_sqlite_backup", JSON.stringify(Array.from(data)));
  }

  query(sql, params = []) {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  run(sql, params = []) {
    this.db.run(sql, params);
    this.persist();
  }
}

export const dbManager = new HenniDatabase();
```

---

## 5. CÁC TÍNH NĂNG CHÍNH CẦN HOÀN THIỆN TRÊN GIAO DIỆN

### 5.1. Header & Điều hướng
- Hiển thị logo thương hiệu `images/logo.png`.
- Thanh tìm kiếm tức thời (gõ từ khóa lọc ngay sản phẩm).
- Menu danh mục cấp 1: Áo, Quần, Chân váy, Đầm.
- Icon Giỏ hàng kèm huy hiệu (Badge) đếm số lượng mặt hàng thời gian thực.

### 5.2. Trang Danh mục & Lọc (`san-pham.html`)
- Bộ lọc Sidebar bên trái:
  - Lọc theo Danh mục.
  - Lọc theo Kích thước: `XS`, `S`, `M`, `L`, `FS`.
  - Lọc theo Màu sắc: Trắng, Đen, Xanh dương, Vàng, Xám,...
  - Lọc theo Khoảng giá (Dưới 300k, 300k-500k, Trên 500k).
- Phân trang gọn nhẹ (Pagination) hoặc Lazy load dạng lưới 3-4 cột.

### 5.3. Trang Chi tiết (`chi-tiet.html?slug=...`)
- Bộ ảnh Gallery: Ảnh to bên phải, thumbnail trượt bên trái/dưới, click chuyển ảnh.
- Nút chọn Màu sắc và Kích thước có phản hồi trực quan (active state viền đen rõ nét).
- Nút "Thêm vào giỏ hàng" và "Mua ngay" nổi bật.
- Cụm sản phẩm liên quan (truy vấn SQLite theo cùng `category_id`).

### 5.4. Giỏ hàng & Thanh toán (`gio-hang.html`)
- Quản lý giỏ hàng với `localStorage` (`henni_cart_items`).
- Tự động áp dụng chính sách: **Miễn phí vận chuyển cho đơn hàng $\ge$ 800.000₫**; dưới 800.000₫ tính phí tiêu chuẩn 30.000₫.
- Form thanh toán lưu trữ trực tiếp đơn hàng vào bảng `orders` và `order_items` của SQLite.

### 5.5. Trang Quản trị tối giản (`admin.html`)
- Bảng thống kê số lượng sản phẩm, doanh thu và đơn hàng.
- Form thêm/sửa sản phẩm mới (chọn danh mục, nhập giá, chọn ảnh local).
- Quản lý danh sách đơn hàng và chuyển trạng thái (`Đang xử lý` $\to$ `Đang giao` $\to$ `Hoàn thành`).