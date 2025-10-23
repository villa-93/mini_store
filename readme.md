# 🛒 Mini Store - E-commerce de Equipos Electrónicos

Tienda virtual moderna con diseño verde, desarrollada con tecnologías vanilla (HTML, CSS, JavaScript, Node.js).

## 📋 Características

- ✅ Sistema de autenticación (Login, Registro, Recuperación de contraseña)
- 🛍️ Catálogo de productos
- 🛒 Carrito de compras
- 💳 Pasarela de pagos simulada
- 📦 Seguimiento de pedidos
- 📄 Generación de facturas
- 👤 Perfil de usuario editable
- 🎨 Diseño moderno con tema verde

## 🗂️ Estructura del Proyecto

```
mini-store/
│
├── server.js              # Servidor backend Node.js/Express
├── package.json           # Dependencias del proyecto
│
└── public/                # Archivos frontend 
    ├── styles.css         # Estilos globales
    ├── login.html         # Módulo de inicio de sesión
    ├── registro.html      # Módulo de registro
    ├── recuperar.html     # Módulo de recuperación de contraseña
    ├── index.html         # Página principal con productos
    ├── perfil.html        # Perfil de usuario
    ├── carrito.html       # Carrito de compras
    ├── pedidos.html       # Estado de pedidos
    └── factura.html       # Factura del pedido
```

## 🚀 Instalación

### 1. Requisitos Previos

- **Node.js** (v14 o superior) - [Descargar](https://nodejs.org/)
- **MySQL Workbench** - [Descargar](https://www.mysql.com/products/workbench/)
- Un editor de código (VS Code recomendado)

### 2. Crear la Base de Datos

Abre MySQL Workbench y ejecuta el siguiente script:

```sql
-- Crear base de datos
CREATE DATABASE mini_store;
USE mini_store;

-- Tabla usuarios
CREATE TABLE usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    rol ENUM('cliente', 'admin') DEFAULT 'cliente',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla productos
CREATE TABLE productos (
    id_producto INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    imagen VARCHAR(255),
    stock INT DEFAULT 0,
    categoria VARCHAR(50),
    id_admin INT,
    FOREIGN KEY (id_admin) REFERENCES usuarios(id_usuario)
);

-- Tabla pedidos
CREATE TABLE pedidos (
    id_pedido INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente', 'procesando', 'enviado', 'entregado', 'cancelado') DEFAULT 'pendiente',
    total DECIMAL(10,2) NOT NULL,
    direccion_envio TEXT,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- Tabla detalle_pedido
CREATE TABLE detalle_pedido (
    id_detalle INT PRIMARY KEY AUTO_INCREMENT,
    id_pedido INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

-- Tabla carrito
CREATE TABLE carrito (
    id_carrito INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

-- Tabla pagos
CREATE TABLE pagos (
    id_pago INT PRIMARY KEY AUTO_INCREMENT,
    id_pedido INT NOT NULL,
    metodo_pago ENUM('tarjeta', 'pse', 'efectivo') NOT NULL,
    estado_pago ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
    total DECIMAL(10,2) NOT NULL,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    referencia_pago VARCHAR(100),
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido)
);

-- Tabla recuperacion_contrasena
CREATE TABLE recuperacion_contrasena (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    fecha_expiracion TIMESTAMP NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
```

### 3. Insertar Datos de Prueba

```sql
-- Insertar usuario admin y clientes de prueba
-- Contraseña por defecto: "123456"
INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES
('Admin Principal', 'admin@ministore.com', '$2b$10$rZJ5Q8xJ8xJ8xJ8xJ8xJ8eMfPGQ5Y1YQk5Y1YQk5Y1YQk5Y1YQk5Y', 'admin'),
('Juan Pérez', 'juan@email.com', '$2b$10$rZJ5Q8xJ8xJ8xJ8xJ8xJ8eMfPGQ5Y1YQk5Y1YQk5Y1YQk5Y1YQk5Y', 'cliente'),
('María García', 'maria@email.com', '$2b$10$rZJ5Q8xJ8xJ8xJ8xJ8xJ8eMfPGQ5Y1YQk5Y1YQk5Y1YQk5Y1YQk5Y', 'cliente');

-- Insertar productos de ejemplo
INSERT INTO productos (nombre, descripcion, precio, imagen, stock, categoria, id_admin) VALUES
('Laptop HP Pavilion 15', 'Intel Core i5, 8GB RAM, 256GB SSD, Pantalla 15.6"', 2500000, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400', 15, 'Computadoras', 1),
('iPhone 13 Pro', 'Pantalla Super Retina XDR 6.1", Chip A15 Bionic, 128GB', 4500000, 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=400', 25, 'Celulares', 1),
('Samsung Galaxy S23', 'Pantalla Dynamic AMOLED 6.1", 8GB RAM, 256GB', 3800000, 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400', 20, 'Celulares', 1),
('AirPods Pro 2', 'Cancelación activa de ruido, Audio espacial, Resistente al agua', 950000, 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400', 30, 'Accesorios', 1),
('iPad Air M1', 'Pantalla Liquid Retina 10.9", Chip M1, 64GB', 2800000, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400', 18, 'Tablets', 1),
('MacBook Air M2', 'Chip M2, 8GB RAM, 256GB SSD, Pantalla Retina 13.6"', 5500000, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400', 12, 'Computadoras', 1),
('Sony WH-1000XM5', 'Audífonos inalámbricos con cancelación de ruido líder en la industria', 1200000, 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400', 22, 'Accesorios', 1),
('Monitor LG UltraWide 34"', 'Resolución 3440x1440, IPS, 144Hz, HDR10', 1800000, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400', 10, 'Monitores', 1),
('Mouse Logitech MX Master 3', 'Inalámbrico, Ergonómico, Sensor de 4000 DPI', 450000, 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400', 35, 'Accesorios', 1),
('Teclado Mecánico Razer', 'Switches Cherry MX, RGB, Cable desmontable', 650000, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400', 28, 'Accesorios', 1),
('Cámara Canon EOS R6', 'Full Frame, 20.1MP, Video 4K, Estabilización 5 ejes', 8500000, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400', 8, 'Cámaras', 1),
('Smartwatch Apple Watch S8', '41mm, GPS, Monitor de salud avanzado, Resistente al agua', 1900000, 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400', 25, 'Wearables', 1);
```

**NOTA:** Las contraseñas hasheadas arriba son de ejemplo. Para crear usuarios reales, usa la función de registro en la aplicación.

### 4. Configurar el Proyecto

1. **Crear carpeta del proyecto:**
```bash
mkdir mini-store
cd mini-store
```

2. **Crear archivo package.json** (copia el contenido del artefacto "package.json")

3. **Crear archivo server.js** (copia el contenido del artefacto "server.js")

4. **Configurar conexión a MySQL** en `server.js`:
```javascript
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',              // TU USUARIO DE MYSQL
    password: 'tu_password',   // TU CONTRASEÑA DE MYSQL
    database: 'mini_store'
});
```

5. **Instalar dependencias:**
```bash
npm install
```

6. **Crear carpeta `public`** y agregar todos los archivos HTML y CSS dentro de ella

### 5. Ejecutar la Aplicación

```bash
npm start
```

O para desarrollo con auto-reinicio:
```bash
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

## 👤 Usuarios de Prueba

Para probar la aplicación, primero registra un usuario nuevo desde la página de registro, o si insertaste los datos de prueba:

- **Email:** `juan@email.com`
- **Contraseña:** `123456`

## 📱 Módulos de la Aplicación

### 1. **Login** (`login.html`)
- Inicio de sesión con correo y contraseña
- Validación de credenciales
- Redirección automática si ya hay sesión activa

### 2. **Registro** (`registro.html`)
- Creación de nueva cuenta
- Validación de datos (email único, contraseña mínimo 6 caracteres)
- Encriptación de contraseñas con bcrypt

### 3. **Recuperar Contraseña** (`recuperar.html`)
- Generación de token de recuperación
- Restablecimiento de contraseña
- **Nota:** En producción se debe configurar nodemailer para envío de emails

### 4. **Página Principal** (`index.html`)
- Catálogo de productos
- Agregar productos al carrito
- Navegación por categorías
- Contador de carrito en tiempo real

### 5. **Perfil** (`perfil.html`)
- Ver datos del usuario
- Editar nombre
- Cambiar contraseña

### 6. **Carrito** (`carrito.html`)
- Ver productos agregados
- Modificar cantidades
- Eliminar productos
- Resumen de compra
- Proceder al pago

### 7. **Pedidos** (`pedidos.html`)
- Historial de pedidos
- Estados: Pendiente, Procesando, Enviado, Entregado, Cancelado
- Ver factura de cada pedido

### 8. **Factura** (`factura.html`)
- Detalle completo del pedido
- Información de pago
- Productos comprados
- Totales con IVA
- Función de impresión

## 🎨 Paleta de Colores

- **Primary:** `#10b981` (Verde)
- **Primary Dark:** `#059669`
- **Primary Light:** `#d1fae5`
- **Secondary:** `#064e3b`
- **Accent:** `#34d399`

## 🔐 Seguridad

- Contraseñas hasheadas con bcrypt (10 rounds)
- Sesiones con express-session
- Validación de datos en frontend y backend
- Protección de rutas con middleware de autenticación

## 🚧 Mejoras Futuras

- [ ] Panel de administración para gestionar productos
- [ ] Envío de emails reales para recuperación de contraseña
- [ ] Búsqueda y filtros de productos
- [ ] Integración con pasarela de pago real (Mercado Pago, PayU)
- [ ] Sistema de comentarios y calificaciones
- [ ] Wishlist (lista de deseos)
- [ ] Notificaciones en tiempo real
- [ ] Chat de soporte

## 📞 Soporte

Para problemas o preguntas, verifica:
1. Que MySQL esté corriendo
2. Que las credenciales en `server.js` sean correctas
3. Que todas las dependencias estén instaladas
4. Que el puerto 3000 esté disponible

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia ISC.

---

**Desarrollado  usando HTML, CSS, JavaScript  y Node.js**