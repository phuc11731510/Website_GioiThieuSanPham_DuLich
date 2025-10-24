// E-Tech app.js (UTF-8)
// Products are loaded from assets/data/products.json

const store = {
  products: [],
  cart: [],
};

// Helpers
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

// Card sản phẩm
function productCard(p) {
  const media = isAssetImage(p.img)
    ? `<img src="${p.img}" alt="${p.title}" class="img-fluid w-100 h-100 object-fit-cover">`
    : `<span class="display-5">${p.img || '🛍️'}</span>`;
  const old = p.oldprice ? `<div class="p-oldprice" style="text-decoration:line-through;font-size:14px">${money(p.oldprice)}</div>` : '';
  return `
  <div class="col-6 col-md-4 col-lg-3">
    <div class="p-card h-100">
      <div class="p-media">${media}</div>
      <div class="p-body">
        <h6 class="p-title">${p.title}</h6>
        <div class="p-meta">Danh mục: ${p.cat}</div>
        <div class="p-price">${money(p.price)}</div>
        ${old}
        <img src="assets/img/new.png" alt="badge" class="sale" style="display:${(p.tags||[]).includes('new')?'block':'none'}">
        <div class="p-actions">
          <button class="btn btn-warning btn-sm" data-add="${p.id}">Thêm</button>
          <button class="btn btn-ghost btn-sm" data-qv="${p.id}" data-bs-toggle="modal" data-bs-target="#quickView">Xem</button>
        </div>
      </div>
    </div>
  </div>`;
}

// Trang chủ
function initHome() {
  if (typeof Swiper === 'function') {
    new Swiper('.hero-swiper', { loop: true, pagination: { el: '.swiper-pagination' }, autoplay: { delay: 3500 } });
    new Swiper('.brand-swiper', { slidesPerView: 2, spaceBetween: 12, breakpoints: { 576:{slidesPerView:3}, 768:{slidesPerView:4}, 992:{slidesPerView:6} } });
  }
  const mount = (sel, filter) => {
    const wrap = document.querySelector(sel);
    if (!wrap) return;
    wrap.innerHTML = store.products.filter(filter).slice(0, 8).map(productCard).join('');
  };
  mount('#grid-new', (p) => (p.tags||[]).includes('new'));
  mount('#grid-hot', (p) => (p.tags||[]).includes('hot'));
  mount('#grid-sale', (p) => (p.tags||[]).includes('sale'));

  document.body.addEventListener('click', (e) => {
    const addId = e.target.getAttribute('data-add');
    const qvId = e.target.getAttribute('data-qv');
    if (addId) { addToCart(+addId); toast('Đã thêm vào giỏ'); }
    if (qvId) { quickView(+qvId); }
  });

  // Countdown 48h
  const end = Date.now() + 48 * 3600 * 1000;
  const out = document.getElementById('clock');
  if (out) {
    setInterval(() => {
      const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      const h = String(Math.floor(s / 3600)).padStart(2,'0');
      const m = String(Math.floor((s%3600)/60)).padStart(2,'0');
      const ss = String(s%60).padStart(2,'0');
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
    const max = +document.getElementById('priceRange').value * 1_000_000;
    const inStock = document.getElementById('inStock').checked;
    const sort = document.getElementById('sortSelect').value;
    let items = store.products.filter(p => (!cat || p.cat === cat) && p.price <= max);
    if (inStock) items = items; // placeholder cho tồn kho thật
    if (sort === 'priceAsc') items.sort((a,b)=>a.price-b.price);
    if (sort === 'priceDesc') items.sort((a,b)=>b.price-a.price);
    grid.innerHTML = items.slice(0, limit).map(productCard).join('');
  };
  render();
  document.getElementById('applyFilter').onclick = render;
  document.getElementById('sortSelect').onchange = render;
  document.getElementById('priceRange').oninput = (e)=>{ document.getElementById('priceLabel').textContent = e.target.value; };
  document.getElementById('loadMore').onclick = ()=>{ limit += 4; render(); };
  document.body.addEventListener('click', (e)=>{ const id = e.target.getAttribute('data-add'); if(id){ addToCart(+id); toast('Đã thêm vào giỏ'); } });
}

// Giỏ hàng
function initCart(){
  const body = document.getElementById('cartBody');
  if(!body) return;
  const render = () => {
    body.innerHTML = store.cart.map(item=>`
      <tr>
        <td>${item.title}</td>
        <td>${money(item.price)}</td>
        <td><input type="number" min="1" value="${item.qty}" data-qty="${item.id}" class="form-control form-control-sm" style="width:80px"></td>
        <td>${money(item.price*item.qty)}</td>
        <td><button class="btn btn-sm btn-outline-danger" data-remove="${item.id}">X</button></td>
      </tr>
    `).join('');
    document.getElementById('subTotal').textContent = money(store.cart.reduce((s,i)=>s+i.price*i.qty,0));
    syncCartCount();
  };
  render();
  body.addEventListener('input', e=>{ const id = +e.target.getAttribute('data-qty'); const it = store.cart.find(i=>i.id===id); if(it){ it.qty = Math.max(1, +e.target.value||1); render(); } });
  body.addEventListener('click', e=>{ const id = +e.target.getAttribute('data-remove'); if(id){ store.cart = store.cart.filter(i=>i.id!==id); render(); } });
}

function addToCart(id){
  const p = store.products.find(x=>x.id===id);
  if(!p) return;
  const found = store.cart.find(i=>i.id===id);
  if(found) found.qty += 1; else store.cart.push({...p, qty:1});
  syncCartCount();
  saveCart();
}
function syncCartCount(){
  const n = store.cart.reduce((s,i)=>s+i.qty,0);
  const el1 = document.getElementById('cartCount'); if(el1) el1.textContent = n;
  const el2 = document.getElementById('cartCount2'); if(el2) el2.textContent = n;
}
function saveCart(){ localStorage.setItem('etech_cart', JSON.stringify(store.cart)); }
function loadCart(){ try{ store.cart = JSON.parse(localStorage.getItem('etech_cart')||'[]'); }catch{ store.cart=[]; } }

// Quick view
function quickView(id){
  const p = store.products.find(x=>x.id===id); if(!p) return;
  const body = document.getElementById('qvBody'); if(!body) return;
  const media = isAssetImage(p.img)
    ? `<img src="${p.img}" alt="${p.title}" class="img-fluid rounded-4 w-100 h-100 object-fit-cover">`
    : `<span class="display-3">${p.img || '🛍️'}</span>`;
  body.innerHTML = `
    <div class="row g-3">
      <div class="col-md-6"><div class="ratio ratio-4x3 bg-body-secondary rounded-4 d-flex align-items-center justify-content-center">${media}</div></div>
      <div class="col-md-6">
        <h5 class="mb-1">${p.title}</h5>
        <div class="text-danger fw-bold mb-2">${money(p.price)}</div>
        ${p.oldprice ? `<div class="text-muted text-decoration-line-through small mb-2">${money(p.oldprice)}</div>` : ''}
        <p class="small">CPU i5 / RAM 16GB / SSD 512GB / Màn 15.6" 120Hz (thông số minh họa)</p>
      </div>
    </div>`;
}

// Toast helper
function toast(msg){
  let host = document.querySelector('.toast-fixed');
  if(!host){ host = document.createElement('div'); host.className='toast-fixed'; document.body.appendChild(host); }
  const el = document.createElement('div'); el.className = 'alert alert-success py-2 px-3 shadow-sm'; el.textContent = msg; host.appendChild(el); setTimeout(()=>{ el.remove(); }, 1800);
}

// Dark mode toggle
function initDark(){
  const btn = document.getElementById('btnDark'); if(!btn) return;
  const setTheme = (d)=>document.documentElement.setAttribute('data-bs-theme', d?'dark':'light');
  let pref = localStorage.getItem('dm')==='1'; setTheme(pref);
  btn.onclick = ()=>{ pref=!pref; localStorage.setItem('dm',pref?'1':'0'); setTheme(pref); };
}

// Boot
document.addEventListener('DOMContentLoaded', ()=>{
  loadCart(); syncCartCount(); initDark();
  loadProducts().then(()=>{ initHome(); initList(); });
  initCart();
});
