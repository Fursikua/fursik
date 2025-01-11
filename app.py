import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_cors import cross_origin
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Дозволяє всі джерела
import os
import uuid
from werkzeug.utils import secure_filename


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

def cleanup_unused_files():
    """Видаляє файли з папки завантажень, які не прив'язані до жодного товару."""
    used_files = {file for product in products for file in product.get('files', [])}
    upload_folder = app.config['UPLOAD_FOLDER']
    
    if os.path.exists(upload_folder):
        for filename in os.listdir(upload_folder):
            filepath = os.path.join(upload_folder, filename)
            relative_path = f"/{os.path.relpath(filepath).replace(os.sep, '/')}"
            if relative_path not in used_files:
                try:
                    os.remove(filepath)
                    print(f"Видалено невикористаний файл: {filepath}")
                except Exception as e:
                    print(f"Не вдалося видалити файл {filepath}: {e}")

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

# Додано збереження артикула
@app.route('/upload', methods=['POST'])
def upload_file():
    files = request.files.getlist('file') if 'file' in request.files else []
    saved_files = []

    # Перевірка та створення папки для завантажень
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])

    # Збереження файлів
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(filepath)
            saved_files.append(f"/{filepath.replace(os.sep, '/')}")

    # Отримання даних з форми
    name = request.form.get('name')
    article = request.form.get('article')
    price = request.form.get('price')
    old_price = request.form.get('oldPrice')
    description = request.form.get('description')
    modifications = request.form.getlist('modification')  # Отримуємо список модифікацій

    print(f"Received data: name={name}, article={article}, price={price}, description={description}, old_price={old_price}, modifications={modifications}")

    # Перевірка обов'язкових полів
    if not name or not article or not price or not description:
        return jsonify({'success': False, 'message': 'Всі поля повинні бути заповнені'}), 400

    try:
        price = float(price)
        old_price = float(old_price) if old_price and old_price != 'null' else None
    except ValueError as e:
        print(f"Error converting price or old_price: {e}")
        return jsonify({'success': False, 'message': 'Ціна повинна бути числом'}), 400

    # Формування нового товару
    new_product = {
        'name': name,
        'article': article,
        'price': price,
        'oldPrice': old_price,
        'description': description,
        'files': saved_files,
        'modifications': modifications  # Додаємо модифікації
    }
    products.append(new_product)
    save_products(products)
    cleanup_unused_files()

    return jsonify({'success': True, 'files': saved_files})

@app.route('/products', methods=['GET'])
def get_products():
    return jsonify(products)

@app.route('/products', methods=[ 'DELETE'])
def delete_all_products():
    global products
    products = []  # Очищаємо список товарів
    save_products(products)  # Зберігаємо зміни

    return jsonify({'success': True}), 200

@app.route('/products/<int:product_id>/files/<int:file_id>', methods=['DELETE'])
def delete_file(product_id, file_id):
    if not (0 <= product_id < len(products)):
        return jsonify({'success': False, 'message': 'Продукт не знайдено'}), 404

    product = products[product_id]
    if not (0 <= file_id < len(product['files'])):
        return jsonify({'success': False, 'message': 'Файл не знайдено'}), 404

    file_path = product['files'][file_id]
    full_path = os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(file_path))

    if os.path.exists(full_path):
        os.remove(full_path)
        print(f"Файл {full_path} успішно видалено.")
    else:
        print(f"Файл {full_path} не знайдено на диску.")

    product['files'].pop(file_id)
    save_products(products)

    return jsonify({'success': True}), 200

@app.route('/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    if not (0 <= product_id < len(products)):
        return jsonify({'success': False, 'message': 'Продукт не знайдено'}), 404

    product = products[product_id]
    print(f"Updating product with ID: {product_id}")

    # Логування отриманих даних
    print("Request data:", request.form)
    print("Files to delete:", request.form.getlist('filesToDelete'))
    print("Modifications:", request.form.getlist('modification'))

    # Оновлення даних товару
    name = request.form.get('name', product['name']).strip()
    article = request.form.get('article', product['article']).strip()
    price = request.form.get('price', product['price'])
    old_price = request.form.get('oldPrice', product.get('oldPrice'))
    description = request.form.get('description', product['description']).strip()
    modifications = request.form.getlist('modification')  # Отримуємо список модифікацій

    # Перевірка обов'язкових полів
    if not name or not article or not price or not description:
        return jsonify({'success': False, 'message': 'Всі поля повинні бути заповнені'}), 400

    try:
        price = float(price)
        old_price = float(old_price) if old_price and old_price.lower() != 'null' else None
    except ValueError:
        return jsonify({'success': False, 'message': 'Ціна та стара ціна повинні бути числовими значеннями'}), 400

    # Видалення файлів
    files_to_delete = request.form.getlist('filesToDelete')
    for file_path in files_to_delete:
        full_path = os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(file_path))
        if os.path.exists(full_path):
            try:
                os.remove(full_path)
                print(f"Файл {full_path} успішно видалено.")
            except Exception as e:
                print(f"Помилка при видаленні файлу {full_path}: {e}")
        else:
            print(f"Файл {full_path} не знайдено на диску.")
        if file_path in product['files']:
            product['files'].remove(file_path)

    # Завантаження нових файлів
    files = request.files.getlist('file') if 'file' in request.files else []
    new_files = []
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            try:
                file.save(filepath)
                new_files.append(f"/{filepath.replace(os.sep, '/')}")  # Додаємо у список нових файлів
                print(f"Новий файл {filepath} успішно завантажено.")
            except Exception as e:
                print(f"Помилка при збереженні файлу {filepath}: {e}")

    # Додавання нових файлів до існуючих
    product['files'].extend(new_files)

    # Перевірка модифікацій
    modifications = [mod.strip() for mod in modifications if mod.strip()]
    print("Final modifications list:", modifications)

    # Оновлення даних товару
    product.update({
        'name': name,
        'article': article,
        'price': price,
        'oldPrice': old_price,
        'description': description,
        'modifications': modifications,
        'files': product['files']
    })

    # Збереження змін
    save_products(products)

    return jsonify({'success': True, 'product': product})
@app.route('/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    if not (0 <= product_id < len(products)):
        return jsonify({'success': False, 'message': 'Продукт не знайдено'}), 404

    product = products.pop(product_id)
    save_products(products)
    cleanup_unused_files()  # Очищуємо невикористані файли

    return jsonify({'success': True, 'deleted_product': product}), 200

@app.route('/upload/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    # Перевіряємо, чи існує папка для завантажень
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    port = int(os.environ.get("PORT", 5000))  # Використовуємо PORT від Heroku або 5000 за замовчуванням
    app.run(debug=True, host="0.0.0.0", port=port)

