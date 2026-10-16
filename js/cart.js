/**
 * js/cart.js - Logic dành cho Giỏ Hàng & Thanh Toán (gio-hang.html)
 * Quản lý Danh sách món hàng, Tiến trình Freeship 800k, Lưu Đơn hàng vào SQLite
 */

const FREESHIP_THRESHOLD = 800000;
const STANDARD_SHIPPING_FEE = 30000;

document.addEventListener('DOMContentLoaded', () => {
  renderCartPage();

  window.dbManager.onReady(() => {
    // Database sẵn sàng để lưu đơn hàng
    console.log('Database sẵn sàng cho thanh toán.');
  });
});

/**
 * Hiển thị toàn bộ trang Giỏ hàng & Thanh toán
 */
function renderCartPage() {
  const cartItems = getCartItems();
  const itemsContainer = document.getElementById('cart-items-list');
  const emptyState = document.getElementById('cart-empty-state');
  const checkoutContent = document.getElementById('cart-checkout-content');
  const freeshipMeter = document.getElementById('freeship-meter-card');

  if (!itemsContainer || !emptyState || !checkoutContent) return;

  if (cartItems.length === 0) {
    emptyState.classList.remove('hidden');
    checkoutContent.classList.add('hidden');
    if (freeshipMeter) freeshipMeter.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  checkoutContent.classList.remove('hidden');
  if (freeshipMeter) freeshipMeter.classList.remove('hidden');

  // 1. Render từng món hàng trong giỏ
  itemsContainer.innerHTML = cartItems.map((item, idx) => `
    <div class="cart-item-row" data-index="${idx}">
      <img class="cart-item-thumb" src="${item.image || 'images/logo.png'}" alt="${escapeHtml(item.name)}">
      <div class="cart-item-info">
        <a href="chi-tiet.html?slug=${encodeURIComponent(item.slug || '')}" class="cart-item-name">
          ${escapeHtml(item.name)}
        </a>
        <div class="cart-item-meta">
          Màu: <strong>${escapeHtml(item.color)}</strong> &bull; Size: <strong>${escapeHtml(item.size)}</strong>
        </div>
        <div class="cart-item-price">${formatCurrency(item.price)}</div>
      </div>
      <div class="quantity-stepper">
        <button type="button" class="qty-btn" onclick="updateItemQuantity(${idx}, -1)">-</button>
        <input type="number" class="qty-input" value="${item.quantity}" min="1" max="99" 
               onchange="setItemQuantity(${idx}, this.value)">
        <button type="button" class="qty-btn" onclick="updateItemQuantity(${idx}, 1)">+</button>
      </div>
      <button type="button" class="cart-item-remove-btn" title="Xóa món này" onclick="removeCartItem(${idx})">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
      </button>
    </div>
  `).join('');

  // 2. Tính toán tiền và tiến trình Freeship
  updateOrderCalculations(cartItems);

  // 3. Gắn sự kiện submit form đặt hàng
  initCheckoutForm();
}

/**
 * Cập nhật tính toán tiền và thanh Freeship
 */
function updateOrderCalculations(cartItems) {
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const isFreeShip = subtotal >= FREESHIP_THRESHOLD;
  const shippingFee = isFreeShip ? 0 : STANDARD_SHIPPING_FEE;
  const total = subtotal + shippingFee;

  // Thanh Freeship
  const freeshipFill = document.getElementById('freeship-progress-fill');
  const freeshipText = document.getElementById('freeship-message-text');

  if (freeshipFill && freeshipText) {
    const percent = Math.min(100, Math.round((subtotal / FREESHIP_THRESHOLD) * 100));
    freeshipFill.style.width = `${percent}%`;

    if (isFreeShip) {
      freeshipFill.classList.add('completed');
      freeshipText.innerHTML = `
        <span style="color: var(--success-color); font-weight: 600;">
          🎉 Bạn đã đủ điều kiện MIỄN PHÍ VẬN CHUYỂN toàn quốc!
        </span>
      `;
    } else {
      freeshipFill.classList.remove('completed');
      const needed = FREESHIP_THRESHOLD - subtotal;
      freeshipText.innerHTML = `
        Mua thêm <strong>${formatCurrency(needed)}</strong> để được <strong>MIỄN PHÍ VẬN CHUYỂN</strong>!
      `;
    }
  }

  // Bảng cộng tiền
  const subtotalEl = document.getElementById('calc-subtotal');
  const shippingEl = document.getElementById('calc-shipping');
  const totalEl = document.getElementById('calc-total');

  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
  if (shippingEl) shippingEl.textContent = shippingFee === 0 ? 'Miễn phí (0₫)' : formatCurrency(shippingFee);
  if (totalEl) totalEl.textContent = formatCurrency(total);
}

/**
 * Tăng / giảm số lượng món hàng
 */
window.updateItemQuantity = function(index, delta) {
  const cart = getCartItems();
  if (!cart[index]) return;

  const newQty = (parseInt(cart[index].quantity) || 1) + delta;
  if (newQty <= 0) {
    removeCartItem(index);
    return;
  }

  cart[index].quantity = newQty;
  saveCartItems(cart);
  renderCartPage();
};

/**
 * Đặt trực tiếp số lượng món hàng
 */
window.setItemQuantity = function(index, value) {
  const cart = getCartItems();
  if (!cart[index]) return;

  let qty = parseInt(value) || 1;
  if (qty < 1) qty = 1;

  cart[index].quantity = qty;
  saveCartItems(cart);
  renderCartPage();
};

/**
 * Xóa một món hàng khỏi giỏ
 */
window.removeCartItem = function(index) {
  const cart = getCartItems();
  if (!cart[index]) return;

  const item = cart[index];
  cart.splice(index, 1);
  saveCartItems(cart);
  showToast(`Đã xóa "${item.name}" khỏi giỏ hàng.`, 'info');
  renderCartPage();
};

/**
 * Sinh mã đơn hàng chuẩn Henni Shop: HN261016-xxxx
 */
function generateOrderCode() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `HN${yy}${mm}${dd}-${randomSuffix}`;
}

/**
 * Khởi tạo form đặt hàng & xử lý ghi vào SQLite
 */
function initCheckoutForm() {
  const form = document.getElementById('checkout-order-form');
  if (!form || form.getAttribute('data-inited') === 'true') return;
  form.setAttribute('data-inited', 'true');

  // Hiển thị/ẩn thông tin chuyển khoản ngân hàng
  const paymentMethods = form.querySelectorAll('input[name="payment_method"]');
  const bankInfoBox = document.getElementById('bank-transfer-info');

  paymentMethods.forEach(radio => {
    radio.addEventListener('change', () => {
      if (bankInfoBox) {
        bankInfoBox.style.display = (radio.value === 'banking') ? 'block' : 'none';
      }
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const cartItems = getCartItems();
    if (cartItems.length === 0) {
      showToast('Giỏ hàng trống!', 'error');
      return;
    }

    if (!window.dbManager || !window.dbManager.isReady) {
      showToast('Cơ sở dữ liệu đang nạp, vui lòng thử lại sau giây lát!', 'error');
      return;
    }

    // Thu thập dữ liệu form
    const fullName = form.querySelector('[name="shipping_full_name"]').value.trim();
    const phone = form.querySelector('[name="shipping_phone"]').value.trim();
    const email = form.querySelector('[name="shipping_email"]').value.trim();
    const address = form.querySelector('[name="shipping_address"]').value.trim();
    const province = form.querySelector('[name="shipping_province"]').value.trim();
    const note = form.querySelector('[name="shipping_note"]').value.trim();
    const paymentMethod = form.querySelector('input[name="payment_method"]:checked')?.value || 'cod';

    if (!fullName || !phone || !email || !address || !province) {
      showToast('Vui lòng điền đầy đủ các thông tin bắt buộc (*)', 'error');
      return;
    }

    // Tính toán
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = (subtotal >= FREESHIP_THRESHOLD) ? 0 : STANDARD_SHIPPING_FEE;
    const total = subtotal + shippingFee;
    const orderCode = generateOrderCode();

    // 1. Lưu vào bảng orders trong SQLite
    const insertOrderSql = `
      INSERT INTO orders (
        code, subtotal, shipping_fee, total, shipping_method, payment_method,
        status, shipping_full_name, shipping_phone, shipping_email,
        shipping_address, shipping_province, shipping_note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const orderSuccess = window.dbManager.run(insertOrderSql, [
      orderCode, subtotal, shippingFee, total, 'standard', paymentMethod,
      'Đang xử lý', fullName, phone, email, address, province, note
    ]);

    if (!orderSuccess) {
      showToast('Có lỗi xảy ra khi lưu đơn hàng vào CSDL!', 'error');
      return;
    }

    // Lấy ID đơn hàng vừa tạo
    const lastOrders = window.dbManager.query('SELECT id FROM orders WHERE code = ?', [orderCode]);
    const orderId = lastOrders.length > 0 ? lastOrders[0].id : 1;

    // 2. Lưu từng sản phẩm vào order_items trong SQLite
    const insertItemSql = `
      INSERT INTO order_items (
        order_id, product_id, product_name, color, size, unit_price, quantity
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    cartItems.forEach(item => {
      window.dbManager.run(insertItemSql, [
        orderId, item.product_id, item.name, item.color, item.size, item.price, item.quantity
      ]);
    });

    // 3. Lưu mã đơn vào lịch sử thiết bị này
    try {
      const recent = JSON.parse(localStorage.getItem('henni_recent_orders') || '[]');
      recent.unshift(orderCode);
      localStorage.setItem('henni_recent_orders', JSON.stringify(recent.slice(0, 10)));
    } catch (err) {}

    // 4. Xóa giỏ hàng
    saveCartItems([]);

    // 5. Mở Modal Chúc Mừng Đặt Hàng Thành Công
    showOrderSuccessModal({
      code: orderCode,
      fullName: fullName,
      phone: phone,
      address: `${address}, ${province}`,
      total: total,
      itemCount: cartItems.length,
      paymentMethod: paymentMethod === 'banking' ? 'Chuyển khoản ngân hàng' : 'Thanh toán khi nhận hàng (COD)'
    });
  });
}

/**
 * Modal chúc mừng đặt hàng thành công
 */
function showOrderSuccessModal(orderData) {
  let modalBackdrop = document.getElementById('order-success-modal');
  if (!modalBackdrop) {
    modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'order-success-modal';
    modalBackdrop.className = 'search-modal-backdrop';
    document.body.appendChild(modalBackdrop);
  }

  modalBackdrop.innerHTML = `
    <div class="search-modal-card" style="padding: 36px 28px; text-align: center; max-width: 540px;">
      <div style="font-size: 3.5rem; margin-bottom: 12px;">🎉</div>
      <h2 style="font-size: 1.6rem; font-weight: 700; margin-bottom: 8px;">ĐẶT HÀNG THÀNH CÔNG!</h2>
      <p class="text-muted" style="margin-bottom: 20px;">
        Cảm ơn bạn đã lựa chọn Henni Shop. Đơn hàng của bạn đã được ghi nhận vào hệ thống.
      </p>

      <div style="background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-light); padding: 18px; text-align: left; margin-bottom: 24px; font-size: 0.9rem; line-height: 1.8;">
        <div>Mã đơn hàng: <strong style="color: var(--price-color); font-size: 1rem;">${orderData.code}</strong></div>
        <div>Người nhận: <strong>${escapeHtml(orderData.fullName)}</strong> (${escapeHtml(orderData.phone)})</div>
        <div>Địa chỉ: <strong>${escapeHtml(orderData.address)}</strong></div>
        <div>Thanh toán: <strong>${orderData.paymentMethod}</strong></div>
        <div style="border-top: 1px dashed var(--border-medium); margin-top: 8px; padding-top: 8px; font-size: 1rem;">
          Tổng thanh toán: <strong style="color: var(--price-color);">${formatCurrency(orderData.total)}</strong>
        </div>
      </div>

      <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
        <a href="don-hang.html?code=${encodeURIComponent(orderData.code)}" class="btn btn-primary">
          Tra cứu đơn hàng
        </a>
        <a href="san-pham.html" class="btn btn-secondary">
          Tiếp tục mua sắm
        </a>
      </div>
    </div>
  `;

  modalBackdrop.classList.add('active');
}
