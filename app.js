/* =============================================
   JM CATÁLOGOS WEB — app.js (multi-tenant)
   Detecta storeId por subdominio → fetch config
   ============================================= */

'use strict';

console.log('✅ APP.JS v20250430-FASE1 cargado correctamente');

let CONFIG   = {};
let PRODUCTS = [];
let lightboxStore = [];
let currentLightboxIndex = 0;
let currentSort = 'relevantes';
let categoryImages = {};

document.addEventListener('keydown', (e) => {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox || !lightbox.classList.contains('active')) return;
  if (e.key === 'ArrowLeft') changeLightboxImage(-1);
  if (e.key === 'ArrowRight') changeLightboxImage(1);
  if (e.key === 'Escape') closeLightbox(e);
});

// ══════════════════════════════════════════════
// API — backend multi-tenant
// ══════════════════════════════════════════════

const API_URL = 'https://aguamarina-backend-q7gd.onrender.com';

// Detecta storeId desde el subdominio
function detectStoreId() {
  // 1. Query param (override manual)
  const param = new URLSearchParams(window.location.search).get('store');
  if (param) return param;

  // 2. Subdominio: aguamarina.tucatalogo.com → aguamarina
  const host = window.location.hostname;
  const parts = host.split('.');
  // GitHub Pages: username.github.io → ignorar
  if (host.includes('github.io')) return null;

  if (parts.length >= 3 && !['www', 'pages', 'dev'].includes(parts[0])) {
    return parts[0];
  }

  // 3. Localhost / dev → aguamarina por defecto
  return 'aguamarina';
}

const STORE_ID = 'karaz';

function apiHeaders(extra = {}) {
  return { 'x-store-id': STORE_ID, ...extra };
}

function lsKey(key) {
  return `${STORE_ID}_${key}`;
}

// ══════════════════════════════════════════════
// UTILS
// ══════════════════════════════════════════════

function formatPrice(amount) {
  const sym = CONFIG.currencySymbol || '$';
  const n = Math.round(Number(amount));
  return `Ref. ${n}${sym}`;
}

function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

function showToast(msg, duration = 2400) {
  const toast = document.getElementById('toast');
  const text  = document.getElementById('toast-msg');
  if (!toast || !text) return;
  text.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}

function sanitize(str) {
  const d = document.createElement('div');
  d.textContent = String(str || '');
  return d.innerHTML;
}

function $(id) { return document.getElementById(id); }

function setText(id, val) {
  const el = $(id);
  if (el) el.textContent = val;
}

function setHTML(id, val) {
  const el = $(id);
  if (el) el.innerHTML = val;
}

function show(id) { const el = $(id); if (el) el.style.display = ''; }
function hide(id) { const el = $(id); if (el) el.style.display = 'none'; }

function setAttr(id, attr, val) {
  const el = $(id);
  if (el && val) el.setAttribute(attr, val);
}

// ══════════════════════════════════════════════
// CONFIG — detecta subdominio → fetch al backend
// ══════════════════════════════════════════════

async function loadConfig() {
  // Valores por defecto
  const defaults = {
    storeId: STORE_ID,
    whatsappNumber: '584242422452',
    currencySymbol: '$',
    currency: 'VES'
  };
  CONFIG = defaults;

  try {
    const res = await fetch(`${API_URL}/api/config?store=${STORE_ID}`);
    if (res.ok) {
      const apiConfig = await res.json();
      CONFIG = { ...defaults, ...apiConfig };
      
      // Cargar portadas de categorías desde la config
      if (CONFIG.categories && CONFIG.categories.length > 0) {
        CONFIG.categories.forEach(cat => {
          if (cat.imageUrl) {
            categoryImages[cat.id] = cat.imageUrl;
          }
        });
      }
    } else {
      console.error(`Store "${STORE_ID}" not found. HTTP ${res.status}`);
    }
  } catch (err) {
    console.error('Error loading config:', err);
  }
}

// ══════════════════════════════════════════════
// INJECT CONFIG — aplica config al DOM
// ══════════════════════════════════════════════

function injectConfig() {
  // Title
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = CONFIG.storeName || 'Karaz - Accesorios de calidad';

  // Favicon
  if (CONFIG.faviconUrl) {
    setAttr('favicon', 'href', CONFIG.faviconUrl);
  }

  // Meta description
  const metaDesc = document.getElementById('meta-description');
  if (metaDesc && CONFIG.storeName) {
    metaDesc.setAttribute('content', `${CONFIG.storeName} — ${CONFIG.storeTagline || 'Catálogo web con pedidos por WhatsApp'}`);
  }

  // Store name (all pages)
  const nameEl = $('store-name');
  if (nameEl && CONFIG.storeName) {
    const parts = CONFIG.storeName.split(' ');
    nameEl.innerHTML = parts.length > 1
      ? parts.slice(0, -1).join(' ') + ' <em>' + parts[parts.length - 1] + '</em>'
      : CONFIG.storeName;
  }

  // Store tagline
  if (CONFIG.storeTagline) setText('store-tagline', CONFIG.storeTagline);

  // Social links
  if (CONFIG.instagram) setAttr('ig-link', 'href', CONFIG.instagram);
  if (CONFIG.tiktok) setAttr('tt-link', 'href', CONFIG.tiktok);

  // WhatsApp FAB
  const waFab = $('wa-fab');
  if (waFab && CONFIG.whatsappNumber) {
    waFab.href = `https://wa.me/${CONFIG.whatsappNumber}?text=Hola!%20vi%20su%20tienda%20online%20%E2%9C%A8`;
  }

  // Hero
  if (CONFIG.logoUrl) {
    setAttr('store-logo', 'src', CONFIG.logoUrl);
    setAttr('store-logo', 'alt', CONFIG.storeName || 'Logo');
  }
  if (CONFIG.heroEyebrow) setText('hero-eyebrow', CONFIG.heroEyebrow);
  if (CONFIG.heroTitle) setHTML('hero-title', CONFIG.heroTitle);

  if (CONFIG.location) {
    setText('hero-location', CONFIG.location);
    show('hero-location-wrap');
    show('hero-info-sep');
  }
  if (CONFIG.phone) setText('hero-phone', CONFIG.phone);
  if (CONFIG.phoneLink) {
    setAttr('hero-phone-link', 'href', CONFIG.phoneLink);
    show('hero-phone-link');
  }

  // Categories — skip if already rendered in HTML (SSR optimization)
  const catCards = $('cat-cards');
  if (catCards && !catCards.children.length) {
    renderCategories();
  }

  // About section — already visible in HTML, just update if config differs
  if (CONFIG.about?.enabled) {
    if (CONFIG.about.imageUrl) {
      setAttr('about-image', 'src', CONFIG.about.imageUrl);
      setAttr('about-image', 'alt', CONFIG.storeName || '');
    }
    if (CONFIG.about.eyebrow) setText('about-eyebrow', CONFIG.about.eyebrow);
    if (CONFIG.about.title) setHTML('about-title', CONFIG.about.title);
    if (CONFIG.about.body) setText('about-body', CONFIG.about.body);

    const badgesEl = $('about-badges');
    if (badgesEl && CONFIG.about.badges?.length) {
      badgesEl.innerHTML = CONFIG.about.badges.map(b =>
        `<div class="about-badge"><span>${b.icon}</span><span>${sanitize(b.text)}</span></div>`
      ).join('');
    }
  }

  // Ebook section — already visible in HTML
  if (CONFIG.ebook?.enabled) {
    if (CONFIG.ebook.imageUrl) setAttr('ebook-image', 'src', CONFIG.ebook.imageUrl);
    if (CONFIG.ebook.eyebrow) setText('ebook-eyebrow', CONFIG.ebook.eyebrow);
    if (CONFIG.ebook.title) setHTML('ebook-title', CONFIG.ebook.title);
    if (CONFIG.ebook.body) setText('ebook-body', CONFIG.ebook.body);
    if (CONFIG.ebook.buttonText) setText('ebook-btn', CONFIG.ebook.buttonText);
    const waMsg = CONFIG.ebook.whatsappMessage || `Hola! quiero información sobre el ebook`;
    const ebookBtn = $('ebook-btn');
    if (ebookBtn) {
      ebookBtn.href = `https://wa.me/${CONFIG.whatsappNumber || ''}?text=${encodeURIComponent(waMsg)}`;
    }
  }

  // Footer
  if (CONFIG.storeName) {
    const footerName = $('footer-name');
    if (footerName) {
      const parts = CONFIG.storeName.split(' ');
      footerName.innerHTML = parts.length > 1
        ? parts.slice(0, -1).join(' ') + ' <em>' + parts[parts.length - 1] + '</em>'
        : CONFIG.storeName;
    }
  }
  if (CONFIG.storeTagline) setText('footer-tagline', CONFIG.storeTagline);
  if (CONFIG.location) {
    setText('footer-location', CONFIG.location);
    show('footer-location-wrap');
  }
  if (CONFIG.phone) {
    setText('footer-phone', CONFIG.phone);
    setAttr('footer-phone', 'href', CONFIG.phoneLink || '#');
    show('footer-phone-wrap');
  }
  if (CONFIG.instagram) {
    setAttr('footer-ig', 'href', CONFIG.instagram);
    if (CONFIG.instagramHandle) setText('footer-ig-handle', CONFIG.instagramHandle);
    show('footer-ig');
  }
  if (CONFIG.tiktok) {
    setAttr('footer-tt', 'href', CONFIG.tiktok);
    if (CONFIG.tiktokHandle) setText('footer-tt-handle', CONFIG.tiktokHandle);
    show('footer-tt');
  }

  // Admin pages
  if (CONFIG.storeName) {
    setText('admin-login-store', CONFIG.storeName);
    setText('admin-topbar-store', CONFIG.storeName);
  }
}

// ══════════════════════════════════════════════
// CATEGORIES — render dinámico desde config o auto-detect
// ══════════════════════════════════════════════

const DEFAULT_CATEGORIES = [
  { id: 'pulseras', label: '🧵 Pulseras', imageUrl: '', ctaText: 'Ver colección →' },
  { id: 'collares', label: '📿 Collares', imageUrl: '', ctaText: 'Ver colección →' },
  { id: 'mayoristas', label: '📦 Mayoristas', imageUrl: '', ctaText: 'Ver packs →' }
];

function getCategories() {
  if (CONFIG.categories?.length) return CONFIG.categories;
  // Auto-detect from products
  const cats = [...new Set(PRODUCTS.map(p => p.category))];
  return cats.map(id => DEFAULT_CATEGORIES.find(d => d.id === id) || { id, label: id, imageUrl: '', ctaText: 'Ver →' });
}

function buildCategoryImages() {
  categoryImages = {};
  // Las portadas ya se cargan en loadConfig() desde el backend
  // Aquí solo usamos los datos ya cargados o fallback a productos
  const cats = getCategories();
  cats.forEach(cat => {
    // Ya viene de loadConfig en categoryImages[cat.id]
    // Si no existe, usar el primer producto como fallback
    if (!categoryImages[cat.id]) {
      const prods = PRODUCTS.filter(p => p.category === cat.id);
      if (prods.length > 0 && prods[0].image) {
        categoryImages[cat.id] = prods[0].image;
      }
    }
  });
}

function sortProducts(products, sortType = currentSort) {
  const productsCopy = [...products];
  
  if (sortType === 'menor-mayor') {
    return productsCopy.sort((a, b) => parseInt(a.price) - parseInt(b.price));
  }
  if (sortType === 'mayor-menor') {
    return productsCopy.sort((a, b) => parseInt(b.price) - parseInt(a.price));
  }
  
  // Por defecto: relevantes (destacados > recientes > visitas)
  return productsCopy.sort((a, b) => {
    // Primero destacados (destacadoOrden 1 o 2)
    if (a.destacadoOrden > 0 && b.destacadoOrden === 0) return -1;
    if (b.destacadoOrden > 0 && a.destacadoOrden === 0) return 1;
    if (a.destacadoOrden > 0 && b.destacadoOrden > 0) {
      return a.destacadoOrden - b.destacadoOrden;
    }
    
    // Luego recientes (4 más recientes sin destacado)
    const aReciente = !a.destacadoOrden && a.creadoAt;
    const bReciente = !b.destacadoOrden && b.creadoAt;
    if (aReciente && !bReciente) return -1;
    if (!aReciente && bReciente) return 1;
    if (aReciente && bReciente) {
      return new Date(b.creadoAt) - new Date(a.creadoAt);
    }
    
    // Finalmente por visitas
    return (b.visitas || 0) - (a.visitas || 0);
  });
}

function isRecentProduct(product, allProducts) {
  const categoryProducts = allProducts.filter(p => 
    p.category === product.category && !p.destacadoOrden
  );
  const sorted = categoryProducts.sort((a, b) => 
    new Date(b.creadoAt || 0) - new Date(a.creadoAt || 0)
  );
  return sorted.slice(0, 4).some(p => p.id === product.id);
}

function changeSort(value) {
  currentSort = value;
  const gridWrap = $('catalog-grid-wrap');
  const activeCat = document.querySelector('.cat-card.active')?.dataset?.cat || 
                   new URLSearchParams(window.location.search).get('cat') ||
                   (gridWrap && gridWrap.classList.contains('visible') ? $('catalog-active-title')?.textContent?.toLowerCase() : null);
  if (activeCat) {
    const products = PRODUCTS.filter(p => p.category === activeCat);
    const sortedProducts = sortProducts(products, value);
    renderGrid(sortedProducts);
  }
}

function renderCategories() {
  const container = $('cat-cards');
  if (!container) return;

  const cats = getCategories();
  if (!cats.length) return;

  container.innerHTML = cats.map(cat => `
    <div class="cat-card" data-cat="${sanitize(cat.id)}">
      <div class="cat-card__img-wrap">
        <img src="${sanitize(cat.imageUrl || `https://placehold.co/600x400/D6F2EE/1A8A78?text=${encodeURIComponent(cat.label)}`)}"
             alt="${sanitize(cat.label)}" class="cat-card__img"
             onerror="this.src='https://placehold.co/600x400/D6F2EE/1A8A78?text=${encodeURIComponent(cat.label)}'">
        <div class="cat-card__overlay"></div>
        <div class="cat-card__content">
          <span class="cat-card__label">${sanitize(cat.label)}</span>
          <span class="cat-card__cta">${sanitize(cat.ctaText || 'Ver →')}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// ══════════════════════════════════════════════
// PRODUCTOS — carga desde API → fallback productos.json
// ══════════════════════════════════════════════

function mapProduct(p) {
  if (p.codigo) {
    return {
      id:             p.codigo,
      name:           p.nombre,
      price:          p.precio,
      category:       p.categoria,
      description:    p.descripcion || '',
      image:          p.imagen || '',
      imagen2:        p.imagen2 || '',
      imagen3:        p.imagen3 || '',
      stock:          p.stock || 0,
      destacadoOrden: p.destacadoOrden || 0,
    };
  }
  return p;
}

async function loadProducts() {
  try {
    console.log('🔄 Cargando productos desde API...');
    const res = await fetch(`${API_URL}/api/productos`, {
      headers: apiHeaders()
    });
    const data = await res.json();
    console.log('📦 Datos crudos del backend:', data.length, 'productos');
    if (data.length > 0) {
      // DEBUG: mostrar primer producto crudo para ver si tiene destacadoOrden
      console.log('🔍 Primer producto crudo:', { 
        nombre: data[0].nombre || data[0].name, 
        destacadoOrden: data[0].destacadoOrden,
        categoria: data[0].categoria || data[0].category
      });
      PRODUCTS = data.filter(p => p.activo !== false).map(mapProduct);
      // DEBUG: verificar que destacadoOrden llega después de mapProduct
      const conDestacado = PRODUCTS.filter(p => p.destacadoOrden > 0);
      console.log('✅ Productos mapeados:', PRODUCTS.length);
      console.log('🔥 Destacados encontrados:', conDestacado.length);
      if (conDestacado.length > 0) {
        console.log('🔥 Lista de destacados:', conDestacado.map(p => ({name: p.name, orden: p.destacadoOrden})));
      }
      return;
    }
  } catch(err) {
    console.error('❌ Error cargando productos:', err);
  }
  // Fallback: cargar desde JSON local solo si API falla
  try {
    const res = await fetch('productos.json');
    PRODUCTS = await res.json();
    console.log('📦 Productos cargados desde JSON local (fallback):', PRODUCTS.length);
  } catch {
    PRODUCTS = [];
  }
}

function getProductById(id) {
  return PRODUCTS.find(p => p.id === String(id));
}

// ══════════════════════════════════════════════
// CART
// ══════════════════════════════════════════════

function getCart() {
  try { return JSON.parse(localStorage.getItem(lsKey('cart_v2'))) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(lsKey('cart_v2'), JSON.stringify(cart));
  updateCartUI();
}

function addToCart(product) {
  const cart     = getCart();
  const pid      = String(product.id);
  const existing = cart.find(i => i.id === pid);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: pid, name: product.name, price: product.price, image: product.image || '', qty: 1 });
  }
  saveCart(cart);
  showToast(`✓ ${product.name} agregado`);
}

function removeFromCart(id)  { saveCart(getCart().filter(i => i.id !== id)); }
function clearCart()         { localStorage.removeItem(lsKey('cart_v2')); updateCartUI(); }
function cartTotal()         { return getCart().reduce((s, i) => s + i.price * i.qty, 0); }
function cartCount()         { return getCart().reduce((s, i) => s + i.qty, 0); }

function setQty(id, qty) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  if (qty < 1) { removeFromCart(id); return; }
  item.qty = qty;
  saveCart(cart);
}

function updateCartUI() {
  const count  = cartCount();
  const total  = cartTotal();
  const badge  = $('cart-badge');
  const bar    = $('bottom-cart-bar');
  const barCnt = $('bcb-count');
  const barTot = $('bcb-total');
  if (badge) { badge.textContent = count; badge.classList.toggle('visible', count > 0); }
  if (bar) {
    bar.classList.toggle('visible', count > 0);
    if (barCnt) barCnt.textContent = `${count} producto${count !== 1 ? 's' : ''}`;
    if (barTot) barTot.textContent = formatPrice(total);
  }
}

// ══════════════════════════════════════════════
// WHATSAPP
// ══════════════════════════════════════════════

function buildWhatsAppURL() {
  const cart = getCart();
  if (!cart.length) return '#';
  const lines   = cart.map(i => `• ${i.name} x${i.qty} — ${formatPrice(i.price * i.qty)}`).join('\n');
  const total   = formatPrice(cartTotal());
  const name    = CONFIG.storeName || 'Tienda';
  const number  = CONFIG.whatsappNumber || '';
  const message = `Hola! quiero hacer un pedido en *${name}* ✨\n\n${lines}\n\n*Total: ${total}*\n\n¿Me confirmas disponibilidad y coordinamos el envío? 🚚`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

// ══════════════════════════════════════════════
// CATALOG  (index.html)
// ══════════════════════════════════════════════

async function initCatalog() {
  await loadConfig();
  injectConfig();
  await loadProducts();
  buildCategoryImages();
  updateCartUI();
  initCatCards();

  const catParam = getParam('cat');
  if (catParam) openCategory(catParam);
}

function getCatLabel(id) {
  const cats = getCategories();
  const cat = cats.find(c => c.id === id);
  return cat ? cat.label : null;
}

function initCatCards() {
  // Actualizar imágenes de las tarjetas con las portadas del backend
  document.querySelectorAll('.cat-card').forEach(card => {
    const catId = card.dataset.cat;
    // Usar imagen de portada del backend (cargada en loadConfig)
    if (categoryImages[catId]) {
      const imgEl = card.querySelector('.cat-card__img');
      if (imgEl) imgEl.src = categoryImages[catId];
    }
    card.addEventListener('click', () => {
      openCategory(catId);
    });
  });
  
  $('catalog-back')?.addEventListener('click', () => {
    closeCategory();
  });
}

function openCategory(cat) {
  const cards = $('cat-cards');
  const gridWrap = $('catalog-grid-wrap');

  cards.style.opacity = '0';
  cards.style.transform = 'translateY(-12px)';

  setTimeout(() => {
    cards.classList.add('hidden-mobile');
    cards.style.display = 'none';
    gridWrap.style.display = 'block';

    const titleEl = $('catalog-active-title');
    if (titleEl) titleEl.textContent = getCatLabel(cat) || cat;

    // Imagen de encabezado de categoría - ya no se muestra
    const headerEl = $('category-header-img');
    if (headerEl) {
      headerEl.style.display = 'none';
    }

    const products = PRODUCTS.filter(p => p.category === cat);
    const sortedProducts = sortProducts(products);
    renderGrid(sortedProducts);

    gridWrap.classList.add('visible');
    const navH = $('navbar').offsetHeight;
    const top = document.querySelector('.catalog-main').offsetTop - navH;
    window.scrollTo({ top, behavior: 'smooth' });
  }, 280);
}

function closeCategory() {
  const cards = $('cat-cards');
  const gridWrap = $('catalog-grid-wrap');

  gridWrap.classList.remove('visible');
    cards.classList.remove('hidden-mobile');

  setTimeout(() => {
    gridWrap.style.display = 'none';
    cards.classList.remove('visible');
    cards.style.cssText = '';
    cards.style.display = '';

    cards.style.opacity = '1';
    cards.style.transform = 'translateY(0)';

    const navH = $('navbar').offsetHeight;
    const top = document.querySelector('.catalog-main').offsetTop - navH;
    window.scrollTo({ top, behavior: 'smooth' });
  }, 300);
}

function cloudinaryThumb(url, size = 400) {
  if (!url || !url.includes('cloudinary')) return url;
  return url.replace('/upload/', `/upload/w_${size},h_${size},c_fill,f_auto,q_auto:eco/`);
}

function renderCard(p) {
  const imgSrc = cloudinaryThumb(p.image) || `https://placehold.co/400x400/D6F2EE/1A8A78?text=${encodeURIComponent(p.name)}`;
  
  // DEBUG: mostrar info del primer producto de cada render
  if (!window._debugRenderCardCount) window._debugRenderCardCount = 0;
  if (window._debugRenderCardCount < 3) {
    console.log('🎴 renderCard:', p.name, '| destacadoOrden:', p.destacadoOrden, '| category:', p.category);
    window._debugRenderCardCount++;
  }
  
  // Iconos de destacado y reciente
  let badges = '';
  if (p.destacadoOrden > 0) {
    badges += '<span class="product-badge product-badge--fire">🔥 Destacado</span>';
  }
  const esReciente = isRecentProduct(p, PRODUCTS);
  if (esReciente) {
    badges += '<span class="product-badge product-badge--new">✨ New</span>';
  }
  
  return `
    <article class="product-card" onclick="goToProduct('${p.id}')">
      <div class="product-card__media">
        <img class="product-card__img"
          src="${sanitize(imgSrc)}"
          alt="${sanitize(p.name)}"
          loading="lazy"
          onerror="this.src='https://placehold.co/400x400/D6F2EE/1A8A78?text=✨'">
        ${badges ? `<div class="product-card__badges">${badges}</div>` : ''}
      </div>
      <div class="product-card__body">
        <div class="product-card__name">${sanitize(p.name)}</div>
        <div class="product-card__price">${formatPrice(p.price)}</div>
        <button class="product-card__btn"
          onclick="event.stopPropagation(); quickAddToCart('${p.id}', this)">
          Añadir al carrito
        </button>
      </div>
    </article>`;
}

function renderGrid(products) {
  const grid = $('products-grid');
  if (!grid) return;
  if (!products.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--mid)">
      <div style="font-size:3rem;margin-bottom:16px;opacity:.3">💎</div>
      <p style="font-family:var(--font-display);font-size:1.3rem;color:var(--dark)">Sin productos en esta categoría</p>
    </div>`;
    return;
  }
  grid.innerHTML = products.map(p => renderCard(p)).join('');
}

function goToProduct(id) { window.location.href = `product.html?id=${id}`; }

function quickAddToCart(id, btn) {
  const product = getProductById(id);
  if (!product) { showToast('Producto no encontrado'); return; }
  addToCart(product);
  const orig = btn.textContent;
  btn.textContent = '✓ Agregado';
  setTimeout(() => { btn.textContent = orig; }, 1500);
}

// ══════════════════════════════════════════════
// PRODUCT DETAIL  (product.html)
// ══════════════════════════════════════════════

async function initProductDetail() {
  lightboxStore = [];
  await loadConfig();
  injectConfig();
  await loadProducts();
  updateCartUI();

  const product = getProductById(getParam('id'));
  if (!product) {
    $('product-detail').innerHTML = `
      <div style="text-align:center; padding:80px 20px;">
        <div style="font-size:3rem; margin-bottom:16px; opacity:.3">💎</div>
        <p style="font-family:var(--font-display); font-size:1.4rem; color:var(--mid);">Producto no encontrado</p>
        <a href="index.html" style="color:var(--teal); font-size:.85rem; margin-top:14px; display:block;">← Volver</a>
      </div>`;
    return;
  }
  renderProductDetail(product);
  
  // Incrementar visitas (sin esperar respuesta)
  fetch(`${API_URL}/api/productos/${product.id}/visita`, {
    method: 'PUT',
    headers: apiHeaders()
  }).catch(() => {});
  
  // Lightbox: soporte para desktop y móvil
  setTimeout(() => {
    const mainImg = document.querySelector('.product-detail__main-img');
    const openFn = () => openLightbox(window.currentImageIndex || 0);
    mainImg?.addEventListener('click', openFn);
    mainImg?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      openFn();
    }, { passive: false });
  }, 100);
}

function renderProductDetail(p) {
const cat = CONFIG.categories?.find(c => c.id === p.category);
  const backUrl = `index.html?cat=${encodeURIComponent(p.category)}`;
  document.title = `${p.name} · Karaz`;
  
  const images = [p.image, p.imagen2, p.imagen3].filter(Boolean);
  window.currentProductImages = images;
  window.currentImageIndex = 0;
  
  const mainImg = images[0] || `https://placehold.co/600x600/D6F2EE/1A8A78?text=${encodeURIComponent(p.name)}`;
  
  lightboxStore = images.length ? images : [mainImg];
  
  const imageCounter = images.length > 1 
    ? `<div class="image-counter">${window.currentImageIndex + 1}/${images.length}</div>` 
    : '';

  $('product-detail').innerHTML = `
    <div class="product-detail__gallery">
      <a href="${backUrl}" class="back-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        <span>Volver</span>
      </a>
      <div class="product-detail__main-wrapper">
        ${images.length > 1 ? `<button class="gallery-nav gallery-nav--prev" onclick="changeGalleryImage(-1)">&#10094;</button>` : ''}
        <img src="${sanitize(mainImg)}" alt="${sanitize(p.name)}"
          class="product-detail__main-img"
          onclick="openLightbox(window.currentImageIndex)"
          onerror="this.src='https://placehold.co/600x600/D6F2EE/1A8A78?text=✨'">
        ${images.length > 1 ? `<button class="gallery-nav gallery-nav--next" onclick="changeGalleryImage(1)">&#10095;</button>` : ''}
        ${imageCounter}
      </div>
    </div>
    <div class="product-detail__info">
      <p class="product-detail__cat">${sanitize(cat ? cat.label : p.category)}</p>
      <h1 class="product-detail__name">${sanitize(p.name)}</h1>
      <p class="product-detail__price">${formatPrice(p.price)}</p>
      ${p.description ? `<p class="product-detail__desc">${sanitize(p.description)}</p>` : ''}
      <div class="product-detail__actions">
        <button class="btn-primary" id="detail-add-btn"
          onclick="addToCart(${JSON.stringify(p).replace(/"/g,'&quot;')}); this.textContent='✓ Agregado!'">
          Agregar al carrito
        </button>
        <a href="cart.html" class="btn-outline">Ver carrito</a>
      </div>
    </div>`;
}

// ══════════════════════════════════════════════
// CART PAGE  (cart.html)
// ══════════════════════════════════════════════

async function initCart() {
  await loadConfig();
  injectConfig();
  document.title = 'Karaz - Accesorios de calidad';
  updateCartUI();
  renderCartPage();
}

function renderCartPage() {
  const itemsEl   = $('cart-items');
  const summaryEl = $('cart-summary');
  if (!itemsEl) return;

  const cart = getCart();

  if (!cart.length) {
    itemsEl.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty__icon">🛒</div>
        <p class="cart-empty__title">Tu carrito está vacío</p>
        <p class="cart-empty__sub">Descubre nuestras piezas únicas ✨</p>
        <a href="index.html" class="btn-primary"
          style="display:inline-flex; padding:13px 28px; text-decoration:none; border-radius:var(--r-md);">
          Ver catálogo
        </a>
      </div>`;
    if (summaryEl) summaryEl.innerHTML = '';
    return;
  }

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img class="cart-item__img"
        src="${sanitize(cloudinaryThumb(item.image, 150) || '')}"
        alt="${sanitize(item.name)}"
        onerror="this.style.background='var(--teal-ultra)'">
      <div class="cart-item__info">
        <div class="cart-item__name">${sanitize(item.name)}</div>
        <div class="cart-item__unit-price">${formatPrice(item.price)} c/u</div>
        <div class="qty-row">
          <button class="qty-btn" onclick="changeQty('${item.id}', -1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
        </div>
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
        <span class="cart-item__subtotal">${formatPrice(item.price * item.qty)}</span>
        <button class="cart-item__remove" onclick="removeItemAndRefresh('${item.id}')">🗑</button>
      </div>
    </div>`).join('');

  const count = cartCount();
  const waUrl = buildWhatsAppURL();

  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="cart-summary">
        <div class="summary-row"><span>${count} producto${count !== 1 ? 's' : ''}</span><span style="color:var(--teal-dark)">✓</span></div>
        <div class="summary-row"><span>Envío</span><span style="color:var(--teal-dark)">A coordinar 🚚</span></div>
        <hr class="summary-divider">
        <div class="summary-total">
          <span class="summary-total__label">Total</span>
          <span class="summary-total__value">${formatPrice(cartTotal())}</span>
        </div>
      </div>
      <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        Enviar pedido por WhatsApp
      </a>
      <button class="btn-cancel" style="width:100%; margin-top:8px;" onclick="confirmClear()">Vaciar carrito</button>`;
  }
}

function changeQty(id, delta) {
  const item = getCart().find(i => i.id === id);
  if (!item) return;
  const newQty = item.qty + delta;
  if (newQty < 1) { removeItemAndRefresh(id); return; }
  setQty(id, newQty);
  renderCartPage();
}

function removeItemAndRefresh(id) { removeFromCart(id); renderCartPage(); }
function confirmClear() { if (confirm('¿Vaciar carrito?')) { clearCart(); renderCartPage(); } }

// ══════════════════════════════════════════════
// ADMIN  (admin.html) — backend multi-tenant
// ══════════════════════════════════════════════

// ══════════════════════════════════════════════
// LIGHTBOX for product images
// ══════════════════════════════════════════════

function openLightbox(index) {
  if (!lightboxStore || !lightboxStore.length) return;
  
  currentLightboxIndex = index !== undefined ? index : window.currentImageIndex;
  const lightbox = $('lightbox');
  const img = $('lightbox-img');
  if (lightbox && img && lightboxStore[currentLightboxIndex]) {
    img.src = lightboxStore[currentLightboxIndex];
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeLightbox(event) {
  if (event && event.target !== event.currentTarget && event.target.tagName === 'IMG') return;
  const lightbox = $('lightbox');
  if (lightbox) {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function changeLightboxImage(delta) {
  if (!lightboxStore.length) return;
  currentLightboxIndex += delta;
  if (currentLightboxIndex < 0) currentLightboxIndex = lightboxStore.length - 1;
  if (currentLightboxIndex >= lightboxStore.length) currentLightboxIndex = 0;
  const img = $('lightbox-img');
  if (img) img.src = lightboxStore[currentLightboxIndex];
}

function changeGalleryImage(delta) {
  const images = window.currentProductImages;
  if (!images || images.length <= 1) return;
  
  window.currentImageIndex = (window.currentImageIndex + delta + images.length) % images.length;
  const newSrc = images[window.currentImageIndex];
  
  const mainImg = document.querySelector('.product-detail__main-img');
  if (mainImg) mainImg.src = newSrc;
  
  const counter = document.querySelector('.image-counter');
  if (counter) counter.textContent = `${window.currentImageIndex + 1}/${images.length}`;
}
