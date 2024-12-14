
const productGrid = document.querySelector('.product-grid');

// Відображення модального вікна при натисканні на кнопку "Вхід"
const loginButton = document.getElementById('loginButton');
const loginModal = document.getElementById('loginModal');
const closeModal = document.querySelector('.close');

document.getElementById('search-input').addEventListener('input', searchProducts);

const headerContainer = document.querySelector('.header-container'); // Знаходимо header-container

function searchProducts() {
    const query = document.getElementById('search-input').value.trim().toLowerCase(); // Отримуємо запит користувача
    
    // Приховуємо або показуємо header-container залежно від наявності тексту в полі пошуку
    if (query !== '') {
        headerContainer.style.display = 'none'; // Приховуємо header-container
    } else {
        headerContainer.style.display = 'flex'; // Повертаємо header-container
    }

    // Фільтруємо товари за назвою або описом
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.description.toLowerCase().includes(query)
    );

    // Відображення результатів пошуку
    if (filteredProducts.length === 0) {
        document.getElementById('product-list').innerHTML = '<p>Товарів за вашим запитом не знайдено.</p>';
    } else {
        renderProducts(filteredProducts); // Відображаємо відфільтровані товари
    }
}

loginButton.onclick = function() {
    loginModal.style.display = 'flex';
};

closeModal.onclick = function() {
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
        window.location.href = 'admin.html';
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


// Структура кошика
document.getElementById('cart-icon').addEventListener('mouseenter', function () {
    document.getElementById('cart-details').style.display = 'block';  // Відкриваємо кошик
});

document.getElementById('cart-icon').addEventListener('mouseleave', function () {
    setTimeout(function() {
        document.getElementById('cart-details').style.display = 'none'; // Закриваємо кошик після затримки
    }, 300); // Затримка перед закриттям, щоб не закрити одразу
});

document.getElementById('cart-details').addEventListener('mouseenter', function () {
    clearTimeout(this.closeTimeout);  // При наведенні на деталі кошика скасовуємо затримку
});

document.getElementById('cart-details').addEventListener('mouseleave', function () {
    this.closeTimeout = setTimeout(function() {
        document.getElementById('cart-details').style.display = 'none';  // Закриваємо кошик через затримку
    }, 300); // Затримка перед закриттям
});

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
                <h3>${item.name}</h3>
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

function addToCart(article) {
    const product = products.find(product => product.article === article);
    if (!product) return;

    let cart = JSON.parse(localStorage.getItem('cart')) || { items: [], total: 0 };

    const existingProduct = cart.items.find(item => item.article === product.article);
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        product.quantity = 1;
        cart.items.push(product);
    }

    cart.total = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
}

function removeFromCart(article) {
    const cart = JSON.parse(localStorage.getItem('cart')) || { items: [], total: 0 };

    const itemIndex = cart.items.findIndex(item => item.article === article);
    if (itemIndex !== -1) {
        const removedItem = cart.items.splice(itemIndex, 1);
        cart.total -= removedItem[0].price * removedItem[0].quantity;

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
    }
}

function goToCart() {
    window.location.href = 'cart.html';
}

function clearCart() {
    localStorage.removeItem('cart');
    updateCartDisplay();
}

window.onload = function () {
    updateCartDisplay();
};

function openProductDetailModal(article) {
    // Знайдемо товар за артикулом
    const product = products.find(product => product.article === article);
    if (!product) return; // Якщо товар не знайдений, нічого не робимо

    const productModal = document.getElementById('productDetailModal');
    
    // Заповнення інформації про товар
    document.getElementById('detail-product-name').innerText = product.name;
    document.getElementById('detail-product-description').innerText = product.description;
    document.getElementById('detail-product-price').innerText = `${product.price} грн`;

    // Галерея зображень або відео
    const gallery = product.files.map(file => {
        const fileExtension = file.split('.').pop().toLowerCase();
        const fileUrl = `http://127.0.0.1:5000/${file}`;

        if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
            return `<img src="${fileUrl}" alt="${product.name}">`;
        } else if (['mp4', 'avi', 'webm'].includes(fileExtension)) {
            return `<video controls>
                        <source src="${fileUrl}" type="video/${fileExtension}">
                    </video>`;
        } else {
            return `<a href="${fileUrl}" target="_blank">Переглянути файл</a>`;
        }
    }).join('');

    document.getElementById('detail-product-gallery').innerHTML = gallery;

    // Відображення модального вікна
    productModal.style.display = 'flex';
    productModal.classList.add('active');
    // Зберігаємо індекс товару для функції "Додати в кошик"
    window.currentDetailModalProductArticle = product.article;
}
// Функція закриття модального вікна
function closeProductDetailModal() {
    document.getElementById('productDetailModal').classList.remove('active');
}
function addToCartFromDetailModal() {
    const article = window.currentDetailModalProductArticle; // Використовуємо артикул з модального вікна
    if (article) {
        addToCart(article); // Додаємо товар в кошик за артикулом
        alert('Товар додано в кошик');
        closeProductDetailModal();
    }
}


let products = [];

async function loadProducts() {
    try {
        const response = await fetch('http://127.0.0.1:5000/products');
        if (!response.ok) throw new Error('Помилка завантаження товарів');
        products = await response.json();
        renderProducts(products);
    } catch (error) {
        console.error('Помилка завантаження:', error);
        document.getElementById('product-list').innerHTML = '<p>Помилка завантаження товарів</p>';
    }
}

// Відображення товарів
function renderProducts(products) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';

    products.forEach((product, index) => {
        const oldPriceHTML = product.oldPrice ? `<span class="old-price">${product.oldPrice} грн</span>` : '';
        const newPriceHTML = `<span class="new-price">${product.price} грн</span>`;
        const shortDescription = product.description.length > 100
            ? product.description.substring(0, 100) + '...'
            : product.description;

        const gallery = product.files.map((file, fileIndex) => {
            const fileExtension = file.split('.').pop().toLowerCase();
            const fileUrl = `http://127.0.0.1:5000/${file}`;

            if (['mp4', 'mov', 'avi', 'webm'].includes(fileExtension)) {
                return `
                    <video data-file-index="${fileIndex}" class="media-file" controls style="width:300px; height:300px; display: ${fileIndex === 0 ? 'block' : 'none'};">
                        <source src="${fileUrl}" type="video/${fileExtension}">
                        Ваш браузер не підтримує відтворення цього відео.
                    </video>
                `;
            } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExtension)) {
                return `
                    <img data-file-index="${fileIndex}" class="media-file" src="${fileUrl}" style="width:300px; height:300px; display: ${fileIndex === 0 ? 'block' : 'none'};" alt="${product.name}">
                `;
            } else if (['mp3', 'wav', 'ogg'].includes(fileExtension)) {
                return `
                    <audio data-file-index="${fileIndex}" class="media-file" controls style="width:300px; height:50px; display: ${fileIndex === 0 ? 'block' : 'none'};">
                        <source src="${fileUrl}" type="audio/${fileExtension}">
                        Ваш браузер не підтримує відтворення цього аудіофайлу.
                    </audio>
                `;
            } else {
                return `<a href="${fileUrl}" target="_blank" class="media-file" style="display: ${fileIndex === 0 ? 'block' : 'none'};">Переглянути файл</a>`;
            }
        }).join('');

        const navigationButtons = product.files.length > 1
            ? `
                <button onclick="changeMedia(${index}, -1)">Назад</button>
                <button onclick="changeMedia(${index}, 1)">Далі</button>
            `
            : '';

        productList.innerHTML += `
            <div class="product-item">
                <h3>${product.name}</h3>
                <p>Артикул: ${product.article}</p>
                <div id="media-${index}" class="image-gallery">${gallery}</div>
                ${navigationButtons}
                <p id="description-${index}">${shortDescription}</p>
                <button onclick="openProductDetailModal('${product.article}')">Детальніше</button>
                <div class="prices">
                    ${oldPriceHTML} ${newPriceHTML}
                </div>
                <button onclick="addToCart('${product.article}')">Додати в кошик</button>            </div>
        `;

        enableSwipe(index); // Додаємо підтримку свайпів для цього товару
    });
}

function addProduct(event) {
    event.preventDefault();

    const name = document.getElementById("new-name").value;
    const price = parseFloat(document.getElementById("new-price").value);
    const description = document.getElementById("new-description").value;
    const fileInput = document.getElementById("new-file");

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('description', description);

    for (let i = 0; i < fileInput.files.length; i++) {
        formData.append('file', fileInput.files[i]);
    }

    fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('status').textContent = 'Файл(и) успішно завантажено!';
            loadProducts();
            document.getElementById("add-product-form").reset();
        } else {
            document.getElementById('status').textContent = 'Помилка при завантаженні файлу.';
        }
    })
    .catch(error => {
        document.getElementById('status').textContent = 'Помилка на сервері.';
        console.error('Error:', error);
    });
}

function changeMedia(productIndex, direction) {
    const product = products[productIndex];
    if (!product || !product.files.length) return;

    // Отримуємо всі медіа елементи для цього товару
    const mediaElements = document.querySelectorAll(`#media-${productIndex} .media-file`);

    // Знаходимо індекс поточного видимого елемента
    let currentIndex = Array.from(mediaElements).findIndex(el => el.style.display === 'block');

    // Якщо поточного елемента не знайдено, почнемо з першого
    if (currentIndex === -1) {
        currentIndex = 0;
    }

    // Обчислюємо новий індекс
    let newIndex = (currentIndex + direction + product.files.length) % product.files.length;

    // Оновлюємо видимість медіафайлів
    mediaElements.forEach((el, index) => {
        el.style.display = index === newIndex ? 'block' : 'none'; // Показуємо/ховаємо елементи
    });
}
function enableSwipe(productIndex) {
    const mediaContainer = document.getElementById(`media-${productIndex}`);
    if (!mediaContainer) return;

    let startX = 0; // Початкова координата X
    let endX = 0; // Кінцева координата X

    // Початок свайпу
    mediaContainer.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    });

    // Завершення свайпу
    mediaContainer.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].clientX;

        // Визначаємо напрямок свайпу
        const swipeDistance = endX - startX;
        if (swipeDistance > 50) {
            // Свайп вправо (назад)
            changeMedia(productIndex, -1);
        } else if (swipeDistance < -50) {
            // Свайп вліво (вперед)
            changeMedia(productIndex, 1);
        }
    });
}

function toggleDescription(index) {
    const descriptionElement = document.getElementById(`description-${index}`);
    const toggleButton = document.getElementById(`toggle-btn-${index}`);
    const product = products[index];

    if (toggleButton.innerText === "Детальніше") {
        descriptionElement.textContent = product.description;
        toggleButton.innerText = "Згорнути";
    } else {
        const shortDescription = product.description.length > 100
            ? product.description.substring(0, 100) + '...'
            : product.description;
        descriptionElement.textContent = shortDescription;
        toggleButton.innerText = "Детальніше";
    }
}
function filterProductsByArticlePrefix(prefix) {
    // Фільтруємо товари за префіксом артикля
    const filteredProducts = products.filter(product => 
        product.article && product.article.startsWith(prefix)
    );

    const productList = document.getElementById('product-list');
    
    if (filteredProducts.length === 0) {
        productList.innerHTML = '<p>Товарів за вашим запитом не знайдено.</p>';
    } else {
        renderProducts(filteredProducts); // Оновлюємо відображення товарів

        // Плавний перехід до першого товару
        setTimeout(() => {
            const firstProduct = productList.querySelector('.product-item');
            if (firstProduct) {
                firstProduct.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100); // Невелика затримка, щоб DOM встиг оновитися
    }
}

async function renderPromoProducts() {
    const promoSection = document.getElementById('promo-products');
    const promoWrapper = promoSection.querySelector('.promo-products-wrapper');
    
    try {
        const response = await fetch('http://127.0.0.1:5000/products');
        if (!response.ok) throw new Error('Помилка завантаження товарів');

        const products = await response.json();

        const promoProducts = products.filter(product => product.oldPrice && product.price < product.oldPrice);

        if (promoProducts.length === 0) {
            promoWrapper.innerHTML = '<p>Немає акційних товарів.</p>';
            return;
        }

        promoProducts.forEach(product => {
            const oldPriceHTML = product.oldPrice ? `<span class="old-price">${product.oldPrice} грн</span>` : '';
            const newPriceHTML = `<span class="new-price">${product.price} грн</span>`;

            const gallery = product.files.map((file, fileIndex) => {
                const fileExtension = file.split('.').pop().toLowerCase();
                const fileUrl = `http://127.0.0.1:5000/${file}`;

                if (['mp4', 'mov', 'avi'].includes(fileExtension)) {
                    return `
                        <video controls class="gallery-img" style="width:300px; height:300px; display: ${fileIndex === 0 ? 'block' : 'none'};">
                            <source src="${fileUrl}" type="video/${fileExtension}">
                            Ваш браузер не підтримує відтворення цього відео.
                        </video>
                    `;
                } else if (['png', 'jpg', 'jpeg', 'gif'].includes(fileExtension)) {
                    return `
                        <img src="${fileUrl}" class="gallery-img" alt="Product image" style="width:300px; height:300px; display: ${fileIndex === 0 ? 'block' : 'none'};" data-file-index="${fileIndex}">
                    `;
                } else {
                    return `<p>Непідтримуваний тип файлу: ${file}</p>`;
                }
            }).join('');

            const shortDescription = product.description.length > 100
                ? product.description.substring(0, 100) + '...'
                : product.description;

            promoWrapper.innerHTML += `
                <div class="promo-item">
                    <h3>${product.name}</h3>
                    <p>Артикул: ${product.article}</p>
                    <div class="image-gallery">${gallery}</div>
                    <div class="prices">${oldPriceHTML} ${newPriceHTML}</div>
                    <p>${shortDescription}</p>
                    <button onclick="openProductDetailModal('${product.article}')">Детальніше</button>
                    <button onclick="addToCart('${product.article}')">Додати в кошик</button>
                </div>
            `;
        });
    } catch (error) {
        console.error('Помилка при завантаженні акційних товарів:', error);
        promoWrapper.innerHTML = '<p>Не вдалося завантажити акційні товари.</p>';
    }
}

// Функція для прокрутки вліво
function scrollLeft() {
    const promoWrapper = document.querySelector('.promo-products-wrapper');
    promoWrapper.scrollBy({ left: -300, behavior: 'smooth' });
}

// Функція для прокрутки вправо
function scrollRight() {
    const promoWrapper = document.querySelector('.promo-products-wrapper');
    promoWrapper.scrollBy({ left: 300, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', renderPromoProducts);

document.querySelectorAll('.nav-bar a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault(); // Запобігає стандартному переходу
        const targetId = this.getAttribute('href').substring(1); // Отримує ID розділу
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Функція для застосування фону на головній сторінці
function applyBackground() {
    const backgroundImage = localStorage.getItem('backgroundImage');
    if (backgroundImage) {
        document.body.style.backgroundImage = `url(${backgroundImage})`;
        document.body.style.backgroundSize = 'cover'; // Дозволяє фону покривати всю площу екрану
        document.body.style.backgroundPosition = 'center'; // Встановлює фон по центру
    }
}

// Викликаємо applyBackground, щоб застосувати фон, коли сторінка завантажена
window.onload = applyBackground;


// Завантаження товарів після завантаження сторінки
document.addEventListener('DOMContentLoaded', () => {
    // Завантаження товарів і оновлення відображення кошика
    loadProducts().then(() => {
        renderPromoProducts(products);
    });
    updateCartDisplay();
});


