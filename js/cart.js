/**
 * js/cart.js - Logic dành cho Trang Giỏ Hàng (gio-hang.html)
 * Thiết kế chuẩn theo giao diện: Thẻ sản phẩm, Thanh tiến trình Freeship, Tóm tắt đơn hàng
 */

const FREESHIP_THRESHOLD = 800000;

document.addEventListener('DOMContentLoaded', () => {
  renderCartPage();
});

/**
 * Hiển thị toàn bộ trang Giỏ hàng
 */
function renderCartPage() {
  const cartItems = getCartItems();
  const itemsContainer = document.getElementById('cart-items-list');
  const emptyState = document.getElementById('cart-empty-state');
  const cartGrid = document.getElementById('cart-page-grid');
  const titleCount = document.getElementById('cart-title-count');

  if (titleCount) {
    titleCount.textContent = `(${cartItems.length})`;
  }

  if (!itemsContainer || !emptyState || !cartGrid) return;

  if (cartItems.length === 0) {
    emptyState.classList.remove('hidden');
    cartGrid.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  cartGrid.classList.remove('hidden');

  // 1. Render từng thẻ sản phẩm theo mẫu thiết kế
  itemsContainer.innerHTML = cartItems.map((item, idx) => {
    const hasSize = item.size && item.size !== 'Tiêu chuẩn' && item.size !== 'F';
    const hasColor = item.color && item.color !== 'Tiêu chuẩn';
    const itemTotal = (item.price || 0) * (item.quantity || 1);

    return `
      <div class="cart-card-item" data-index="${idx}">
        <div class="cart-card-thumb-wrap">
          <a href="chi-tiet.html?slug=${encodeURIComponent(item.slug || '')}">
            <img class="cart-card-thumb-img" src="${item.image || 'images/logo.png'}" alt="${escapeHtml(item.name)}">
          </a>
        </div>
        <div class="cart-card-content">
          <a href="chi-tiet.html?slug=${encodeURIComponent(item.slug || '')}" class="cart-card-name">
            ${escapeHtml(item.name)}
          </a>
          <div class="cart-card-meta">
            ${hasSize ? `<div>Kích thước: <span>${escapeHtml(item.size)}</span></div>` : ''}
            ${hasColor ? `<div>Màu sắc: <span>${escapeHtml(item.color)}</span></div>` : ''}
          </div>
          <div class="cart-qty-control">
            <button type="button" class="cart-qty-btn" onclick="updateItemQuantity(${idx}, -1)" title="Giảm số lượng">&minus;</button>
            <input type="text" class="cart-qty-val" value="${item.quantity}" readonly>
            <button type="button" class="cart-qty-btn" onclick="updateItemQuantity(${idx}, 1)" title="Tăng số lượng">&plus;</button>
          </div>
        </div>
        <button type="button" class="cart-card-remove-btn" onclick="removeCartItem(${idx})" title="Xóa món này">&times;</button>
        <div class="cart-card-price">
          ${formatCurrency(itemTotal)}
        </div>
      </div>
    `;
  }).join('');

  // 2. Cập nhật thanh Freeship & Tóm tắt đơn hàng
  updateCartSummary(cartItems);
}

/**
 * Cập nhật thanh tiến trình Freeship & Bảng Tóm tắt đơn hàng
 */
function updateCartSummary(cartItems) {
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const isFreeShip = subtotal >= FREESHIP_THRESHOLD;

  // Thanh Freeship
  const fillEl = document.getElementById('cart-freeship-bar-fill');
  const msgEl = document.getElementById('cart-freeship-message');
  const subtotalLabel = document.getElementById('cart-freeship-subtotal-label');
  const maxLabel = document.getElementById('cart-freeship-max-label');

  if (subtotalLabel) subtotalLabel.textContent = formatCurrency(subtotal);
  if (maxLabel) maxLabel.textContent = '0₫';

  if (fillEl && msgEl) {
    if (isFreeShip) {
      fillEl.style.width = '100%';
      msgEl.innerHTML = '✓ Bạn được miễn phí vận chuyển';
    } else {
      const needed = FREESHIP_THRESHOLD - subtotal;
      const percent = Math.min(100, Math.max(0, Math.round((subtotal / FREESHIP_THRESHOLD) * 100)));
      fillEl.style.width = `${percent}%`;
      msgEl.innerHTML = `Mua thêm <strong>${formatCurrency(needed)}</strong> để được miễn phí vận chuyển`;
    }
  }

  // Tóm tắt đơn hàng cột phải
  const discount = 0;
  const total = Math.max(0, subtotal - discount);

  const subtotalEl = document.getElementById('cart-summary-subtotal');
  const discountEl = document.getElementById('cart-summary-discount');
  const totalEl = document.getElementById('cart-summary-total');

  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
  if (discountEl) discountEl.textContent = discount > 0 ? `-${formatCurrency(discount)}` : '-0₫';
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
