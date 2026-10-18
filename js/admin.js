/**
 * js/admin.js - Logic dành cho Trang Quản Trị Henni Admin (admin.html)
 * Giao diện Dark Sidebar + 4 Stat Cards + Đơn hàng gần đây (Khớp 100% Ảnh 2)
 */

let editingProductId = null;
let allAdminProducts = [];

document.addEventListener('DOMContentLoaded', () => {
  window.dbManager.onReady(() => {
    // KIỂM TRA PHÂN QUYỀN NGHIÊM NGẶT: Chỉ tài khoản Admin mới được vào trang admin.html
    if (!window.Auth || !window.Auth.isAdmin()) {
      const appLayout = document.querySelector('.admin-app-layout');
      if (appLayout) appLayout.style.display = 'none';
      
      showToast('Khu vực hạn chế: Bạn cần đăng nhập với tài khoản Quản trị viên (Admin)!', 'error');
      setTimeout(() => {
        window.location.replace('dang-nhap.html?redirect=admin.html&unauthorized=1');
      }, 300);
      return;
    }

    // Hiển thị tên Admin ở topbar
    const user = window.Auth.getUser();
    const adminUserEl = document.getElementById('admin-current-user-name');
    if (adminUserEl && user) {
      adminUserEl.textContent = user.full_name || user.fullName || user.username || 'Admin';
    }

    initAdminDashboard();
    initMobileSidebarToggle();
  });
});

function initAdminDashboard() {
  loadAdminStats();
  loadRecentOrdersTable();
  loadProductsTable();
  loadCategoriesTable();
  loadOrdersTable();
  loadCategorySelectOptions();
  initProductVariantAndImageControls();
  initProductForm();
  initDbResetButton();
}

/**
 * Điều hướng Tab Quản Trị (Dashboard / Sản phẩm / Danh mục / Đơn hàng)
 */
window.switchAdminTab = function(tabName, linkEl) {
  // 1. Cập nhật Sidebar links active
  const sidebarLinks = document.querySelectorAll('.admin-sidebar-menu .admin-sidebar-link');
  sidebarLinks.forEach(link => {
    if (link.getAttribute('data-target') === tabName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // 2. Chuyển đổi View Panels
  const views = document.querySelectorAll('.admin-view-panel');
  views.forEach(v => v.classList.remove('active'));

  const targetView = document.getElementById(`view-${tabName}`);
  if (targetView) {
    targetView.classList.add('active');
  }

  // 3. Đóng mobile sidebar nếu đang mở
  const sidebar = document.getElementById('admin-sidebar');
  if (sidebar && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
  }

  // Scroll to top of content
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * Toggle mobile sidebar
 */
function initMobileSidebarToggle() {
  const toggleBtn = document.getElementById('admin-mobile-toggle');
  const sidebar = document.getElementById('admin-sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}

/**
 * 1. Thống kê tổng quan Dashboard (Khớp 4 Cards Ảnh 2)
 */
function loadAdminStats() {
  const productCountRes = window.dbManager.query('SELECT COUNT(*) as count FROM products');
  const orderCountRes = window.dbManager.query('SELECT COUNT(*) as count FROM orders');
  const pendingOrdersRes = window.dbManager.query("SELECT COUNT(*) as count FROM orders WHERE status IN ('Chờ xác nhận', 'Đang xử lý')");
  const revenueRes = window.dbManager.query("SELECT SUM(total) as sum FROM orders WHERE status != 'Đã hủy'");
  const categoryCountRes = window.dbManager.query('SELECT COUNT(*) as count FROM categories');

  const totalProducts = productCountRes[0]?.count || 0;
  const totalOrders = orderCountRes[0]?.count || 0;
  const pendingOrders = pendingOrdersRes[0]?.count || 0;
  const totalRevenue = revenueRes[0]?.sum || 0;
  const totalCategories = categoryCountRes[0]?.count || 0;

  const statProductsEl = document.getElementById('stat-total-products');
  const statCatsEl = document.getElementById('stat-total-categories');
  const statOrdersEl = document.getElementById('stat-total-orders');
  const statOrdersDetailEl = document.getElementById('stat-orders-detail-text');
  const statRevenueEl = document.getElementById('stat-total-revenue');

  if (statProductsEl) statProductsEl.textContent = totalProducts;
  if (statCatsEl) statCatsEl.textContent = totalCategories;
  if (statOrdersEl) statOrdersEl.textContent = totalOrders;
  if (statOrdersDetailEl) {
    statOrdersDetailEl.textContent = `Đơn hàng (${pendingOrders} chờ xử lý)`;
  }
  if (statRevenueEl) {
    statRevenueEl.textContent = formatCurrency(totalRevenue);
  }
}

/**
 * 2. Đơn hàng gần đây cho Dashboard (Khớp 100% Ảnh 2)
 */
function loadRecentOrdersTable() {
  const tbody = document.getElementById('admin-recent-orders-tbody');
  if (!tbody) return;

  const orders = window.dbManager.query('SELECT * FROM orders ORDER BY id DESC LIMIT 5');

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted" style="padding: 24px;">Chưa có đơn hàng nào được ghi nhận.</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(ord => {
    // Format status class
    let statusClass = 'status-cho-xu-ly';
    if (ord.status === 'Đang giao') statusClass = 'status-dang-giao';
    else if (ord.status === 'Hoàn thành') statusClass = 'status-hoan-thanh';
    else if (ord.status === 'Đã hủy') statusClass = 'status-da-huy';

    const formattedCode = ord.code.startsWith('#') ? ord.code : '#' + ord.code;

    return `
      <tr>
        <td style="font-weight: 600; color: #1e1714;">${escapeHtml(formattedCode)}</td>
        <td style="color: #374151;">${escapeHtml(ord.shipping_full_name)}</td>
        <td style="font-weight: 600; color: #1e1714;">${formatCurrency(ord.total)}</td>
        <td>
          <span class="admin-status-pill ${statusClass}">${escapeHtml(ord.status)}</span>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * 3. Tải danh sách sản phẩm lên bảng trong Tab "Sản phẩm"
 */
function loadProductsTable() {
  allAdminProducts = window.dbManager.query(`
    SELECT p.*, c.name as category_name,
           (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) as thumb_url
    FROM products p
    JOIN categories c ON p.category_id = c.id
    ORDER BY p.id DESC
  `);

  renderAdminProducts(allAdminProducts);
}

function renderAdminProducts(products) {
  const tbody = document.getElementById('admin-products-tbody');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding: 24px;">Không tìm thấy sản phẩm nào.</td></tr>';
    return;
  }

  tbody.innerHTML = products.map(prod => `
    <tr>
      <td style="font-weight: 600; width: 50px;">#${prod.id}</td>
      <td style="width: 60px;">
        <img src="${prod.thumb_url || 'images/logo.png'}" alt="" style="width: 44px; height: 56px; object-fit: cover; border-radius: var(--radius-xs);">
      </td>
      <td>
        <div style="font-weight: 600;">${escapeHtml(prod.name)}</div>
        <div class="text-muted" style="font-size: 0.78rem;">Slug: ${escapeHtml(prod.slug)}</div>
      </td>
      <td>
        <span class="badge badge-soft">${escapeHtml(prod.category_name)}</span>
      </td>
      <td style="font-weight: 600; color: var(--price-color);">
        ${formatCurrency(prod.base_price)}
        ${prod.sale_price ? `<br><small style="color: var(--text-muted); font-weight: normal;">Sale: ${formatCurrency(prod.sale_price)}</small>` : ''}
      </td>
      <td style="text-align: right; white-space: nowrap;">
        <button type="button" class="btn btn-sm btn-secondary" onclick="openEditProductModal(${prod.id})" style="padding: 4px 10px; font-size: 0.8rem;">Sửa</button>
        <button type="button" class="btn btn-sm btn-danger" onclick="deleteProduct(${prod.id})" style="padding: 4px 10px; font-size: 0.8rem;">Xóa</button>
      </td>
    </tr>
  `).join('');
}

window.filterAdminProducts = function() {
  const searchVal = (document.getElementById('admin-product-search')?.value || '').trim().toLowerCase();
  const catVal = document.getElementById('admin-product-cat-filter')?.value || '';

  const filtered = allAdminProducts.filter(p => {
    const matchName = !searchVal || p.name.toLowerCase().includes(searchVal) || p.slug.toLowerCase().includes(searchVal);
    const matchCat = !catVal || String(p.category_id) === String(catVal);
    return matchName && matchCat;
  });

  renderAdminProducts(filtered);
};

/**
 * 4. Tải danh mục vào Tab "Danh mục"
 */
function loadCategoriesTable() {
  const tbody = document.getElementById('admin-categories-tbody');
  if (!tbody) return;

  const cats = window.dbManager.query(`
    SELECT c.*, (SELECT COUNT(*) FROM products WHERE category_id = c.id) as product_count
    FROM categories c
    ORDER BY c.id ASC
  `);

  tbody.innerHTML = cats.map(c => `
    <tr>
      <td style="font-weight: 600;">#${c.id}</td>
      <td style="font-weight: 600;">${escapeHtml(c.name)}</td>
      <td class="text-muted" style="font-size: 0.85rem;">${escapeHtml(c.slug)}</td>
      <td style="text-align: center; font-weight: 600;">${c.product_count} sản phẩm</td>
      <td style="text-align: center;">
        <span class="badge badge-soft" style="color: #065f46; background-color: #d1fae5;">Hoạt động</span>
      </td>
    </tr>
  `).join('');
}

/**
 * 5. Tải danh sách đơn hàng lên bảng trong Tab "Đơn hàng" & đổi trạng thái
 */
function loadOrdersTable() {
  const tbody = document.getElementById('admin-orders-tbody');
  if (!tbody) return;

  const orders = window.dbManager.query('SELECT * FROM orders ORDER BY id DESC');

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding: 24px;">Chưa có đơn hàng nào được ghi nhận.</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(ord => {
    const formattedCode = ord.code.startsWith('#') ? ord.code : '#' + ord.code;
    return `
      <tr>
        <td style="font-weight: 700; color: #1e1714;">${escapeHtml(formattedCode)}</td>
        <td>
          <div style="font-weight: 600;">${escapeHtml(ord.shipping_full_name)}</div>
          <div class="text-muted" style="font-size: 0.8rem;">${escapeHtml(ord.shipping_phone)}</div>
        </td>
        <td class="text-muted" style="font-size: 0.82rem;">${ord.created_at || 'Mới đặt'}</td>
        <td style="font-weight: 700;">${formatCurrency(ord.total)}</td>
        <td>
          <select class="form-select" style="padding: 4px 8px; font-size: 0.82rem; width: auto;" onchange="updateOrderStatus(${ord.id}, this.value)">
            <option value="Đang xử lý" ${ord.status === 'Đang xử lý' ? 'selected' : ''}>Đang xử lý</option>
            <option value="Đang giao" ${ord.status === 'Đang giao' ? 'selected' : ''}>Đang giao</option>
            <option value="Hoàn thành" ${ord.status === 'Hoàn thành' ? 'selected' : ''}>Hoàn thành</option>
            <option value="Đã hủy" ${ord.status === 'Đã hủy' ? 'selected' : ''}>Đã hủy</option>
          </select>
        </td>
        <td style="text-align: right;">
          <button type="button" class="btn btn-sm btn-outline" onclick="viewOrderDetails(${ord.id})" style="padding: 4px 10px; font-size: 0.8rem;">Chi tiết</button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Cập nhật trạng thái đơn hàng
 */
window.updateOrderStatus = function(orderId, newStatus) {
  const success = window.dbManager.run('UPDATE orders SET status = ? WHERE id = ?', [newStatus, orderId]);
  if (success) {
    showToast(`Đã cập nhật trạng thái đơn hàng #${orderId} sang "${newStatus}"`, 'success');
    loadAdminStats();
    loadRecentOrdersTable();
  } else {
    showToast('Lỗi cập nhật trạng thái đơn hàng', 'error');
  }
};

/**
 * Xem chi tiết đơn hàng dạng modal
 */
window.viewOrderDetails = function(orderId) {
  const orders = window.dbManager.query('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (orders.length === 0) return;
  const order = orders[0];
  const items = window.dbManager.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);

  let modal = document.getElementById('admin-order-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'admin-order-modal';
    modal.className = 'search-modal-backdrop';
    document.body.appendChild(modal);
  }

  const formattedCode = order.code.startsWith('#') ? order.code : '#' + order.code;

  modal.innerHTML = `
    <div class="search-modal-card" style="padding: 24px; max-width: 650px;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-light); padding-bottom: 12px; margin-bottom: 16px;">
        <h3 style="font-size: 1.25rem;">Chi tiết đơn hàng: ${formattedCode}</h3>
        <button type="button" onclick="document.getElementById('admin-order-modal').classList.remove('active')" style="font-size: 1.3rem;">&times;</button>
      </div>
      <div style="font-size: 0.88rem; line-height: 1.7; margin-bottom: 16px;">
        <div>Người nhận: <strong>${escapeHtml(order.shipping_full_name)}</strong> - SĐT: <strong>${escapeHtml(order.shipping_phone)}</strong></div>
        <div>Email: ${escapeHtml(order.shipping_email || 'Không có')}</div>
        <div>Địa chỉ: ${escapeHtml(order.shipping_address)}, ${escapeHtml(order.shipping_province)}</div>
        <div>Phương thức: ${order.payment_method === 'banking' ? 'Chuyển khoản' : 'COD'}</div>
        ${order.shipping_note ? `<div>Ghi chú: ${escapeHtml(order.shipping_note)}</div>` : ''}
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-bottom: 16px;">
        <thead>
          <tr style="background: var(--bg-secondary); text-align: left;">
            <th style="padding: 8px 12px;">Sản phẩm</th>
            <th style="padding: 8px 12px; text-align: center;">SL</th>
            <th style="padding: 8px 12px; text-align: right;">Đơn giá</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(it => `
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid var(--border-light);">
                ${escapeHtml(it.product_name)} <br>
                <small class="text-muted">Màu: ${it.color} - Size: ${it.size}</small>
              </td>
              <td style="padding: 8px 12px; border-bottom: 1px solid var(--border-light); text-align: center;">${it.quantity}</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid var(--border-light); text-align: right;">${formatCurrency(it.unit_price)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 8px 12px; text-align: right; font-weight: 700;">Tổng cộng:</td>
            <td style="padding: 8px 12px; text-align: right; font-weight: 700; color: var(--price-color);">${formatCurrency(order.total)}</td>
          </tr>
        </tfoot>
      </table>
      <div style="text-align: right;">
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('admin-order-modal').classList.remove('active')">Đóng</button>
      </div>
    </div>
  `;

  modal.classList.add('active');
};

/**
 * 6. Xóa sản phẩm
 */
window.deleteProduct = function(productId) {
  if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm #${productId} không?`)) return;

  const success = window.dbManager.run('DELETE FROM products WHERE id = ?', [productId]);
  if (success) {
    showToast(`Đã xóa sản phẩm #${productId}`, 'info');
    loadAdminStats();
    loadProductsTable();
    loadCategoriesTable();
  } else {
    showToast('Không thể xóa sản phẩm do ràng buộc dữ liệu!', 'error');
  }
};

/**
 * 7. Quản lý Danh sách Màu sắc, Kích thước và Tải nhiều ảnh cho Sản phẩm
 */
const PRESET_COLORS = [
  { name: 'Trắng', hex: '#FFFFFF', border: true },
  { name: 'Đen', hex: '#1C1917' },
  { name: 'Be', hex: '#E6D7C3' },
  { name: 'Kem', hex: '#FAF6EE', border: true },
  { name: 'Nâu', hex: '#6B4423' },
  { name: 'Xám', hex: '#9CA3AF' },
  { name: 'Xanh dương', hex: '#2563EB' },
  { name: 'Xanh navy', hex: '#1E3A8A' },
  { name: 'Xanh rêu', hex: '#4D7C0F' },
  { name: 'Xanh lá', hex: '#10B981' },
  { name: 'Hồng', hex: '#F472B6' },
  { name: 'Đỏ', hex: '#DC2626' },
  { name: 'Vàng', hex: '#FBBF24' },
  { name: 'Cam', hex: '#F97316' },
  { name: 'Tím', hex: '#8B5CF6' }
];

const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Freesize', 'One Size', '26', '27', '28', '29', '30'];

let customColorsList = [];
let selectedColorsSet = new Set();

let customSizesList = [];
let selectedSizesSet = new Set();

let currentProductImages = [];

function renderColorSelector() {
  const container = document.getElementById('product-color-selector');
  if (!container) return;

  const allColors = [...PRESET_COLORS];
  customColorsList.forEach(cName => {
    if (!allColors.some(p => p.name.toLowerCase() === cName.toLowerCase())) {
      const hex = typeof getColorHex === 'function' ? getColorHex(cName) : '#b08259';
      allColors.push({ name: cName, hex: hex, border: hex === '#FFFFFF' || hex.toLowerCase() === '#faf6ee' });
    }
  });

  container.innerHTML = allColors.map(c => {
    const isSelected = selectedColorsSet.has(c.name);
    const borderStyle = c.border ? 'border: 1px solid #d1c7bc;' : '';
    const isGradient = c.hex && c.hex.includes('gradient');
    const bgProp = isGradient ? `background: ${c.hex};` : `background-color: ${c.hex};`;
    return `
      <div class="color-chip ${isSelected ? 'selected' : ''}" onclick="toggleColorSelection('${escapeHtml(c.name)}')">
        <span class="color-chip-swatch" style="${bgProp} ${borderStyle}"></span>
        <span>${escapeHtml(c.name)}</span>
        <span class="color-chip-check">✓</span>
      </div>
    `;
  }).join('');

  const countBadge = document.getElementById('selected-colors-count');
  if (countBadge) {
    countBadge.textContent = `${selectedColorsSet.size} màu đã chọn`;
  }
  const hiddenInput = document.getElementById('prod-colors-input');
  if (hiddenInput) {
    hiddenInput.value = Array.from(selectedColorsSet).join(', ');
  }
}

window.toggleColorSelection = function(colorName) {
  if (selectedColorsSet.has(colorName)) {
    selectedColorsSet.delete(colorName);
  } else {
    selectedColorsSet.add(colorName);
  }
  renderColorSelector();
};

window.addCustomColor = function() {
  const input = document.getElementById('custom-color-input');
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;

  if (!customColorsList.includes(val)) {
    customColorsList.push(val);
  }
  selectedColorsSet.add(val);
  input.value = '';
  renderColorSelector();
};

function renderSizeSelector() {
  const container = document.getElementById('product-size-selector');
  if (!container) return;

  const allSizes = [...PRESET_SIZES];
  customSizesList.forEach(sName => {
    if (!allSizes.includes(sName)) {
      allSizes.push(sName);
    }
  });

  container.innerHTML = allSizes.map(s => {
    const isSelected = selectedSizesSet.has(s);
    return `
      <div class="size-pill ${isSelected ? 'selected' : ''}" onclick="toggleSizeSelection('${escapeHtml(s)}')">
        <span>${escapeHtml(s)}</span>
        <span class="size-pill-check">✓</span>
      </div>
    `;
  }).join('');

  const countBadge = document.getElementById('selected-sizes-count');
  if (countBadge) {
    countBadge.textContent = `${selectedSizesSet.size} size đã chọn`;
  }
  const hiddenInput = document.getElementById('prod-sizes-input');
  if (hiddenInput) {
    hiddenInput.value = Array.from(selectedSizesSet).join(', ');
  }
}

window.toggleSizeSelection = function(sizeName) {
  if (selectedSizesSet.has(sizeName)) {
    selectedSizesSet.delete(sizeName);
  } else {
    selectedSizesSet.add(sizeName);
  }
  renderSizeSelector();
};

window.addCustomSize = function() {
  const input = document.getElementById('custom-size-input');
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;

  if (!customSizesList.includes(val)) {
    customSizesList.push(val);
  }
  selectedSizesSet.add(val);
  input.value = '';
  renderSizeSelector();
};

function renderProductImagesPreview() {
  const container = document.getElementById('product-images-preview-grid');
  const countBadge = document.getElementById('product-images-count-badge');
  const textarea = document.getElementById('prod-images-textarea');

  if (countBadge) {
    countBadge.textContent = `${currentProductImages.length} ảnh`;
  }

  if (textarea) {
    textarea.value = currentProductImages.join('\n');
  }

  if (!container) return;

  if (currentProductImages.length === 0) {
    container.innerHTML = `
      <div class="preview-empty-state">
        Chưa có hình ảnh nào được chọn. Nhấp vào khung tải ảnh phía trên để chọn nhiều ảnh từ thiết bị hoặc nhập link ảnh.
      </div>
    `;
    return;
  }

  container.innerHTML = currentProductImages.map((url, idx) => `
    <div class="image-preview-card">
      <img src="${url}" alt="Ảnh #${idx + 1}" onerror="this.src='images/logo.png'">
      ${idx === 0 ? '<span class="preview-badge-main">Ảnh chính</span>' : ''}
      <button type="button" class="preview-remove-btn" onclick="removeProductImage(${idx})" title="Xóa ảnh này">&times;</button>
      ${idx > 0 ? `<button type="button" class="preview-set-main-btn" onclick="setMainProductImage(${idx})">Đặt làm ảnh chính</button>` : ''}
    </div>
  `).join('');
}

window.removeProductImage = function(index) {
  currentProductImages.splice(index, 1);
  renderProductImagesPreview();
};

window.setMainProductImage = function(index) {
  if (index <= 0 || index >= currentProductImages.length) return;
  const [target] = currentProductImages.splice(index, 1);
  currentProductImages.unshift(target);
  renderProductImagesPreview();
};

window.addCustomImageUrl = function() {
  const input = document.getElementById('custom-image-url-input');
  if (!input) return;
  const val = input.value.trim();
  if (!val) {
    showToast('Vui lòng nhập đường dẫn ảnh hợp lệ!', 'error');
    return;
  }
  currentProductImages.push(val);
  input.value = '';
  renderProductImagesPreview();
  showToast('Đã thêm đường dẫn ảnh vào danh sách!', 'success');
};

/**
 * Tối ưu hóa file ảnh tải lên:
 * Resize tối đa 1000px, nén JPEG 85% để lưu vào SQLite client-side siêu mượt
 */
function processImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('File không phải định dạng ảnh hợp lệ'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width / height > MAX_WIDTH / MAX_HEIGHT) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mime, 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Không thể đọc dữ liệu ảnh'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc file'));
    reader.readAsDataURL(file);
  });
}

async function handleMultipleImageFiles(fileList) {
  if (!fileList || fileList.length === 0) return;
  const files = Array.from(fileList);
  
  showToast(`Đang tải & xử lý ${files.length} ảnh...`, 'info');

  let successCount = 0;
  for (const file of files) {
    try {
      const dataUrl = await processImageFile(file);
      currentProductImages.push(dataUrl);
      successCount++;
    } catch (err) {
      console.warn('Lỗi đọc ảnh:', err);
    }
  }

  renderProductImagesPreview();
  if (successCount > 0) {
    showToast(`Đã tải lên thành công ${successCount} ảnh!`, 'success');
  }
}

function initProductVariantAndImageControls() {
  renderColorSelector();
  renderSizeSelector();
  renderProductImagesPreview();

  // Enter keys
  const customColorInput = document.getElementById('custom-color-input');
  if (customColorInput) {
    customColorInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCustomColor();
      }
    });
  }

  const customSizeInput = document.getElementById('custom-size-input');
  if (customSizeInput) {
    customSizeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCustomSize();
      }
    });
  }

  const customImgInput = document.getElementById('custom-image-url-input');
  if (customImgInput) {
    customImgInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCustomImageUrl();
      }
    });
  }

  // Upload dropzone & file input
  const dropzone = document.getElementById('image-upload-dropzone');
  const fileInput = document.getElementById('prod-image-file-input');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      handleMultipleImageFiles(e.target.files);
      fileInput.value = '';
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        handleMultipleImageFiles(dt.files);
      }
    });
  }

  // Backdrop click to close
  const modalBackdrop = document.getElementById('product-modal-backdrop');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        closeProductModal();
      }
    });
  }
}

function resetProductVariantsAndImages() {
  selectedColorsSet.clear();
  selectedSizesSet.clear();
  currentProductImages = [];
  renderColorSelector();
  renderSizeSelector();
  renderProductImagesPreview();
}

/**
 * Mở Modal Thêm / Sửa Sản Phẩm
 */
window.openAddProductModal = function() {
  editingProductId = null;
  const form = document.getElementById('product-edit-form');
  if (form) form.reset();
  const title = document.getElementById('product-modal-title');
  if (title) title.textContent = 'Thêm sản phẩm mới';

  resetProductVariantsAndImages();

  document.getElementById('product-modal-backdrop').classList.add('active');
};

window.openEditProductModal = function(productId) {
  editingProductId = productId;
  const prods = window.dbManager.query('SELECT * FROM products WHERE id = ?', [productId]);
  if (prods.length === 0) return;
  const prod = prods[0];

  const form = document.getElementById('product-edit-form');
  if (!form) return;

  form.querySelector('[name="name"]').value = prod.name;
  form.querySelector('[name="slug"]').value = prod.slug;
  form.querySelector('[name="category_id"]').value = prod.category_id;
  form.querySelector('[name="base_price"]').value = prod.base_price;
  form.querySelector('[name="sale_price"]').value = prod.sale_price || '';
  form.querySelector('[name="description"]').value = prod.description || '';

  // Nạp màu
  selectedColorsSet.clear();
  const colors = window.dbManager.query('SELECT color FROM product_colors WHERE product_id = ?', [productId]);
  colors.forEach(c => {
    const cName = c.color.trim();
    if (cName) {
      if (!PRESET_COLORS.some(p => p.name.toLowerCase() === cName.toLowerCase()) && !customColorsList.includes(cName)) {
        customColorsList.push(cName);
      }
      selectedColorsSet.add(cName);
    }
  });
  renderColorSelector();

  // Nạp kích thước
  selectedSizesSet.clear();
  const sizes = window.dbManager.query('SELECT size FROM product_sizes WHERE product_id = ?', [productId]);
  sizes.forEach(s => {
    const sName = s.size.trim();
    if (sName) {
      if (!PRESET_SIZES.includes(sName) && !customSizesList.includes(sName)) {
        customSizesList.push(sName);
      }
      selectedSizesSet.add(sName);
    }
  });
  renderSizeSelector();

  // Nạp ảnh
  const images = window.dbManager.query('SELECT url FROM product_images WHERE product_id = ? ORDER BY sort_order ASC', [productId]);
  currentProductImages = images.map(i => i.url);
  renderProductImagesPreview();

  const title = document.getElementById('product-modal-title');
  if (title) title.textContent = `Chỉnh sửa sản phẩm #${prod.id}`;

  document.getElementById('product-modal-backdrop').classList.add('active');
};

window.closeProductModal = function() {
  const modal = document.getElementById('product-modal-backdrop');
  if (modal) modal.classList.remove('active');
};

/**
 * Tải danh mục vào dropdown trong form và bộ lọc
 */
function loadCategorySelectOptions() {
  const select = document.getElementById('prod-form-category');
  const filterSelect = document.getElementById('admin-product-cat-filter');
  const cats = window.dbManager.query('SELECT * FROM categories ORDER BY id ASC');

  if (select) {
    select.innerHTML = cats.map(c => `
      <option value="${c.id}">${escapeHtml(c.name)}</option>
    `).join('');
  }

  if (filterSelect) {
    filterSelect.innerHTML = '<option value="">Tất cả danh mục</option>' + cats.map(c => `
      <option value="${c.id}">${escapeHtml(c.name)}</option>
    `).join('');
  }
}

/**
 * Xử lý lưu form Thêm / Sửa Sản phẩm
 */
function initProductForm() {
  const form = document.getElementById('product-edit-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.querySelector('[name="name"]').value.trim();
    let slug = form.querySelector('[name="slug"]').value.trim();
    const categoryId = parseInt(form.querySelector('[name="category_id"]').value) || 1;
    const basePrice = parseInt(form.querySelector('[name="base_price"]').value) || 0;
    const salePriceInput = form.querySelector('[name="sale_price"]').value.trim();
    const salePrice = salePriceInput ? parseInt(salePriceInput) : null;
    const description = form.querySelector('[name="description"]').value.trim();

    // Đồng bộ từ biến thể & danh sách ảnh đã chọn
    const colorsStr = Array.from(selectedColorsSet).join(', ');
    const sizesStr = Array.from(selectedSizesSet).join(', ');
    const imagesStr = currentProductImages.join('\n');

    if (!name || !basePrice) {
      showToast('Vui lòng nhập tên sản phẩm và giá cơ bản!', 'error');
      return;
    }

    if (!slug) {
      slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    if (editingProductId) {
      // UPDATE
      window.dbManager.run(`
        UPDATE products 
        SET name = ?, slug = ?, category_id = ?, base_price = ?, sale_price = ?, description = ?
        WHERE id = ?
      `, [name, slug, categoryId, basePrice, salePrice, description, editingProductId]);

      // Xóa và cập nhật lại màu/size/ảnh
      window.dbManager.run('DELETE FROM product_colors WHERE product_id = ?', [editingProductId]);
      window.dbManager.run('DELETE FROM product_sizes WHERE product_id = ?', [editingProductId]);
      window.dbManager.run('DELETE FROM product_images WHERE product_id = ?', [editingProductId]);

      insertProductRelations(editingProductId, colorsStr, sizesStr, imagesStr);
      showToast('Đã cập nhật sản phẩm thành công!', 'success');
    } else {
      // INSERT
      const ok = window.dbManager.run(`
        INSERT INTO products (name, slug, category_id, base_price, sale_price, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [name, slug, categoryId, basePrice, salePrice, description]);

      if (!ok) {
        showToast('Lỗi thêm sản phẩm (có thể do trùng slug)!', 'error');
        return;
      }

      const last = window.dbManager.query('SELECT id FROM products WHERE slug = ?', [slug]);
      const newId = last[0]?.id;
      if (newId) {
        insertProductRelations(newId, colorsStr, sizesStr, imagesStr);
      }
      showToast('Đã thêm sản phẩm mới thành công!', 'success');
    }

    closeProductModal();
    loadAdminStats();
    loadProductsTable();
    loadCategoriesTable();
  });
}

function insertProductRelations(productId, colorsStr, sizesStr, imagesStr) {
  // Colors
  if (colorsStr) {
    const colors = colorsStr.split(',').map(s => s.trim()).filter(Boolean);
    colors.forEach(c => {
      window.dbManager.run('INSERT OR IGNORE INTO product_colors (product_id, color) VALUES (?, ?)', [productId, c]);
    });
  }

  // Sizes
  if (sizesStr) {
    const sizes = sizesStr.split(',').map(s => s.trim()).filter(Boolean);
    sizes.forEach(s => {
      window.dbManager.run('INSERT OR IGNORE INTO product_sizes (product_id, size) VALUES (?, ?)', [productId, s]);
    });
  }

  // Images
  if (imagesStr) {
    const images = imagesStr.split('\n').map(s => s.trim()).filter(Boolean);
    images.forEach((img, idx) => {
      window.dbManager.run('INSERT INTO product_images (product_id, url, sort_order) VALUES (?, ?, ?)', [productId, img, idx]);
    });
  }
}

/**
 * 8. Khôi phục CSDL SQLite gốc
 */
function initDbResetButton() {
  const btn = document.getElementById('btn-reset-db');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    if (!confirm('Bạn có chắc chắn muốn khôi phục cơ sở dữ liệu về trạng thái mẫu ban đầu không?')) return;

    await window.dbManager.resetDatabase();
    showToast('Đã khôi phục CSDL Henni Shop về trạng thái gốc!', 'success');
    initAdminDashboard();
  });
}
