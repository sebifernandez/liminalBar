// ======================================================
// 1. VARIABLES GLOBALES Y ESTADO
// ======================================================
let contenidoWeb = { es: {}, en: {} };
let idiomaActual = localStorage.getItem('altxerri_lang') || 'es';
let eventos = [];
const DateTimeLuxon = luxon.DateTime;

// ======================================================
// 2. INICIALIZACIÓN (DOM LOADED)
// ======================================================
document.addEventListener('DOMContentLoaded', async () => {
    
    // A. Efectos Visuales (Hamburguesa, Scroll, etc.)
    inicializarEfectosVisuales();

    // B. Cargar Textos desde la API
    await cargarContenidoDesdeAPI();

    // C. Aplicar el idioma guardado o por defecto
    aplicarIdioma(idiomaActual);

    // D. Cargar Eventos (Depende del idioma para los textos de las cards)
    cargarEventos();

    //E. Carga las notificaciones Push
    inicializarSistemaPush();

    //F. Carga el calendario interactivo
    inicializarCalendarioFull();

    // G. INICIALIZAR REPRODUCTOR DE VIDEO
    inicializarReproductorVideo();

    // G. INICIALIZAR FORMULARIOS DE CONTACTO
    inicializarFormulariosContacto()
});

// ======================================================
// 3. LÓGICA DE GESTIÓN DE CONTENIDOS E IDIOMA
// ======================================================

async function cargarContenidoDesdeAPI() {
    try {
        const response = await fetch('/api/contenido/home');
        if (!response.ok) throw new Error('Error al cargar contenido');
        const data = await response.json();
        
        contenidoWeb.es = data.es;
        contenidoWeb.en = data.en;
        
        console.log("Textos cargados:", contenidoWeb);
    } catch (error) {
        console.error("Fallo crítico cargando textos:", error);
    }
}

function aplicarIdioma(lang) {
    const textos = contenidoWeb[lang];
    if (!textos) return;

    idiomaActual = lang;
    localStorage.setItem('altxerri_lang', lang);
    document.documentElement.lang = lang;

    // 1. Navbar Dinámico
    renderizarNavbar(textos.navbar, lang);

    // 2. Textos Estáticos (Hero, Historia, etc.)
    setText('hero-titulo', textos.hero.titulo);
    setHTML('hero-subtitulo', textos.hero.subtitulo);
    
    setText('historia-titulo', textos.historia.titulo);
    setHTML('historia-texto', textos.historia.texto);
    
    setText('galeria-titulo', textos.galeria.titulo);
    setText('galeria-subtitulo', textos.galeria.subtitulo);
    
    setText('parallax-titulo', textos.parallax.titulo);
    setText('parallax-btn', textos.parallax.btnTexto);
    
    setText('eventos-titulo', textos.eventos.titulo);
    
    setText('contacto-titulo', textos.contacto.titulo);
    
    // 3. Tabs de Contacto
    setText('tab-cliente', textos.contacto.pestanas.cliente);
    setText('tab-banda', textos.contacto.pestanas.banda);
    setText('tab-comercial', textos.contacto.pestanas.comercial);
    setText('tab-prensa', textos.contacto.pestanas.prensa);

    // 4. Formularios
    actualizarFormularios(textos.contacto.formularios);

    // 5. Ubicación
    setText('ubicacion-titulo', textos.ubicacion.titulo);
    setHTML('ubicacion-subtitulo', textos.ubicacion.subtitulo);
    setText('ubicacion-texto', textos.ubicacion.texto);

    // 6. Newsletter Modal
    setText('newsletter-modal-titulo', textos.newsletter.titulo);
    setText('newsletter-modal-subtitulo', textos.newsletter.subtitulo);
    setPlaceholder('newsletterName', textos.newsletter.phNombre);
    setPlaceholder('newsletterEmail', textos.newsletter.phMail);
    setText('newsletter-btn-enviar', textos.newsletter.btnSuscribir);

    // 8. Renderizar Galería Dinámica (NUEVO)
    if (textos.galeria && textos.galeria.imagenes) {
        renderizarGaleria(textos.galeria.imagenes);
    }

    // 7. Actualizar Carrusel de Eventos (si ya se cargaron)
    if (eventos.length > 0) {
        inicializarEventos(); 
    }

    // 9. Actualizar Eventos y Push (FIX IDIOMA PUSH)
    if (eventos.length > 0) {
        inicializarEventos();
        // Forzamos recálculo de la notificación con el nuevo idioma
        if (typeof evaluarEstadoPush === 'function') {
            evaluarEstadoPush(); 
        }
    }
}

function toggleIdioma() {
    const nuevoIdioma = idiomaActual === 'es' ? 'en' : 'es';
    aplicarIdioma(nuevoIdioma);
}

// --- HELPERS DE RENDERIZADO ---

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}
function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}
function setPlaceholder(id, text) {
    const el = document.getElementById(id);
    if (el) el.placeholder = text;
}

function renderizarNavbar(navData, lang) {
    const container = document.getElementById('nav-links-container');
    if (!container) return;

    let html = '';
    
    // 1. Enlaces normales
    navData.items.forEach(item => {
        const targetAttr = item.link.includes('carta') ? 'target="_blank"' : '';
        html += `<a href="${item.link}" ${targetAttr}>${item.texto}</a>`;
    });

    // 2. Botón Newsletter de la LISTA (Solo visible en Desktop por CSS)
    html += `<button class="btn-newsletter" id="nav-btn-newsletter-list" style="height: 40px; padding: 0 1.5rem; margin-left: 1rem;">${navData.btnExtra}</button>`;

    // 3. Botón Idioma MÓVIL (Dentro de la lista)
    html += `
        <button class="btn-newsletter btn-lang-list" id="btn-lang-mobile" style="background: #000; border: 1px solid #fff;">
            ${lang === 'es' ? 'ENG' : 'ESP'}
        </button>
    `;
    
    container.innerHTML = html;

    // 4. Actualizar textos de botones FIJOS (Header)
    const desktopLangBtn = document.getElementById('btn-lang-desktop');
    const mobileNewsBtn = document.getElementById('nav-btn-newsletter-mobile'); // <--- NUEVO

    if(desktopLangBtn) desktopLangBtn.textContent = lang === 'es' ? 'ENG' : 'ESP';
    if(mobileNewsBtn) mobileNewsBtn.textContent = navData.btnExtra; // <--- NUEVO: Traduce el botón móvil

    // 5. Asignar Listeners
    document.getElementById('nav-btn-newsletter-list')?.addEventListener('click', openNewsletter);
    document.getElementById('btn-lang-mobile')?.addEventListener('click', toggleIdioma);
    if(desktopLangBtn) desktopLangBtn.onclick = toggleIdioma; 
    
    // Listener para el nuevo botón móvil
    if(mobileNewsBtn) mobileNewsBtn.addEventListener('click', openNewsletter);

    // Cerrar menú al hacer clic en enlaces
    const links = container.querySelectorAll('a, button');
    links.forEach(link => {
        link.addEventListener('click', () => {
            if (link.id !== 'btn-lang-mobile') {
                container.classList.remove('active');
            }
        });
    });
}

function actualizarFormularios(forms) {
    // Cliente
    setPlaceholder('input-cliente-nombre', forms.cliente.phNombre);
    setPlaceholder('input-cliente-mail', forms.cliente.phMail);
    setPlaceholder('input-cliente-asunto', forms.cliente.phAsunto);
    setPlaceholder('msg-cliente', forms.cliente.phMensaje);
    setText('btn-cliente', forms.cliente.btnEnviar);

    // Banda
    setPlaceholder('input-banda-nombre', forms.banda.phNombreBanda);
    setPlaceholder('input-banda-contacto', forms.banda.phContacto);
    setPlaceholder('input-banda-mail', forms.banda.phMail);
    setPlaceholder('input-banda-material', forms.banda.phMaterial);
    setPlaceholder('msg-banda', forms.banda.phMensaje);
    setText('btn-banda', forms.banda.btnEnviar);

    // Comercial
    setPlaceholder('input-comercial-empresa', forms.comercial.phEmpresa);
    setPlaceholder('input-comercial-contacto', forms.comercial.phContacto);
    setPlaceholder('input-comercial-mail', forms.comercial.phMail);
    setPlaceholder('input-comercial-tipo', forms.comercial.phTipo);
    setPlaceholder('msg-comercial', forms.comercial.phMensaje);
    setText('btn-comercial', forms.comercial.btnEnviar);

    // Prensa
    setPlaceholder('input-prensa-medio', forms.prensa.phMedio);
    setPlaceholder('input-prensa-contacto', forms.prensa.phContacto);
    setPlaceholder('input-prensa-mail', forms.prensa.phMail);
    setPlaceholder('input-prensa-motivo', forms.prensa.phMotivo);
    setPlaceholder('msg-prensa', forms.prensa.phMensaje);
    setText('btn-prensa', forms.prensa.btnEnviar);
}

// ======================================================
// 4. EFECTOS VISUALES (Tus efectos originales)
// ======================================================

function inicializarEfectosVisuales() {
    // EFECTO HAMBURGUESA
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links-container'); // ID actualizado

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // EFECTO DESVANECIMIENTO
    let img1 = document.querySelector('.fondo');
    if (img1) {
        window.addEventListener('scroll', function() {
            let value = 1 + window.scrollY / -600;
            img1.style.opacity = value;
        });
    }

    let img2 = document.querySelector('#containermobile .fondo');
    if (img2) {
        window.addEventListener('scroll', function() {
            let value = 1 + window.scrollY / -600;
            img2.style.opacity = value;
        });
    }

    // EFECTO SCROLL REVEAL
    ScrollReveal({
        reset: true,
        distance: '60px',
        duration: 2500,
        delay: 200
    });

    ScrollReveal().reveal('.movimientoh1', { delay: 200, origin: 'bottom' });
    ScrollReveal().reveal('.movimientoh3', { delay: 300, origin: 'bottom' });
    ScrollReveal().reveal('.btn-reservar2', { delay: 300, origin: 'bottom' });

// EFECTO PARALLAX (Optimizado para alto rendimiento)
    let tickingParallax = false;
    window.addEventListener('scroll', function() {
        if (!tickingParallax) {
            window.requestAnimationFrame(function() {
                const parallax = document.querySelector('.parallax-section');
                if (parallax) {
                    const rect = parallax.getBoundingClientRect();
                    const viewportCenter = window.innerHeight / 2;
                    const sectionCenter = rect.top + parallax.offsetHeight / 2;
                    const distanceToCenter = viewportCenter - sectionCenter;
                    
                    // Suavizamos el multiplicador a 0.4 para que el efecto sea más fluido
                    const backgroundPositionY = (distanceToCenter * 0.4); 
                    parallax.style.backgroundPositionY = `calc(50% + ${backgroundPositionY}px)`;
                }
                tickingParallax = false;
            });
            tickingParallax = true;
        }
    });

    // EFECTO CAMBIO FORMULARIOS DE CONTACTO
    const tabs = document.querySelectorAll('.tab');
    const forms = document.querySelectorAll('.contact-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));

            tab.classList.add('active');
            const targetId = tab.dataset.target; // Usamos data-target
            const targetForm = document.getElementById(targetId);
            if (targetForm) targetForm.classList.add('active');
        });
    });
}

// ======================================================
// 5. LÓGICA DE EVENTOS (Carga y Carrusel)
// ======================================================

const track = document.querySelector('.carousel-track');
const leftBtn = document.querySelector('.carousel-btn.left');
const rightBtn = document.querySelector('.carousel-btn.right');
const HORA_LIMITE = 6; 
const HORA_CADUCIDAD_LIVE = 3; 

let cards = [];
let activeIndex = 0;

function cargarEventos() {
    const preloader = document.getElementById('preloader');
    
    fetch("/api/eventos")
        .then(res => {
            if (!res.ok) throw new Error('Error API eventos');
            return res.json();
        })
        .then(data => {
            eventos = data;
            eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));
            
            inicializarEventos();
            inicializarCalendario();
            
            // --- FIX RETRASO PUSH ---
            // Apenas tenemos datos, calculamos la notificación
            if (typeof evaluarEstadoPush === 'function') {
                evaluarEstadoPush();
            }
            // ------------------------
            
            // --- MAGIA DEL NEWSLETTER (DEEP LINKING) ---
            // Chequeamos si el usuario viene desde un click del correo
            const urlParams = new URLSearchParams(window.location.search);
            const fechaDesdeMail = urlParams.get('evento');
            
            if (fechaDesdeMail && eventos && eventos.length > 0) {
                // Buscamos si hay eventos para esa fecha
                const eventosDelDia = eventos.filter(ev => ev.fecha === fechaDesdeMail);
                
                if (eventosDelDia.length > 0) {
                    // Le damos 800 milisegundos para que la página termine de acomodarse
                    // y disparamos el popup en toda la pantalla.
                    setTimeout(() => {
                        abrirDetalleCentro(eventosDelDia);
                    }, 800);
                    
                    // Limpiamos la URL para que quede prolija (opcional)
                    window.history.replaceState({}, document.title, window.location.pathname + "#eventos");
                }
            }
            // ------------------------------------------

            if (preloader) preloader.classList.add('preloader-hidden');
        })
        .catch(error => {
            console.error(error);
            if (track) track.innerHTML = "<p style='color:white;text-align:center;'>Error cargando eventos.</p>";
            if (preloader) preloader.classList.add('preloader-hidden');
        });
}

// ======================================================
// FUNCIÓN GENERADORA DE CARDS (Con soporte para Enter/\n)
// ======================================================
function createEventCard(evento) {
    // OBTIENE LOS TEXTOS TRADUCIDOS DE LA BD
    const textosUI = contenidoWeb[idiomaActual]?.eventos?.ui || {};
    
    const txtReservar = idiomaActual === 'en' ? 'Book' : 'Reservar';
    const txtFinalizado = idiomaActual === 'en' ? 'Ended' : 'Finalizado';

    const luxonFecha = DateTimeLuxon.fromISO(evento.fecha);
    const ahoraMadrid = DateTimeLuxon.now().setZone("Europe/Madrid");    

    // 1. Evento Pasado
    const fechaCorteFinalizado = DateTimeLuxon.fromISO(evento.fecha, { zone: "Europe/Madrid" })
        .plus({ days: 1 })
        .set({ hour: HORA_LIMITE, minute: 0, second: 0, millisecond: 0 });
    const esPasado = ahoraMadrid >= fechaCorteFinalizado;
    
    // 2. Especiales (Cerrado/Privado)
    if (evento.tipoEvento === "Cerrado" || evento.tipoEvento === "Privado") {
        const isClosed = evento.tipoEvento === "Cerrado";
        const specialImage = isClosed ? "cerrado.jpg" : "eventoPrivado.jpg";
        const specialClass = isClosed ? "closed" : "private";
        
        const specialTitle = isClosed 
            ? (textosUI.labelCerrado || "Cerrado") 
            : (textosUI.labelPrivado || "Privado");
        
        // --- MAGIA NUEVA: SOPORTE PARA ENTER ---
        // Agarramos el texto de la descripción y reemplazamos los saltos de línea (\n) por <br>
        const rawSpecialText = isClosed 
            ? (textosUI.txtCerrado || "...") 
            : (textosUI.txtPrivado || "...");
        const specialTextProcessed = rawSpecialText.replace(/\n/g, '<br>'); // Reemplazo global
            
        const txtSigueAmbiente = textosUI.txtEspecial || "Sigue en ambiente:";
        const finalizadoClass = esPasado ? 'past' : '';

        return `
            <div class="event-card special ${specialClass} ${finalizadoClass}">
                <div class="card-image special">
                    <img src="img/${specialImage}" alt="${specialTitle}">
                    <div class="event-date">${luxonFecha.toFormat("dd LLLL")}</div>
                </div>
                <div class="card-content">
                    <h3>${specialTitle}</h3>
                    <p>${specialTextProcessed}</p>
                    <div class="special-links">
                        ${txtSigueAmbiente} <a href="https://instagram.com/altxerribar" target="_blank">Instagram</a>
                    </div>
                </div>
            </div>
        `;
    }
    
    // 3. LÓGICA DE EVENTOS REGULARES
    const rawTitulo = (idiomaActual === 'en' && evento.titulo_en) ? evento.titulo_en : evento.titulo;
    // --- MAGIA NUEVA: SOPORTE PARA ENTER EN TÍTULO ---
    const tituloMostrar = rawTitulo.replace(/\n/g, '<br>'); // También para títulos

    const rawDesc = (idiomaActual === 'en' && evento.descripcion_en) ? evento.descripcion_en : evento.descripcion;
    // --- MAGIA NUEVA: SOPORTE PARA ENTER EN DESCRIPCIÓN ---
    const descProcessed = rawDesc ? rawDesc.replace(/\n/g, '<br>') : '';

    let botonAdicionalHTML = '';
    let descripcionHTML = '';

    const fechaCorteLive = DateTimeLuxon.fromISO(evento.fecha, { zone: "Europe/Madrid" })
        .plus({ days: 1 })
        .set({ hour: HORA_CADUCIDAD_LIVE, minute: 0, second: 0, millisecond: 0 });
    const liveCaducado = ahoraMadrid >= fechaCorteLive;
    
    if (evento.concierto && evento.concierto.trim() !== '') {
        const txtArchivo = textosUI.btnArchivo || "Reviví el concierto";
        botonAdicionalHTML = `<a href="${evento.concierto}" target="_blank" class="btn-adicional btn-archive">${txtArchivo}</a>`;
    
    } else {
        if (!liveCaducado) { 
            if (evento.live && evento.live.trim() !== '') {
                const txtVivo = textosUI.btnVivo || "Ver en Vivo";
                botonAdicionalHTML = `<a href="${evento.live}" target="_blank" class="btn-adicional btn-live">${txtVivo}</a>`;
            }
            if (descProcessed && descProcessed.trim() !== '') {
                // Usamos la descripción procesada con <br>
                descripcionHTML = `<p class="card-descripcion-precio">${descProcessed}</p>`;
            }
        }
    }
    
    const isLiveActive = botonAdicionalHTML.indexOf('btn-live') !== -1;
    const finalizadoClass = (esPasado && !isLiveActive) ? 'past' : '';
    const finalizadoDisabled = (esPasado && !isLiveActive) ? "disabled" : "";
    const finalizadoTextStr = (esPasado && !isLiveActive) ? txtFinalizado : txtReservar;

    let imagenMostrar;
    if (evento.imagen && (evento.imagen.startsWith('http') || evento.imagen.startsWith('https'))) {
        imagenMostrar = evento.imagen; 
    } else {
        imagenMostrar = `img/${evento.imagen || 'imgBandaGenerica.jpg'}`; 
    }

    const hInicio = evento.horaInicio || "20:00";
    const badgeHorario = `
        <div style="position:absolute; bottom:10px; right:10px; background:#B71C1C; color:#fff; padding:4px 8px; border-radius:4px; font-size:0.8rem; font-weight:bold; box-shadow:0 2px 4px rgba(0,0,0,0.5); z-index:2;">
            <i class='bx bx-time-five'></i> ${hInicio} hs
        </div>
    `;

    return `
        <div class="event-card ${finalizadoClass}">
            <div class="card-image">
                <img src="${imagenMostrar}" alt="${rawTitulo}"> <div class="event-date">${luxonFecha.toFormat("dd LLLL")}</div>
                ${badgeHorario} </div>
            <div class="card-content">
                <h3>${tituloMostrar}</h3> ${descripcionHTML}
                <button class="btn-reservar" ${finalizadoDisabled}>
                    ${finalizadoTextStr}
                </button>
                ${botonAdicionalHTML}
            </div>
        </div>
    `;
}

function inicializarEventos() {
    if (!eventos || eventos.length === 0) return; 
    track.innerHTML = ''; 

    const ahoraMadrid = DateTimeLuxon.now().setZone("Europe/Madrid");
    let primerEventoProximoIndex = -1;

    eventos.forEach((evento, index) => {
        const cardHTML = createEventCard(evento);
        track.insertAdjacentHTML('beforeend', cardHTML);

        // --- MAGIA NUEVA: Habilitar click para Pop-up ---
        const cardElement = track.lastElementChild;
        cardElement.addEventListener('click', (e) => {
            // Si el usuario hizo clic en un botón (Reservar, Vivo, IG), no abrimos el modal
            if (e.target.closest('button, a')) return;
            // Si hizo clic en la card, abrimos el modal con ese evento
            abrirDetalleCentro(evento);
        });

        const fechaCorteFinalizado = DateTimeLuxon.fromISO(evento.fecha, { zone: "Europe/Madrid" })
            .plus({ days: 1 })
            .set({ hour: HORA_LIMITE, minute: 0, second: 0, millisecond: 0 });
        const esPasado = ahoraMadrid >= fechaCorteFinalizado;

        if (!esPasado && primerEventoProximoIndex === -1) {
            primerEventoProximoIndex = index;
        }
    });

    cards = Array.from(document.querySelectorAll('.carousel-track .event-card'));
    activeIndex = (primerEventoProximoIndex !== -1) ? primerEventoProximoIndex : Math.max(0, cards.length - 1); 
    
    updateCarousel();
    setupCarouselControls();
}

function updateCarousel() {
    if (cards.length === 0) return;
    cards = Array.from(document.querySelectorAll('.carousel-track .event-card'));
    const cardWidth = cards[0].offsetWidth;
    const cardMargin = 16; 
    
    let offsetIndex = 2; 
    if (window.innerWidth <= 900) offsetIndex = 0; 

    const adjustedActiveIndex = Math.max(0, activeIndex);
    const offset = -(adjustedActiveIndex - offsetIndex) * (cardWidth + cardMargin);
    track.style.transform = `translateX(${offset}px)`;

    cards.forEach(card => card.classList.remove('active'));
    if (cards[activeIndex]) cards[activeIndex].classList.add('active');
}

function setupCarouselControls() {
    // Buscamos los botones frescos del DOM
    const left = document.querySelector('.carousel-btn.left');
    const right = document.querySelector('.carousel-btn.right');

    if (!left || !right) return;

    // Clona y reemplaza para limpiar listeners viejos de forma segura
    const newLeft = left.cloneNode(true);
    const newRight = right.cloneNode(true);
    
    if (left.parentNode) {
        left.parentNode.replaceChild(newLeft, left);
    }
    if (right.parentNode) {
        right.parentNode.replaceChild(newRight, right);
    }

    // Asignamos los nuevos listeners
    newLeft.addEventListener('click', () => {
        activeIndex = Math.max(0, activeIndex - 1);
        updateCarousel();
    });

    newRight.addEventListener('click', () => {
        activeIndex = Math.min(cards.length - 1, activeIndex + 1);
        updateCarousel();
    });
}

// Swipe Mobile
let startX = 0;
track.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; });
track.addEventListener('touchend', (e) => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    if (Math.abs(diff) > 50) { 
        if (diff > 0) {
            activeIndex = Math.min(cards.length - 1, activeIndex + 1);
        } else {
            activeIndex = Math.max(0, activeIndex - 1);
        }
        updateCarousel();
    }
});

// ======================================================
// 6. GALERÍA Y MODALES
// ======================================================

// GALERÍA DINÁMICA
const galleryTrack = document.getElementById('gallery-track');
const galleryIndicatorsContainer = document.getElementById('gallery-indicators');
const leftGalleryBtn = document.querySelector('.left-gallery-btn');
const rightGalleryBtn = document.querySelector('.right-gallery-btn');

let currentGalleryIndex = 0;
let totalGallerySlides = 0;
let galleryInterval;

function renderizarGaleria(imagenes) {
    if (!galleryTrack || !imagenes || imagenes.length === 0) return;

    // 1. Limpiar
    galleryTrack.innerHTML = '';
    if(galleryIndicatorsContainer) galleryIndicatorsContainer.innerHTML = '';
    
    // 2. Generar Slides
    imagenes.forEach((imgSrc, index) => {
        // Si no empieza con http, asumimos que está en img/
        const ruta = imgSrc.startsWith('http') ? imgSrc : `img/${imgSrc}`;
        
        const img = document.createElement('img');
        img.src = ruta;
        img.className = 'gallery-slide';
        img.alt = `Galería imagen ${index + 1}`;
        if (index > 0) img.loading = "lazy";
        galleryTrack.appendChild(img);

        // Generar Indicador
        if(galleryIndicatorsContainer) {
            const dot = document.createElement('div');
            dot.className = 'indicator';
            dot.addEventListener('click', () => moveToGallerySlide(index));
            galleryIndicatorsContainer.appendChild(dot);
        }
    });

    totalGallerySlides = imagenes.length;
    currentGalleryIndex = 0;
    moveToGallerySlide(0);

    // Reiniciar Intervalo
    if (galleryInterval) clearInterval(galleryInterval);
    galleryInterval = setInterval(() => moveToGallerySlide(currentGalleryIndex + 1), 4000);
}

function moveToGallerySlide(index) {
    if (totalGallerySlides === 0) return;

    if (index >= totalGallerySlides) index = 0;
    else if (index < 0) index = totalGallerySlides - 1;

    currentGalleryIndex = index;
    const offset = -currentGalleryIndex * 100;
    galleryTrack.style.transform = `translateX(${offset}vw)`;

    // Actualizar indicadores
    if(galleryIndicatorsContainer) {
        const dots = galleryIndicatorsContainer.querySelectorAll('.indicator');
        dots.forEach((dot, i) => dot.classList.toggle('active', i === currentGalleryIndex));
    }
}

// Listeners Botones Galería
if (leftGalleryBtn) {
    // Clonar para limpiar listeners viejos si se recarga
    const newLeft = leftGalleryBtn.cloneNode(true);
    leftGalleryBtn.parentNode.replaceChild(newLeft, leftGalleryBtn);
    newLeft.addEventListener('click', () => {
        moveToGallerySlide(currentGalleryIndex - 1);
        if(galleryInterval) clearInterval(galleryInterval); // Pausa auto al interactuar
    });
}

if (rightGalleryBtn) {
    const newRight = rightGalleryBtn.cloneNode(true);
    rightGalleryBtn.parentNode.replaceChild(newRight, rightGalleryBtn);
    newRight.addEventListener('click', () => {
        moveToGallerySlide(currentGalleryIndex + 1);
        if(galleryInterval) clearInterval(galleryInterval);
    });
}

// Swipe Mobile Galería
let galleryStartX = 0;
if (galleryTrack) {
    galleryTrack.addEventListener('touchstart', (e) => { galleryStartX = e.touches[0].clientX; });
    galleryTrack.addEventListener('touchend', (e) => {
        const diff = galleryStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) moveToGallerySlide(currentGalleryIndex + 1);
            else moveToGallerySlide(currentGalleryIndex - 1);
            if(galleryInterval) clearInterval(galleryInterval);
        }
    });
}

// MODAL CALENDARIO (Variables y Listeners)
const modalCalendario = document.getElementById("modalCalendario");
const btnAbrirCal = document.getElementById("abrirCalendario");
const btnCerrarCal = document.getElementById("cerrarCalendario");
const filtroCal = document.getElementById("filtroEstado");
const inputBusquedaCal = document.getElementById("busquedaEventos");
const calendarioDiv = document.getElementById("calendario");
const detalleEvento = document.getElementById("detalleEvento");

if (btnAbrirCal) btnAbrirCal.addEventListener("click", () => modalCalendario.style.display = "block");
if (btnCerrarCal) btnCerrarCal.addEventListener("click", () => modalCalendario.style.display = "none");
window.addEventListener("click", e => {
  if (e.target === modalCalendario) modalCalendario.style.display = "none";
});

function inicializarCalendario() {
    // Asegurarse de que Litepicker existe
    if (typeof Litepicker !== 'undefined' && calendarioDiv) {
        new Litepicker({
            element: calendarioDiv,
            format: 'YYYY-MM-DD',
            lang: 'es-ES',
            inlineMode: true,
            setup: (picker) => {
                picker.on('selected', (date) => {
                    mostrarEvento(date.format('yyyy-MM-dd'));
                });
            }
        });
    }
}

function mostrarEvento(fecha) {
    // Esta función usa la variable global 'eventos'
    const evento = eventos.find(ev => ev.fecha === fecha);
    if (!evento) {
        detalleEvento.innerHTML = `<p>No hay evento en esta fecha.</p>`;
        return;
    }
    // Reutiliza createEventCard para consistencia visual y de idioma
    detalleEvento.innerHTML = createEventCard(evento);
}

if (inputBusquedaCal) inputBusquedaCal.addEventListener("input", aplicarFiltros);
if (filtroCal) filtroCal.addEventListener("change", aplicarFiltros);

function aplicarFiltros() {
    const texto = inputBusquedaCal.value.toLowerCase();
    const estado = filtroCal.value;
    const ahora = DateTimeLuxon.now().setZone("Europe/Madrid");

    let resultados = eventos.filter(ev => {
        const fechaEv = DateTimeLuxon.fromISO(ev.fecha, { zone: "Europe/Madrid" });
        const fechaCorte = fechaEv.plus({ days: 1 }).set({ hour: HORA_LIMITE });
        const esPasado = ahora >= fechaCorte;
        
        const coincideEstado = estado === "proximos" ? !esPasado : esPasado;
        const coincideTexto = ev.titulo.toLowerCase().includes(texto); // Simplificado

        return coincideEstado && coincideTexto;
    });

    if (resultados.length > 0) {
        mostrarEvento(resultados[0].fecha);
    } else {
        detalleEvento.innerHTML = `<p>No hay eventos que coincidan.</p>`;
    }
}

// MODAL NEWSLETTER
const newsletterModal = document.getElementById('newsletterModal');
const navBtnNewsletter = document.getElementById('nav-btn-newsletter'); 
const parallaxBtn = document.getElementById('parallax-btn'); 
const closeModalSpan = document.querySelector('.close-newsletter-modal');
const newsletterForm = document.getElementById('newsletterForm');
const successMessage = document.getElementById('newsletterSuccessMessage');
const formContainer = document.getElementById('newsletterFormContainer');
const closeSuccessBtn = document.getElementById('closeNewsletterSuccess');

// Función para abrir
function openNewsletter() {
    if(newsletterModal) newsletterModal.classList.add('show');
}

// Función para cerrar
function closeNewsletter() {
    if(newsletterModal) newsletterModal.classList.remove('show');
    // Reseteamos estados visuales
    if(formContainer) formContainer.style.display = 'block';
    if(successMessage) successMessage.style.display = 'none';
    if(newsletterForm) newsletterForm.reset();
}

// Listeners (Conectamos los botones a las funciones)
if (navBtnNewsletter) navBtnNewsletter.addEventListener('click', openNewsletter);
if (parallaxBtn) parallaxBtn.addEventListener('click', openNewsletter);
if (closeModalSpan) closeModalSpan.addEventListener('click', closeNewsletter);
if (closeSuccessBtn) closeSuccessBtn.addEventListener('click', closeNewsletter);

// Cerrar si clickean fuera
window.addEventListener('click', (event) => {
    if (event.target === newsletterModal) closeNewsletter();
});

// Envío del formulario
// En js/script.js
if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nombreInput = document.getElementById('newsletterName');
        const emailInput = document.getElementById('newsletterEmail');
        const nombre = nombreInput.value;
        const email = emailInput.value;
        const btn = newsletterForm.querySelector('button');
        const txtOriginal = btn.innerText;

        btn.disabled = true;
        btn.innerText = "...";

        try {
            const res = await fetch('/api/suscribir', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, email })
            });

            const data = await res.json();
            
            if (data.success) {
                if(formContainer) formContainer.style.display = 'none';
                if(successMessage) successMessage.style.display = 'block';
                
                // --- LA MAGIA: Le devolvemos la vida al botón ---
                btn.disabled = false;
                btn.innerText = txtOriginal;
                
                // --- LA YAPA: Vaciamos los inputs para la próxima ---
                nombreInput.value = '';
                emailInput.value = '';

            } else {
                alert("Error: " + data.message);
                btn.disabled = false;
                btn.innerText = txtOriginal;
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión.");
            btn.disabled = false;
            btn.innerText = txtOriginal;
        }
    });
}

// ======================================================
// 7. SISTEMA DE NOTIFICACIONES PUSH (HÍBRIDO: CAJA + TROMPETA)
// ======================================================

let pushInterval;
const PUSH_STATE = { closed: false }; 

function inicializarSistemaPush() {
    // 1. Listeners de UI (Trompeta y Botón Cerrar)
    const btnClose = document.getElementById('btn-close-push');
    const trigger = document.getElementById('push-trigger');

    if (btnClose) {
        btnClose.addEventListener('click', (e) => {
            e.preventDefault();
            togglePush(false);
        });
    }
    
    if (trigger) {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            togglePush(true);
        });
    }

    // 2. Loop de chequeo (Inmediato y cada 60s)
    evaluarEstadoPush(); 
    pushInterval = setInterval(async () => {
        try {
            const res = await fetch("/api/eventos");
            if (res.ok) {
                eventos = await res.json();
                evaluarEstadoPush();
            }
        } catch (e) { console.error("Error polling eventos:", e); }
    }, 60000);
}

function togglePush(mostrar) {
    const box = document.getElementById('push-notification');
    const trigger = document.getElementById('push-trigger');
    
    // Si los elementos no existen en el HTML, no hacemos nada para evitar errores
    if (!box || !trigger) return;

    if (mostrar) {
        box.classList.add('visible');
        trigger.classList.remove('visible'); // Oculta trompeta
        PUSH_STATE.closed = false;
    } else {
        box.classList.remove('visible');
        trigger.classList.add('visible'); // Muestra trompeta
        PUSH_STATE.closed = true;
    }
}



//--------------------------------------------------------
//--------------------------------------------------------
//--------------------------------------------------------

// --- 1. EVALUAR ESTADO GENERAL PUSH ---
function evaluarEstadoPush() {
    if (!eventos) return;

    // Hora Madrid. El "día" cambia a las 6 AM (minus 6 hours)
    const ahora = DateTimeLuxon.now().setZone("Europe/Madrid");
    const fechaOperativa = ahora.minus({ hours: 6 }).toISODate(); 
    
    // Obtenemos qué día es "mañana" operativamente
    const fechaManana = ahora.minus({ hours: 6 }).plus({ days: 1 }).toISODate();

    // Filtramos todos los eventos de "Hoy" (Operativo)
    let eventosHoy = eventos.filter(e => e.fecha === fechaOperativa);
    const textos = textosUI_Push();

    // Caso H: No hay eventos hoy
    if (eventosHoy.length === 0) {
        const htmlGenerico = generarMensajePush('H', null, textos);
        actualizarCajaPush(htmlGenerico);
        return;
    }

    // Ordenamos los eventos de hoy por hora de inicio (temprano a tarde)
    eventosHoy.sort((a,b) => (a.horaInicio || "20:00").localeCompare(b.horaInicio || "20:00"));

    let notificacionesHTML = []; // Array para guardar máximo 2 notificaciones

    // Analizamos cada evento de hoy para ver su estado temporal
    const estadosEventos = eventosHoy.map(evento => {
        return {
            evento: evento,
            estado: calcularEstadoTemporal(evento, ahora) // Devuelve: 'FUTURO', 'CUENTA_REGRESIVA', 'INMINENTE', 'VIVO', 'TERMINADO'
        };
    });

    // 1. ¿Hay algún evento en VIVO? (Prioridad 1)
    const eventosEnVivo = estadosEventos.filter(e => e.estado.tipo === 'VIVO');
    
    // 2. Eventos Futuros o en Cuenta Regresiva
    const eventosPorVenir = estadosEventos.filter(e => ['FUTURO', 'CUENTA_REGRESIVA', 'INMINENTE'].includes(e.estado.tipo));
    
    // 3. Eventos Terminados
    const eventosTerminados = estadosEventos.filter(e => e.estado.tipo === 'TERMINADO');

    // --- LÓGICA DE DECISIÓN (EL DIRECTOR DE ORQUESTA) ---

    // A. YA TERMINARON TODOS LOS SHOWS DE HOY (La madrugada, antes de las 6am)
    if (eventosPorVenir.length === 0 && eventosEnVivo.length === 0 && eventosTerminados.length > 0) {
        // Buscamos el primer evento de "Mañana"
        const eventosManana = eventos.filter(e => e.fecha === fechaManana).sort((a,b) => (a.horaInicio || "20:00").localeCompare(b.horaInicio || "20:00"));
        const evtManana = eventosManana.length > 0 ? eventosManana[0] : null;
        
        notificacionesHTML.push(generarMensajePush('E_FINAL', evtManana, textos));
    } 
    // B. HAY EVENTOS POR VENIR O EN VIVO
    else {
        // Construimos la lista de eventos a mostrar, máximo 2
        let eventosAMostrar = [];

        // Si hay eventos en vivo, van primero
        if (eventosEnVivo.length > 0) {
            eventosAMostrar.push(eventosEnVivo[0]); // Metemos el primer en vivo (arriba)
            
            // Si hay un segundo evento por venir, lo ponemos abajo
            if (eventosPorVenir.length > 0) {
                eventosAMostrar.push(eventosPorVenir[0]);
            }
        } 
        // Si no hay en vivo, pero hay varios por venir
        else if (eventosPorVenir.length > 0) {
            eventosAMostrar.push(eventosPorVenir[0]); // El próximo show (arriba)
            
            // Si hay un segundo show futuro, armamos la card múltiple
            if (eventosPorVenir.length > 1) {
                // Acá le pasamos a la función todos los eventos futuros restantes
                const futurosRestantes = eventosPorVenir.slice(1);
                notificacionesHTML.push(generarMensajePush(eventosAMostrar[0].estado.tipo, eventosAMostrar[0].evento, textos, eventosAMostrar[0].estado.mins));
                notificacionesHTML.push(generarMensajePush('MULTIPLE_FUTURO', futurosRestantes, textos));
                eventosAMostrar = []; // Vaciamos para no iterar de nuevo abajo
            }
        }

        // Si no usamos la lógica 'MULTIPLE_FUTURO', iteramos normalmente
        eventosAMostrar.forEach(item => {
            notificacionesHTML.push(generarMensajePush(item.estado.tipo, item.evento, textos, item.estado.mins));
        });
    }

    // Unimos los HTML con un separador si hay más de 1
    const htmlFinal = notificacionesHTML.join(`<hr style="border:0; border-top:1px solid rgba(255,255,255,0.2); margin:10px 0;">`);
    
    if (htmlFinal) {
        actualizarCajaPush(htmlFinal);
    }
}


// --- 2. CALCULADORA DE TIEMPO EXACTO ---
function calcularEstadoTemporal(evento, ahora) {
    if (evento.tipoEvento === 'Cerrado') return { tipo: 'CERRADO' };
    if (evento.tipoEvento === 'Privado') return { tipo: 'PRIVADO' };

    const hInicioStr = evento.horaInicio || "20:00";
    const hFinStr = evento.horaFin || "22:00";
    const [hIni, mIni] = hInicioStr.split(':').map(Number);
    const [hFin, mFin] = hFinStr.split(':').map(Number);

    const inicio = ahora.set({ hour: hIni, minute: mIni, second: 0 });
    let fin = ahora.set({ hour: hFin, minute: mFin, second: 0 });
    if (fin < inicio) fin = fin.plus({ days: 1 });

    const diffMinInicio = inicio.diff(ahora, 'minutes').minutes;
    const diffMinFin = fin.diff(ahora, 'minutes').minutes;

    if (diffMinInicio > 60) return { tipo: 'FUTURO', mins: diffMinInicio };
    if (diffMinInicio <= 60 && diffMinInicio > 5) return { tipo: 'CUENTA_REGRESIVA', mins: diffMinInicio };
    if (diffMinInicio <= 5 && diffMinInicio > 0) return { tipo: 'INMINENTE', mins: diffMinInicio };
    if (diffMinInicio <= 0 && diffMinFin > 0) return { tipo: 'VIVO', mins: 0 };
    return { tipo: 'TERMINADO', mins: diffMinFin };
}


// --- 3. DIBUJANTE DEL MENSAJE (HTML) ---
function generarMensajePush(tipo, eventoOArray, txt, minutos = 0) {
    const mins = Math.ceil(minutos);
    let html = '';

    // Si es tipo MULTIPLE_FUTURO, recibimos un array de estados
    if (tipo === 'MULTIPLE_FUTURO') {
        const eventosArray = eventoOArray;
        let listadoHTML = '';
        
        // Armamos el string: "banda B a las 19 hs, banda C a las 20 hs..."
        eventosArray.forEach((item, index) => {
            const ev = item.evento;
            const tituloEv = idiomaActual === 'en' && ev.titulo_en ? ev.titulo_en : ev.titulo;
            const horaStr = ev.horaInicio || "20:00";
            
            listadoHTML += `<strong>${tituloEv}</strong> a las ${horaStr} hs`;
            if (index < eventosArray.length - 2) listadoHTML += ', ';
            else if (index === eventosArray.length - 2) listadoHTML += ' y ';
        });

        return `<h4>📅 ${txt.hoy}</h4><p>${listadoHTML}.</p>`;
    }

    // Para el resto, asumimos que es un solo evento
    const evento = eventoOArray;
    const tituloEv = evento ? (idiomaActual === 'en' && evento.titulo_en ? evento.titulo_en : evento.titulo) : '';
    const hInicio = evento ? (evento.horaInicio || "20:00") : "20:00";

    switch (tipo) {
        case 'FUTURO': 
            html = `<h4>📅 ${txt.hoy}</h4>
                    <p><strong>${tituloEv}</strong></p>
                    <span class="push-timer">⏰ ${txt.horas}: ${hInicio} hs</span>`;
            break;

        case 'CUENTA_REGRESIVA': 
            html = `<h4>🚀 ${txt.t_inicio}</h4>
                    <p>${txt.p_preparate} <strong>${tituloEv}</strong></p>
                    <span class="push-timer">⏳ ${txt.falta} ${mins} ${txt.minutos}</span>`;
            break;

        case 'INMINENTE': 
            html = `<h4 style="color:#FFD700">🔥 ${txt.t_inicio}</h4>
                    <p><strong>${tituloEv}</strong> ${txt.p_comenzar}</p>
                    <span class="push-timer">⏳ ${mins} ${txt.minutos}!</span>`;
            break;

        case 'VIVO': 
            html = `<h4 style="animation: pulse 1s infinite; color:#FF5252">🔴 ${txt.t_vivo}</h4>
                    <p><strong>${tituloEv}</strong> ${txt.p_tocando}</p>`;
            if (evento.live) html += `<a href="${evento.live}" target="_blank" class="btn-push">${txt.verVivo}</a>`;
            break;

        case 'E_FINAL': // Cuando terminan TODOS los shows (Madrugada)
            let txtManana = '';
            if (evento) { // Si encontramos un evento para el día siguiente
                const titManana = idiomaActual === 'en' && evento.titulo_en ? evento.titulo_en : evento.titulo;
                const hManana = evento.horaInicio || "20:00";
                txtManana = `<br><span style="color:#FFD700; font-size:0.9em;">Mañana: <strong>${titManana}</strong> a las ${hManana} hs!</span>`;
            }
            html = `<h4>💤 ${txt.t_termino}</h4>
                    <p>${txt.p_gracias} ${txtManana}</p>`;
            break;

        case 'CERRADO': 
            html = `<h4>💤 ${txt.t_cerrado}</h4><p>${txt.p_descanso}</p>`;
            break;

        case 'PRIVADO': 
            html = `<h4>🔒 ${txt.t_privado}</h4><p>${txt.p_reservado}</p>`;
            break;

        case 'H': // Sin Evento hoy
            html = `<h4>🎹 ${txt.t_sinEvento}</h4>
                    <p>${txt.p_revisa}</p>
                    <button class="btn-push" style="border:none; cursor:pointer;" 
                        onclick="
                            document.getElementById('btn-close-push').click(); 
                            setTimeout(() => { document.getElementById('btn-abrir-calendario-full').click(); }, 300);
                        ">
                        ${txt.agenda}
                    </button>`;
            break;
    }
    return html;
}

//--------------------------------------------------------
//--------------------------------------------------------
//--------------------------------------------------------

// Función auxiliar para no repetir código de mostrar/ocultar
function actualizarCajaPush(html) {
    const container = document.getElementById('push-content');
    const box = document.getElementById('push-notification');
    const trigger = document.getElementById('push-trigger');
    
    if (container) container.innerHTML = html;

    if (box && trigger) {
        if (!PUSH_STATE.closed) {
            box.classList.add('visible');
            trigger.classList.remove('visible');
        } else {
            box.classList.remove('visible');
            trigger.classList.add('visible');
        }
    }
}

// --- HELPERS (Tus funciones originales integradas) ---

function textosUI_Push() {
    const es = (idiomaActual === 'es');
    return {
hoy: es ? "Hoy:" : "Today:",
        falta: es ? "Faltan" : "Starts in",
        minutos: es ? "min" : "min",
        horas: es ? "Hora" : "Time",
        t_inicio: es ? "¡Inicio Inminente!" : "Starting Soon!",
        t_vivo: es ? "¡EN VIVO!" : "LIVE NOW!",
        verVivo: es ? "Ver en Vivo" : "Watch Live",
        p_tocando: es ? "está tocando ahora mismo." : "is playing right now.",
        p_comenzar: es ? "está por comenzar." : "is about to start.",
        p_preparate: es ? "Prepárate, se viene:" : "Get ready for:",
        t_termino: es ? "¡El show terminó!" : "Show is over!",
        p_gracias: es ? "El show en vivo de esta noche ya terminó. ¡Mañana te esperamos con más jazz!" : "Tonight's live show has ended. See you tomorrow for more jazz!",
        t_cerrado: es ? "Cerrado" : "Closed",
        p_descanso: es ? "Hoy descansamos. ¡Revisa la agenda!" : "Resting today. Check the schedule!",
        t_privado: es ? "Evento Privado" : "Private Event",
        p_reservado: es ? "El bar está reservado hoy." : "The bar is booked today.",
        t_sinEvento: es ? "¡Agenda Abierta!" : "Open Schedule!",
        p_revisa: es ? "Revisa nuestra agenda de próximos conciertos." : "Check our upcoming concerts schedule.",
        agenda: es ? "Ver Agenda" : "View Schedule",
        y_mas: es ? "y más shows" : "and more shows"
    };
}

// ======================================================
// 8. CALENDARIO INTERACTIVO (FULL)
// ======================================================

let calFechaActual = DateTimeLuxon.now().setZone("Europe/Madrid");

function inicializarCalendarioFull() {
    const btnAbrir = document.getElementById('btn-abrir-calendario-full');
    const modal = document.getElementById('modal-calendario-full');
    const btnCerrar = document.getElementById('close-cal-full');
    const btnPrev = document.getElementById('cal-prev-btn');
    const btnNext = document.getElementById('cal-next-btn');
    const searchInput = document.getElementById('cal-search-input');
    
    // Modal Detalle
    const modalDetalle = document.getElementById('modal-detalle-centro');
    const closeDetalle = document.getElementById('close-detalle-centro');

    if (btnAbrir) btnAbrir.addEventListener('click', () => {
        modal.style.display = 'flex';
        renderizarGrillaCalendario(calFechaActual);
    });

    if (btnCerrar) btnCerrar.addEventListener('click', () => modal.style.display = 'none');

    // Cerrar detalle
    if (closeDetalle) closeDetalle.addEventListener('click', () => modalDetalle.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modalDetalle) modalDetalle.style.display = 'none';
    });

    if (btnPrev) btnPrev.addEventListener('click', () => {
        calFechaActual = calFechaActual.minus({ months: 1 });
        renderizarGrillaCalendario(calFechaActual);
    });

    if (btnNext) btnNext.addEventListener('click', () => {
        calFechaActual = calFechaActual.plus({ months: 1 });
        renderizarGrillaCalendario(calFechaActual);
    });

    if (searchInput) {
        searchInput.addEventListener('input', (e) => filtrarEventosCalendario(e.target.value));
    }
}

function renderizarGrillaCalendario(fecha) {
    const grid = document.getElementById('cal-grid');
    const titulo = document.getElementById('cal-month-year');
    
    const meses = idiomaActual === 'es' 
        ? ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
        : ['January','February','March','April','May','June','July','August','September','October','November','December'];
    
    titulo.textContent = `${meses[fecha.month - 1]} ${fecha.year}`;
    grid.innerHTML = '';

    const primerDiaMes = fecha.startOf('month');
    const diasEnMes = fecha.daysInMonth;
    const diaSemanaInicio = primerDiaMes.weekday; // 1=Lun...7=Dom
    let huecosVacios = diaSemanaInicio === 7 ? 0 : diaSemanaInicio; 

    for (let i = 0; i < huecosVacios; i++) {
        const div = document.createElement('div');
        grid.appendChild(div);
    }

    const hoy = DateTimeLuxon.now().setZone("Europe/Madrid").toISODate();
    
    for (let i = 1; i <= diasEnMes; i++) {
        const diaActual = fecha.set({ day: i });
        const fechaIso = diaActual.toISODate();
        
        // --- NUEVA LÓGICA DE AGRUPACIÓN MULTI-EVENTO ---
        // Buscamos TODOS los eventos de ese día
        let eventosDelDia = eventos.filter(ev => ev.fecha === fechaIso);
        
        let tipoVisual = 'open'; 
        let imgUrl = 'img/imgBandaGenerica.jpg';
        let tituloEv = '';
        let infoParaElModal = [];
        let hoverHint = idiomaActual === 'es' ? 'Ver Info' : 'View Info';

        if (eventosDelDia.length === 0) {
            // CASO A: Día vacío (Dummy)
            const dummy = {
                _id: 'dummy-' + fechaIso,
                fecha: fechaIso,
                tipoEvento: 'Regular',
                titulo: idiomaActual === 'es' ? "Bar Abierto" : "Open Bar",
                titulo_en: "Open Bar",
                descripcion: idiomaActual === 'es' ? "Disfruta de buena música y tragos." : "Enjoy good music and drinks.",
                descripcion_en: "Enjoy good music and drinks.",
                imagen: "diaSinBanda.jpg", 
                esDummy: true 
            };
            tipoVisual = 'open';
            tituloEv = dummy.titulo;
            imgUrl = 'img/diaSinBanda.jpg'; 
            infoParaElModal = [dummy];
            
        } else if (eventosDelDia.length === 1) {
            // CASO B: Un solo evento
            let evento = eventosDelDia[0];
            if (evento.tipoEvento === 'Cerrado') tipoVisual = 'closed';
            else if (evento.tipoEvento === 'Privado') tipoVisual = 'private';
            else tipoVisual = 'future';
            
            imgUrl = (evento.imagen && evento.imagen.length > 3) ? (evento.imagen.startsWith('http') ? evento.imagen : `img/${evento.imagen}`) : imgUrl;
            tituloEv = (idiomaActual === 'en' && evento.titulo_en) ? evento.titulo_en : evento.titulo;
            infoParaElModal = [evento];
            
        } else {
            // CASO C: Múltiples eventos (El Festival)
            tipoVisual = 'future'; 
            imgUrl = 'img/imgBandaGenerica.jpg'; // Imagen genérica para el día con muchas bandas
            tituloEv = idiomaActual === 'es' ? `🔥 ${eventosDelDia.length} Shows` : `🔥 ${eventosDelDia.length} Shows`;
            hoverHint = idiomaActual === 'es' ? 'Ver Lineup' : 'View Lineup';
            
            // Le mandamos al modal el array completo ordenado por hora
            infoParaElModal = eventosDelDia.sort((a,b) => (a.horaInicio || "20:00").localeCompare(b.horaInicio || "20:00"));
        }

        if (fechaIso < hoy) tipoVisual = 'past'; // Amarillo si ya pasó

        const div = document.createElement('div');
        div.className = `cal-day status-${tipoVisual}`;
        
        div.innerHTML = `
            <img src="${imgUrl}" class="cal-day-bg" loading="lazy">
            <span class="cal-day-number">${i}</span>
            <span class="cal-day-title">${tituloEv}</span>
            <span class="cal-hover-hint">${hoverHint}</span>
        `;

        // Al clickear, mandamos toda la info recolectada
        div.addEventListener('click', () => abrirDetalleCentro(infoParaElModal));
        grid.appendChild(div);
    }
}

function abrirDetalleCentro(data) {
    const modal = document.getElementById('modal-detalle-centro');
    const container = document.getElementById('contenido-detalle-dinamico');
    
    modal.style.display = 'flex';
    container.innerHTML = ''; 

    // Convertimos lo que llegue a un Array. 
    // Si viene del carrusel (1 solo evento), lo envuelve en []. Si viene del calendario con varias bandas, ya es un [].
    const eventosArray = Array.isArray(data) ? data : [data];

    let htmlApilado = '';
    
    // Dibujamos una card debajo de la otra
    eventosArray.forEach(ev => {
        htmlApilado += createEventCard(ev);
    });

    container.innerHTML = htmlApilado;
    
    // Ajustes post-render para el modal (quitamos márgenes o anchos fijos a TODAS las cards apiladas)
    const cards = container.querySelectorAll('.event-card');
    cards.forEach(card => {
        card.style.minHeight = "auto";
        card.style.margin = "0 0 15px 0"; // Le damos margen abajo para que no se peguen si hay más de una
        card.style.width = "100%";
    });
}

function filtrarEventosCalendario(texto) {
    const container = document.getElementById('cal-search-results');
    container.innerHTML = '';
    if (texto.length < 3) return;
    
    const termino = texto.toLowerCase();
    const resultados = eventos.filter(ev => {
        const t1 = (ev.titulo || '').toLowerCase();
        const t2 = (ev.titulo_en || '').toLowerCase();
        return t1.includes(termino) || t2.includes(termino);
    });

    if (resultados.length === 0) {
        container.innerHTML = '<p style="color:#555;">No se encontraron eventos.</p>';
        return;
    }

    container.innerHTML = resultados.map(ev => {
        const titulo = (idiomaActual === 'en' && ev.titulo_en) ? ev.titulo_en : ev.titulo;
        return `
        <div class="mini-card-result" onclick='abrirDetalleCentro(${JSON.stringify(ev)})' style="cursor:pointer;">
            <strong style="color:#fff;">${DateTimeLuxon.fromISO(ev.fecha).toFormat('dd/MM')}</strong> - ${titulo}
        </div>`;
    }).join('');
}

// ======================================================
// 9. REPRODUCTOR DE VIDEO INCRUSTADO (CINE)
// ======================================================

function inicializarReproductorVideo() {
    const modal = document.getElementById('modal-video-player');
    const closeBtn = document.getElementById('close-video-player');

    if (closeBtn) closeBtn.addEventListener('click', cerrarVideo);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.style.display === 'flex') cerrarVideo();
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) cerrarVideo();
    });

    // DELEGACIÓN DE EVENTOS
    document.body.addEventListener('click', (e) => {
        // Buscamos el botón
        const btn = e.target.closest('.btn-live, .btn-archive, .btn-push');
        
        if (btn && btn.tagName === 'A') {
            console.log("Click detectado en botón de video:", btn.href); // DEBUG

            // Verificamos si es YouTube (común o corto)
            const esYoutube = btn.href.includes('youtube.com') || btn.href.includes('youtu.be');
            
            if (esYoutube) {
                const videoID = extraerIDYoutube(btn.href);
                console.log("ID extraído:", videoID); // DEBUG

                if (videoID) {
                    e.preventDefault(); // ¡DETENER LA REDIRECCIÓN!
                    console.log("Abriendo modal..."); // DEBUG
                    
                    const esLive = btn.classList.contains('btn-live') || btn.innerText.includes('Vivo') || btn.innerText.includes('Live');
                    
                    let titulo = "Video Altxerri";
                    // Intentar buscar título en la tarjeta padre
                    const card = btn.closest('.event-card, .push-content, .mini-card-result, .cal-event-preview');
                    if (card) {
                        const h = card.querySelector('h3, h4, h5');
                        if(h) titulo = h.innerText;
                    }

                    abrirVideo(videoID, esLive, titulo, btn.href);
                } else {
                    console.warn("No se pudo extraer ID de YouTube.");
                }
            }
        }
    });
}

function abrirVideo(videoID, esLive, titulo, urlOriginal) {
    const modal = document.getElementById('modal-video-player');
    const container = document.getElementById('youtube-player-placeholder');
    const chatContainer = document.getElementById('youtube-chat-container');
    const titleEl = document.getElementById('video-modal-title');
    const btnExt = document.getElementById('btn-open-youtube');

    // 1. Título y Link Externo
    if(titleEl) titleEl.textContent = titulo;
    if(btnExt) btnExt.href = urlOriginal;

    // 2. Inyectar Iframe Video
    // autoplay=1 : arranca solo
    // rel=0 : al terminar no muestra videos de otros canales
    container.innerHTML = `
        <iframe 
            src="https://www.youtube.com/embed/${videoID}?autoplay=1&rel=0&modestbranding=1" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
        </iframe>
    `;

    // 3. Lógica del Chat (Solo si es Live)
    // OJO: YouTube bloquea embeds de chat si el dominio no está verificado. 
    // Si falla en Netlify, se verá gris o con error, pero el video funcionará.
    if (esLive) {
        const domain = window.location.hostname;
        chatContainer.style.display = 'block';
        chatContainer.innerHTML = `
            <iframe 
                src="https://www.youtube.com/live_chat?v=${videoID}&embed_domain=${domain}" 
                width="100%" height="100%">
            </iframe>`;
    } else {
        chatContainer.style.display = 'none';
        chatContainer.innerHTML = '';
    }

    modal.style.display = 'flex';
}

function cerrarVideo() {
    const modal = document.getElementById('modal-video-player');
    const container = document.getElementById('youtube-player-placeholder');
    const chatContainer = document.getElementById('youtube-chat-container');
    
    modal.style.display = 'none';
    // IMPORTANTE: Limpiar el HTML para que el video deje de sonar
    container.innerHTML = '';
    chatContainer.innerHTML = '';
}

// Helper: Extraer ID de URLs de Youtube (soporta youtu.be y youtube.com)
function extraerIDYoutube(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// ======================================================
// 10. LÓGICA DE FORMULARIOS DE CONTACTO
// ======================================================
function inicializarFormulariosContacto() {
    const contactForms = document.querySelectorAll('.contact-form');

    contactForms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evitamos que la página recargue

            // Efecto visual de carga
            const btn = form.querySelector('button[type="submit"]');
            const txtOriginal = btn.innerText;
            btn.disabled = true;
            btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Enviando...";

            // Recolectamos los datos del formulario específico
            const formData = new FormData(form);
            const datos = Object.fromEntries(formData.entries());
            const tipo = form.id; // Nos dice si es 'cliente', 'banda', etc.

            try {
                const res = await fetch('/api/contacto', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tipo, datos })
                });

                const data = await res.json();

                if (data.success) {
                    alert("¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.");
                    form.reset(); // Vaciamos los campos
                } else {
                    alert("Error: " + data.message);
                }
            } catch (error) {
                console.error(error);
                alert("Error de conexión. Inténtalo de nuevo más tarde.");
            } finally {
                // Restauramos el botón
                btn.disabled = false;
                btn.innerText = txtOriginal;
            }
        });
    });
}

// IMPORTANTE: Asegurate de llamar a inicializarFormulariosContacto() 
// dentro de tu document.addEventListener('DOMContentLoaded', ...) arriba de todo.