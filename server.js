// server.js - Servidor Backend
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors');

const app = express();
const PORT = 3000;

// IMPORTANTE: El orden del middleware es crucial
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'ministore-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false  // Cambiar a true si usas HTTPS
    }
}));

app.use(express.static('public'));
// Conexión a MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Vill@0640*21',
    database: 'mini_store'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error conectando a MySQL:', err);
        return;
    }
    console.log('✅ Conectado a MySQL');
});

// Middleware para verificar sesión
const verificarSesion = (req, res, next) => {
    if (!req.session.usuario) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    next();
};
// Ruta de prueba
app.get('/api/test', (req, res) => {
    res.json({ mensaje: 'API funcionando' });
});

app.post('/api/test-post', (req, res) => {
    console.log('Test POST - Body:', req.body);
    res.json({ mensaje: 'POST funcionando', recibido: req.body });
});
// ========== RUTAS DE AUTENTICACIÓN ==========

// Registro
app.post('/api/registro', async (req, res) => {
    console.log('📝 Registro - Body:', req.body);
    const { nombre, correo, contrasena } = req.body;
    
    try {
        db.query('SELECT * FROM usuarios WHERE correo = ?', [correo], async (err, results) => {
            if (err) {
                console.error('❌ Error BD:', err);
                return res.status(500).json({ error: 'Error en el servidor' });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ error: 'El correo ya está registrado' });
            }
            
            const hashContrasena = await bcrypt.hash(contrasena, 10);
            
            db.query(
                'INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES (?, ?, ?, ?)',
                [nombre, correo, hashContrasena, 'cliente'],
                (err, result) => {
                    if (err) {
                        console.error('❌ Error insertar:', err);
                        return res.status(500).json({ error: 'Error al registrar' });
                    }
                    console.log('✅ Usuario creado ID:', result.insertId);
                    res.json({ mensaje: 'Usuario registrado exitosamente', id: result.insertId });
                }
            );
        });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Login
app.post('/api/login', (req, res) => {
    const { correo, contrasena } = req.body;
    
    db.query('SELECT * FROM usuarios WHERE correo = ?', [correo], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en el servidor' });
        
        if (results.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }
        
        const usuario = results[0];
        const match = await bcrypt.compare(contrasena, usuario.contrasena);
        
        if (!match) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }
        
        req.session.usuario = {
            id: usuario.id_usuario,
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol: usuario.rol
        };
        
        res.json({ mensaje: 'Login exitoso', usuario: req.session.usuario });
    });
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ mensaje: 'Sesión cerrada' });
});

// Sesión actual
app.get('/api/sesion', (req, res) => {
    if (req.session.usuario) {
        res.json({ autenticado: true, usuario: req.session.usuario });
    } else {
        res.json({ autenticado: false });
    }
});

// Recuperar contraseña
app.post('/api/recuperar-contrasena', (req, res) => {
    const { correo } = req.body;
    
    db.query('SELECT id_usuario FROM usuarios WHERE correo = ?', [correo], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en el servidor' });
        if (results.length === 0) return res.status(404).json({ error: 'Correo no encontrado' });
        
        const token = require('crypto').randomBytes(32).toString('hex');
        const expiracion = new Date(Date.now() + 3600000);
        
        db.query(
            'INSERT INTO recuperacion_contrasena (id_usuario, token, fecha_expiracion) VALUES (?, ?, ?)',
            [results[0].id_usuario, token, expiracion],
            (err) => {
                if (err) return res.status(500).json({ error: 'Error al generar token' });
                res.json({ mensaje: 'Token generado', token: token });
            }
        );
    });
});

// Restablecer contraseña
app.post('/api/restablecer-contrasena', async (req, res) => {
    const { token, nuevaContrasena } = req.body;
    
    db.query(
        'SELECT * FROM recuperacion_contrasena WHERE token = ? AND usado = FALSE AND fecha_expiracion > NOW()',
        [token],
        async (err, results) => {
            if (err) return res.status(500).json({ error: 'Error en el servidor' });
            if (results.length === 0) return res.status(400).json({ error: 'Token inválido' });
            
            const hash = await bcrypt.hash(nuevaContrasena, 10);
            
            db.query('UPDATE usuarios SET contrasena = ? WHERE id_usuario = ?',
                [hash, results[0].id_usuario],
                (err) => {
                    if (err) return res.status(500).json({ error: 'Error al actualizar' });
                    db.query('UPDATE recuperacion_contrasena SET usado = TRUE WHERE token = ?', [token]);
                    res.json({ mensaje: 'Contraseña actualizada' });
                }
            );
        }
    );
});

// ========== PRODUCTOS ==========

app.get('/api/productos', (req, res) => {
    db.query('SELECT * FROM productos WHERE stock > 0 ORDER BY id_producto DESC', (err, results) => {
        if (err) return res.status(500).json({ error: 'Error' });
        res.json(results);
    });
});

app.get('/api/productos/:id', (req, res) => {
    db.query('SELECT * FROM productos WHERE id_producto = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error' });
        if (results.length === 0) return res.status(404).json({ error: 'No encontrado' });
        res.json(results[0]);
    });
});

// ========== CARRITO ==========

app.post('/api/carrito', verificarSesion, (req, res) => {
    const { id_producto, cantidad } = req.body;
    const id_usuario = req.session.usuario.id;
    
    db.query('SELECT * FROM carrito WHERE id_usuario = ? AND id_producto = ?', [id_usuario, id_producto], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error' });
        
        if (results.length > 0) {
            db.query('UPDATE carrito SET cantidad = cantidad + ? WHERE id_usuario = ? AND id_producto = ?',
                [cantidad, id_usuario, id_producto],
                (err) => {
                    if (err) return res.status(500).json({ error: 'Error' });
                    res.json({ mensaje: 'Actualizado' });
                }
            );
        } else {
            db.query('INSERT INTO carrito (id_usuario, id_producto, cantidad) VALUES (?, ?, ?)',
                [id_usuario, id_producto, cantidad],
                (err) => {
                    if (err) return res.status(500).json({ error: 'Error' });
                    res.json({ mensaje: 'Agregado' });
                }
            );
        }
    });
});

app.get('/api/carrito', verificarSesion, (req, res) => {
    const query = `SELECT c.id_carrito, c.cantidad, p.id_producto, p.nombre, p.precio, p.imagen,
                   (c.cantidad * p.precio) as subtotal
                   FROM carrito c JOIN productos p ON c.id_producto = p.id_producto
                   WHERE c.id_usuario = ?`;
    
    db.query(query, [req.session.usuario.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error' });
        const total = results.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
        res.json({ items: results, total: total });
    });
});

app.delete('/api/carrito/:id', verificarSesion, (req, res) => {
    db.query('DELETE FROM carrito WHERE id_carrito = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Error' });
        res.json({ mensaje: 'Eliminado' });
    });
});

app.put('/api/carrito/:id', verificarSesion, (req, res) => {
    db.query('UPDATE carrito SET cantidad = ? WHERE id_carrito = ?', [req.body.cantidad, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Error' });
        res.json({ mensaje: 'Actualizado' });
    });
});

// ========== PEDIDOS ==========

app.post('/api/pedidos', verificarSesion, (req, res) => {
    const { direccion_envio, metodo_pago } = req.body;
    const id_usuario = req.session.usuario.id;
    
    db.query(`SELECT c.*, p.precio FROM carrito c JOIN productos p ON c.id_producto = p.id_producto WHERE c.id_usuario = ?`,
        [id_usuario], (err, items) => {
            if (err) return res.status(500).json({ error: 'Error' });
            if (items.length === 0) return res.status(400).json({ error: 'Carrito vacío' });
            
            const total = items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
            
            db.query('INSERT INTO pedidos (id_usuario, total, direccion_envio, estado) VALUES (?, ?, ?, ?)',
                [id_usuario, total, direccion_envio, 'pendiente'], (err, result) => {
                    if (err) return res.status(500).json({ error: 'Error' });
                    
                    const id_pedido = result.insertId;
                    const detalles = items.map(item => [id_pedido, item.id_producto, item.cantidad, item.precio, item.cantidad * item.precio]);
                    
                    db.query('INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal) VALUES ?',
                        [detalles], (err) => {
                            if (err) return res.status(500).json({ error: 'Error' });
                            
                            const referencia = 'REF-' + Date.now();
                            db.query('INSERT INTO pagos (id_pedido, metodo_pago, total, estado_pago, referencia_pago) VALUES (?, ?, ?, ?, ?)',
                                [id_pedido, metodo_pago, total, 'aprobado', referencia], (err) => {
                                    if (err) return res.status(500).json({ error: 'Error' });
                                    db.query('DELETE FROM carrito WHERE id_usuario = ?', [id_usuario]);
                                    res.json({ mensaje: 'Pedido creado', id_pedido, referencia });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});

app.get('/api/pedidos', verificarSesion, (req, res) => {
    db.query('SELECT * FROM pedidos WHERE id_usuario = ? ORDER BY fecha DESC', [req.session.usuario.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error' });
        res.json(results);
    });
});

app.get('/api/pedidos/:id', verificarSesion, (req, res) => {
    const query = `SELECT p.*, pa.metodo_pago, pa.referencia_pago, pa.estado_pago,
                   d.cantidad, d.precio_unitario, d.subtotal, pr.nombre as producto_nombre
                   FROM pedidos p
                   LEFT JOIN pagos pa ON p.id_pedido = pa.id_pedido
                   LEFT JOIN detalle_pedido d ON p.id_pedido = d.id_pedido
                   LEFT JOIN productos pr ON d.id_producto = pr.id_producto
                   WHERE p.id_pedido = ?`;
    
    db.query(query, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error' });
        res.json(results);
    });
});

// ========== PERFIL ==========

app.get('/api/perfil', verificarSesion, (req, res) => {
    db.query('SELECT id_usuario, nombre, correo, rol, fecha_registro FROM usuarios WHERE id_usuario = ?',
        [req.session.usuario.id], (err, results) => {
            if (err) return res.status(500).json({ error: 'Error' });
            res.json(results[0]);
        }
    );
});

app.put('/api/perfil', verificarSesion, async (req, res) => {
    const { nombre, nuevaContrasena } = req.body;
    
    if (nuevaContrasena) {
        const hash = await bcrypt.hash(nuevaContrasena, 10);
        db.query('UPDATE usuarios SET nombre = ?, contrasena = ? WHERE id_usuario = ?',
            [nombre, hash, req.session.usuario.id], (err) => {
                if (err) return res.status(500).json({ error: 'Error' });
                res.json({ mensaje: 'Actualizado' });
            }
        );
    } else {
        db.query('UPDATE usuarios SET nombre = ? WHERE id_usuario = ?',
            [nombre, req.session.usuario.id], (err) => {
                if (err) return res.status(500).json({ error: 'Error' });
                res.json({ mensaje: 'Actualizado' });
            }
        );
    }
});

// Iniciar
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});