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

function searchProducts() {
    const query = document.getElementById('search-input').value.trim().toLowerCase(); // Отримуємо запит користувача
    const productList = document.getElementById('product-list');

    // Якщо поле пошуку порожнє, не відображаємо товари
    if (query === '') {
        productList.innerHTML = ''; // Очищаємо список товарів
        productList.style.display = 'none'; // Сховуємо список товарів
        return;
    }

    // Фільтруємо продукти за назвою або описом
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(query) || 
        product.description.toLowerCase().includes(query)
    );

    // Якщо немає результатів пошуку
    if (filteredProducts.length === 0) {
        productList.innerHTML = '<p>Товарів за вашим запитом не знайдено.</p>';
    } else {
        renderProducts(filteredProducts); // Викликаємо функцію для рендерингу відфільтрованих товарів
    }

    // Показуємо список товарів після фільтрації
    productList.style.display = 'grid';
}

const productGrid = document.querySelector('.product-grid');

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

function renderProducts(products) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = ''; // Очищаємо попередні товари

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
                    <video data-file-index="${fileIndex}" class="media-file" controls style="display: ${fileIndex === 0 ? 'block' : 'none'};">
                        <source src="${fileUrl}" type="video/${fileExtension}">
                        Ваш браузер не підтримує відтворення цього відео.
                    </video>
                `;
            } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExtension)) {
                return `
                    <img data-file-index="${fileIndex}" class="media-file" src="${fileUrl}" style="display: ${fileIndex === 0 ? 'block' : 'none'};" alt="${product.name}">
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

        const slug = `${product.article}-${product.name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '')}`;

        productList.innerHTML += `
            <div class="product-item">
                <h3><a href="/product/${slug}" target="_blank">${product.name}</a></h3>
                <p>Артикул: ${product.article}</p>
                <div id="media-${index}" class="image-gallery" data-product-index="${index}">${gallery}</div>
                ${navigationButtons}
                <p id="description-${index}">${shortDescription}</p>
                <div class="prices">
                    ${oldPriceHTML} ${newPriceHTML}
                </div>
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
        let currentX = 0;
        let isSwiping = false;
        const productIndex = mediaContainer.getAttribute('data-product-index'); // Індекс продукту
        const mediaFiles = mediaContainer.querySelectorAll('.media-file');

        function onTouchStart(e) {
            startX = e.touches[0].clientX;
            isSwiping = true;
        }

        function onTouchMove(e) {
            if (!isSwiping) return;
            currentX = e.touches[0].clientX;
            const deltaX = currentX - startX;

            // Додаємо легкий візуальний зсув
            mediaContainer.style.transform = `translateX(${deltaX}px)`;
        }

        function onTouchEnd() {
            if (!isSwiping) return;
            const deltaX = currentX - startX;

            // Якщо свайп достатньо довгий, змінюємо елемент
            if (deltaX > 50) {
                changeMedia(productIndex, -1); // Свайп назад
            } else if (deltaX < -50) {
                changeMedia(productIndex, 1); // Свайп вперед
            }

            // Скидаємо позицію
            mediaContainer.style.transform = 'translateX(0)';
            isSwiping = false;
        }

        // Додаємо обробники подій
        mediaContainer.addEventListener('touchstart', onTouchStart);
        mediaContainer.addEventListener('touchmove', onTouchMove);
        mediaContainer.addEventListener('touchend', onTouchEnd);

        // Підтримка для миші (десктопи з сенсорними екранами)
        mediaContainer.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            isSwiping = true;
        });

        mediaContainer.addEventListener('mousemove', (e) => {
            if (!isSwiping) return;
            currentX = e.clientX;
            const deltaX = currentX - startX;
            mediaContainer.style.transform = `translateX(${deltaX}px)`;
        });

        mediaContainer.addEventListener('mouseup', () => {
            if (!isSwiping) return;
            const deltaX = currentX - startX;

            if (deltaX > 50) {
                changeMedia(productIndex, -1);
            } else if (deltaX < -50) {
                changeMedia(productIndex, 1);
            }

            mediaContainer.style.transform = 'translateX(0)';
            isSwiping = false;
        });

        mediaContainer.addEventListener('mouseleave', () => {
            if (!isSwiping) return;
            mediaContainer.style.transform = 'translateX(0)';
            isSwiping = false;
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
// Функція для контролю видимості футера
(function() {
    let lastScrollY = window.scrollY;
    const footer = document.querySelector('footer');

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > lastScrollY) {
            // Прокрутка вниз
            footer.style.transform = 'translateY(100%)';
            footer.style.transition = 'transform 0.3s ease';
        } else {
            // Прокрутка вверх
            footer.style.transform = 'translateY(0)';
        }

        lastScrollY = currentScrollY;
    });
})();


// Завантаження товарів після завантаження сторінки
document.addEventListener('DOMContentLoaded', () => {
    // Завантаження товарів і оновлення відображення кошика
    loadProducts().then(() => {
        renderPromoProducts(products);
    });
    updateCartDisplay();
});


let currentImageIndex = 0;
let images = document.querySelectorAll('.product-thumbnail');
let modal = document.getElementById("imagePreviewModal");
let previewImage = document.getElementById("previewImage");
let caption = document.getElementById("imageCaption");

// Відкриває модальне вікно при кліку на зображення
images.forEach((img, index) => {
    img.addEventListener("click", function() {
        openImageModal(index);
    });
});

function openImageModal(index) {
    modal.style.display = "block";
    previewImage.src = images[index].src;
    caption.innerHTML = images[index].alt;
    currentImageIndex = index;
}

// Закриває модальне вікно
function closeImageModal() {
    modal.style.display = "none";
}

// Перемикає зображення вперед/назад
function changeImage(direction) {
    currentImageIndex += direction;

    // Перевірка, щоб зациклювати зображення
    if (currentImageIndex >= images.length) {
        currentImageIndex = 0;
    } else if (currentImageIndex < 0) {
        currentImageIndex = images.length - 1;
    }

    previewImage.src = images[currentImageIndex].src;
    caption.innerHTML = images[currentImageIndex].alt;
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

        promoProducts.forEach((product, index) => {
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

                const slug = `${product.article}-${product.name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '')}`;

            promoWrapper.innerHTML += `
                <div class="promo-item" data-index="${index}">
                <h3><a href="/product/${slug}" target="_blank">${product.name}</a></h3>
                    <div class="image-gallery">${gallery}</div>
                    <div class="prices">${oldPriceHTML} ${newPriceHTML}</div>
                    <p>${shortDescription}</p>
                    <button onclick="addToCartWithModification('{{ product.article }}'); animateAddToCart(this);">Додати в кошик</button>
                    </div>
            `;
        });

        // Функція для зацикленої прокрутки товарів
        const productItems = promoWrapper.querySelectorAll('.promo-item');
        productItems.forEach(item => {
            item.addEventListener('click', () => {
                const index = Array.from(productItems).indexOf(item);
                scrollToProductCenter(index);
            });
        });

        // Функція для прокрутки елементів так, щоб товар був по центру
        function scrollToProductCenter(index) {
            const itemWidth = productItems[0].offsetWidth;
            const containerWidth = promoWrapper.offsetWidth;
            const scrollPosition = itemWidth * index - (containerWidth / 2) + (itemWidth / 2);

            promoWrapper.scrollTo({
                left: scrollPosition,
                behavior: 'smooth'
            });
        }

    } catch (error) {
        console.error('Помилка при завантаженні акційних товарів:', error);
        promoWrapper.innerHTML = '<p>Не вдалося завантажити акційні товари.</p>';
    }
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

    if (!productDetails) {
        alert('Інформація про товар відсутня.');
        return;
    }

    const name = document.querySelector('h1').textContent; // Назва товару
    const description = productDetails.querySelector('p:nth-child(2)').textContent.split(': ')[1];
    const price = parseFloat(productDetails.querySelector('p:last-child span').textContent.split(' ')[0]);
    const modification = modificationSelect ? modificationSelect.value : null;

    // Перевірка вибору модифікації
    if (modificationSelect && !modification) {
        alert('Будь ласка, оберіть модифікацію!');
        return;
    }

    // Отримуємо зображення товару
    const imageSrc = document.querySelector('.product-image-gallery img')?.src || '';

    let cart = JSON.parse(localStorage.getItem('cart')) || { items: [], total: 0 };

    const existingProduct = cart.items.find(
        item => item.article === article && item.modification === modification
    );

    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        const newProduct = {
            article,
            name,
            description,
            price,
            modification,
            quantity: 1,
            imageSrc,
        };
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

function toggleModificationsVisibility() {
    const modificationsContainer = document.getElementById('modifications-container');
    const modificationSelect = document.getElementById('modification-select');

    if (modificationsContainer && (!modificationSelect || modificationSelect.options.length === 0)) {
        modificationsContainer.style.display = 'none';
    } else if (modificationsContainer) {
        modificationsContainer.style.display = 'block';
    }
}

// Викликайте функцію після завантаження продукту
document.addEventListener('DOMContentLoaded', toggleModificationsVisibility);

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

// Функція для відслідковування свайпу і приховування кошика
let touchStartX = 0;
let touchEndX = 0;

const cartIcon = document.getElementById('cart-icon');
const cartDetails = document.getElementById('cart-details');

// Відслідковуємо початок свайпу
cartIcon.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX; // зберігаємо початкову позицію свайпу
});

// Відслідковуємо кінець свайпу
cartIcon.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX; // зберігаємо кінцеву позицію свайпу

    // Перевіряємо напрямок свайпу
    if (touchEndX - touchStartX > 50) {
        // Свайп вправо — показати кошик
        cartDetails.style.display = 'block';
    } else if (touchStartX - touchEndX > 50) {
        // Свайп вліво — приховати кошик
        cartDetails.style.display = 'none';
    }
});

// Закриття кошика при натисканні поза межами
window.addEventListener('click', function (event) {
    if (!cartIcon.contains(event.target) && !cartDetails.contains(event.target)) {
        cartDetails.style.display = 'none'; // Закриваємо кошик
    }
});

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
// Функція для контролю видимості футера
(function() {
    let lastScrollY = window.scrollY;
    const footer = document.querySelector('footer');

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > lastScrollY) {
            // Прокрутка вниз
            footer.style.transform = 'translateY(100%)';
            footer.style.transition = 'transform 0.3s ease';
        } else {
            // Прокрутка вверх
            footer.style.transform = 'translateY(0)';
        }

        lastScrollY = currentScrollY;
    });
})();


// Оновлюйте лічильник при завантаженні сторінки
window.onload = function () {
    updateCartDisplay();
    updateCartCount(); // Додаємо виклик лічильника
};
