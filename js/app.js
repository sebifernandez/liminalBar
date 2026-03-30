/**
 * Carga los datos de la CARTA desde la API.
 * @param {string} lang - El idioma a cargar ('es' o 'en').
 * @returns {Promise<object | null>} Los datos del JSON o null si hay error.
 */
async function cargarDatos(lang) {
    // CAMBIO: Ya no leemos un archivo, llamamos a nuestra API.
    const apiUrl = '/api/productos'; 
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Error al cargar la API de productos: ${response.statusText}`);
        }
        
        // La API ya nos da los dos idiomas, seleccionamos el que queremos.
        const data = await response.json();
        return data[lang]; // Devolvemos solo 'es' o 'en'

    } catch (error) {
        console.error(error);
        return null; // Devuelve null en caso de error
    }
}

function formatarPrecio(precio) {
    // Verifica si el precio es nulo, undefined, string vacío, o 0
    if (!precio || precio === 0) {
        return '–'; // Devuelve un guion largo
    }
    return `${precio}€`;
}

/**
 * Genera el HTML del navbar y lo inserta en el DOM.
 * @param {object} textosUI - El objeto 'textosUI' del JSON.
 */
function renderizarNavbar(textosUI) {
    const navContainer = document.getElementById('navbar-container');
    if (!navContainer) return; // Salir si no se encuentra el contenedor

    // --- Generar los enlaces del Navbar (Desktop y Mobile) ---
    // Usamos .map() para transformar cada item del array 'navbar' en un string HTML <a>
    const enlacesNav = textosUI.navbar.map(link => {
        // El 'id' (ej. 'cocteles') se usa para el ancla (href="#cocteles")
        // El 'texto' (ej. 'Cocteles') es lo que ve el usuario
        return `<a href="#${link.id}" class="nav-link-desktop">${link.texto}</a>`;
    }).join(''); // .join('') une todos los strings en uno solo

    // Generamos los enlaces para el menú móvil (tienen una clase diferente)
    const enlacesMobile = textosUI.navbar.map(link => {
        return `<a href="#${link.id}" class="nav-link-mobile">${link.texto}</a>`;
    }).join('');

    // --- Construir el HTML final del Navbar ---
    const proximoLang = textosUI.lang === 'es' ? 'en' : 'es';
    const htmlNavbar = `
        <div class="navbar-content">
            <div class="nav-logo">
                <a href="index.html"><img src="img/altxerrilogo2.png" alt="Altxerri Logo"></a>
            </div>

            <nav class="nav-desktop">
                ${enlacesNav}
                <button class="lang-btn" data-lang="${proximoLang}">
                    ${textosUI.langButton}
                </button>
            </nav>

            <button class="nav-hamburger-btn" aria-label="Abrir menú">
                <span class="hamburger-bar"></span>
                <span class="hamburger-bar"></span>
                <span class="hamburger-bar"></span>
            </button>
        </div>

        <div class="nav-mobile-menu">
            <button class="lang-btn lang-btn-mobile" data-lang="${proximoLang}">
                ${textosUI.langButton}
            </button>
            ${enlacesMobile}
        </div>
    `;

    // Insertar el HTML generado dentro del <header id="navbar-container">
    navContainer.innerHTML = htmlNavbar;
}

/**
 * Configura los event listeners (clics) para el menú hamburguesa.
 */
/**
 * Configura los event listeners (clics) para TODO el navbar.
 * (Versión Fase 4: Incluye scroll suave y cambio de idioma)
 */
function configurarEventosNavbar() {
    const hamburgerBtn = document.querySelector('.nav-hamburger-btn');
    const mobileMenu = document.querySelector('.nav-mobile-menu');
    const mobileLinks = document.querySelectorAll('.nav-link-mobile');
    const desktopLinks = document.querySelectorAll('.nav-link-desktop');
    const langButtons = document.querySelectorAll('.lang-btn'); // Coge AMBOS botones (desktop y mobile)

    // --- 1. Lógica del Menú Hamburguesa ---
    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.toggle('open');
            mobileMenu.classList.toggle('open');
        });
    }

    // --- 2. Lógica de Scroll Suave (Móvil) ---
    mobileLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Evita el salto brusco del ancla
            const targetId = link.getAttribute('href');
            
            // Llamamos a nuestra función de scroll personalizada
            smoothScrollTo(targetId, 500); // 500ms = 0.5s

            // Cierra el menú (¡tu requisito clave!)
            hamburgerBtn.classList.remove('open');
            mobileMenu.classList.remove('open');
        });
    });

    // --- 3. Lógica de Scroll Suave (Desktop) ---
    desktopLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Evita el salto brusco del ancla
            const targetId = link.getAttribute('href');
            
            // Llamamos a nuestra función de scroll personalizada
            smoothScrollTo(targetId, 500); // 500ms = 0.5s
        });
    });

    // --- 4. Lógica de Cambio de Idioma ---
    langButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const nuevoLang = e.target.getAttribute('data-lang'); // 'es' o 'en'
            
            // ¡Simplemente reiniciamos la app con el nuevo idioma!
            // Esto recargará y re-renderizará todo (navbar y contenido).
            iniciarAplicacion(nuevoLang);
        });
    });
}

const preloader = document.getElementById('preloader');

function ocultarPreloader() {
  if (preloader) {
    preloader.classList.add('preloader-hidden');
  }
}

/* --- FASE 3: RENDERIZADO DE CONTENIDO (SECCIONES Y PRODUCTOS) --- */

/**
 * Modificamos la función principal para que también llame a 
 * renderizarContenido después de renderizar el navbar.
 */
async function iniciarAplicacion(lang) {
    try {
        const datos = await cargarDatos(lang);
        if (!datos) {
            throw new Error('No se pudieron cargar los datos de la carta.');
        }

        // FASE 2
        renderizarNavbar(datos.textosUI);
        configurarEventosNavbar();

        // FASE 3 (NUEVO)
        renderizarContenido(datos);

    } catch (error) {
        console.error(error);
        // Opcional: Mostrar un error al usuario en el main-container
        const mainContainer = document.getElementById('main-container');
        if (mainContainer) {
            mainContainer.innerHTML = 
                '<h2 style="text-align: center; padding-top: 100px;">Error al cargar la carta. Intente más tarde.</h2>';
        }
    } finally {
        // OCULTAMOS EL PRELOADER (SIEMPRE)
        ocultarPreloader();
    }
}

/**
 * Función "Maestra" que construye todas las secciones de contenido.
 * @param {object} datos - El objeto JSON completo (textosUI y productos).
 */
function renderizarContenido(datos) {
    const mainContainer = document.getElementById('main-container');
    if (!mainContainer) return;

    const { textosUI, productos } = datos;

    // Generamos el HTML para cada sección llamando a su función específica
    const htmlCocteles = renderizarSeccionCocteles(productos, textosUI);
    const htmlCervezas = renderizarSeccionCervezas(productos, textosUI);
    const htmlVinos = renderizarSeccionVinos(productos, textosUI);
    const htmlDestilados = renderizarSeccionDestilados(productos, textosUI);
    const htmlSinAlcohol = renderizarSeccionSinAlcohol(productos, textosUI);

    // Unimos todo el HTML y lo insertamos en el contenedor principal
    mainContainer.innerHTML = `
        ${htmlCocteles}
        ${htmlCervezas}
        ${htmlVinos}
        ${htmlDestilados}
        ${htmlSinAlcohol}
    `;
}

// --- RENDERIZADOR: COCTELES (Lógica Híbrida: Lista + Cards) ---

function renderizarSeccionCocteles(productos, textosUI) {
    const { titulosSeccion, etiquetasPrecio } = textosUI;

    // 1. Filtrar y ordenar productos ALFABÉTICAMENTE
    const cocteles = productos
        .filter(p => p.tipo === 'coctel' && p.visualizacion)
        .sort((a, b) => a.titulo.localeCompare(b.titulo));

    // Si no hay cocteles, no mostramos nada
    if (cocteles.length === 0) return '';

    // 2. Generar el HTML Híbrido
    let htmlContent = '';
    let contadorCards = 0; // Para alternar izquierda/derecha solo en las con foto

    cocteles.forEach(coctel => {
        // LEEMOS EL TOGGLE: ¿Tiene activado "Mostrar con Imagen"?
        // (Si es undefined, asumimos false para que por defecto sea lista, salvo que quieras lo contrario)
        const mostrarConFoto = coctel.mostrarImagen === true;

        if (mostrarConFoto) {
            contadorCards++;
            // Si es impar (1, 3, 5) -> Imagen izquierda (row)
            // Si es par (2, 4, 6) -> Imagen derecha (row-reverse)
            const direccion = (contadorCards % 2 !== 0) ? 'row' : 'row-reverse';
            
            htmlContent += createCoctelExpandedRow(coctel, direccion);
        } else {
            // Renderizado tipo lista simple
            htmlContent += createCoctelListItem(coctel, etiquetasPrecio);
        }
    });

    // 3. Devolver la sección completa
    // Nota: Usamos .productos-grid pero en CSS le quitamos el gap y lo hacemos columna
    return `
        <section id="cocteles" class="seccion seccion-con-fondo" style="background-image: url('img/fondo_cocteles.jpg');">
            <div class="seccion-contenido">
                <h2 class="seccion-titulo">${titulosSeccion.cocteles}</h2>
                <div class="productos-grid" style="display: flex; flex-direction: column; gap: 0;">
                    ${htmlContent}
                </div>
            </div>
        </section>
    `;
}

/**
 * HELPER 1: Crea el renglón expandido con foto (Estilo Card Apilada)
 */
function createCoctelExpandedRow(prod, flexDirection) {
    let imgSrc = 'img/bebidaSinFoto.jpg';
    if (prod.imagen) {
         imgSrc = prod.imagen.startsWith('http') ? prod.imagen : `img/${prod.imagen}`;
    }
    
    const precio = formatarPrecio(prod.precioCopa);

    // Determinamos la clase de layout basada en la dirección que nos pasa el loop
    // flexDirection viene como 'row' (img izquierda) o 'row-reverse' (img derecha)
    const layoutClass = (flexDirection === 'row') ? 'layout-img-texto' : 'layout-texto-img';

    return `
    <div class="coctel-row-con-foto ${layoutClass}">
        <div class="coctel-img-container">
            <img src="${imgSrc}" alt="${prod.titulo}" loading="lazy">
        </div>
        <div class="coctel-info">
            <div class="coctel-header">
                <h3>${prod.titulo}</h3>
                <span class="precio-destacado">${precio}</span>
            </div>
            <p class="descripcion">${prod.descripcion || ''}</p>
        </div>
    </div>
    `;
}

/**
 * HELPER 2: Crea el item de lista simple (igual a cervezas)
 */
function createCoctelListItem(item, etiquetasPrecio) {
    const precio = formatarPrecio(item.precioCopa);
    const etiqueta = etiquetasPrecio.copa || 'Copa'; // Fallback por si acaso

    return `
        <div class="listado-item">
            <div class="listado-item-textos">
                <h4 class="listado-item-titulo">${item.titulo}</h4>
                <div class="listado-item-descripcion-general">
                    <p class="descripcion-general">${item.descripcion || ''}</p>
                </div>
            </div>
            <div class="listado-item-precios precios-uno">
                <span class="precio-item">
                    ${precio}
                    <span class="precio-etiqueta">(${etiqueta})</span>
                </span>
            </div>
        </div>
    `;
}
// --- RENDERIZADOR: SECCIONES DE LISTADO (Cervezas, Vinos, etc.) ---

/**
 * Función REUTILIZABLE para crear secciones de listado.
 * @param {Array} productos - Lista de productos YA FILTRADOS Y ORDENADOS.
 * @param {string} subtitulo - El subtítulo de la sección (ej. "Cervezas de Barril").
 * @param {object} etiquetas - Objeto de etiquetas (ej. textosUI.etiquetasPrecio).
 * @param {string} tipoPlantilla - 'dosPrecios' (Caña/Pinta), 'unPrecio' (Botella), 'vino', 'destilado'.
 */
function renderizarListado(productos, subtitulo, etiquetas, tipoPlantilla) {
    // Si no hay productos en esta lista, no se renderiza nada (¡lógica clave!)
    if (productos.length === 0) return '';

    let headerHtml = '';
    const { etiquetasPrecio, etiquetasVino } = etiquetas;

    // 1. Crear el "Header Fantasma" según la plantilla
    switch (tipoPlantilla) {
        case 'dosPrecios': // Cerveza Barril
            headerHtml = `
                <div class="listado-header">
                    <div class="listado-item-textos"></div>
                    <div class="listado-item-precios precios-dos">
                        <span>${etiquetasPrecio.cana}</span>
                        <span>${etiquetasPrecio.pinta}</span>
                    </div>
                </div>
            `;
            break;
        case 'vino':
            headerHtml = `
                <div class="listado-header">
                    <div class="listado-item-textos"></div>
                    <div class="listado-item-precios precios-dos">
                        <span>${etiquetasPrecio.copa}</span>
                        <span>${etiquetasPrecio.botella}</span>
                    </div>
                </div>
            `;
            break;
        case 'destilado':
            headerHtml = `
                <div class="listado-header">
                    <div class="listado-item-textos"></div>
                    <div class="listado-item-precios precios-dos">
                        <span>${etiquetasPrecio.chupito || 'Chupito'}</span>
                        <span>${etiquetasPrecio.vasoDestilado || 'Vaso'}</span>
                    </div>
                </div>
            `;
            break;
            break;
        case 'unPrecio': // Cerveza Envasada / Sin Alcohol
            // No lleva header, se queda vacío.
            headerHtml = '';
            break;
    }

    // 2. Crear cada "fila" de la lista
    const itemsHtml = productos.map(item => 
        renderizarItemLista(item, etiquetas, tipoPlantilla)
    ).join('');

    // 3. Devolver el bloque HTML completo (subtítulo + header + items)
    return `
        <div class="listado-subseccion">
            <h3 class="seccion-subtitulo">${subtitulo}</h3>
            ${headerHtml}
            <div class="listado-items-container">
                ${itemsHtml}
            </div>
        </div>
    `;
}

/**
/**

/**
 * Función REUTILIZABLE para CADA item de un listado.
 */
function renderizarItemLista(item, etiquetas, tipoPlantilla) {
    const { etiquetasPrecio, etiquetasVino } = etiquetas;
    let preciosHtml = '';
    let descripcionHtml = '';

    // 1. Generar HTML Precios (Igual que antes)
    switch (tipoPlantilla) {
        case 'dosPrecios': 
            preciosHtml = `<div class="listado-item-precios precios-dos"><span class="precio-item">${formatarPrecio(item.precioCana)} <span class="precio-etiqueta">(${etiquetasPrecio.cana})</span></span><span class="precio-item">${formatarPrecio(item.precioPinta)} <span class="precio-etiqueta">(${etiquetasPrecio.pinta})</span></span></div>`;
            break;
        case 'vino':
            preciosHtml = `<div class="listado-item-precios precios-dos"><span class="precio-item">${formatarPrecio(item.precioCopa)} <span class="precio-etiqueta">(${etiquetasPrecio.copa})</span></span><span class="precio-item">${formatarPrecio(item.precioBotella)} <span class="precio-etiqueta">(${etiquetasPrecio.botella})</span></span></div>`;
            break;
        case 'destilado':
            preciosHtml = `<div class="listado-item-precios precios-dos"><span class="precio-item">${formatarPrecio(item.precioCana)} <span class="precio-etiqueta">(${etiquetasPrecio.chupito || 'Chupito'})</span></span><span class="precio-item">${formatarPrecio(item.precioCopa)} <span class="precio-etiqueta">(${etiquetasPrecio.vasoDestilado || 'Vaso'})</span></span></div>`;
            break;
        case 'unPrecio':
            preciosHtml = `<div class="listado-item-precios precios-uno"><span class="precio-item">${formatarPrecio(item.precioBotella)}</span></div>`;
            break;
    }

    // 2. Lógica de Región / País (FIX DESTILADOS)
    let regionPais = '';
    // Filtramos valores nulos o vacíos
    const locacion = [item.region, item.pais].filter(val => val && val.trim() !== '');
    if (locacion.length > 0) {
        // .join(' - ') une automáticamente con guion solo si hay dos elementos
        // Si hay uno, no pone guion. Si hay cero, no pone nada.
        regionPais = `<span class="titulo-region">(${locacion.join(' - ')})</span>`;
    }

    // 3. Descripción y Crianza
    if (tipoPlantilla === 'vino') {
        // ... (Lógica vino igual que antes) ...
        const datosVino = [
            item.productor ? `<strong>${etiquetasVino.bodega}:</strong> ${item.productor}` : '',
            item.varietal ? `<strong>${etiquetasVino.varietal}:</strong> ${item.varietal}` : '',
            item.ano ? `<strong>${etiquetasVino.ano}:</strong> ${item.ano}` : '',
            item.crianza ? `<strong>${etiquetasVino.crianza}:</strong> ${item.crianza}` : ''
        ].filter(Boolean).join(' – ');

        descripcionHtml = `<div class="listado-item-descripcion-vino"><p class="vino-datos">${datosVino}</p><p class="vino-descripcion"><em>${item.descripcion}</em></p></div>`;
    
    } else {
        // Cervezas, Destilados, Sin Alcohol
        const datosGenerales = [item.abv ? `${item.abv}% ABV` : '', item.ibu ? `${item.ibu} IBU` : ''].filter(Boolean).join(' | ');
        
        // Lógica Crianza Destilados (FIX DESTILADOS)
        let textoDesc = item.descripcion || '';
        if (tipoPlantilla === 'destilado' && item.crianza && item.crianza.trim() !== '') {
            // Obtenemos etiqueta traducida ("Crianza" o "Aging") o fallback
            const lblCrianza = (etiquetasVino && etiquetasVino.crianza) ? etiquetasVino.crianza : 'Crianza';
            // Prependemos al texto
            textoDesc = `<strong>${lblCrianza}:</strong> ${item.crianza} - ${textoDesc}`;
        }

        // Solo renderizamos el párrafo si hay texto (FIX SIN ALCOHOL)
        let parrafoDesc = '';
        if (textoDesc.trim() !== '') {
            parrafoDesc = `<p class="descripcion-general">${textoDesc}</p>`;
        }

        if (datosGenerales || parrafoDesc) {
            descripcionHtml = `
                <div class="listado-item-descripcion-general">
                    ${datosGenerales ? `<p class="datos-generales">${datosGenerales}</p>` : ''}
                    ${parrafoDesc}
                </div>
            `;
        }
    }

    return `
        <div class="listado-item">
            <div class="listado-item-textos">
                <h4 class="listado-item-titulo">${item.titulo} ${regionPais}</h4>
                ${descripcionHtml}
            </div>
            ${preciosHtml}
        </div>
    `;
}

// --- RENDERIZADOR: SECCIÓN CERVEZAS ---

function renderizarSeccionCervezas(productos, textosUI) {
    const { subtitulos, etiquetasPrecio, titulosSeccion } = textosUI;
    const etiquetas = { etiquetasPrecio }; // Pasamos solo las etiquetas necesarias

    // 1. Filtrar y ordenar Barril
    const cervezasBarril = productos
        .filter(p => p.tipo === 'cervezaBarril' && p.visualizacion)
        .sort((a, b) => a.titulo.localeCompare(b.titulo));
    
    // 2. Filtrar y ordenar Envasada
    const cervezasEnvasadas = productos
        .filter(p => p.tipo === 'cervezaEnvasada' && p.visualizacion)
        .sort((a, b) => a.titulo.localeCompare(b.titulo));

    // 3. Generar HTML de cada sub-sección
    const htmlBarril = renderizarListado(cervezasBarril, subtitulos.cervezaBarril, etiquetas, 'dosPrecios');
    const htmlEnvasada = renderizarListado(cervezasEnvasadas, subtitulos.cervezaEnvasada, etiquetas, 'unPrecio');

    // Si ambas sub-secciones están vacías, no mostramos nada
    if (!htmlBarril && !htmlEnvasada) return '';

    // 4. Devolver la sección completa
    return `
        <section id="cervezas" class="seccion seccion-con-fondo" style="background-image: url('img/fondo_cervezas.jpg');">
            <div class="seccion-contenido">
                <h2 class="seccion-titulo">${titulosSeccion.cervezas}</h2>
                ${htmlBarril}
                ${htmlEnvasada}
            </div>
        </section>
    `;
}

// --- RENDERIZADOR: SECCIÓN VINOS (Destacados + Listado) ---

function renderizarSeccionVinos(productos, textosUI) {
    const { subtitulos, etiquetasPrecio, etiquetasVino, titulosSeccion } = textosUI;
    const etiquetas = { etiquetasPrecio, etiquetasVino };

    // 1. Generar HTML Vinos Destacados
    const htmlDestacados = renderizarVinosDestacados(productos, textosUI);

    // 2. Generar HTML Listados de Vinos
    const vinosTinto = productos
        .filter(p => p.tipo === 'vinoTinto' && p.visualizacion)
        .sort((a, b) => a.titulo.localeCompare(b.titulo));
    const vinosBlanco = productos
        .filter(p => p.tipo === 'vinoBlanco' && p.visualizacion)
        .sort((a, b) => a.titulo.localeCompare(b.titulo));
    const vinosOtros = productos
        .filter(p => p.tipo === 'vinoOtro' && p.visualizacion)
        .sort((a, b) => a.titulo.localeCompare(b.titulo));

    const htmlTintos = renderizarListado(vinosTinto, subtitulos.vinosTintos, etiquetas, 'vino');
    const htmlBlancos = renderizarListado(vinosBlanco, subtitulos.vinosBlancos, etiquetas, 'vino');
    const htmlOtros = renderizarListado(vinosOtros, subtitulos.vinosOtros, etiquetas, 'vino');

    // Si no hay NADA (ni destacados, ni tintos, ni blancos, ni otros), no mostramos la sección
    if (!htmlDestacados && !htmlTintos && !htmlBlancos && !htmlOtros) return '';

    // 3. Devolver sección completa
    return `
        <section id="vinos" class="seccion seccion-con-fondo" style="background-image: url('img/fondo_vinos.jpg');">
            <div class="seccion-contenido">
                <h2 class="seccion-titulo">${titulosSeccion.vinos}</h2>
                ${htmlDestacados}
                ${htmlTintos}
                ${htmlBlancos}
                ${htmlOtros}
            </div>
        </section>
    `;
}

function renderizarVinosDestacados(productos, textosUI) {
    const { subtitulos, etiquetasVino } = textosUI;

    // 1. Filtrar productos
    const vinosDestacados = productos.filter(p =>
        ['vinoTinto', 'vinoBlanco', 'vinoOtro'].includes(p.tipo) &&
        p.destacado &&
        p.visualizacion
    );

    // Si no hay destacados, no renderizamos nada (¡lógica clave!)
    if (vinosDestacados.length === 0) return '';

    // 2. Generar HTML para cada banner
    const bannersHtml = vinosDestacados.map((vino, index) => {
        const esPar = index % 2 === 0;
        const claseLayout = esPar ? 'layout-img-texto' : 'layout-texto-img';
        
        let rutaImagen = `img/${vino.imagen}`;
        if (vino.imagen && (vino.imagen.startsWith('http') || vino.imagen.startsWith('https'))) {
            rutaImagen = vino.imagen; // URL de Cloudinary
        } else {
            rutaImagen = `img/${vino.imagen || 'bebidaSinFoto.jpg'}`; // Archivo local
        }
        
        // Formateo de datos del vino (igual que en el listado)
        const datosVino = [
            vino.productor ? `<strong>${etiquetasVino.bodega}:</strong> ${vino.productor}` : '',
            vino.varietal ? `<strong>${etiquetasVino.varietal}:</strong> ${vino.varietal}` : '',
            vino.ano ? `<strong>${etiquetasVino.ano}:</strong> ${vino.ano}` : '',
            vino.crianza ? `<strong>${etiquetasVino.crianza}:</strong> ${vino.crianza}` : ''
        ].filter(Boolean).join(' – ');
        
        const regionPais = (vino.region || vino.pais) 
            ? `${[vino.region, vino.pais].filter(Boolean).join(' – ')}` 
            : '';

        return `
            <div class="banner-destacado ${claseLayout}">
                <div class="banner-imagen" style="background-image: url('${rutaImagen}');">
                </div>
                <div class="banner-textos">
                    <h4 class="banner-titulo">${vino.titulo}</h4>
                    <p class="banner-region">${regionPais}</p>
                    <p class="banner-datos">${datosVino}</p>
                    <p class="banner-descripcion"><em>${vino.descripcion}</em></p>
                </div>
            </div>
        `;
    }).join('');

    // 3. Devolver la sub-sección completa
    return `
        <div class="listado-subseccion">
            <h3 class="seccion-subtitulo">${subtitulos.vinosDestacados}</h3>
            <div class="banners-container">
                ${bannersHtml}
            </div>
        </div>
    `;
}

// --- RENDERIZADOR: SECCIÓN DESTILADOS ---

function renderizarSeccionDestilados(productos, textosUI) {
    const { etiquetasPrecio, titulosSeccion, etiquetasVino } = textosUI;
    const etiquetas = { etiquetasPrecio, etiquetasVino };

    const destilados = productos
        .filter(p => p.tipo === 'destilado' && p.visualizacion)
        .sort((a, b) => a.titulo.localeCompare(b.titulo));

    // Usamos un subtítulo genérico, o podrías añadir uno específico en el JSON
    const htmlDestilados = renderizarListado(destilados, '', etiquetas, 'destilado');

    if (!htmlDestilados) return '';

    return `
        <section id="destilados" class="seccion seccion-con-fondo" style="background-image: url('img/fondo_destilados.jpg');">
            <div class="seccion-contenido">
                <h2 class="seccion-titulo">${titulosSeccion.destilados}</h2>
                ${htmlDestilados}
            </div>
        </section>
    `;
}

// --- RENDERIZADOR: SECCIÓN SIN ALCOHOL ---

function renderizarSeccionSinAlcohol(productos, textosUI) {
    const { etiquetasPrecio, titulosSeccion } = textosUI;
    const etiquetas = { etiquetasPrecio };

    const sinAlcohol = productos
        .filter(p => p.tipo === 'sinAlcohol' && p.visualizacion)
        .sort((a, b) => a.titulo.localeCompare(b.titulo));

    const htmlSinAlcohol = renderizarListado(sinAlcohol, '', etiquetas, 'unPrecio');

    if (!htmlSinAlcohol) return '';

    return `
        <section id="sinAlcohol" class="seccion seccion-con-fondo" style="background-image: url('img/fondo_sinalcohol.jpg');">
            <div class="seccion-contenido">
                <h2 class="seccion-titulo">${titulosSeccion.sinAlcohol}</h2>
                ${htmlSinAlcohol}
            </div>
        </section>
    `;
}

/**
 * Re-declaramos addEventListener para asegurarnos de que se llama
 * a la NUEVA versión de iniciarAplicacion.
 */
document.addEventListener('DOMContentLoaded', () => {
    iniciarAplicacion('es'); 
});

/* --- FASE 4: FUNCIONES DE SCROLL E IDIOMA --- */

/**
 * Función de "Easing" (Aceleración/Desaceleración)
 * Ayuda a que el scroll se vea suave y no robótico.
 * @param {number} t - Progreso (0.0 a 1.0)
 */
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Función de Scroll Suave con Duración Constante (¡Tu requisito!)
 * @param {string} targetId - El ID del elemento al que scrollear (ej. "#cocteles").
 * @param {number} duration - La duración total en milisegundos (ej. 500).
 */
function smoothScrollTo(targetId, duration) {
    const targetElement = document.querySelector(targetId);
    if (!targetElement) return;

    const navbarHeight = document.getElementById('navbar-container').clientHeight || 70;
    
    // Posición del elemento - altura del navbar (para el 'offset')
    const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - navbarHeight;
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animationStep(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1); // Progreso de 0.0 a 1.0
        
        // Aplicamos la función de easing
        const easedProgress = easeInOutCubic(progress);

        window.scrollTo(0, startPosition + distance * easedProgress);

        // Si no hemos terminado, seguimos pidiendo el siguiente frame
        if (timeElapsed < duration) {
            requestAnimationFrame(animationStep);
        }
    }

    requestAnimationFrame(animationStep);
}

// ==========================================
// 4. GENERADOR DE PDF OPTIMIZADO
// ==========================================

async function descargarPDF() {
    const { jsPDF } = window.jspdf;
    const btn = document.getElementById('btn-download-pdf');
    const contenedor = document.getElementById('main-container');
    
    // 1. Feedback visual
    btn.style.display = 'none';
    const loading = document.createElement('div');
    loading.id = "pdf-loading-overlay";
    loading.innerHTML = "<div style='position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); color:#fff; display:flex; justify-content:center; align-items:center; z-index:9999; flex-direction:column;'><h3>Generando PDF optimizado...</h3><p>Esto puede tardar unos segundos.</p></div>";
    document.body.appendChild(loading);

    try {
        // 2. Configuración para evitar deformaciones y cortes
        const canvas = await html2canvas(contenedor, {
            scale: 1.5, // Bajamos un poco la escala (2 era mucho, 1.5 es HD)
            useCORS: true, 
            backgroundColor: '#121212', 
            scrollY: -window.scrollY, // Fix para que no salga cortado si hiciste scroll
            windowWidth: document.documentElement.offsetWidth, // Asegura ancho correcto
            ignoreElements: (element) => element.id === 'btn-download-pdf' || element.id === 'pdf-loading-overlay'
        });

        // 3. COMPRESIÓN FUERTE: Usamos JPEG con calidad 0.7 (70%)
        // Esto es lo que bajará el peso de 250MB a unos pocos MB.
        const imgData = canvas.toDataURL('image/jpeg', 0.7); 
        
        // 4. Cálculo Matemático Exacto para evitar "Estiramiento"
        const imgWidth = 210; // Ancho A4 en mm
        const pageHeight = (canvas.height * imgWidth) / canvas.width; // Regla de tres simple

        // Crear PDF con las dimensiones exactas de la imagen
        const pdf = new jsPDF('p', 'mm', [imgWidth, pageHeight]);
        
        // params: data, format, x, y, width, height
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, pageHeight);
        
        // 5. Descargar
        const fecha = new Date().toISOString().slice(0,10);
        pdf.save(`Altxerri_Menu_${fecha}.pdf`);

    } catch (err) {
        console.error("Error al generar PDF:", err);
        alert("Hubo un error al generar el PDF. Intenta recargar la página.");
    } finally {
        // 6. Restaurar
        if(document.getElementById('pdf-loading-overlay')) {
            document.body.removeChild(document.getElementById('pdf-loading-overlay'));
        }
        btn.style.display = 'flex';
    }
}