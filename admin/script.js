document.addEventListener('DOMContentLoaded', () => {

    const addProductForm = document.getElementById('add-product-form');
    const statusMessage = document.getElementById('status-message');
    // Selecciona todos los inputs de tipo URL dentro del formulario
    const photoUrlInputs = addProductForm.querySelectorAll('input[type="url"]');

    /**
     * Convierte una URL de Google Drive compartida a un enlace directo de imagen.
     * @param {string} url - La URL de Google Drive a convertir.
     * @returns {string} La URL convertida o la original si no es un enlace de Drive válido.
     */
    function convertGoogleDriveUrl(url) {
        // Expresión regular para extraer el ID del archivo de la URL de Google Drive.
        const regex = /\/file\/d\/([a-zA-Z0-9_-]+)/;
        const match = url.match(regex);

        if (match && match[1]) {
            const fileId = match[1];
            // Construye la nueva URL con el formato de enlace directo.
            return `https://lh3.googleusercontent.com/d/${fileId}=w1000?authuser=0`;
        }
        
        // Si no es una URL de Google Drive, la devuelve sin cambios.
        return url;
    }

    // Agrega un listener a cada campo de URL de foto.
    photoUrlInputs.forEach(input => {
        // Se usa el evento 'input' para que la conversión sea instantánea mientras se escribe o pega.
        input.addEventListener('input', (event) => {
            const originalUrl = event.target.value;
            const convertedUrl = convertGoogleDriveUrl(originalUrl);
            
            // Si la URL fue convertida, actualiza el valor del campo.
            if (originalUrl !== convertedUrl) {
                event.target.value = convertedUrl;
            }
        });
    });

    // Lógica para enviar el formulario.
    addProductForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Evita que la página se recargue
        
        const submitButton = addProductForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Agregando...';
        statusMessage.textContent = '';
        statusMessage.className = 'mt-4 text-center';

        const formData = new FormData(addProductForm);
        const product = {};
        formData.forEach((value, key) => {
             // Si un campo numérico está vacío, se envía como null, de lo contrario como número
            const inputElement = addProductForm.elements[key];
            if (inputElement && inputElement.type === 'number') {
                product[key] = value === '' ? null : Number(value);
            } else {
                product[key] = value;
            }
        });

        // La URL de la función serverless en Netlify.
        const functionUrl = '/.netlify/functions/add-product';

        try {
            const response = await fetch(functionUrl, {
                method: 'POST',
                body: JSON.stringify(product),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ocurrió un error en el servidor.');
            }

            const result = await response.json();
            statusMessage.textContent = `¡Producto "${result.name}" agregado con éxito!`;
            statusMessage.className = 'mt-4 text-center text-green-600 font-semibold';
            addProductForm.reset(); // Limpia el formulario después del éxito

        } catch (error) {
            console.error('Error al agregar el producto:', error);
            statusMessage.textContent = `Error: ${error.message}`;
            statusMessage.className = 'mt-4 text-center text-red-600 font-semibold';
        } finally {
            // Se ejecuta siempre, haya habido éxito o error
            submitButton.disabled = false;
            submitButton.textContent = 'Agregar Producto';
        }
    });
});


