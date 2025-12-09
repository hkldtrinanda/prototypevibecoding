/* ============================================================
   DATA
============================================================ */
const menuItems = [
    { name: "TEH JUMBO RASA ORIGINAL", price: 3000, promoPrice: 2500, promoDay: "Jumat", category: "Teh" },
    { name: "TEH JUMBO RASA JERUK", price: 6000, category: "Teh" },
    { name: "TEH JUMBO RASA NANAS", price: 6000, category: "Teh" },
    { name: "TEH JUMBO RASA APEL", price: 6000, category: "Teh" },
    { name: "TEH JUMBO RASA SIRSAK", price: 6000, category: "Teh" },
    { name: "TEH JUMBO RASA STRAWBERRY", price: 6000, category: "Teh" },
    { name: "TEH JUMBO RASA PEACH", price: 6000, category: "Teh" },
    { name: "TEH JUMBO RASA MELON", price: 6000, category: "Teh" },
    { name: "TEH JUMBO RASA LECI", price: 6000, category: "Teh" },
    { name: "TEH JUMBO RASA BLACKCURRANT", price: 6000, category: "Teh" },
    { name: "TEH JUMBO RASA MANGGA", price: 6000, category: "Teh" },
    { name: "TEH JUMBO RASA LEMON", price: 8000, category: "Teh" },
    { name: "TEH JUMBO RASA YAKULT", price: 8000, category: "Teh" },
    { name: "COKLAT JUMBO", price: 8000, category: "Creamy" },
    { name: "GREENTEA JUMBO", price: 8000, promoPrice: 7000, promoDay: "Selasa,Rabu", category: "Creamy" },
    { name: "TARO JUMBO", price: 8000, promoPrice: 7000, promoDay: "Selasa,Rabu", category: "Creamy" },
    { name: "VANILLA JUMBO", price: 8000, category: "Creamy" },
    { name: "COOKIES & CREAM JUMBO", price: 10000, promoPrice: 8000, promoDay: "Jumat,Sabtu,Minggu", category: "Creamy" },
    { name: "RED VELVET JUMBO", price: 8000, category: "Creamy" },
    { name: "MILKTEA JUMBO", price: 6000, category: "Milktea" },
    { name: "MILKTEA JUMBO RASA COKLAT", price: 8000, category: "Milktea" },
    { name: "MILKTEA JUMBO RASA STRAWBERRY", price: 8000, category: "Milktea" },
    { name: "MILKTEA JUMBO RASA SIRSAK", price: 8000, category: "Milktea" },
    { name: "MILKTEA JUMBO RASA MANGGA", price: 8000, category: "Milktea" },
    { name: "MILKTEA JUMBO RASA NANAS", price: 8000, category: "Milktea" },
    { name: "MILKTEA COOKIES JUMBO", price: 10000, promoPrice: 8000, promoDay: "Jumat,Sabtu,Minggu", category: "Milktea" },
    { name: "SUSU JUMBO RASA LECI", price: 10000, category: "Susu" },
    { name: "SUSU JUMBO RASA NANAS", price: 10000, category: "Susu" },
    { name: "SUSU JUMBO RASA SIRSAK", price: 10000, category: "Susu" },
    { name: "SUSU JUMBO RASA MELON", price: 10000, category: "Susu" },
    { name: "SUSU JUMBO RASA BLACKCURRANT", price: 10000, category: "Susu" },
    { name: "SUSU JUMBO RASA STRAWBERRY", price: 10000, category: "Susu" },
    { name: "SUSU JUMBO RASA JERUK", price: 10000, category: "Susu" },
    { name: "SUSU JUMBO RASA MANGGA", price: 10000, category: "Susu" },
    { name: "CAPPUCINO JUMBO", price: 8000, category: "Kopi" }
];

const categories = ['Semua', 'Teh', 'Creamy', 'Milktea', 'Susu', 'Kopi'];
let cart = [];
let selectedCategory = 'Semua';
let selectedPaymentMethod = '';

/* ============================================================
   CART SYSTEM
============================================================ */
function loadCart() {
    const saved = localStorage.getItem('posCart');
    if (saved) cart = JSON.parse(saved);
    renderCart();
}
function saveCart() {
    localStorage.setItem('posCart', JSON.stringify(cart));
}

function getCurrentPrice(item) {
    if (!item.promoDay) return item.price;
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
    const promo = item.promoDay.split(',');
    return promo.includes(today) ? item.promoPrice : item.price;
}

function hasPromoToday(item) {
    if (!item.promoDay) return false;
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
    return item.promoDay.split(',').includes(today);
}

function selectCategory(cat) {
    selectedCategory = cat;
    renderCategories();
    renderMenu();
}

function renderCategories() {
    document.getElementById("categories").innerHTML =
        categories.map(c => `
            <button class="category-btn ${c === selectedCategory ? 'active' : ''}"
            onclick="selectCategory('${c}')">${c}</button>
        `).join('');
}

function renderMenu() {
    const filtered = selectedCategory === "Semua"
        ? menuItems
        : menuItems.filter(i => i.category === selectedCategory);

    document.getElementById("menuGrid").innerHTML =
        filtered.map(item => `
            <div class="menu-item" onclick='addToCart(${JSON.stringify(item)})'>
                <h3>${item.name}</h3>
                <div>
                    ${hasPromoToday(item) ? `<span class="old-price">Rp ${item.price.toLocaleString()}</span>` : ''}
                    <span class="price">Rp ${getCurrentPrice(item).toLocaleString()}</span>
                </div>
                ${hasPromoToday(item) ? '<div class="promo-badge">🎉 PROMO HARI INI!</div>' : ''}
            </div>
        `).join('');
}

function addToCart(item) {
    const existing = cart.find(i => i.name === item.name);
    const price = getCurrentPrice(item);

    if (existing) existing.qty++;
    else cart.push({ ...item, qty: 1, currentPrice: price });

    saveCart();
    renderCart();
}

function updateQty(index, change) {
    cart[index].qty += change;
    if (cart[index].qty <= 0) cart.splice(index, 1);
    saveCart();
    renderCart();
}

function deleteItem(i) {
    cart.splice(i, 1);
    saveCart();
    renderCart();
}

function clearCart() {
    if (confirm("Hapus semua item?")) {
        cart = [];
        saveCart();
        renderCart();
    }
}

function renderCart() {
    const container = document.getElementById('cartItems');

    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-cart"><p>Keranjang masih kosong</p></div>';
        document.getElementById('subtotal').textContent = 'Rp 0';
        document.getElementById('total').textContent = 'Rp 0';
        return;
    }

    container.innerHTML = cart.map((item, i) => `
        <div class="cart-item">
            <div>
                <h4>${item.name}</h4>
                <div class="cart-item-price">Rp ${(item.currentPrice * item.qty).toLocaleString()}</div>
            </div>

            <div style="display:flex;align-items:center;">
                <div class="cart-item-qty">
                    <button class="qty-btn" onclick="updateQty(${i}, -1)">-</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" onclick="updateQty(${i}, 1)">+</button>
                </div>
                <button class="delete-btn" onclick="deleteItem(${i})">🗑️</button>
            </div>
        </div>
    `).join('');

    const subtotal = cart.reduce((s, i) => s + (i.currentPrice * i.qty), 0);

    document.getElementById("subtotal").textContent = `Rp ${subtotal.toLocaleString()}`;
    document.getElementById("total").textContent = `Rp ${subtotal.toLocaleString()}`;
}

/* ============================================================
   PAYMENT SYSTEM
============================================================ */
function showPaymentModal() {
    if (cart.length === 0) return alert("Keranjang kosong!");
    document.getElementById("paymentModal").classList.add("show");
}

function closePaymentModal() {
    document.getElementById("paymentModal").classList.remove("show");
    document.getElementById("qrisContainer").style.display = "none";
    selectedPaymentMethod = '';
    document.getElementById("confirmPayBtn").style.display = 'none';
    document.getElementById("printBtn").style.display = 'none';
    document.querySelectorAll(".payment-method").forEach(e => e.classList.remove("selected"));
}

function selectPayment(method, event) {
    selectedPaymentMethod = method;
    document.querySelectorAll(".payment-method").forEach(el => el.classList.remove("selected"));
    event.currentTarget.classList.add("selected");

    document.getElementById("qrisContainer").style.display =
        method === "qris" ? "block" : "none";

    document.getElementById("confirmPayBtn").style.display = "block";
}

function generateTransactionCode(method) {
    const rand = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
    const suffix = method === "qris" ? "QR" : method === "transfer" ? "TF" : "CH";
    return `PBL${rand}${suffix}`;
}

function processPayment() {
    if (!selectedPaymentMethod) return alert("Pilih metode pembayaran!");

    const total = cart.reduce((s, i) => s + (i.currentPrice * i.qty), 0);

    const trx = {
        code: generateTransactionCode(selectedPaymentMethod),
        timestamp: new Date().toISOString(),
        items: cart,
        total: total,
        paymentMethod: selectedPaymentMethod
    };

    const txs = JSON.parse(localStorage.getItem('posTransactions') || '[]');
    txs.push(trx);
    localStorage.setItem("posTransactions", JSON.stringify(txs));

    localStorage.setItem("lastTransaction", JSON.stringify(trx));
    document.getElementById("printBtn").style.display = "block";

    alert("Pembayaran Berhasil!");

    cart = [];
    saveCart();
    renderCart();
}

/* ============================================================
   PRINT RECEIPT
============================================================ */
function printReceipt() {
    const t = JSON.parse(localStorage.getItem("lastTransaction"));
    if (!t) return alert("Tidak ada transaksi!");

    let html = `
        <html><head><title>Struk Pembayaran</title></head>
        <body style="font-family:Arial; padding:20px;">
        <h2>Struk Pembayaran</h2>
        <p><b>${t.code}</b></p>
        <p>Metode: ${t.paymentMethod}</p>
        <p>Tanggal: ${new Date(t.timestamp).toLocaleString('id-ID')}</p>
        <hr>
    `;

    t.items.forEach(i => {
        html += `<p>${i.name} x ${i.qty} — Rp ${(i.currentPrice*i.qty).toLocaleString()}</p>`;
    });

    html += `
        <hr>
        <h3>Total: Rp ${t.total.toLocaleString('id-ID')}</h3>
        </body></html>
    `;

    const w = window.open("", "", "width=400,height=600");
    w.document.write(html);
    w.document.close();
    w.print();
}

/* ============================================================
   HISTORY SYSTEM
============================================================ */
function showHistory() {
    const modal = document.getElementById("historyModal");
    const list = document.getElementById("historyList");

    const txs = JSON.parse(localStorage.getItem("posTransactions") || "[]");

    if (txs.length === 0) {
        list.innerHTML = "<p>Tidak ada riwayat transaksi.</p>";
    } else {
        list.innerHTML = txs.map(t => `
            <div>
                <strong>${t.code}</strong><br>
                ${new Date(t.timestamp).toLocaleString('id-ID')}<br>
                Metode: ${t.paymentMethod}<br>
                Total: Rp ${t.total.toLocaleString()}
            </div>
        `).join('');
    }

    modal.classList.add("show");
}

function closeHistory() {
    document.getElementById("historyModal").classList.remove("show");
}

/* ============================================================
   INIT
============================================================ */
loadCart();
renderCategories();
renderMenu();
