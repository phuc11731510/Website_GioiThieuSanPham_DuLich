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

function getCurrentProductId() {
  try { const sp = new URLSearchParams(location.search); const id = Number(sp.get('id')); if (!Number.isNaN(id)) return id; } catch {}
  try { const last = Number(localStorage.getItem('last_product_id') || ''); if (!Number.isNaN(last)) return last; } catch {}
  return null;
}

async function initProductPage() {
  const host = document.querySelector('[data-product-page]');
  if (!host) return;
  const id = getCurrentProductId();
  const product = id != null ? store.products.find((p) => p.id === id) : store.products[0];
  if (!product) return;

  const elTitle = document.getElementById('pTitle');
  const elPrice = document.getElementById('pPrice');
  if (elTitle) elTitle.textContent = product.title;
  if (elPrice) elPrice.textContent = money(product.price);
  try { document.title = `${product.title} — Chi tiết`; } catch {}

  const hero = document.getElementById('pHero');
  if (hero) {
    hero.innerHTML = isAssetImage(product.img)
      ? `<img src="${product.img}" alt="${product.title}" style="width:100%;height:100%;object-fit:contain;display:block;border-radius:inherit">`
      : `<div class="d-flex align-items-center justify-content-center h-100 w-100 fs-1">${product.img || '🛍️'}</div>`;
  }

  const details = await loadDetails(product.id);

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

document.addEventListener('DOMContentLoaded', () => {
  loadProducts().then(() => {
    try { initProductPage(); } catch {}
  }).finally(() => {
    try {
      const contact = document.querySelector('nav a[href="contact.html"]');
      if (contact) contact.textContent = 'Liên hệ';
    } catch {}
  });
});
