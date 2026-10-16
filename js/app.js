/**
 * js/app.js - Shared Application Logic
 * Quản lý Header, Giỏ hàng, Toast, Tìm kiếm tức thời & Trạng thái CSDL
 */

// Bảng màu hex tương ứng cho các màu sắc thời trang của Henni Shop
const COLOR_HEX_MAP = {
  'trắng': '#FFFFFF',
  'đen': '#111827',
  'đen chấm bi': '#1F2937',
  'xanh dương': '#2563EB',
  'xanh navy': '#1E3A8A',
  'xanh lá': '#16A34A',
  'xanh quilt': '#3B82F6',
  'xanh baby': '#93C5FD',
  'xanh nhạt': '#BAE6FD',
  'vàng': '#EAB308',
  'xám': '#6B7280',
  'kem': '#FEF3C7'
};

/**
 * Định dạng số thành tiền tệ VNĐ: ví dụ 590000 -> 590.000₫
 */
function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

/**
 * Lấy mã màu CSS từ tên màu
 */
function getColorHex(colorName) {
  if (!colorName) return '#E5E7EB';
  const key = colorName.trim().toLowerCase();
  return COLOR_HEX_MAP[key] || '#D1D5DB';
}

/**
 * Đọc tham số từ URL
 */
function getUrlParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

/**
 * Thoát ký tự HTML chống XSS
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Lấy giỏ hàng từ localStorage
 */
function getCartItems() {
  try {
    const raw = localStorage.getItem('henni_cart_items');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Lỗi đọc giỏ hàng:', e);
    return [];
  }
}

/**
 * Lưu giỏ hàng vào localStorage và cập nhật badge
 */
function saveCartItems(items) {
  try {
    localStorage.setItem('henni_cart_items', JSON.stringify(items));
    updateCartBadge();
  } catch (e) {
    console.error('Lỗi lưu giỏ hàng:', e);
  }
}

/**
 * Cập nhật số lượng trên icon giỏ hàng ở Header
 */
function updateCartBadge() {
  const items = getCartItems();
  const totalCount = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);
  const badgeEl = document.getElementById('cart-count');
  if (badgeEl) {
    badgeEl.textContent = totalCount;
  }
}

/**
 * Hiển thị Toast thông báo
 */
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <span class="toast-close">&times;</span>
  `;

  container.appendChild(toast);

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.remove();
  });

  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }
  }, 3500);
}

/**
 * Thêm nhanh sản phẩm vào giỏ hàng từ trang danh sách
 */
function quickAddToCart(productId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!window.dbManager || !window.dbManager.isReady) {
    showToast('Cơ sở dữ liệu đang nạp, vui lòng chờ trong giây lát...', 'info');
    return;
  }

  const prods = window.dbManager.query('SELECT * FROM products WHERE id = ?', [productId]);
  if (!prods || prods.length === 0) {
    showToast('Không tìm thấy sản phẩm!', 'error');
    return;
  }
  const prod = prods[0];

  // Lấy màu sắc mặc định
  const colors = window.dbManager.query('SELECT color FROM product_colors WHERE product_id = ?', [productId]);
  const defaultColor = colors.length > 0 ? colors[0].color : 'Tiêu chuẩn';

  // Lấy kích cỡ mặc định
  const sizes = window.dbManager.query('SELECT size FROM product_sizes WHERE product_id = ?', [productId]);
  const defaultSize = sizes.length > 0 ? sizes[0].size : 'F';

  // Lấy ảnh đại diện
  const images = window.dbManager.query('SELECT url FROM product_images WHERE product_id = ? ORDER BY sort_order ASC LIMIT 1', [productId]);
  const defaultImage = images.length > 0 ? images[0].url : 'images/logo.png';

  const cart = getCartItems();
  const existingIndex = cart.findIndex(
    item => item.product_id === prod.id && item.color === defaultColor && item.size === defaultSize
  );

  if (existingIndex > -1) {
    cart[existingIndex].quantity = (parseInt(cart[existingIndex].quantity) || 1) + 1;
  } else {
    cart.push({
      product_id: prod.id,
      slug: prod.slug,
      name: prod.name,
      price: prod.sale_price ? prod.sale_price : prod.base_price,
      color: defaultColor,
      size: defaultSize,
      image: defaultImage,
      quantity: 1
    });
  }

  saveCartItems(cart);
  showToast(`Đã thêm "${prod.name}" vào giỏ hàng!`, 'success');
}

/**
 * Tạo HTML cho Card Sản phẩm dùng chung giữa Trang chủ & Trang Sản phẩm
 */
function createProductCardHtml(product) {
  const images = window.dbManager.query(
    'SELECT url FROM product_images WHERE product_id = ? ORDER BY sort_order ASC LIMIT 2',
    [product.id]
  );

  const img1 = images.length > 0 ? images[0].url : 'images/logo.png';
  const img2 = images.length > 1 ? images[1].url : img1;

  const colors = window.dbManager.query(
    'SELECT color FROM product_colors WHERE product_id = ?',
    [product.id]
  );

  const sizes = window.dbManager.query(
    'SELECT size FROM product_sizes WHERE product_id = ?',
    [product.id]
  );

  let swatchesHtml = '';
  if (colors && colors.length > 0) {
    swatchesHtml = `<div class="product-color-swatches">` + 
      colors.map(c => `
        <span class="color-swatch-dot" style="background-color: ${getColorHex(c.color)}" title="${escapeHtml(c.color)}"></span>
      `).join('') + 
      `</div>`;
  }

  const priceFormatted = formatCurrency(product.sale_price || product.base_price);
  const originalPriceHtml = product.sale_price 
    ? `<span class="price-original">${formatCurrency(product.base_price)}</span>` 
    : '';

  return `
    <div class="product-card" id="product-card-${product.id}">
      <div class="product-image-wrap">
        <a href="chi-tiet.html?slug=${encodeURIComponent(product.slug)}">
          <img class="product-img img-primary" src="${img1}" alt="${escapeHtml(product.name)}" loading="lazy">
          <img class="product-img img-secondary" src="${img2}" alt="${escapeHtml(product.name)}" loading="lazy">
        </a>
        <div class="product-badges">
          ${product.sale_price ? '<span class="badge badge-sale">SALE</span>' : '<span class="badge badge-black">NEW</span>'}
        </div>

        <!-- Nút THÊM VÀO GIỎ hiển thị khi rê chuột (màu camel chuẩn theo mẫu) -->
        <div class="quick-action-bar">
          <button type="button" class="btn-hover-add-cart" onclick="openQuickVariantPicker(${product.id}, event)">
            THÊM VÀO GIỎ
          </button>
        </div>

        <!-- Khung Popup chọn Màu & Size trên ảnh -->
        <div class="quick-variant-popup" id="variant-popup-${product.id}" onclick="event.stopPropagation()">
          <div class="variant-popup-header">
            <span class="variant-popup-title" id="color-label-${product.id}">MÀU: CHỌN</span>
            <button type="button" class="variant-popup-close" onclick="closeQuickVariantPicker(${product.id}, event)" title="Đóng">&times;</button>
          </div>
          <div class="variant-color-list" id="color-list-${product.id}">
            ${colors.map(c => `
              <button type="button" class="variant-color-dot" 
                      style="background-color: ${getColorHex(c.color)}" 
                      title="${escapeHtml(c.color)}"
                      data-color="${escapeHtml(c.color)}"
                      onclick="selectCardVariantColor(${product.id}, '${escapeHtml(c.color)}', this, event)">
              </button>
            `).join('')}
          </div>

          <div class="variant-popup-header" style="margin-top: 10px;">
            <span class="variant-popup-title" id="size-label-${product.id}">SIZE: CHỌN</span>
          </div>
          <div class="variant-size-list" id="size-list-${product.id}">
            ${sizes.map(s => `
              <button type="button" class="variant-size-btn" 
                      data-size="${escapeHtml(s.size)}"
                      onclick="selectCardVariantSize(${product.id}, '${escapeHtml(s.size)}', this, event)">
                ${escapeHtml(s.size)}
              </button>
            `).join('')}
          </div>

          <!-- Nút chỉ cho phép click khi đã chọn đủ cả Màu và Size -->
          <button type="button" class="btn-confirm-add-cart disabled" id="confirm-btn-${product.id}"
                  disabled 
                  onclick="confirmQuickAddToCart(${product.id}, event)">
            THÊM VÀO GIỎ
          </button>
        </div>
      </div>
      <div class="product-info">
        <a href="chi-tiet.html?slug=${encodeURIComponent(product.slug)}" class="product-title" title="${escapeHtml(product.name)}">
          ${escapeHtml(product.name)}
        </a>
        <div class="product-price-box">
          <span class="price">${priceFormatted}</span>
          ${originalPriceHtml}
        </div>
        ${swatchesHtml}
      </div>
    </div>
  `;
}

// Trạng thái biến thể được chọn cho từng card sản phẩm
window.cardSelections = {};

/**
 * Mở popup chọn biến thể Màu & Size trên card
 */
window.openQuickVariantPicker = function(productId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  // Đóng các popup khác nếu đang mở
  document.querySelectorAll('.quick-variant-popup.active').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.product-card.picker-open').forEach(c => c.classList.remove('picker-open'));

  const popup = document.getElementById(`variant-popup-${productId}`);
  if (!popup) return;

  const card = popup.closest('.product-card');
  if (card) card.classList.add('picker-open');

  // Khởi tạo trạng thái rỗng: Bắt buộc người dùng phải chọn đủ cả 2 phân loại
  window.cardSelections[productId] = { color: null, size: null };

  const colorLabel = document.getElementById(`color-label-${productId}`);
  if (colorLabel) colorLabel.textContent = 'MÀU: CHỌN';

  const sizeLabel = document.getElementById(`size-label-${productId}`);
  if (sizeLabel) sizeLabel.textContent = 'SIZE: CHỌN';

  popup.querySelectorAll('.variant-color-dot').forEach(d => d.classList.remove('selected'));
  popup.querySelectorAll('.variant-size-btn').forEach(b => b.classList.remove('selected'));

  const confirmBtn = document.getElementById(`confirm-btn-${productId}`);
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.classList.add('disabled');
  }

  popup.classList.add('active');
};

/**
 * Đóng popup chọn biến thể
 */
window.closeQuickVariantPicker = function(productId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const popup = document.getElementById(`variant-popup-${productId}`);
  if (popup) {
    popup.classList.remove('active');
    const card = popup.closest('.product-card');
    if (card) card.classList.remove('picker-open');
  }
};

/**
 * Chọn màu trong popup
 */
window.selectCardVariantColor = function(productId, color, element, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!window.cardSelections[productId]) {
    window.cardSelections[productId] = { color: null, size: null };
  }
  window.cardSelections[productId].color = color;

  const colorLabel = document.getElementById(`color-label-${productId}`);
  if (colorLabel) colorLabel.textContent = `MÀU: ${color.toUpperCase()}`;

  const popup = document.getElementById(`variant-popup-${productId}`);
  if (popup) {
    popup.querySelectorAll('.variant-color-dot').forEach(d => d.classList.remove('selected'));
  }
  if (element) element.classList.add('selected');

  window.checkCardVariantValidation(productId);
};

/**
 * Chọn size trong popup
 */
window.selectCardVariantSize = function(productId, size, element, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!window.cardSelections[productId]) {
    window.cardSelections[productId] = { color: null, size: null };
  }
  window.cardSelections[productId].size = size;

  const sizeLabel = document.getElementById(`size-label-${productId}`);
  if (sizeLabel) sizeLabel.textContent = `SIZE: ${size.toUpperCase()}`;

  const popup = document.getElementById(`variant-popup-${productId}`);
  if (popup) {
    popup.querySelectorAll('.variant-size-btn').forEach(b => b.classList.remove('selected'));
  }
  if (element) element.classList.add('selected');

  window.checkCardVariantValidation(productId);
};

/**
 * Kiểm tra điều kiện: BẮT BUỘC CHỌN ĐỦ CẢ 2 PHÂN LOẠI (MÀU VÀ SIZE)
 */
window.checkCardVariantValidation = function(productId) {
  const sel = window.cardSelections[productId];
  const confirmBtn = document.getElementById(`confirm-btn-${productId}`);
  if (!confirmBtn) return;

  if (sel && sel.color && sel.size) {
    confirmBtn.disabled = false;
    confirmBtn.classList.remove('disabled');
  } else {
    confirmBtn.disabled = true;
    confirmBtn.classList.add('disabled');
  }
};

/**
 * Xác nhận thêm vào giỏ hàng từ popup
 */
window.confirmQuickAddToCart = function(productId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const sel = window.cardSelections[productId];
  if (!sel || !sel.color || !sel.size) {
    showToast('Vui lòng chọn đầy đủ cả Màu sắc và Kích thước!', 'error');
    return;
  }

  const prods = window.dbManager.query('SELECT * FROM products WHERE id = ?', [productId]);
  if (!prods || prods.length === 0) {
    showToast('Không tìm thấy sản phẩm!', 'error');
    return;
  }
  const prod = prods[0];

  const images = window.dbManager.query(
    'SELECT url FROM product_images WHERE product_id = ? ORDER BY sort_order ASC LIMIT 1',
    [productId]
  );
  const image = images.length > 0 ? images[0].url : 'images/logo.png';

  const cart = getCartItems();
  const existingIndex = cart.findIndex(
    item => item.product_id === prod.id && item.color === sel.color && item.size === sel.size
  );

  if (existingIndex > -1) {
    cart[existingIndex].quantity = (parseInt(cart[existingIndex].quantity) || 1) + 1;
  } else {
    cart.push({
      product_id: prod.id,
      slug: prod.slug,
      name: prod.name,
      price: prod.sale_price ? prod.sale_price : prod.base_price,
      color: sel.color,
      size: sel.size,
      image: image,
      quantity: 1
    });
  }

  saveCartItems(cart);
  showToast(`Đã thêm "${prod.name}" (${sel.color} / Size ${sel.size}) vào giỏ hàng!`, 'success');
  window.closeQuickVariantPicker(productId, event);
};

/**
 * Khởi tạo Tìm kiếm tức thời (Instant Search Modal)
 */
function initSearchModal() {
  const openBtn = document.getElementById('open-search-modal');
  const backdrop = document.getElementById('search-modal-backdrop');
  const closeBtn = document.getElementById('close-search-modal');
  const searchInput = document.getElementById('search-modal-input');
  const resultsContainer = document.getElementById('search-modal-results');

  if (!openBtn || !backdrop || !searchInput) return;

  function openModal() {
    backdrop.classList.add('active');
    setTimeout(() => searchInput.focus(), 100);
  }

  function closeModal() {
    backdrop.classList.remove('active');
    searchInput.value = '';
    if (resultsContainer) resultsContainer.innerHTML = '';
  }

  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop.classList.contains('active')) {
      closeModal();
    }
  });

  // Tìm kiếm tức thời khi gõ phím
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.trim();
    if (!term) {
      resultsContainer.innerHTML = '';
      return;
    }

    if (!window.dbManager || !window.dbManager.isReady) {
      resultsContainer.innerHTML = '<div style="padding: 16px; color: var(--text-muted);">Đang nạp CSDL...</div>';
      return;
    }

    const matches = window.dbManager.query(
      `SELECT p.id, p.slug, p.name, p.base_price, p.sale_price,
              (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) as image_url
       FROM products p 
       WHERE p.name LIKE ? OR p.description LIKE ?
       LIMIT 6`,
      [`%${term}%`, `%${term}%`]
    );

    if (matches.length === 0) {
      resultsContainer.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-secondary);">
          Không tìm thấy sản phẩm nào khớp với "<strong>${escapeHtml(term)}</strong>"
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = matches.map(prod => `
      <a href="chi-tiet.html?slug=${encodeURIComponent(prod.slug)}" class="search-result-item">
        <img class="search-result-thumb" src="${prod.image_url || 'images/logo.png'}" alt="${escapeHtml(prod.name)}">
        <div class="search-result-details">
          <div class="search-result-name">${escapeHtml(prod.name)}</div>
          <div class="search-result-price">${formatCurrency(prod.sale_price || prod.base_price)}</div>
        </div>
      </a>
    `).join('') + `
      <div style="padding: 12px 8px; text-align: center; border-top: 1px solid var(--border-light); margin-top: 8px;">
        <a href="san-pham.html?search=${encodeURIComponent(term)}" class="btn btn-sm btn-outline" style="width: 100%;">
          Xem tất cả kết quả (${matches.length}+)
        </a>
      </div>
    `;
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const term = searchInput.value.trim();
      if (term) {
        window.location.href = `san-pham.html?search=${encodeURIComponent(term)}`;
      }
    }
  });
}

/**
 * Điều hướng Mobile Drawer Menu
 */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const mainNav = document.getElementById('main-nav');
  const backdrop = document.getElementById('nav-mobile-backdrop');

  if (!toggleBtn || !mainNav) return;

  function toggleMenu() {
    mainNav.classList.toggle('mobile-active');
    if (backdrop) backdrop.classList.toggle('active');
  }

  toggleBtn.addEventListener('click', toggleMenu);
  if (backdrop) backdrop.addEventListener('click', toggleMenu);
}

/**
 * Đánh dấu link điều hướng đang active theo cấu trúc menu mới
 */
function highlightActiveNav() {
  const currentPath = window.location.pathname;
  const currentCategory = getUrlParam('category');
  const navLinks = document.querySelectorAll('.main-nav .nav-link');
  const collectionToggle = document.getElementById('nav-collection-toggle');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    if (currentCategory && link.id === 'nav-collection-toggle') {
      link.classList.add('active');
    } else if (!currentCategory && (
      (currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath === '') && href === 'index.html' ||
      currentPath.includes('san-pham.html') && href === 'san-pham.html' && link.id !== 'nav-collection-toggle' ||
      currentPath.includes('ve-chung-toi.html') && href === 've-chung-toi.html'
    )) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }

    // Khi click đổi active
    link.addEventListener('click', () => {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

/**
 * ==========================================================================
 * HỆ THỐNG XÁC THỰC & PHÂN QUYỀN (AUTHENTICATION & AUTHORIZATION)
 * - Tài khoản admin cứng: username: admin / password: admin123
 * - Chỉ tài khoản admin mới được phép truy cập admin.html
 * ==========================================================================
 */
window.Auth = {
  getCurrentUser() {
    try {
      const stored = localStorage.getItem('henni_current_user') || sessionStorage.getItem('henni_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  },

  getUser() {
    return this.getCurrentUser();
  },

  setCurrentUser(user, remember = true) {
    const data = JSON.stringify(user);
    if (remember) {
      localStorage.setItem('henni_current_user', data);
      sessionStorage.removeItem('henni_current_user');
    } else {
      sessionStorage.setItem('henni_current_user', data);
      localStorage.removeItem('henni_current_user');
    }
    window.updateAuthUI();
  },

  logout() {
    localStorage.removeItem('henni_current_user');
    sessionStorage.removeItem('henni_current_user');
    window.updateAuthUI();
    showToast('Đã đăng xuất tài khoản thành công!', 'info');
    
    // Nếu đang ở trang admin, điều hướng ngay về trang đăng nhập
    if (window.location.pathname.includes('admin.html')) {
      setTimeout(() => {
        window.location.href = 'dang-nhap.html?redirect=admin.html';
      }, 400);
    }
  },

  isAdmin() {
    const user = this.getCurrentUser();
    return !!(user && (user.role === 'admin' || user.username === 'admin'));
  },

  login(usernameOrEmail, password) {
    if (!usernameOrEmail || !password) {
      return { success: false, message: 'Vui lòng nhập đầy đủ Tên đăng nhập/Email và Mật khẩu!' };
    }
    const val = usernameOrEmail.trim();
    const users = window.dbManager.query(
      "SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?",
      [val, val, password]
    );

    if (users && users.length > 0) {
      return { success: true, user: users[0] };
    }
    return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác!' };
  },

  register({ username, password, fullName, email, phone }) {
    if (!username || !password || !fullName || !email) {
      return { success: false, message: 'Vui lòng điền đầy đủ các trường thông tin bắt buộc!' };
    }
    const uName = username.trim().toLowerCase();
    const mail = email.trim().toLowerCase();

    if (password.length < 6) {
      return { success: false, message: 'Mật khẩu phải có độ dài tối thiểu từ 6 ký tự trở lên!' };
    }

    // Không cho phép đăng ký trùng với admin hoặc username có sẵn
    const existing = window.dbManager.query(
      "SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?",
      [uName, mail]
    );

    if (existing && existing.length > 0) {
      if (existing[0].username.toLowerCase() === uName) {
        return { success: false, message: 'Tên đăng nhập này đã tồn tại, vui lòng chọn tên khác!' };
      }
      return { success: false, message: 'Email này đã được sử dụng, vui lòng chọn email khác!' };
    }

    const ok = window.dbManager.run(
      "INSERT INTO users (username, password, full_name, email, phone, role) VALUES (?, ?, ?, ?, ?, 'customer')",
      [uName, password, fullName.trim(), mail, phone ? phone.trim() : '']
    );

    if (ok) {
      const created = window.dbManager.query("SELECT * FROM users WHERE LOWER(username) = ?", [uName]);
      return { success: true, user: created[0] };
    }
    return { success: false, message: 'Có lỗi xảy ra khi lưu vào SQLite, vui lòng thử lại!' };
  }
};

/**
 * Cập nhật giao diện người dùng trên Header (Nút Đăng nhập / Menu Tài khoản)
 */
window.updateAuthUI = function() {
  const user = window.Auth.getCurrentUser();
  const userBtn = document.getElementById('header-user-btn');
  const userMenuDropdown = document.getElementById('user-dropdown-menu');

  if (!userBtn) return;

  // Giữ icon user đồng bộ như trong ảnh 1
  userBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  `;

  if (user) {
    const isAdm = user.role === 'admin' || user.username === 'admin';
    const displayName = isAdm ? 'Admin' : (user.full_name ? user.full_name.split(' ').pop() : user.username);
    userBtn.title = `Tài khoản: ${user.full_name || user.username} (${isAdm ? 'Quản trị viên' : 'Khách hàng'})`;

    if (userMenuDropdown) {
      userMenuDropdown.innerHTML = `
        <div class="user-dropdown-greeting">
          Xin chào, <strong>${escapeHtml(displayName)}</strong>
        </div>
        <div class="user-dropdown-list">
          <a href="dang-nhap.html" class="user-dropdown-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Tài khoản</span>
          </a>
          <a href="don-hang.html" class="user-dropdown-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            <span>Đơn hàng</span>
          </a>
          ${isAdm ? `
            <a href="admin.html" class="user-dropdown-item admin-pill-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
              <span>Quản trị</span>
            </a>
          ` : ''}
          <a href="#" class="user-dropdown-item logout-link" onclick="event.preventDefault(); window.Auth.logout();">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>Đăng xuất</span>
          </a>
        </div>
      `;
    }
  } else {
    userBtn.title = 'Đăng nhập / Đăng ký';

    if (userMenuDropdown) {
      userMenuDropdown.innerHTML = `
        <div class="user-dropdown-greeting">
          Xin chào, <strong>Khách</strong>
        </div>
        <div class="user-dropdown-list">
          <a href="dang-nhap.html" class="user-dropdown-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            <span>Đăng nhập</span>
          </a>
          <a href="dang-nhap.html?mode=register" class="user-dropdown-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Đăng ký</span>
          </a>
          <a href="don-hang.html" class="user-dropdown-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            <span>Đơn hàng</span>
          </a>
        </div>
      `;
    }
  }
};

/**
 * Khởi tạo hành vi click mở dropdown menu tài khoản
 */
function initUserMenuToggle() {
  const userBtn = document.getElementById('header-user-btn');
  const userDropdown = document.getElementById('user-dropdown-menu');
  if (!userBtn || !userDropdown) return;

  userBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    userDropdown.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu-wrapper')) {
      userDropdown.classList.remove('show');
    }
  });
}

/**
 * Quản lý màn hình Loading & kiểm tra môi trường theo SPEC
 */
function initEnvironmentChecker() {
  const overlay = document.getElementById('db-loading-overlay');
  if (!overlay) return;

  const isFileProtocol = window.location.protocol === 'file:';
  const subtext = overlay.querySelector('.loading-subtext');

  if (isFileProtocol && subtext) {
    subtext.textContent = 'Đang nạp dữ liệu cửa hàng từ SQLite WebAssembly... (Khuyến nghị mở qua Live Server hoặc GitHub Pages để tối ưu hiệu năng).';
  }

  // Khi DB sẵn sàng, ẩn overlay
  window.dbManager.onReady(() => {
    setTimeout(() => {
      overlay.classList.add('hidden');
    }, 250);
  });
}

// Khởi tạo toàn cục khi DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  initEnvironmentChecker();
  updateCartBadge();
  initSearchModal();
  initMobileMenu();
  highlightActiveNav();
  initUserMenuToggle();
  window.updateAuthUI();

  // Đóng popup chọn biến thể khi click ra ngoài
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.quick-variant-popup') && !e.target.closest('.btn-hover-add-cart')) {
      document.querySelectorAll('.quick-variant-popup.active').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.product-card.picker-open').forEach(c => c.classList.remove('picker-open'));
    }
  });

  // Khởi động Database
  window.dbManager.init();
});

