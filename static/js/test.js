const lineasTexto = JSON.parse(document.getElementById("texto-datos").textContent);

const contenedorTexto = document.getElementById("texto-prueba");
const entrada = document.getElementById("entrada-usuario");
const marcadorTiempo = document.getElementById("tiempo-restante");
const barraProgreso = document.getElementById("barra-progreso");
const pantallaResultado = document.getElementById("pantalla-resultado");
const valorWpm = document.getElementById("valor-wpm");

const DURACION_SEGUNDOS = 60;

let indiceLineaActual = 0;
let indicePalabraEnLinea = 0;
let palabrasCorrectasTotales = 0;
let tiempoRestante = DURACION_SEGUNDOS;
let intervalo = null;
let pruebaIniciada = false;
let pruebaTerminada = false;

let rachaConsecutiva = 0; // NUEVO

// Obtenemos las palabras solo de la línea que se está mostrando actualmente
function obtenerPalabrasLineaActual() {
    if (indiceLineaActual >= lineasTexto.length) return [];
    return lineasTexto[indiceLineaActual].split(/\s+/).filter(Boolean);
}

let palabrasLineaActual = obtenerPalabrasLineaActual();

function dibujarLineaActual() {
    palabrasLineaActual = obtenerPalabrasLineaActual();
    indicePalabraEnLinea = 0;

    if (lineasTexto.length === 0 || indiceLineaActual >= lineasTexto.length) {
        finalizarPrueba();
        return;
    }

    contenedorTexto.innerHTML = palabrasLineaActual
        .map((palabra, indice) => {
            const letras = palabra
                .split("")
                .map((letra) => `<span class="letra">${letra}</span>`)
                .join("");
            return `<span class="palabra" data-indice="${indice}">${letras}</span>`;
        })
        .join(" ");
    
    marcarPalabraActual();
}

function marcarPalabraActual() {
    document.querySelectorAll(".palabra").forEach((elemento) => elemento.classList.remove("actual"));
    const elementoActual = document.querySelector(`.palabra[data-indice="${indicePalabraEnLinea}"]`);
    if (elementoActual) {
        elementoActual.classList.add("actual");
        elementoActual.scrollIntoView({ block: "center", behavior: "smooth" });
    }
}

function actualizarLetrasPalabraActual() {
    const elementoActual = document.querySelector(`.palabra[data-indice="${indicePalabraEnLinea}"]`);
    if (!elementoActual) return;

    const palabraObjetivo = palabrasLineaActual[indicePalabraEnLinea];
    const letras = elementoActual.querySelectorAll(".letra");
    const escrito = entrada.value;

    letras.forEach((letraElemento, indice) => {
        letraElemento.classList.remove("correcta", "incorrecta", "cursor");
        if (indice < escrito.length) {
            letraElemento.classList.add(escrito[indice] === palabraObjetivo[indice] ? "correcta" : "incorrecta");
        } else if (indice === escrito.length) {
            letraElemento.classList.add("cursor");
        }
    });
}

function iniciarCuentaRegresiva() {
    intervalo = setInterval(() => {
        tiempoRestante -= 1;
        marcadorTiempo.textContent = tiempoRestante;
        if (tiempoRestante <= 0) {
            finalizarPrueba();
        }
    }, 1000);
}

function finalizarPrueba() {
    if (pruebaTerminada) return;
    pruebaTerminada = true;

    clearInterval(intervalo);
    entrada.disabled = true;

    const segundosUsados = DURACION_SEGUNDOS - tiempoRestante;
    const minutos = segundosUsados > 0 ? segundosUsados / 60 : 1 / 60;
    const palabrasPorMinuto = Math.round(palabrasCorrectasTotales / minutos);

    valorWpm.textContent = palabrasPorMinuto;
    pantallaResultado.classList.add("visible");

    fetch("/guardar_resultado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ velocidad: palabrasPorMinuto }),
    });
}

function procesarPalabra() {
    const escrita = entrada.value.trim();
    const elementoActual = document.querySelector(`.palabra[data-indice="${indicePalabraEnLinea}"]`);
    const palabraObjetivo = palabrasLineaActual[indicePalabraEnLinea];

    if (elementoActual) {
        const esCorrecta = escrita === palabraObjetivo;
        elementoActual.classList.toggle("correcta", esCorrecta);
        elementoActual.classList.toggle("incorrecta", !esCorrecta);

        if (esCorrecta && !elementoActual.dataset.contada) {
            palabrasCorrectasTotales += 1;
            elementoActual.dataset.contada = "1";
            
            // --- LÓGICA DE RACHA ---
            rachaConsecutiva += 1;
            if (rachaConsecutiva === 4) {
                mostrarAnimacionRacha();
                rachaConsecutiva = 0; // Reinicia para contar las siguientes 4
            }
            // -----------------------
        } else if (!esCorrecta) {
            // Si comete un error, se rompe la racha actual
            rachaConsecutiva = 0;
        }
    }

    indicePalabraEnLinea += 1;
    entrada.value = "";

    // Si terminó la línea actual
    if (indicePalabraEnLinea >= palabrasLineaActual.length) {
        indiceLineaActual += 1;
        barraProgreso.style.width = `${(indiceLineaActual / lineasTexto.length) * 100}%`;

        if (indiceLineaActual >= lineasTexto.length) {
            finalizarPrueba();
            return;
        }
        dibujarLineaActual();
        return;
    }

    marcarPalabraActual();
}

entrada.addEventListener("input", (evento) => {
    if (pruebaTerminada) return;

    if (!pruebaIniciada) {
        pruebaIniciada = true;
        iniciarCuentaRegresiva();
    }

    if (evento.target.value.endsWith(" ")) {
        procesarPalabra();
        return;
    }

    actualizarLetrasPalabraActual();
});

entrada.addEventListener("keydown", (evento) => {
    if (pruebaTerminada) return;

    if (evento.key === "Enter" && entrada.value.trim().length > 0) {
        evento.preventDefault();
        procesarPalabra();
    }
});

// Función para disparar la animación visual en pantalla
function mostrarAnimacionRacha() {
    const indicador = document.getElementById("indicador-racha");
    if (!indicador) return;

    indicador.classList.add("mostrar");

    // Ocultar la animación automáticamente después de 1.5 segundos
    setTimeout(() => {
        indicador.classList.remove("mostrar");
    }, 1500);
}

dibujarLineaActual();
entrada.focus();