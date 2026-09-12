// ══════════════════════════════════════════════════════
// 1. SAMPLE CATALOG SEED DATA
// ══════════════════════════════════════════════════════
const PRODUCTS_SEED = [
  {
    id: 'prod_1',
    name: 'शाही डच रोज़ बुके',
    category: 'roses',
    price: 899,
    badge: 'बेस्टसेलर',
    desc: '24 चुनिंदा डच लाल गुलाबों का आकर्षक लक्जरी गुलदस्ता, शाही काले वेलवेट पेपर में लिपटा हुआ।',
    query: 'Red Rose bouquet fresh romantic roses red velvet wrap'
  },
  {
    id: 'prod_2',
    name: 'एग्जोटिक पर्पल आर्किड वास',
    category: 'exotic',
    price: 1299,
    badge: 'प्रीमियम',
    desc: 'ताज़े बैंगनी डेंड्रोबियम आर्किड का काँच के वास के साथ शाही अरेंजमेंट।',
    query: 'Orchid arrangement exotic purple orchids bouquet glass vase'
  },
  {
    id: 'prod_3',
    name: 'पवित्र पूजा माला व गेंदा कॉम्बो',
    category: 'pooja',
    price: 349,
    badge: 'दैनिक पूजा',
    desc: 'ताज़े पीले और नारंगी गेंदे की माला, गुलाब की पंखुड़ियाँ और तुलसी पत्र का सेट।',
    query: 'Marigold garland fresh yellow orange flowers traditional Indian pooja'
  },
  {
    id: 'prod_4',
    name: 'सनशाइन लिली व जरबेरा बास्केट',
    category: 'gifts',
    price: 1499,
    badge: 'उपहार',
    desc: 'पीली एशियाटिक लिलीज और रंग-बिरंगे जरबेरा की लकड़ी की बास्केट में मनमोहक सजावट।',
    query: 'Yellow lily gerbera basket arrangement colorful fresh flowers'
  },
  {
    id: 'prod_5',
    name: 'रॉयल व्हाइट कारनेशन बंच',
    category: 'roses',
    price: 699,
    badge: 'शांति व लालित्य',
    desc: '15 बर्फ की तरह सफेद कारनेशन और जिप्सोफिला (बेबीज ब्रीथ) का निर्मल कॉम्बिनेशन।',
    query: 'White carnations bouquet with gypsophila white wrapping'
  },
  {
    id: 'prod_6',
    name: 'त्यौहार विशेष लक्जरी गिफ्ट हैम्पर',
    category: 'gifts',
    price: 2499,
    badge: 'फेस्टिवल स्पेशल',
    desc: 'मिक्स्ड एग्जोटिक फूल, प्रीमियम ड्राई फ्रूट्स बॉक्स और सुगंधित मोमबत्तियाँ।',
    query: 'Luxury gift hamper flowers dry fruits scented candles festival'
  }
];

// ══════════════════════════════════════════════════════
// 2. IMAGE RESOLVER HELPER (Wikipedia -> Openverse -> Pollinations -> Fallback)
// ══════════════════════════════════════════════════════
async function resolveImage(imgEl) {
  const entity = imgEl.dataset.entity;
  const query = imgEl.dataset.query || imgEl.alt || 'flowers bouquet';
  const w = imgEl.dataset.w || 600, h = imgEl.dataset.h || 400;

  if (entity) {
    try {
      const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(entity)}`);
      if (r.ok) {
        const j = await r.json();
        const src = (j.originalimage && j.originalimage.source) || (j.thumbnail && j.thumbnail.source);
        if (src) { imgEl.src = src; return; }
      }
    } catch (e) {}
  }

  try {
    const r = await fetch(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=1&mature=false`);
    const j = await r.json();
    const hit = j.results && j.results[0];
    if (hit && (hit.thumbnail || hit.url)) { imgEl.src = hit.thumbnail || hit.url; return; }
  } catch (e) {}

  imgEl.src = `https://image.pollinations.ai/prompt/${encodeURIComponent(query)}?width=${w}&height=${h}&nologo=true`;
}

// ══════════════════════════════════════════════════════
// 3. APPLICATION STATE & INITIALIZATION
// ══════════════════════════════════════════════════════
let state = {
  cart: JSON.parse(localStorage.getItem('pk_cart') || '[]'),
  customBouquet: {
    flowers: { rose: 0, lily: 0, orchid: 0, carnation: 0 },
    wrap: { name: 'रॉयल वेलवेट ब्लैक', price: 120 },
    ribbon: 'गोल्डन सैटिन',
    note: ''
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  renderCatalog('all');
  initCatalogFilters();
  initBouquetBuilder();
  initCartDrawer();
  initCheckout();
  initInquiryForm();
  updateCartUI();

  // Set default checkout delivery date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateInput = document.getElementById('custDate');
  if (dateInput) {
    dateInput.min = new Date().toISOString().split('T')[0];
    dateInput.value = tomorrow.toISOString().split('T')[0];
  }
});

// ══════════════════════════════════════════════════════
// 4. NAVBAR & NAVIGATION
// ══════════════════════════════════════════════════════
function initNavbar() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileNav = document.getElementById('mobileNav');

  mobileMenuBtn.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
  });

  document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
    });
  });

  // Active section scroll tracking
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
      const secTop = sec.offsetTop - 120;
      if (window.scrollY >= secTop) {
        current = sec.getAttribute('id');
      }
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

// ══════════════════════════════════════════════════════
// 5. CATALOG & SEARCH LOGIC
// ══════════════════════════════════════════════════════
function renderCatalog(category = 'all', searchTerm = '') {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '';

  const filtered = PRODUCTS_SEED.filter(item => {
    const matchesCat = category === 'all' || item.category === category;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.desc.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 48px 0; color: var(--text-3);">
        <p style="font-size: 40px; margin-bottom: 12px;">🥀</p>
        <p style="font-size: 18px; font-weight: 600;">कोई पुष्प उत्पाद नहीं मिला</p>
        <p>कृपया अन्य श्रेणी या खोज शब्द आज़माएं।</p>
      </div>`;
    return;
  }

  filtered.forEach(prod => {
    const cardHtml = `
      <div class="card product-card">
        <div class="product-img-wrap">
          <span class="product-badge">${prod.badge}</span>
          <img data-query="${prod.query}" alt="${prod.name}" loading="lazy"
               onerror="if(!this.dataset.fallback){this.dataset.fallback='1';this.src='https://placehold.co/600x400/1e293b/ffffff?text='+encodeURIComponent(/^[\x20-\x7E]*$/.test(this.alt||'')?this.alt:'Image');}else{this.onerror=null;}">
        </div>
        <div class="product-details">
          <h3 class="product-title">${prod.name}</h3>
          <p class="product-desc">${prod.desc}</p>
          <div class="product-footer">
            <span class="product-price">₹${prod.price.toLocaleString('en-IN')}</span>
            <button class="btn add-to-cart-btn" data-id="${prod.id}">
              <span>+ कार्ट में जोड़ें</span>
            </button>
          </div>
        </div>
      </div>
    `;
    grid.insertAdjacentHTML('beforeend', cardHtml);
  });

  // Resolve images dynamically for JavaScript-inserted elements
  grid.querySelectorAll('img[data-query]:not([src])').forEach(resolveImage);

  // Add event listeners to "Add to Cart" buttons
  grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const prodId = e.currentTarget.dataset.id;
      const product = PRODUCTS_SEED.find(p => p.id === prodId);
      if (product) {
        addToCart({
          id: product.id,
          title: product.name,
          price: product.price,
          imgQuery: product.query,
          qty: 1
        });
        showToast(`'${product.name}' कार्ट में जोड़ा गया! 🌸`);
      }
    });
  });
}

function initCatalogFilters() {
  const searchInput = document.getElementById('searchInput');
  const filterTabs = document.getElementById('filterTabs');
  let currentCat = 'all';

  filterTabs.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-btn')) {
      filterTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentCat = e.target.dataset.category;
      renderCatalog(currentCat, searchInput.value);
    }
  });

  searchInput.addEventListener('input', (e) => {
    renderCatalog(currentCat, e.target.value);
  });
}

// ══════════════════════════════════════════════════════
// 6. CUSTOM BOUQUET BUILDER INTERACTION
// ══════════════════════════════════════════════════════
function initBouquetBuilder() {
  const flowerRows = document.querySelectorAll('.flower-option-row');
  const wrapCards = document.querySelectorAll('.wrap-card');
  const ribbonDots = document.querySelectorAll('.color-dot');
  const noteInput = document.getElementById('customNoteInput');
  const addBtn = document.getElementById('addCustomToCartBtn');

  // Quantity Counters
  flowerRows.forEach(row => {
    const id = row.dataset.id;
    const decBtn = row.querySelector('.dec');
    const incBtn = row.querySelector('.inc');
    const cntVal = row.querySelector('.count-val');

    incBtn.addEventListener('click', () => {
      state.customBouquet.flowers[id]++;
      cntVal.textContent = state.customBouquet.flowers[id];
      updateBuilderSummary();
    });

    decBtn.addEventListener('click', () => {
      if (state.customBouquet.flowers[id] > 0) {
        state.customBouquet.flowers[id]--;
        cntVal.textContent = state.customBouquet.flowers[id];
        updateBuilderSummary();
      }
    });
  });

  // Wrapping selection
  wrapCards.forEach(card => {
    card.addEventListener('click', () => {
      wrapCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.customBouquet.wrap = {
        name: card.dataset.wrap,
        price: parseInt(card.dataset.price)
      };
      updateBuilderSummary();
    });
  });

  // Ribbon color selection
  ribbonDots.forEach(dot => {
    dot.addEventListener('click', () => {
      ribbonDots.forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      state.customBouquet.ribbon = dot.dataset.color;
      updateBuilderSummary();
    });
  });

  // Card Note
  noteInput.addEventListener('input', (e) => {
    state.customBouquet.note = e.target.value;
    updateBuilderSummary();
  });

  // Add Custom Bouquet to Cart
  addBtn.addEventListener('click', () => {
    const totalFlowersCount = Object.values(state.customBouquet.flowers).reduce((a, b) => a + b, 0);
    if (totalFlowersCount === 0) return;

    const summaryData = calculateBouquetPrice();
    const customItem = {
      id: 'custom_' + Date.now(),
      title: `कस्टम् हैंडक्राफ्टेड गुलदस्ता (${totalFlowersCount} फूल)`,
      price: summaryData.total,
      details: `${summaryData.flowerDetailsText} | wrapper: ${state.customBouquet.wrap.name} | रिबन: ${state.customBouquet.ribbon}`,
      imgQuery: 'Custom handcrafted romantic rose lily flower bouquet premium wrap',
      qty: 1
    };

    addToCart(customItem);
    showToast('आपका कस्टम गुलदस्ता सफलता से कार्ट में जोड़ा गया! 💐');

    // Reset Builder Form
    Object.keys(state.customBouquet.flowers).forEach(k => state.customBouquet.flowers[k] = 0);
    flowerRows.forEach(r => r.querySelector('.count-val').textContent = '0');
    noteInput.value = '';
    state.customBouquet.note = '';
    updateBuilderSummary();
  });
}

function calculateBouquetPrice() {
  const flowerPrices = { rose: 40, lily: 90, orchid: 75, carnation: 35 };
  const flowerNames = {
    rose: '🌹 रेड रोज़',
    lily: '🌸 व्हाइट लिली',
    orchid: '🪻 पर्पल आर्किड',
    carnation: '💐 पिंक कारनेशन'
  };

  let flowersCost = 0;
  let detailsArr = [];

  for (const [key, count] of Object.entries(state.customBouquet.flowers)) {
    if (count > 0) {
      flowersCost += count * flowerPrices[key];
      detailsArr.push(`${flowerNames[key]} × ${count}`);
    }
  }

  const wrapCost = state.customBouquet.wrap.price;
  const total = flowersCost + wrapCost;

  return {
    flowersCost,
    wrapCost,
    total,
    detailsArr,
    flowerDetailsText: detailsArr.join(', ')
  };
}

function updateBuilderSummary() {
  const summaryList = document.getElementById('summaryList');
  const flowersCostEl = document.getElementById('summaryFlowersCost');
  const wrapCostEl = document.getElementById('summaryWrapCost');
  const totalCostEl = document.getElementById('summaryTotalCost');
  const addBtn = document.getElementById('addCustomToCartBtn');
  const emptyText = document.querySelector('.empty-preview-text');

  const data = calculateBouquetPrice();

  if (data.detailsArr.length === 0) {
    emptyText.style.display = 'block';
    summaryList.innerHTML = '';
    addBtn.disabled = true;
  } else {
    emptyText.style.display = 'none';
    let html = data.detailsArr.map(item => `<li>• ${item}</li>`).join('');
    html += `<li style="margin-top:8px; color:var(--text-3);">• रैपिंग: ${state.customBouquet.wrap.name}</li>`;
    html += `<li style="color:var(--text-3);">• रिबन: ${state.customBouquet.ribbon}</li>`;
    if (state.customBouquet.note.trim()) {
      html += `<li style="color:var(--accent-2); font-style:italic;">• संदेश: "${state.customBouquet.note}"</li>`;
    }
    summaryList.innerHTML = html;
    addBtn.disabled = false;
  }

  flowersCostEl.textContent = `₹${data.flowersCost}`;
  wrapCostEl.textContent = `₹${data.wrapCost}`;
  totalCostEl.textContent = `₹${data.total.toLocaleString('en-IN')}`;
}

// ══════════════════════════════════════════════════════
// 7. CART DRAWER & PERSISTENCE
// ══════════════════════════════════════════════════════
function addToCart(item) {
  const existingIndex = state.cart.findIndex(i => i.id === item.id);
  if (existingIndex > -1) {
    state.cart[existingIndex].qty += item.qty;
  } else {
    state.cart.push(item);
  }
  saveAndUpdateCart();
}

function updateCartQty(id, delta) {
  const item = state.cart.find(i => i.id === id);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      state.cart = state.cart.filter(i => i.id !== id);
    }
    saveAndUpdateCart();
  }
}

function saveAndUpdateCart() {
  localStorage.setItem('pk_cart', JSON.stringify(state.cart));
  updateCartUI();
}

function updateCartUI() {
  const badge = document.getElementById('cartBadge');
  const countHeader = document.getElementById('cartCountHeader');
  const itemsList = document.getElementById('cartItemsList');
  const subtotalEl = document.getElementById('cartSubtotal');
  const gstEl = document.getElementById('cartGst');
  const totalEl = document.getElementById('cartGrandTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');

  const totalQty = state.cart.reduce((sum, item) => sum + item.qty, 0);
  badge.textContent = totalQty;
  countHeader.textContent = totalQty;

  let subtotal = 0;
  itemsList.innerHTML = '';

  if (state.cart.length === 0) {
    itemsList.innerHTML = `
      <div style="text-align: center; margin-top: 60px; color: var(--text-3);">
        <p style="font-size: 48px; margin-bottom: 12px;">🛍️</p>
        <p style="font-size: 16px; font-weight: 600;">आपकी कार्ट खाली है</p>
        <p style="font-size: 13px;">कृपया सुंदर फूलों का चयन करें</p>
      </div>`;
    checkoutBtn.disabled = true;
  } else {
    checkoutBtn.disabled = false;
    state.cart.forEach(item => {
      const itemSubtotal = item.price * item.qty;
      subtotal += itemSubtotal;

      const itemHtml = `
        <div class="cart-item">
          <img class="cart-item-img" data-query="${item.imgQuery || 'flower bouquet'}" alt="${item.title}"
               onerror="if(!this.dataset.fallback){this.dataset.fallback='1';this.src='https://placehold.co/100x100/1e293b/ffffff?text=Flower';}else{this.onerror=null;}">
          <div class="cart-item-details">
            <h4 class="cart-item-title">${item.title}</h4>
            <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')}</div>
            <div class="cart-qty-ctrl">
              <button class="cart-qty-btn dec-qty" data-id="${item.id}">-</button>
              <span>${item.qty}</span>
              <button class="cart-qty-btn inc-qty" data-id="${item.id}">+</button>
            </div>
          </div>
        </div>
      `;
      itemsList.insertAdjacentHTML('beforeend', itemHtml);
    });

    itemsList.querySelectorAll('img[data-query]:not([src])').forEach(resolveImage);

    // Qty click listeners
    itemsList.querySelectorAll('.dec-qty').forEach(b => {
      b.addEventListener('click', (e) => updateCartQty(e.target.dataset.id, -1));
    });
    itemsList.querySelectorAll('.inc-qty').forEach(b => {
      b.addEventListener('click', (e) => updateCartQty(e.target.dataset.id, 1));
    });
  }

  const gst = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + gst;

  subtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  gstEl.textContent = `₹${gst.toLocaleString('en-IN')}`;
  totalEl.textContent = `₹${grandTotal.toLocaleString('en-IN')}`;

  const payableEl = document.getElementById('checkoutPayable');
  if (payableEl) payableEl.textContent = `₹${grandTotal.toLocaleString('en-IN')}`;
}

function initCartDrawer() {
  const cartBtn = document.getElementById('cartBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartCloseBtn = document.getElementById('cartCloseBtn');
  const cartOverlay = document.getElementById('cartOverlay');

  function openCart() { cartDrawer.classList.add('open'); }
  function closeCart() { cartDrawer.classList.remove('open'); }

  cartBtn.addEventListener('click', openCart);
  cartCloseBtn.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);
}

// ══════════════════════════════════════════════════════
// 8. CHECKOUT & SUBSCRIPTION MODAL LOGIC
// ══════════════════════════════════════════════════════
function initCheckout() {
  const checkoutBtn = document.getElementById('checkoutBtn');
  const modal = document.getElementById('checkoutModal');
  const closeBtn = document.getElementById('modalCloseBtn');
  const checkoutForm = document.getElementById('checkoutForm');
  const cartDrawer = document.getElementById('cartDrawer');

  checkoutBtn.addEventListener('click', () => {
    cartDrawer.classList.remove('open');
    modal.classList.add('open');
  });

  closeBtn.addEventListener('click', () => modal.classList.remove('open'));

  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('custName').value;
    const phone = document.getElementById('custPhone').value;

    modal.classList.remove('open');
    showToast(`धन्यवाद ${name}! आपका ऑर्डर स्वीकार कर लिया गया है। 🎉`);

    // Reset Cart
    state.cart = [];
    saveAndUpdateCart();
    checkoutForm.reset();
  });

  // Subscription plan selection modal triggers
  document.querySelectorAll('.sub-select-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const planName = e.target.dataset.plan;
      showToast(`'${planName}' का चयन किया गया! हमारी टीम आपसे +91 40-2345-6789 पर शीघ्र संपर्क करेगी।`);
    });
  });
}

// ══════════════════════════════════════════════════════
// 9. INQUIRY FORM & TOAST NOTIFICATIONS
// ══════════════════════════════════════════════════════
function initInquiryForm() {
  const form = document.getElementById('inquiryForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('inqName').value;
      showToast(`धन्यवाद ${name}! आपकी पूछताछ प्राप्त हो गई है। हमारी टीम 30 मिनट में संपर्क करेगी।`);
      form.reset();
    });
  }
}

function showToast(msg) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}