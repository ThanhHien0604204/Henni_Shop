/**
 * js/home.js - Logic dành cho Trang Chủ (index.html)
 * Quản lý Slider Banner, Danh mục nổi bật & 8 Sản phẩm mới nhất
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeroSlider();

  // Nạp dữ liệu khi Database đã sẵn sàng
  window.dbManager.onReady(() => {
    loadFeaturedCategories();
    loadNewArrivals();
  });
});

/**
 * 1. Khởi tạo Banner Slider
 */
function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  const prevBtn = document.querySelector('.hero-arrow-prev');
  const nextBtn = document.querySelector('.hero-arrow-next');

  if (slides.length === 0) return;

  let currentSlide = 0;
  let slideInterval = null;

  function showSlide(index) {
    slides.forEach((s, i) => {
      s.classList.toggle('active', i === index);
    });
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === index);
    });
    currentSlide = index;
  }

  function nextSlide() {
    let nextIndex = (currentSlide + 1) % slides.length;
    showSlide(nextIndex);
  }

  function prevSlide() {
    let prevIndex = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(prevIndex);
  }

  function startAutoplay() {
    stopAutoplay();
    slideInterval = setInterval(nextSlide, 5500);
  }

  function stopAutoplay() {
    if (slideInterval) clearInterval(slideInterval);
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      startAutoplay();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      startAutoplay();
    });
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showSlide(index);
      startAutoplay();
    });
  });

  const sliderWrapper = document.querySelector('.hero-slider-wrapper');
  if (sliderWrapper) {
    sliderWrapper.addEventListener('mouseenter', stopAutoplay);
    sliderWrapper.addEventListener('mouseleave', startAutoplay);
  }

  startAutoplay();
}

/**
 * 2. Tải 4 Danh mục nổi bật kèm số lượng sản phẩm từ SQLite
 */
function loadFeaturedCategories() {
  const container = document.getElementById('featured-categories-grid');
  if (!container) return;

  const categories = window.dbManager.query(`
    SELECT c.id, c.slug, c.name, COUNT(p.id) as product_count,
           (SELECT pi.url FROM products p2 
            JOIN product_images pi ON pi.product_id = p2.id 
            WHERE p2.category_id = c.id 
            ORDER BY p2.id DESC LIMIT 1) as cover_image
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id
    GROUP BY c.id
    ORDER BY c.id ASC
  `);

  if (!categories || categories.length === 0) {
    container.innerHTML = '<p class="text-muted">Không tìm thấy danh mục.</p>';
    return;
  }

  // Dự phòng ảnh cover đẹp cho từng danh mục
  const defaultCategoryImages = {
    'ao': 'images/ao-sat-nach-co-v-phoi-vien-ren-blue-ribbed-v-neck-tank-top/01.jpg',
    'quan-1': 'images/quan-ong-loe-thun-ren-white-lace-low-waist-pants/01.jpg',
    'chan-vay': 'images/chan-vay-ngan-gau-phoi-ren-white-plain-gauze-mini-skirt/01.jpg',
    'vay': 'images/set-so-mi-dai-stevie-dress-in-light-blue/01.jpg'
  };

  container.innerHTML = categories.map(cat => {
    const imgUrl = cat.cover_image || defaultCategoryImages[cat.slug] || 'images/logo.png';
    return `
      <a href="san-pham.html?category=${encodeURIComponent(cat.slug)}" class="category-card">
        <img class="category-card-img" src="${imgUrl}" alt="${escapeHtml(cat.name)}" loading="lazy">
        <div class="category-card-overlay"></div>
        <div class="category-card-info">
          <h3 class="category-card-name">${escapeHtml(cat.name)}</h3>
          <span class="category-card-count">${cat.product_count} sản phẩm</span>
        </div>
      </a>
    `;
  }).join('');
}

/**
 * 3. Tải 8 Sản phẩm mới nhất từ SQLite
 */
function loadNewArrivals() {
  const container = document.getElementById('new-arrivals-grid');
  if (!container) return;

  const products = window.dbManager.query(`
    SELECT * FROM products ORDER BY id DESC LIMIT 8
  `);

  if (!products || products.length === 0) {
    container.innerHTML = '<p class="text-muted text-center" style="grid-column: 1/-1;">Chưa có sản phẩm nào.</p>';
    return;
  }

  container.innerHTML = products.map(prod => createProductCardHtml(prod)).join('');
}
