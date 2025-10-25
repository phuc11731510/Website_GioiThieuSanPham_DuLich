const store = {
  products: [],
};

// Helpers
const isAssetImage = (src) => typeof src === 'string' && src.startsWith('assets/');
const money = (n) => (n || 0).toLocaleString('vi-VN') + '\u20ab';

async function loadProducts() {
  try {
    const res = await fetch('assets/data/products.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    store.products = Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('Không tải được products.json', err);
    store.products = [];
  }
}

function renderBadge(tags) {
  if (tags.includes('new')) {
    return '<img src="assets/img/new.png" alt="New" class="sale">';
  }
  if (tags.includes('sale')) {
    return '<img src="assets/img/sale.png" alt="Sale" class="sale">';
  }
  if (tags.includes('hot')) {
    return '<img src="assets/img/hot.png" alt="hot" class="sale">';
  }
}

// Render card sản phẩm (dùng ở nhiều trang)
function productCard(p) {
  let s ;
  if (p.oldprice) {
    s = `<div class="p-oldprice" style="text-decoration: line-through; font-size: 14px;">${money(p.oldprice)}</div>`;
  } else {
    s = " ";
  }
  return `
    <div class="col-6 col-md-4 col-lg-3">
      <div class="p-card h-100" id="card">
        <div class="p-media">
          <a href="#"><img src="${p.img}" alt="${p.title}"></a>
        </div>
        <div class="p-body">
          <h6 class="p-title">${p.title}</h6>
          <div class="p-meta">Danh mục: ${p.cat}</div>
          <div class="p-price">${money(p.price)}</div>
          ${s}
          ${renderBadge(p.tags)}
          <div class="p-actions">
            <button class="btn btn-warning btn-sm" data-qv="${p.id}" data-bs-toggle="modal" data-bs-target="#quickView" style="color: #000;">Xem</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Trang chủ
function initHome() {
  // Swipers
  new Swiper('.hero-swiper', {
    loop: true,
    pagination: { el: '.swiper-pagination' },
    autoplay: { delay: 3500 },
  });
  new Swiper('.brand-swiper', {
    slidesPerView: 2,
    spaceBetween: 12,
    breakpoints: { 576: { slidesPerView: 3 }, 768: { slidesPerView: 4 }, 992: { slidesPerView: 6 } },
    pagination: { el: '.brand-swiper .swiper-pagination' },
  });

  // Tabs render
  const mount = (sel, filter) => {
    const wrap = document.querySelector(sel);
    if (!wrap) return;
    wrap.innerHTML = store.products.filter(filter).slice(0, 8).map(productCard).join('');
  };
  mount('#grid-new', (p) => p.tags.includes('new'));
  mount('#grid-hot', (p) => p.tags.includes('hot'));
  mount('#grid-sale', (p) => p.tags.includes('sale'));

  // Delegation for add & quick view
  document.body.addEventListener('click', (e) => { const btn = e.target.closest('[data-qv]'); if (btn) { const id = Number(btn.getAttribute('data-qv')); if (!Number.isNaN(id)) quickViewAsync(id); } });

  // Countdown 48h
  const end = Date.now() + 48 * 3600 * 1000;
  const out = document.getElementById('clock');
  if (out) {
    setInterval(() => {
      const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      const h = String(Math.floor(s / 3600)).padStart(2, '0');
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      const ss = String(s % 60).padStart(2, '0');
      out.textContent = `${h}:${m}:${ss}`;
    }, 1000);
  }
}

// Danh mục
function initList() {
  const grid = document.getElementById('grid-all');
  if (!grid) return;
  let limit = 8;
  const render = () => {
    const cat = document.getElementById('catSelect').value;
    const max = +document.getElementById('priceRange').value * 1000000;
    const inStock = document.getElementById('inStock').checked;
    const sort = document.getElementById('sortSelect').value;
    let items = store.products.filter((p) => (!cat || p.cat === cat) && p.price <= max);
    // stock giả định: tất cả inStock = true
    if (inStock) items = items;
    if (sort === 'priceAsc') items.sort((a, b) => a.price - b.price);
    if (sort === 'priceDesc') items.sort((a, b) => b.price - a.price);
    grid.innerHTML = items.slice(0, limit).map(productCard).join('');
  };
  render();
  document.getElementById('applyFilter').onclick = render;
  document.getElementById('sortSelect').onchange = render;
  document.getElementById('priceRange').oninput = (e) => {
    document.getElementById('priceLabel').textContent = e.target.value;
  };
  document.getElementById('loadMore').onclick = () => {
    limit += 4;
    render();
  };
  document.body.addEventListener('click', (e) => { const btn = e.target.closest('[data-qv]'); if (btn) { const id = Number(btn.getAttribute('data-qv')); if (!Number.isNaN(id)) quickViewAsync(id); } });
}

// Giỏ hàng
function initCart() {
  const body = document.getElementById('cartBody');
  if (!body) return;
  const render = () => {
    body.innerHTML = store.cart
      .map(
        (item) => `
          <tr>
            <td>${item.title}</td>
            <td>${money(item.price)}</td>
            <td>
              <input
                type="number"
                min="1"
                value="${item.qty}"
                data-qty="${item.id}"
                class="form-control form-control-sm"
                style="width:80px"
              >
            </td>
            <td>${money(item.price * item.qty)}</td>
            <td>
              <button class="btn btn-sm btn-outline-danger" data-remove="${item.id}">X</button>
            </td>
          </tr>
        `,
      )
      .join('');
    document.getElementById('subTotal').textContent = money(
      store.cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    );
    syncCartCount();
  };
  render();
  body.addEventListener('input', (e) => {
    const id = +e.target.getAttribute('data-qty');
    const item = store.cart.find((entry) => entry.id === id);
    if (item) {
      item.qty = Math.max(1, +e.target.value || 1);
      render();
    }
  });
  body.addEventListener('click', (e) => {
    const id = +e.target.getAttribute('data-remove');
    if (id) {
      store.cart = store.cart.filter((entry) => entry.id !== id);
      render();
    }
  });
}

// Add to cart + count
function addToCart(id) {
  const product = store.products.find((entry) => entry.id === id);
  if (!product) return;
  const found = store.cart.find((entry) => entry.id === id);
  if (found) {
    found.qty += 1;
  } else {
    store.cart.push({ ...product, qty: 1 });
  }
  syncCartCount();
  saveCart();
}

function syncCartCount() {
  const total = store.cart.reduce((sum, item) => sum + item.qty, 0);
  const el1 = document.getElementById('cartCount');
  if (el1) el1.textContent = total;
  const el2 = document.getElementById('cartCount2');
  if (el2) el2.textContent = total;
}

function saveCart() {
  localStorage.setItem('etech_cart', JSON.stringify(store.cart));
}

function loadCart() {
  try {
    store.cart = JSON.parse(localStorage.getItem('etech_cart') || '[]');
  } catch {
    store.cart = [];
  }
}

// Tải chi tiết sản phẩm từ file details/{id}.json
async function loadDetails(id) {
  try {
    const res = await fetch(`assets/data/details/${id}.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error(res.statusText);
    return await res.json();
  } catch (e) {
    console.warn('Không tải được details cho id', id, e);
    return null;
  }
}

// Quick View: hiện thông tin nhanh theo id sản phẩm (dùng dữ liệu từ details)
async function quickViewAsync(id) {
  const product = store.products.find((entry) => entry.id === id);
  if (!product) return;
  const body = document.getElementById('qvBody');
  if (!body) return;

  // Khung tạm trong khi chờ tải
  body.innerHTML = `
    <div class="row g-3">
      <div class="col-md-6">
        <div class="qv-media bg-body-secondary rounded-4 d-flex align-items-center justify-content-center">
          ${isAssetImage(product.img)
            ? `<img src="${product.img}" alt="${product.title}" class="qv-img">`
            : `<span class="display-3">${product.img || '🛍️'}</span>`}
        </div>
      </div>
      <div class="col-md-6">
        <h5 class="mb-1">${product.title}</h5>
        <div class="text-danger fw-bold mb-2">${money(product.price)}</div>
        <div class="small text-muted">Đang tải thông tin...</div>
      </div>
    </div>
  `;

  const details = await loadDetails(id);
  if (details) {
    const badges = Array.isArray(details.badges) ? details.badges.slice(0, 4) : [];
    const badgeHtml = badges
      .map((b) => `<span class="badge text-bg-secondary me-1 mb-1">${b}</span>`)
      .join('');

    let specItems = [];
    if (Array.isArray(details.specs)) {
      for (const group of details.specs) {
        if (group && Array.isArray(group.items)) {
          for (const it of group.items) {
            if (it && it.label && it.value) specItems.push(`${it.label}: ${it.value}`);
            if (specItems.length >= 4) break;
          }
        }
        if (specItems.length >= 4) break;
      }
    }
    const specHtml = specItems.length
      ? `<ul class="small mb-0">${specItems.map((s) => `<li>${s}</li>`).join('')}</ul>`
      : (details.overview ? `<p class="small mb-0">${details.overview}</p>` : '');

    body.innerHTML = `
      <div class="row g-3">
        <div class="col-md-6">
          <div class="qv-media bg-body-secondary rounded-4 d-flex align-items-center justify-content-center">
            ${isAssetImage(product.img)
              ? `<img src="${product.img}" alt="${product.title}" class="qv-img">`
              : `<span class="display-3">${product.img || '🛍️'}</span>`}
          </div>
        </div>
        <div class="col-md-6">
          <h5 class="mb-1">${product.title}</h5>
          <div class="mb-2">${badgeHtml}</div>
          <div class="text-danger fw-bold mb-2">${money(product.price)}</div>
          ${specHtml || '<p class="small mb-0">Thông tin đang cập nhật</p>'}
        </div>
      </div>
    `;
  }

  const detailLink = document.querySelector('#quickView .modal-footer a[href="product.html"]');
  if (detailLink) {
    detailLink.href = `product.html?id=${product.id}`;
    try { localStorage.setItem('last_product_id', String(product.id)); } catch (e) {}
  }
}

// Quick view (sáng tạo)
function quickView(id) {
  const product = store.products.find((entry) => entry.id === id);
  if (!product) return;
  const body = document.getElementById('qvBody');
  if (body) {
    body.innerHTML = `
      <div class="row g-3">
        <div class="col-md-6">
          <div class="qv-media bg-body-secondary rounded-4 d-flex align-items-center justify-content-center">
            ${isAssetImage(product.img)
              ? `<img src="${product.img}" alt="${product.title}" class="qv-img">`
              : `<span class="display-3">${product.img || '🛍️'}</span>`}
          </div>
        </div>
        <div class="col-md-6">
          <h5 class="mb-1">${product.title}</h5>
          <div class="text-danger fw-bold mb-2">${money(product.price)}</div>
          <p class="small">CPU i5 / RAM 16GB / SSD 512GB / Màn 15.6" 120Hz (thông số minh họa)</p>
        </div>
      </div>
    `;
    const detailLink = document.querySelector('#quickView .modal-footer a[href="product.html"]');
    if (detailLink) {
      detailLink.href = `product.html?id=${product.id}`;
      try { localStorage.setItem('last_product_id', String(product.id)); } catch (e) {}
    }
  }
}

// Toast helper
function toast(msg) {
  let host = document.querySelector('.toast-fixed');
  if (!host) {
    host = document.createElement('div');
    host.className = 'toast-fixed';
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = 'alert alert-success py-2 px-3 shadow-sm';
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(() => {
    el.remove();
  }, 1800);
}

// Dark mode toggle
function initDark() {
  const btn = document.getElementById('btnDark');
  if (!btn) return;
  const setTheme = (dark) => document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
  let pref = localStorage.getItem('dm') === '1';
  setTheme(pref);
  btn.onclick = () => {
    pref = !pref;
    localStorage.setItem('dm', pref ? '1' : '0');
    setTheme(pref);
  };
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  try { loadCart(); } catch {} 
  try { syncCartCount(); } catch {} 
  try { initDark(); } catch {} 
  (typeof loadProducts === 'function' ? loadProducts() : Promise.resolve())
    .then(() => {
      try { initHome(); } catch {} 
      try { initList(); } catch {} 
      try { initProductPage(); } catch {}
    })
    .finally(() => {
      try { initCart(); } catch {} 
    });
});

// -------- Product detail page ----------
function getCurrentProductId() {
  try {
    const sp = new URLSearchParams(location.search);
    const id = Number(sp.get('id'));
    if (!Number.isNaN(id)) return id;
  } catch {}
  try {
    const last = Number(localStorage.getItem('last_product_id') || '');
    if (!Number.isNaN(last)) return last;
  } catch {}
  return null;
}

async function initProductPage() {
  const host = document.querySelector('[data-product-page]');
  if (!host) return;
  const id = getCurrentProductId();
  const product = id != null ? store.products.find((p) => p.id === id) : store.products[0];
  if (!product) return;

  // Set title, price, rating
  const elTitle = document.getElementById('pTitle');
  const elPrice = document.getElementById('pPrice');
  if (elTitle) elTitle.textContent = product.title;
  if (elPrice) elPrice.textContent = money(product.price);
  try { document.title = `${product.title} — Chi tiết`; } catch {}

  // Media hero
  const hero = document.getElementById('pHero');
  if (hero) {
    hero.innerHTML = isAssetImage(product.img)
      ? `<img src="${product.img}" alt="${product.title}" style="width:100%;height:100%;object-fit:contain;display:block;border-radius:inherit">`
      : `<div class="d-flex align-items-center justify-content-center h-100 w-100 fs-1">${product.img || '🛍️'}</div>`;
  }

  // Load detail json
  const details = await (typeof loadDetails === 'function' ? loadDetails(product.id) : Promise.resolve(null));
  // Stock + rating
  const elStock = document.getElementById('pStock');
  if (elStock) {
    const inStock = details && typeof details.stock === 'boolean' ? details.stock : true;
    elStock.textContent = inStock ? 'Còn hàng' : 'Hết hàng';
    elStock.className = `badge ${inStock ? 'text-bg-success' : 'text-bg-secondary'}`;
  }
  const elRating = document.getElementById('pRating');
  if (elRating) {
    const rating = details && details.rating ? Math.round(details.rating) : 5;
    elRating.textContent = '★★★★★'.slice(0, rating) + '☆☆☆☆☆'.slice(rating);
  }

  // Thumbs
  const thumbs = document.getElementById('pThumbs');
  if (thumbs) {
    const gallery = (details && Array.isArray(details.gallery) && details.gallery.length)
      ? details.gallery
      : (isAssetImage(product.img) ? [product.img, product.img, product.img] : []);
    thumbs.innerHTML = gallery.map((src) => `
      <div class="thumb d-flex align-items-center justify-content-center overflow-hidden">
        ${isAssetImage(src)
          ? `<img src="${src}" alt="thumb" style="width:100%;height:100%;object-fit:cover;display:block">`
          : `<span class="fs-3">${src || ''}</span>`}
      </div>
    `).join('');
  }

  // Specs
  const specList = document.getElementById('specList');
  if (specList) {
    let specs = [];
    if (details && Array.isArray(details.specs)) {
      for (const group of details.specs) {
        if (group && Array.isArray(group.items)) {
          for (const it of group.items) {
            if (it && it.label && it.value) specs.push(`<li>${it.label}: ${it.value}</li>`);
          }
        }
      }
    }
    specList.innerHTML = specs.length ? specs.join('') : '<li>Thông tin đang cập nhật</li>';
  }

  // Promos
  const promoCard = document.getElementById('promoCard');
  const promoList = document.getElementById('promoList');
  if (promoCard && promoList) {
    const promos = details && Array.isArray(details.promos) ? details.promos : [];
    if (promos.length) {
      promoList.innerHTML = promos.map((p) => `<li>${p}</li>`).join('');
      promoCard.classList.remove('d-none');
    } else {
      promoCard.classList.add('d-none');
    }
  }
}




