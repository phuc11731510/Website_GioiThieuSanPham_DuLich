const productStore = { products: [] };
const productIsAssetImage = (src) => typeof src === 'string' && src.startsWith('assets/');
const productMoney = (n) => `${(n || 0).toLocaleString('vi-VN')}₫`;

const productFetchJson = (url) => $.ajax({ url, dataType: 'json', cache: false });

function loadProductList() {
  return productFetchJson('assets/data/products.json')
    .done((data) => {
      productStore.products = Array.isArray(data) ? data : [];
    })
    .fail((err) => {
      console.warn('Không tải được products.json', err);
      productStore.products = [];
    });
}

function loadProductDetails(id) {
  return productFetchJson(`assets/data/details/${id}.json`).fail((err) => {
    console.warn('Không tải được details cho id', id, err);
  });
}

function getCurrentProductId() {
  try {
    const id = Number(new URLSearchParams(window.location.search).get('id'));
    if (!Number.isNaN(id)) return id;
  } catch (err) {}
  try {
    const last = Number(localStorage.getItem('last_product_id') || '');
    if (!Number.isNaN(last)) return last;
  } catch (err) {}
  return null;
}

function createHeroController($hero, gallery, title) {
  if (!$hero.length || !gallery.length) return null;

  $hero.empty();

  const $stack = $('<div class="hero-stack"></div>');
  const $layerA = $('<div class="hero-layer is-current"></div>');
  const $layerB = $('<div class="hero-layer is-next"></div>');

  $layerA.css({ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 1, transition: 'opacity .35s ease' });
  $layerB.css({ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity .35s ease' });

  $stack.css({ position: 'absolute', inset: 0 }).append($layerA, $layerB);
  $hero.css({ position: 'relative' }).append($stack);

  const renderMedia = ($layer, src) => {
    if (!$layer.length) return;
    if (productIsAssetImage(src)) {
      $layer.html(`<img src="${src}" alt="${title}" style="max-width:100%;max-height:100%;width:auto;height:auto;display:block;border-radius:inherit">`);
    } else {
      $layer.html(`<span class="fs-1">${src || '🛍️'}</span>`);
    }
  };

  renderMedia($layerA, gallery[0]);
  let current = $layerA;
  let idle = $layerB;
  let index = 0;
  let timer = null;

  const show = (idx, immediate = false) => {
    const target = (idx + gallery.length) % gallery.length;
    if (!immediate && target === index) return;

    const media = gallery[target];
    if (immediate) {
      renderMedia(current, media);
      index = target;
      return;
    }

    renderMedia(idle, media);
    idle.css('opacity', 1);
    current.css('opacity', 0);

    current.one('transitionend', () => {
      const temp = current;
      current = idle;
      idle = temp;
      idle.css('opacity', 0);
      current.css('opacity', 1);
      index = target;
    });
  };

  const restartTimer = () => {
    if (timer) clearInterval(timer);
    timer = setInterval(() => show(index + 1), 4000);
  };

  restartTimer();

  return {
    go: (idx) => { show(idx); restartTimer(); },
    showImmediate: (idx) => show(idx, true),
  };
}

function renderSpecs(details) {
  const $specList = $('#specList');
  if (!$specList.length) return;

  if (!details || !Array.isArray(details.specs)) {
    $specList.html('<li>Thông tin đang cập nhật</li>');
    return;
  }

  const items = [];
  details.specs.forEach((group) => {
    if (group && Array.isArray(group.items)) {
      group.items.forEach((item) => {
        if (item && item.label && item.value) {
          items.push(`<li>${item.label}: ${item.value}</li>`);
        }
      });
    }
  });

  $specList.html(items.length ? items.join('') : '<li>Thông tin đang cập nhật</li>');
}

function renderPromos(details) {
  const $card = $('#promoCard');
  const $list = $('#promoList');
  if (!$card.length || !$list.length) return;

  const promos = details && Array.isArray(details.promos) ? details.promos : [];
  if (!promos.length) {
    $card.addClass('d-none');
    $list.empty();
    return;
  }

  $card.removeClass('d-none');
  $list.html(promos.map((p) => `<li>${p}</li>`).join(''));
}

function initProductPage() {
  const $page = $('[data-product-page]');
  if (!$page.length) return;

  const id = getCurrentProductId();
  const product = id != null ? productStore.products.find((p) => p.id === id) : productStore.products[0];
  if (!product) return;

  document.title = `${product.title} — Chi tiết`;
  $('#pTitle').text(product.title);
  $('#pPrice').text(productMoney(product.price));

  loadProductDetails(product.id).done((details) => {
    const $stock = $('#pStock');
    if ($stock.length) {
      const inStock = details && typeof details.stock === 'boolean' ? details.stock : true;
      $stock.text(inStock ? 'Còn hàng' : 'Hết hàng');
      $stock.removeClass('text-bg-success text-bg-secondary').addClass(inStock ? 'text-bg-success' : 'text-bg-secondary');
    }

    const $rating = $('#pRating');
    if ($rating.length) {
      const rating = details && details.rating ? Math.round(details.rating) : 5;
      const stars = '★★★★★'.slice(0, rating) + '☆☆☆☆☆'.slice(rating);
      $rating.text(stars);
    }

    const gallery = (details && Array.isArray(details.gallery) && details.gallery.length)
      ? details.gallery
      : (productIsAssetImage(product.img) ? [product.img] : [product.img || '🛍️']);

    const heroCtrl = createHeroController($('#pHero'), gallery, product.title);
    if (heroCtrl) heroCtrl.showImmediate(0);

    const $thumbs = $('#pThumbs');
    if ($thumbs.length) {
      $thumbs.html(gallery.map((src, i) => `
        <div class="thumb d-flex align-items-center justify-content-center overflow-hidden" data-idx="${i}">
          ${productIsAssetImage(src)
            ? `<img src="${src}" alt="thumb ${i + 1}" style="width:100%;height:100%;object-fit:cover;display:block">`
            : `<span class="fs-3">${src || ''}</span>`}
        </div>
      `).join(''));

      $thumbs.off('click.productThumb').on('click.productThumb', '[data-idx]', function () {
        const idx = Number($(this).data('idx'));
        if (Number.isNaN(idx) || !heroCtrl) return;
        heroCtrl.go(idx);
        $thumbs.find('[data-idx]').css('outline', 'none');
        $(this).css('outline', '2px solid #0d6efd');
      });

      $thumbs.find('[data-idx="0"]').css('outline', '2px solid #0d6efd');
    }

    renderSpecs(details);
    renderPromos(details);
  });
}

function initProductDarkToggle() {
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

function initProductBackToTop() {
  const $btn = $('#arrow');
  if (!$btn.length) return;

  $btn.on('click', (evt) => {
    evt.preventDefault();
    $('html, body').animate({ scrollTop: 0 }, 400);
  });

  const toggle = () => {
    $btn.toggle($(window).scrollTop() > 100);
  };

  $(window).on('scroll.productBackTop', toggle);
  toggle();
}

function buy() {
  if (typeof Swal === 'undefined') return;
  Swal.fire({
    icon: 'success',
    title: 'Thành công',
    text: 'Đặt hàng thành công',
  });
}

$(function () {
  loadProductList()
    .then(() => initProductDarkToggle())
    .then(() => initProductPage())
    .then(() => initProductBackToTop())
    .catch((err) => console.warn(err))
    .finally(() => {
      const $link = $('nav a[href="contact.html"]');
      if ($link.length) $link.text('Liên hệ');
    });
});

window.buy = buy;
