const listStore = { products: [], cart: [] };
const listIsAssetImage = (src) => typeof src === 'string' && src.startsWith('assets/');
const listMoney = (n) => `${(n || 0).toLocaleString('vi-VN')}₫`;

const listFetchJson = (url) => $.ajax({ url, dataType: 'json', cache: false });

function loadProductList() {
  return listFetchJson('assets/data/products.json')
    .done((data) => {
      listStore.products = Array.isArray(data) ? data : [];
    })
    .fail((err) => {
      console.warn('Không tải được products.json', err);
      listStore.products = [];
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
    ? `<div class="p-oldprice" style="text-decoration: line-through; font-size: 14px;">${listMoney(product.oldprice)}</div>`
    : '';

  return `
    <div class="col-6 col-md-4 col-lg-4">
      <div class="p-card h-100">
        <div class="p-media">
          <img src="${product.img}" alt="${product.title}">
        </div>
        <div class="p-body">
          <h6 class="p-title">${product.title}</h6>
          <div class="p-meta">Danh mục: ${product.cat}</div>
          <div class="p-price">${listMoney(product.price)}</div>
          ${old}
          ${renderBadge(product.tags)}
          <div class="p-actions">
            <button class="btn btn-warning btn-sm" data-qv="${product.id}" data-bs-toggle="modal" data-bs-target="#quickView" style="color:#000">Xem</button>
            <button class="btn btn-primary btn-sm btn-add-cart" data-id="${product.id}">Thêm</button>
          </div>
        </div>
      </div>
    </div>`;
}

function quickViewAsync(id) {
  const product = listStore.products.find((item) => item.id === id);
  if (!product) return;

  const $body = $('#qvBody');
  if (!$body.length) return;

  const fallback = `<span class="display-3">${product.img || '🛍️'}</span>`;

  $body.html(`
    <div class="row g-3">
      <div class="col-md-6">
        <div class="qv-media bg-body-secondary rounded-4 d-flex align-items-center justify-content-center">
          ${listIsAssetImage(product.img)
            ? `<img src="${product.img}" alt="${product.title}" class="qv-img">`
            : fallback}
        </div>
      </div>
      <div class="col-md-6">
        <h5 class="mb-1">${product.title}</h5>
        <div class="text-danger fw-bold mb-2">${listMoney(product.price)}</div>
        <div class="small text-muted">Đang tải thông tin...</div>
      </div>
    </div>
  `);

  listFetchJson(`assets/data/details/${id}.json`).done((details) => {
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
            ${listIsAssetImage(product.img)
              ? `<img src="${product.img}" alt="${product.title}" class="qv-img">`
              : fallback}
          </div>
        </div>
        <div class="col-md-6">
          <h5 class="mb-1">${product.title}</h5>
          <div class="mb-2">${badgeHtml}</div>
          <div class="text-danger fw-bold mb-2">${listMoney(product.price)}</div>
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

function initList() {
  const $grid = $('#grid-all');
  if (!$grid.length) return;

  let limit = 6;
  const $cat = $('#catSelect');
  const $priceRange = $('#priceRange');
  const $priceLabel = $('#priceLabel');
  const $inStock = $('#inStock');
  const $sort = $('#sortSelect');

  const render = () => {
    const cat = $cat.val();
    const max = Number($priceRange.val()) * 1_000_000;
    const inStock = $inStock.is(':checked');
    const sort = $sort.val();

    let items = listStore.products.filter((p) => (!cat || p.cat === cat) && p.price <= max);
    if (inStock) {
      items = items.filter((p) => p.stock !== false);
    }

    if (sort === 'priceAsc') items.sort((a, b) => a.price - b.price);
    if (sort === 'priceDesc') items.sort((a, b) => b.price - a.price);

    $grid.html(items.slice(0, limit).map(productCard).join(''));
  };

  render();

  $('#applyFilter').on('click', render);
  $sort.on('change', render);
  $priceRange.on('input', function () {
    $priceLabel.text($(this).val());
  });
  $('#loadMore').on('click', () => {
    limit += 4;
    render();
  });

  $(document).off('click.listQuickView').on('click.listQuickView', '[data-qv]', function (evt) {
    evt.preventDefault();
    const id = Number($(this).data('qv'));
    if (!Number.isNaN(id)) quickViewAsync(id);
  });
}

function initListDark() {
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

function initBackToTopList() {
  const $btn = $('#arrow');
  if (!$btn.length) return;

  $btn.on('click', (evt) => {
    evt.preventDefault();
    $('html, body').animate({ scrollTop: 0 }, 400);
  });

  const toggle = () => {
    $btn.toggle($(window).scrollTop() > 100);
  };

  $(window).on('scroll.productList', toggle);
  toggle();
}
function saveCart() {
  try {
    localStorage.setItem('cart', JSON.stringify(listStore.cart));
  } catch (err) {
    console.warn('Không thể lưu giỏ hàng.', err);
  }
}

function loadCart() {
  try {
    const cartData = localStorage.getItem('cart');
    listStore.cart = cartData ? JSON.parse(cartData) : [];
  } catch (err) {
    console.warn('Không thể tải giỏ hàng.', err);
    listStore.cart = [];
  }
  updateCartCount(); 
}
function updateCartCount() {
  const $cartCount = $('#cart-count');
  if ($cartCount.length) {
    const totalItems = listStore.cart.reduce((sum, item) => sum + item.quantity, 0);
    $cartCount.text(totalItems);
    $cartCount.toggle(totalItems > 0);
  }
}
function addToCart(productId) {
  const product = listStore.products.find(p => p.id === productId);
  if (!product) return;
  const existingItem = listStore.cart.find(item => item.id === productId);

  if (existingItem) {
    
    existingItem.quantity += 1;
  } else {
    
    listStore.cart.push({
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

$(function () {
  loadProductList().done(() => {
    try { initList(); } catch (err) { console.warn(err); }
  });
  try { initListDark(); } catch (err) { console.warn(err); }
  try { initBackToTopList(); } catch (err) { console.warn(err); }
  try { 
    loadCart();
    initCartEvents();
  } catch (err) { console.warn(err); }
});
