const productList = document.getElementById('product-list');
const searchInput = document.getElementById('search');

let products = [];
// Stores all products after fetching from JSON.

// Fetch products from local JSON
async function fetchProducts() {
    try {
        const response = await fetch('products.json'); // fetch() loads data from products.json
        if (!response.ok) { //If file is missing or server fails → show error.
            throw new Error('Failed to fetch products');
        }
        products = await response.json(); //Converts JSON into JS array/object.
        // Add a slight delay for that premium loading feel
        setTimeout(() => displayProducts(products), 600); //This gives a smooth/premium loading effect.
    } catch (error) {
        console.error('Error fetching products:', error);
        productList.innerHTML = `<div class="no-results">Unable to load products. Ensure you're running a local server.</div>`;
    }
}

// This function shows products on screen.
function displayProducts(productsToDisplay) {
    if (productsToDisplay.length === 0) { //array is empty
        productList.innerHTML = `<div class="no-results">No premium matches found for your search.</div>`;
        return;
    }

    const html = productsToDisplay.map((product, index) => {
        const discountedPrice = (product.price * (1 - product.discount / 100)).toFixed(2);
        const hasDiscount = product.discount > 0;

        //This creates each product card.
        return ` 
            <div class="product-card" style="animation-delay: ${index * 0.05}s">
                ${hasDiscount ? `<span class="discount-badge">SAVE ${product.discount}%</span>` : ''}
                <div class="product-image-container">
                    <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
                </div>
                <div class="product-info">
                    <h2 class="product-name">${product.name}</h2>
                    <div class="price-container">
                        ${hasDiscount ? `<span class="original-price">$${product.price.toFixed(2)}</span>` : ''}
                        <span class="current-price">$${discountedPrice}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    productList.innerHTML = html; //Displays all generated product cards.
}

// Filter products based on search input
function filterProducts(e) {
    const searchTerm = e.target.value.trim();

    // Use RegExp for flexible searching
    const regex = new RegExp(searchTerm, 'gi');
    //Flags:
    // g → global
    // i → case insensitive

    // Keeps only matching products.
    const filtered = products.filter(product => {
        return product.name.match(regex);
    });

    displayProducts(filtered); //Updates UI instantly.
}

// Event Listeners
searchInput.addEventListener('input', filterProducts);

// Initial Load
fetchProducts();
