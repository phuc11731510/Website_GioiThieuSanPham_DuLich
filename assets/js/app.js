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
      <div class="p-card h-100">
        <div class="p-media">
          <img src="${p.img}" alt="${p.title}">
        </div>
        <div class="p-body">
          <h6 class="p-title">${p.title}</h6>
          <div class="p-meta">Danh mục: ${p.cat}</div>
          <div class="p-price">${money(p.price)}</div>
          ${s}
          ${renderBadge(p.tags)}
          <div class="p-actions">
            <button class="btn btn-warning btn-sm" data-add="${p.id}">Thêm</button>
            <button class="btn btn-ghost btn-sm" data-qv="${p.id}" data-bs-toggle="modal" data-bs-target="#quickView">Xem</button>
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
  document.body.addEventListener('click', (e) => {
    const addId = e.target.getAttribute('data-add');
    const qvId = e.target.getAttribute('data-qv');
    if (addId) {
      addToCart(+addId);
      toast('Đã thêm vào giỏ');
    }
    if (qvId) {
      quickView(+qvId);
    }
  });

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
  document.body.addEventListener('click', (e) => {
    const id = e.target.getAttribute('data-add');
    if (id) {
      addToCart(+id);
      toast('Đã thêm vào giỏ');
    }
  });
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

// Quick view (sáng tạo)
function quickView(id) {
  const product = store.products.find((entry) => entry.id === id);
  if (!product) return;
  const body = document.getElementById('qvBody');
  if (body) {
    body.innerHTML = `
      <div class="row g-3">
        <div class="col-md-6">
          <div class="ratio ratio-4x3 bg-body-secondary rounded-4 d-flex align-items-center justify-content-center fs-1">
            ${product.img}
          </div>
        </div>
        <div class="col-md-6">
          <h5 class="mb-1">${product.title}</h5>
          <div class="text-danger fw-bold mb-2">${money(product.price)}</div>
          <p class="small">CPU i5 / RAM 16GB / SSD 512GB / Màn 15.6" 120Hz (thông số minh họa)</p>
        </div>
      </div>
    `;
    document.getElementById('qvAdd').onclick = () => addToCart(product.id);
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
  loadCart();
  syncCartCount();
  initDark();
  initHome();
  initList();
  initCart();
});
