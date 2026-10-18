/**
 * js/app.js - Shared Application Logic
 * Quản lý Header, Giỏ hàng, Toast, Tìm kiếm tức thời & Trạng thái CSDL
 */

// Bảng màu hex tương ứng cho các màu sắc thời trang của Henni Shop
const COLOR_HEX_MAP = {
  // Trắng / Kem / Be / Nude
  'trắng': '#FFFFFF',
  'trắng tinh': '#FFFFFF',
  'trắng ngà': '#FBFBF9',
  'trắng sứ': '#FDFDFD',
  'kem': '#FAF6EE',
  'màu kem': '#FAF6EE',
  'be': '#E6D7C3',
  'màu be': '#E6D7C3',
  'nude': '#E8D5C4',
  'cát': '#D7C4B7',

  // Đen / Xám / Ghi
  'đen': '#1C1917',
  'đen tuyền': '#0F172A',
  'đen chấm bi': '#1F2937',
  'xám': '#9CA3AF',
  'xám khói': '#6B7280',
  'xám nhạt': '#D1D5DB',
  'xám đậm': '#4B5563',
  'ghi': '#9CA3AF',

  // Đỏ / Rượu / Mận
  'đỏ': '#DC2626',
  'đỏ tươi': '#EF4444',
  'đỏ đô': '#991B1B',
  'đỏ rượu': '#881337',
  'đỏ mận': '#701A75',
  'rượu vang': '#881337',
  'burgundy': '#800020',
  'maroon': '#800000',

  // Hồng
  'hồng': '#F472B6',
  'hồng phấn': '#FBCFE8',
  'hồng pastel': '#FDF2F8',
  'hồng cánh sen': '#EC4899',
  'hồng đất': '#BE185D',
  'hồng nhạt': '#FCE7F3',

  // Nâu / Da bò / Camel
  'nâu': '#6B4423',
  'nâu tây': '#78350F',
  'nâu đất': '#5C381E',
  'nâu bò': '#92400E',
  'nâu nhạt': '#A16207',
  'camel': '#C4A07C',
  'caramel': '#B45309',

  // Xanh dương / Navy / Jean
  'xanh dương': '#2563EB',
  'xanh navy': '#1E3A8A',
  'xanh đen': '#0F172A',
  'xanh biển': '#0284C7',
  'xanh coban': '#1D4ED8',
  'xanh baby': '#93C5FD',
  'xanh nhạt': '#BAE6FD',
  'xanh quilt': '#3B82F6',
  'xanh da trời': '#38BDF8',
  'jean': '#4B6B94',

  // Xanh lá / Rêu / Bơ / Mint
  'xanh lá': '#10B981',
  'xanh rêu': '#4D7C0F',
  'xanh olive': '#3F6212',
  'xanh bộ đội': '#365314',
  'xanh bơ': '#84CC16',
  'xanh mint': '#6EE7B7',
  'xanh pastel': '#A7F3D0',
  'xanh ngọc': '#14B8A6',
  'xanh lục': '#059669',

  // Vàng / Cam
  'vàng': '#FBBF24',
  'vàng chanh': '#FACC15',
  'vàng pastel': '#FEF08A',
  'vàng nghệ': '#D97706',
  'vàng nhạt': '#FEF9C3',
  'cam': '#F97316',
  'cam đất': '#EA580C',
  'cam đào': '#FB923C',
  'cam san hô': '#FF7F50',

  // Tím
  'tím': '#8B5CF6',
  'tím pastel': '#DDD6FE',
  'tím khoai môn': '#C4B5FD',
  'tím than': '#581C87',
  'tím nhạt': '#EDE9FE',
  'lavender': '#E9D5FF',

  // Họa tiết đặc biệt
  'họa tiết hoa': 'linear-gradient(135deg, #fbcfe8, #a7f3d0)',
  'hoa nhí': 'linear-gradient(135deg, #fbcfe8, #fed7aa)',
  'kẻ sọc': 'repeating-linear-gradient(45deg, #e5e7eb, #e5e7eb 3px, #111827 3px, #111827 6px)'
};

/**
 * Lấy mã màu CSS từ tên màu với thuật toán nhận diện thông minh
 */
function getColorHex(colorName) {
  if (!colorName) return '#E5E7EB';
  const raw = String(colorName).trim();
  const key = raw.toLowerCase();

  // 1. Khớp chính xác trong từ điển
  if (COLOR_HEX_MAP[key]) return COLOR_HEX_MAP[key];

  // 2. Nếu người dùng nhập mã hex trực tiếp (VD: #ff0000, #333)
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(raw)) return raw;

  // 3. Khớp thông minh theo từ khóa tiếng Việt / tiếng Anh
  if (key.includes('đỏ') || key.includes('red') || key.includes('mận') || key.includes('rượu') || key.includes('burgundy')) return '#DC2626';
  if (key.includes('hồng') || key.includes('pink')) return '#F472B6';
  if (key.includes('cam') || key.includes('orange')) return '#F97316';
  if (key.includes('vàng') || key.includes('yellow')) return '#FBBF24';
  if (key.includes('tím') || key.includes('purple') || key.includes('violet') || key.includes('lavender')) return '#8B5CF6';
  if (key.includes('nâu') || key.includes('brown') || key.includes('bò') || key.includes('caramel') || key.includes('camel')) return '#6B4423';
  if (key.includes('be') || key.includes('beige') || key.includes('nude') || key.includes('cát')) return '#E6D7C3';
  if (key.includes('kem') || key.includes('cream')) return '#FAF6EE';
  if (key.includes('rêu') || key.includes('moss') || key.includes('olive')) return '#4D7C0F';
  if (key.includes('navy')) return '#1E3A8A';
  if (key.includes('xanh lá') || key.includes('green') || key.includes('lục') || key.includes('bơ') || key.includes('mint')) return '#10B981';
  if (key.includes('xanh') || key.includes('blue') || key.includes('jean')) return '#2563EB';
  if (key.includes('đen') || key.includes('black')) return '#1C1917';
  if (key.includes('trắng') || key.includes('white')) return '#FFFFFF';
  if (key.includes('xám') || key.includes('ghi') || key.includes('gray') || key.includes('grey')) return '#9CA3AF';
  if (key.includes('hoa')) return 'linear-gradient(135deg, #fbcfe8, #a7f3d0)';
  if (key.includes('sọc') || key.includes('kẻ') || key.includes('stripe')) return 'repeating-linear-gradient(45deg, #e5e7eb, #e5e7eb 3px, #111827 3px, #111827 6px)';

  return '#D1D5DB';
}

/**
 * Định dạng số thành tiền tệ VNĐ: ví dụ 590000 -> 590.000₫
 */
function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '0₫';
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}
window.formatCurrency = formatCurrency;
window.getColorHex = getColorHex;

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

// Dọn dẹp khóa giỏ hàng dùng chung cũ (nếu có từ phiên bản trước) để phân tách riêng biệt 100%
try {
  localStorage.removeItem('henni_cart_items');
} catch (e) {}

/**
 * Lấy khóa lưu trữ giỏ hàng trong localStorage phân biệt riêng theo từng tài khoản
 * - Khách vãng lai (chưa đăng nhập): 'henni_cart_guest'
 * - Tài khoản đã đăng nhập: 'henni_cart_user_<id>' (hoặc email)
 */
function getCartStorageKey() {
  const user = window.Auth ? window.Auth.getCurrentUser() : null;
  if (user) {
    if (user.id) return `henni_cart_user_${user.id}`;
    if (user.email) return `henni_cart_user_${encodeURIComponent(user.email)}`;
    if (user.username) return `henni_cart_user_${encodeURIComponent(user.username)}`;
  }
  return 'henni_cart_guest';
}
window.getCartStorageKey = getCartStorageKey;

/**
 * Lấy giỏ hàng từ localStorage của tài khoản hiện tại
 */
function getCartItems() {
  try {
    const key = getCartStorageKey();
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Lỗi đọc giỏ hàng:', e);
    return [];
  }
}
window.getCartItems = getCartItems;

/**
 * Lưu giỏ hàng vào localStorage cho tài khoản hiện tại và cập nhật badge
 */
function saveCartItems(items) {
  try {
    const key = getCartStorageKey();
    localStorage.setItem(key, JSON.stringify(items));
    updateCartBadge();
  } catch (e) {
    console.error('Lỗi lưu giỏ hàng:', e);
  }
}
window.saveCartItems = saveCartItems;

/**
 * Cập nhật số lượng trên icon giỏ hàng ở Header theo tài khoản hiện tại
 */
function updateCartBadge() {
  const items = getCartItems();
  const totalCount = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);
  const badgeEl = document.getElementById('cart-count');
  if (badgeEl) {
    badgeEl.textContent = totalCount;
  }
}
window.updateCartBadge = updateCartBadge;

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
      colors.map(c => {
        const hex = getColorHex(c.color);
        const isGradient = hex.includes('gradient');
        const bgProp = isGradient ? `background: ${hex};` : `background-color: ${hex};`;
        const borderProp = (hex === '#FFFFFF' || hex.toLowerCase() === '#faf6ee' || hex.toLowerCase() === '#fdfbf9') ? 'border: 1px solid #d1c7bc;' : '';
        return `<span class="color-swatch-dot" style="${bgProp} ${borderProp}" title="${escapeHtml(c.color)}"></span>`;
      }).join('') + 
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
            ${colors.map(c => {
              const hex = getColorHex(c.color);
              const isGradient = hex.includes('gradient');
              const bgProp = isGradient ? `background: ${hex};` : `background-color: ${hex};`;
              const borderProp = (hex === '#FFFFFF' || hex.toLowerCase() === '#faf6ee' || hex.toLowerCase() === '#fdfbf9') ? 'border: 1px solid #d1c7bc;' : '';
              return `
              <button type="button" class="variant-color-dot" 
                      style="${bgProp} ${borderProp}" 
                      title="${escapeHtml(c.color)}"
                      data-color="${escapeHtml(c.color)}"
                      onclick="selectCardVariantColor(${product.id}, '${escapeHtml(c.color)}', this, event)">
              </button>
              `;
            }).join('')}
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
    showToast('Đã đăng xuất tài khoản thành công! Đang chuyển về trang đăng nhập...', 'info');
    
    // Luôn điều hướng về trang đăng nhập sau khi đăng xuất
    setTimeout(() => {
      window.location.href = 'dang-nhap.html';
    }, 300);
  },

  isAdmin() {
    const user = this.getCurrentUser();
    return !!(user && (user.role === 'admin' || user.username === 'admin'));
  },

  // Biểu thức chính quy kiểm tra định dạng email tiêu chuẩn
  isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  },

  login(email, password) {
    if (!email || !password) {
      return { success: false, message: 'Vui lòng nhập đầy đủ Email và Mật khẩu!' };
    }
    const cleanEmail = email.trim();
    
    // BẮT BUỘC ĐÚNG ĐỊNH DẠNG EMAIL
    if (!this.isValidEmail(cleanEmail)) {
      return { success: false, message: 'Vui lòng nhập đúng cấu trúc địa chỉ email (ví dụ: example@gmail.com)!' };
    }

    // CHỈ CHO PHÉP ĐĂNG NHẬP BẰNG ĐÚNG CHUẨN EMAIL (Phân biệt chữ hoa / chữ thường chính xác theo tài khoản đã đăng ký)
    const users = window.dbManager.query(
      "SELECT * FROM users WHERE email = ? AND password = ?",
      [cleanEmail, password]
    );

    if (users && users.length > 0) {
      // Đảm bảo so khớp chính xác từng ký tự chữ hoa/thường (case-sensitive) trong JavaScript
      const matchedUser = users.find(u => u.email === cleanEmail && u.password === password);
      if (matchedUser) {
        return { success: true, user: matchedUser };
      }
    }
    return { success: false, message: 'Email hoặc mật khẩu không chính xác!' };
  },

  register({ username, password, fullName, email, phone }) {
    if (!password || !fullName || !email || !phone) {
      return { success: false, message: 'Vui lòng điền đầy đủ các trường thông tin bắt buộc (bao gồm Số điện thoại)!' };
    }
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      return { success: false, message: 'Vui lòng nhập Số điện thoại!' };
    }
    const cleanPhoneDigits = cleanPhone.replace(/[\s.-]/g, '');
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!phoneRegex.test(cleanPhoneDigits)) {
      return { success: false, message: 'Số điện thoại không đúng định dạng (ví dụ: 0912345678)!' };
    }

    const rawEmail = email.trim();
    const mailNormalized = rawEmail.toLowerCase();

    // BẮT BUỘC ĐÚNG ĐỊNH DẠNG EMAIL
    if (!this.isValidEmail(mailNormalized)) {
      return { success: false, message: 'Địa chỉ Email không đúng cấu trúc (ví dụ: name@example.com)!' };
    }

    let uName = (username || mailNormalized.split('@')[0]).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!uName) uName = 'user' + Math.floor(Math.random() * 10000);

    if (password.length < 6) {
      return { success: false, message: 'Mật khẩu phải có độ dài tối thiểu từ 6 ký tự trở lên!' };
    }

    // Kiểm tra trùng email (so sánh không phân biệt hoa thường)
    const existingEmail = window.dbManager.query(
      "SELECT * FROM users WHERE LOWER(email) = ?",
      [mailNormalized]
    );
    if (existingEmail && existingEmail.length > 0) {
      return { success: false, message: 'Email này đã được sử dụng, vui lòng chọn email khác hoặc Đăng nhập!' };
    }

    // Đảm bảo username không trùng lặp
    let finalUName = uName;
    const existingUName = window.dbManager.query(
      "SELECT * FROM users WHERE LOWER(username) = ?",
      [finalUName]
    );
    if (existingUName && existingUName.length > 0) {
      finalUName = `${uName}_${Math.floor(Math.random() * 10000)}`;
    }

    // LƯU NGUYÊN BẢN CHỮ HOA / CHỮ THƯỜNG CỦA EMAIL (rawEmail)
    const ok = window.dbManager.run(
      "INSERT INTO users (username, password, full_name, email, phone, role) VALUES (?, ?, ?, ?, ?, 'customer')",
      [finalUName, password, fullName.trim(), rawEmail, cleanPhone]
    );

    if (ok) {
      const created = window.dbManager.query("SELECT * FROM users WHERE email = ?", [rawEmail]);
      return { success: true, user: created[0] };
    }
    return { success: false, message: 'Có lỗi xảy ra khi lưu vào cơ sở dữ liệu, vui lòng thử lại!' };
  }
};

/**
 * Cập nhật giao diện người dùng trên Header (Nút Đăng nhập / Menu Tài khoản)
 */
window.updateAuthUI = function() {
  const user = window.Auth.getCurrentUser();
  const userBtn = document.getElementById('header-user-btn');
  const userMenuDropdown = document.getElementById('user-dropdown-menu');

  // Luôn cập nhật lại số lượng giỏ hàng tương ứng với tài khoản hiện tại
  updateCartBadge();

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
          <a href="dang-ky.html" class="user-dropdown-item">
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

// Lắng nghe sự kiện storage để đồng bộ giỏ hàng và trạng thái tài khoản tức thì giữa các tab
window.addEventListener('storage', (e) => {
  if (e.key === 'henni_current_user' || (e.key && e.key.startsWith('henni_cart_'))) {
    if (typeof updateCartBadge === 'function') updateCartBadge();
    if (typeof window.updateAuthUI === 'function') window.updateAuthUI();
    if (typeof renderCartPage === 'function' && document.getElementById('cart-items-list')) {
      renderCartPage();
    }
  }
});

