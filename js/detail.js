/**
 * js/detail.js - Logic dành cho Trang Chi Tiết Sản Phẩm (chi-tiet.html)
 * Quản lý Gallery ảnh, Biến thể Màu/Size, Số lượng, Mua ngay & Sản phẩm tương tự
 */

let currentProduct = null;
let selectedColor = '';
let selectedSize = '';
let quantity = 1;

document.addEventListener('DOMContentLoaded', () => {
  window.dbManager.onReady(() => {
    initProductDetail();
  });
});

/**
 * Khởi tạo dữ liệu chi tiết sản phẩm từ SQLite
 */
function initProductDetail() {
  const slug = getUrlParam('slug');
  if (!slug) {
    // Nếu không có slug, lấy sản phẩm đầu tiên làm mẫu
    const first = window.dbManager.query('SELECT slug FROM products LIMIT 1');
    if (first.length > 0) {
      window.location.replace(`chi-tiet.html?slug=${encodeURIComponent(first[0].slug)}`);
      return;
    }
    showProductNotFound();
    return;
  }

  const products = window.dbManager.query(`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.slug = ?
    LIMIT 1
  `, [slug]);

  if (!products || products.length === 0) {
    showProductNotFound();
    return;
  }

  currentProduct = products[0];

  // Cập nhật tiêu đề trang
  document.title = `${currentProduct.name} - Shop Quần Áo Henni`;

  // Render các thành phần
  renderBreadcrumbs();
  renderProductGallery();
  renderProductInfo();
  loadRelatedProducts();
}

/**
 * Hiển thị màn hình không tìm thấy sản phẩm
 */
function showProductNotFound() {
  const container = document.getElementById('product-detail-container');
  if (!container) return;
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <h2 class="empty-state-title">Sản phẩm không tồn tại hoặc đã ngừng kinh doanh</h2>
      <p class="text-muted" style="margin-bottom: 24px;">Vui lòng tham khảo các mẫu thời trang khác tại cửa hàng.</p>
      <a href="san-pham.html" class="btn btn-primary">Xem tất cả sản phẩm</a>
    </div>
  `;
}

/**
 * Hiển thị đường dẫn Breadcrumbs
 */
function renderBreadcrumbs() {
  const bc = document.getElementById('detail-breadcrumbs');
  if (!bc || !currentProduct) return;

  bc.innerHTML = `
    <a href="index.html">Trang chủ</a>
    <span>/</span>
    <a href="san-pham.html?category=${encodeURIComponent(currentProduct.category_slug)}">${escapeHtml(currentProduct.category_name)}</a>
    <span>/</span>
    <span>${escapeHtml(currentProduct.name)}</span>
  `;
}

/**
 * Render bộ ảnh Gallery
 */
function renderProductGallery() {
  const thumbsContainer = document.getElementById('gallery-thumbs-col');
  const mainImg = document.getElementById('gallery-main-img');
  const mainViewport = document.getElementById('gallery-main-viewport');

  if (!thumbsContainer || !mainImg) return;

  const images = window.dbManager.query(`
    SELECT * FROM product_images 
    WHERE product_id = ? 
    ORDER BY sort_order ASC
  `, [currentProduct.id]);

  if (images.length === 0) {
    mainImg.src = 'images/logo.png';
    thumbsContainer.innerHTML = '';
    return;
  }

  // Đặt ảnh chính là ảnh đầu tiên
  mainImg.src = images[0].url;
  mainImg.alt = currentProduct.name;

  thumbsContainer.innerHTML = images.map((img, idx) => `
    <div class="gallery-thumb-item ${idx === 0 ? 'active' : ''}" data-url="${img.url}">
      <img class="gallery-thumb-img" src="${img.url}" alt="${escapeHtml(currentProduct.name)}">
    </div>
  `).join('');

  // Sự kiện click / hover đổi ảnh
  const thumbItems = thumbsContainer.querySelectorAll('.gallery-thumb-item');
  thumbItems.forEach(item => {
    item.addEventListener('click', () => {
      thumbItems.forEach(t => t.classList.remove('active'));
      item.classList.add('active');
      mainImg.src = item.getAttribute('data-url');
    });
  });

  // Hiệu ứng zoom ảnh khi rê chuột
  if (mainViewport) {
    mainViewport.addEventListener('mousemove', (e) => {
      const rect = mainViewport.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      mainImg.style.transformOrigin = `${x}% ${y}%`;
      mainImg.style.transform = 'scale(1.4)';
    });

    mainViewport.addEventListener('mouseleave', () => {
      mainImg.style.transform = 'scale(1)';
      mainImg.style.transformOrigin = 'center center';
    });
  }
}

/**
 * Render thông tin chi tiết: Giá, Màu sắc, Kích cỡ, Nút Mua
 */
function renderProductInfo() {
  const infoContainer = document.getElementById('detail-info-col');
  if (!infoContainer || !currentProduct) return;

  // Lấy màu sắc
  const colors = window.dbManager.query(`
    SELECT color FROM product_colors WHERE product_id = ?
  `, [currentProduct.id]);
  selectedColor = colors.length > 0 ? colors[0].color : 'Tiêu chuẩn';

  // Lấy kích cỡ
  const sizes = window.dbManager.query(`
    SELECT size FROM product_sizes WHERE product_id = ?
  `, [currentProduct.id]);
  selectedSize = sizes.length > 0 ? sizes[0].size : 'F';

  const priceFormatted = formatCurrency(currentProduct.sale_price || currentProduct.base_price);
  const originalPriceHtml = currentProduct.sale_price 
    ? `<span class="detail-price-original">${formatCurrency(currentProduct.base_price)}</span>` 
    : '';

  // Render màu sắc
  let colorsHtml = '';
  if (colors.length > 0) {
    colorsHtml = `
      <div class="detail-option-group">
        <div class="detail-option-header">
          <span class="detail-option-title">Màu sắc:</span>
          <span class="detail-option-val" id="selected-color-label">${escapeHtml(selectedColor)}</span>
        </div>
        <div class="detail-color-pills" id="detail-color-pills">
          ${colors.map((c, i) => `
            <button type="button" class="color-pill-btn ${i === 0 ? 'active' : ''}" data-color="${escapeHtml(c.color)}">
              <span class="color-swatch-dot" style="background-color: ${getColorHex(c.color)}"></span>
              <span>${escapeHtml(c.color)}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Render kích cỡ
  let sizesHtml = '';
  if (sizes.length > 0) {
    sizesHtml = `
      <div class="detail-option-group">
        <div class="detail-option-header">
          <span class="detail-option-title">Kích thước:</span>
          <span class="detail-option-val" id="selected-size-label">${escapeHtml(selectedSize)}</span>
        </div>
        <div class="detail-size-pills" id="detail-size-pills">
          ${sizes.map((s, i) => `
            <button type="button" class="size-pill-btn ${i === 0 ? 'active' : ''}" data-size="${escapeHtml(s.size)}">
              ${escapeHtml(s.size)}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  infoContainer.innerHTML = `
    <div class="detail-category-tag">
      <a href="san-pham.html?category=${encodeURIComponent(currentProduct.category_slug)}">
        ${escapeHtml(currentProduct.category_name)}
      </a>
    </div>

    <h1 class="detail-product-title">${escapeHtml(currentProduct.name)}</h1>

    <div class="detail-price-box">
      <span class="detail-price-current">${priceFormatted}</span>
      ${originalPriceHtml}
    </div>

    ${colorsHtml}
    ${sizesHtml}

    <div class="detail-option-group">
      <div class="detail-option-header">
        <span class="detail-option-title">Số lượng:</span>
      </div>
      <div style="display: flex; align-items: center; gap: 16px;">
        <div class="quantity-stepper">
          <button type="button" class="qty-btn" id="qty-decrease">-</button>
          <input type="number" class="qty-input" id="qty-input" value="1" min="1" max="99">
          <button type="button" class="qty-btn" id="qty-increase">+</button>
        </div>
        <span class="text-muted" style="font-size: 0.85rem;">Còn hàng trong kho</span>
      </div>
    </div>

    <div class="detail-actions-row">
      <button type="button" class="btn btn-outline btn-lg" id="btn-add-to-cart">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        THÊM VÀO GIỎ HÀNG
      </button>
      <button type="button" class="btn btn-primary btn-lg" id="btn-buy-now">
        MUA NGAY
      </button>
    </div>

    <div style="background: var(--bg-secondary); border-radius: var(--radius-sm); padding: 14px 18px; border: 1px solid var(--border-light); font-size: 0.86rem; display: flex; flex-direction: column; gap: 6px; margin-top: 10px;">
      <div>✨ <strong>Miễn phí vận chuyển</strong> toàn quốc cho đơn hàng từ 800.000₫</div>
      <div>🔄 Đổi trả linh hoạt trong vòng <strong>7 ngày</strong> tận nhà</div>
      <div>⭐ 100% hình ảnh thực tế tự chụp chuẩn phom dáng Henni</div>
    </div>

    <div class="detail-accordion">
      <div class="accordion-item">
        <button type="button" class="accordion-header">
          <span>MÔ TẢ SẢN PHẨM</span>
          <span>&plus;</span>
        </button>
        <div class="accordion-content">
          ${escapeHtml(currentProduct.description || 'Sản phẩm thời trang thiết kế cao cấp độc quyền từ Henni Shop.')}
        </div>
      </div>
      <div class="accordion-item">
        <button type="button" class="accordion-header">
          <span>HƯỚNG DẪN BẢO QUẢN</span>
          <span>&plus;</span>
        </button>
        <div class="accordion-content">
          - Giặt tay hoặc giặt máy chế độ nhẹ với túi giặt.<br>
          - Không sử dụng chất tẩy mạnh làm phai màu vải.<br>
          - Phơi nơi thoáng mát, tránh ánh nắng gắt trực tiếp.<br>
          - Là/ủi ở nhiệt độ trung bình phù hợp với từng chất liệu.
        </div>
      </div>
      <div class="accordion-item">
        <button type="button" class="accordion-header">
          <span>BẢNG THÔNG SỐ CHỌN SIZE</span>
          <span>&plus;</span>
        </button>
        <div class="accordion-content">
          - <strong>Size S:</strong> Chiều cao 1m50 - 1m58, Cân nặng 42kg - 48kg<br>
          - <strong>Size M:</strong> Chiều cao 1m55 - 1m62, Cân nặng 49kg - 54kg<br>
          - <strong>Size L:</strong> Chiều cao 1m58 - 1m68, Cân nặng 55kg - 62kg<br>
          - <strong>Freesize (FS):</strong> Dáng suông thoải mái thích hợp từ 45kg đến 60kg.
        </div>
      </div>
    </div>
  `;

  // Gắn sự kiện chọn màu
  const colorBtns = infoContainer.querySelectorAll('.color-pill-btn');
  const colorLabel = document.getElementById('selected-color-label');
  colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      colorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedColor = btn.getAttribute('data-color');
      if (colorLabel) colorLabel.textContent = selectedColor;
    });
  });

  // Gắn sự kiện chọn size
  const sizeBtns = infoContainer.querySelectorAll('.size-pill-btn');
  const sizeLabel = document.getElementById('selected-size-label');
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSize = btn.getAttribute('data-size');
      if (sizeLabel) sizeLabel.textContent = selectedSize;
    });
  });

  // Số lượng
  const qtyInput = document.getElementById('qty-input');
  const decBtn = document.getElementById('qty-decrease');
  const incBtn = document.getElementById('qty-increase');

  decBtn.addEventListener('click', () => {
    let val = parseInt(qtyInput.value) || 1;
    if (val > 1) {
      qtyInput.value = val - 1;
      quantity = val - 1;
    }
  });

  incBtn.addEventListener('click', () => {
    let val = parseInt(qtyInput.value) || 1;
    qtyInput.value = val + 1;
    quantity = val + 1;
  });

  qtyInput.addEventListener('change', () => {
    let val = parseInt(qtyInput.value) || 1;
    if (val < 1) val = 1;
    qtyInput.value = val;
    quantity = val;
  });

  // Thêm vào giỏ hàng
  document.getElementById('btn-add-to-cart').addEventListener('click', () => {
    addToCartCurrent(false);
  });

  // Mua ngay
  document.getElementById('btn-buy-now').addEventListener('click', () => {
    addToCartCurrent(true);
  });

  // Accordion toggle
  const accHeaders = infoContainer.querySelectorAll('.accordion-header');
  accHeaders.forEach(hdr => {
    hdr.addEventListener('click', () => {
      const content = hdr.nextElementSibling;
      const isVisible = content.style.display === 'block';
      content.style.display = isVisible ? 'none' : 'block';
      hdr.querySelector('span:last-child').textContent = isVisible ? '+' : '−';
    });
  });
}

/**
 * Thêm sản phẩm hiện tại vào giỏ hàng
 */
function addToCartCurrent(redirectCheckout = false) {
  if (!currentProduct) return;

  const images = window.dbManager.query(
    'SELECT url FROM product_images WHERE product_id = ? ORDER BY sort_order ASC LIMIT 1',
    [currentProduct.id]
  );
  const image = images.length > 0 ? images[0].url : 'images/logo.png';

  const cart = getCartItems();
  const existingIndex = cart.findIndex(
    item => item.product_id === currentProduct.id && item.color === selectedColor && item.size === selectedSize
  );

  if (existingIndex > -1) {
    cart[existingIndex].quantity = (parseInt(cart[existingIndex].quantity) || 1) + quantity;
  } else {
    cart.push({
      product_id: currentProduct.id,
      slug: currentProduct.slug,
      name: currentProduct.name,
      price: currentProduct.sale_price ? currentProduct.sale_price : currentProduct.base_price,
      color: selectedColor,
      size: selectedSize,
      image: image,
      quantity: quantity
    });
  }

  saveCartItems(cart);

  if (redirectCheckout) {
    window.location.href = 'gio-hang.html';
  } else {
    showToast(`Đã thêm ${quantity} x "${currentProduct.name}" vào giỏ hàng!`, 'success');
  }
}

/**
 * Tải 4 sản phẩm liên quan cùng danh mục
 */
function loadRelatedProducts() {
  const container = document.getElementById('related-products-grid');
  if (!container || !currentProduct) return;

  const related = window.dbManager.query(`
    SELECT * FROM products 
    WHERE category_id = ? AND id != ? 
    ORDER BY id DESC 
    LIMIT 4
  `, [currentProduct.category_id, currentProduct.id]);

  if (!related || related.length === 0) {
    container.innerHTML = '<p class="text-muted" style="grid-column: 1 / -1;">Không có sản phẩm liên quan.</p>';
    return;
  }

  container.innerHTML = related.map(prod => createProductCardHtml(prod)).join('');
}
