
var pausado = false;
var generacion = 1;
var contadorId = 0;
var temporizador;

// Iniciar el ecosistema
document.addEventListener("DOMContentLoaded", iniciarEcosistema);

function iniciarEcosistema() {

    var ecosistema = document.getElementById("ecosistema");

    ecosistema.addEventListener("dragover", permitirArrastre);
    ecosistema.addEventListener("drop", soltarOrganismo);

    anadirEspecie("herbivoro");
    anadirEspecie("herbivoro");
    anadirEspecie("carnivoro");
    anadirEspecie("planta");
    anadirEspecie("planta");
    anadirEspecie("planta");
    anadirEspecie("omnivoro");

    temporizador = setInterval(simularCicloVida, 2000);
}

// Añadir especies
function anadirEspecie(tipo) {

    if (pausado) {
        return;
    }

    var x = Math.floor(Math.random() * 750);
    var y = Math.floor(Math.random() * 350);

    crearOrganismo(tipo, x, y);
}

// Crear organismos
function crearOrganismo(tipo, x, y) {

    var ecosistema = document.getElementById("ecosistema");

    var elemento = document.createElement("div");

    elemento.className = "organismo";
    elemento.style.left = x + "px";
    elemento.style.top = y + "px";

    contadorId++;

    elemento.dataset.id = contadorId;
    elemento.dataset.tipo = tipo;
    elemento.dataset.edad = 0;
    elemento.dataset.velocidad = 2;

    elemento.draggable = true;

    if (tipo === "herbivoro") {
        elemento.textContent = "🐰";
        elemento.dataset.energia = 80;

    } else if (tipo === "carnivoro") {
        elemento.textContent = "🦁";
        elemento.dataset.energia = 100;

    } else if (tipo === "planta") {
        elemento.textContent = "🌱";
        elemento.dataset.energia = 40;
        elemento.dataset.tamano = 1;
        elemento.dataset.rebrota = true;

    } else if (tipo === "omnivoro") {
        elemento.textContent = "🐻";
        elemento.dataset.energia = 90;
    }

    // Eventos
    elemento.addEventListener("click", mostrarInfoOrganismo);
    elemento.addEventListener("dblclick", eliminarOrganismo);
    elemento.addEventListener("mouseover", mostrarInfoOrganismo);
    elemento.addEventListener("mouseout", ocultarInfoOrganismo);
    elemento.addEventListener("dragstart", iniciarArrastre);
    elemento.addEventListener("dragend", terminarArrastre);

    ecosistema.appendChild(elemento);

    actualizarEstadisticas();

    return elemento;
}

// Mostrar información del organismo
function mostrarInfoOrganismo(event) {

    var elemento = event.currentTarget;

    var mensaje = "Especie: " + elemento.dataset.tipo;
    mensaje += " | ID: " + elemento.dataset.id;
    mensaje += " | Energía: " + elemento.dataset.energia;
    mensaje += " | Edad: " + elemento.dataset.edad;

    document.getElementById("informacion").textContent = mensaje;
}

// Ocultar información
function ocultarInfoOrganismo() {

    document.getElementById("informacion").textContent =
        "Selecciona un organismo para ver su información.";
}

// Eliminar organismo
function eliminarOrganismo(event) {

    if (pausado) {
        return;
    }

    var elemento = event.currentTarget;
    var tipo = elemento.dataset.tipo;

    document.getElementById("ecosistema").removeChild(elemento);

    registrarEvento("Se ha eliminado un " + tipo);

    actualizarEstadisticas();
}

// Iniciar arrastre
function iniciarArrastre(event) {

    if (pausado) {
        event.preventDefault();
        return;
    }

    event.dataTransfer.setData("text", event.currentTarget.dataset.id);
}

// Permitir soltar dentro del ecosistema
function permitirArrastre(event) {

    if (!pausado) {
        event.preventDefault();
    }
}

// Soltar organismo
function soltarOrganismo(event) {

    if (pausado) {
        return;
    }

    event.preventDefault();

    var id = event.dataTransfer.getData("text");
    var organismos = document.getElementsByClassName("organismo");
    var ecosistema = document.getElementById("ecosistema");

    var rectangulo = ecosistema.getBoundingClientRect();

    var x = event.clientX - rectangulo.left;
    var y = event.clientY - rectangulo.top;

    if (x < 0) {
        x = 0;
    }

    if (x > 750) {
        x = 750;
    }

    if (y < 0) {
        y = 0;
    }

    if (y > 350) {
        y = 350;
    }

    for (var i = 0; i < organismos.length; i++) {

        if (organismos[i].dataset.id === id) {

            organismos[i].style.left = x + "px";
            organismos[i].style.top = y + "px";

            registrarEvento("Se ha movido un " +
                            organismos[i].dataset.tipo);

            break;
        }
    }
}

// Finalizar arrastre
function terminarArrastre(event) {

    actualizarEstadisticas();
}

// Movimiento automático
function moverOrganismo(elemento) {

    var x = parseInt(elemento.style.left);
    var y = parseInt(elemento.style.top);

    x = x + Math.floor(Math.random() * 61) - 30;
    y = y + Math.floor(Math.random() * 61) - 30;

    if (x < 0) {
        x = 0;
    }

    if (x > 750) {
        x = 750;
    }

    if (y < 0) {
        y = 0;
    }

    if (y > 350) {
        y = 350;
    }

    elemento.style.left = x + "px";
    elemento.style.top = y + "px";
}

// Comprobar cercanía
function estanCerca(primero, segundo) {

    var x1 = parseInt(primero.style.left);
    var y1 = parseInt(primero.style.top);

    var x2 = parseInt(segundo.style.left);
    var y2 = parseInt(segundo.style.top);

    if (Math.abs(x1 - x2) < 50 &&
        Math.abs(y1 - y2) < 50) {

        return true;
    }

    return false;
}

// Alimentación de organismos
function interaccionOrganismos() {

    var organismos = document.getElementsByClassName("organismo");

    for (var i = 0; i < organismos.length; i++) {

        var primero = organismos[i];

        for (var j = 0; j < organismos.length; j++) {

            if (i !== j) {

                var segundo = organismos[j];

                if (estanCerca(primero, segundo)) {

                    var tipo1 = primero.dataset.tipo;
                    var tipo2 = segundo.dataset.tipo;

                    var puedeComer = false;

                    if (tipo1 === "herbivoro" &&
                        tipo2 === "planta") {
                        puedeComer = true;
                    }

                    if (tipo1 === "carnivoro" &&
                        tipo2 === "herbivoro") {
                        puedeComer = true;
                    }

                    if (tipo1 === "omnivoro" &&
                       (tipo2 === "planta" ||
                        tipo2 === "herbivoro")) {
                        puedeComer = true;
                    }

                    if (puedeComer) {

                        var energia = parseInt(primero.dataset.energia);

                        energia = energia + 30;

                        if (energia > 100) {
                            energia = 100;
                        }

                        primero.dataset.energia = energia;

                        registrarEvento(tipo1 +
                                        " se ha alimentado de " + tipo2);

                        segundo.remove();

                        actualizarEstadisticas();

                        return;
                    }
                }
            }
        }
    }
}

// Reproducción
function reproducirEspecie() {

    var organismos = document.getElementsByClassName("organismo");

    for (var i = 0; i < organismos.length; i++) {

        for (var j = i + 1; j < organismos.length; j++) {

            var primero = organismos[i];
            var segundo = organismos[j];

            if (primero.dataset.tipo === segundo.dataset.tipo &&
                primero.dataset.tipo !== "planta" &&
                estanCerca(primero, segundo)) {

                var probabilidad = Math.random();
                var limite = 0.15;

                if (primero.dataset.tipo === "herbivoro") {
                    limite = 0.40;
                }

                if (probabilidad < limite) {

                    var tipo = primero.dataset.tipo;
                    var x = parseInt(primero.style.left);
                    var y = parseInt(primero.style.top);

                    crearOrganismo(tipo, x, y);

                    generacion++;

                    registrarEvento("Ha nacido un nuevo " + tipo);

                    actualizarEstadisticas();

                    return;
                }
            }
        }
    }
}

// Ciclo de vida
function simularCicloVida() {

    if (pausado) {
        return;
    }

    var organismos = document.getElementsByClassName("organismo");

    for (var i = organismos.length - 1; i >= 0; i--) {

        var elemento = organismos[i];

        var edad = parseInt(elemento.dataset.edad);
        var energia = parseInt(elemento.dataset.energia);

        edad++;

        if (elemento.dataset.tipo !== "planta") {

            energia = energia - 5;

            moverOrganismo(elemento);

        } else {

            energia = energia + 2;

            if (energia > 100) {
                energia = 100;
            }
        }

        elemento.dataset.edad = edad;
        elemento.dataset.energia = energia;

        if (edad >= 30 || energia <= 0) {

            registrarEvento("Ha muerto un " +
                            elemento.dataset.tipo);

            elemento.remove();
        }
    }

    // Alimentación
    interaccionOrganismos();

    // Reproducción
    if (document.getElementsByClassName("organismo").length < 60) {
        reproducirEspecie();
    }

    // Crecimiento de plantas
    if (Math.random() < 0.50) {

        anadirEspecie("planta");

        registrarEvento("Ha crecido una nueva planta");
    }

    actualizarEstadisticas();
}

// Estadísticas
function actualizarEstadisticas() {

    var organismos = document.getElementsByClassName("organismo");

    var herbivoros = 0;
    var carnivoros = 0;
    var plantas = 0;
    var omnivoros = 0;

    for (var i = 0; i < organismos.length; i++) {

        var tipo = organismos[i].dataset.tipo;

        if (tipo === "herbivoro") {
            herbivoros++;

        } else if (tipo === "carnivoro") {
            carnivoros++;

        } else if (tipo === "planta") {
            plantas++;

        } else if (tipo === "omnivoro") {
            omnivoros++;
        }
    }

    document.getElementById("count-herbivoro").textContent = herbivoros;
    document.getElementById("count-carnivoro").textContent = carnivoros;
    document.getElementById("count-planta").textContent = plantas;
    document.getElementById("count-omnivoro").textContent = omnivoros;
    document.getElementById("generacion").textContent = generacion;

    var total = herbivoros + carnivoros + plantas + omnivoros;

    var estado = "Equilibrado";

    if (total < 3) {

        estado = "Colapso";

    } else if (herbivoros === 0 ||
               carnivoros === 0 ||
               plantas === 0 ||
               omnivoros === 0) {

        estado = "Extinción";

    } else {

        // Comprobar si alguna especie domina
        var media = total / 4;

        if (herbivoros > media * 1.5 ||
            carnivoros > media * 1.5 ||
            plantas > media * 1.5 ||
            omnivoros > media * 1.5) {

            estado = "Sobrepoblación";
        }
    }

    document.getElementById("estado").textContent =
        "Estado: " + estado;
}

// Registro de eventos
function registrarEvento(mensaje) {

    var lista = document.getElementById("eventos-lista");

    var nuevo = document.createElement("p");

    var fecha = new Date();

    nuevo.textContent = fecha.toLocaleTimeString() +
                        " - " + mensaje;

    lista.insertBefore(nuevo, lista.firstChild);

    // Conservar solo 10 eventos
    if (lista.children.length > 10) {

        lista.removeChild(lista.lastChild);
    }
}

// Pausar y reanudar
function pausarSimulacion() {

    if (pausado === false) {

        pausado = true;

        registrarEvento("Simulación pausada");

    } else {

        pausado = false;

        registrarEvento("Simulación reanudada");
    }
}
