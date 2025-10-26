const store = { products: [] };
const isAssetImage = (src) => typeof src === 'string' && src.startsWith('assets/');
const money = (n) => (n || 0).toLocaleString('vi-VN') + '₫';

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

async function loadDetails(id) {
  try {
    const res = await fetch(`assets/data/details/${id}.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error(res.statusText);
    return await res.json();
  } catch (err) {
    console.warn('Không tải được details cho id', id, err);
    return null;
  }
}

function getCurrentProductId() {
  try {
    const id = Number(new URLSearchParams(location.search).get('id'));
    if (!Number.isNaN(id)) return id;
  } catch (e) {}
  try {
    const last = Number(localStorage.getItem('last_product_id') || '');
    if (!Number.isNaN(last)) return last;
  } catch (e) {}
  return null;
}

function createHeroController(heroEl, gallery, title) {
  if (!heroEl) return null;
  heroEl.innerHTML = '';

  const stack = document.createElement('div');
  stack.className = 'hero-stack';
  stack.style.position = 'absolute';
  stack.style.inset = '0';
  stack.style.display = 'flex';
  stack.style.alignItems = 'center';
  stack.style.justifyContent = 'center';

  const layerA = document.createElement('div');
  const layerB = document.createElement('div');
  [layerA, layerB].forEach((layer) => {
    layer.style.position = 'absolute';
    layer.style.inset = '0';
    layer.style.display = 'flex';
    layer.style.alignItems = 'center';
    layer.style.justifyContent = 'center';
    layer.style.transition = 'opacity .35s ease';
    layer.style.opacity = '0';
  });
  layerA.style.opacity = '1';

  stack.appendChild(layerA);
  stack.appendChild(layerB);
  heroEl.appendChild(stack);

  const renderMedia = (layer, src) => {
    layer.innerHTML = '';
    if (isAssetImage(src)) {
      const img = document.createElement('img');
      img.src = src;
      img.alt = title;
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.style.width = 'auto';
      img.style.height = 'auto';
      img.style.display = 'block';
      layer.appendChild(img);
    } else {
      const span = document.createElement('span');
      span.textContent = src || '🛍️';
      span.className = 'fs-1';
      layer.appendChild(span);
    }
  };

  renderMedia(layerA, gallery[0]);
  let active = layerA;
  let idle = layerB;
  let index = 0;
  let timer = null;

  const show = (idx, immediate = false) => {
    const target = (idx + gallery.length) % gallery.length;
    if (!immediate && target === index) return;
    const media = gallery[target];
    if (immediate) {
      renderMedia(active, media);
      index = target;
      return;
    }
    renderMedia(idle, media);
    idle.style.opacity = '1';
    active.style.opacity = '0';
    const finish = () => {
      active.removeEventListener('transitionend', finish);
      const temp = active;
      active = idle;
      idle = temp;
      idle.style.opacity = '0';
      active.style.opacity = '1';
      index = target;
    };
    active.addEventListener('transitionend', finish, { once: true });
  };

  const restartTimer = () => {
    if (timer) clearInterval(timer);
    timer = setInterval(() => show(index + 1), 4000);
  };

  restartTimer();

  return {
    go: (idx) => { show(idx); restartTimer(); },
    showImmediate: (idx) => show(idx, true),
    stop: () => { if (timer) clearInterval(timer); },
  };
}

function renderSpecs(details, specList) {
  if (!specList) return;
  if (!details || !Array.isArray(details.specs)) {
    specList.innerHTML = '<li>Thông tin đang cập nhật</li>';
    return;
  }
  const items = [];
  details.specs.forEach((group) => {
    if (group && Array.isArray(group.items)) {
      group.items.forEach((itm) => {
        if (itm && itm.label && itm.value) {
          items.push(`<li>${itm.label}: ${itm.value}</li>`);
        }
      });
    }
  });
  specList.innerHTML = items.length ? items.join('') : '<li>Thông tin đang cập nhật</li>';
}

function renderPromos(details, card, list) {
  if (!card || !list) return;
  const promos = details && Array.isArray(details.promos) ? details.promos : [];
  if (!promos.length) {
    card.classList.add('d-none');
    list.innerHTML = '';
    return;
  }
  card.classList.remove('d-none');
  list.innerHTML = promos.map((p) => `<li>${p}</li>`).join('');
}

async function initProductPage() {
  const host = document.querySelector('[data-product-page]');
  if (!host) return;

  const id = getCurrentProductId();
  const product = id != null ? store.products.find((p) => p.id === id) : store.products[0];
  if (!product) return;

  document.title = `${product.title} — Chi tiết`;
  const elTitle = document.getElementById('pTitle');
  const elPrice = document.getElementById('pPrice');
  if (elTitle) elTitle.textContent = product.title;
  if (elPrice) elPrice.textContent = money(product.price);

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
    const stars = '★★★★★'.slice(0, rating) + '☆☆☆☆☆'.slice(rating);
    elRating.textContent = stars;
  }

  const heroEl = document.getElementById('pHero');
  const gallery = (details && Array.isArray(details.gallery) && details.gallery.length)
    ? details.gallery
    : (isAssetImage(product.img) ? [product.img] : [product.img || '🛍️']);
  const heroCtrl = createHeroController(heroEl, gallery, product.title);
  if (heroCtrl) heroCtrl.showImmediate(0);

  const thumbs = document.getElementById('pThumbs');
  if (thumbs) {
    thumbs.innerHTML = gallery.map((src, i) => `
      <div class="thumb d-flex align-items-center justify-content-center overflow-hidden" data-idx="${i}">
        ${isAssetImage(src)
          ? `<img src="${src}" alt="thumb ${i + 1}" style="width:100%;height:100%;object-fit:cover;display:block">`
          : `<span class="fs-3">${src || ''}</span>`}
      </div>
    `).join('');

    thumbs.addEventListener('click', (e) => {
      const target = e.target.closest('[data-idx]');
      if (!target || !heroCtrl) return;
      const idx = Number(target.getAttribute('data-idx'));
      if (Number.isNaN(idx)) return;
      heroCtrl.go(idx);
      thumbs.querySelectorAll('[data-idx]').forEach((el) => {
        el.style.outline = el === target ? '2px solid #0d6efd' : 'none';
      });
    });

    const firstThumb = thumbs.querySelector('[data-idx="0"]');
    if (firstThumb) firstThumb.style.outline = '2px solid #0d6efd';
  }

  renderSpecs(details, document.getElementById('specList'));
  renderPromos(details, document.getElementById('promoCard'), document.getElementById('promoList'));
}

function backToTop() {
  const btn = document.getElementById('arrow');
  if (!btn) return;
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  const toggle = () => {
    const visible = document.documentElement.scrollTop > 100 || document.body.scrollTop > 100;
    btn.style.display = visible ? 'block' : 'none';
  };
  window.addEventListener('scroll', toggle);
  toggle();
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts()
    .then(() => initProductPage())
    .then(() => backToTop())
    .catch((err) => console.warn(err))
    .finally(() => {
      const link = document.querySelector('nav a[href="contact.html"]');
      if (link) link.textContent = 'Liên hệ';
    });
});
