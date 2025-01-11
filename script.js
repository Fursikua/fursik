
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

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || { items: [], total: 0 };
    const cartCount = cart.items.reduce((count, item) => count + item.quantity, 0);
    document.getElementById('cart-count').textContent = cartCount;
}


function addToCart(article, modification = null) {
    const product = products.find(product => product.article === article);
    if (!product) return;

    // Перевірка: якщо товар має модифікації, але модифікацію не передано
    if (product.modifications && product.modifications.length > 0 && !modification) {
        // Display the pointing hand and message
        const detailButton = document.querySelector(`[onclick="openProductDetailModal('${article}')"]`);
        if (detailButton) {
            // Check if the notification already exists
            let notification = detailButton.parentElement.querySelector('.modification-notification');
            if (!notification) {
                notification = document.createElement('div');
                notification.classList.add('modification-notification');
                notification.innerHTML = `
                    <span>👉</span> <span>Виберіть модифікацію</span>
                `;
                detailButton.parentElement.appendChild(notification);

                // Automatically remove the notification after 3 seconds
                setTimeout(() => notification.remove(), 3000);
            }
        }
        return;
    }

    let cart = JSON.parse(localStorage.getItem('cart')) || { items: [], total: 0 };

    const existingProduct = cart.items.find(item => item.article === product.article && item.modification === modification);
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        const newProduct = { ...product, quantity: 1, modification }; // Додаємо модифікацію
        cart.items.push(newProduct);
    }

    cart.total = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    updateCartCount();
}

function removeFromCart(article) {
    const cart = JSON.parse(localStorage.getItem('cart')) || { items: [], total: 0 };

    const itemIndex = cart.items.findIndex(item => item.article === article);
    if (itemIndex !== -1) {
        const removedItem = cart.items.splice(itemIndex, 1);
        cart.total -= removedItem[0].price * removedItem[0].quantity;

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        updateCartCount(); // Оновлюємо лічильник
    }
}

// Оновлюйте лічильник при завантаженні сторінки
window.onload = function () {
    updateCartDisplay();
    updateCartCount(); // Додаємо виклик лічильника
};

function goToCart() {
    window.location.href = 'cart.html';
}

function clearCart() {
    localStorage.removeItem('cart');
    updateCartDisplay();
}
function addModificationField() {
    const container = document.getElementById("modifications-container");
    const newField = document.createElement("div");
    newField.className = "modification-field";
    newField.innerHTML = `
        <input type="text" name="modification" placeholder="Введіть модифікацію">
        <button type="button" onclick="removeField(this)">-</button>
    `;
    container.appendChild(newField);
}

function removeField(button) {
    const field = button.parentElement;
    field.remove();
}

function openProductDetailModal(article) {
    // Знайдемо товар за артикулом
    const product = products.find(product => product.article === article);
    if (!product) return;

    const productModal = document.getElementById('productDetailModal');

    // Заповнення інформації про товар
    document.getElementById('detail-product-name').innerText = product.name;
    document.getElementById('detail-product-description').innerText = product.description;
    document.getElementById('detail-product-price').innerText = `${product.price} грн`;

    // Галерея зображень або відео
    const gallery = product.files.map(file => {
        const fileExtension = file.split('.').pop().toLowerCase();
        const fileUrl = `https://fursik-b40362fa22e8.herokuapp.com/${file}`;

        if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
            return `<img src="${fileUrl}" alt="${product.name}" class="gallery-img">`;
        } else if (['mp4', 'avi', 'webm'].includes(fileExtension)) {
            return `<video controls class="gallery-video">
                        <source src="${fileUrl}" type="video/${fileExtension}">
                    </video>`;
        } else {
            return `<a href="${fileUrl}" target="_blank">Переглянути файл</a>`;
        }
    }).join('');
    document.getElementById('detail-product-gallery').innerHTML = gallery;

    // Відображення модифікацій
    const modificationsContainer = document.getElementById('detail-product-modifications');
    if (product.modifications && product.modifications.length > 0) {
        const modificationsHTML = product.modifications.map(mod => `
            <button class="modification-btn" onclick="selectProductModification('${mod}', this)">${mod}</button>
        `).join('');
        modificationsContainer.innerHTML = modificationsHTML;
    } else {
        modificationsContainer.innerHTML = '<p>Модифікації недоступні</p>';
    }

    // Відображення модального вікна
    productModal.style.display = 'flex';
    productModal.classList.add('active');

    // Зберігаємо артикул товару для функції "Додати в кошик"
    window.currentDetailModalProductArticle = product.article;
    window.currentSelectedModification = null; // Скидаємо вибрану модифікацію
}

// Функція для вибору модифікації
function selectProductModification(modification, button) {
    // Знімаємо активність з усіх кнопок
    const buttons = document.querySelectorAll('.modification-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    // Застосовуємо активний стиль до вибраної кнопки
    button.classList.add('active');

    // Зберігаємо вибрану модифікацію
    window.currentSelectedModification = modification;
}
// Функція закриття модального вікна
function closeProductDetailModal() {
    const productModal = document.getElementById('productDetailModal');
    productModal.classList.remove('active');
    productModal.style.display = 'none';
}
function animateAddToCart(button) {
    // Знаходимо позиції кнопки та іконки кошика
    const cartIcon = document.getElementById('cart-icon-img');
    const cartIconRect = cartIcon.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();

    // Створюємо літаючий елемент
    const flyingItem = document.createElement('div');
    flyingItem.classList.add('flying-item');
    document.body.appendChild(flyingItem);

    // Встановлюємо початкову позицію літаючого елемента
    flyingItem.style.left = buttonRect.left + (buttonRect.width / 2) + 'px';
    flyingItem.style.top = buttonRect.top + (buttonRect.height / 2) + 'px';

    // Розраховуємо зміщення
    const deltaX = cartIconRect.left + (cartIconRect.width / 2) - (buttonRect.left + (buttonRect.width / 2));
    const deltaY = cartIconRect.top + (cartIconRect.height / 2) - (buttonRect.top + (buttonRect.height / 2));

    // Налаштовуємо анімацію
    flyingItem.animate([
        { transform: 'translate(0, 0)', opacity: 1 },
        { transform: `translate(${deltaX}px, ${deltaY}px)`, opacity: 0.5 }
    ], {
        duration: 800,
        easing: 'ease-in-out'
    });

    // Видаляємо літаючий елемент після завершення анімації
    setTimeout(() => {
        flyingItem.remove();
        // Додаємо ефект підстрибування до іконки кошика
        cartIcon.classList.add('bounce');
        setTimeout(() => {
            cartIcon.classList.remove('bounce');
        }, 500);
    }, 800);
}

// Функція додавання товару до кошика з перевіркою модифікацій
function addToCartFromDetailModal(button) {
    const article = window.currentDetailModalProductArticle;
    const selectedModification = window.currentSelectedModification;

    // Перевірка наявності модифікацій та вибору
    const product = products.find(product => product.article === article);
    if (product.modifications && product.modifications.length > 0 && !selectedModification) {
        // Display the pointing hand and message
        const modalContent = button.parentElement; // Parent element inside the modal
        let notification = modalContent.querySelector('.modification-notification');

        // Check if the notification already exists
        if (!notification) {
            notification = document.createElement('div');
            notification.classList.add('modification-notification');
            notification.innerHTML = `
                <span>👉</span> <span>Виберіть модифікацію</span>
            `;
            modalContent.appendChild(notification);

            // Automatically remove the notification after 3 seconds
            setTimeout(() => notification.remove(), 3000);
        }
        return;
    }

    // Додаємо товар до кошика
    if (article) {
        addToCart(article, selectedModification);
        animateAddToCart(button);
        closeProductDetailModal();
    }
}
let products = [];

async function loadProducts() {
    try {
        const response = await fetch('https://fursik-b40362fa22e8.herokuapp.com/products');
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
            const fileUrl = `https://fursik-b40362fa22e8.herokuapp.com/${file}`;

            if (['mp4', 'mov', 'avi', 'webm'].includes(fileExtension)) {
                return `
                    <video data-file-index="${fileIndex}" class="media-file" controls  display: ${fileIndex === 0 ? 'block' : 'none'};">
                        <source src="${fileUrl}" type="video/${fileExtension}">
                        Ваш браузер не підтримує відтворення цього відео.
                    </video>
                `;
            } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExtension)) {
                return `
                    <img data-file-index="${fileIndex}" class="media-file" src="${fileUrl}"  display: ${fileIndex === 0 ? 'block' : 'none'};" alt="${product.name}">
                `;
            } else {
                return `<a href="${fileUrl}" target="_blank" class="media-file" style="display: ${fileIndex === 0 ? 'block' : 'none'};">Переглянути файл</a>`;
            }
        }).join('');

        const navigationButtons = product.files.length > 1
            ? `
                <button class="navigation-btn" onclick="changeMedia(${index}, -1)">Назад</button>
                <button class="navigation-btn" onclick="changeMedia(${index}, 1)">Далі</button>
            `
            : '';

        productList.innerHTML += `
            <div class="product-item">
                <h3>${product.name}</h3>
                <p>Артикул: ${product.article}</p>
                <div id="media-${index}" class="image-gallery" data-product-index="${index}">${gallery}</div>
                ${navigationButtons}
                <p id="description-${index}">${shortDescription}</p>
                <button onclick="openProductDetailModal('${product.article}')">Детальніше</button>
                <div class="prices">
                    ${oldPriceHTML} ${newPriceHTML}
                </div>
                <button onclick="addToCart('${product.article}')">Додати в кошик</button>
            </div>
        `;
    });

    enableSwipe(); // Додаємо підтримку свайпів для всіх товарів
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

    fetch('https://fursik-b40362fa22e8.herokuapp.com/upload', {
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
    const mediaContainer = document.querySelector(`.image-gallery[data-product-index="${productIndex}"]`);
    if (!mediaContainer) return;

    const mediaFiles = mediaContainer.querySelectorAll('.media-file');
    const currentFileIndex = Array.from(mediaFiles).findIndex(file => file.style.display === 'block');

    // Обчислюємо наступний індекс
    let nextFileIndex = currentFileIndex + direction;
    if (nextFileIndex < 0) nextFileIndex = mediaFiles.length - 1;
    if (nextFileIndex >= mediaFiles.length) nextFileIndex = 0;

    // Оновлюємо відображення файлів
    mediaFiles.forEach((file, index) => {
        file.style.display = index === nextFileIndex ? 'block' : 'none';
    });
}
function toggleView() {
    const productGrid = document.getElementById('product-list');
    const toggleBtn = document.getElementById('view-toggle-btn');

    // Перемикання класу для контейнера продуктів
    if (productGrid.classList.contains('two-columns')) {
        productGrid.classList.remove('two-columns');
        toggleBtn.textContent = 'Змінити вид'; // Оновлюємо текст кнопки
    } else {
        productGrid.classList.add('two-columns');
        toggleBtn.textContent = 'Повернути стандартний вигляд';
    }
}
document.addEventListener("DOMContentLoaded", function () {
    const toggleButton = document.getElementById("view-toggle-btn");
    const originalOffsetTop = toggleButton.offsetTop; // Початкове положення кнопки

    window.addEventListener("scroll", function () {
        if (window.scrollY > originalOffsetTop) {
            toggleButton.classList.add("fixed");
        } else {
            toggleButton.classList.remove("fixed");
        }
    });
});

function hideNavigationButtonsForTouchDevices() {
    // Перевірка на сенсорний пристрій
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (isTouchDevice) {
        // Знаходимо всі кнопки "Назад" і "Далі"
        const navigationButtons = document.querySelectorAll('.navigation-btn');

        // Додаємо клас для приховування
        navigationButtons.forEach(button => {
            button.classList.add('touch-hidden');
        });
    }
}

// Викликаємо функцію після завантаження сторінки
document.addEventListener('DOMContentLoaded', hideNavigationButtonsForTouchDevices);
window.addEventListener('resize', hideNavigationButtonsForTouchDevices);

function enableSwipe() {
    const allMediaContainers = document.querySelectorAll('.image-gallery'); // Отримуємо всі галереї

    allMediaContainers.forEach((mediaContainer) => {
        let startX = 0;
        let endX = 0;
        const productIndex = mediaContainer.getAttribute('data-product-index'); // Отримуємо індекс продукту

        // Початок свайпу
        mediaContainer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        // Завершення свайпу
        mediaContainer.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;

            const swipeDistance = endX - startX;
            if (swipeDistance > 50) {
                // Свайп вправо (назад)
                changeMedia(productIndex, -1);
            } else if (swipeDistance < -50) {
                // Свайп вліво (вперед)
                changeMedia(productIndex, 1);
            }
        });
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
        const response = await fetch('https://fursik-b40362fa22e8.herokuapp.com/products');
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
                const fileUrl = `https://fursik-b40362fa22e8.herokuapp.com/${file}`;

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

// Додати функцію для кнопки прокрутки догори
document.addEventListener("DOMContentLoaded", function () {
    const scrollToTopBtn = document.getElementById("scroll-to-top");

    // Показати/приховати кнопку залежно від прокрутки
    window.addEventListener("scroll", function () {
        if (window.scrollY > 500) {
            scrollToTopBtn.style.opacity = "1";
            scrollToTopBtn.style.visibility = "visible";
        } else {
            scrollToTopBtn.style.opacity = "0";
            scrollToTopBtn.style.visibility = "hidden";
        }
    });

    // Прокрутити догори при натисканні
    scrollToTopBtn.addEventListener("click", function () {
        window.scrollTo({
            top: 0,
            behavior: "smooth" // Плавна прокрутка
        });
    });
});


// Завантаження товарів після завантаження сторінки
document.addEventListener('DOMContentLoaded', () => {
    // Завантаження товарів і оновлення відображення кошика
    loadProducts().then(() => {
        renderPromoProducts(products);
    });
    updateCartDisplay();
});

