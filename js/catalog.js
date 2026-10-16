/**
 * js/catalog.js - Logic dành cho Trang Danh mục & Cửa hàng (san-pham.html)
 * Quản lý Bộ lọc Sidebar (Danh mục, Size, Màu, Giá), Sắp xếp & Phân trang SQLite
 */

// Trạng thái bộ lọc hiện tại
const filterState = {
  category: '',
  size: '',
  color: '',
  priceRange: 'all',
  keyword: '',
  sortBy: 'newest',
  currentPage: 1,
  pageSize: 9
};

document.addEventListener('DOMContentLoaded', () => {
  // Lấy giá trị ban đầu từ URL nếu có
  const urlCategory = getUrlParam('category');
  if (urlCategory) filterState.category = urlCategory;

  const urlSearch = getUrlParam('search');
  if (urlSearch) filterState.keyword = urlSearch;

  // Lắng nghe sự kiện người dùng
  initFilterControls();

  // Nạp dữ liệu khi Database đã sẵn sàng
  window.dbManager.onReady(() => {
    loadCategoryFilterOptions();
    applyFiltersAndRender();
  });
});

/**
 * Nạp danh sách danh mục vào Sidebar từ SQLite
 */
function loadCategoryFilterOptions() {
  const container = document.getElementById('category-filter-options');
  if (!container) return;

  const categories = window.dbManager.query(`
    SELECT c.id, c.slug, c.name, COUNT(p.id) as count 
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id
    GROUP BY c.id
    ORDER BY c.id ASC
  `);

  let html = `
    <label class="filter-radio-label">
      <input type="radio" name="filter_cat" value="" ${filterState.category === '' ? 'checked' : ''}>
      <span>Tất cả danh mục</span>
    </label>
  `;

  categories.forEach(cat => {
    const isChecked = filterState.category === cat.slug ? 'checked' : '';
    html += `
      <label class="filter-radio-label">
        <input type="radio" name="filter_cat" value="${escapeHtml(cat.slug)}" ${isChecked}>
        <span>${escapeHtml(cat.name)} (${cat.count})</span>
      </label>
    `;
  });

  container.innerHTML = html;

  // Lắng nghe chọn danh mục
  container.querySelectorAll('input[name="filter_cat"]').forEach(input => {
    input.addEventListener('change', (e) => {
      filterState.category = e.target.value;
      filterState.currentPage = 1;
      applyFiltersAndRender();
    });
  });
}

/**
 * Gán sự kiện cho các điều khiển bộ lọc
 */
function initFilterControls() {
  // 1. Ô tìm kiếm trong sidebar
  const searchInput = document.getElementById('catalog-search-input');
  if (searchInput) {
    if (filterState.keyword) searchInput.value = filterState.keyword;
    searchInput.addEventListener('input', (e) => {
      filterState.keyword = e.target.value.trim();
      filterState.currentPage = 1;
      applyFiltersAndRender();
    });
  }

  // 2. Bộ lọc Kích cỡ (Size Chips)
  const sizeBtns = document.querySelectorAll('.size-chip-btn');
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedSize = btn.getAttribute('data-size');
      if (filterState.size === selectedSize) {
        filterState.size = '';
        btn.classList.remove('active');
      } else {
        sizeBtns.forEach(b => b.classList.remove('active'));
        filterState.size = selectedSize;
        btn.classList.add('active');
      }
      filterState.currentPage = 1;
      applyFiltersAndRender();
    });
  });

  // 3. Bộ lọc Màu sắc (Color Chips)
  const colorRows = document.querySelectorAll('.color-chip-row');
  colorRows.forEach(row => {
    row.addEventListener('click', () => {
      const selectedColor = row.getAttribute('data-color');
      if (filterState.color === selectedColor) {
        filterState.color = '';
        row.classList.remove('active');
      } else {
        colorRows.forEach(r => r.classList.remove('active'));
        filterState.color = selectedColor;
        row.classList.add('active');
      }
      filterState.currentPage = 1;
      applyFiltersAndRender();
    });
  });

  // 4. Bộ lọc Khoảng giá
  const priceRadios = document.querySelectorAll('input[name="filter_price"]');
  priceRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      filterState.priceRange = e.target.value;
      filterState.currentPage = 1;
      applyFiltersAndRender();
    });
  });

  // 5. Dropdown Sắp xếp
  const sortSelect = document.getElementById('catalog-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      filterState.sortBy = e.target.value;
      filterState.currentPage = 1;
      applyFiltersAndRender();
    });
  }

  // 6. Nút Xóa bộ lọc
  const resetBtn = document.getElementById('reset-filters-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetAllFilters);
  }
}

/**
 * Xóa sạch mọi bộ lọc về mặc định
 */
function resetAllFilters() {
  filterState.category = '';
  filterState.size = '';
  filterState.color = '';
  filterState.priceRange = 'all';
  filterState.keyword = '';
  filterState.sortBy = 'newest';
  filterState.currentPage = 1;

  // Reset UI
  const searchInput = document.getElementById('catalog-search-input');
  if (searchInput) searchInput.value = '';

  const catAllRadio = document.querySelector('input[name="filter_cat"][value=""]');
  if (catAllRadio) catAllRadio.checked = true;

  document.querySelectorAll('.size-chip-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.color-chip-row').forEach(r => r.classList.remove('active'));

  const priceAllRadio = document.querySelector('input[name="filter_price"][value="all"]');
  if (priceAllRadio) priceAllRadio.checked = true;

  const sortSelect = document.getElementById('catalog-sort-select');
  if (sortSelect) sortSelect.value = 'newest';

  // Cập nhật lại URL không có params
  window.history.replaceState({}, '', window.location.pathname);

  applyFiltersAndRender();
}

/**
 * Tạo truy vấn SQL động dựa theo filterState và kết xuất danh sách sản phẩm
 */
function applyFiltersAndRender() {
  const grid = document.getElementById('catalog-products-grid');
  const countEl = document.getElementById('catalog-product-count');
  const paginationEl = document.getElementById('catalog-pagination');
  if (!grid) return;

  let sql = `
    SELECT DISTINCT p.* 
    FROM products p
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_sizes ps ON ps.product_id = p.id
    LEFT JOIN product_colors pc ON pc.product_id = p.id
    WHERE 1=1
  `;
  const params = [];

  // Lọc theo Danh mục
  if (filterState.category) {
    sql += ` AND c.slug = ?`;
    params.push(filterState.category);
  }

  // Lọc theo Kích thước
  if (filterState.size) {
    sql += ` AND ps.size = ?`;
    params.push(filterState.size);
  }

  // Lọc theo Màu sắc
  if (filterState.color) {
    sql += ` AND pc.color LIKE ?`;
    params.push(`%${filterState.color}%`);
  }

  // Lọc theo Khoảng giá
  if (filterState.priceRange === 'under300') {
    sql += ` AND COALESCE(p.sale_price, p.base_price) < 300000`;
  } else if (filterState.priceRange === '300to500') {
    sql += ` AND COALESCE(p.sale_price, p.base_price) >= 300000 AND COALESCE(p.sale_price, p.base_price) <= 500000`;
  } else if (filterState.priceRange === 'above500') {
    sql += ` AND COALESCE(p.sale_price, p.base_price) > 500000`;
  }

  // Lọc theo Từ khóa tìm kiếm
  if (filterState.keyword) {
    sql += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
    params.push(`%${filterState.keyword}%`, `%${filterState.keyword}%`);
  }

  // Sắp xếp
  switch (filterState.sortBy) {
    case 'price_asc':
      sql += ` ORDER BY COALESCE(p.sale_price, p.base_price) ASC`;
      break;
    case 'price_desc':
      sql += ` ORDER BY COALESCE(p.sale_price, p.base_price) DESC`;
      break;
    case 'name_asc':
      sql += ` ORDER BY p.name ASC`;
      break;
    case 'newest':
    default:
      sql += ` ORDER BY p.id DESC`;
      break;
  }

  const allFiltered = window.dbManager.query(sql, params);
  const totalCount = allFiltered.length;

  if (countEl) {
    countEl.textContent = `Hiển thị ${totalCount} sản phẩm`;
  }

  if (totalCount === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">🔍</div>
        <h3 class="empty-state-title">Không tìm thấy sản phẩm phù hợp</h3>
        <p class="text-muted" style="margin-bottom: 20px;">Vui lòng thử điều chỉnh hoặc xóa các tiêu chí bộ lọc.</p>
        <button class="btn btn-primary" onclick="resetAllFilters()">Xóa tất cả bộ lọc</button>
      </div>
    `;
    if (paginationEl) paginationEl.innerHTML = '';
    return;
  }

  // Phân trang
  const totalPages = Math.ceil(totalCount / filterState.pageSize);
  if (filterState.currentPage > totalPages) filterState.currentPage = totalPages;

  const startIndex = (filterState.currentPage - 1) * filterState.pageSize;
  const pageProducts = allFiltered.slice(startIndex, startIndex + filterState.pageSize);

  grid.innerHTML = pageProducts.map(prod => createProductCardHtml(prod)).join('');

  renderPagination(totalPages, paginationEl);
}

/**
 * Hiển thị nút phân trang
 */
function renderPagination(totalPages, container) {
  if (!container || totalPages <= 1) {
    if (container) container.innerHTML = '';
    return;
  }

  let html = '';

  // Nút Prev
  if (filterState.currentPage > 1) {
    html += `<button class="page-btn" onclick="goToPage(${filterState.currentPage - 1})">&laquo;</button>`;
  }

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button class="page-btn ${i === filterState.currentPage ? 'active' : ''}" onclick="goToPage(${i})">
        ${i}
      </button>
    `;
  }

  // Nút Next
  if (filterState.currentPage < totalPages) {
    html += `<button class="page-btn" onclick="goToPage(${filterState.currentPage + 1})">&raquo;</button>`;
  }

  container.innerHTML = html;
}

/**
 * Chuyển trang
 */
window.goToPage = function(page) {
  filterState.currentPage = page;
  applyFiltersAndRender();
  window.scrollTo({ top: 180, behavior: 'smooth' });
};
window.resetAllFilters = resetAllFilters;
