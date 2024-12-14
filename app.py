import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
app = Flask(__name__)
CORS(app)  # Дозволяє всі джерела
import os
import uuid
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)  # Дозволяє всі джерела

UPLOAD_FOLDER = 'upload'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'avi', 'mov'}
app.config['ALLOWED_EXTENSIONS'] = ALLOWED_EXTENSIONS
DATA_FILE = 'products.json'  # Файл для зберігання даних

# Завантаження списку товарів із файлу
# Завантаження списку товарів із файлу
def load_products():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as file:
                return json.load(file)
        except json.JSONDecodeError:
            return []  # Повертаємо порожній список, якщо файл пошкоджено
    return []

# Збереження списку товарів у файл
def save_products(products):
    with open(DATA_FILE, 'w', encoding='utf-8') as file:
        json.dump(products, file, ensure_ascii=False, indent=4)

# Початковий список товарів
products = load_products()

# Перевірка дозволених файлів
def allowed_file(filename):
 return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# Додано збереження артикула
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'Файли не надано'})

    files = request.files.getlist('file')
    saved_files = []

    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])  # Створюємо папку, якщо її не існує

    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4().hex}_{filename}"  # Додаємо унікальний ідентифікатор
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(filepath)
            saved_files.append(f"/{filepath.replace(os.sep, '/')}")  # Уніфікований шлях

    name = request.form.get('name')
    article = request.form.get('article')  # Артикул товару
    price = request.form.get('price')
    old_price = request.form.get('oldPrice')  # Стару ціну
    description = request.form.get('description')

    if not name or not article or not price or not description:
        return jsonify({'success': False, 'message': 'Всі поля повинні бути заповнені'}), 400

    try:
        price = float(price)
        old_price = float(old_price) if old_price else None  # Перевірка і конвертація старої ціни
    except ValueError:
        return jsonify({'success': False, 'message': 'Ціна повинна бути числом'}), 400

    new_product = {
        'name': name,
        'article': article,  # Додаємо артикул
        'price': price,
        'oldPrice': old_price,  # Додаємо стару ціну
        'description': description,
        'files': saved_files
    }
    products.append(new_product)
    save_products(products)  # Зберігаємо зміни у файл

    return jsonify({'success': True, 'files': saved_files})

@app.route('/products', methods=['GET'])
def get_products():
    return jsonify(products)

@app.route('/products/search', methods=['GET'])
def search_products():
    query = request.args.get('article', '').strip().lower()
    if not query:
        return jsonify({'success': False, 'message': 'Необхідно вказати артикул'}), 400

    matching_products = [product for product in products if product['article'].lower() == query]
    if matching_products:
        return jsonify({'success': True, 'products': matching_products})
    else:
        return jsonify({'success': False, 'message': 'Продукт не знайдено'}), 404

@app.route('/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    if not (0 <= product_id < len(products)):
        return jsonify({'success': False, 'message': 'Продукт не знайдено'}), 404

    product = products[product_id]

    # Оновлення даних товару
    name = request.form.get('name', product['name'])
    article = request.form.get('article', product['article'])
    price = request.form.get('price', product['price'])
    old_price = request.form.get('oldPrice', product.get('oldPrice'))
    description = request.form.get('description', product['description'])

    # Перевірка файлів
    files = request.files.getlist('file')
    saved_files = product['files']  # Існуючі файли залишаються

    if files:
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])

        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4().hex}_{filename}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                file.save(filepath)
                saved_files.append(f"/{filepath.replace(os.sep, '/')}")  # Додаємо нові файли

    # Оновлення товару
    try:
        price = float(price)
        old_price = float(old_price) if old_price else None
    except ValueError:
        return jsonify({'success': False, 'message': 'Ціна повинна бути числом'}), 400

    products[product_id] = {
        'name': name,
        'article': article,
        'price': price,
        'oldPrice': old_price,
        'description': description,
        'files': saved_files
    }
    save_products(products)

    return jsonify({'success': True, 'product': products[product_id]})

@app.route('/products/<int:product_id>/files/<int:file_index>', methods=['DELETE'])
def delete_file(product_id, file_index):
    if not (0 <= product_id < len(products)):
        return jsonify({'success': False, 'message': 'Продукт не знайдено'}), 404

    product = products[product_id]

    if not (0 <= file_index < len(product['files'])):
        return jsonify({'success': False, 'message': 'Файл не знайдено'}), 404

    # Видалення файлу з файлової системи
    file_path = product['files'][file_index][1:]  # Видаляємо "/" на початку шляху
    if os.path.exists(file_path):
        os.remove(file_path)

    # Видалення файлу зі списку
    deleted_file = product['files'].pop(file_index)
    save_products(products)

    return jsonify({'success': True, 'deleted_file': deleted_file})

@app.route('/upload/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    # Перевіряємо, чи існує папка для завантажень
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    port = int(os.environ.get("PORT", 5000))  # Використовуємо PORT від Heroku або 5000 за замовчуванням
    app.run(debug=True, host="0.0.0.0", port=port)

# Ендпоінт для завантаження зображення фону
@app.route('/upload-background', methods=['POST'])
def upload_background():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'Файл не надано'})

    file = request.files['file']
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        unique_filename = f"background_{uuid.uuid4().hex}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(filepath)

        return jsonify({'success': True, 'file': f"/upload/{unique_filename}"})
    return jsonify({'success': False, 'message': 'Недопустимий тип файлу'}), 400
