let registrar = document.getElementById("registrar");
let inicSesion = document.getElementById("inicSesion");
let nameInput = document.getElementById("nameInput");
let title = document.getElementById("title");

enviarDatos = 0;

var regexNombre = /^[A-ZÁÉÍÓÚÑ'][a-záéíóúñ']{1,}([ ][A-ZÁÉÍÓÚÑ'][a-záéíóúñ']{1,}){0,}$/;
var regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/*
VALIDACION DE CONTRASEÑA:
    Mínimo 8 caracteres
    Máximo 15
    Al menos una letra mayúscula
    Al menos una letra minúscula
    Al menos un dígito
    No espacios en blanco
    Al menos 1 carácter especial (incluye _)
*/
var regexContra = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&_])([A-Za-z\d$@$!%*?&_]){8,15}$/;

inicSesion.onclick = function() {
    nameInput.style.maxHeight = "0";
    title.innerHTML = "Inicia Sesión";
    registrar.classList.add("disable");
    inicSesion.classList.remove("disable");
}

registrar.onclick = function() {
    nameInput.style.maxHeight = "60px";
    title.innerHTML = "¡Regístrate!";
    registrar.classList.remove("disable");
    inicSesion.classList.add("disable");
}

console.log("Hola mundo");

var nombre = document.getElementById("nombre");
var circleCrossNombre = document.getElementsByClassName("circleCrossNombre")[0];
var circleCheckNombre = document.getElementsByClassName("circleCheckNombre")[0];

var correo = document.getElementById("correo");
var circleCrossCorreo = document.getElementsByClassName("circleCrossCorreo")[0];
var circleCheckCorreo = document.getElementsByClassName("circleCheckCorreo")[0];

var contra = document.getElementById("contra");
var circleCrossContra = document.getElementsByClassName("circleCrossContra")[0];
var circleCheckContra = document.getElementsByClassName("circleCheckContra")[0];

nombre.addEventListener("blur", () => {
    if (!regexNombre.test(nombre.value)) {
        enviarDatos++;
        nombre.classList.add("error");
        nombre.classList.remove("correcto");
        circleCrossNombre.classList.remove("ocultar");
        circleCheckNombre.classList.add("ocultar");
    } else {
        nombre.classList.remove("error");
        nombre.classList.add("correcto");
        circleCrossNombre.classList.add("ocultar");
        circleCheckNombre.classList.remove("ocultar");
    }
});

correo.addEventListener("blur", () => {
    if (!regexCorreo.test(correo.value)) {
        enviarDatos++;
        correo.classList.add("error");
        correo.classList.remove("correcto");
        circleCrossCorreo.classList.remove("ocultar");
        circleCheckCorreo.classList.add("ocultar");
    } else {
        correo.classList.remove("error");
        correo.classList.add("correcto");
        circleCrossCorreo.classList.add("ocultar");
        circleCheckCorreo.classList.remove("ocultar");
    }
});

contra.addEventListener("blur", () => {
    if (!regexContra.test(contra.value)) {
        enviarDatos++;
        contra.classList.add("error");
        contra.classList.remove("correcto");
        circleCrossContra.classList.remove("ocultar");
        circleCheckContra.classList.add("ocultar");
        alert("La contraseña ingresada no es correcta sdjdjdj");
    } else {
        contra.classList.remove("error");
        contra.classList.add("correcto");
        circleCrossContra.classList.add("ocultar");
        circleCheckContra.classList.remove("ocultar");
    }
});

var index = document.getElementById("index");
index.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log(enviarDatos);
    if (enviarDatos > 0) {
        // Aquí puedes manejar el caso en que los datos no son válidos
        // Por ejemplo, mostrar un mensaje de error al usuario
    } else {
        index.submit();
    }
});