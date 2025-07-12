let clientId = localStorage.getItem("client");
document.addEventListener('DOMContentLoaded', loadCart);
let carrito = [];
async function loadCart(){
    
    let response = await fetch(`/api/shoppingCart/getItems/clientId/${clientId}`,{
        method: 'GET',
        headers:{
            'Content-Type': 'application/json'
        }, 
    }); 
    carrito = await response.json()
    console.log(carrito)
    if(response.ok) {
        showCart();
    }
}
 function showCart() {
    const container = document.getElementById('carrito-container');
    const totalSpan = document.getElementById('total-carrito');
    container.innerHTML = '';
    let total = 0;

    if (carrito.length === 0) {
        container.innerHTML = '<p>Tu carrito está vacío.</p>';
        totalSpan.textContent = '0';
        return;
    }

    carrito.forEach((item, index) => {
        const product = item.product;
        const subtotal = product.price * item.quantity;
        total += subtotal;

        const row = document.createElement('div');
        row.className = 'row align-items-center mb-3';
        row.innerHTML = `
            <div class="col-md-2">
                <img src="${product.imageUrl}" class="card-img-top" alt="${product.name}">
                </a>
            </div>
            <div class="col-md-3"><strong>${product.name}</strong><br><small>${product.description}</small></div>
            <div class="col-md-2">$${product.price.toFixed(2)}</div>
            <div class="col-md-2">
                <span class="cantidad-text">Cantidad: ${item.quantity}</span>
            </div>
            <div class="col-md-2">$${subtotal.toFixed(2)}</div>
            <div class="col-md-1">
                <button class="btn btn-danger btn-sm eliminar" data-index="${index}" data-name="${item.name}" data-id="${item.id}">X</button>
            </div>
        `;
        container.appendChild(row);
    });

    totalSpan.textContent = total.toFixed(2);

    // Mover los eventos AQUÍ para que se apliquen después de renderizar el HTML
    document.querySelectorAll('.cantidad-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const index = e.target.dataset.index;
            const nuevaCantidad = parseInt(e.target.value);
            if (nuevaCantidad > 0) {
                carrito[index].quantity = nuevaCantidad;
                localStorage.setItem('carrito', JSON.stringify(carrito));
                showCart(); // Refrescar vista del carrito
            }
        });
    });

    document.querySelectorAll('.eliminar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            const itemId = e.target.dataset.id; // ID del ítem o del producto
            console.log("Eliminar item con ID:", itemId);
            eliminateItem(itemId)
            carrito.splice(index, 1);
            localStorage.setItem('carrito', JSON.stringify(carrito));
            showCart();
        });
    });

}
async function eliminateItem(itemId){
    let response = await fetch(`/api/shoppingCart/deleteItem/item/${itemId}/client/${clientId}`,{
        method: 'DELETE',
        headers:{
            'Content-Type': 'application/json'
        }, 
    }); 
    

}
function createCheckoutModal() {
    if (document.getElementById('checkoutModal')) return;

    const modalHtml = `
    <div class="modal fade" id="checkoutModal" tabindex="-1" aria-labelledby="checkoutModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <form id="checkoutForm" class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="checkoutModalLabel">Finalizar Compra</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="address" class="form-label">Dirección de envío</label>
              <input type="text" class="form-control" id="address" name="address" required>
            </div>
            <div class="mb-3">
              <label for="address" class="form-label">Teléfono</label>
              <input type="text" class="form-control" id="phone" name="phone" required>
            </div>
            <div class="mb-3">
              <label for="paymentMethod" class="form-label">Método de pago</label>
              <select class="form-select" id="paymentMethod" name="paymentMethod" required>
                <option value="">Selecciona...</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
              </select>
            </div>
            <div class="mb-3">
              <label for="notes" class="form-label">Notas adicionales</label>
              <textarea class="form-control" id="notes" name="notes" rows="2"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-success"  >Confirmar compra</button>
          </div>
        </form>
      </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);


    document.getElementById('checkoutForm').addEventListener('submit', submitCheckoutForm)
}


function finalizarCompra() {
    if(carrito.length==0){
        alert("Aun no has comparado nada")
    }
    else{
        createCheckoutModal();
        const modal = new bootstrap.Modal(document.getElementById('checkoutModal'));
        modal.show();
    }
}

//Envia el formulario al back
function submitCheckoutForm(event) {
    event.preventDefault();
    const clientId = localStorage.getItem("client");
    const address = document.getElementById('address').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const phone = document.getElementById('phone').value
    const notes = document.getElementById('notes').value;
    let PurchaseRequest ={
            address: address,
            phone:phone,
            paymentMethod: paymentMethod,
            notes: notes
        }

    if (!address || !paymentMethod) {
        alert("Por favor, completa todos los campos obligatorios.");
        return;
    }
    postPurchase(clientId,PurchaseRequest)
}

async function postPurchase(clientId,PurchaseRequest) {
    const submitBtn = document.querySelector('#checkoutForm button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    const response = await fetch(`/api/shoppingCart/checkout/client/${clientId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
             body: JSON.stringify(PurchaseRequest)
        });
    let data = await response.json()
    if(response.ok) {
        carrito = [];
        showCart();
        bootstrap.Modal.getInstance(document.getElementById('checkoutModal')).hide();
        alert(data.message)
     } else {
        alert(data.message);
    }
}

