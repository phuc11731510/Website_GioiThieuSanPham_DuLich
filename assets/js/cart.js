const store = { cart: [] };
const money = (n) => `${(n || 0).toLocaleString('vi-VN')}₫`;

function saveCart() {
    try {
        localStorage.setItem('cart', JSON.stringify(store.cart));
    } catch (err) {
        console.warn('Không thể lưu giỏ hàng.', err);
    }
}

// Hàm tải giỏ hàng từ localStorage
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

function renderCart() {
    const $container = $('#cart-items-container');
    const $emptyMsg = $('#cart-empty');
    const $summaryBox = $('#cart-summary');
    
    if (store.cart.length === 0) {
        $container.empty(); 
        $emptyMsg.show();   
        $summaryBox.hide(); 
        return;
    }
    
    $emptyMsg.hide();
    $summaryBox.show();
    
    let totalCartPrice = 0;
    const cartHtml = store.cart.map(item => {
        const itemTotalPrice = item.price * item.quantity;
        totalCartPrice += itemTotalPrice;
        
        return `
        <div class="cart-item card card-body mb-3" data-id="${item.id}">
            <div class="row g-3 align-items-center">
                <div class="col-3 col-md-2">
                    <img src="${item.img}" class="img-fluid rounded" alt="${item.title}">
                </div>
                <div class="col-9 col-md-10">
                    <div class="d-flex justify-content-between mb-1">
                        <h6 class="mb-0">${item.title}</h6>
                        <button class="btn-close btn-sm btn-remove-item" data-id="${item.id}" aria-label="Xóa"></button>
                    </div>
                    <p class="mb-1 small">Đơn giá: <span class="text-danger fw-bold">${money(item.price)}</span></p>
                    
                    <div class="d-flex align-items-center gap-2 mb-2">
                        <label for="qty-${item.id}" class="form-label small mb-0">Số lượng:</label>
                        <input type="number" class="form-control form-control-sm qty-input" id="qty-${item.id}" data-id="${item.id}" value="${item.quantity}" min="1" style="width: 70px;">
                    </div>
                    
                    <div class="fw-bold">
                        Tạm tính: ${money(itemTotalPrice)}
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
    $container.html(cartHtml);
    updateTotals(totalCartPrice);
}

function updateTotals(total) {
    $('#subtotal').text(money(total));
    $('#total').text(money(total)); 
}

function removeFromCart(productId) {
    store.cart = store.cart.filter(item => item.id !== productId);
    saveCart();        
    renderCart();       
    updateCartCount();
}

function updateQuantity(productId, quantity) {
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    
    const item = store.cart.find(item => item.id === productId);
    if (item) {
        item.quantity = qty;
        saveCart();
        renderCart(); 
        updateCartCount(); 
    }
}
function initCartPageEvents() {
    const $container = $('#cart-items-container');
    $container.on('click', '.btn-remove-item', function() {
        // Hỏi xác nhận trước khi xóa
        if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
            const productId = Number($(this).data('id'));
            if (productId) {
                removeFromCart(productId);
            }
        }
    });
    $container.on('change', '.qty-input', function() {
        const productId = Number($(this).data('id'));
        const quantity = $(this).val();
        if (productId) {
            updateQuantity(productId, quantity);
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
        try {
            localStorage.setItem('dm', pref ? '1' : '0');
        } catch (err) {
            console.warn('Không lưu được thiết lập dark mode', err);
        }
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

    const toggle = () => {
        $btn.toggle($(window).scrollTop() > 100);
    };

    $(window).on('scroll.backToTop', toggle);
    toggle();
}

$(function() {
    try { initDark(); } catch (err) { console.warn(err); }
    try { initBackToTop(); } catch (err) { console.warn(err); }
    loadCart();         
    updateCartCount(); 
    renderCart();      
    initCartPageEvents(); 
});