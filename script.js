/* ============================================================
   AUTO CACHE SYSTEM
============================================================ */
function loadData() {
    const p = localStorage.getItem("pos_products");
    const c = localStorage.getItem("pos_cart");
    const t = localStorage.getItem("pos_transactions");

    if (p) products = JSON.parse(p);
    if (c) cart = JSON.parse(c);
    if (t) transactions = JSON.parse(t);
}

function saveData() {
    localStorage.setItem("pos_products", JSON.stringify(products));
    localStorage.setItem("pos_cart", JSON.stringify(cart));
    localStorage.setItem("pos_transactions", JSON.stringify(transactions));
}

/* Auto-save setiap 1 detik (fallback) */
setInterval(saveData, 1000);

/* ============================================================
   INITIAL DATA
============================================================ */
let products = [
    { id: 1, name: 'Nasi Goreng', price: 15000 },
    { id: 2, name: 'Mie Goreng', price: 12000 },
    { id: 3, name: 'Ayam Goreng', price: 18000 },
    { id: 4, name: 'Es Teh', price: 5000 },
    { id: 5, name: 'Es Jeruk', price: 6000 },
    { id: 6, name: 'Kopi', price: 7000 }
];

let cart = [];
let transactions = [];

/* ============================================================
   TELEGRAM CONFIG (placeholder)
============================================================ */
const TELEGRAM_TOKEN = "ISI_TOKEN_BOT_KAMU";
const TELEGRAM_CHAT_ID = "ISI_CHAT_ID_KAMU";

/* ============================================================
   PAYMENT STATE
============================================================ */
let paymentState = {
    step: 1,
    selectedMethod: null,
    discountPct: 0,
    taxPct: 0,
    qrisFeePct: 1.5,
    cashReceived: 0
};

/* ============================================================
   UI / Product Rendering
============================================================ */
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    try { event.target.classList.add('active'); } catch(e){}
    const el = document.getElementById(tabName);
    if (el) el.classList.add('active');

    if (tabName === 'dashboard') updateDashboard();
    if (tabName === 'products') renderProductsManagement();
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    grid.innerHTML = products.map(p => `
        <div class="product-card" onclick="addToCart(${p.id})">
            <div class="product-name">${p.name}</div>
            <div class="product-price">Rp ${p.price.toLocaleString('id-ID')}</div>
        </div>
    `).join('');
}

/* ============================================================
   CART FUNCTIONS
============================================================ */
function addToCart(id) {
    const item = products.find(p => p.id === id);
    if (!item) return;
    const exist = cart.find(c => c.id === id);

    if (exist) exist.quantity++;
    else cart.push({ ...item, quantity: 1 });

    saveData();
    renderCart();
}

function renderCart() {
    const div = document.getElementById("cartItems");
    if (!div) return;

    if (cart.length === 0) {
        div.innerHTML = `<p style="text-align:center;color:#999;">Keranjang kosong</p>`;
    } else {
        div.innerHTML = cart.map(i => `
            <div class="cart-item">
                <div class="cart-item-header">
                    <span>${i.name}</span>
                    <button class="remove-btn" onclick="removeFromCart(${i.id})">✕</button>
                </div>
                <div style="font-size:14px;">Rp ${i.price.toLocaleString('id-ID')}</div>
                <div class="quantity-controls">
                    <button onclick="decreaseQuantity(${i.id})">-</button>
                    <span>${i.quantity}</span>
                    <button onclick="increaseQuantity(${i.id})">+</button>
                </div>
                <div class="item-subtotal">
                    Subtotal: Rp ${(i.price * i.quantity).toLocaleString("id-ID")}
                </div>
            </div>
        `).join('');
    }

    updateTotal();
}

function increaseQuantity(id) { const i = cart.find(x => x.id === id); if (i) i.quantity++; saveData(); renderCart(); }
function decreaseQuantity(id) { const i = cart.find(x => x.id === id); if (i && i.quantity > 1) i.quantity--; saveData(); renderCart(); }
function removeFromCart(id) { cart = cart.filter(x => x.id !== id); saveData(); renderCart(); }
function clearCart() { if (cart.length && confirm("Kosongkan keranjang?")) { cart = []; saveData(); renderCart(); } }

function updateTotal() {
    const total = cart.reduce((s,i)=>s + i.price * i.quantity, 0);
    const el = document.getElementById("totalAmount");
    if (el) el.textContent = `Rp ${total.toLocaleString('id-ID')}`;
}

/* ============================================================
   PAYMENT STEPS
============================================================ */
function startPaymentFlow() {
    if (cart.length === 0) return alert("Keranjang kosong!");

    // reset state but keep qrisFeePct
    paymentState.step = 1;
    paymentState.selectedMethod = null;
    paymentState.discountPct = 0;
    paymentState.taxPct = 0;
    paymentState.cashReceived = 0;

    // reset input fields
    const d = document.getElementById("inputDiscount"); if (d) d.value = 0;
    const t = document.getElementById("inputTax"); if (t) t.value = 0;
    const cashInput = document.getElementById("inputCashReceived"); if (cashInput) cashInput.value = '';

    renderStep1();
    updateStepSummaries();
    showPaymentStep(1);

    const overlay = document.getElementById("paymentPopupOverlay");
    if (overlay) overlay.style.display = "flex";
}

function closePaymentFlow() {
    const overlay = document.getElementById("paymentPopupOverlay");
    if (overlay) overlay.style.display = "none";
}

function showPaymentStep(step) {
    paymentState.step = step;

    document.querySelectorAll(".payment-step").forEach(el => el.style.display = "none");
    const el = document.querySelector(`.payment-step[data-step="${step}"]`);
    if (el) el.style.display = "block";

    // update step indicator classes
    document.querySelectorAll(".payment-steps .step").forEach(s => s.classList.remove("active"));
    const stepIndicator = document.querySelector(`.payment-steps .step[data-step="${step}"]`);
    if (stepIndicator) stepIndicator.classList.add("active");

    const nextBtn = document.getElementById("nextPaymentBtn");
    const processBtn = document.getElementById("processPaymentBtn");
    if (nextBtn) nextBtn.style.display = step < 4 ? "inline-block" : "none";
    if (processBtn) processBtn.style.display = step === 4 ? "inline-block" : "none";

    updateStepSummaries();
}

/* renderStep1..4 */
function renderStep1() {
    const list = document.getElementById("paymentItems");
    if (!list) return;
    list.innerHTML = cart.map(it => `
        <div class="payment-item">
            <div>${it.name} (x${it.quantity})</div>
            <div>Rp ${(it.price * it.quantity).toLocaleString('id-ID')}</div>
        </div>
    `).join('');
}

function renderStep2() {
    // show current selected method if any
    const details = document.getElementById("methodDetails");
    if (details) {
        details.textContent = paymentState.selectedMethod ? `Metode: ${paymentState.selectedMethod.toUpperCase()}` : 'Pilih metode pembayaran';
    }
}

function renderStep3() {
    // hide all method areas
    const cashArea = document.getElementById("cashArea");
    const qrisArea = document.getElementById("qrisArea");
    const transferArea = document.getElementById("transferArea");

    if (cashArea) cashArea.style.display = "none";
    if (qrisArea) qrisArea.style.display = "none";
    if (transferArea) transferArea.style.display = "none";

    const totals = computeTotals();
    if (paymentState.selectedMethod === "cash") {
        if (cashArea) cashArea.style.display = "block";
        const cashTotalLabel = document.getElementById("cashTotalLabel");
        if (cashTotalLabel) cashTotalLabel.textContent = `Rp ${totals.grandTotal.toLocaleString('id-ID')}`;

        // input listener
        const cashInput = document.getElementById("inputCashReceived");
        if (cashInput) {
            cashInput.value = paymentState.cashReceived ? paymentState.cashReceived : '';
            cashInput.oninput = function() {
                const val = parseFloat(this.value) || 0;
                paymentState.cashReceived = val;
                const change = Math.max(0, val - totals.grandTotal);
                const changeLabel = document.getElementById("cashChangeLabel");
                if (changeLabel) changeLabel.textContent = `Rp ${change.toLocaleString('id-ID')}`;
            };
        }
    } else if (paymentState.selectedMethod === "qris") {
        if (qrisArea) qrisArea.style.display = "block";
    } else if (paymentState.selectedMethod === "transfer") {
        if (transferArea) transferArea.style.display = "block";
    }
}

function renderFinalStep() {
    const totals = computeTotals();
    const area = document.getElementById("finalSummaryArea");
    if (!area) return;

    let html = '';
    html += `<div>Subtotal: Rp ${totals.subtotal.toLocaleString('id-ID')}</div>`;
    if (totals.discountAmount) html += `<div>Diskon: -Rp ${totals.discountAmount.toLocaleString('id-ID')}</div>`;
    if (totals.taxAmount) html += `<div>PPN: Rp ${totals.taxAmount.toLocaleString('id-ID')}</div>`;
    if (totals.qrisFee) html += `<div>Fee QRIS: Rp ${totals.qrisFee.toLocaleString('id-ID')}</div>`;
    html += `<div style="font-weight:bold;margin-top:8px;">GRAND TOTAL: Rp ${totals.grandTotal.toLocaleString('id-ID')}</div>`;

    if (paymentState.selectedMethod === 'cash') {
        html += `<div>Dibayar: Rp ${(paymentState.cashReceived || 0).toLocaleString('id-ID')}</div>`;
        html += `<div>Kembalian: Rp ${Math.max(0, (paymentState.cashReceived || 0) - totals.grandTotal).toLocaleString('id-ID')}</div>`;
    } else {
        html += `<div>Metode: ${paymentState.selectedMethod ? paymentState.selectedMethod.toUpperCase() : '-'}</div>`;
    }

    area.innerHTML = html;
}

/* next/prev step logic (synchronize paymentState.step properly) */
function nextPaymentStep() {
    if (paymentState.step === 1) {
        // read discount & tax from inputs
        const dEl = document.getElementById("inputDiscount");
        const tEl = document.getElementById("inputTax");
        const d = dEl ? (parseFloat(dEl.value) || 0) : 0;
        const t = tEl ? (parseFloat(tEl.value) || 0) : 0;

        if (d < 0 || d > 100 || t < 0 || t > 100) {
            return alert("Masukkan diskon/PPN antara 0–100%");
        }
        paymentState.discountPct = d;
        paymentState.taxPct = t;

        paymentState.step = 2;
        renderStep2();
        showPaymentStep(2);
        return;
    }

    if (paymentState.step === 2) {
        if (!paymentState.selectedMethod) {
            return alert("Pilih metode pembayaran!");
        }
        paymentState.step = 3;
        renderStep3();
        showPaymentStep(3);
        return;
    }

    if (paymentState.step === 3) {
        // if cash, check input
        const totals = computeTotals();
        if (paymentState.selectedMethod === 'cash') {
            // ensure cash received is set (value may be in input)
            const cashInput = document.getElementById("inputCashReceived");
            const val = cashInput ? (parseFloat(cashInput.value) || 0) : 0;
            paymentState.cashReceived = val;

            if (val < totals.grandTotal) {
                if (!confirm("Uang kurang dari total. Tetap lanjut?")) return;
            }
        }
        paymentState.step = 4;
        renderFinalStep();
        showPaymentStep(4);
        return;
    }
}

function prevPaymentStep() {
    if (paymentState.step > 1) {
        paymentState.step--;
        showPaymentStep(paymentState.step);
    } else {
        closePaymentFlow();
    }
}

/* ============================================================
   COMPUTE TOTALS
============================================================ */
function computeTotals() {
    const subtotal = cart.reduce((s,i)=>s + i.price * i.quantity, 0);
    const discountAmount = Math.round(subtotal * (paymentState.discountPct / 100));
    const after = subtotal - discountAmount;
    const taxAmount = Math.round(after * (paymentState.taxPct / 100));
    const qrisFee = paymentState.selectedMethod === 'qris'
        ? Math.round((after + taxAmount) * (paymentState.qrisFeePct / 100))
        : 0;

    const grandTotal = Math.max(0, after + taxAmount + qrisFee);
    return { subtotal, discountAmount, taxAmount, qrisFee, grandTotal };
}

/* update step summaries */
function updateStepSummaries() {
    const totals = computeTotals();
    const s1 = document.getElementById("step1Summary");
    const s2 = document.getElementById("step2Summary");
    const s3 = document.getElementById("step3Summary");

    if (s1) s1.textContent = `Subtotal: Rp ${totals.subtotal.toLocaleString('id-ID')} | Est. Grand: Rp ${totals.grandTotal.toLocaleString('id-ID')}`;
    if (s2) s2.textContent = `Metode: ${paymentState.selectedMethod ? paymentState.selectedMethod.toUpperCase() : '-'} | Est. Grand: Rp ${totals.grandTotal.toLocaleString('id-ID')}`;
    if (s3) s3.textContent = `Bayar: Rp ${totals.grandTotal.toLocaleString('id-ID')}`;
}

/* ============================================================
   FINALIZE (PRINT + TELEGRAM)
============================================================ */
function finishPaymentProcess() {
    const totals = computeTotals();
    const now = new Date();

    const tx = {
        id: "TRX" + now.getTime(),
        date: now.toLocaleString('id-ID'),
        items: cart.map(i => ({ ...i })),
        subtotal: totals.subtotal,
        discountPct: paymentState.discountPct,
        discountAmount: totals.discountAmount,
        taxPct: paymentState.taxPct,
        taxAmount: totals.taxAmount,
        qrisFee: totals.qrisFee,
        grandTotal: totals.grandTotal,
        method: paymentState.selectedMethod || 'unknown',
        cashReceived: paymentState.selectedMethod === 'cash' ? (paymentState.cashReceived || 0) : 0,
        change: paymentState.selectedMethod === 'cash' ? Math.max(0, (paymentState.cashReceived || 0) - totals.grandTotal) : 0
    };

    transactions.push(tx);
    saveData();

    preparePrint(tx);
    sendTelegramReceipt(tx);

    // clear cart
    cart = [];
    saveData();
    renderCart();
    updateDashboard();

    closePaymentFlow();
    alert("Transaksi berhasil! Struk dicetak & dikirim (jika Telegram diisi).");
}

/* ============================================================
   PRINT SYSTEM
============================================================ */
function preparePrint(tx) {
    const printDate = document.getElementById("printDate");
    const printNo = document.getElementById("printTransactionNo");
    const printItems = document.getElementById("printItems");
    const printSummary = document.getElementById("printSummary");

    if (printDate) printDate.textContent = tx.date;
    if (printNo) printNo.textContent = tx.id;

    if (printItems) {
        printItems.innerHTML = tx.items.map(i => `
            <div style="display:flex;justify-content:space-between;">
                <span>${i.name} x${i.quantity}</span>
                <span>Rp ${(i.price * i.quantity).toLocaleString('id-ID')}</span>
            </div>
        `).join('');
    }

    if (printSummary) {
        let html = '';
        html += `<div style="display:flex;justify-content:space-between;"><span>Subtotal</span><span>Rp ${tx.subtotal.toLocaleString('id-ID')}</span></div>`;
        if (tx.discountAmount) html += `<div style="display:flex;justify-content:space-between;"><span>Diskon</span><span>- Rp ${tx.discountAmount.toLocaleString('id-ID')}</span></div>`;
        if (tx.taxAmount) html += `<div style="display:flex;justify-content:space-between;"><span>PPN</span><span>Rp ${tx.taxAmount.toLocaleString('id-ID')}</span></div>`;
        if (tx.qrisFee) html += `<div style="display:flex;justify-content:space-between;"><span>Fee QRIS</span><span>Rp ${tx.qrisFee.toLocaleString('id-ID')}</span></div>`;
        html += `<div style="display:flex;justify-content:space-between;font-weight:bold;margin-top:6px;"><span>TOTAL</span><span>Rp ${tx.grandTotal.toLocaleString('id-ID')}</span></div>`;
        html += `<div style="display:flex;justify-content:space-between;"><span>Metode</span><span>${tx.method.toUpperCase()}</span></div>`;
        if (tx.method === 'cash') {
            html += `<div style="display:flex;justify-content:space-between;"><span>Dibayar</span><span>Rp ${tx.cashReceived.toLocaleString('id-ID')}</span></div>`;
            html += `<div style="display:flex;justify-content:space-between;"><span>Kembalian</span><span>Rp ${tx.change.toLocaleString('id-ID')}</span></div>`;
        }
        printSummary.innerHTML = html;
    }

    // trigger print
    window.print();
}

/* ============================================================
   TELEGRAM SENDER (placeholder)
============================================================ */
function sendTelegramReceipt(tx) {
    if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return; // skip if placeholders
    const text =
`STRUK PEMBAYARAN
No: ${tx.id}
Tanggal: ${tx.date}

${tx.items.map(i => `${i.name} x${i.quantity} = Rp ${(i.price*i.quantity).toLocaleString('id-ID')}`).join('\n')}

TOTAL: Rp ${tx.grandTotal.toLocaleString('id-ID')}
Metode: ${tx.method.toUpperCase()}
`;
    fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text })
    }).catch(err => console.warn("Telegram send failed (placeholder):", err));
}

/* ============================================================
   PRODUCTS & DASHBOARD
============================================================ */
function addProduct() {
    const nameEl = document.getElementById("productName");
    const priceEl = document.getElementById("productPrice");
    if (!nameEl || !priceEl) return;

    const name = nameEl.value.trim();
    const price = parseInt(priceEl.value);

    if (!name || !price || price <= 0) return alert("Isi nama & harga produk dengan benar!");

    const id = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    products.push({ id, name, price });
    saveData();

    nameEl.value = "";
    priceEl.value = "";

    renderProducts();
    renderProductsManagement();
}

function deleteProduct(id) {
    if (!confirm("Hapus produk ini?")) return;
    products = products.filter(p => p.id !== id);
    saveData();
    renderProducts();
    renderProductsManagement();
}

function renderProductsManagement() {
    const el = document.getElementById("productsManagement");
    if (!el) return;
    el.innerHTML = products.map(p => `
        <div class="product-manage-item">
            <div class="product-info">
                <h3>${p.name}</h3>
                <p>Rp ${p.price.toLocaleString('id-ID')}</p>
            </div>
            <button onclick="deleteProduct(${p.id})">🗑️ Hapus</button>
        </div>
    `).join('');
}

function updateDashboard() {
    const totalTrx = transactions.length;
    const totalRev = transactions.reduce((s,t)=>s + (t.grandTotal || 0), 0);
    const avgTrx = totalTrx > 0 ? Math.round(totalRev / totalTrx) : 0;

    const a = document.getElementById("totalTransactions"); if (a) a.textContent = totalTrx;
    const b = document.getElementById("totalRevenue"); if (b) b.textContent = `Rp ${totalRev.toLocaleString('id-ID')}`;
    const c = document.getElementById("avgTransaction"); if (c) c.textContent = `Rp ${avgTrx.toLocaleString('id-ID')}`;

    const list = document.getElementById("transactionsList");
    if (list) {
        if (transactions.length === 0) list.innerHTML = '<p style="color:#999">Belum ada transaksi</p>';
        else list.innerHTML = transactions.slice().reverse().map(t => `
            <div class="transaction-item">
                <div class="transaction-header"><span>${t.id}</span><span>Rp ${t.grandTotal.toLocaleString('id-ID')}</span></div>
                <div style="font-size:12px;color:#777">${t.date}</div>
                <div>${t.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</div>
            </div>
        `).join('');
    }
}

// ======================
// IMAGE ZOOM FEATURE
// ======================
const qrisImg = document.getElementById("qrisImage");
const zoomOverlay = document.getElementById("imgZoomOverlay");
const zoomImg = document.getElementById("imgZoomFull");

if (qrisImg) {
    qrisImg.onclick = () => {
        zoomImg.src = qrisImg.src;  // FULL resolution
        zoomOverlay.style.display = "flex";
    };
}

if (zoomOverlay) {
    zoomOverlay.onclick = () => {
        zoomOverlay.style.display = "none";
    };
}


/* ============================================================
   SELECT METHOD (fix)
============================================================ */
function selectMethod(method, el) {
    paymentState.selectedMethod = method;

    // highlight
    document.querySelectorAll(".method-card").forEach(x => x.classList.remove("selected"));
    if (el && el.classList) el.classList.add("selected");

    // update details text
    const details = document.getElementById("methodDetails");
    const qrisImage = document.getElementById("qrisImage");
    if (details) {
        if (method === 'cash') details.textContent = 'Tunai — input jumlah uang diterima.';
        else if (method === 'qris') details.textContent = `QRIS — fee merchant ${paymentState.qrisFeePct}%`;
        else if (method === 'transfer') details.textContent = 'Transfer bank — instruksi akan ditampilkan.';
    }
    // show/hide qris image based on selection (if exists)
    if (qrisImage) qrisImage.style.display = method === 'qris' ? 'block' : 'none';

    // update summaries
    updateStepSummaries();
    saveData();
}
window.selectMethod = selectMethod;

/* ============================================================
   BOOTSTRAP
============================================================ */
loadData();
renderProducts();
renderCart();
renderProductsManagement();
updateDashboard();

/* expose functions for HTML inline handlers */
window.startPaymentFlow = startPaymentFlow;
window.closePaymentFlow = closePaymentFlow;
window.nextPaymentStep = nextPaymentStep;
window.prevPaymentStep = prevPaymentStep;
window.finishPaymentProcess = finishPaymentProcess;
window.addProduct = addProduct;
window.deleteProduct = deleteProduct;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
