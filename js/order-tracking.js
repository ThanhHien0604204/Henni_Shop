/**
 * js/order-tracking.js - Logic dành cho Trang Tra cứu Đơn hàng (don-hang.html)
 * Tra cứu theo mã đơn, hiển thị tiến trình trạng thái & danh sách đơn hàng gần đây
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

  // Kiểm tra mã đơn từ URL
  const urlCode = getUrlParam('code');
  if (urlCode && searchInput) {
    searchInput.value = urlCode;
    searchOrder(urlCode);
  }

  // Tải danh sách đơn hàng gần đây
  loadRecentOrders(recentContainer);

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
 * Tra cứu đơn hàng theo mã trong SQLite
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
 * Tải danh sách đơn hàng đã lưu trên thiết bị
 */
function loadRecentOrders(container) {
  if (!container) return;

  // Lấy đơn hàng từ SQLite
  const allOrders = window.dbManager.query(`
    SELECT * FROM orders ORDER BY id DESC LIMIT 5
  `);

  if (allOrders.length === 0) {
    container.innerHTML = '<p class="text-muted">Chưa có đơn hàng nào được lưu trong hệ thống.</p>';
    return;
  }

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
          ${allOrders.map(o => `
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid var(--border-light); font-weight: 600; color: var(--price-color);">
                ${o.code}
              </td>
              <td style="padding: 10px 14px; border-bottom: 1px solid var(--border-light);">
                ${escapeHtml(o.shipping_full_name)}
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
