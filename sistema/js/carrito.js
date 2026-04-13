import { fetchWithAuth, /*obtenerUsuarioDesdeToken*/ protectRoute } from './authGuard.js';

let carrito = [];

document.addEventListener("DOMContentLoaded", () => {
  const carritoBtn = document.querySelector(".carrito");
  const carritoContainer = document.getElementById("carrito-container");

  if (carritoBtn && carritoContainer) {
    carritoBtn.addEventListener("click", () => {
      carritoContainer.style.display =
        carritoContainer.style.display === "block" ? "none" : "block";
    });
  }

  //Cargar carrito desde localStorage al iniciar
  cargarCarritoDesdeSessionStorage();

  //Botón "Agregar al carrito" desde modal
  const agregarCarritoBtn = document.getElementById("agregarCarritoBtn");

  if (agregarCarritoBtn) {
    agregarCarritoBtn.addEventListener("click", () => {
      const modal = document.getElementById("modalProducto");
      const idReal = parseInt(modal.dataset.idActual);
      const nombre = document.getElementById("modalNombre").textContent;
      const precio = parseFloat(document.getElementById("modalPrecio").textContent);
      const cantidad = parseInt(document.getElementById("modalCantidad").value);
      const imagen = document.getElementById("modalImagen").src;

      const producto = {
        id: idReal,
        nombre,
        precio,
        cantidad,
        imagen
      };

      agregarAlCarrito(producto);
      document.getElementById("modalProducto").style.display = "none";
    });
  }

  //Botones del carrito
  document.getElementById("vaciar-carrito").addEventListener("click", vaciarCarrito);
  document.getElementById("finalizar-compra").addEventListener("click", finalizarCompra);
});

function agregarAlCarrito(producto) {
  const existente = carrito.find(item => item.id === producto.id);
  if (existente) {
    existente.cantidad += producto.cantidad;
  } else {
    carrito.push(producto);
  }
  console.log("Producto agregado al carrito:", producto);
  guardarCarritoEnSessionStorage();
  actualizarCarritoUI();
}

function actualizarCarritoUI() {
  const carritoItems = document.getElementById("carrito-items");
  const contador = document.getElementById("contador-carrito");
  const carritoTotal = document.getElementById("carrito-total");
  const totalMonto = document.getElementById("total-monto");

  carritoItems.innerHTML = "";

  if (carrito.length === 0) {
    carritoItems.innerHTML = '<p class="carrito-vacio">Tu carrito está vacío</p>';
    carritoTotal.style.display = "none";
    contador.textContent = "0";
    return;
  }

  let total = 0;

  carrito.forEach(item => {
    const itemElement = document.createElement("div");
    itemElement.classList.add("carrito-item");

    itemElement.innerHTML = `
      <div>
        <strong>${item.nombre}</strong><br>
        <small>Precio unitario: S/. ${item.precio.toFixed(2)}</small>
      </div>
      <div>
        <input type="number" min="1" class="input-cantidad" data-id="${item.id}" value="${item.cantidad}" style="width: 50px;">
        <button class="btn-eliminar" data-id="${item.id}">❌</button>
      </div>
      <div>
        <strong>Subtotal:</strong> S/. ${(item.precio * item.cantidad).toFixed(2)}
      </div>
    `;

    carritoItems.appendChild(itemElement);
    total += item.precio * item.cantidad;
  });

  totalMonto.textContent = total.toFixed(2);
  carritoTotal.style.display = "block";
  contador.textContent = carrito.reduce((sum, item) => sum + item.cantidad, 0);

  document.querySelectorAll(".btn-eliminar").forEach(btn => {
    btn.addEventListener("click", () => eliminarDelCarrito(btn.dataset.id));
  });

  document.querySelectorAll(".input-cantidad").forEach(input => {
    input.addEventListener("change", () =>
      actualizarCantidad(input.dataset.id, parseInt(input.value))
    );
  });
}

//Eliminar producto del carrito
function eliminarDelCarrito(idProducto) {
  carrito = carrito.filter(item => item.id !== idProducto);
  guardarCarritoEnSessionStorage();
  actualizarCarritoUI();
}

//Actualizar cantidad de un producto en el carrito
function actualizarCantidad(idProducto, nuevaCantidad) {
  const producto = carrito.find(item => item.id === idProducto);
  if (producto) {
    producto.cantidad = nuevaCantidad > 0 ? nuevaCantidad : 1;
    guardarCarritoEnSessionStorage();
    actualizarCarritoUI();
  }
}

//Vaciar todo el carrito
function vaciarCarrito() {
  if (confirm("¿Estás seguro de que deseas vaciar el carrito?")) {
    carrito = [];
    guardarCarritoEnSessionStorage();
    actualizarCarritoUI();
  }
}

//Finalizar compra (redireccionar a pago)
async function finalizarCompra() {

  //Verificar carrito
  if (carrito.length === 0) {
    alert("Tu carrito está vacío.");
    return;
  }

  //Verificar token y rol (protección de ruta)
  protectRoute("cliente");
  
  //Confirmación
  const confirmar = confirm("¿Deseas confirmar tu pedido y continuar al pago?");
  if (!confirmar) {
    return;
  }

  try {
    //Enviar carrito al backend para calcular los precios finales
    const response = await fetchWithAuth("/api/pedido/resumen", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        productos: carrito.map(p => ({
          id_producto: p.id,
          cantidad: p.cantidad
        }))
      })
    });

    /*console.log("Datos enviados:", carrito.map(p => ({
      id_producto: p.id,
      cantidad: p.cantidad,
      precio_unitario: p.precio
    })));*/

    const data = await response.json();

    if (!response.ok) {
      alert("Error al verificar el pedido.");
      return;
    }

    //El backend no retorna la direccion de la imagen, entonces obtenemos desde el carrito
    data.productos = data.productos.map(prodBackend => {
      const itemEnCarrito = carrito.find(p => p.id === prodBackend.id);
      return {
        ...prodBackend,
        imagen: itemEnCarrito ? itemEnCarrito.imagen : prodBackend.imagen
      };
    });

    //Guardamos en sessionStorage
    sessionStorage.setItem("resumenPedido", JSON.stringify(data));

    // Redireccionar a pago
    window.location.href = "demo.html";
  } catch (error) {
    console.error(error);
    alert("Error al procesar el pedido.");
  }
}

//Guardamos el carrito en sessionStorage para mantenerlo durante la sesión actual
function guardarCarritoEnSessionStorage() {
  sessionStorage.setItem("carrito", JSON.stringify(carrito));
}

function cargarCarritoDesdeSessionStorage() {
  const carritoGuardado = sessionStorage.getItem("carrito", JSON.stringify(carrito));
  if (carritoGuardado) {
    carrito = JSON.parse(carritoGuardado);
    actualizarCarritoUI();
  }
}