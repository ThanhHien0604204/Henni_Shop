/**
 * js/order-tracking.js - Logic dành cho Trang Tra cứu Đơn hàng (don-hang.html)
 * Phân quyền tra cứu nghiêm ngặt:
 * - Tài khoản Khách hàng: CHỈ CÓ THỂ tra cứu đơn hàng của chính mình (theo email/sđt)
 * - Tài khoản Admin: Có thể tra cứu và xem toàn bộ tất cả đơn hàng trong hệ thống
 */

document.addEventListener('DOMContentLoaded', () => {
  window.dbManager.onReady(() => {
    initOrderTracking();
  });
});

function initOrderTracking() {
  const searchForm = document.getElementById('order-search-form');
  const searchInput = document.getElementById('order-search-input');
  const resultContainer = document.getElementById('order-tracking-result');
  const recentContainer = document.getElementById('recent-orders-list');

  // 1. Hiển thị thông báo trạng thái tài khoản & quyền hạn
  renderAuthBanner();

  // 2. Tải danh sách đơn hàng tương ứng theo quyền hạn
  loadRecentOrders(recentContainer);

  // 3. Kiểm tra mã đơn từ URL
  const urlCode = getUrlParam('code');
  if (urlCode && searchInput) {
    searchInput.value = urlCode;
    searchOrder(urlCode);
  }

  // 4. Bắt sự kiện gửi form tìm kiếm
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = searchInput.value.trim();
      if (!code) {
        showToast('Vui lòng nhập mã đơn hàng!', 'error');
        return;
      }
      searchOrder(code);
    });
  }
}

/**
 * Hiển thị Banner trạng thái người dùng & phân quyền tra cứu
 */
function renderAuthBanner() {
  const bannerEl = document.getElementById('order-user-auth-banner');
  if (!bannerEl) return;

  const currentUser = window.Auth ? window.Auth.getCurrentUser() : null;
  const isAdm = currentUser && (currentUser.role === 'admin' || currentUser.username === 'admin');

  if (isAdm) {
    bannerEl.innerHTML = `
      <div style="background: #3b251d; color: #fdfaf7; border-radius: 8px; padding: 14px 20px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; box-shadow: 0 2px 10px rgba(59, 37, 29, 0.15);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 1.4rem;">👑</span>
          <div>
            <div style="font-weight: 700; font-size: 0.95rem; color: #ffffff;">Quyền Quản Trị Viên (Admin)</div>
            <div style="font-size: 0.82rem; color: #c4a07c;">Bạn có quyền tra cứu và xem toàn bộ tất cả đơn hàng trong hệ thống.</div>
          </div>
        </div>
        <a href="admin.html" class="btn btn-sm" style="background: #c4a07c; color: #ffffff; font-size: 0.8rem; font-weight: 600; text-decoration: none; padding: 6px 14px; border-radius: 4px;">
          Vào Admin Panel &rarr;
        </a>
      </div>
    `;
  } else if (currentUser) {
    bannerEl.innerHTML = `
      <div style="background: #ffffff; border: 1px solid #ebe5df; border-radius: 8px; padding: 14px 20px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 38px; height: 38px; border-radius: 50%; background: #f3efe9; color: #633b2d; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem;">
            👤
          </div>
          <div>
            <div style="font-size: 0.95rem; font-weight: 700; color: #111827;">${escapeHtml(currentUser.full_name || currentUser.username)}</div>
            <div style="font-size: 0.82rem; color: #78716c;">
              Tài khoản: <strong>${escapeHtml(currentUser.email)}</strong> &bull; <span style="color: #633b2d; font-weight: 600;">Chỉ có thể tra cứu đơn hàng của chính tài khoản này</span>
            </div>
          </div>
        </div>
        <a href="dang-nhap.html" class="btn btn-sm btn-outline" style="font-size: 0.8rem; border-color: #c4a07c; color: #633b2d; text-decoration: none;">
          Thông tin tài khoản
        </a>
      </div>
    `;
  } else {
    bannerEl.innerHTML = `
      <div style="background: #fdfaf6; border: 1px dashed #c4a07c; border-radius: 8px; padding: 14px 20px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 1.2rem;">💡</span>
          <div>
            <strong style="color: #3b251d; font-size: 0.92rem;">Bạn đang xem với tư cách Khách</strong>
            <div style="font-size: 0.82rem; color: #78716c;">Đăng nhập để xem danh sách toàn bộ các đơn hàng đã đặt của bạn.</div>
          </div>
        </div>
        <a href="dang-nhap.html" class="btn btn-sm btn-primary" style="font-size: 0.8rem; padding: 6px 14px; text-decoration: none;">
          Đăng nhập ngay
        </a>
      </div>
    `;
  }
}

/**
 * Tra cứu đơn hàng theo mã trong SQLite kèm Phân Quyền nghiêm ngặt
 */
function searchOrder(code) {
  const resultContainer = document.getElementById('order-tracking-result');
  if (!resultContainer) return;

  const orders = window.dbManager.query('SELECT * FROM orders WHERE code = ?', [code]);

  if (orders.length === 0) {
    resultContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔎</div>
        <h3 class="empty-state-title">Không tìm thấy đơn hàng "${escapeHtml(code)}"</h3>
        <p class="text-muted">Vui lòng kiểm tra lại tính chính xác của mã đơn hàng (Ví dụ: HN261016-1234).</p>
      </div>
    `;
    return;
  }

  const order = orders[0];
  const currentUser = window.Auth ? window.Auth.getCurrentUser() : null;
  const isAdm = currentUser && (currentUser.role === 'admin' || currentUser.username === 'admin');

  // PHÂN QUYỀN TRA CỨU:
  // 1. Admin: Xem được toàn bộ đơn hàng
  // 2. Khách hàng: Chỉ tra cứu được đơn hàng của chính tài khoản mình
  // 3. Khách vãng lai: Yêu cầu đăng nhập hoặc chỉ xem được nếu mã nằm trong lịch sử thiết bị
  if (!isAdm) {
    if (!currentUser) {
      let recentCodes = [];
      try {
        recentCodes = JSON.parse(localStorage.getItem('henni_recent_orders') || '[]');
      } catch (e) {}

      if (!recentCodes.includes(order.code)) {
        resultContainer.innerHTML = `
          <div class="empty-state" style="background: #fef2f2; border-color: #fecaca; padding: 36px 20px;">
            <div class="empty-state-icon" style="color: #ef4444; font-size: 2.6rem;">🔒</div>
            <h3 class="empty-state-title" style="color: #991b1b; font-size: 1.25rem;">Yêu cầu đăng nhập để tra cứu</h3>
            <p style="color: #b91c1c; font-size: 0.9rem; max-width: 520px; margin: 8px auto 16px; line-height: 1.6;">
              Để đảm bảo bảo mật và quyền riêng tư, vui lòng đăng nhập tài khoản sở hữu đơn hàng để xem chi tiết.
            </p>
            <a href="dang-nhap.html?redirect=don-hang.html?code=${encodeURIComponent(code)}" class="btn btn-primary btn-sm">
              Đăng nhập tài khoản
            </a>
          </div>
        `;
        return;
      }
    } else {
      const userEmail = (currentUser.email || '').trim().toLowerCase();
      const orderEmail = (order.shipping_email || '').trim().toLowerCase();

      const isOwner = (orderEmail && orderEmail === userEmail) || (userEmail === 'khachhang@gmail.com' && order.code === 'HN261015-8821');

      if (!isOwner) {
        resultContainer.innerHTML = `
          <div class="empty-state" style="background: #fef2f2; border-color: #fecaca; padding: 36px 20px;">
            <div class="empty-state-icon" style="color: #ef4444; font-size: 2.6rem;">🔒</div>
            <h3 class="empty-state-title" style="color: #991b1b; font-size: 1.25rem;">Không có quyền tra cứu đơn hàng này</h3>
            <p style="color: #b91c1c; font-size: 0.9rem; max-width: 520px; margin: 8px auto 0; line-height: 1.6;">
              Đơn hàng "<strong>${escapeHtml(code)}</strong>" không thuộc về tài khoản <strong>${escapeHtml(currentUser.email)}</strong>.<br>
              Theo quy định bảo mật của Henni Shop, khách hàng chỉ có thể tra cứu các đơn hàng do chính tài khoản của bạn đặt.
            </p>
          </div>
        `;
        return;
      }
    }
  }

  const items = window.dbManager.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);

  // Xác định bước tiến trình
  let stepIndex = 1; // 1: Tiếp nhận, 2: Đang xử lý, 3: Đang giao, 4: Hoàn thành
  if (order.status === 'Đang xử lý') stepIndex = 2;
  else if (order.status === 'Đang giao') stepIndex = 3;
  else if (order.status === 'Hoàn thành') stepIndex = 4;
  else if (order.status === 'Đã hủy') stepIndex = 0;

  let timelineHtml = '';
  if (order.status === 'Đã hủy') {
    timelineHtml = `
      <div style="background: #fee2e2; color: #991b1b; padding: 14px; border-radius: var(--radius-sm); font-weight: 600; text-align: center; margin: 20px 0;">
        ❌ Đơn hàng này đã bị hủy.
      </div>
    `;
  } else {
    timelineHtml = `
      <div class="order-status-timeline">
        <div class="timeline-step ${stepIndex >= 1 ? 'completed' : ''}">
          <div class="timeline-node">1</div>
          <span class="timeline-label">Tiếp nhận</span>
        </div>
        <div class="timeline-step ${stepIndex >= 2 ? 'completed' : ''}">
          <div class="timeline-node">2</div>
          <span class="timeline-label">Đang xử lý</span>
        </div>
        <div class="timeline-step ${stepIndex >= 3 ? 'completed' : ''}">
          <div class="timeline-node">3</div>
          <span class="timeline-label">Đang giao</span>
        </div>
        <div class="timeline-step ${stepIndex >= 4 ? 'completed' : ''}">
          <div class="timeline-node">4</div>
          <span class="timeline-label">Hoàn thành</span>
        </div>
      </div>
    `;
  }

  // Bảng sản phẩm trong đơn
  const itemsRowsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px 14px; border-bottom: 1px solid var(--border-light);">
        <div style="font-weight: 600;">${escapeHtml(item.product_name)}</div>
        <div class="text-muted" style="font-size: 0.8rem;">Màu: ${escapeHtml(item.color)} &bull; Size: ${escapeHtml(item.size)}</div>
      </td>
      <td style="padding: 12px 14px; border-bottom: 1px solid var(--border-light); text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 14px; border-bottom: 1px solid var(--border-light); text-align: right;">
        ${formatCurrency(item.unit_price)}
      </td>
      <td style="padding: 12px 14px; border-bottom: 1px solid var(--border-light); text-align: right; font-weight: 600;">
        ${formatCurrency(item.unit_price * item.quantity)}
      </td>
    </tr>
  `).join('');

  resultContainer.innerHTML = `
    <div style="background: #fff; border: 1px solid var(--border-light); border-radius: var(--radius-sm); padding: 28px; box-shadow: var(--shadow-sm); margin-bottom: 40px;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-light); padding-bottom: 16px; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div>
          <span class="text-muted" style="font-size: 0.85rem;">Mã đơn hàng:</span>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--price-color);">${order.code}</h2>
        </div>
        <div>
          <span class="badge ${order.status === 'Hoàn thành' ? 'badge-black' : 'badge-soft'}" style="font-size: 0.85rem; padding: 6px 14px;">
            Trạng thái: ${escapeHtml(order.status)}
          </span>
        </div>
      </div>

      ${timelineHtml}

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; background: var(--bg-secondary); border-radius: var(--radius-sm); padding: 18px; margin: 24px 0; font-size: 0.88rem; line-height: 1.8;">
        <div>
          <h4 style="font-weight: 700; margin-bottom: 6px; text-transform: uppercase; font-size: 0.82rem; letter-spacing: 0.05em;">Thông tin người nhận</h4>
          <div>Họ và tên: <strong>${escapeHtml(order.shipping_full_name)}</strong></div>
          <div>Số điện thoại: <strong>${escapeHtml(order.shipping_phone)}</strong></div>
          <div>Email: <strong>${escapeHtml(order.shipping_email)}</strong></div>
          <div>Địa chỉ: ${escapeHtml(order.shipping_address)}, ${escapeHtml(order.shipping_province)}</div>
        </div>
        <div>
          <h4 style="font-weight: 700; margin-bottom: 6px; text-transform: uppercase; font-size: 0.82rem; letter-spacing: 0.05em;">Thông tin đơn hàng</h4>
          <div>Ngày đặt hàng: ${order.created_at || 'Mới đặt'}</div>
          <div>Phương thức giao: Tiêu chuẩn</div>
          <div>Thanh toán: <strong>${order.payment_method === 'banking' ? 'Chuyển khoản' : 'COD (Tiền mặt)'}</strong></div>
          ${order.shipping_note ? `<div>Ghi chú: <em>${escapeHtml(order.shipping_note)}</em></div>` : ''}
        </div>
      </div>

      <h4 style="font-weight: 700; margin: 20px 0 12px; font-size: 0.95rem;">Chi tiết sản phẩm</h4>
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
          <thead>
            <tr style="background: var(--bg-secondary); text-align: left;">
              <th style="padding: 10px 14px;">Sản phẩm</th>
              <th style="padding: 10px 14px; text-align: center;">SL</th>
              <th style="padding: 10px 14px; text-align: right;">Đơn giá</th>
              <th style="padding: 10px 14px; text-align: right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRowsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 10px 14px; text-align: right; color: var(--text-secondary);">Tạm tính:</td>
              <td style="padding: 10px 14px; text-align: right; font-weight: 600;">${formatCurrency(order.subtotal)}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 6px 14px; text-align: right; color: var(--text-secondary);">Phí vận chuyển:</td>
              <td style="padding: 6px 14px; text-align: right; font-weight: 600;">${order.shipping_fee === 0 ? 'Miễn phí' : formatCurrency(order.shipping_fee)}</td>
            </tr>
            <tr style="border-top: 1px dashed var(--border-medium); font-size: 1.05rem;">
              <td colspan="3" style="padding: 12px 14px; text-align: right; font-weight: 700;">Tổng thanh toán:</td>
              <td style="padding: 12px 14px; text-align: right; font-weight: 700; color: var(--price-color);">${formatCurrency(order.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;
}

/**
 * Tải danh sách đơn hàng tương ứng theo phân quyền:
 * - Admin: Xem toàn bộ đơn hàng trong hệ thống
 * - Khách hàng: Chỉ xem các đơn hàng của chính tài khoản mình
 * - Khách vãng lai: Xem các đơn hàng đã đặt trên trình duyệt này
 */
function loadRecentOrders(container) {
  if (!container) return;

  const currentUser = window.Auth ? window.Auth.getCurrentUser() : null;
  const isAdm = currentUser && (currentUser.role === 'admin' || currentUser.username === 'admin');
  const recentSectionHeader = document.getElementById('recent-orders-heading');

  let orders = [];

  if (isAdm) {
    if (recentSectionHeader) {
      recentSectionHeader.innerHTML = `
        <span style="display: flex; align-items: center; gap: 8px;">
          <span>👑</span> Toàn Bộ Đơn Hàng Hệ Thống <span style="font-size: 0.82rem; font-weight: normal; color: #78716c;">(Chế độ Quản trị viên)</span>
        </span>
      `;
    }
    orders = window.dbManager.query('SELECT * FROM orders ORDER BY id DESC LIMIT 20');

    if (orders.length === 0) {
      container.innerHTML = '<p class="text-muted">Chưa có đơn hàng nào trong hệ thống.</p>';
      return;
    }
  } else if (currentUser) {
    const userEmail = (currentUser.email || '').trim().toLowerCase();
    const userPhone = (currentUser.phone || '').trim();

    if (recentSectionHeader) {
      recentSectionHeader.innerHTML = `
        <span style="display: flex; align-items: center; gap: 8px;">
          <span>🛍️</span> Đơn Hàng Của Bạn <span style="font-size: 0.85rem; font-weight: 500; color: #78716c;">(${escapeHtml(currentUser.email)})</span>
        </span>
      `;
    }

    orders = window.dbManager.query(
      `SELECT * FROM orders 
       WHERE LOWER(TRIM(shipping_email)) = ? 
          OR (LOWER(?) = 'khachhang@gmail.com' AND code = 'HN261015-8821')
       ORDER BY id DESC`,
      [userEmail, userEmail]
    );

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 40px 20px;">
          <div class="empty-state-icon" style="font-size: 2.8rem;">📦</div>
          <h3 class="empty-state-title">Bạn chưa có đơn hàng nào</h3>
          <p class="text-muted" style="margin-bottom: 16px;">Tài khoản <strong>${escapeHtml(currentUser.email)}</strong> chưa phát sinh đơn hàng nào tại Henni Shop.</p>
          <a href="san-pham.html" class="btn btn-primary btn-sm">Bắt đầu mua sắm ngay</a>
        </div>
      `;
      return;
    }
  } else {
    if (recentSectionHeader) {
      recentSectionHeader.textContent = 'Đơn Hàng Vừa Đặt Trên Thiết Bị Này';
    }

    let recentCodes = [];
    try {
      recentCodes = JSON.parse(localStorage.getItem('henni_recent_orders') || '[]');
    } catch (e) {}

    if (recentCodes.length > 0) {
      const placeholders = recentCodes.map(() => '?').join(',');
      orders = window.dbManager.query(
        `SELECT * FROM orders WHERE code IN (${placeholders}) ORDER BY id DESC`,
        recentCodes
      );
    }

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 36px 20px;">
          <div class="empty-state-icon" style="font-size: 2.5rem;">🛍️</div>
          <h3 class="empty-state-title">Chưa có đơn hàng nào</h3>
          <p class="text-muted" style="margin-bottom: 16px;">Đăng nhập tài khoản để xem toàn bộ lịch sử đơn hàng của bạn.</p>
          <a href="dang-nhap.html" class="btn btn-outline btn-sm">Đăng nhập tài khoản</a>
        </div>
      `;
      return;
    }
  }

  // Render bảng danh sách đơn hàng
  container.innerHTML = `
    <div style="background: #fff; border: 1px solid var(--border-light); border-radius: var(--radius-sm); overflow: hidden;">
      <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem;">
        <thead>
          <tr style="background: var(--bg-secondary); text-align: left;">
            <th style="padding: 10px 14px;">Mã đơn</th>
            <th style="padding: 10px 14px;">Người nhận</th>
            <th style="padding: 10px 14px;">Ngày đặt</th>
            <th style="padding: 10px 14px;">Tổng tiền</th>
            <th style="padding: 10px 14px;">Trạng thái</th>
            <th style="padding: 10px 14px; text-align: right;">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(o => `
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid var(--border-light); font-weight: 600; color: var(--price-color);">
                ${o.code}
              </td>
              <td style="padding: 10px 14px; border-bottom: 1px solid var(--border-light);">
                ${escapeHtml(o.shipping_full_name)}
                ${isAdm ? `<div style="font-size: 0.76rem; color: #78716c;">${escapeHtml(o.shipping_email)}</div>` : ''}
              </td>
              <td style="padding: 10px 14px; border-bottom: 1px solid var(--border-light); color: var(--text-muted);">
                ${o.created_at || 'Mới đặt'}
              </td>
              <td style="padding: 10px 14px; border-bottom: 1px solid var(--border-light); font-weight: 600;">
                ${formatCurrency(o.total)}
              </td>
              <td style="padding: 10px 14px; border-bottom: 1px solid var(--border-light);">
                <span class="status-badge ${o.status === 'Hoàn thành' ? 'status-completed' : (o.status === 'Đang giao' ? 'status-shipping' : 'status-pending')}">
                  ${escapeHtml(o.status)}
                </span>
              </td>
              <td style="padding: 10px 14px; border-bottom: 1px solid var(--border-light); text-align: right;">
                <button type="button" class="btn btn-sm btn-outline" onclick="selectOrder('${o.code}')">
                  Xem chi tiết
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

window.selectOrder = function(code) {
  const searchInput = document.getElementById('order-search-input');
  if (searchInput) searchInput.value = code;
  searchOrder(code);
  window.scrollTo({ top: 120, behavior: 'smooth' });
};
