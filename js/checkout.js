/**
 * js/checkout.js - Logic dành cho Trang Thanh Toán Tách Riêng (thanh-toan.html)
 * Quản lý thông tin giao hàng, tính phí vận chuyển, áp dụng voucher và lưu đơn vào SQLite
 */

const FREESHIP_THRESHOLD = 800000;
const STANDARD_SHIPPING_FEE = 30000;

let appliedDiscount = 0;
let appliedVoucherCode = '';

document.addEventListener('DOMContentLoaded', () => {
  initCheckoutPage();

  window.dbManager.onReady(() => {
    console.log('Database sẵn sàng để lưu đơn hàng.');
  });
});

/**
 * Khởi tạo dữ liệu trang thanh toán
 */
function initCheckoutPage() {
  const cartItems = getCartItems();
  const emptyState = document.getElementById('checkout-empty-state');
  const mainGrid = document.getElementById('checkout-main-grid');
  const itemCountEl = document.getElementById('checkout-item-count');

  if (itemCountEl) itemCountEl.textContent = cartItems.length;

  if (!emptyState || !mainGrid) return;

  if (cartItems.length === 0) {
    emptyState.classList.remove('hidden');
    mainGrid.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  mainGrid.classList.remove('hidden');

  // 1. Điền sẵn thông tin nếu người dùng đã đăng nhập
  prefillUserInfo();

  // 2. Render danh sách sản phẩm tóm tắt bên cột phải
  renderMiniCartList(cartItems);

  // 3. Tính toán các khoản phí
  calculateCheckoutTotals(cartItems);

  // 4. Lắng nghe chọn phương thức thanh toán
  initPaymentMethodToggle();

  // 5. Bắt sự kiện gửi form đặt hàng
  initOrderSubmit();
}

/**
 * Điền sẵn thông tin khách hàng nếu đã đăng nhập
 */
function prefillUserInfo() {
  const currentUser = window.Auth ? window.Auth.getCurrentUser() : null;
  if (!currentUser) return;

  const form = document.getElementById('checkout-order-form');
  if (!form) return;

  const nameInput = form.querySelector('[name="shipping_full_name"]');
  const emailInput = form.querySelector('[name="shipping_email"]');
  const phoneInput = form.querySelector('[name="shipping_phone"]');

  if (nameInput && !nameInput.value) nameInput.value = currentUser.full_name || currentUser.username || '';
  if (emailInput && !emailInput.value) emailInput.value = currentUser.email || '';
  if (phoneInput && !phoneInput.value) phoneInput.value = currentUser.phone || '';
}

/**
 * Render danh sách món hàng tóm tắt
 */
function renderMiniCartList(cartItems) {
  const container = document.getElementById('checkout-items-list');
  if (!container) return;

  container.innerHTML = cartItems.map(item => {
    const hasSize = item.size && item.size !== 'Tiêu chuẩn' && item.size !== 'F';
    const hasColor = item.color && item.color !== 'Tiêu chuẩn';
    const itemTotal = (item.price || 0) * (item.quantity || 1);

    return `
      <div class="checkout-mini-item">
        <div class="checkout-mini-thumb-wrap">
          <img class="checkout-mini-thumb" src="${item.image || 'images/logo.png'}" alt="${escapeHtml(item.name)}">
          <span class="checkout-mini-badge">${item.quantity}</span>
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 600; font-size: 0.88rem; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${escapeHtml(item.name)}
          </div>
          <div style="font-size: 0.78rem; color: #6b7280; margin-top: 2px;">
            ${hasColor ? escapeHtml(item.color) : ''} ${hasSize && hasColor ? '&bull;' : ''} ${hasSize ? 'Size ' + escapeHtml(item.size) : ''}
          </div>
        </div>
        <div style="font-weight: 600; font-size: 0.9rem; color: #111827; text-align: right;">
          ${formatCurrency(itemTotal)}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Tính toán tiền đơn hàng, phí ship & voucher
 */
function calculateCheckoutTotals(cartItems) {
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const isFreeShip = subtotal >= FREESHIP_THRESHOLD;
  const rawShipping = isFreeShip ? 0 : STANDARD_SHIPPING_FEE;
  
  // Nếu áp dụng mã FREESHIP
  const shippingFee = (appliedVoucherCode === 'FREESHIP') ? 0 : rawShipping;

  const total = Math.max(0, subtotal + shippingFee - appliedDiscount);

  // Cập nhật giao diện
  const subtotalEl = document.getElementById('checkout-subtotal');
  const shippingEl = document.getElementById('checkout-shipping-fee');
  const badgeEl = document.getElementById('checkout-shipping-fee-badge');
  const hintEl = document.getElementById('checkout-freeship-hint');
  const finalTotalEl = document.getElementById('checkout-final-total');
  const discountRow = document.getElementById('checkout-discount-row');
  const discountVal = document.getElementById('checkout-discount-val');

  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);

  if (shippingEl) {
    shippingEl.textContent = shippingFee === 0 ? 'Miễn phí (0₫)' : formatCurrency(shippingFee);
    shippingEl.style.color = shippingFee === 0 ? '#16a34a' : '#111827';
  }

  if (badgeEl) {
    badgeEl.textContent = shippingFee === 0 ? 'Miễn phí (0₫)' : formatCurrency(shippingFee);
    badgeEl.style.color = shippingFee === 0 ? '#16a34a' : '#633b2d';
  }

  if (hintEl) {
    hintEl.style.display = isFreeShip ? 'block' : 'none';
  }

  if (discountRow && discountVal) {
    if (appliedDiscount > 0) {
      discountRow.style.display = 'flex';
      discountVal.textContent = `-${formatCurrency(appliedDiscount)}`;
    } else {
      discountRow.style.display = 'none';
    }
  }

  if (finalTotalEl) {
    finalTotalEl.textContent = formatCurrency(total);
  }

  return { subtotal, shippingFee, total };
}

/**
 * Xử lý nhập mã giảm giá
 */
window.applyVoucher = function() {
  const input = document.getElementById('checkout-voucher-input');
  const msgEl = document.getElementById('voucher-message');
  if (!input || !msgEl) return;

  const code = input.value.trim().toUpperCase();
  const cartItems = getCartItems();
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (!code) {
    msgEl.style.display = 'block';
    msgEl.style.color = '#ef4444';
    msgEl.textContent = 'Vui lòng nhập mã giảm giá!';
    return;
  }

  if (code === 'HENNI10') {
    appliedDiscount = Math.round(subtotal * 0.1);
    appliedVoucherCode = code;
    msgEl.style.display = 'block';
    msgEl.style.color = '#16a34a';
    msgEl.textContent = `Áp dụng thành công mã HENNI10: Giảm 10% (${formatCurrency(appliedDiscount)})!`;
  } else if (code === 'HENNI50') {
    appliedDiscount = 50000;
    appliedVoucherCode = code;
    msgEl.style.display = 'block';
    msgEl.style.color = '#16a34a';
    msgEl.textContent = 'Áp dụng thành công mã HENNI50: Giảm 50.000₫!';
  } else if (code === 'FREESHIP') {
    appliedDiscount = 0;
    appliedVoucherCode = code;
    msgEl.style.display = 'block';
    msgEl.style.color = '#16a34a';
    msgEl.textContent = 'Áp dụng thành công mã FREESHIP: Miễn phí vận chuyển!';
  } else {
    appliedDiscount = 0;
    appliedVoucherCode = '';
    msgEl.style.display = 'block';
    msgEl.style.color = '#ef4444';
    msgEl.textContent = 'Mã giảm giá không hợp lệ hoặc đã hết hạn!';
  }

  calculateCheckoutTotals(cartItems);
};

/**
 * Ẩn / hiện thông tin chuyển khoản ngân hàng
 */
function initPaymentMethodToggle() {
  const radios = document.querySelectorAll('input[name="payment_method"]');
  const bankInfo = document.getElementById('checkout-banking-info');

  radios.forEach(r => {
    r.addEventListener('change', () => {
      if (bankInfo) {
        bankInfo.style.display = (r.value === 'banking') ? 'block' : 'none';
      }
    });
  });
}

/**
 * Sinh mã đơn hàng chuẩn Henni Shop: HN261018-xxxx
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
 * Xử lý hoàn tất đặt hàng
 */
function initOrderSubmit() {
  const form = document.getElementById('checkout-order-form');
  if (!form) return;

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

    const fullName = form.querySelector('[name="shipping_full_name"]').value.trim();
    const phone = form.querySelector('[name="shipping_phone"]').value.trim();
    const email = form.querySelector('[name="shipping_email"]').value.trim();
    const address = form.querySelector('[name="shipping_address"]').value.trim();
    const province = form.querySelector('[name="shipping_province"]').value.trim();
    const note = form.querySelector('[name="shipping_note"]').value.trim();
    const paymentMethod = form.querySelector('input[name="payment_method"]:checked')?.value || 'cod';

    if (!fullName) {
      showToast('Vui lòng nhập Họ và tên người nhận!', 'error');
      form.querySelector('[name="shipping_full_name"]').focus();
      return;
    }

    if (!phone) {
      showToast('Vui lòng nhập Số điện thoại!', 'error');
      form.querySelector('[name="shipping_phone"]').focus();
      return;
    }

    const cleanPhoneDigits = phone.replace(/[\s.-]/g, '');
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!phoneRegex.test(cleanPhoneDigits)) {
      showToast('Số điện thoại không đúng định dạng (ví dụ: 0912345678)!', 'error');
      form.querySelector('[name="shipping_phone"]').focus();
      return;
    }

    if (!email || !window.Auth.isValidEmail(email)) {
      showToast('Vui lòng nhập đúng địa chỉ email!', 'error');
      form.querySelector('[name="shipping_email"]').focus();
      return;
    }

    if (!address || !province) {
      showToast('Vui lòng nhập đầy đủ địa chỉ nhận hàng và Tỉnh/Thành phố!', 'error');
      return;
    }

    const { subtotal, shippingFee, total } = calculateCheckoutTotals(cartItems);
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

    // 3. Lưu mã đơn vào lịch sử thiết bị
    try {
      const recent = JSON.parse(localStorage.getItem('henni_recent_orders') || '[]');
      recent.unshift(orderCode);
      localStorage.setItem('henni_recent_orders', JSON.stringify(recent.slice(0, 10)));
    } catch (err) {}

    // 4. Xóa giỏ hàng & cập nhật badge
    saveCartItems([]);

    // 5. Mở Modal Chúc Mừng Đặt Hàng Thành Công
    showOrderSuccessModal({
      code: orderCode,
      fullName: fullName,
      phone: phone,
      address: `${address}, ${province}`,
      total: total,
      itemCount: cartItems.length,
      isBanking: paymentMethod === 'banking',
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
        <div>Mã đơn hàng: <strong style="color: var(--price-color); font-size: 1.05rem;">${orderData.code}</strong></div>
        <div>Người nhận: <strong>${escapeHtml(orderData.fullName)}</strong> (${escapeHtml(orderData.phone)})</div>
        <div>Địa chỉ: <strong>${escapeHtml(orderData.address)}</strong></div>
        <div>Thanh toán: <strong>${orderData.paymentMethod}</strong></div>
        ${orderData.isBanking ? `
        <div style="background: #fdfaf6; border: 1px solid #c4a07c; border-radius: 4px; padding: 10px 14px; margin-top: 10px; font-size: 0.86rem; line-height: 1.7;">
          <div style="font-weight: 700; color: #3b251d;">Thông tin chuyển khoản:</div>
          <div>Ngân hàng: <strong>VietinBank</strong></div>
          <div>Số tài khoản: <strong style="color: #633b2d; font-size: 0.98rem; letter-spacing: 0.05em;">108876868978</strong></div>
          <div>Chủ tài khoản: <strong>SHOP THOI TRANG HENNI</strong></div>
          <div>Nội dung CK: <strong style="color: #dc2626;">${orderData.code}</strong></div>
        </div>
        ` : ''}
        <div style="border-top: 1px dashed var(--border-medium); margin-top: 8px; padding-top: 8px; font-size: 1.05rem;">
          Tổng thanh toán: <strong style="color: #dc2626;">${formatCurrency(orderData.total)}</strong>
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
