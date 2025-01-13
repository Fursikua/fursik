document.addEventListener('DOMContentLoaded', function () {
    updateCartCount();
    updateCartDisplay(); // Якщо потрібно також оновити відображення деталей кошика
});


// Відображення модального вікна при натисканні на кнопку "Вхід"
const loginButton = document.getElementById('loginButton');
const loginModal = document.getElementById('loginModal');
const closeModal = document.querySelector('.close');

loginButton.onclick = function () {
    loginModal.style.display = 'flex';
};

closeModal.onclick = function () {
    loginModal.style.display = 'none';
};

// Закриття модального вікна при кліку за його межами
window.onclick = function(event) {
    if (event.target == loginModal) {
        loginModal.style.display = 'none';
    }
};

// Функція для перевірки логіна і пароля
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === 'admin' && password === 'password123') {
        window.location.href = '/admin.html';
    } else {
        alert('Неправильний логін або пароль');
    }
}
// Додано подію закриття при кліку поза межами модального вікна
document.getElementById('productDetailModal').addEventListener('click', function (event) {
    // Перевіряємо, чи клікнув користувач саме на контейнер модального вікна, а не на його вміст
    if (event.target === this) {
        closeProductDetailModal();
    }
});


// Оновлення відображення кількості товарів у кошику
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || { items: [], total: 0 };
    const cartCount = cart.items.reduce((count, item) => count + item.quantity, 0);

    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = `${cartCount} `;
    } else {
        console.error('Елемент #cart-count не знайдено.');
    }
}

// Оновлення відображення кошика
function updateCartDisplay() {
    const cart = JSON.parse(localStorage.getItem('cart')) || { items: [], total: 0 };
    const cartItemsDiv = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    cartItemsDiv.innerHTML = ""; // Очищаємо попередні дані

    if (cart.items.length > 0) {
        cart.items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('cart-item');
            itemDiv.innerHTML = `
                <h3>${item.name}</h3> <!-- Відображаємо назву товару -->
                <span>${item.price} грн x ${item.quantity}</span>
                <button class="remove-button" onclick="removeFromCart('${item.article}')">Видалити</button>
            `;
            cartItemsDiv.appendChild(itemDiv);
        });
        cartTotal.textContent = `${cart.total} грн`;
    } else {
        cartItemsDiv.innerHTML = "<p>Ваш кошик порожній.</p>";
        cartTotal.textContent = `0 грн`;
    }
}
// Додавання товару до кошика
function addToCartWithModification(article) {
    const productDetails = document.getElementById('product-details');
    const modificationSelect = document.getElementById('modification-select');

    if (!productDetails || !modificationSelect) {
        alert('Інформація про товар відсутня.');
        return;
    }

    // Отримуємо назву товару
    const name = document.querySelector('h1').textContent; // Назва з <h1>{{ product.name }}</h1>
    const description = productDetails.querySelector('p:nth-child(2)').textContent.split(': ')[1];
    const price = parseFloat(productDetails.querySelector('p:nth-child(3)').textContent.split(': ')[1]);
    const modification = modificationSelect.value;

    // Отримуємо перше зображення товару
    const mediaFile = document.querySelector('.product-gallery img')?.src || '';

    if (!modification) {
        alert('Будь ласка, оберіть модифікацію!');
        return;
    }

    let cart = JSON.parse(localStorage.getItem('cart')) || { items: [], total: 0 };

    const existingProduct = cart.items.find(item => item.article === article && item.modification === modification);
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        const newProduct = { article, name, description, price, modification, quantity: 1, mediaFile };
        cart.items.push(newProduct);
    }

    cart.total = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
    localStorage.setItem('cart', JSON.stringify(cart));

    updateCartDisplay();
    updateCartCount();
}

// Додавання товару до кошика
function addToCart(article) {
    const productElement = document.querySelector(`[data-article="${article}"]`);
    if (!productElement) return;

    const name = productElement.querySelector('.product-name').textContent;
    const price = parseFloat(productElement.querySelector('.product-price').textContent);
    const modificationSelect = productElement.querySelector('.modification-select');
    const modification = modificationSelect ? modificationSelect.value : null;

    // Отримуємо шлях до зображення
    const imageElement = productElement.querySelector('img');
    const imageSrc = imageElement ? imageElement.src : '';

    if (modificationSelect && !modification) {
        alert('Будь ласка, оберіть модифікацію!');
        return;
    }

    let cart = JSON.parse(localStorage.getItem('cart')) || { items: [], total: 0 };

    const existingProduct = cart.items.find(item => item.article === article && item.modification === modification);
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        const newProduct = { article, name, price, modification, quantity: 1, imageSrc }; // Додаємо зображення
        cart.items.push(newProduct);
    }

    cart.total = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    updateCartCount();
}

// Видалення товару з кошика
function removeFromCart(article) {
    const cart = JSON.parse(localStorage.getItem('cart')) || { items: [], total: 0 };

    const itemIndex = cart.items.findIndex(item => item.article === article);
    if (itemIndex !== -1) {
        const removedItem = cart.items.splice(itemIndex, 1);
        cart.total -= removedItem[0].price * removedItem[0].quantity;

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        updateCartCount(); // Оновлюємо лічильник
    } else {
        console.error(`Товар з артикулом ${article} не знайдено.`);
    }
}

// Перехід до сторінки кошика
function goToCart() {
    window.location.href = '/cart.html';
}

// Очищення кошика
function clearCart() {
    localStorage.setItem('cart', JSON.stringify({ items: [], total: 0 })); // Очищаємо дані в localStorage
    updateCartDisplay();
    updateCartCount(); // Оновлюємо лічильник
}

// Відображення кошика при наведенні миші
const cartIcon = document.getElementById('cart-icon');
const cartDetails = document.getElementById('cart-details');

cartIcon.addEventListener('mouseenter', function () {
    cartDetails.style.display = 'block';
});

cartIcon.addEventListener('mouseleave', function () {
    setTimeout(function() {
        cartDetails.style.display = 'none';
    }, 300);
});

cartDetails.addEventListener('mouseenter', function () {
    clearTimeout(this.closeTimeout);
});

cartDetails.addEventListener('mouseleave', function () {
    this.closeTimeout = setTimeout(function() {
        cartDetails.style.display = 'none';
    }, 300);
});

function animateAddToCart(button) {
    const cartIcon = document.getElementById('cart-icon-img');
    const cartIconRect = cartIcon.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();

    const flyingItem = document.createElement('div');
    flyingItem.classList.add('flying-item');
    flyingItem.style.position = 'absolute';
    flyingItem.style.left = `${buttonRect.left + window.scrollX}px`;
    flyingItem.style.top = `${buttonRect.top + window.scrollY}px`;
    flyingItem.style.width = '50px';
    flyingItem.style.height = '50px';
    flyingItem.style.background = 'rgba(255, 165, 0, 0.7)';
    flyingItem.style.borderRadius = '50%';
    flyingItem.style.zIndex = '1000';
    document.body.appendChild(flyingItem);

    const deltaX = cartIconRect.left - buttonRect.left;
    const deltaY = cartIconRect.top - buttonRect.top;

    flyingItem.animate([
        { transform: 'translate(0, 0)', opacity: 1 },
        { transform: `translate(${deltaX}px, ${deltaY}px)`, opacity: 0.5 }
    ], {
        duration: 800,
        easing: 'ease-in-out'
    });

    setTimeout(() => {
        flyingItem.remove();
        cartIcon.classList.add('bounce');
        setTimeout(() => cartIcon.classList.remove('bounce'), 500);
    }, 800);
}


// Оновлюйте лічильник при завантаженні сторінки
window.onload = function () {
    updateCartDisplay();
    updateCartCount(); // Додаємо виклик лічильника
};
