// js/demo-core.js

// 1. LA SEMILLA: Los datos iniciales del "Liminal Bar"
const datosLiminalBar = {
eventos: [
        {
            _id: "ev_001",
            titulo: "Noche de Jazz & Blues",
            titulo_en: "Jazz & Blues Night",
            fecha: "2026-04-15",
            horaInicio: "22:00",
            horaFin: "00:00",
            tipoEvento: "Regular",
            descripcion: "Disfruta de la mejor noche de jazz en vivo.",
            descripcion_en: "Enjoy the best live jazz night.",
            imagen: "banda6.jpeg",
            estado: "Activo",
            tags: ["jazz", "vivo"],
            live: "",
            concierto: ""
        },
        {
            _id: "ev_002",
            titulo: "Jam Session Abierta",
            titulo_en: "Open Jam Session",
            fecha: "2026-04-20",
            horaInicio: "21:30",
            horaFin: "23:30",
            tipoEvento: "Regular",
            descripcion: "Trae tu instrumento y sumate a la zapada.",
            descripcion_en: "Bring your instrument and join the jam.",
            imagen: "banda7.jpg",
            estado: "Activo",
            tags: ["jam", "underground"],
            live: "",
            concierto: ""
        }
    ],
carta: [
        {
            _id: "prod_001",
            id: "prod_001",
            tipo: "coctel", // ¡Clave! Así sabe en qué pestaña abrir el editor
            nombre_es: "El Trompetista",
            nombre_en: "The Trumpeter",
            titulo: "El Trompetista", // Doble mapeo por las dudas
            titulo_en: "The Trumpeter",
            descripcion_es: "Bourbon, vermouth rojo, bitter de naranja y un toque de humo.",
            descripcion_en: "Bourbon, sweet vermouth, orange bitters and a touch of smoke.",
            descripcion: "Bourbon, vermouth rojo, bitter de naranja y un toque de humo.",
            precioCopa: 8.50, // ¡Clave! Usar los nombres de variables de tu admin
            precio: 8.50,
            destacado: false,
            mostrarImagen: true, // ¡Clave para que expanda el renglón!
            imagen: "oldFashioned.jpg", // Reemplazala por una real de tu carpeta si querés
            visible: true,
            visualizacion: true
        }
    ],
textosWeb: {
        es: {
            hero_titulo: "LIMINAL BAR",
            hero_subtitulo: "Underground Soul",
            historia_titulo: "NUESTRA HISTORIA",
            historia_texto: "Un refugio para los amantes del buen jazz y los tragos con historia. Bajá las escaleras y dejate llevar por el ritmo.",
            parallax_titulo: "ENTERATE DE LOS SHOWS SECRETOS",
            news_titulo: "NEWSLETTER",
            news_subtitulo: "Recibí la agenda y beneficios exclusivos",
            ubicacion_titulo: "CÓMO LLEGAR",
            ubicacion_subtitulo: "Carrer de la Marina, 268",
            ubicacion_texto: "Abierto de Jueves a Domingos."
        },
        en: {
            hero_titulo: "LIMINAL BAR",
            hero_subtitulo: "Underground Soul",
            historia_titulo: "OUR HISTORY",
            historia_texto: "A haven for lovers of good jazz and drinks with history. Go down the stairs and let yourself be carried away by the rhythm.",
            parallax_titulo: "FIND OUT ABOUT SECRET SHOWS",
            news_titulo: "NEWSLETTER",
            news_subtitulo: "Get the schedule and exclusive benefits",
            ubicacion_titulo: "LOCATION",
            ubicacion_subtitulo: "Carrer de la Marina, 268",
            ubicacion_texto: "Open Thursday to Sunday."
        }
    },
    galeria: {
        // Imágenes por defecto de la demo
        imagenes: ["imgBandaGenerica.jpg", "diaSinBanda.jpg"]
    }
};

// 2. INICIALIZADOR: Chequea si es la primera vez que el cliente entra a la demo
function inicializarBaseDeDatosLocal() {
    if (!localStorage.getItem('liminal_db')) {
        console.log("🌱 Primera visita detectada. Plantando la semilla del Liminal Bar...");
        localStorage.setItem('liminal_db', JSON.stringify(datosLiminalBar));
    } else {
        console.log("✅ Base de datos local cargada correctamente.");
    }
}

// 3. SIMULADOR DE LATENCIA (Para dar la sensación de que es un software en la nube)
function simularLatencia(ms = 1500) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 4. COMPRESOR DE IMÁGENES A BASE64 (Vital para no romper el límite de 5MB del localStorage)
function comprimirImagenBase64(file, maxWidth = 800) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Calculamos la proporción para no deformar la foto
                const scaleSize = maxWidth / img.width;
                canvas.width = maxWidth;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                // Comprime a JPEG con 70% de calidad. Queda súper liviana.
                resolve(canvas.toDataURL('image/jpeg', 0.7)); 
            };
        };
        reader.onerror = error => reject(error);
    });
}

// Ejecutamos la inicialización apenas carga este archivo
inicializarBaseDeDatosLocal();