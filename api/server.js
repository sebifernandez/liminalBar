// --- BANCO DE PALABRAS (GLOSARIO DE TÉRMINOS CLAVE) ---
const BANCO_PALABRAS = {
    // Clave (ES): Sustitución (EN)
    // Usado para evitar la traducción literal de términos propios.
    'Caña': 'Small Beer', 
    'Pinta': 'Pint Beer',
    'Chupito': 'Shot',
    'Mojito': 'Mojito', 
    'Ribera del Duero': 'Ribera del Duero', 
    'Tempranillo': 'Tempranillo', 
};

// --- API/SERVER.JS (Versión 4.3 - Arreglo Bug Carta Pública) ---

const express = require('express');
const serverless = require('serverless-http'); 
const { MongoClient, ObjectId } = require('mongodb'); 
const path = require('path'); 
const cloudinary = require('cloudinary').v2;    

const app = express();
// Aumentamos el límite a 50MB para poder recibir imágenes en Base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
const router = express.Router();

// Permite guardar varios mails separados por coma en Netlify. Si no hay, usa el por defecto.
const CONTACT_EMAILS = process.env.CONTACT_EMAILS 
    ? process.env.CONTACT_EMAILS.split(',') 
    : ['info@altxerri.com'];
// --- CONFIGURACIÓN DE MARCA BLANCA (SaaS) ---
const BAR_NAME = process.env.BAR_NAME || 'Altxerri Jazz Bar';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'info@altxerri.com';
const BANNER_URL = process.env.BANNER_URL || 'https://res.cloudinary.com/dpcrozjx0/image/upload/v1770510881/altxerri_jazz_club/fsofcrsytqgauzdbo6pg.png'; 
const FONDO_URL = process.env.FONDO_URL || 'https://res.cloudinary.com/dpcrozjx0/image/upload/v1770510788/altxerri_jazz_club/mflsoeegyr0lbr7osjxe.png';
const DOMINIO_WEB = process.env.DOMINIO_WEB || 'https://altxerri.com'; // Necesario para el link de baja

// --- 1. CONFIGURACIÓN DE RESEND ---
const { Resend } = require('resend');

// --- 1. CONFIGURACIÓN DE BASE DE DATOS ---
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'altxerriDB';
let db;

async function connectToDb() {
    if (db) return db;
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log("Conectado a MongoDB Atlas!");
    return db;
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const resend = new Resend(process.env.RESEND_API_KEY);

// --- DATOS SEMILLA (DEFINITIVO Y COMPLETO V2) ---
const DATOS_SEMILLA = [
    // 1. Textos UI de la Carta (ES)
    {
        coleccion: "contenido_web",
        id_personalizado: "carta_ui_es",
        datos: {
            tipo: "carta_ui",
            idioma: "es",
            textos: {
                lang: "es", langButton: "ENG",
                navbar: [
                  { id: "cocteles", texto: "Cocteles" }, { id: "cervezas", texto: "Cervezas" },
                  { id: "vinos", texto: "Vinos" }, { id: "destilados", texto: "Destilados" },
                  { id: "sinAlcohol", texto: "Sin Alcohol" }
                ],
                titulosSeccion: {
                  cocteles: "Cocteles", cervezas: "Cervezas", vinos: "Nuestros Vinos",
                  destilados: "Destilados", sinAlcohol: "Sin Alcohol"
                },
                subtitulos: {
                  cervezaBarril: "Cervezas de Barril", cervezaEnvasada: "Cervezas Envasadas",
                  vinosDestacados: "Los Destacados de la Semana", vinosTintos: "Tintos",
                  vinosBlancos: "Blancos", vinosOtros: "Rosados y Espumantes"
                },
                etiquetasPrecio: {
                  cana: "Caña", pinta: "Pinta", copa: "Copa", botella: "Botella", vaso: "Vaso", chupito: "Chupito", vasoDestilado: "Vaso"
                },
                etiquetasVino: {
                  bodega: "Bodega", varietal: "Varietal", ano: "Año", crianza: "Crianza"
                }
            }
        }
    },
    // 2. Textos UI de la Carta (EN)
    {
        coleccion: "contenido_web",
        id_personalizado: "carta_ui_en",
        datos: {
            tipo: "carta_ui",
            idioma: "en",
            textos: {
                lang: "en", langButton: "ESP",
                navbar: [
                  { id: "cocteles", texto: "Cocktails" }, { id: "cervezas", texto: "Beers" },
                  { id: "vinos", texto: "Wines" }, { id: "destilados", texto: "Spirits" },
                  { id: "sinAlcohol", texto: "Non-Alcoholic" }
                ],
                titulosSeccion: {
                  cocteles: "Cocktails", cervezas: "Beers", vinos: "Our Wines",
                  destilados: "Spirits", sinAlcohol: "Non-Alcoholic"
                },
                subtitulos: {
                  cervezaBarril: "Draft Beers", cervezaEnvasada: "Bottled & Canned Beers",
                  vinosDestacados: "Featured Wines of the Week", vinosTintos: "Red Wines",
                  vinosBlancos: "White Wines", vinosOtros: "Rosé & Sparkling"
                },
                etiquetasPrecio: {
                  cana: "Small", pinta: "Pint", copa: "Glass", botella: "Bottle", vaso: "Glass", chupito: "Shot", vasoDestilado: "Glass"
                },
                etiquetasVino: {
                  bodega: "Winery", varietal: "Varietal", ano: "Year", crianza: "Aging"
                }
            }
        }
    },
    // 3. Contenido HOME (ESPAÑOL)
    {
        coleccion: "contenido_web",
        id_personalizado: "home_es",
        datos: {
            tipo: "home",
            idioma: "es",
            navbar: {
                items: [
                    { texto: "Inicio", link: "#top" },
                    { texto: "Historia", link: "#historia" },
                    { texto: "Galería", link: "#galeria" },
                    { texto: "Conciertos", link: "#eventos" },
                    { texto: "Carta", link: "carta.html" }, 
                    { texto: "Contacto", link: "#contacto" }
                ],
                btnExtra: "Newsletter"
            },
            hero: { 
                titulo: "El Regreso del Jazz", 
                subtitulo: "Tras años de silencio, el mítico Altxerri Jazz Bar de San Sebastián vuelve a abrir sus puertas. <br>Un lugar donde el arte, la música y las noches mágicas cobran vida nuevamente." 
            },
            historia: { 
                titulo: "Nuestra Historia", 
                texto: "En el corazón de San Sebastián, Altxerri nació como refugio de artistas y bohemios. Desde sus primeros compases, fue más que un bar: fue un latido constante de jazz, arte y libertad. <br>Durante décadas, sus paredes vibraron con las melodías de grandes músicos nacionales e internacionales. Hoy, reabrimos con el mismo espíritu, renovados, pero fieles a nuestra esencia." 
            },
            galeria: { 
                titulo: "Galería", 
                subtitulo: "Un recorrido visual por nuestras noches de Jazz, arte y buen ambiente.",
                // AGREGAMOS ESTO: Lista inicial de imágenes
                imagenes: [
                    "banda1.jpg", "banda2.jpg", "banda3.jpeg", 
                    "banda4.jpeg", "banda5.jpeg", "banda6.jpeg"
                ]
            },
            parallax: { 
                titulo: "Suscríbete a nuestras novedades y vive la experiencia Altxerri Jazz Bar", 
                btnTexto: "Newsletter"
            },
            eventos: { 
                titulo: "Próximos Eventos",
                ui: {
                    btnVivo: "Ver en Vivo",
                    btnArchivo: "Reviví el concierto",
                    labelCerrado: "Cerrado por Descanso",
                    txtCerrado: "¡Volvemos pronto con más Jazz!",
                    labelPrivado: "Evento Privado",
                    txtPrivado: "Lo sentimos... ¡Te esperamos el resto de la semana!",
                    txtEspecial: "Sigue en ambiente:"
                }
            },
            contacto: { 
                titulo: "Contacto",
                pestanas: {
                    cliente: "Cliente",
                    banda: "Banda / Solista",
                    comercial: "Propuesta Comercial",
                    prensa: "Prensa"
                },
                formularios: {
                    cliente: { phNombre: "Tu Nombre", phMail: "Tu Correo", phAsunto: "Asunto", phMensaje: "Escribe tu Mensaje", btnEnviar: "Enviar Mensaje" },
                    banda: { phNombreBanda: "Nombre de la Banda/solista", phContacto: "Nombre del Contacto", phMail: "Correo Electrónico", phMaterial: "Enlace a material (YouTube/Spotify...)", phMensaje: "Mensaje / Propuesta...", btnEnviar: "Enviar Propuesta" },
                    comercial: { phEmpresa: "Nombre de la Empresa", phContacto: "Nombre del Contacto", phMail: "Correo Electrónico", phTipo: "Tipo de Propuesta", phMensaje: "Escribe tu mensaje", btnEnviar: "Enviar Propuesta" },
                    prensa: { phMedio: "Nombre del Medio", phContacto: "Nombre del Contacto", phMail: "Correo Electrónico", phMotivo: "Motivo del contacto", phMensaje: "Escribe tu mensaje", btnEnviar: "Enviar Mensaje" }
                }
            },
            ubicacion: {
                titulo: "Encuéntranos",
                subtitulo: "Erregina Erregeordea kalea, 2",
                texto: "20003 Donostia / San Sebastián, Gipuzkoa, España"
            },
            newsletter: {
                titulo: "¡Sé el primero en saberlo!",
                subtitulo: "Ingresa tu nombre y correo y entérate de todos los conciertos, eventos privados y noticias de Altxerri.",
                phNombre: "Tu Nombre",
                phMail: "Tu Correo Electrónico",
                btnSuscribir: "Suscribirme"
            }
        }
    },
    // 4. Contenido HOME (ENGLISH)
    {
        coleccion: "contenido_web",
        id_personalizado: "home_en",
        datos: {
            tipo: "home",
            idioma: "en",
            navbar: {
                items: [
                    { texto: "Home", link: "#top" },
                    { texto: "History", link: "#historia" },
                    { texto: "Gallery", link: "#galeria" },
                    { texto: "Concerts", link: "#eventos" },
                    { texto: "Menu", link: "carta.html" },
                    { texto: "Contact", link: "#contacto" }
                ],
                btnExtra: "Newsletter"
            },
            hero: { 
                titulo: "The Return of Jazz", 
                subtitulo: "After years of silence, the legendary Altxerri Jazz Bar returns. <br>A place where art, music, and magical nights come alive again." 
            },
            historia: { 
                titulo: "Our History", 
                texto: "In the heart of San Sebastián, Altxerri was born as a refuge for artists and bohemians. <br>Today, we reopen with the same spirit, renewed, yet faithful to our essence." 
            },
            galeria: { 
                titulo: "Gallery", 
                subtitulo: "A visual journey through our nights of Jazz, art, and good vibes.",
                // AGREGAMOS ESTO: Lista inicial de imágenes
                imagenes: [
                    "banda1.jpg", "banda2.jpg", "banda3.jpeg", 
                    "banda4.jpeg", "banda5.jpeg", "banda6.jpeg"
                ]
            },
            parallax: { 
                titulo: "Subscribe to our news and live the Altxerri Jazz Bar experience", 
                btnTexto: "Newsletter"
            },
            eventos: { 
                titulo: "Upcoming Events",
                ui: {
                    btnVivo: "Watch Live",
                    btnArchivo: "Watch Archive",
                    labelCerrado: "Closed for Rest",
                    txtCerrado: "We'll be back soon with more Jazz!",
                    labelPrivado: "Private Event",
                    txtPrivado: "Sorry... We'll be waiting for you the rest of the week!",
                    txtEspecial: "Keep the vibe:"
                }
            },
            contacto: { 
                titulo: "Contact",
                pestanas: {
                    cliente: "Customer",
                    banda: "Band / Solist",
                    comercial: "Business Proposal",
                    prensa: "Press"
                },
                formularios: {
                    cliente: { phNombre: "Your Name", phMail: "Your Email", phAsunto: "Subject", phMensaje: "Write your Message", btnEnviar: "Send Message" },
                    banda: { phNombreBanda: "Band/Artist Name", phContacto: "Contact Name", phMail: "Email", phMaterial: "Link to material", phMensaje: "Message / Proposal...", btnEnviar: "Send Proposal" },
                    comercial: { phEmpresa: "Company Name", phContacto: "Contact Name", phMail: "Email", phTipo: "Proposal Type", phMensaje: "Write your message", btnEnviar: "Send Proposal" },
                    prensa: { phMedio: "Media Name", phContacto: "Contact Name", phMail: "Email", phMotivo: "Reason for contact", phMensaje: "Write your message", btnEnviar: "Send Message" }
                }
            },
            ubicacion: {
                titulo: "Find Us",
                subtitulo: "Erregina Erregeordea kalea, 2",
                texto: "20003 Donostia / San Sebastián, Gipuzkoa, Spain"
            },
            newsletter: {
                titulo: "Be the first to know!",
                subtitulo: "Enter your name and email to get all the news.",
                phNombre: "Your Name",
                phMail: "Your Email",
                btnSuscribir: "Subscribe"
            }
        }
    }
];

// --- 2. CONFIGURACIÓN DE SEGURIDAD ---
const API_SECRET_TOKEN = process.env.CMS_PASSWORD;
const checkAuth = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token || token !== API_SECRET_TOKEN) {
        return res.status(403).json({ success: false, message: 'Error: Token inválido' });
    }
    next();
};

// --- 3. RUTAS DE LA API (Corregidas) ---

// --- "RECETA" DE LOGIN (sin cambios) ---
router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;
        const adminUser = process.env.CMS_USER;
        const adminPass = process.env.CMS_PASSWORD;

        if (username === adminUser && password === adminPass) {
            res.json({ 
                success: true, 
                message: 'Login correcto',
                token: API_SECRET_TOKEN 
            });
        } else {
            res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// --- RUTAS DE "LEER" (GET) ---

// LEER EVENTOS
router.get('/eventos', async (req, res) => {
    try {
        const db = await connectToDb();
        const data = await db.collection('eventos').find({}).toArray(); 
        res.json(data);
    } catch (error) {
        console.error("Error en GET /eventos:", error.message);
        res.status(500).json({ success: false, message: 'Error al leer eventos' });
    }
});

// ¡CAMBIO! LEER PRODUCTOS (Ahora incluye textosUI COMPLETOS)
router.get('/productos', async (req, res) => {
    try {
        const db = await connectToDb();

        const filtroProductos = { "tipo": { "$exists": true } };

        const [productosES, productosEN] = await Promise.all([
            db.collection('productos_es').find(filtroProductos).toArray(),
            db.collection('productos_en').find(filtroProductos).toArray()
        ]);

        // --- ARREGLO PARA LA CARTA PÚBLICA (app.js) ---
        // Hardcodeamos los textosUI que tu app.js necesita
        const textosUI_es = {
            "lang": "es", "langButton": "ENG",
            "navbar": [
              { "id": "cocteles", "texto": "Cocteles" }, { "id": "cervezas", "texto": "Cervezas" },
              { "id": "vinos", "texto": "Vinos" }, { "id": "destilados", "texto": "Destilados" },
              { "id": "sinAlcohol", "texto": "Sin Alcohol" }
            ],
            "titulosSeccion": {
              "cocteles": "Cocteles", "cervezas": "Cervezas", "vinos": "Nuestros Vinos",
              "destilados": "Destilados", "sinAlcohol": "Sin Alcohol"
            },
            "subtitulos": {
              "cervezaBarril": "Cervezas de Barril", "cervezaEnvasada": "Cervezas Envasadas",
              "vinosDestacados": "Los Destacados de la Semana", "vinosTintos": "Tintos",
              "vinosBlancos": "Blancos", "vinosOtros": "Rosados y Espumantes"
            },
            "etiquetasPrecio": {
              "cana": "Caña", "pinta": "Pinta", "copa": "Copa", "botella": "Botella", "vaso": "Vaso", "chupito": "Chupito", "vasoDestilado": "Vaso"
            },
            "etiquetasVino": {
              "bodega": "Bodega", "varietal": "Varietal", "ano": "Año", "crianza": "Crianza"
            }
        };
         const textosUI_en = {
            "lang": "en", "langButton": "ESP",
            "navbar": [
              { "id": "cocteles", "texto": "Cocktails" }, { "id": "cervezas", "texto": "Beers" },
              { "id": "vinos", "texto": "Wines" }, { "id": "destilados", "texto": "Spirits" },
              { "id": "sinAlcohol", "texto": "Non-Alcoholic" }
            ],
            "titulosSeccion": {
              "cocteles": "Cocktails", "cervezas": "Beers", "vinos": "Our Wines",
              "destilados": "Spirits", "sinAlcohol": "Non-Alcoholic"
            },
            "subtitulos": {
              "cervezaBarril": "Draft Beers", "cervezaEnvasada": "Bottled & Canned Beers",
              "vinosDestacados": "Featured Wines of the Week", "vinosTintos": "Red Wines",
              "vinosBlancos": "White Wines", "vinosOtros": "Rosé & Sparkling"
            },
            "etiquetasPrecio": {
              "cana": "Small", "pinta": "Pint", "copa": "Glass", "botella": "Bottle", "vaso": "Glass", "chupito": "Shot", "vasoDestilado": "Glass"
            },
            "etiquetasVino": {
              "bodega": "Winery", "varietal": "Varietal", "ano": "Year", "crianza": "Aging"
            }
        };
        // --- FIN DEL ARREGLO ---

        res.json({
            es: { productos: productosES, textosUI: textosUI_es },
            en: { productos: productosEN, textosUI: textosUI_en }
        });

    } catch (error) {
        console.error("Error en GET /productos:", error.message);
        res.status(500).json({ success: false, message: 'Error al leer productos' });
    }
});

// --- RUTAS DE "ESCRIBIR" (POST, PUT, DELETE) CON GUARDIA ---
// (Rutas de Eventos no cambian)
router.post('/eventos/crear', checkAuth, async (req, res) => {
    try {
        const db = await connectToDb();
        const nuevoEvento = req.body;
        delete nuevoEvento.id; 
        const result = await db.collection('eventos').insertOne(nuevoEvento);
        console.log("EVENTO CREADO:", result.insertedId);
        res.json({ success: true, message: 'Evento creado con éxito', evento: nuevoEvento });
    } catch (error) {
        console.error("Error en POST /eventos/crear:", error);
        res.status(500).json({ success: false, message: 'Error interno al crear el evento' });
    }
});

router.put('/eventos/modificar/:_id', checkAuth, async (req, res) => {
    let idMongo;
    try {
        const db = await connectToDb();
        
        // 1. BLINDAJE: Verificamos la validez del ObjectId
        try {
            idMongo = new ObjectId(req.params._id);
        } catch (idError) {
            console.error("Error: El ID proporcionado no es un ObjectId válido.", req.params._id);
            return res.status(400).json({ success: false, message: `El ID '${req.params._id}' no es válido.` });
        }

        const eventoModificado = req.body;
        delete eventoModificado._id; 
        delete eventoModificado.id; 

        // 2. Lógica de Backup (sin cambios, pero ahora sabemos que idMongo es válido)
        const eventoOriginal = await db.collection('eventos').findOne({ _id: idMongo });
        if (eventoOriginal) {
            const backupEvento = { ...eventoOriginal, fechaModificacion: new Date().toISOString() };
            // Usamos updateOne + upsert para sobreescribir el backup en lugar de duplicarlo
            await db.collection('eventosModificados').updateOne(
                { _id: idMongo }, // El filtro (busca por el _id)
                { $set: backupEvento }, // Los datos a guardar
                { upsert: true } // La opción mágica: si no existe, lo crea.
            );
            console.log("BACKUP DE MODIFICACIÓN CREADO:", idMongo);
        } else {
            console.log("No se encontró evento original para backup:", idMongo);
        }

        // 3. Actualización
        const updateResult = await db.collection('eventos').updateOne(
            { _id: idMongo }, 
            { $set: eventoModificado }
        );

        // 4. Verificación de la actualización
        if (updateResult.matchedCount === 0) {
            console.warn("Se intentó modificar un evento que no se encontró en la DB:", idMongo);
            // Nota: No devolvemos error, ya que el backup pudo haberse creado
            // y la operación "técnicamente" no falló, solo no encontró coincidencias.
        }

        console.log("EVENTO MODIFICADO:", idMongo);
        res.json({ success: true, message: 'Evento modificado con éxito', evento: eventoModificado });

} catch (error) {
        // --- INICIO DEL ARREGLO DE DEBUG ---
        console.error("--- ERROR REAL EN PUT /productos/modificar ---:", error);
        // Devolvemos el mensaje de error real de MongoDB al frontend
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Error interno desconocido en el servidor' 
        });
        // --- FIN DEL ARREGLO DE DEBUG ---
    }
});

router.delete('/eventos/eliminar/:_id', checkAuth, async (req, res) => {
    try {
        const db = await connectToDb();
        const idMongo = new ObjectId(req.params._id);
        const eventoABorrar = await db.collection('eventos').findOne({ _id: idMongo });
        if (!eventoABorrar) {
             return res.status(404).json({ success: false, message: 'Evento no encontrado' });
        }
        const backupEvento = { ...eventoABorrar, fechaEliminacion: new Date().toISOString() };
        await db.collection('eventosEliminados').insertOne(backupEvento);
        console.log("BACKUP DE ELIMINACIÓN CREADO:", idMongo);
        await db.collection('eventos').deleteOne({ _id: idMongo });
        console.log("EVENTO ELIMINADO:", idMongo);
        res.json({ success: true, message: 'Evento eliminado con éxito' });
    } catch (error) {
        console.error("Error en DELETE /eventos/eliminar:", error);
        res.status(500).json({ success: false, message: 'Error interno al eliminar el evento' });
    }
});

// (Ruta de Crear Producto CORREGIDA)
router.post('/productos/crear', checkAuth, async (req, res) => {
    try {
        const db = await connectToDb();
        const { producto_es, producto_en } = req.body;

        // --- ¡ARREGLO CRÍTICO! ---
        // 1. Generamos UN solo _id nuevo
        const nuevoId = new ObjectId(); 
        
        // 2. Asignamos ese mismo _id a ambos productos
        producto_es._id = nuevoId;
        producto_en._id = nuevoId;
        // --- FIN DEL ARREGLO ---

        // 3. Insertamos ambos (ahora sí comparten _id)
        const resES = await db.collection('productos_es').insertOne(producto_es);
        const resEN = await db.collection('productos_en').insertOne(producto_en);
        
        console.log("PRODUCTO CREADO (ES/EN):", resES.insertedId); // El ID será el mismo
        
        res.json({ 
            success: true, 
            message: 'Producto creado con éxito',
            id_es: resES.insertedId, // Devolverá el ID compartido
            id_en: resEN.insertedId  // Devolverá el ID compartido
        });

    } catch (error) {
        console.error("Error en POST /productos/crear:", error);
        res.status(500).json({ success: false, message: 'Error interno al crear el producto' });
    }
});

// --- INICIO DEL BLOQUE REEMPLAZADO ---
router.put('/productos/modificar/:_id', checkAuth, async (req, res) => {
    let idMongo; // La definimos aquí para que esté en el scope
    try {
        const db = await connectToDb();

        // 1. BLINDAJE: Verificamos la validez del ObjectId
        try {
            idMongo = new ObjectId(req.params._id);
        } catch (idError) {
            // Si el ID es inválido (ej: "null"), devolvemos un error 400 (Bad Request)
            console.error("Error: El ID de producto proporcionado no es un ObjectId válido.", req.params._id);
            return res.status(400).json({ success: false, message: `El ID '${req.params._id}' no es válido.` });
        }

        const { producto_es, producto_en } = req.body;

// --- INICIO DE LÍNEAS DE DEBUG ---
        console.log("--- DEBUG: Objeto producto_es RECIBIDO POR EL SERVER ---");
        console.log(JSON.stringify(producto_es, null, 2));
        // --- FIN DE LÍNEAS DE DEBUG ---

        // 2. BACKUP:
        const original_es = await db.collection('productos_es').findOne({ _id: idMongo });
        const original_en = await db.collection('productos_en').findOne({ _id: idMongo });

        if (original_es) {
            const backupDoc = {
                ...original_es,
                traduccion_en: original_en,
                fechaModificacion: new Date().toISOString()
            };
            // Usamos updateOne + upsert para sobreescribir el backup en lugar de duplicarlo
            await db.collection('productosModificados').updateOne(
                { _id: idMongo }, // El filtro (busca por el _id)
                { $set: backupDoc }, // Los datos a guardar
                { upsert: true } // La opción mágica: si no existe, lo crea.
            );
            console.log("BACKUP DE PRODUCTO CREADO:", idMongo);
        } else {
            console.log("No se encontró producto original para backup:", idMongo);
        }

        // 3. ACTUALIZACIÓN:
        delete producto_es._id;
        delete producto_en._id;
        
        
        const resES = await db.collection('productos_es').updateOne(
            { _id: idMongo },
            { $set: producto_es } // 'producto_es' ya no tiene _id
        );
        const resEN = await db.collection('productos_en').updateOne(
            { _id: idMongo },
            { $set: producto_en } // 'producto_en' ya no tiene _id
        );

        if (resES.matchedCount === 0 || resEN.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        
        console.log("PRODUCTO MODIFICADO (ES/EN):", idMongo);
        res.json({ success: true, message: 'Producto modificado con éxito' });

} catch (error) {
        // --- INICIO DEL ARREGLO DE DEBUG ---
        console.error("--- ERROR REAL EN PUT /productos/modificar ---:", error);
        // Devolvemos el mensaje de error real de MongoDB al frontend
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Error interno desconocido en el servidor' 
        });
        // --- FIN DEL ARREGLO DE DEBUG ---
    }
});
// --- FIN DEL BLOQUE REEMPLAZADO ---

// --- RUTA PARA ACTUALIZAR VISIBILIDAD (Smart Switch) ---
router.put('/productos/visibilidad/:_id', checkAuth, async (req, res) => {
    try {
        const db = await connectToDb();
        const idMongo = new ObjectId(req.params._id);
        const { visualizacion } = req.body; // Esperamos { visualizacion: true/false }

        // Actualizamos ambas colecciones
        const resES = await db.collection('productos_es').updateOne(
            { _id: idMongo },
            { $set: { visualizacion: visualizacion } }
        );
        await db.collection('productos_en').updateOne(
            { _id: idMongo },
            { $set: { visualizacion: visualizacion } }
        );

        if (resES.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        
        res.json({ success: true, message: 'Visibilidad actualizada' });

    } catch (error) {
        console.error("Error en PUT /productos/visibilidad:", error);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
});

// --- FIN LÓGICA DE CARTA ---

// Conectamos el libro de recetas a la app
// --- RUTA PARA SUBIR IMÁGENES ---
router.post('/imagenes/subir', checkAuth, async (req, res) => {
    try {
        // El frontend nos enviará la imagen como un string Base64
        const fileStr = req.body.data;
        
        // La enviamos a Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(fileStr, {
            // Opciones de subida:
            upload_preset: 'ml_default', // 'ml_default' es un preset que suele venir por defecto
            folder: 'altxerri_jazz_club' // Opcional: para organizar en una carpeta
        });

        // Devolvemos la URL segura de la imagen subida
        res.json({ 
            success: true, 
            message: 'Imagen subida con éxito', 
            url: uploadResponse.secure_url 
        });

    } catch (error) {
        console.error("Error en POST /imagenes/subir:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno al subir la imagen' 
        });
    }
});

// --- NUEVA RUTA: GUARDAR URL Y TAGS DE IMAGEN ---
router.post('/imagenes/guardar', checkAuth, async (req, res) => {
    try {
        const db = await connectToDb();
        const { url, tags } = req.body;

        if (!url || tags.length === 0) {
             return res.status(400).json({ success: false, message: 'Faltan datos (URL o tags).' });
        }
        
        // Creamos el documento de imagen
        const imagenDoc = {
            _id: new ObjectId(), // Generamos un nuevo ID único para el documento de imagen
            url: url,
            tags: tags,
            fecha_creacion: new Date().toISOString()
        };

        // Insertamos en la colección 'imagenes'
        await db.collection('imagenes').insertOne(imagenDoc); 
        
        res.json({ success: true, message: 'Imagen y tags guardados', id: imagenDoc._id });

    } catch (error) {
        console.error("Error en POST /imagenes/guardar:", error);
        res.status(500).json({ success: false, message: 'Error interno al guardar los datos de imagen' });
    }
});

// --- RUTA: TRADUCTOR INTELIGENTE CON BANCO DE PALABRAS ---
router.post('/traducir', checkAuth, async (req, res) => {
    try {
        const { texto, targetLang = 'en' } = req.body;
        if (!texto) {
            return res.status(400).json({ success: false, message: 'El campo de texto es obligatorio.' });
        }

        // 1. APLICAR REEMPLAZOS DEL BANCO DE PALABRAS (PRE-TRADUCCIÓN)
        let textoPretraducido = texto;
        
        // Creamos un mapa de reemplazos temporales para los placeholders
        const reemplazosTemporales = {};
        let contador = 0;

        for (const [palabraES, palabraEN] of Object.entries(BANCO_PALABRAS)) {
            // Buscamos la palabra completa para no reemplazar "caña" dentro de "cáñamo"
            const regex = new RegExp(`\\b${palabraES}\\b`, 'gi'); 
            if (textoPretraducido.match(regex)) {
                // Generamos un placeholder único (ej: __PLACEHOLDER_0__)
                const placeholder = `__PLACEHOLDER_${contador++}__`;
                reemplazosTemporales[placeholder] = palabraEN;
                textoPretraducido = textoPretraducido.replace(regex, placeholder);
            }
        }
        
        // 2. SIMULACIÓN DE LLAMADA A LA API DE TRADUCCIÓN EXTERNA
        
        // NOTA: Si esta fuera una API real (DeepL), harías la llamada fetch aquí:
        // const response = await fetch('https://api.deepl.com/...', { method: 'POST', body: JSON.stringify({ text: textoPretraducido, ... }) });
        // let textoTraducidoAPI = await response.json(); 

        // Como es una SIMULACIÓN, simplemente invertimos las palabras.
        let textoTraducidoAPI = textoPretraducido.split(' ').reverse().join(' '); 

        // 3. APLICAR REEMPLAZOS DEL BANCO DE PALABRAS (POST-TRADUCCIÓN)
        // Reemplazamos los placeholders por las palabras finales en inglés.
        for (const [placeholder, palabraEN] of Object.entries(reemplazosTemporales)) {
             const regex = new RegExp(placeholder, 'g'); 
             textoTraducidoAPI = textoTraducidoAPI.replace(regex, palabraEN);
        }
        
        res.json({ success: true, translatedText: textoTraducidoAPI });

    } catch (error) {
        console.error("Error en POST /traducir:", error);
        res.status(500).json({ success: false, message: 'Error en el servicio de traducción' });
    }
});

// --- NUEVA RUTA: BUSCAR IMÁGENES POR TAGS ---
router.get('/imagenes', checkAuth, async (req, res) => {
    try {
        const db = await connectToDb();
        // Capturamos el query string 'q' (ej: /api/imagenes?q=pedro)
        const busqueda = req.query.q; 
        
        let queryMongo = {};
        
        if (busqueda) {
            // Buscamos la expresión de búsqueda dentro del array 'tags'
            queryMongo.tags = { 
                $elemMatch: { 
                    $regex: busqueda, 
                    $options: 'i' // 'i' para que no distinga mayúsculas/minúsculas
                } 
            };
        }
        
        const imagenes = await db.collection('imagenes')
            .find(queryMongo)
            .sort({ fecha_creacion: -1 }) // Ordena por más reciente
            .limit(50) // Limita resultados
            .toArray();

        res.json({ success: true, imagenes });

    } catch (error) {
        console.error("Error en GET /imagenes:", error);
        res.status(500).json({ success: false, message: 'Error interno al buscar imágenes' });
    }
});

// --- RUTA DE SEMILLA (EJECUTAR UNA SOLA VEZ) ---
router.get('/semilla', async (req, res) => {
    // Protección simple: requiere ?key=secret123 en la URL
    if (req.query.key !== 'secret123') {
        return res.status(403).send("Acceso denegado.");
    }

    try {
        const db = await connectToDb();
        const resultados = [];

        for (const item of DATOS_SEMILLA) {
            // Usamos replaceOne con upsert:true para crear o reemplazar si ya existe
            // Usamos un campo 'uid' personalizado para encontrarlos fácil luego
            const filtro = { uid: item.id_personalizado };
            const update = { $set: { ...item.datos, uid: item.id_personalizado } };
            
            const resultado = await db.collection(item.coleccion).updateOne(filtro, update, { upsert: true });
            resultados.push({ id: item.id_personalizado, resultado });
        }

        res.json({ success: true, message: "Datos sembrados con éxito", detalles: resultados });

    } catch (error) {
        console.error("Error en semilla:", error);
        res.status(500).send("Error al sembrar datos: " + error.message);
    }
});

// --- NUEVA RUTA: LEER CONTENIDO HOME 
router.get('/contenido/home', async (req, res) => {
    try {
        const db = await connectToDb();
        // Buscamos los dos documentos que creamos con la semilla
        const [homeES, homeEN] = await Promise.all([
            db.collection('contenido_web').findOne({ uid: "home_es" }),
            db.collection('contenido_web').findOne({ uid: "home_en" })
        ]);

        res.json({
            es: homeES ? homeES : {}, // Si no existe, devuelve objeto vacío para no romper
            en: homeEN ? homeEN : {}
        });
    } catch (error) {
        console.error("Error en GET /contenido/home:", error);
        res.status(500).json({ success: false, message: 'Error al leer contenido home' });
    }
});

// --- RUTA 1: MODIFICAR CONTENIDO WEB (CORREGIDA: BACKUP + GUARDADO PLANO) ---
router.put('/contenido/modificar', checkAuth, async (req, res) => {
    try {
        const db = await connectToDb();
        const { uid, datos } = req.body; 

        if (!uid || !datos) {
            return res.status(400).json({ success: false, message: "Faltan datos." });
        }
        
        // 1. BACKUP DE SEGURIDAD
        // Buscamos el documento actual tal cual está
        const versionActual = await db.collection('contenido_web').findOne({ uid: uid });
        
        if (versionActual) {
            // Quitamos el _id para que el backup sea limpio
            const datosBackup = { ...versionActual };
            delete datosBackup._id;

            const copiaSeguridad = {
                uid_original: uid,
                datos_anteriores: datosBackup, // Guardamos todo el objeto plano
                fecha_modificacion: new Date().toISOString(),
                accion: "modificacion_contenido"
            };
            await db.collection('contenido_web_backup').insertOne(copiaSeguridad);
            console.log(`Backup creado para ${uid}`);
        }

        // 2. GUARDAR CAMBIOS (FIX: GUARDADO PLANO)
        const datosAGuardar = { ...datos };
        // Aseguramos que el UID esté en los datos para no perderlo
        datosAGuardar.uid = uid;
        if (datosAGuardar._id) delete datosAGuardar._id;

        const resultado = await db.collection('contenido_web').updateOne(
            { uid: uid },
            { $set: datosAGuardar } // <--- CORRECCIÓN: Guardamos directo, sin { datos: ... }
        );

        if (resultado.matchedCount === 0) {
            // Si no existe, lo creamos (Upsert manual para asegurar estructura)
            await db.collection('contenido_web').insertOne(datosAGuardar);
        }

        res.json({ success: true, message: "Contenido actualizado y backup creado." });

    } catch (error) {
        console.error("Error en PUT /contenido/modificar:", error);
        res.status(500).json({ success: false, message: "Error interno al guardar contenido." });
    }
});

// --- RUTA 2: OBTENER HISTORIAL DE BACKUPS (Probablemente te falta) ---
router.get('/contenido/backups/:uid', checkAuth, async (req, res) => {
    try {
        const db = await connectToDb();
        const uid = req.params.uid;
        
        const backups = await db.collection('contenido_web_backup')
            .find({ uid_original: uid })
            .project({ fecha_modificacion: 1, datos_anteriores: 1 }) 
            .sort({ fecha_modificacion: -1 }) 
            .limit(20) 
            .toArray();

        res.json({ success: true, backups });
    } catch (error) {
        console.error("Error en GET /contenido/backups:", error);
        res.status(500).json({ success: false, message: "Error al leer backups." });
    }
});

// --- RUTA DE CONTACTO (DINÁMICA Y SAAS) ---
router.post('/contacto', async (req, res) => {
    try {
        // Recibimos de qué pestaña viene y todos los datos que el usuario llenó
        const { tipo, datos } = req.body; 

        // 1. Armamos el "cuerpo" del mail dinámicamente leyendo qué campos llegaron
        let htmlCampos = '';
        for (const [key, value] of Object.entries(datos)) {
            // Reemplazamos guiones bajos por espacios y ponemos en mayúscula (ej: nombre_banda -> NOMBRE BANDA)
            const nombreCampo = key.replace(/_/g, ' ').toUpperCase();
            htmlCampos += `<p style="margin-bottom: 10px;"><strong>${nombreCampo}:</strong><br> ${value}</p>`;
        }

        // 2. Enviamos el correo a los dueños
        await resend.emails.send({
            from: `Web ${BAR_NAME} <${SENDER_EMAIL}>`, // Quién lo envía (El servidor)
            to: CONTACT_EMAILS,                        // A quiénes le llega (A los 3 chicos)
            reply_to: datos.email,                     // ¡CLAVE! Si los chicos le dan a "Responder", le responden al cliente
            subject: `Nuevo mensaje de ${tipo.toUpperCase()} - ${BAR_NAME}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #B71C1C; margin-top: 0;">Nuevo mensaje desde la web</h2>
                    <h4 style="color: #555; border-bottom: 2px solid #eee; padding-bottom: 10px;">Categoría: ${tipo.toUpperCase()}</h4>
                    <div style="padding-top: 10px; color: #333;">
                        ${htmlCampos}
                    </div>
                    <p style="color: #888; font-size: 12px; margin-top: 30px; text-align: center;">
                        Enviado automáticamente desde el formulario de contacto de ${BAR_NAME}
                    </p>
                </div>
            `
        });

        res.json({ success: true, message: '¡Mensaje enviado correctamente!' });

    } catch (error) {
        console.error("Error en el formulario de contacto:", error);
        res.status(500).json({ success: false, message: 'Error interno al enviar el mensaje.' });
    }
});

// 1. SUSCRIPCIÓN (Pública - Desde el Footer)
router.post('/suscribir', async (req, res) => {
    try {
        const db = await connectToDb();
        const { nombre, email } = req.body;

        if (!email || !email.includes('@')) {
            return res.status(400).json({ success: false, message: 'Email inválido.' });
        }

        // 1. Verificamos si el correo ya existe en la base de datos
        const existe = await db.collection('subscribers').findOne({ email: email });

        if (existe) {
            if (existe.activo === true) {
                // Ya existe y está activo: Lo rebotamos
                return res.status(400).json({ 
                    success: false, 
                    message: '¡Este correo ya está suscrito a nuestro newsletter!' 
                });
            } else {
                // Existe pero estaba dado de baja: Lo reactivamos silenciosamente
                await db.collection('subscribers').updateOne(
                    { email: email },
                    { $set: { activo: true, nombre: nombre, fecha_registro: new Date().toISOString() } }
                );
            }
        } else {
            // 2. No existe en absoluto: Lo insertamos como usuario nuevo
            await db.collection('subscribers').insertOne({
                email: email,
                nombre: nombre,
                activo: true,
                fecha_registro: new Date().toISOString()
            });
        }

// 3. ENVIAMOS EL CORREO DE BIENVENIDA CON RESEND Y DISEÑO HTML
        const nombreMostrar = nombre || 'Amante de la música'; 
        
        await resend.emails.send({
            from: `${BAR_NAME} <${SENDER_EMAIL}>`,
            to: email, 
            subject: `¡Bienvenido a ${BAR_NAME}! 🎷`,
            html: `
            <div style="background-color: #1a1a1a; padding: 40px 20px; text-align: center; font-family: Arial, sans-serif; background-image: url('${FONDO_URL}'); background-size: cover; background-position: center;">
                <div style="max-width: 600px; margin: 0 auto; background: rgba(15, 15, 15, 0.95); border-radius: 8px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
                    
                    <img src="${BANNER_URL}" alt="${BAR_NAME}" style="width: 100%; height: auto; display: block;">
                    
                    <div style="padding: 40px 30px; color: #ffffff;">
                        <h1 style="color: #B71C1C; margin-top: 0; font-size: 28px; font-family: 'Georgia', serif;">¡Hola ${nombreMostrar}!</h1>
                        <h3 style="color: #FFD700; font-weight: normal; font-size: 18px; margin-bottom: 30px;">Tu lugar para la mejor música en vivo</h3>
                        
                        <p style="font-size: 16px; line-height: 1.6; color: #dddddd; margin-bottom: 20px;">
                            Gracias por sumarte a nuestra comunidad. A partir de ahora, vas a ser el primero en recibir nuestra agenda semanal, enterarte de eventos especiales y acceder a novedades exclusivas.
                        </p>
                        
                        <p style="font-size: 16px; color: #dddddd; font-weight: bold;">
                            ¡Nos vemos pronto en el bar!
                        </p>
                    </div>
                    
                    <div style="background: #000000; padding: 20px; text-align: center; border-top: 1px solid #333;">
                        <p style="color: #888; font-size: 12px; margin: 0 0 10px 0;">Recibís este correo porque te suscribiste en nuestra web.</p>
                        <a href="${DOMINIO_WEB}/api/baja?email=${email}" style="color: #B71C1C; font-size: 12px; text-decoration: underline;">Darse de baja del newsletter</a>
                    </div>
                </div>
            </div>
            `
        });

        // --- RUTA PARA DARSE DE BAJA DEL NEWSLETTER ---
router.get('/baja', async (req, res) => {
    try {
        const email = req.query.email;
        if (!email) {
            return res.status(400).send("Enlace inválido.");
        }

        const db = await connectToDb();
        
        // Cambiamos el estado 'activo' a false
        const resultado = await db.collection('subscribers').updateOne(
            { email: email },
            { $set: { activo: false, fecha_baja: new Date().toISOString() } }
        );

        if (resultado.matchedCount === 0) {
            return res.send("El correo no se encuentra en nuestra base de datos.");
        }

        // Devolvemos una pantalla HTML amigable confirmando la baja
        res.send(`
            <div style="background-color: #1a1a1a; color: white; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: Arial, sans-serif; text-align: center;">
                <div style="padding: 40px; border: 1px solid #B71C1C; border-radius: 8px; background: #0f0f0f;">
                    <h2 style="color: #B71C1C;">Te has dado de baja correctamente</h2>
                    <p style="color: #ddd;">Ya no recibirás correos de ${BAR_NAME}.</p>
                    <p style="color: #888; font-size: 14px; margin-top: 20px;">Podés cerrar esta pestaña.</p>
                </div>
            </div>
        `);

    } catch (error) {
        console.error("Error procesando baja:", error);
        res.status(500).send("Error interno al procesar la solicitud.");
    }
});

        // 4. Respondemos éxito al frontend
        res.json({ 
            success: true, 
            message: '¡Suscripción exitosa! Te hemos enviado un correo de bienvenida.' 
        });
    } catch (error) {
        console.error("Error suscripción:", error);
        res.status(500).json({ success: false, message: 'Error interno.' });
    }
});

// 2. ENVIAR NEWSLETTER (Privada - Requiere Auth) - VERSIÓN BATCH (SAAS PRO)
router.post('/newsletter/enviar', checkAuth, async (req, res) => {
    try {
        const db = await connectToDb();
        const { subject, htmlContent } = req.body;

        // 1. Obtener suscriptores activos
        const suscriptores = await db.collection('subscribers').find({ activo: true }).toArray();
        
        if (suscriptores.length === 0) {
            return res.status(400).json({ success: false, message: 'No hay suscriptores activos.' });
        }

        // 2. Sistema Batch: Enviar en bloques de 100 (Límite de la API de Resend)
        const batchSize = 100; 
        let enviadosCorrectamente = 0;

        // Recorremos la lista de suscriptores saltando de a 100
        for (let i = 0; i < suscriptores.length; i += batchSize) {
            const lote = suscriptores.slice(i, i + batchSize);
            
            // Construimos el array de objetos, personalizando el HTML para cada uno
            const correosDelLote = lote.map(sub => {
                // Inyectamos el email real en el botón de baja
                const htmlPersonalizado = htmlContent.replace(/{{EMAIL_DESTINATARIO}}/g, sub.email);
                
                return {
                    from: `${BAR_NAME} <${SENDER_EMAIL}>`,
                    to: sub.email,
                    subject: subject,
                    html: htmlPersonalizado
                };
            });

            try {
                // Disparamos los 100 correos de un solo golpe a los servidores de Resend
                await resend.batch.send(correosDelLote);
                enviadosCorrectamente += lote.length;
            } catch (errBatch) {
                console.error(`Error enviando el lote que empieza en el índice ${i}:`, errBatch);
                // Si falla un lote (ej. se cayó internet), el bucle sigue con el próximo lote de 100
            }
        }

        // 3. Guardar historial en la base de datos
        await db.collection('newsletters').insertOne({
            fecha: new Date().toISOString(),
            subject: subject,
            contenido: htmlContent, // Guardamos la plantilla base sin el mail inyectado
            destinatarios_conteo: enviadosCorrectamente
        });

        res.json({ success: true, message: `Newsletter procesado. Enviado a ${enviadosCorrectamente} personas.` });

    } catch (error) {
        console.error("Error enviando newsletter:", error);
        res.status(500).json({ success: false, message: 'Error al procesar el envío masivo.' });
    }
});

app.use('/api', router);

// Exportamos el "enchufe" final
module.exports.handler = serverless(app);