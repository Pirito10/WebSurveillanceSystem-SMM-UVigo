document.addEventListener('DOMContentLoaded', () => {
    // Botones
    const loginButton = document.getElementById('loginButton');
    const registerButton = document.getElementById('registerButton');

    // Formularios
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Mostramos solo el formulario de inicio de sesión al cargar
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';

    // Cambio de login a registro
    document.getElementById('switchToRegister').addEventListener('click', () => {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    // Cambio de registro a login
    document.getElementById('switchToLogin').addEventListener('click', () => {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    });

    // Manejo de inicio de sesión
    loginButton.addEventListener('click', async (e) => {
        // Prevenimos el comportamiento por defecto
        e.preventDefault();

        // Obtenemos los campos de entrada
        const usernameField = document.getElementById('loginUsername');
        const passwordField = document.getElementById('loginPassword');
        const username = usernameField.value.trim();
        const password = passwordField.value.trim();

        // Limpia mensajes de error previos
        clearErrorMessages();

        // Variable para controlar si lo introducido es correcto
        let hasError = false;

        // Validamos el campo usuario
        if (!username) {
            showErrorMessage(usernameField, 'Username is mandatory');
            hasError = true;
        }

        // Validamos el campo contraseña
        if (!password) {
            showErrorMessage(passwordField, 'Password is mandatory');
            hasError = true;
        }

        // Si hay errores no continuamos
        if (hasError) return;

        // Hacemos la solicitud a la base de datos
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                // Redirigimos a la pantalla de flujos
                window.location.href = '/streams';
            } else {
                const errorMessage = await response.text();
                showErrorMessage(loginButton, `Error: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Error:', error);
            showErrorMessage(loginButton, 'There was a problem while trying to log in');
        }
    });

    // Manejo de registro
    registerButton.addEventListener('click', async (e) => {
        // Prevenimos el comportamiento por defecto
        e.preventDefault();

        // Obtenemos los campos de entrada
        const usernameField = document.getElementById('registerUsername');
        const passwordField = document.getElementById('registerPassword');
        const confirmPasswordField = document.getElementById('confirmPassword');
        const username = usernameField.value.trim();
        const password = passwordField.value.trim();
        const confirmPassword = confirmPasswordField.value.trim();

        // Limpia mensajes de error previos
        clearErrorMessages();

        // Variable para controlar si lo introducido es correcto
        let hasError = false;

        // Validamos el campo usuario
        if (!username) {
            showErrorMessage(usernameField, 'Username is mandatory');
            hasError = true;
        }

        // Validamos el campo contraseña
        if (!password) {
            showErrorMessage(passwordField, 'Password is mandatory');
            hasError = true;
        }

        // Validamos el campo confirmar contraseña
        if (!confirmPassword) {
            showErrorMessage(confirmPasswordField, 'You must confirm the password');
            hasError = true;
        }

        if (password !== confirmPassword) {
            showErrorMessage(confirmPasswordField, 'Passwords do not match');
            hasError = true;
        }

        // Si hay errores no continuamos
        if (hasError) return;

        // Hacemos la solicitud a la base de datos
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                // Redirigimos a la pantalla de flujos
                window.location.href = '/streams';
            } else {
                const errorMessage = await response.text();
                showErrorMessage(loginButton, `Error: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Error:', error);
            showErrorMessage(loginButton, 'There was a problem while trying to sign up');
        }
    });
});

// Función para mostrar un mensaje de error bajo un elemento
function showErrorMessage(inputElement, message) {
    // Verificamos si ya existe un mensaje de error debajo del elemento
    if (inputElement.nextSibling && inputElement.nextSibling.className === 'error-message') {
        // Actualizamos el mensaje si ya existe
        inputElement.nextSibling.textContent = message;
        return;
    }

    // Creamos un nuevo mensaje de error si no existe
    const error = document.createElement('small');
    error.className = 'error-message';
    error.textContent = message;
    // Colocamos el mensaje después del elemento
    inputElement.parentNode.insertBefore(error, inputElement.nextSibling);
}

// Función para limpiar todos los mensajes de error
function clearErrorMessages() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach((message) => message.remove());
}