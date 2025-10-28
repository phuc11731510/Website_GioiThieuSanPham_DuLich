const store = { products: [], cart: [] };
const isAssetImage = (src) => typeof src === 'string' && src.startsWith('assets/');
const money = (n) => `${(n || 0).toLocaleString('vi-VN')}₫`;

const fetchJson = (url) => $.ajax({ url, dataType: 'json', cache: false });

function loadProducts() {
  return fetchJson('assets/data/products.json')
    .done((data) => {
      store.products = Array.isArray(data) ? data : [];
    })
    .fail((err) => {
      console.warn('Không tải được products.json', err);
      store.products = [];
    });
}

function renderBadge(tags = []) {
  if (tags.includes('new')) return '<img src="assets/img/new.png" alt="New" class="sale">';
  if (tags.includes('sale')) return '<img src="assets/img/sale.png" alt="Sale" class="sale">';
  if (tags.includes('hot')) return '<img src="assets/img/hot.png" alt="Hot" class="sale">';
  return '';
}

function productCard(product) {
  const old = product.oldprice
    ? `<div class="p-oldprice" style="text-decoration: line-through; font-size: 14px;">${money(product.oldprice)}</div>`
    : '';

  return `
    <div class="col-6 col-md-4 col-lg-3">
      <div class="p-card h-100">
        <div class="p-media">
          <img src="${product.img}" alt="${product.title}">
        </div>
        <div class="p-body">
          <h6 class="p-title">${product.title}</h6>
          <div class="p-meta">${product.cat}</div>
          <div class="p-price">${money(product.price)}</div>
          ${old}
          ${renderBadge(product.tags)}
          <div class="p-actions">
            <button class="btn btn-warning btn-sm" data-qv="${product.id}" data-bs-toggle="modal" data-bs-target="#quickView" style="color:#000">Xem</button>
            <button class="btn btn-primary btn-sm btn-add-cart" data-id="${product.id}">Thêm</button>
          </div>
          </div>
        </div>
      </div>
    </div>`;
}

function loadDetails(id) {
  return fetchJson(`assets/data/details/${id}.json`).fail((err) => {
    console.warn('Không tải được details cho id', id, err);
  });
}

function quickViewAsync(id) {
  const product = store.products.find((item) => item.id === id);
  if (!product) return;

  const $body = $('#qvBody');
  if (!$body.length) return;

  const fallback = `<span class="display-3">${product.img || '🛍️'}</span>`;

  $body.html(`
    <div class="row g-3">
      <div class="col-md-6">
        <div class="qv-media bg-body-secondary rounded-4 d-flex align-items-center justify-content-center">
          ${isAssetImage(product.img)
            ? `<img src="${product.img}" alt="${product.title}" class="qv-img">`
            : fallback}
        </div>
      </div>
      <div class="col-md-6">
        <h5 class="mb-1">${product.title}</h5>
        <div class="text-danger fw-bold mb-2">${money(product.price)}</div>
        <div class="small text-muted">Đang tải thông tin...</div>
      </div>
    </div>
  `);

  loadDetails(id).done((details) => {
    if (!details) return;

    const badges = Array.isArray(details.badges) ? details.badges.slice(0, 4) : [];
    const badgeHtml = badges.map((b) => `<span class="badge text-bg-secondary me-1 mb-1">${b}</span>`).join('');

    const specItems = [];
    if (Array.isArray(details.specs)) {
      details.specs.forEach((group) => {
        if (group && Array.isArray(group.items)) {
          group.items.forEach((item) => {
            if (item && item.label && item.value && specItems.length < 4) {
              specItems.push(`${item.label}: ${item.value}`);
            }
          });
        }
      });
    }

    const specHtml = specItems.length
      ? `<ul class="small mb-0">${specItems.map((s) => `<li>${s}</li>`).join('')}</ul>`
      : (details.overview ? `<p class="small mb-0">${details.overview}</p>` : '');

    $body.html(`
      <div class="row g-3">
        <div class="col-md-6">
          <div class="qv-media bg-body-secondary rounded-4 d-flex align-items-center justify-content-center">
            ${isAssetImage(product.img)
              ? `<img src="${product.img}" alt="${product.title}" class="qv-img">`
              : fallback}
          </div>
        </div>
        <div class="col-md-6">
          <h5 class="mb-1">${product.title}</h5>
          <div class="mb-2">${badgeHtml}</div>
          <div class="text-danger fw-bold mb-2">${money(product.price)}</div>
          ${specHtml || '<p class="small mb-0">Thông tin đang cập nhật</p>'}
        </div>
      </div>
    `);
  });

  const $detailLink = $('#quickView .modal-footer a[href="product.html"]');
  if ($detailLink.length) {
    $detailLink.attr('href', `product.html?id=${product.id}`);
    try {
      localStorage.setItem('last_product_id', String(product.id));
    } catch (err) {
      console.warn('Không lưu được last_product_id', err);
    }
  }
}

function initDark() {
  const $btn = $('#btnDark');
  if (!$btn.length) return;

  const setTheme = (dark) => $('html').attr('data-bs-theme', dark ? 'dark' : 'light');
  let pref = localStorage.getItem('dm') === '1';
  setTheme(pref);

  $btn.on('click', () => {
    pref = !pref;
    try {
      localStorage.setItem('dm', pref ? '1' : '0');
    } catch (err) {
      console.warn('Không lưu được thiết lập dark mode', err);
    }
    setTheme(pref);
  });
}

function initHome() {
  if (window.Swiper) {
    new Swiper('.hero-swiper', {
      loop: true,
      pagination: { el: '.swiper-pagination' },
      autoplay: { delay: 3500 },
    });
    new Swiper('.brand-swiper', {
      slidesPerView: 2,
      spaceBetween: 12,
      breakpoints: {
        576: { slidesPerView: 3 },
        768: { slidesPerView: 4 },
        992: { slidesPerView: 6 },
      },
      pagination: { el: '.brand-swiper .swiper-pagination' },
    });
  }

  const mount = (selector, filter) => {
    const $wrap = $(selector);
    if (!$wrap.length) return;
    const html = store.products.filter(filter).slice(0, 8).map(productCard).join('');
    $wrap.html(html);
  };

  mount('#grid-new', (p) => p.tags.includes('new'));
  mount('#grid-hot', (p) => p.tags.includes('hot'));
  mount('#grid-sale', (p) => p.tags.includes('sale'));

  $(document).off('click.quickView').on('click.quickView', '[data-qv]', function (evt) {
    evt.preventDefault();
    const id = Number($(this).data('qv'));
    if (!Number.isNaN(id)) quickViewAsync(id);
  });

  const $clock = $('#clock');
  if ($clock.length) {
    const end = Date.now() + 48 * 3600 * 1000;
    setInterval(() => {
      const seconds = Math.max(0, Math.floor((end - Date.now()) / 1000));
      const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
      const secs = String(seconds % 60).padStart(2, '0');
      $clock.text(`${hours}:${minutes}:${secs}`);
    }, 1000);
  }
}

function initBackToTop() {
  const $btn = $('#arrow');
  if (!$btn.length) return;

  $btn.on('click', (evt) => {
    evt.preventDefault();
    $('html, body').animate({ scrollTop: 0 }, 400);
  });

  const toggle = () => {
    $btn.toggle($(window).scrollTop() > 100);
  };

  $(window).on('scroll.backToTop', toggle);
  toggle();
}

$(function () {
  loadProducts().done(() => {
    try { initHome(); } catch (err) { console.warn(err); }
  });
  try { initDark(); } catch (err) { console.warn(err); }
  try { initBackToTop(); } catch (err) { console.warn(err); }

  try { 
    loadCart();
    initCartEvents();
  } catch (err) { console.warn(err); }
});

function saveCart() {
  try {
    localStorage.setItem('cart', JSON.stringify(store.cart));
  } catch (err) {
    console.warn('Không thể lưu giỏ hàng.', err);
  }
}

function loadCart() {
  try {
    const cartData = localStorage.getItem('cart');
    store.cart = cartData ? JSON.parse(cartData) : [];
  } catch (err) {
    console.warn('Không thể tải giỏ hàng.', err);
    store.cart = [];
  }
  updateCartCount();
}

function updateCartCount() {
  const $cartCount = $('#cart-count');
  if ($cartCount.length) {
    const totalItems = store.cart.reduce((sum, item) => sum + item.quantity, 0);
    $cartCount.text(totalItems);
    $cartCount.toggle(totalItems > 0);
  }
}

function addToCart(productId) {
  const product = store.products.find(p => p.id === productId);
  if (!product) return;
  const existingItem = store.cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    store.cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      img: product.img,
      quantity: 1
    });
  }
  saveCart(); 
  updateCartCount();
}


function initCartEvents() {
  $(document).on('click', '.btn-add-cart', function() {
    const productId = Number($(this).data('id'));
    if (productId) {
      addToCart(productId);
      const $btn = $(this);
      $btn.text('Đã thêm!').prop('disabled', true);
      setTimeout(() => {
        $btn.text('Thêm').prop('disabled', false);
      }, 1000);
    }
  });
}

