document.addEventListener('DOMContentLoaded', () => {
    // Botones
    const loginButton = document.getElementById('loginButton');
    const registerButton = document.getElementById('registerButton');

    // Formularios
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Mostrar solo el formulario de inicio de sesión al cargar
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';

    // Alternar entre login y registro
    document.getElementById('switchToRegister').addEventListener('click', () => {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    document.getElementById('switchToLogin').addEventListener('click', () => {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    });

    // Manejar inicio de sesión
    loginButton.addEventListener('click', async (e) => {
        e.preventDefault();

        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        if (!username || !password) {
            alert('Por favor, completa todos los campos.');
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                // Redirigir a la página de flujos
                window.location.href = '/streams';
            } else {
                const errorMessage = await response.text();
                alert(`Error al iniciar sesión: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Hubo un problema al iniciar sesión.');
        }
    });

    // Manejar registro
    registerButton.addEventListener('click', async (e) => {
        e.preventDefault();

        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();

        if (!username || !password || !confirmPassword) {
            alert('Por favor, completa todos los campos.');
            return;
        }

        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden.');
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                alert('Registro exitoso. Ahora puedes iniciar sesión.');
                // Cambiar al formulario de login
                loginForm.style.display = 'block';
                registerForm.style.display = 'none';
            } else {
                const errorMessage = await response.text();
                alert(`Error al registrarse: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Hubo un problema al registrarse.');
        }
    });
});