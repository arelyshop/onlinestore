document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    let allProducts = [];
    let currentProductId = null;

    // --- ELEMENT SELECTORS ---
    const productForm = document.getElementById('product-form');
    const formTitle = document.getElementById('form-title');
    const productList = document.getElementById('product-list');
    const searchInput = document.getElementById('search-product-input');
    const newProductBtn = document.getElementById('new-product-btn');
    const saveBtn = document.getElementById('save-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const statusMessage = document.getElementById('status-message');
    const photoUrlInputs = productForm.querySelectorAll('input[type="url"]');
    
    // --- FUNCTIONS ---

    /**
     * Fetch all products from the backend and render the list
     */
    const fetchAndRenderProducts = async () => {
        try {
            productList.innerHTML = '<p class="text-gray-500">Cargando productos...</p>';
            const response = await fetch('/.netlify/functions/get-products');
            if (!response.ok) throw new Error('Failed to fetch products');
            
            allProducts = await response.json();
            renderProductList(allProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
            productList.innerHTML = '<p class="text-red-500">Error al cargar productos.</p>';
        }
    };

    /**
     * Render a list of products in the sidebar
     * @param {Array} products - The array of products to render
     */
    const renderProductList = (products) => {
        if (products.length === 0) {
            productList.innerHTML = '<p class="text-gray-500">No se encontraron productos.</p>';
            return;
        }
        productList.innerHTML = products.map(product => `
            <div class="flex items-center justify-between p-3 mb-2 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors" data-id="${product.id}">
                <div class="flex-grow">
                    <p class="font-semibold text-gray-800">${product.name}</p>
                    <p class="text-sm text-gray-500">SKU: ${product.sku || 'N/A'}</p>
                </div>
                <div class="text-sm text-gray-600">Stock: ${product.stock}</div>
            </div>
        `).join('');
    };
    
    /**
     * Populate the form with data from a selected product
     * @param {number} productId - The ID of the product to edit
     */
    const populateFormForEdit = (productId) => {
        const product = allProducts.find(p => p.id === productId);
        if (!product) return;

        currentProductId = productId;
        
        // Populate all form fields
        for (const key in product) {
            if (productForm.elements[key]) {
                productForm.elements[key].value = product[key] || '';
            }
        }

        formTitle.textContent = 'Editar Producto';
        saveBtn.textContent = 'Guardar Cambios';
        deleteBtn.classList.remove('hidden');
    };

    /**
     * Reset the form to its "Add New Product" state
     */
    const resetForm = () => {
        productForm.reset();
        currentProductId = null;
        formTitle.textContent = 'Agregar Nuevo Producto';
        saveBtn.textContent = 'Guardar Producto';
        deleteBtn.classList.add('hidden');
        statusMessage.textContent = '';
        statusMessage.className = 'mt-4 text-center font-semibold';
    };

    /**
     * Handle form submission for both creating and updating products
     */
    const handleFormSubmit = async (event) => {
        event.preventDefault();
        saveBtn.disabled = true;
        saveBtn.textContent = 'Guardando...';
        statusMessage.textContent = '';

        const formData = new FormData(productForm);
        const productData = {};
        formData.forEach((value, key) => {
             const inputElement = productForm.elements[key];
            if (inputElement && inputElement.type === 'number') {
                productData[key] = value === '' ? null : Number(value);
            } else {
                productData[key] = value;
            }
        });

        const isUpdating = !!currentProductId;
        const url = isUpdating ? '/.netlify/functions/update-product' : '/.netlify/functions/add-product';
        const method = isUpdating ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                body: JSON.stringify(productData),
                headers: { 'Content-Type': 'application/json' },
            });
            
            if (!response.ok) {
                 const errorData = await response.json();
                throw new Error(errorData.error || 'Server error');
            }

            statusMessage.textContent = `¡Producto ${isUpdating ? 'actualizado' : 'agregado'} con éxito!`;
            statusMessage.className = 'mt-4 text-center font-semibold text-green-600';

            await fetchAndRenderProducts(); // Refresh the list
            resetForm();

        } catch (error) {
            console.error('Error saving product:', error);
            statusMessage.textContent = `Error: ${error.message}`;
            statusMessage.className = 'mt-4 text-center font-semibold text-red-600';
        } finally {
            saveBtn.disabled = false;
        }
    };

    /**
     * Handle product deletion
     */
    const handleDelete = async () => {
        if (!currentProductId || !confirm('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.')) {
            return;
        }
        
        deleteBtn.disabled = true;
        deleteBtn.textContent = 'Eliminando...';

        try {
             const response = await fetch('/.netlify/functions/delete-product', {
                method: 'DELETE',
                body: JSON.stringify({ id: currentProductId }),
                headers: { 'Content-Type': 'application/json' },
            });

             if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server error');
            }
            const result = await response.json();
            statusMessage.textContent = result.message;
            statusMessage.className = 'mt-4 text-center font-semibold text-green-600';
            
            await fetchAndRenderProducts();
            resetForm();

        } catch(error) {
             console.error('Error deleting product:', error);
            statusMessage.textContent = `Error: ${error.message}`;
            statusMessage.className = 'mt-4 text-center font-semibold text-red-600';
        } finally {
            deleteBtn.disabled = false;
            deleteBtn.textContent = 'Eliminar Producto';
        }
    };

    /**
     * Filter the product list based on search input
     */
    const handleSearch = (event) => {
        const searchTerm = event.target.value.toLowerCase();
        const filteredProducts = allProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm) || 
            (p.sku && p.sku.toLowerCase().includes(searchTerm))
        );
        renderProductList(filteredProducts);
    };

    /**
     * Converts Google Drive URLs to direct image links
     */
    function convertGoogleDriveUrl(url) {
        const regex = /\/file\/d\/([a-zA-Z0-9_-]+)/;
        const match = url.match(regex);
        if (match && match[1]) {
            return `https://lh3.googleusercontent.com/d/${match[1]}=w1000?authuser=0`;
        }
        return url;
    }
    
    // --- EVENT LISTENERS ---
    productForm.addEventListener('submit', handleFormSubmit);
    newProductBtn.addEventListener('click', resetForm);
    deleteBtn.addEventListener('click', handleDelete);
    searchInput.addEventListener('input', handleSearch);

    productList.addEventListener('click', (event) => {
        const productElement = event.target.closest('[data-id]');
        if (productElement) {
            const productId = parseInt(productElement.dataset.id, 10);
            populateFormForEdit(productId);
        }
    });
    
    photoUrlInputs.forEach(input => {
        input.addEventListener('input', (event) => {
            const originalUrl = event.target.value;
            const convertedUrl = convertGoogleDriveUrl(originalUrl);
            if (originalUrl !== convertedUrl) {
                event.target.value = convertedUrl;
            }
        });
    });

    // --- INITIALIZATION ---
    fetchAndRenderProducts();
});

