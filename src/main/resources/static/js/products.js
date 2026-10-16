'use strict';

const API_URL = '/api/products';

let products = [];
let selectedProduct = null;

const grid = document.getElementById('productGrid');
const statusText = document.getElementById('status');
const searchInput = document.getElementById('searchInput');

const detailDialog = document.getElementById('detailDialog');
const formDialog = document.getElementById('formDialog');
const form = document.getElementById('productForm');
const formError = document.getElementById('formError');
const formSubmit = document.getElementById('formSubmit');

const priceFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

// ===== API =====

async function request(url, options = {}) {
    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });
    if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try {
            const body = await response.json();
            if (body && body.error) {
                message = body.error;
            }
        } catch (e) {
            // Response has no JSON body
        }
        throw new Error(message);
    }
    return response.status === 204 ? null : response.json();
}

const api = {
    getAll: () => request(API_URL),
    getById: (id) => request(`${API_URL}/${id}`),
    create: (product) => request(API_URL, { method: 'POST', body: JSON.stringify(product) }),
    update: (id, product) => request(`${API_URL}/${id}`, { method: 'PUT', body: JSON.stringify(product) }),
    remove: (id) => request(`${API_URL}/${id}`, { method: 'DELETE' })
};

// ===== Rendering =====

function createImage(product, className) {
    if (product.imageUrl) {
        const img = document.createElement('img');
        img.className = className;
        img.src = product.imageUrl;
        img.alt = product.name;
        img.loading = 'lazy';
        img.addEventListener('error', () => img.replaceWith(createPlaceholder(product, className)));
        return img;
    }
    return createPlaceholder(product, className);
}

function createPlaceholder(product, className) {
    const div = document.createElement('div');
    div.className = `${className} placeholder`;
    div.textContent = (product.name || '?').charAt(0).toUpperCase();
    return div;
}

function createCard(product) {
    const card = document.createElement('article');
    card.className = 'card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View details of ${product.name}`);

    const body = document.createElement('div');
    body.className = 'card-body';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = product.name;

    const meta = document.createElement('p');
    meta.className = 'card-meta';
    meta.textContent = product.category || 'Uncategorized';

    const price = document.createElement('p');
    price.className = 'card-price';
    price.textContent = priceFormatter.format(product.price);

    body.append(title, meta, price);
    card.append(createImage(product, 'card-img'), body);

    card.addEventListener('click', () => openDetail(product.id));
    card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openDetail(product.id);
        }
    });
    return card;
}

function matchesSearch(product, query) {
    const text = [product.name, product.category, product.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    return text.includes(query);
}

function render() {
    const query = searchInput.value.trim().toLowerCase();
    const visible = query ? products.filter((p) => matchesSearch(p, query)) : products;

    grid.replaceChildren();
    if (visible.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty';
        empty.textContent = query
            ? `No products match "${searchInput.value.trim()}".`
            : 'There are no products yet. Create the first one!';
        grid.append(empty);
    } else {
        visible.forEach((product) => grid.append(createCard(product)));
    }

    statusText.classList.remove('error');
    statusText.textContent = query
        ? `Showing ${visible.length} of ${products.length} products`
        : `${products.length} products`;
}

function showError(message) {
    statusText.classList.add('error');
    statusText.textContent = message;
}

let toastTimer;
function toast(message) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

// ===== Data loading =====

async function loadProducts() {
    statusText.textContent = 'Loading products...';
    try {
        products = await api.getAll();
        products.sort((a, b) => a.id - b.id);
        render();
    } catch (error) {
        showError(`Could not load products: ${error.message}`);
    }
}

// ===== Detail view =====

async function openDetail(id) {
    try {
        selectedProduct = await api.getById(id);
    } catch (error) {
        toast(`Could not load product: ${error.message}`);
        await loadProducts();
        return;
    }
    const p = selectedProduct;
    const image = document.getElementById('detailImage');
    if (p.imageUrl) {
        image.src = p.imageUrl;
        image.alt = p.name;
        image.classList.remove('hidden');
        image.onerror = () => image.classList.add('hidden');
    } else {
        image.removeAttribute('src');
        image.classList.add('hidden');
    }
    document.getElementById('detailName').textContent = p.name;
    document.getElementById('detailId').textContent = p.id;
    document.getElementById('detailPrice').textContent = priceFormatter.format(p.price);
    document.getElementById('detailCategory').textContent = p.category || '—';
    document.getElementById('detailStock').textContent = p.stock ?? '—';
    document.getElementById('detailDescription').textContent = p.description || '—';
    detailDialog.showModal();
}

document.getElementById('detailClose').addEventListener('click', () => detailDialog.close());

document.getElementById('detailEdit').addEventListener('click', () => {
    detailDialog.close();
    openForm(selectedProduct);
});

document.getElementById('detailDelete').addEventListener('click', async () => {
    if (!selectedProduct || !confirm(`Delete "${selectedProduct.name}"?`)) {
        return;
    }
    try {
        await api.remove(selectedProduct.id);
        detailDialog.close();
        toast('Product deleted');
        await loadProducts();
    } catch (error) {
        toast(`Could not delete: ${error.message}`);
    }
});

// ===== Create / edit form =====

function openForm(product) {
    form.reset();
    formError.textContent = '';
    document.getElementById('formTitle').textContent = product ? 'Edit product' : 'New product';
    formSubmit.textContent = product ? 'Update' : 'Save';
    document.getElementById('productId').value = product ? product.id : '';
    if (product) {
        document.getElementById('name').value = product.name ?? '';
        document.getElementById('price').value = product.price ?? '';
        document.getElementById('stock').value = product.stock ?? '';
        document.getElementById('category').value = product.category ?? '';
        document.getElementById('imageUrl').value = product.imageUrl ?? '';
        document.getElementById('description').value = product.description ?? '';
    }
    formDialog.showModal();
    document.getElementById('name').focus();
}

function readForm() {
    const value = (id) => document.getElementById(id).value.trim();
    const stock = value('stock');
    return {
        name: value('name'),
        price: value('price') === '' ? null : Number(value('price')),
        stock: stock === '' ? null : Number(stock),
        category: value('category') || null,
        imageUrl: value('imageUrl') || null,
        description: value('description') || null
    };
}

function validateForm(product) {
    if (!product.name) return 'Name is required.';
    if (product.price === null || Number.isNaN(product.price)) return 'Price is required.';
    if (product.price < 0) return 'Price must be zero or greater.';
    if (product.stock !== null && (!Number.isInteger(product.stock) || product.stock < 0)) {
        return 'Stock must be a whole number, zero or greater.';
    }
    return null;
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const id = document.getElementById('productId').value;
    const product = readForm();
    const error = validateForm(product);
    if (error) {
        formError.textContent = error;
        return;
    }

    formSubmit.disabled = true;
    try {
        if (id) {
            await api.update(id, product);
            toast('Product updated');
        } else {
            await api.create(product);
            toast('Product created');
        }
        formDialog.close();
        await loadProducts();
    } catch (err) {
        formError.textContent = err.message;
    } finally {
        formSubmit.disabled = false;
    }
});

document.getElementById('formCancel').addEventListener('click', () => formDialog.close());
document.getElementById('newButton').addEventListener('click', () => openForm(null));

// Close dialogs when clicking the backdrop
[detailDialog, formDialog].forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) {
            dialog.close();
        }
    });
});

// ===== Real-time search =====
searchInput.addEventListener('input', render);

loadProducts();
