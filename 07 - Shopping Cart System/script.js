const productList = document.getElementById('product-list');
const searchInput = document.getElementById('search');
const cartToggle = document.getElementById('cart-toggle');
const cartSidebar = document.getElementById('cart-sidebar');
const closeCart = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotalAmount = document.getElementById('cart-total-amount');
const checkoutBtn = document.getElementById('checkout-btn');
const overlay = document.getElementById('overlay');

// --- STATE MANAGEMENT ---
// products: Stores the master list of all available items from products.json.
// cart: Stores the items the user has added (including their selected quantity).
let products = [];
let cart = [];

/**
 * INITIALIZATION: fetchProducts
 * Connects to the local JSON file to load the store inventory.
 */
async function fetchProducts() {
    try {
        const response = await fetch('products.json');
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        products = await response.json();
        // Artificial delay for a smooth 'discovery' loading experience
        setTimeout(() => displayProducts(products), 600);
    } catch (error) {
        console.error('Error fetching products:', error);
        productList.innerHTML = `<div class="no-results">Unable to load products. Ensure you're running a local server.</div>`;
    }
}

/**
 * UI RENDERING: displayProducts
 * Takes an array of products and converts them into HTML cards.
 */
function displayProducts(productsToDisplay) {
    if (productsToDisplay.length === 0) {
        productList.innerHTML = `<div class="no-results">No premium matches found for your search.</div>`;
        return;
    }

    // .map() transforms our data array into an array of HTML strings
    const html = productsToDisplay.map((product, index) => {
        const discountedPrice = (product.price * (1 - product.discount / 100)).toFixed(2);
        const hasDiscount = product.discount > 0;
        const isOutOfStock = product.stock === 0;
        
        // Check if this specific product is already in our cart to show the correct UI
        const cartItem = cart.find(item => item.id === product.id);
        const quantity = cartItem ? cartItem.quantity : 0;

        return `
            <div class="product-card" style="animation-delay: ${index * 0.05}s">
                ${hasDiscount ? `<span class="discount-badge">SAVE ${product.discount}%</span>` : ''}
                <div class="product-image-container">
                    <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
                </div>
                <div class="product-info">
                    <h2 class="product-name">
                        ${product.name}
                        ${isOutOfStock ? `<span class="out-of-stock-badge">OUT OF STOCK</span>` : ''}
                    </h2>
                    <div class="product-card-footer">
                        <div class="price-container">
                            ${hasDiscount ? `<span class="original-price">Rs. ${product.price.toFixed(2)}</span>` : ''}
                            <span class="current-price">Rs. ${discountedPrice}</span>
                        </div>
                        <div id="controls-${product.id}" class="quantity-controls">
                            ${renderButtonContent(product.id, quantity, product.stock, isOutOfStock)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join(''); // .join('') turns the array of strings into one big string

    productList.innerHTML = html;
}

/**
 * UI HELPER: renderButtonContent
 * Decides whether to show 'Add to Cart', 'Sold', or the '+ / -' quantity selector.
 */
function renderButtonContent(productId, quantity, stock, isOutOfStock) {
    // 1. If no stock, show disabled 'Sold' button
    if (isOutOfStock) return `<button class="add-to-cart-btn" disabled>Sold</button>`;
    
    // 2. If not in cart, show 'Add to Cart'
    if (quantity === 0) {
        return `<button class="add-to-cart-btn" onclick="addToCart(${productId})">Add to Cart</button>`;
    }

    // 3. If already in cart, show the quantity selector with +/- buttons
    const minusDisabled = quantity === 0 ? 'disabled aria-disabled="true"' : '';
    const minusAction = quantity === 0 ? '' : `onclick="changeQuantity(${productId}, -1)"`;
    const plusDisabled = quantity >= stock ? 'disabled aria-disabled="true"' : '';
    const plusAction = quantity >= stock ? '' : `onclick="changeQuantity(${productId}, 1)"`;

    return `
        <div class="qty-selector">
            <button class="qty-btn minus" ${minusDisabled} ${minusAction} aria-label="Decrease quantity">−</button>
            <span class="qty-number">${quantity}</span>
            <button class="qty-btn plus" ${plusDisabled} ${plusAction} aria-label="Increase quantity">+</button>
        </div>
    `;
}

/**
 * CORE LOGIC: changeQuantity
 * Increments or decrements item quantity and ensures it doesn't exceed stock.
 */
function changeQuantity(productId, delta) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    const nextQuantity = currentQuantity + delta;

    // Guard: Don't allow adding more than available stock
    if (delta > 0 && nextQuantity > product.stock) {
        return;
    }
    
    if (existingItem) {
        existingItem.quantity = nextQuantity;
        // If quantity reaches 0, remove it entirely
        if (existingItem.quantity <= 0) {
            removeFromCart(productId);
            return;
        }
    } else if (delta > 0) {
        addToCart(productId);
        return;
    }

    // Refresh UI to reflect changes
    updateCart();
    updateButtonLabel(productId);
}

// --- CART UI HELPERS ---
function openCart() {
    cartSidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.classList.add('cart-open');
    document.body.style.overflow = 'hidden';
}

function closeCartHandler() {
    cartSidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.classList.remove('cart-open');
    document.body.style.overflow = '';
}

/**
 * CORE LOGIC: addToCart
 * Adds a new item to the cart array or increments it if already present.
 */
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    const currentQuantity = existingItem ? existingItem.quantity : 0;

    if (currentQuantity >= product.stock) {
        return;
    }

    if (existingItem) {
        existingItem.quantity++;
    } else {
        // Add new item with a calculated price (original minus discount)
        cart.push({
            id: product.id,
            name: product.name,
            price: (product.price * (1 - product.discount / 100)),
            image: product.image,
            quantity: 1
        });
    }

    updateCart();
    updateButtonLabel(productId);
    // Use helper to ensure all UI states (overlay, shift, etc) sync
    openCart();
}

/**
 * UI SYNC: updateButtonLabel
 * Surgically updates ONLY the button/selector for a specific product card.
 */
function updateButtonLabel(productId) {
    const container = document.getElementById(`controls-${productId}`);
    if (!container) return;
    
    const product = products.find(p => p.id === productId);
    const cartItem = cart.find(item => item.id === productId);
    const quantity = cartItem ? cartItem.quantity : 0;
    const isOutOfStock = product ? product.stock === 0 : false;

    container.innerHTML = renderButtonContent(productId, quantity, product ? product.stock : 0, isOutOfStock);
}

/**
 * UI SYNC: updateCart
 * Updates the total item count and triggers the cart sidebar re-render.
 */
function updateCart() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalCount;
    renderCart();
}

/**
 * UI RENDERING: renderCart
 * Generates the HTML list for the cart sidebar.
 */
function renderCart() {
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<div class="no-results">Your cart is empty.</div>`;
        cartTotalAmount.textContent = `Rs. 0.00`;
        return;
    }

    const html = cart.map(item => {
        const product = products.find(p => p.id === item.id);
        const stock = product ? product.stock : 0;
        const minusDisabled = item.quantity <= 1 ? 'disabled aria-disabled="true"' : '';
        const minusAction = item.quantity <= 1 ? '' : `onclick="changeQuantity(${item.id}, -1)"`;
        const plusDisabled = item.quantity >= stock ? 'disabled aria-disabled="true"' : '';
        const plusAction = item.quantity >= stock ? '' : `onclick="changeQuantity(${item.id}, 1)"`;

        return `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-info">
                <h3 class="cart-item-name">${item.name}</h3>
                <div class="cart-item-controls">
                    <div class="qty-selector">
                        <button class="qty-btn minus" ${minusDisabled} ${minusAction} aria-label="Decrease quantity">−</button>
                        <span class="qty-number">${item.quantity}</span>
                        <button class="qty-btn plus" ${plusDisabled} ${plusAction} aria-label="Increase quantity">+</button>
                    </div>
                    <button class="remove-item" onclick="removeFromCart(${item.id})">Remove</button>
                </div>
            </div>
            <div class="cart-item-price">Rs. ${(item.price * item.quantity).toFixed(2)}</div>
        </div>
    `;
    }).join('');

    cartItemsContainer.innerHTML = html;

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalAmount.textContent = `Rs. ${total.toFixed(2)}`;
}

/**
 * CORE LOGIC: removeFromCart
 * Completely deletes a product from the cart array.
 */
function removeFromCart(productId) {
    const index = cart.findIndex(item => item.id === productId);
    if (index !== -1) {
        cart.splice(index, 1);
        updateCart();
        updateButtonLabel(productId);
    }
}

/**
 * CORE LOGIC: checkout
 * Validates stock, deducts inventory, and clears the cart.
 */
function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    // Final stock check before processing
    const hasOutOfStockItems = cart.some(item => {
        const product = products.find(p => p.id === item.id);
        return !product || item.quantity > product.stock;
    });

    if (hasOutOfStockItems) {
        alert('Some items in your cart are no longer in stock. Please remove them before checking out.');
        return;
    }

    // DEDUCT STOCK: Permanently subtract quantities from our local state
    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
            product.stock -= item.quantity;
        }
    });

    alert('Checkout successful! Thank you for your purchase.');
    
    // Reset Cart State
    cart = [];
    updateCart();
    
    // Use helper to close sidebar & reset UI layout
    closeCartHandler();
    
    // Refresh product display to show 'Sold' labels if stock hit 0
    const searchTerm = searchInput.value.trim().toLowerCase();
    const filtered = products.filter(product => product.name.toLowerCase().includes(searchTerm));
    displayProducts(filtered);
}

/**
 * SEARCH FILTERING: filterProducts
 * Uses safe string matching (.includes) to filter inventory by name.
 */
function filterProducts(e) {
    const searchTerm = e.target.value.trim().toLowerCase();
    const filtered = products.filter(product => product.name.toLowerCase().includes(searchTerm));
    displayProducts(filtered);
}

// --- GLOBAL EVENT LISTENERS ---

// Search input
searchInput.addEventListener('input', filterProducts);

// Sidebar open/close
cartToggle.addEventListener('click', openCart);

closeCart.addEventListener('click', closeCartHandler);

// Overlay fallback (clicking outside)
overlay.addEventListener('click', closeCartHandler);

// Checkout button
checkoutBtn.addEventListener('click', checkout);

// STARTUP: Fetch initial data
fetchProducts();