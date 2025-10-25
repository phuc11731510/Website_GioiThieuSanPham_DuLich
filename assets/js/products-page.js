const store = { products: [] };
const isAssetImage = (src) => typeof src === 'string' && src.startsWith('assets/');
const money = (n) => (n || 0).toLocaleString('vi-VN') + '\u20ab';

async function loadProducts() {
  try {
    const res = await fetch('assets/data/products.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    store.products = Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('Không tải được products.json', e);
    store.products = [];
  }
}

function renderBadge(tags) {
  if (tags.includes('new')) return '<img src="assets/img/new.png" alt="New" class="sale">';
  if (tags.includes('sale')) return '<img src="assets/img/sale.png" alt="Sale" class="sale">';
  if (tags.includes('hot')) return '<img src="assets/img/hot.png" alt="hot" class="sale">';
  return '';
}

function productCard(p) {
  const old = p.oldprice
    ? `<div class="p-oldprice" style="text-decoration: line-through; font-size: 14px;">${money(p.oldprice)}</div>`
    : '';
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
          ${old}
          ${renderBadge(p.tags)}
          <div class="p-actions">
            <button class="btn btn-warning btn-sm" data-qv="${p.id}" data-bs-toggle="modal" data-bs-target="#quickView" style="color:#000">Xem</button>
          </div>
        </div>
      </div>
    </div>`;
}

async function loadDetails(id) {
  try {
    const res = await fetch(`assets/data/details/${id}.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error(res.statusText);
    return await res.json();
  } catch (e) {
    console.warn('Không tải details cho id', id, e);
    return null;
  }
}

async function quickViewAsync(id) {
  const product = store.products.find((x) => x.id === id);
  if (!product) return;
  const body = document.getElementById('qvBody');
  if (!body) return;
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
    </div>`;
  const details = await loadDetails(id);
  if (details) {
    const badges = Array.isArray(details.badges) ? details.badges.slice(0, 4) : [];
    const badgeHtml = badges.map((b) => `<span class="badge text-bg-secondary me-1 mb-1">${b}</span>`).join('');
    let specItems = [];
    if (Array.isArray(details.specs)) {
      for (const g of details.specs) {
        if (g && Array.isArray(g.items)) {
          for (const it of g.items) {
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
      </div>`;
  }
  const detailLink = document.querySelector('#quickView .modal-footer a[href="product.html"]');
  if (detailLink) {
    detailLink.href = `product.html?id=${product.id}`;
    try { localStorage.setItem('last_product_id', String(product.id)); } catch {}
  }
}

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
    if (inStock) items = items;
    if (sort === 'priceAsc') items.sort((a, b) => a.price - b.price);
    if (sort === 'priceDesc') items.sort((a, b) => b.price - a.price);
    grid.innerHTML = items.slice(0, limit).map(productCard).join('');
  };
  render();
  document.getElementById('applyFilter').onclick = render;
  document.getElementById('sortSelect').onchange = render;
  document.getElementById('priceRange').oninput = (e) => { document.getElementById('priceLabel').textContent = e.target.value; };
  document.getElementById('loadMore').onclick = () => { limit += 4; render(); };
  document.body.addEventListener('click', (e) => { const btn = e.target.closest('[data-qv]'); if (btn) { const id = Number(btn.getAttribute('data-qv')); if (!Number.isNaN(id)) quickViewAsync(id); } });
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts().then(() => { try { initList(); } catch {} });
});

