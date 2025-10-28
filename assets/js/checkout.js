const store = { cart: [] };
const money = (n) => `${(n || 0).toLocaleString('vi-VN')}₫`;
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
}

function updateCartCount() {
    const $cartCount = $('#cart-count');
    if ($cartCount.length) {
        const totalItems = store.cart.reduce((sum, item) => sum + item.quantity, 0);
        $cartCount.text(totalItems);
        $cartCount.toggle(totalItems > 0);
    }
}

function renderCheckoutSummary() {
    if (store.cart.length === 0) {
        alert('Giỏ hàng của bạn đang trống. Đang quay về trang chủ...');
        window.location.href = 'index.html';
        return;
    }

    const $list = $('#checkout-items-list');
    const $subtotal = $('#subtotal');
    const $total = $('#total');
    const $cartCountBadge = $('#checkout-cart-count'); 
    
    let totalCartPrice = 0;
    let totalItems = 0;
    $list.empty();
    store.cart.forEach(item => {
        const itemTotalPrice = item.price * item.quantity;
        totalCartPrice += itemTotalPrice;
        totalItems += item.quantity;
        
        const itemHtml = `
            <li class="list-group-item d-flex justify-content-between lh-sm">
                <div class="d-flex gap-2">
                    <img src="${item.img}" alt="${item.title}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
                    <div>
                        <h6 class="my-0">${item.title}</h6>
                        <small class="text-muted">Số lượng: ${item.quantity}</small>
                    </div>
                </div>
                <span class="text-muted">${money(itemTotalPrice)}</span>
            </li>
        `;
        $list.append(itemHtml);
    });
    
    $subtotal.text(money(totalCartPrice));
    $total.text(money(totalCartPrice)); 
    $cartCountBadge.text(totalItems);
}

function handleCompleteOrder(event) {
    event.preventDefault(); 

    const $form = $('#checkout-form');
    if (!$form[0].checkValidity()) {
        $form[0].reportValidity(); 
        return;
    }

    Swal.fire({
        icon: 'success',
        title: 'Đặt hàng thành công!',
        text: 'Cảm ơn bạn đã mua hàng. Chúng tôi sẽ liên hệ với bạn sớm nhất.',
        timer: 3000,
        timerProgressBar: true,
        willClose: () => {
            store.cart = [];
            saveCart();
            updateCartCount(); 
            window.location.href = 'index.html';
        }
    });
}

function initDark() {
    const $btn = $('#btnDark');
    if (!$btn.length) return;
    const setTheme = (dark) => $('html').attr('data-bs-theme', dark ? 'dark' : 'light');
    let pref = localStorage.getItem('dm') === '1';
    setTheme(pref);
    $btn.on('click', () => {
        pref = !pref;
        try { localStorage.setItem('dm', pref ? '1' : '0'); } catch (err) {}
        setTheme(pref);
    });
}

function initBackToTop() {
    const $btn = $('#arrow');
    if (!$btn.length) return;
    $btn.on('click', (evt) => {
        evt.preventDefault();
        $('html, body').animate({ scrollTop: 0 }, 400);
    });
    const toggle = () => $btn.toggle($(window).scrollTop() > 100);
    $(window).on('scroll.backToTop', toggle);
    toggle();
}

$(function() {
    try { initDark(); } catch (err) { console.warn(err); }
    try { initBackToTop(); } catch (err) { console.warn(err); }
    loadCart();
    updateCartCount();
    renderCheckoutSummary();
    $('#checkout-form').on('submit', handleCompleteOrder);
});