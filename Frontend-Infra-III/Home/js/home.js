document.addEventListener('DOMContentLoaded', cargarProductos);
let clientId = localStorage.getItem("client");

async function cargarProductos(){
    let response = await fetch('/api/client/getProducts',{
        method: 'GET',
        headers:{
            'Content-Type': 'application/json'
        }, 
    }); 
    let productos = await response.json()
    if(response.ok) {
        carrusel(productos);
        renderizarTarjetas(productos);

    }
 }
const cartIcon = document.getElementById("cartIcon")
cartIcon.addEventListener('click',() => {
    window.location.href = '/Home/ShoppingCart.html';
})
 function renderizarTarjetas(productos) {
    const container = document.getElementById('productos-container');
    container.innerHTML = '';
    productos.forEach(producto => {
        const col = document.createElement('div');
        col.className = 'col-12 col-md-4 mb-4 d-flex'; // d-flex en la columna
        col.innerHTML = `
            <div class="card h-100 w-100 d-flex flex-column">
                <a href="shop-single.html">
                    <img src=${producto.imageUrl} class="card-img-top" alt="${producto.name}">
                </a>
                <div class="card-body d-flex flex-column">
                    <ul class="list-unstyled d-flex justify-content-between">
                        <a href="shop-single.html" class="h2 text-decoration-none text-dark">${producto.name}</a>
                        <ul class="list-unstyled d-flex justify-content-center">
                            <li class="h2 align-self-center text-dark">$${producto.price}</li>
                        </ul>   
                    </ul>

                    <!-- Campo de cantidad -->
                    <div class="form-group my-2">
                        <label for="cantidad-${producto.id}" class="form-label">Cantidad:</label>
                        <input type="number" id="cantidad-${producto.id}" class="form-control" value="1" min="1">
                    </div>

                    <!-- Botón de agregar al carrito -->
                    <button class="btn btn-primary mt-2 agregar-producto" data-id="${producto.id}" data-name="${producto.name}">
                        Agregar al carrito
                    </button>

                    <p class="card-text mt-auto">${producto.description}</p>
                </div>
            </div>
        `;

        container.appendChild(col);
    });
}
function carrusel(productos) {
    const carouselInner = document.querySelector('#template-mo-zay-hero-carousel .carousel-inner');
    const indicadores = document.querySelector('#template-mo-zay-hero-carousel .carousel-indicators');

    carouselInner.innerHTML = '';
    indicadores.innerHTML = '';

    const seleccionados = productos.slice(0, 3);

    seleccionados.forEach((producto, index) => {
        // Indicadores
        const li = document.createElement('li');
        li.setAttribute('data-bs-target', '#template-mo-zay-hero-carousel');
        li.setAttribute('data-bs-slide-to', index);
        if (index === 0) li.classList.add('active');
        indicadores.appendChild(li);

        // Item del carrusel
        const item = document.createElement('div');
        item.className = `carousel-item${index === 0 ? ' active' : ''}`;

        item.innerHTML = `
            <div class="container">
                <div class="row p-5">
                    <div class="mx-auto col-md-8 col-lg-6 order-lg-last">
                        <img class="img-fluid" src="${producto.imageUrl}" alt="${producto.name}">
                    </div>
                    <div class="col-lg-6 mb-0 d-flex align-items-center">
                        <div class="text-align-left align-self-center">
                            <h1 class="h1 text-success"><b>${producto.name}</b></h1>
                            <p>${producto.description}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        carouselInner.appendChild(item);
    });
}
document.addEventListener('click', function (e) {
    if (e.target && e.target.classList.contains('agregar-producto')) {
        const productId = e.target.dataset.id;
        const inputCantidad = document.getElementById(`cantidad-${productId}`);
        const quantity = parseInt(inputCantidad.value, 10);
        const productName = e.target.dataset.name;
        if (!isNaN(quantity) && quantity > 0) {
            console.log(`Producto ID: ${productId}, Nombre: ${productName}, Cantidad: ${quantity}`);
            addProduct(productId, productName, quantity);
        } else {
            alert("Por favor ingrese una cantidad válida.");
        }
    }
});


async function addProduct(productId,itemName,quantity) {
    let response = await fetch(`/api/shoppingCart/addItem/client/${clientId}/product/${productId}/quantity/${quantity}`,{
        method: 'POST',
        headers:{
            'Content-Type': 'application/json'
        }, 
    }); 
    if(response.ok){
        alert(`${itemName} ha sido agregado`)
    }
}