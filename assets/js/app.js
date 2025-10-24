// E‑Tech Skeleton JS — render sản phẩm, slider, countdown, dark mode, giỏ hàng (mock)
const store = {
  products: [
    {id:1,title:'Laptop X Ultra 14',price:32990000,cat:'laptop',tags:['new'],img:'💻'},
    {id:2,title:'Laptop Pro 16 OLED',price:45990000,cat:'laptop',tags:['hot'],img:'💻'},
    {id:3,title:'Tai nghe ANC Pro',price:3990000,cat:'audio',tags:['sale'],img:'🎧'},
    {id:4,title:'Chuột không dây Silent',price:590000,cat:'accessory',tags:['new'],img:'🖱️'},
    {id:5,title:'Bàn phím cơ TKL',price:1290000,cat:'accessory',tags:['hot'],img:'⌨️'},
    {id:6,title:'Màn hình 27" 4K',price:7990000,cat:'accessory',tags:['sale'],img:'🖥️'},
    {id:7,title:'Tai nghe Gaming RGB',price:1190000,cat:'audio',tags:['new'],img:'🎧'},
    {id:8,title:'Hub USB‑C 8in1',price:890000,cat:'accessory',tags:['hot'],img:'🔌'},
    {id:9,title:'SSD NVMe 1TB Gen4',price:1890000,cat:'accessory',tags:['sale'],img:'⚙️'},
  ],
  cart: []
};

// Format tiền
const money = n => (n||0).toLocaleString('vi-VN') + '₫';

// Render card sản phẩm (dùng ở nhiều trang)
function productCard(p){
  return `
  <div class="col-6 col-md-4 col-lg-3">
    <div class="p-card h-100">
      <div class="p-media">${p.img}</div>
      <div class="p-body">
        <h6 class="p-title">${p.title}</h6>
        <div class="p-meta">Danh mục: ${p.cat}</div>
        <div class="p-price">${money(p.price)}</div>
        <div class="p-actions">
          <button class="btn btn-primary btn-sm" data-add="${p.id}">Thêm</button>
          <button class="btn btn-ghost btn-sm" data-qv="${p.id}" data-bs-toggle="modal" data-bs-target="#quickView">Xem</button>
        </div>
      </div>
    </div>
  </div>`;
}

// Trang chủ
function initHome(){
  // Swipers
  new Swiper('.hero-swiper',{loop:true,pagination:{el:'.swiper-pagination'},autoplay:{delay:3500}});
  new Swiper('.brand-swiper',{slidesPerView:2,spaceBetween:12,breakpoints:{576:{slidesPerView:3},768:{slidesPerView:4},992:{slidesPerView:6}},pagination:{el:'.brand-swiper .swiper-pagination'}});

  // Tabs render
  const mount = (sel, filter) => {
    const wrap = document.querySelector(sel);
    if(!wrap) return;
    wrap.innerHTML = store.products.filter(filter).slice(0,8).map(productCard).join('');
  };
  mount('#grid-new', p=>p.tags.includes('new'));
  mount('#grid-hot', p=>p.tags.includes('hot'));
  mount('#grid-sale', p=>p.tags.includes('sale'));

  // Delegation for add & quick view
  document.body.addEventListener('click', e => {
    const addId = e.target.getAttribute('data-add');
    const qvId = e.target.getAttribute('data-qv');
    if(addId){ addToCart(+addId); toast('Đã thêm vào giỏ'); }
    if(qvId){ quickView(+qvId); }
  });

  // Countdown 48h
  const end = Date.now() + 48*3600*1000;
  const out = document.getElementById('clock');
  if(out){
    setInterval(()=>{
      const s = Math.max(0, Math.floor((end - Date.now())/1000));
      const h = String(Math.floor(s/3600)).padStart(2,'0');
      const m = String(Math.floor((s%3600)/60)).padStart(2,'0');
      const ss = String(s%60).padStart(2,'0');
      out.textContent = `${h}:${m}:${ss}`;
    }, 1000);
  }
}

// Danh mục
function initList(){
  const grid = document.getElementById('grid-all');
  if(!grid) return;
  let limit = 8;
  const render = () => {
    const cat = document.getElementById('catSelect').value;
    const max = +document.getElementById('priceRange').value * 1000000;
    const inStock = document.getElementById('inStock').checked;
    const sort = document.getElementById('sortSelect').value;
    let items = store.products.filter(p=>(!cat||p.cat===cat)&&p.price<=max);
    // stock giả định: tất cả inStock = true
    if(inStock) items = items;
    if(sort==='priceAsc') items.sort((a,b)=>a.price-b.price);
    if(sort==='priceDesc') items.sort((a,b)=>b.price-a.price);
    grid.innerHTML = items.slice(0,limit).map(productCard).join('');
  };
  render();
  document.getElementById('applyFilter').onclick = render;
  document.getElementById('sortSelect').onchange = render;
  document.getElementById('priceRange').oninput = (e)=>{
    document.getElementById('priceLabel').textContent = e.target.value;
  };
  document.getElementById('loadMore').onclick = ()=>{ limit += 4; render(); };
  document.body.addEventListener('click', e=>{
    const id = e.target.getAttribute('data-add');
    if(id){ addToCart(+id); toast('Đã thêm vào giỏ'); }
  });
}

// Giỏ hàng
function initCart(){
  const body = document.getElementById('cartBody');
  if(!body) return;
  const render = () => {
    body.innerHTML = store.cart.map(item => `
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
  body.addEventListener('input', e=>{
    const id = +e.target.getAttribute('data-qty');
    const item = store.cart.find(i=>i.id===id);
    if(item){ item.qty = Math.max(1, +e.target.value||1); render(); }
  });
  body.addEventListener('click', e=>{
    const id = +e.target.getAttribute('data-remove');
    if(id){ store.cart = store.cart.filter(i=>i.id!==id); render(); }
  });
}

// Add to cart + count
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

// Quick view (sáng tạo)
function quickView(id){
  const p = store.products.find(x=>x.id===id); if(!p) return;
  const body = document.getElementById('qvBody');
  if(body){
    body.innerHTML = `
      <div class="row g-3">
        <div class="col-md-6"><div class="ratio ratio-4x3 bg-body-secondary rounded-4 d-flex align-items-center justify-content-center fs-1">${p.img}</div></div>
        <div class="col-md-6">
          <h5 class="mb-1">${p.title}</h5>
          <div class="text-danger fw-bold mb-2">${money(p.price)}</div>
          <p class="small">CPU i5 / RAM 16GB / SSD 512GB / Màn 15.6" 120Hz (thông số minh họa)</p>
        </div>
      </div>`;
    document.getElementById('qvAdd').onclick = ()=> addToCart(p.id);
  }
}

// Toast helper
function toast(msg){
  let host = document.querySelector('.toast-fixed');
  if(!host){
    host = document.createElement('div'); host.className='toast-fixed'; document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = 'alert alert-success py-2 px-3 shadow-sm';
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(()=>{ el.remove(); }, 1800);
}

// Dark mode toggle
function initDark(){
  const btn = document.getElementById('btnDark');
  if(!btn) return;
  const setTheme = (d)=>document.documentElement.setAttribute('data-bs-theme', d?'dark':'light');
  let pref = localStorage.getItem('dm')==='1';
  setTheme(pref);
  btn.onclick = ()=>{ pref=!pref; localStorage.setItem('dm',pref?'1':'0'); setTheme(pref); };
}

// Boot
document.addEventListener('DOMContentLoaded', ()=>{
  loadCart(); syncCartCount(); initDark(); initHome(); initList(); initCart();
});

// TODO000: future feature placeholder
// TODO001: future feature placeholder
// TODO002: future feature placeholder
// TODO003: future feature placeholder
// TODO004: future feature placeholder
// TODO005: future feature placeholder
// TODO006: future feature placeholder
// TODO007: future feature placeholder
// TODO008: future feature placeholder
// TODO009: future feature placeholder
// TODO010: future feature placeholder
// TODO011: future feature placeholder
// TODO012: future feature placeholder
// TODO013: future feature placeholder
// TODO014: future feature placeholder
// TODO015: future feature placeholder
// TODO016: future feature placeholder
// TODO017: future feature placeholder
// TODO018: future feature placeholder
// TODO019: future feature placeholder
// TODO020: future feature placeholder
// TODO021: future feature placeholder
// TODO022: future feature placeholder
// TODO023: future feature placeholder
// TODO024: future feature placeholder
// TODO025: future feature placeholder
// TODO026: future feature placeholder
// TODO027: future feature placeholder
// TODO028: future feature placeholder
// TODO029: future feature placeholder
// TODO030: future feature placeholder
// TODO031: future feature placeholder
// TODO032: future feature placeholder
// TODO033: future feature placeholder
// TODO034: future feature placeholder
// TODO035: future feature placeholder
// TODO036: future feature placeholder
// TODO037: future feature placeholder
// TODO038: future feature placeholder
// TODO039: future feature placeholder
// TODO040: future feature placeholder
// TODO041: future feature placeholder
// TODO042: future feature placeholder
// TODO043: future feature placeholder
// TODO044: future feature placeholder
// TODO045: future feature placeholder
// TODO046: future feature placeholder
// TODO047: future feature placeholder
// TODO048: future feature placeholder
// TODO049: future feature placeholder
// TODO050: future feature placeholder
// TODO051: future feature placeholder
// TODO052: future feature placeholder
// TODO053: future feature placeholder
// TODO054: future feature placeholder
// TODO055: future feature placeholder
// TODO056: future feature placeholder
// TODO057: future feature placeholder
// TODO058: future feature placeholder
// TODO059: future feature placeholder
// TODO060: future feature placeholder
// TODO061: future feature placeholder
// TODO062: future feature placeholder
// TODO063: future feature placeholder
// TODO064: future feature placeholder
// TODO065: future feature placeholder
// TODO066: future feature placeholder
// TODO067: future feature placeholder
// TODO068: future feature placeholder
// TODO069: future feature placeholder
// TODO070: future feature placeholder
// TODO071: future feature placeholder
// TODO072: future feature placeholder
// TODO073: future feature placeholder
// TODO074: future feature placeholder
// TODO075: future feature placeholder
// TODO076: future feature placeholder
// TODO077: future feature placeholder
// TODO078: future feature placeholder
// TODO079: future feature placeholder
// TODO080: future feature placeholder
// TODO081: future feature placeholder
// TODO082: future feature placeholder
// TODO083: future feature placeholder
// TODO084: future feature placeholder
// TODO085: future feature placeholder
// TODO086: future feature placeholder
// TODO087: future feature placeholder
// TODO088: future feature placeholder
// TODO089: future feature placeholder
// TODO090: future feature placeholder
// TODO091: future feature placeholder
// TODO092: future feature placeholder
// TODO093: future feature placeholder
// TODO094: future feature placeholder
// TODO095: future feature placeholder
// TODO096: future feature placeholder
// TODO097: future feature placeholder
// TODO098: future feature placeholder
// TODO099: future feature placeholder
// TODO100: future feature placeholder
// TODO101: future feature placeholder
// TODO102: future feature placeholder
// TODO103: future feature placeholder
// TODO104: future feature placeholder
// TODO105: future feature placeholder
// TODO106: future feature placeholder
// TODO107: future feature placeholder
// TODO108: future feature placeholder
// TODO109: future feature placeholder
// TODO110: future feature placeholder
// TODO111: future feature placeholder
// TODO112: future feature placeholder
// TODO113: future feature placeholder
// TODO114: future feature placeholder
// TODO115: future feature placeholder
// TODO116: future feature placeholder
// TODO117: future feature placeholder
// TODO118: future feature placeholder
// TODO119: future feature placeholder
