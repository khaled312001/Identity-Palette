import sys
import re

file_path = r'f:\POS-APP\server\templates\restaurant-store.html'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Add FontAwesome
    html = html.replace(
        '<script src="https://js.stripe.com/v3/"></script>',
        '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\n  <script src="https://js.stripe.com/v3/"></script>'
    )

    # 2. Add menu-layout & floating cart CSS
    css_additions = """
    /* ── MENU LAYOUT ── */
    .menu-layout { display: flex; flex-direction: column; gap: 32px; }
    @media(min-width: 992px) {
      .menu-layout { flex-direction: row; }
      .menu-sidebar { width: 260px; flex-shrink: 0; position: sticky; top: 100px; }
      .menu-content { flex: 1; min-width: 0; }
    }
    .cat-list { display: flex; flex-direction: column; gap: 6px; }
    .cat-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 18px; border-radius: 12px; background: var(--s1);
      border: 1px solid var(--bd); color: var(--mu); font-size: 14px;
      font-weight: 600; cursor: pointer; transition: all .25s;
    }
    .cat-item:hover {
      border-color: var(--P)66; color: var(--txt); transform: translateX(4px);
    }
    .cat-item.active {
      background: linear-gradient(135deg, var(--P)20, var(--A)10);
      border-color: var(--P); color: var(--P);
    }
    .cat-item-info { display: flex; align-items: center; gap: 12px; }
    .cat-item-icon { width: 20px; text-align: center; font-size: 16px; opacity: 0.8; }

    .pb-addon-check { color: transparent; }
    .pb-addon.selected .pb-addon-check { background: var(--P); border-color: var(--P); color: #fff; }

    /* ── FLOAT CART ── */
    .float-cart-btn {
      position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px;
      border-radius: 50%; background: linear-gradient(135deg, var(--P), var(--A));
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.25); cursor: pointer;
      z-index: 150; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0; visibility: hidden; transform: scale(0.8) translateY(20px);
    }
    .float-cart-btn.visible {
      opacity: 1; visibility: visible; transform: scale(1) translateY(0);
    }
    .float-cart-btn:hover {
      transform: scale(1.1) translateY(-4px); box-shadow: 0 14px 40px rgba(0,0,0,0.35);
    }
    .float-cart-count {
      position: absolute; top: -5px; right: -5px; background: #fff; color: var(--txt);
      font-size: 11px; font-weight: 800; width: 22px; height: 22px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid var(--A); box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
"""
    html = html.replace('/* ── CATEGORIES ── */', css_additions + '\\n    /* ── CATEGORIES ── */')

    # 3. HTML Replacement

    # Emojis in top bar & general
    html = html.replace('>📞 <', '><i class="fa-solid fa-phone" style="color:var(--P)"></i> <')
    html = html.replace('>✉️ <', '><i class="fa-solid fa-envelope" style="color:var(--P)"></i> <')
    html = html.replace('>🕐<', '><i class="fa-regular fa-clock" style="color:var(--P)"></i><')
    html = html.replace('🕐 ', '<i class="fa-regular fa-clock" style="color:var(--P)"></i> ')
    html = html.replace('📞 ', '<i class="fa-solid fa-phone" style="color:var(--P)"></i> ')

    # Nav buttons
    html = html.replace('🌙', '<i class="fa-solid fa-moon" id="theme-icon"></i>')
    html = html.replace('🛒', '<i class="fa-solid fa-cart-shopping"></i>')
    html = html.replace('✕</button>', '<i class="fa-solid fa-xmark"></i></button>')

    # Sidebar Emojis
    html = html.replace('🏠 Home', '<i class="fa-solid fa-house" style="width:20px;text-align:center"></i> Home')
    html = html.replace('ℹ️ About Us', '<i class="fa-solid fa-circle-info" style="width:20px;text-align:center"></i> About Us')
    html = html.replace('🍽️ Our Menu', '<i class="fa-solid fa-utensils" style="width:20px;text-align:center"></i> Our Menu')
    html = html.replace('📞 Contact', '<i class="fa-solid fa-phone" style="width:20px;text-align:center"></i> Contact')
    html = html.replace('🍕 Pizza Builder', '<i class="fa-solid fa-pizza-slice" style="width:20px;text-align:center"></i> Pizza Builder')

    # Hero ctas
    html = html.replace('🍽️', '<i class="fa-solid fa-utensils"></i>')
    html = html.replace('ℹ️', '<i class="fa-solid fa-circle-info"></i>')

    # Info cards
    html = html.replace('<div class="info-card-icon">🚚</div>', '<div class="info-card-icon"><i class="fa-solid fa-truck" style="color:var(--P)"></i></div>')
    html = html.replace('<div class="info-card-icon">🥡</div>', '<div class="info-card-icon"><i class="fa-solid fa-box-open" style="color:var(--P)"></i></div>')
    html = html.replace('<div class="info-card-icon">💳</div>', '<div class="info-card-icon"><i class="fa-solid fa-credit-card" style="color:var(--P)"></i></div>')
    html = html.replace('<div class="info-card-icon">⭐</div>', '<div class="info-card-icon"><i class="fa-solid fa-star" style="color:var(--P)"></i></div>')

    # Menu Grid HTML
    html = html.replace("""<div class="cat-scroll">
        <div class="cat-tabs" id="cat-tabs"></div>
      </div>
      <div id="product-grid"></div>""", """<div class="menu-layout">
        <div class="menu-sidebar">
          <div class="cat-list" id="cat-tabs"></div>
        </div>
        <div class="menu-content">
          <div id="product-grid"></div>
        </div>
      </div>""")

    # Change Nav Links
    html = html.replace("""<a href="#pizza-section">Pizza</a>
        <a href="#contact-section">Contact</a>""", '<a href="#contact-section">Contact</a>')
    
    html = html.replace('<a href="#pizza-section">Pizza</a>', '')
    html = html.replace('<a href="#pizza-section" onclick="toggleSidebar()"><i class="fa-solid fa-pizza-slice" style="width:20px;text-align:center"></i> Pizza Builder</a>\n', '')

    # Pizza Section -> Pizza Modal
    pizza_html = """<!-- PIZZA MODAL -->
  <div class="modal-overlay" id="pizza-modal">
    <div class="modal" style="max-width: 680px">
      <div class="modal-header">
        <h3><i class="fa-solid fa-pizza-slice" style="margin-right:8px;color:var(--P)"></i> Build Your Pizza</h3>
        <button class="modal-close" onclick="closePizzaModal()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body pb-modal-body" style="padding: 24px 28px;">
        <div class="pizza-builder" id="pizza-builder" style="border:none;padding:0;margin:0;">
          <div class="pb-header" style="display: flex; gap: 20px; align-items: center; margin-bottom: 24px; text-align: left;">
            <div id="pb-pizza-img" style="width: 80px; height: 80px; border-radius: 12px; background: var(--s2); overflow: hidden; flex-shrink: 0;">
               <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px"><i class="fa-solid fa-pizza-slice" style="color:var(--mu)"></i></div>
            </div>
            <div>
              <h4 id="pb-pizza-name" style="font-size: 1.2rem; font-weight: 800; margin-bottom: 4px;">Pizza Name</h4>
              <div id="pb-pizza-desc" style="font-size: 0.85rem; color: var(--mu);">Description</div>
            </div>
          </div>
          <div class="pb-section">
            <div class="pb-section-title">1. Pick Your Size</div>
            <div class="pb-sizes" id="pb-sizes">
              <div class="pb-size active" onclick="selectSize('small',this)" data-size="small">
                <div class="pb-size-icon"><i class="fa-solid fa-pizza-slice"></i></div>
                <div class="pb-size-name">Small</div>
                <div class="pb-size-info">8" - 2 Persons</div>
                <div class="pb-size-price" id="price-small">--</div>
              </div>
              <div class="pb-size" onclick="selectSize('medium',this)" data-size="medium">
                <div class="pb-size-icon" style="font-size:24px"><i class="fa-solid fa-pizza-slice"></i><i class="fa-solid fa-pizza-slice"></i></div>
                <div class="pb-size-name">Medium</div>
                <div class="pb-size-info">12" - 4 Persons</div>
                <div class="pb-size-price" id="price-medium">--</div>
              </div>
              <div class="pb-size" onclick="selectSize('large',this)" data-size="large">
                <div class="pb-size-icon" style="font-size:20px"><i class="fa-solid fa-pizza-slice"></i><i class="fa-solid fa-pizza-slice"></i><i class="fa-solid fa-pizza-slice"></i></div>
                <div class="pb-size-name">Large</div>
                <div class="pb-size-info">16" - 6 Persons</div>
                <div class="pb-size-price" id="price-large">--</div>
              </div>
            </div>
          </div>
          <div class="pb-section">
            <div class="pb-section-title">2. Add Extra Toppings</div>
            <div class="pb-addons" id="pb-addons"></div>
          </div>
          <div class="pb-total" style="margin-top:0"><span class="pb-total-label">Total Price</span><span class="pb-total-price" id="pb-total">0.00</span></div>
          <button class="pb-add-btn" onclick="addPizzaToCart()"><i class="fa-solid fa-cart-shopping"></i> Add to Cart</button>
        </div>
      </div>
    </div>
  </div>"""

    # We want to replace the whole <section id="pizza-section"> block
    # from <!-- PIZZA BUILDER --> down to the end of the section
    html = re.sub(r'<!-- PIZZA BUILDER -->.*?<!-- CONTACT -->', pizza_html + '\\n\\n  <!-- CONTACT -->', html, flags=re.DOTALL)

    # Add Floating Cart Button near Checkout Modal
    html = html.replace('<!-- TOAST -->', """<!-- FLOAT CART BUTTON -->
  <div class="float-cart-btn" id="float-cart-btn" onclick="openCart()">
    <i class="fa-solid fa-cart-shopping"></i>
    <div class="float-cart-count" id="float-cart-count">0</div>
  </div>

  <!-- TOAST -->""")

    # JS Edits
    js_pizza_addons = """const PIZZA_ADDONS = [
      { id: 'cheese', name: 'Extra Cheese', icon: '<i class="fa-solid fa-cheese" style="color:#f59e0b"></i>', price: 2.50 },
      { id: 'pepperoni', name: 'Pepperoni', icon: '<i class="fa-solid fa-bacon" style="color:#ef4444"></i>', price: 3.00 },
      { id: 'mushrooms', name: 'Mushrooms', icon: '<i class="fa-solid fa-leaf" style="color:#22c55e"></i>', price: 2.00 },
      { id: 'olives', name: 'Olives', icon: '<i class="fa-solid fa-circle" style="color:#1e293b"></i>', price: 1.50 },
      { id: 'peppers', name: 'Bell Peppers', icon: '<i class="fa-solid fa-pepper-hot" style="color:#22c55e"></i>', price: 1.50 },
      { id: 'onions', name: 'Onions', icon: '<i class="fa-solid fa-seedling" style="color:#d946ef"></i>', price: 1.00 },
      { id: 'jalapenos', name: 'Jalapeños', icon: '<i class="fa-solid fa-fire" style="color:#ef4444"></i>', price: 2.00 },
      { id: 'chicken', name: 'Grilled Chicken', icon: '<i class="fa-solid fa-drumstick-bite" style="color:#f97316"></i>', price: 4.00 },
      { id: 'beef', name: 'Ground Beef', icon: '<i class="fa-solid fa-cow" style="color:#7c2d12"></i>', price: 4.50 },
      { id: 'corn', name: 'Sweet Corn', icon: '<i class="fa-solid fa-wheat-awn" style="color:#eab308"></i>', price: 1.50 }
    ];"""
    html = re.sub(r'const PIZZA_ADDONS\s*=\s*\[.*?\];', js_pizza_addons, html, flags=re.DOTALL)

    # Update theme button function
    html = html.replace("document.getElementById('theme-btn').textContent = isDark ? '☀️' : '🌙';", 
                        "document.getElementById('theme-btn').innerHTML = isDark ? '<i class=\"fa-solid fa-sun\"></i>' : '<i class=\"fa-solid fa-moon\"></i>';")
    
    html = html.replace("document.getElementById('theme-btn').textContent = isDark ? '☀️' : '🌙'", 
                        "document.getElementById('theme-btn').innerHTML = isDark ? '<i class=\"fa-solid fa-sun\"></i>' : '<i class=\"fa-solid fa-moon\"></i>'")

    # Cart update logic for floating cart
    html = html.replace("document.getElementById('cart-count').textContent = c }",
    "document.getElementById('cart-count').textContent = c; document.getElementById('float-cart-count').textContent = c; if(c > 0) document.getElementById('float-cart-btn').classList.add('visible'); else document.getElementById('float-cart-btn').classList.remove('visible'); }")

    # Render Categories logic
    js_render_cats = """function renderCategories(cats, products) {
      const tabs = document.getElementById('cat-tabs');
      const allCount = products.filter(p => p.isActive).length;
      let html = `<div class="cat-item active" onclick="filterCat('all',this)">
        <div class="cat-item-info"><span class="cat-item-icon"><i class="fa-solid fa-layer-group"></i></span><span class="cat-item-name">All Items</span></div>
        <span class="cat-count">${allCount}</span>
      </div>`;
      cats.filter(c => c.isActive !== false).forEach(c => {
        const count = products.filter(p => p.categoryId === c.id && p.isActive).length;
        if (count) html += `<div class="cat-item" onclick="filterCat(${c.id},this)">
          <div class="cat-item-info"><span class="cat-item-icon"><i class="fa-solid fa-utensils"></i></span><span class="cat-item-name">${c.name}</span></div>
          <span class="cat-count">${count}</span>
        </div>`;
      });
      tabs.innerHTML = html;
    }
    function filterCat(catId, el) {
      selectedCat = catId; document.querySelectorAll('.cat-item').forEach(t => t.classList.remove('active')); el.classList.add('active');
      document.querySelectorAll('.product-card').forEach(c => { c.style.display = (catId === 'all' || Number(c.dataset.cat) === catId) ? '' : 'none' });
    }"""
    html = re.sub(r'function renderCategories\(cats, products\).*?function filterCat\(catId, el\) \{.*?\}', js_render_cats, html, flags=re.DOTALL)

    # Render Products logic + Modal Logic
    js_render_products = """function renderProducts(products, cats) {
      const grid = document.getElementById('product-grid');
      grid.innerHTML = products.filter(p => p.isActive).map(p => {
        const cat = cats.find(c => c.id === p.categoryId);
        const isPizza = cat && (cat.name.toLowerCase().includes('pizza') || (cat.icon && cat.icon.includes('pizza')));
        const action = isPizza ? `openPizzaModal(${JSON.stringify(p).replace(/"/g, '&quot;')})` : `addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')})`;
        const btnIcon = isPizza ? 'fa-pizza-slice' : 'fa-plus';
        return `<div class="product-card" data-cat="${p.categoryId}" onclick="${action}">
      <div class="product-img">${p.image ? `<img src="${p.image}" alt="${p.name}" loading="lazy">` : `<div class="no-img"><i class="fa-solid fa-utensils" style="color:var(--mu)"></i></div>`}${cat ? `<div class="product-badge">${cat.name}</div>` : ''}</div>
      <div class="product-info"><div class="product-name">${p.name}</div><div class="product-desc">${p.description || ''}</div>
      <div class="product-bottom"><span class="product-price">${fmt(p.price)}</span><button class="product-add" onclick="event.stopPropagation();${action}"><i class="fa-solid ${btnIcon}"></i></button></div></div></div>`
      }).join('');
    }

    function openPizzaModal(product) {
      selectedPizza = product;
      document.getElementById('pb-pizza-name').textContent = product.name;
      document.getElementById('pb-pizza-desc').textContent = product.description || '';
      if(product.image) {
          document.getElementById('pb-pizza-img').innerHTML = `<img src="${product.image}" style="width:100%;height:100%;object-fit:cover">`;
      } else {
          document.getElementById('pb-pizza-img').innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px;color:var(--mu)"><i class="fa-solid fa-pizza-slice"></i></div>';
      }
      Object.keys(PIZZA_SIZES).forEach(s => { document.getElementById('price-' + s).textContent = fmt(Number(product.price) * PIZZA_SIZES[s].multiplier) });
      selectedSize = 'small'; 
      document.querySelectorAll('.pb-size').forEach(s => s.classList.remove('active')); 
      document.querySelector('[data-size="small"]').classList.add('active');
      selectedAddons.clear(); 
      document.getElementById('pb-addons').innerHTML = PIZZA_ADDONS.map(a => `<div class="pb-addon" onclick="toggleAddon('${a.id}',this)"><span class="pb-addon-icon" style="font-size:16px;">${a.icon}</span><div class="pb-addon-info"><div class="pb-addon-name">${a.name}</div><div class="pb-addon-price">+${fmt(a.price)}</div></div><div class="pb-addon-check"><i class="fa-solid fa-check"></i></div></div>`).join('');
      updatePizzaTotal();
      document.getElementById('pizza-modal').classList.add('open');
    }

    function closePizzaModal() { document.getElementById('pizza-modal').classList.remove('open'); }
    
    function addPizzaToCart() { 
      if (!selectedPizza) return; 
      addToCart(selectedPizza, 1, selectedSize, [...selectedAddons]);
      closePizzaModal();
    }"""
    html = re.sub(r'function renderProducts\(products, cats\) \{.*?\n    \}', js_render_products, html, flags=re.DOTALL)

    # Delete pizza builder logic that's no longer needed in loadStore
    html = re.sub(r'// Pizza builder.*?updatePizzaTotal\(\);\n\s*\}', '', html, flags=re.DOTALL)

    # Fix remaining emojis
    html = html.replace('<div class="cart-empty-icon">🛒</div>', '<div class="cart-empty-icon"><i class="fa-solid fa-cart-shopping"></i></div>')
    html = html.replace('✅ ', '<i class="fa-solid fa-circle-check"></i> ')
    html = html.replace('❌ ', '<i class="fa-solid fa-circle-exclamation"></i> ')
    html = html.replace('🚚 Delivery', 'Delivery')
    html = html.replace('🥡 Pickup', 'Pickup')
    html = html.replace('💵 Cash on Delivery', 'Cash on Delivery')
    html = html.replace('💳 Card Payment', 'Card Payment')
    html = html.replace('<div class="order-success-icon">🎉</div>', '<div class="order-success-icon"><i class="fa-solid fa-circle-check" style="color:#22c55e"></i></div>')

    # Contact Icons (Sidebar & Footer)
    html = html.replace('<span style="font-size:20px">📞</span>', '<span style="font-size:20px"><i class="fa-solid fa-phone" style="color:var(--P)"></i></span>')
    html = html.replace('<span style="font-size:20px">✉️</span>', '<span style="font-size:20px"><i class="fa-solid fa-envelope" style="color:var(--P)"></i></span>')
    html = html.replace('<span style="font-size:20px">📍</span>', '<span style="font-size:20px"><i class="fa-solid fa-location-dot" style="color:var(--P)"></i></span>')
    html = html.replace('<span style="font-size:20px">🕐</span>', '<span style="font-size:20px"><i class="fa-regular fa-clock" style="color:var(--P)"></i></span>')

    html = html.replace('📞 <a', '<i class="fa-solid fa-phone" style="color:var(--P)"></i> <a')
    html = html.replace('✉️ <a', '<i class="fa-solid fa-envelope" style="color:var(--P)"></i> <a')
    html = html.replace('<span>📍 ', '<span><i class="fa-solid fa-location-dot" style="color:var(--P)"></i> ')
    html = html.replace('title="Facebook">📘</a>', 'title="Facebook"><i class="fa-brands fa-facebook"></i></a>')
    html = html.replace('title="Instagram">📸</a>', 'title="Instagram"><i class="fa-brands fa-instagram"></i></a>')
    html = html.replace('title="WhatsApp">💬</a>', 'title="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>')
    html = html.replace('font-size:48px">📍</div>', 'font-size:48px"><i class="fa-solid fa-location-dot" style="color:var(--P)"></i></div>')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(html)

    print("Successfully patched restaurant-store.html")

except Exception as e:
    print(f"Error: {e}")
