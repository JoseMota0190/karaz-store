// ══════════════════════════════════════════════
// ADMIN.JS — Panel de administración Karaz
// Extraído de admin.html para eliminar duplicación con app.js
// ══════════════════════════════════════════════

// Migración de localStorage keys viejas → nuevas
(function migrateStorage() {
  var oldAuth = localStorage.getItem('karaz_logged');
  if (oldAuth && !localStorage.getItem('karaz_admin_auth')) {
    localStorage.setItem('karaz_admin_auth', oldAuth);
  }
  var oldCat = localStorage.getItem('adminActiveCategory');
  if (oldCat && !localStorage.getItem('karaz_admin_category')) {
    localStorage.setItem('karaz_admin_category', oldCat);
  }
})();

// Función global para cerrar el alert modal
function cerrarAlertModal(result) {
  var modal = document.getElementById('alertModal');
  if (modal) modal.classList.remove('show');
  if (window._confirmCallback) {
    if (result === true && window._confirmCallback.onConfirm) {
      window._confirmCallback.onConfirm();
    } else if (result === false && window._confirmCallback.onCancel) {
      window._confirmCallback.onCancel();
    }
    window._confirmCallback = null;
  }
}

function eliminarOtroProducto() {
  document.getElementById('deleteSuccessModal').style.display = 'none';
  var API = 'https://aguamarina-backend-q7gd.onrender.com';
  var STORE = 'karaz';

  fetch(API + '/api/productos', { headers: { 'x-store-id': STORE } })
  .then(function(res) { return res.json(); })
  .then(function(prods) {
    productos = prods.filter(function(p) { return p.activo !== false; }).map(function(p) {
      if (p.codigo) {
        return { codigo: p.codigo, nombre: p.nombre, precio: p.precio, categoria: p.categoria, descripcion: p.descripcion || '', imagen: p.imagen || '', imagen2: p.imagen2 || '', imagen3: p.imagen3 || '', stock: p.stock || 0, destacadoOrden: p.destacadoOrden || 0 };
      }
      return p;
    });

    var cat = localStorage.getItem('karaz_admin_category');
    var productsToShow = cat ? productos.filter(function(p) { return (p.categoria || p.category) === cat; }) : productos;
    if (productsToShow.length > 0) {
      showProductList(cat, 'eliminar');
    } else {
      showAlert('⚠️ Sin productos', 'No hay más productos para eliminar');
    }
  })
  .catch(function() {
    showAlert('⚠️ Error', 'No se pudo cargar los productos');
  });
}

function cerrarDeleteSuccessModal() {
  document.getElementById('deleteSuccessModal').style.display = 'none';
  location.reload();
}

function mostrarDeleteSuccessModal() {
  document.getElementById('deleteSuccessModal').style.display = 'flex';
}

// PROTEGER: Evitar conflictos con app.js
(function() {
  'use strict';

  var API = 'https://aguamarina-backend-q7gd.onrender.com';
  var STORE = 'karaz';
  var productos =[];
  var editando = null;
  var seleccionado = null;
  var currentMode = null;

  var cats = [
    { id: 'anillos', label: '💍 Anillos' },
    { id: 'pulseras', label: '💎 Pulseras' },
    { id: 'collares', label: '📿 Collares' },
    { id: 'aretes', label: '🎀 Aretes' },
    { id: 'earcuffs', label: '🎧 Earcuffs' },
    { id: 'sets', label: '✨ Sets' }
  ];

  function init() {
    renderFiltros();
    renderCats();
    if (localStorage.getItem(STORE + '_admin_auth')) mostrarAdmin();

    var el;
    el = document.getElementById('loginBtn'); if (el) el.onclick = login;
    el = document.getElementById('passInput'); if (el) el.onkeyup = function(e) { if(e.key==='Enter') login(); };
    el = document.getElementById('logoutBtn'); if (el) el.onclick = logout;
    el = document.getElementById('buscarInput'); if (el) el.oninput = filtrar;
    el = document.getElementById('nuevoBtn'); if (el) el.onclick = abrirNuevo;
    el = document.getElementById('editIntegratedBtn'); if (el) el.onclick = function() {
      window.currentEditMode = true;
      var currentCat = localStorage.getItem('karaz_admin_category');
      if (!currentCat) return;
      var filtered = productos.filter(function(p) {
        return (p.categoria || p.category) === currentCat;
      });
      filtered.sort(function(a, b) {
        return parseInt(a.precio || a.price || 0) - parseInt(b.precio || b.price || 0);
      });
      renderProductosConAcciones(filtered);
    };
    el = document.getElementById('btnNuevo'); if (el) el.onclick = function() {
      // Directamente abrir el formulario de nuevo producto
      abrirNuevo();
    };
    el = document.getElementById('btnEditar'); if (el) el.onclick = function() {
      if (productos.length === 0) {
        showAlert('⚠️ Catálogo vacío', 'No hay productos para editar');
        return;
      }
      showProductList(null, 'editar');
    };
    el = document.getElementById('btnEliminar'); if (el) el.onclick = function() {
      if (productos.length === 0) {
        showAlert('⚠️ Catálogo vacío', 'No hay productos para eliminar');
        return;
      }
      showProductList(null, 'eliminar');
    };
    el = document.getElementById('modalCloseBtn'); if (el) el.onclick = cerrarModal;
    el = document.getElementById('cancelBtn'); if (el) el.onclick = cerrarModal;
    el = document.getElementById('saveBtn'); if (el) el.onclick = guardar;
    el = document.getElementById('openFeaturedBtn'); if (el) el.onclick = function() {
      toggleFeaturedPanel();
      abrirModalDestacados();
    };
    el = document.getElementById('saveFeaturedBtn'); if (el) el.onclick = guardarDestacadosDesdeModal;
    el = document.getElementById('menuEditBtn'); if (el) el.onclick = abrirEditar;
    el = document.getElementById('menuDeleteBtn'); if (el) el.onclick = eliminar;
    el = document.getElementById('menuCloseBtn'); if (el) el.onclick = cerrarMenu;
    el = document.getElementById('uploadBox'); if (el) el.onclick = function() { document.getElementById('fileInput').click(); };
    el = document.getElementById('fileInput'); if (el) el.onchange = function() { subirFoto('fileInput', 'imageUrl', 'previewImg', 'uploadBox'); };
    el = document.getElementById('fileInput2'); if (el) el.onchange = function() { subirFoto('fileInput2', 'imageUrl2', 'previewImg2', 'uploadBox2'); };
    el = document.getElementById('fileInput3'); if (el) el.onchange = function() { subirFoto('fileInput3', 'imageUrl3', 'previewImg3', 'uploadBox3'); };
    el = document.getElementById('uploadBox2'); if (el) el.onclick = function() { document.getElementById('fileInput2').click(); };
    el = document.getElementById('uploadBox3'); if (el) el.onclick = function() { document.getElementById('fileInput3').click(); };
  }

  function renderFiltros() {
    var html = '';
    cats.forEach(function(c,i) {
      var active = '';
      html += '<button class="filtro-btn' + active + '" data-cat="' + c.id + '">' + c.label + '</button>';
    });
    document.getElementById('filtros').innerHTML = html;
    var btns = document.querySelectorAll('.filtro-btn');
    btns.forEach(function(btn) {
      btn.onclick = function() {
        btns.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var cat = btn.getAttribute('data-cat');
        localStorage.setItem('karaz_admin_category', cat);
        // Mostrar vista previa de categoría
        showCategoryPreview(cat);
      };
    });
  }

  function showCategoryPreview(cat) {
    var catLabel = '';
    cats.forEach(function(c) { if (c.id === cat) catLabel = c.label; });

    document.getElementById('logoArea').style.display = 'none';
    document.getElementById('editArea').style.display = 'none';
    document.getElementById('categoryPreview').style.display = 'block';

    // Renderizar portada
    renderPortadaPreview(cat);

    // Renderizar destacados
    renderDestacadosPreview(cat);

    // Asignar eventos a los botones
    var btnNuevo = document.getElementById('previewBtnNuevo');
    var btnEditar = document.getElementById('previewBtnEditar');
    var btnEliminar = document.getElementById('previewBtnEliminar');

    btnNuevo.onclick = function() { abrirNuevo(); };
    btnEditar.onclick = function() {
      var catProducts = productos.filter(function(p) { return (p.categoria || p.category) === cat; });
      if (catProducts.length === 0) {
        showAlert('⚠️ Sin productos', 'No hay productos en esta categoría para editar');
        return;
      }
      showProductList(cat, 'editar');
    };
    btnEliminar.onclick = function() {
      var catProducts = productos.filter(function(p) { return (p.categoria || p.category) === cat; });
      if (catProducts.length === 0) {
        showAlert('⚠️ Sin productos', 'No hay productos en esta categoría para eliminar');
        return;
      }
      showProductList(cat, 'eliminar');
    };
  }

  function renderPortadaPreview(cat) {
    // Leer portada del config del backend (cargado en loadConfig)
    var portadaImg = null;
    var esPortadaPersonalizada = false;
    if (window.CONFIG && window.CONFIG.categories) {
      window.CONFIG.categories.forEach(function(c) {
        if (c.id === cat && c.imageUrl) {
          portadaImg = c.imageUrl;
        }
      });
    }

    // Validación: verificar que la imagen de config pertenezca a un producto actual de la categoría
    if (portadaImg) {
      var productosCat = productos.filter(function(p) { return (p.categoria || p.category) === cat; });
      var existe = productosCat.some(function(p) {
        return p.imagen === portadaImg || p.imagen2 === portadaImg || p.imagen3 === portadaImg;
      });
      if (!existe) {
        portadaImg = null; // La imagen guardada ya no pertenece a esta categoría
      } else {
        esPortadaPersonalizada = true;
      }
    }

    var imgEl = document.getElementById('portadaImg');
    var placeholder = document.getElementById('portadaPlaceholder');
    var btnQuitar = document.getElementById('btnQuitarPortada');
    var previewDiv = document.getElementById('portadaPreview');

    // Resetear estilos del preview
    previewDiv.style.background = '';
    previewDiv.style.display = 'flex';

    if (portadaImg) {
      imgEl.src = portadaImg;
      imgEl.style.display = 'block';
      placeholder.style.display = 'none';
      previewDiv.style.background = 'white';
      if (btnQuitar) btnQuitar.style.display = 'inline-block';
    } else {
      // Fallback: fondo granate con nombre de categoría en dorado
      imgEl.style.display = 'none';
      placeholder.style.display = 'block';
      previewDiv.style.background = '#5C0F14';
      var catLabel = '';
      cats.forEach(function(c) { if (c.id === cat) catLabel = c.label; });
      placeholder.textContent = catLabel || cat;
      placeholder.style.color = '#C9A962';
      placeholder.style.fontSize = '1.3rem';
      placeholder.style.fontWeight = '600';
      if (btnQuitar) btnQuitar.style.display = 'none';
    }
  }

  function quitarPortada() {
    var cat = localStorage.getItem('karaz_admin_category');
    if (!cat) return;

    var pass = localStorage.getItem(STORE + '_admin_auth');
    var configData = { storeId: STORE };

    fetch(API + '/api/config?store=' + STORE)
      .then(function(res) { return res.json(); })
      .then(function(config) {
        var categories = (config.categories || []).map(function(c) {
          if (c.id === cat) {
            return { id: c.id, label: c.label || cat, imageUrl: '', ctaText: c.ctaText || 'Ver colección →' };
          }
          return { id: c.id, label: c.label || c.id, imageUrl: c.imageUrl || '', ctaText: c.ctaText || 'Ver colección →' };
        });
        configData.categories = categories;

        return fetch(API + '/api/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-store-id': STORE, 'x-admin-password': pass },
          body: JSON.stringify(configData)
        });
      })
      .then(function() {
        // Actualizar la config en memoria
        if (window.CONFIG && window.CONFIG.categories) {
          window.CONFIG.categories.forEach(function(c) {
            if (c.id === cat) c.imageUrl = '';
          });
        }
        showAlert('Portada eliminada', 'Se mostrará la imagen del primer producto de la categoría.');
        renderPortadaPreview(cat);
      })
      .catch(function() {
        showAlert('Error', 'No se pudo quitar la portada. Intenta de nuevo.');
      });
  }

  function ejecutarSanitizacion() {
    showConfirm(
      '🧹 Sanitizar tienda',
      '¿Deseas limpiar automáticamente los productos destacados inválidos y las portadas huérfanas?',
      function() {
        // Mostrar loading
        var btn = document.querySelector('button[onclick="ejecutarSanitizacion()"]');
        var originalText = btn ? btn.textContent : '';
        if (btn) {
          btn.textContent = '⏳ Sanitizando...';
          btn.disabled = true;
        }

        fetch(API + '/api/sanitizar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-store-id': STORE,
            'x-admin-password': localStorage.getItem(STORE + '_admin_auth') || ''
          }
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
          }

          var mensaje = '';
          if (data.results) {
            var d = data.results.destacados.limpiados;
            var p = data.results.portadas.limpiadas;
            if (d === 0 && p === 0) {
              mensaje = '¡Todo está limpio! No se encontraron destacados ni portadas inválidas.';
            } else {
              mensaje = 'Se limpiaron:\n';
              if (d > 0) mensaje += '• ' + d + ' producto(s) destacado(s) inválido(s)\n';
              if (p > 0) mensaje += '• ' + p + ' portada(s) huérfana(s)\n';
              mensaje += '\nRecargá la página para ver los cambios.';
            }
          } else {
            mensaje = data.message || 'Sanitización completada.';
          }
          showAlert('✅ Sanitización completada', mensaje);
        })
        .catch(function(err) {
          if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
          }
          console.error('Error en sanitización:', err);
          showAlert('❌ Error', 'No se pudo completar la sanitización. Intentá de nuevo.');
        });
      }
    );
  }

  function renderDestacadosPreview(cat) {
    var filtered = productos.filter(function(p) { return (p.categoria || p.category) === cat && p.destacadoOrden > 0; });
    var count = filtered.length;
    document.getElementById('destacadosCount').textContent = count + '/4';

    var container = document.getElementById('destacadosPreview');
    var html = '';
    for (var i = 1; i <= 4; i++) {
      var prod = filtered.find(function(p) { return p.destacadoOrden === i; });
      if (prod && prod.imagen) {
        html += '<div style="width:90px;height:90px;position:relative;"><img src="' + prod.imagen + '" style="width:100%;height:100%;object-fit:cover;border-radius:12px;"><span style="position:absolute;top:-8px;right:-8px;font-size:1.3rem;">🔥</span></div>';
      } else {
        html += '<div style="width:90px;height:90px;background:#eee;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:2rem;">+</div>';
      }
    }
    container.innerHTML = html;
  }

  function showPortadaProducts() {
    var cat = localStorage.getItem('karaz_admin_category');
    showProductList(cat, 'portada');
  }

  function showDestacadosProducts() {
    var cat = localStorage.getItem('karaz_admin_category');
    showProductList(cat, 'destacados');
  }

  function showProductList(cat, mode) {
    window.currentAdminMode = mode;
    currentMode = mode; // Sincronizar con la variable global para que funcione seleccionar()

    // Ocultar la página de inicio y mostrar el área de edición
    document.getElementById('logoArea').style.display = 'none';
    document.getElementById('categoryPreview').style.display = 'none';
    document.getElementById('editArea').style.display = 'block';
    document.getElementById('editAreaBackBtn').style.display = 'flex';
    // Ocultar paneles innecesarios
    document.getElementById('editIntegratedPanel').style.display = 'none';
    document.getElementById('featuredPanel').style.display = 'none';
    document.querySelector('.fab-container').style.display = 'none';

    // Si cat es null, mostrar todos los productos
    var filtered = cat
      ? productos.filter(function(p) { return (p.categoria || p.category) === cat; })
      : productos;
    filtered.sort(function(a, b) {
      var precioA = parseInt(a.precio || a.price || 0);
      var precioB = parseInt(b.precio || b.price || 0);
      return precioA - precioB;
    });
    
    // Inicializar pendingDestacados al entrar en modo destacados
    if (mode === 'destacados') {
      window.pendingDestacados = filtered
        .filter(function(p) { return p.destacadoOrden > 0; })
        .map(function(p) { return p.codigo || p.id; })
        .sort(function(a, b) {
          var prodA = productos.find(function(p) { return (p.codigo || p.id) === a; });
          var prodB = productos.find(function(p) { return (p.codigo || p.id) === b; });
          return (prodA ? prodA.destacadoOrden : 0) - (prodB ? prodB.destacadoOrden : 0);
        });
      actualizarBotonesDestacados();
    }
    
    renderProductosConAcciones(filtered);
  }

  function volverACategorias() {
    document.getElementById('editAreaBackBtn').style.display = 'none';
    var cat = localStorage.getItem('karaz_admin_category');
    if (cat) {
      showCategoryPreview(cat);
    } else {
      // Volver al inicio del admin
      document.getElementById('logoArea').style.display = 'block';
      document.getElementById('editArea').style.display = 'none';
    }
  }

  function activarModoEdicion() {
    window.currentEditMode = true;
    var currentCat = localStorage.getItem('karaz_admin_category');
    if (!currentCat) return;

    var filtered = productos.filter(function(p) {
      return (p.categoria || p.category) === currentCat;
    });
    filtered.sort(function(a, b) {
      var precioA = parseInt(a.precio || a.price || 0);
      var precioB = parseInt(b.precio || b.price || 0);
      return precioA - precioB;
    });
    renderProductosConAcciones(filtered);
  }

function renderProductosConAcciones(list) {
    var html = '';
    var currentCategory = localStorage.getItem('karaz_admin_category') || '';
    var mode = window.currentAdminMode;
    var isEditMode = window.currentEditMode === true;
    console.log('renderProductosConAcciones - mode:', mode, 'isEditMode:', isEditMode);

    // Agregar botón para nuevo producto si es modo nuevo
    if (mode === 'nuevo') {
      html += '<div style="grid-column:1/-1;padding:12px;"><button onclick="abrirNuevoDesdeCategoria()" style="padding:12px 20px;background:#5C0F14;color:white;border:none;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer;width:100%;">+ Agregar nuevo producto</button></div>';
    }
    
    // Mostrar instrucciones en modo destacados
    if (mode === 'destacados') {
      html += '<div style="grid-column:1/-1;padding:12px;background:#FFF5E6;border-radius:10px;margin-bottom:12px;text-align:center;"><span style="color:#5C0F14;font-size:0.9rem;">🔥 Tocá los productos para agregarlos o quitarlos de destacados</span></div>';
    }

    if (list.length === 0) {
      html += '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#666;">No hay productos</div>';
    } else {
      list.forEach(function(p) {
        var img = p.imagen || p.image || 'https://placehold.co/200x200/eee/999?text=📷';
        var nombre = p.nombre || p.name || 'Sin nombre';
        var precio = p.precio || p.price || 0;
        var prodId = p.codigo || p.id;
        var isFeatured = p.destacadoOrden > 0;
        
        // En modo destacados, usar pendingDestacados para el estado visual
        if (mode === 'destacados' && window.pendingDestacados) {
          isFeatured = window.pendingDestacados.indexOf(prodId) >= 0;
        }
        
        var fuegoIcon = isFeatured ? ' 🔥' : '';

        var clickAction = '';
        if (mode === 'editar' || mode === 'nuevo' || isEditMode) {
          clickAction = 'onclick="seleccionar(\'' + prodId + '\')"';
        } else if (mode === 'eliminar') {
          clickAction = 'onclick="seleccionar(\'' + prodId + '\')"';
        } else if (mode === 'portada') {
          clickAction = 'onclick="seleccionarPortada(\'' + prodId + '\')"';
        } else if (mode === 'destacados') {
          clickAction = 'onclick="seleccionarDestacado(\'' + prodId + '\')"';
        }

        var cursorStyle = clickAction ? 'cursor:pointer;' : '';

        var actionHtml = '';
        if (mode === 'eliminar') {
          actionHtml = '<div style="position:absolute;top:8px;right:8px;display:flex;gap:4px;"><button onclick="event.stopPropagation();eliminarProductoCard(\'' + prodId + '\')" style="width:32px;height:32px;background:white;border-radius:50%;border:1px solid #ddd;cursor:pointer;font-size:14px;">🗑️</button></div>';
        } else if (mode === 'portada') {
          actionHtml = '<div style="position:absolute;bottom:8px;right:8px;background:#5C0F14;color:white;padding:4px 8px;border-radius:4px;font-size:12px;">🖼️ Portada</div>';
        } else if (mode === 'destacados') {
          if (isFeatured) {
            actionHtml = '<div style="position:absolute;top:8px;left:8px;background:#5C0F14;color:white;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:600;">🔥 DESTACADO</div>';
          } else {
            actionHtml = '<div style="position:absolute;bottom:8px;right:8px;background:white;color:#5C0F14;border:2px solid #5C0F14;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:600;">+ Tocar para agregar</div>';
          }
        }

        html += '<div class="card" style="position:relative;' + cursorStyle + (isFeatured && mode === 'destacados' ? 'border:3px solid #D9BCA3;' : '') + '" ' + clickAction + '><img src="' + img + '"><div class="card-info"><div class="card-name">' + nombre + fuegoIcon + '</div><div class="card-precio">$' + precio + '</div></div>' + actionHtml + '</div>';
      });
    }
    document.getElementById('gridDisplay').innerHTML = html;
    document.getElementById('countDisplay').innerHTML = list.length + ' productos';

    // Show/hide featured panel button
    var featuredPanel = document.getElementById('featuredPanel');
    if (currentCategory) {
      featuredPanel.style.display = 'block';
    } else {
      featuredPanel.style.display = 'none';
    }
  }

  var featuredCurrentList = [];

  function toggleFeaturedPanel() {
    var content = document.getElementById('featuredContent');
    var arrow = document.getElementById('featuredArrow');
    if (content.style.display === 'none') {
      content.style.display = 'block';
      arrow.textContent = '▲';
    } else {
      content.style.display = 'none';
      arrow.textContent = '▼';
    }
  }

  function abrirModalDestacados() {
    var currentCat = localStorage.getItem('karaz_admin_category');
    if (!currentCat) return;

    var catProducts = productos.filter(function(p) {
      return (p.categoria || p.category) === currentCat;
    });
    catProducts.sort(function(a, b) {
      var precioA = parseInt(a.precio || a.price || 0);
      var precioB = parseInt(b.precio || b.price || 0);
      return precioA - precioB;
    });

    featuredCurrentList = catProducts;

    var html = '';
    catProducts.forEach(function(p) {
      var isFeatured = p.destacadoOrden > 0;
      var checked = isFeatured ? 'checked' : '';
      html += '<label style="display:flex;align-items:center;gap:8px;padding:8px;background:white;margin-bottom:6px;border-radius:6px;cursor:pointer;border:1px solid ' + (isFeatured ? '#5C0F14' : '#eee') + ';"><input type="checkbox" class="featured-checkbox" value="' + (p.codigo || p.id) + '" ' + checked + ' style="width:18px;height:18px;"><span style="flex:1;font-size:0.85rem;">' + (p.nombre || p.name || '') + '</span><span style="color:#5C0F14;font-weight:600;font-size:0.85rem;">$' + (p.precio || p.price || 0) + '</span>' + (isFeatured ? ' 🔥' : '') + '</label>';
    });

    var featuredCount = catProducts.filter(function(p) { return p.destacadoOrden > 0; }).length;
    document.getElementById('featuredList').innerHTML = html;
    document.getElementById('featuredCount').textContent = featuredCount + ' seleccionados de 4 permitidos';

    document.querySelectorAll('.featured-checkbox').forEach(function(cb) {
      cb.onchange = function() {
        var checked = document.querySelectorAll('.featured-checkbox:checked');
        if (checked.length > 4) {
          this.checked = false;
          showAlert('Máximo 4 productos destacados');
        }
        document.getElementById('featuredCount').textContent = checked.length + ' seleccionados de 4 permitidos';
      };
    });
  }

  function cerrarModalDestacados() {
    document.getElementById('featuredContent').style.display = 'none';
    document.getElementById('featuredArrow').textContent = '▼';
  }

  function guardarDestacadosDesdeModal() {
    var checkedBoxes = document.querySelectorAll('.featured-checkbox:checked');
    var selectedIds = Array.from(checkedBoxes).map(function(cb) { return cb.value; });

    if (selectedIds.length > 4) {
      showAlert('Máximo 4 productos destacados');
      return;
    }

    var token = localStorage.getItem(STORE + '_admin_auth');
    var currentCat = localStorage.getItem('karaz_admin_category');

    var updates = [];
    featuredCurrentList.forEach(function(p) {
      var prodId = p.codigo || p.id;
      var nuevoOrden = selectedIds.indexOf(prodId) + 1;
      var ordenAnterior = p.destacadoOrden || 0;

      if (nuevoOrden > 0 && nuevoOrden !== ordenAnterior) {
        updates.push({ id: prodId, destacadoOrden: nuevoOrden });
      } else if (nuevoOrden === 0 && ordenAnterior > 0) {
        updates.push({ id: prodId, destacadoOrden: 0 });
      }
    });

    if (updates.length === 0) {
      showToast('No hay cambios que guardar');
      cerrarModalDestacados();
      return;
    }

    var completed = 0;
    updates.forEach(function(u) {
      fetch(API + '/api/productos/' + u.id + '/destacado', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-store-id': STORE, 'x-admin-password': token },
        body: JSON.stringify({ destacadoOrden: u.destacadoOrden })
      })
      .then(function() {
        completed++;
        if (completed === updates.length) {
          showToast('Productos destacados actualizados');
          cerrarModalDestacados();
          cargarProductos();
        }
      })
      .catch(function() {
        completed++;
        if (completed === updates.length) {
          showToast('⚠️ Error al guardar algunos destacados');
        }
      });
    });
  }

  function abrirEditarCard(prodId) {
    var prod = productos.find(function(p) {
      return (p.codigo || p.id) === prodId;
    });
    if (!prod) {
      showAlert('Producto no encontrado. ID: ' + prodId);
      return;
    }
    document.getElementById('modalTitle').textContent = 'Editar';
    document.getElementById('productModal').classList.add('show');
    editando = prodId;

    var nombre = prod.nombre || prod.name || '';
    var precio = prod.precio || prod.price || '';
    var img1 = prod.imagen || prod.image || '';
    var img2 = prod.imagen2 || '';
    var img3 = prod.imagen3 || '';
    var categoria = prod.categoria || prod.category || '';

    document.getElementById('nameInput').value = nombre;
    document.getElementById('priceInput').value = precio;
    document.getElementById('descInput').value = prod.descripcion || prod.description || '';
    document.getElementById('codigoInput').value = prod.codigo || prod.id || '';

    // Foto 1
    document.getElementById('imageUrl').value = img1;
    // Foto 2
    document.getElementById('imageUrl2').value = img2;
    // Foto 3
    document.getElementById('imageUrl3').value = img3;

    // Categoría
    var catInputs = document.querySelectorAll('.cats input[name="cat"]');
    catInputs.forEach(function(input) { input.checked = false; });
    document.querySelectorAll('.cat').forEach(function(c) { c.classList.remove('active'); });
    if (categoria) {
      catInputs.forEach(function(input) {
        if (input.value === categoria) {
          input.checked = true;
          var parent = input.closest('.cat');
          if (parent) parent.classList.add('active');
        }
      });
    }

    // Delay para asegurar que el modal esté renderizado
    setTimeout(function() {
      if (img1) {
        var preview = document.getElementById('previewImg');
        var box = document.getElementById('uploadBox');
        preview.src = img1;
        preview.style.display = 'block';
        box.classList.add('show');
      }
      if (img2) {
        var preview2 = document.getElementById('previewImg2');
        var box2 = document.getElementById('uploadBox2');
        preview2.src = img2;
        preview2.style.display = 'block';
        box2.classList.add('show');
      }
      if (img3) {
        var preview3 = document.getElementById('previewImg3');
        var box3 = document.getElementById('uploadBox3');
        preview3.src = img3;
        preview3.style.display = 'block';
        box3.classList.add('show');
      }
    }, 150);

    currentProductId = prodId;
  }

  function eliminarProductoCard(prodId) {
    var token = localStorage.getItem(STORE + '_admin_auth');
    var currentCat = localStorage.getItem('karaz_admin_category');

    fetch(API + '/api/productos/' + prodId, {
      method: 'DELETE',
      headers: { 'x-store-id': STORE, 'x-admin-password': token }
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success || data.message) {
        mostrarDeleteSuccessModal();
        return fetch(API + '/api/productos', { headers: { 'x-store-id': STORE } });
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    })
    .then(function(res) { return res.json(); })
    .then(function(prods) {
      productos = prods.filter(function(p) { return p.activo !== false; }).map(function(p) {
        if (p.codigo) {
          return { codigo: p.codigo, nombre: p.nombre, precio: p.precio, categoria: p.categoria, descripcion: p.descripcion || '', imagen: p.imagen || '', imagen2: p.imagen2 || '', imagen3: p.imagen3 || '', stock: p.stock || 0, destacadoOrden: p.destacadoOrden || 0 };
        }
        return p;
      });
      if (currentCat) { showCategoryPreview(currentCat); }
    })
    .catch(function(err) { showToast('Error: ' + (err.message || 'Error de conexión')); });
  }

  function renderCats() {
    var html = '';
    cats.forEach(function(c) {
      html += '<label class="cat" onclick="selCat(this)"><input type="radio" name="cat" value="' + c.id + '">' + c.label + '</label>';
    });
    document.getElementById('catsContainer').innerHTML = html;
  }

  function login() {
    var pass = document.getElementById('passInput').value;
    var errorEl = document.getElementById('loginError');
    errorEl.classList.remove('show');
    errorEl.textContent = 'Datos incorrectos';

    fetch(API + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-store-id': STORE },
      body: JSON.stringify({ password: pass })
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      console.log('Login response:', d);
      if (d.success) {
        localStorage.setItem(STORE + '_admin_auth', pass);
        mostrarAdmin();
      } else {
        errorEl.textContent = d.message || 'Contraseña incorrecta';
        errorEl.classList.add('show');
      }
    })
    .catch(function(err) {
      console.log('Login error:', err);
      errorEl.textContent = 'Sin conexión al servidor';
      errorEl.classList.add('show');
    });
  }

  function logout() {
    console.log('🚪 Cerrando sesión...');
    // Borrar TODAS las keys posibles (viejas y nuevas)
    localStorage.removeItem(STORE + '_admin_auth');
    localStorage.removeItem(STORE + '_logged'); // key vieja
    localStorage.removeItem('karaz_logged'); // key vieja
    localStorage.removeItem('adminActiveCategory'); // key vieja
    localStorage.removeItem('karaz_admin_category');
    console.log('🗑️ localStorage limpiado');
    // Recargar la página para volver al login
    window.location.reload();
  }

  function mostrarAdmin() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('adminPage').classList.add('show');
    cargarProductos().then(function() {
      mostrarInicioAdmin();
    });
  }

  function mostrarInicioAdmin() {
    document.getElementById('logoArea').style.display = 'block';
    document.getElementById('categoryPreview').style.display = 'none';
    document.getElementById('editArea').style.display = 'none';
    document.getElementById('editAreaBackBtn').style.display = 'none';
  }

  function cargarProductos() {
    return fetch(API + '/api/productos', { headers: { 'x-store-id': STORE } })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      productos = d;
      filtrar();
    });
  }

  function filtrar() {
    if (!currentMode && !window.currentAdminMode) return;
    var busq = document.getElementById('buscarInput').value.toLowerCase();
    var cat = localStorage.getItem('karaz_admin_category');
    var productosCategoria = cat
      ? productos.filter(function(p) { return (p.categoria || p.category) === cat; })
      : productos;
    var filt = productosCategoria.filter(function(p) {
      var nombreProd = (p.nombre || p.name || '').toLowerCase();
      return !busq || nombreProd.includes(busq);
    });
    if (currentMode === 'editar' || window.currentAdminMode === 'editar') {
      renderEditar(filt);
    } else if (currentMode === 'eliminar' || window.currentAdminMode === 'eliminar') {
      renderEliminar(filt);
    } else {
      renderProductosConAcciones(filt);
    }
  }

  function mostrarModoEditar() {
    currentMode = 'editar';
    document.getElementById('logoArea').style.display = 'none';
    document.getElementById('editArea').style.display = 'block';
    document.getElementById('buscarInput').value = '';
    renderEditar(productos);
  }

  function mostrarModoEliminar() {
    currentMode = 'eliminar';
    document.getElementById('logoArea').style.display = 'none';
    document.getElementById('editArea').style.display = 'block';
    document.getElementById('buscarInput').value = '';
    renderEliminar(productos);
  }

  function getCatLabel(catId) {
    var labels = { 'anillos': '💍 Anillos', 'pulseras': '💎 Pulseras', 'collares': '📿 Collares', 'aretes': '🎀 Aretes', 'earcuffs': '🎧 Earcuffs', 'sets': '✨ Sets' };
    return labels[catId] || catId;
  }

  // Render para editar - agrupa por categoría y ordena por precio
  function renderEditar(list) {
    var porCategoria = {};
    list.forEach(function(p) {
      var cat = p.categoria || p.category || 'otros';
      if (!porCategoria[cat]) porCategoria[cat] = [];
      porCategoria[cat].push(p);
    });
    Object.keys(porCategoria).forEach(function(cat) {
      porCategoria[cat].sort(function(a, b) {
        var precioA = parseInt(a.precio || a.price || 0);
        var precioB = parseInt(b.precio || b.price || 0);
        return precioA - precioB;
      });
    });
    var html = '';
    Object.keys(porCategoria).forEach(function(cat) {
      var catLabel = getCatLabel(cat);
      html += '<div style="grid-column:1/-1;padding:16px 0 8px;margin-top:8px;border-top:1px solid #ddd;"><strong style="color:#5C0F14;font-size:1rem;">' + catLabel + '</strong></div>';
      porCategoria[cat].forEach(function(p) {
        var img = p.imagen || p.image || 'https://placehold.co/200x200/eee/999?text=📷';
        var nombre = p.nombre || p.name || 'Sin nombre';
        var precio = p.precio || p.price || 0;
        var prodId = p.codigo || p.id;
        html += '<div class="card" onclick="seleccionar(\'' + prodId + '\')"><img src="' + img + '"><div class="card-info"><div class="card-name">' + nombre + '</div><div class="card-precio">$' + precio + '</div></div></div>';
      });
    });
    document.getElementById('gridDisplay').innerHTML = html || '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#666;">No hay productos</div>';
    document.getElementById('countDisplay').innerHTML = list.length + ' productos';
  }

  // Render para eliminar
  function renderEliminar(list) {
    var porCategoria = {};
    list.forEach(function(p) {
      var cat = p.categoria || p.category || 'otros';
      if (!porCategoria[cat]) porCategoria[cat] = [];
      porCategoria[cat].push(p);
    });
    Object.keys(porCategoria).forEach(function(cat) {
      porCategoria[cat].sort(function(a, b) {
        var precioA = parseInt(a.precio || a.price || 0);
        var precioB = parseInt(b.precio || b.price || 0);
        return precioA - precioB;
      });
    });
    var html = '';
    Object.keys(porCategoria).forEach(function(cat) {
      var catLabel = getCatLabel(cat);
      html += '<div style="grid-column:1/-1;padding:16px 0 8px;margin-top:8px;border-top:1px solid #dc2626;"><strong style="color:#dc2626;font-size:1rem;">' + catLabel + '</strong></div>';
      porCategoria[cat].forEach(function(p) {
        var img = p.imagen || p.image || 'https://placehold.co/200x200/eee/999?text=📷';
        var nombre = p.nombre || p.name || 'Sin nombre';
        var precio = p.precio || p.price || 0;
        var prodId = p.codigo || p.id;
        html += '<div class="card" onclick="seleccionar(\'' + prodId + '\')" style="border-color:#dc2626;"><img src="' + img + '"><div class="card-info"><div class="card-name">' + nombre + '</div><div class="card-precio" style="color:#dc2626;">$' + precio + '</div></div></div>';
      });
    });
    document.getElementById('gridDisplay').innerHTML = html || '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#666;">No hay productos</div>';
    document.getElementById('countDisplay').innerHTML = list.length + ' productos';
  }

  function seleccionar(id) {
    console.log('seleccionar called with id:', id, 'mode:', currentMode);
    seleccionado = productos.find(function(p) { return (p.codigo || p.id) === id; });

    // Si el modo es editar o nuevo, mostrar alert de confirmación
    if (currentMode === 'editar' || window.currentAdminMode === 'editar') {
      // Guardar el prodId en el dataset del botón para que abrirEditar funcione
      document.getElementById('menuEditBtn').dataset.prodId = id;
      showConfirm('✏️ Editar producto', '¿Desea editar este producto?', function() {
        abrirEditar();
      }, function() {
        // Cancelar - no hacer nada
      });
      return;
    }

    // Si el modo es eliminar, mostrar alert de confirmación
    if (currentMode === 'eliminar' || window.currentAdminMode === 'eliminar') {
      showConfirm('🗑️ Eliminar producto', '¿Desea eliminar este producto?', function() {
        eliminarProductoCard(id);
      }, function() {
        // Cancelar - no hacer nada
      });
      return;
    }
  }

  function seleccionarPortada(id) {
    var prod = productos.find(function(p) { return (p.codigo || p.id) === id; });
    if (!prod) return;
    var cat = localStorage.getItem('karaz_admin_category');
    var newImageUrl = prod.imagen;

    // Guardar la portada de la categoría en el backend
    var configData = { storeId: STORE };

    // Obtener categorías actuales del config (si existen)
    fetch(API + '/api/config?store=' + STORE)
      .then(function(res) { return res.json(); })
      .then(function(config) {
        var categories = config.categories || [];
        // Buscar la categoría y actualizar su imageUrl
        var catFound = false;
        categories = categories.map(function(c) {
          if (c.id === cat) {
            catFound = true;
            return { id: c.id, label: c.label || cat, imageUrl: newImageUrl, ctaText: c.ctaText || 'Ver colección →' };
          }
          return { id: c.id, label: c.label || c.id, imageUrl: c.imageUrl || '', ctaText: c.ctaText || 'Ver colección →' };
        });

        // Si no existe la categoría, agregarla
        if (!catFound) {
          categories.push({ id: cat, label: cat, imageUrl: newImageUrl, ctaText: 'Ver colección →' });
        }

        configData.categories = categories;

        // Guardar en backend
        return fetch(API + '/api/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-store-id': STORE, 'x-admin-password': localStorage.getItem(STORE + '_admin_auth') || '' },
          body: JSON.stringify(configData)
        });
      })
      .then(function(res) { return res.json(); })
      .then(function() {
        // Actualizar CONFIG en memoria para que renderPortadaPreview vea la nueva imagen
        if (!window.CONFIG) window.CONFIG = {};
        if (!window.CONFIG.categories) window.CONFIG.categories = [];
        var catIdx = window.CONFIG.categories.findIndex(function(c) { return c.id === cat; });
        if (catIdx >= 0) {
          window.CONFIG.categories[catIdx].imageUrl = newImageUrl;
        } else {
          window.CONFIG.categories.push({ id: cat, label: cat, imageUrl: newImageUrl, ctaText: 'Ver colección →' });
        }
        showAlert('Imagen de portada actualizada!');
        // Actualizar la vista
        showCategoryPreview(cat);
      })
      .catch(function(err) {
        console.error('Error guardando portada:', err);
        showAlert('Error al guardar. Intenta de nuevo.');
      });
  }

  function seleccionarDestacado(id) {
    if (!window.pendingDestacados) {
      window.pendingDestacados = [];
    }
    
    var index = window.pendingDestacados.indexOf(id);
    if (index >= 0) {
      // Quitar de la lista pendiente
      window.pendingDestacados.splice(index, 1);
    } else {
      // Agregar (si hay espacio)
      if (window.pendingDestacados.length >= 4) {
        showAlert('🔥 Máximo alcanzado', 'Ya tenés 4 productos destacados. Quitá uno primero.');
        return;
      }
      window.pendingDestacados.push(id);
    }
    
    // Re-renderizar para mostrar cambios visuales
    var cat = localStorage.getItem('karaz_admin_category');
    var filtered = cat 
      ? productos.filter(function(p) { return (p.categoria || p.category) === cat; })
      : productos;
    filtered.sort(function(a, b) {
      return parseInt(a.precio || a.price || 0) - parseInt(b.precio || b.price || 0);
    });
    renderProductosConAcciones(filtered);
    
    // Actualizar botones flotantes
    actualizarBotonesDestacados();
  }
  
  function actualizarBotonesDestacados() {
    var cat = localStorage.getItem('karaz_admin_category');
    var hayCambios = false;
    
    if (window.pendingDestacados && cat) {
      var catProducts = productos.filter(function(p) { return (p.categoria || p.category) === cat; });
      var actuales = catProducts
        .filter(function(p) { return p.destacadoOrden > 0; })
        .map(function(p) { return p.codigo || p.id; })
        .sort();
      var pendientes = window.pendingDestacados.slice().sort();
      hayCambios = JSON.stringify(actuales) !== JSON.stringify(pendientes);
    }
    
    // Crear botones si no existen
    var guardarBtn = document.getElementById('guardarDestacadosBtn');
    if (!guardarBtn) {
      guardarBtn = document.createElement('button');
      guardarBtn.id = 'guardarDestacadosBtn';
      guardarBtn.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);padding:14px 28px;background:#5C0F14;color:white;border:none;border-radius:30px;font-size:1rem;font-weight:600;cursor:pointer;z-index:1000;box-shadow:0 4px 20px rgba(92,15,20,0.4);display:none;font-family:inherit;';
      guardarBtn.innerHTML = '💾 GUARDAR DESTACADOS';
      guardarBtn.onclick = guardarDestacadosCambios;
      document.body.appendChild(guardarBtn);
    }
    
    var cancelarBtn = document.getElementById('cancelarDestacadosBtn');
    if (!cancelarBtn) {
      cancelarBtn = document.createElement('button');
      cancelarBtn.id = 'cancelarDestacadosBtn';
      cancelarBtn.style.cssText = 'position:fixed;bottom:20px;right:20px;width:48px;height:48px;background:white;color:#dc2626;border:2px solid #dc2626;border-radius:50%;font-size:1.2rem;font-weight:600;cursor:pointer;z-index:1000;box-shadow:0 2px 10px rgba(0,0,0,0.1);display:none;font-family:inherit;';
      cancelarBtn.innerHTML = '✕';
      cancelarBtn.title = 'Cancelar cambios';
      cancelarBtn.onclick = cancelarDestacadosCambios;
      document.body.appendChild(cancelarBtn);
    }
    
    guardarBtn.style.display = hayCambios ? 'block' : 'none';
    cancelarBtn.style.display = hayCambios ? 'block' : 'none';
  }
  
  function guardarDestacadosCambios() {
    var pass = localStorage.getItem(STORE + '_admin_auth');
    var cat = localStorage.getItem('karaz_admin_category');
    var updates = [];
    
    // Asignar orden 1, 2, 3, 4 a los seleccionados
    window.pendingDestacados.forEach(function(id, index) {
      updates.push({ id: id, destacadoOrden: index + 1 });
    });
    
    // Quitar los que ya no están seleccionados pero tenían orden > 0
    var catProducts = productos.filter(function(p) { return (p.categoria || p.category) === cat; });
    catProducts.forEach(function(p) {
      var prodId = p.codigo || p.id;
      if (p.destacadoOrden > 0 && window.pendingDestacados.indexOf(prodId) < 0) {
        updates.push({ id: prodId, destacadoOrden: 0 });
      }
    });
    
    if (updates.length === 0) {
      showToast('No hay cambios que guardar');
      return;
    }
    
    // Mostrar loading
    var guardarBtn = document.getElementById('guardarDestacadosBtn');
    if (guardarBtn) guardarBtn.innerHTML = '⏳ Guardando...';
    
    var completed = 0;
    var errores = 0;
    
    updates.forEach(function(u) {
      fetch(API + '/api/productos/' + u.id + '/destacado', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-store-id': STORE, 'x-admin-password': pass },
        body: JSON.stringify({ destacadoOrden: u.destacadoOrden })
      })
      .then(function(res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function(data) {
        completed++;
        console.log('✅ Guardado:', u.id, '→ destacadoOrden:', u.destacadoOrden, data);
        if (completed === updates.length) {
          finalizarGuardadoDestacados(errores);
        }
      })
      .catch(function(err) {
        completed++;
        errores++;
        console.error('❌ Error guardando', u.id, err);
        if (completed === updates.length) {
          finalizarGuardadoDestacados(errores);
        }
      });
    });
  }
  
  function finalizarGuardadoDestacados(errores) {
    var guardarBtn = document.getElementById('guardarDestacadosBtn');
    var cancelarBtn = document.getElementById('cancelarDestacadosBtn');
    var cat = localStorage.getItem('karaz_admin_category');
    
    if (guardarBtn) {
      guardarBtn.innerHTML = '💾 GUARDAR DESTACADOS';
      guardarBtn.style.display = 'none';
    }
    if (cancelarBtn) cancelarBtn.style.display = 'none';
    
    if (errores > 0) {
      showAlert('⚠️ Error parcial', errores + ' producto(s) no se pudieron guardar. Intentá de nuevo.');
    } else {
      showToast('✅ Destacados guardados correctamente');
      window.pendingDestacados = null;
      cargarProductos().then(function() {
        showCategoryPreview(cat);
      });
    }
  }
  
  function cancelarDestacadosCambios() {
    window.pendingDestacados = null;
    var guardarBtn = document.getElementById('guardarDestacadosBtn');
    var cancelarBtn = document.getElementById('cancelarDestacadosBtn');
    if (guardarBtn) guardarBtn.style.display = 'none';
    if (cancelarBtn) cancelarBtn.style.display = 'none';
    
    var cat = localStorage.getItem('karaz_admin_category');
    showCategoryPreview(cat);
  }

  async function guardarDestacadosEnBackend(products) {
    var pass = localStorage.getItem(STORE + '_admin_auth');
    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      if (p.destacadoOrden !== undefined) {
        await fetch(API + '/api/productos/' + (p.codigo || p.id) + '/destacado', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-store-id': STORE, 'x-admin-password': pass },
          body: JSON.stringify({ destacadoOrden: p.destacadoOrden })
        });
      }
    }
    showToast('Destacados actualizados');
  }

  function cerrarMenu() {
    document.getElementById('productMenu').classList.remove('show');
    seleccionado = null;
  }

  function selCat(el) {
    document.querySelectorAll('.cat').forEach(function(c) { c.classList.remove('active'); });
    el.classList.add('active');
  }

  function abrirNuevo() {
    editando = null;
    uploadingCount = 0;
    document.getElementById('modalTitle').innerHTML = 'Nuevo producto';
    document.getElementById('nameInput').value = '';
    document.getElementById('priceInput').value = '';
    // Limpiar fotos
    document.getElementById('imageUrl').value = '';
    document.getElementById('imageUrl2').value = '';
    document.getElementById('imageUrl3').value = '';
    document.getElementById('previewImg').src = '';
    document.getElementById('previewImg2').src = '';
    document.getElementById('previewImg3').src = '';
    document.getElementById('uploadBox').classList.remove('show');
    document.getElementById('uploadBox2').classList.remove('show');
    document.getElementById('uploadBox3').classList.remove('show');
    // Limpiar file inputs
    var fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(function(input) { input.value = ''; });
    document.querySelectorAll('.cat').forEach(function(c) { c.classList.remove('active'); });
    document.getElementById('productModal').classList.add('show');
  }

  function abrirEditar() {
    var editBtn = document.getElementById('menuEditBtn');
    if (!editBtn) { showAlert('Error: botón no encontrado'); return; }
    var prodId = editBtn.dataset.prodId;
    if (!prodId) { showAlert('No hay producto seleccionado'); return; }
    uploadingCount = 0;

    var prod = productos.find(function(p) { return (p.codigo || p.id) === prodId; });
    if (!prod || typeof prod !== 'object') {
      showAlert('Producto no encontrado');
      return;
    }

    // Extraer TODOS los datos ANTES de cerrar el menú
    var nombre = (prod.nombre || prod.name || '');
    var precio = (prod.precio || prod.price || '');
    var destacadoOrden = prod.destacadoOrden || 0;
    var imagen = prod.imagen || prod.image || '';
    var imagen2 = prod.imagen2 || '';
    var imagen3 = prod.imagen3 || '';
    var categoria = prod.categoria || prod.category || '';

    // Cerrar menú y establecer editando DESPUÉS de extraer datos
    document.getElementById('productMenu').classList.remove('show');
    editando = prodId;

    document.getElementById('modalTitle').innerHTML = 'Editar producto';
    document.getElementById('nameInput').value = nombre;
    document.getElementById('priceInput').value = precio;
    // Foto 1
    document.getElementById('imageUrl').value = imagen;
    if (imagen) {
      document.getElementById('previewImg').src = imagen;
      document.getElementById('uploadBox').classList.add('show');
    }
    // Foto 2
    document.getElementById('imageUrl2').value = imagen2;
    if (imagen2) {
      document.getElementById('previewImg2').src = imagen2;
      document.getElementById('uploadBox2').classList.add('show');
    }
    // Foto 3
    document.getElementById('imageUrl3').value = imagen3;
    if (imagen3) {
      document.getElementById('previewImg3').src = imagen3;
      document.getElementById('uploadBox3').classList.add('show');
    }
    // Categoría - asegurar que se seleccione
    // Primero quitar active de todos
    var catInputs = document.querySelectorAll('.cats input[name="cat"]');
    catInputs.forEach(function(input) { input.checked = false; });
    document.querySelectorAll('.cat').forEach(function(c) { c.classList.remove('active'); });

    // Buscar y seleccionar la categoría del producto
    var catEncontrada = false;
    if (categoria) {
      catInputs.forEach(function(input) {
        if (input.value === categoria) {
          input.checked = true;
          input.closest('.cat').classList.add('active');
          catEncontrada = true;
        }
      });
    }

    // Si no encuentra la categoría, seleccionar la primera
    if (!catEncontrada && catInputs.length > 0) {
      catInputs[0].checked = true;
      catInputs[0].closest('.cat').classList.add('active');
    }
    document.getElementById('productModal').classList.add('show');
  }

  function cerrarModal() {
    document.getElementById('productModal').classList.remove('show');
  }

  function cerrarSuccessModal(cargarMas) {
    document.getElementById('successModal').style.display = 'none';
    cerrarModal();

    var opType = window.lastOperationType || 'nuevo';

    if (cargarMas) {
      cargarProductos();
      if (opType === 'editar') {
        // Editar + Sí: mostrar página de inicio con productos y búsqueda
        showProductList(null, 'editar');
      } else {
        // Nuevo + Sí: abrir formulario de nuevo producto
        abrirNuevo();
      }
    } else {
      // Click en "No" siempre vuelve al inicio limpio sin recargar
      document.getElementById('buscarInput').value = '';
      document.getElementById('logoArea').style.display = 'block';
      document.getElementById('editArea').style.display = 'none';
      document.getElementById('categoryPreview').style.display = 'none';
      document.getElementById('editAreaBackBtn').style.display = 'none';
      document.getElementById('editIntegratedPanel').style.display = 'none';
      document.getElementById('featuredPanel').style.display = 'none';
      document.querySelector('.fab-container').style.display = 'none';
      window.currentAdminMode = null;
      currentMode = null;
    }
  }

  function mostrarSuccessModal() {
    var opType = window.lastOperationType || 'nuevo';
    var icon = document.getElementById('successModalIcon');
    var title = document.getElementById('successModalTitle');
    var text = document.getElementById('successModalText');
    var btnYes = document.getElementById('successModalBtnYes');
    var btnNo = document.getElementById('successModalBtnNo');

    if (opType === 'editar') {
      icon.textContent = '✏️';
      title.textContent = '¡Producto editado con éxito!';
      text.textContent = '¿Desea editar otro producto?';
      btnYes.textContent = 'Sí, editar más';
      btnNo.textContent = 'No, terminar';
    } else {
      icon.textContent = '✅';
      title.textContent = '¡Producto guardado con éxito!';
      text.textContent = '¿Desea cargar otro producto?';
      btnYes.textContent = 'Sí, cargar más';
      btnNo.textContent = 'No, terminar';
    }

    document.getElementById('successModal').style.display = 'flex';
  }

var uploadingCount = 0;

  function subirFoto(fileInputId, imageUrlId, previewImgId, uploadBoxId) {
    var file = document.getElementById(fileInputId).files[0];
    if (!file) return;
    uploadingCount++;
    uploadBoxId && document.getElementById(uploadBoxId).classList.add('uploading');
    var reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById(previewImgId).src = e.target.result;
      document.getElementById(uploadBoxId).classList.add('show');
      var fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', 'aguamarina');
      fetch('https://api.cloudinary.com/v1_1/dh6kkq9w7/image/upload', { method: 'POST', body: fd })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        uploadingCount--;
        if (uploadingCount === 0 && uploadBoxId) document.getElementById(uploadBoxId).classList.remove('uploading');
        if (d.secure_url) {
          document.getElementById(imageUrlId).value = d.secure_url;
        }
      })
      .catch(function() {
        uploadingCount--;
        if (uploadingCount === 0 && uploadBoxId) document.getElementById(uploadBoxId).classList.remove('uploading');
      });
    };
    reader.readAsDataURL(file);
  }

  function guardar() {
    // Validación obligatoria
    var img = document.getElementById('imageUrl').value;
    if (!img) { showAlert('📷 Foto requerida', 'Sube al menos una foto'); return; }
    if (uploadingCount > 0) {
      showAlert('⏳ Subiendo fotos', 'Espera un momento, las fotos aún están subiendo...');
      return;
    }
    var nombre = document.getElementById('nameInput').value.trim();
    if (!nombre) { showAlert('📝 Nombre requerido', 'Ingresa el nombre del producto'); return; }
    var precio = parseInt(document.getElementById('priceInput').value);
    if (!precio || isNaN(precio)) { showAlert('💰 Precio requerido', 'Ingresa el precio del producto'); return; }
    var cat = document.querySelector('.cat.active input')?.value;
    if (!cat) { showAlert('📂 Categoría requerida', 'Selecciona una categoría'); return; }

    // Determinar si es edición o creación
    var isEditing = !!editando;

    var pass = localStorage.getItem(STORE + '_admin_auth');
    var img2 = document.getElementById('imageUrl2')?.value || '';
    var img3 = document.getElementById('imageUrl3')?.value || '';
    console.log('Guardando - img:', img, 'img2:', img2, 'img3:', img3, 'isEditing:', isEditing);
    var data = {
      nombre: nombre,
      precio: precio,
      categoria: cat,
      imagen: img,
      imagen2: img2,
      imagen3: img3
    };
    if (editando) data.codigo = editando;
    var url = editando ? API + '/api/productos/' + editando : API + '/api/productos';
    var metodo = editando ? 'PUT' : 'POST';
    if (!editando) data.codigo = 'NEW-' + Date.now();
    fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', 'x-store-id': STORE, 'x-admin-password': pass },
      body: JSON.stringify(data)
    })
    .then(function() {
        // Guardar tipo de operación para el modal de éxito
        window.lastOperationType = isEditing ? 'editar' : 'nuevo';
        mostrarSuccessModal();
      })
      .catch(function() { showAlert('❌ Error', 'Error al guardar el producto'); });
  }

  function eliminar() {
    var deleteBtn = document.getElementById('menuDeleteBtn');
    if (!deleteBtn) { showAlert('Error: botón no encontrado'); return; }
    var prodId = deleteBtn.dataset.prodId;
    if (!prodId) {
      if (productos.length > 0) {
        prodId = productos[0].codigo || productos[0].id;
      }
      if (!prodId) { showAlert('No hay producto seleccionado'); return; }
    }
    var prod = productos.find(function(p) { return (p.codigo || p.id) === prodId; });
    var prodNombre = prod ? (prod.nombre || prod.name || 'este producto') : 'este producto';
    showConfirm('🗑️ Confirmar eliminación', '¿Eliminar el producto "' + prodNombre + '"?', function() {
      cerrarMenu();
      var pass = localStorage.getItem(STORE + '_admin_auth');
      console.log('Eliminando producto con ID:', prodId);
      fetch(API + '/api/productos/' + prodId, {
      method: 'DELETE',
      headers: { 'x-store-id': STORE, 'x-admin-password': pass }
    })
    .then(function(res) {
      console.log('Response:', res.status);
      mostrarDeleteSuccessModal();

      // Recargar productos y volver a la página de inicio
      setTimeout(function() {
        fetch(API + '/api/productos', {
          headers: { 'x-store-id': STORE }
        })
        .then(function(res) { return res.json(); })
        .then(function(prods) {
          productos = prods.filter(function(p) { return p.activo !== false; }).map(function(p) {
            if (p.codigo) {
              return {
                codigo: p.codigo,
                nombre: p.nombre,
                precio: p.precio,
                categoria: p.categoria,
                descripcion: p.descripcion || '',
                imagen: p.imagen || '',
                imagen2: p.imagen2 || '',
                imagen3: p.imagen3 || '',
                stock: p.stock || 0,
                destacadoOrden: p.destacadoOrden || 0
              };
            }
            return p;
          });

          // Volver a la página de inicio del admin
          document.getElementById('logoArea').style.display = 'block';
          document.getElementById('editArea').style.display = 'none';
          document.getElementById('categoryPreview').style.display = 'none';
          document.getElementById('editAreaBackBtn').style.display = 'none';
          document.getElementById('editIntegratedPanel').style.display = 'none';
          document.getElementById('featuredPanel').style.display = 'none';
          document.querySelector('.fab-container').style.display = 'none';

          // Actualizar los filtros con los nuevos productos
          renderFiltros();
        });
      }, 1500);
    })
    .catch(function(err) {
      console.error('Error:', err);
      showAlert('Error al eliminar: ' + err.message);
    });
    });
  }

  // INICIAR
  init();

  function abrirNuevoDesdeCategoria() {
    // Si hay una categoría activa, pre-seleccionarla
    var cat = localStorage.getItem('karaz_admin_category');
    if (cat) {
      // Buscar el input de la categoría y seleccionarlo
      var catInputs = document.querySelectorAll('.cats input[name="cat"]');
      catInputs.forEach(function(input) {
        if (input.value === cat) {
          input.checked = true;
          var parent = input.closest('.cat');
          if (parent) parent.classList.add('active');
        }
      });
    }
    // Abrir el modal de nuevo producto
    abrirNuevo();
  }

  // Exponer funciones al global para que funcionen los onclick
  window.selCat = selCat;
  window.seleccionar = seleccionar;
  window.cerrarMenu = cerrarMenu;
  window.abrirEditar = abrirEditar;
  window.abrirNuevo = abrirNuevo;
  window.eliminar = eliminar;
  window.cerrarModal = cerrarModal;
  window.cerrarSuccessModal = cerrarSuccessModal;
  window.mostrarSuccessModal = mostrarSuccessModal;
  window.cerrarDeleteSuccessModal = cerrarDeleteSuccessModal;
  window.mostrarDeleteSuccessModal = mostrarDeleteSuccessModal;
  window.subirFoto = subirFoto;
  window.abrirEditarCard = abrirEditarCard;
  window.eliminarProductoCard = eliminarProductoCard;
  window.showCategoryPreview = showCategoryPreview;
  window.showPortadaProducts = showPortadaProducts;
  window.showDestacadosProducts = showDestacadosProducts;
  window.showProductList = showProductList;
  window.volverACategorias = volverACategorias;
  window.mostrarInicioAdmin = mostrarInicioAdmin;
  window.logout = logout;
  window.quitarPortada = quitarPortada;
  window.seleccionarPortada = seleccionarPortada;
  window.ejecutarSanitizacion = ejecutarSanitizacion;
  window.seleccionarDestacado = seleccionarDestacado;
  window.guardarDestacadosCambios = guardarDestacadosCambios;
  window.cancelarDestacadosCambios = cancelarDestacadosCambios;
  window.abrirNuevoDesdeCategoria = abrirNuevoDesdeCategoria;
  window.showAlert = showAlert;
  window.showConfirm = showConfirm;

  // Funciones para mostrar alerts y confirms estilizados
  function showAlert(titulo, mensaje) {
    // Si solo pasan un argumento, usarlo como mensaje con título genérico
    if (!mensaje) {
      mensaje = titulo;
      titulo = 'ℹ️ Información';
    }
    var modal = document.getElementById('alertModal');
    var titleEl = document.getElementById('alertModalTitle');
    var textEl = document.getElementById('alertModalText');
    var btnsEl = document.getElementById('alertModalBtns');

    titleEl.textContent = titulo;
    textEl.textContent = mensaje;
    btnsEl.innerHTML = '<button class="alert-modal-btn" onclick="cerrarAlertModal()">Aceptar</button>';

    modal.classList.add('show');
  }

  function showConfirm(titulo, mensaje, onConfirm, onCancel) {
    var modal = document.getElementById('alertModal');
    var titleEl = document.getElementById('alertModalTitle');
    var textEl = document.getElementById('alertModalText');
    var btnsEl = document.getElementById('alertModalBtns');

    titleEl.textContent = titulo;
    textEl.textContent = mensaje;
    btnsEl.innerHTML = '<button class="alert-modal-btn alert-modal-btn-cancel" onclick="cerrarAlertModal(false)">Cancelar</button><button class="alert-modal-btn" onclick="cerrarAlertModal(true)">Confirmar</button>';

    window._confirmCallback = { onConfirm: onConfirm, onCancel: onCancel };
    modal.classList.add('show');
  }

  function showToast(msg) {
    var existing = document.getElementById('toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'toast';
    toast.textContent = msg;
    toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;z-index:1000;animation:fadeIn .3s';
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 3000);
  }
})();
