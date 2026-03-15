const listaProductos = document.getElementById("listaProductos");
const detalleProducto = document.getElementById("detalleProducto");
const contenidoCarrito = document.getElementById("contenidoCarrito");
const totalCarrito = document.getElementById("totalCarrito");
const contadorCarrito = document.getElementById("contadorCarrito");
const formPago = document.getElementById("formPago");

let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

// Cargar productos desde la API
async function obtenerProductos() {
  try {
    const respuesta = await fetch("https://fakestoreapi.com/products");
    productos = await respuesta.json();
    mostrarProductos();
  } catch (error) {
    listaProductos.innerHTML = `<p class="text-danger">Error al cargar los productos.</p>`;
    console.error(error);
  }
}

// Mostrar productos en cards
function mostrarProductos() {
  listaProductos.innerHTML = "";
  productos.forEach(producto => {
    listaProductos.innerHTML += `
      <div class="col-md-6 col-lg-4">
        <div class="card shadow-sm h-100">
          <img src="${producto.image}" class="card-img-top" alt="${producto.title}">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${producto.title}</h5>
            <p class="card-text text-success fw-bold">$${producto.price}</p>
            <button class="btn btn-primary mt-auto" onclick="verDetalle(${producto.id})">
              Ver más
            </button>
          </div>
        </div>
      </div>
    `;
  });
}

// Ver detalle en modal
function verDetalle(id) {
  const producto = productos.find(p => p.id === id);

  detalleProducto.innerHTML = `
    <div class="row">
      <div class="col-md-5 text-center">
        <img src="${producto.image}" class="img-fluid" alt="${producto.title}">
      </div>
      <div class="col-md-7">
        <h3>${producto.title}</h3>
        <p><strong>Categoría:</strong> ${producto.category}</p>
        <p>${producto.description}</p>
        <h4 class="text-success">$${producto.price}</h4>

        <div class="mb-3">
          <label class="form-label">Cantidad</label>
          <input type="number" id="cantidadProducto" class="form-control" value="1" min="1">
        </div>

        <button class="btn btn-success" onclick="agregarAlCarrito(${producto.id})">
          🛒 Agregar al carrito
        </button>
      </div>
    </div>
  `;

  const modal = new bootstrap.Modal(document.getElementById("modalProducto"));
  modal.show();
}

// Agregar al carrito
function agregarAlCarrito(id) {
  const producto = productos.find(p => p.id === id);
  const cantidad = parseInt(document.getElementById("cantidadProducto").value);

  const existente = carrito.find(item => item.id === id);

  if (existente) {
    existente.cantidad += cantidad;
  } else {
    carrito.push({
      id: producto.id,
      title: producto.title,
      price: producto.price,
      cantidad: cantidad
    });
  }

  guardarCarrito();
  renderizarCarrito();
  alert("Producto agregado al carrito ✅");
}

// Guardar en localStorage
function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

// Renderizar carrito
function renderizarCarrito() {
  contenidoCarrito.innerHTML = "";

  if (carrito.length === 0) {
    contenidoCarrito.innerHTML = "<p>Tu carrito está vacío.</p>";
    totalCarrito.textContent = "0.00";
    contadorCarrito.textContent = "0";
    return;
  }

  let total = 0;
  let cantidadTotal = 0;

  carrito.forEach(item => {
    total += item.price * item.cantidad;
    cantidadTotal += item.cantidad;

    contenidoCarrito.innerHTML += `
      <div class="item-carrito">
        <h6>${item.title}</h6>
        <p>Cantidad: ${item.cantidad}</p>
        <p>Precio: $${item.price}</p>
        <p>Subtotal: $${(item.price * item.cantidad).toFixed(2)}</p>
        <button class="btn btn-sm btn-danger" onclick="eliminarDelCarrito(${item.id})">
          <i class="fas fa-trash"></i> Eliminar
        </button>
      </div>
    `;
  });

  totalCarrito.textContent = total.toFixed(2);
  contadorCarrito.textContent = cantidadTotal;
}

// Eliminar del carrito
function eliminarDelCarrito(id) {
  carrito = carrito.filter(item => item.id !== id);
  guardarCarrito();
  renderizarCarrito();
}

// Procesar pago
formPago.addEventListener("submit", function(e) {
  e.preventDefault();

  const nombre = document.getElementById("nombreCliente").value.trim();
  const tarjeta = document.getElementById("numeroTarjeta").value.trim();
  const fecha = document.getElementById("fechaVencimiento").value.trim();
  const cvv = document.getElementById("cvv").value.trim();

  if (!nombre || !tarjeta || !fecha || !cvv) {
    alert("Completa todos los campos.");
    return;
  }

  if (carrito.length === 0) {
    alert("El carrito está vacío.");
    return;
  }

  generarTicketPDF(nombre);
  carrito = [];
  guardarCarrito();
  renderizarCarrito();
  formPago.reset();

  alert("Pago procesado correctamente ✅");
});

// Generar ticket PDF estilo térmico
function generarTicketPDF(nombreCliente) {
  const { jsPDF } = window.jspdf;

  const anchoTicket = 80;
  const altoBase = 120 + (carrito.length * 12);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [anchoTicket, altoBase]
  });

  let y = 10;

  doc.setFont("courier", "normal");
  doc.setFontSize(10);

  doc.text("SHOPMASTER", 10, y);
  y += 6;
  doc.text("------------------------------", 5, y);
  y += 6;
  doc.text(`Cliente: ${nombreCliente}`, 5, y);
  y += 6;

  const fecha = new Date().toLocaleString();
  doc.text(`Fecha: ${fecha}`, 5, y);
  y += 6;
  doc.text("------------------------------", 5, y);
  y += 6;

  let total = 0;

  carrito.forEach(item => {
    doc.text(item.title.substring(0, 22), 5, y);
    y += 5;
    doc.text(`${item.cantidad} x $${item.price} = $${(item.cantidad * item.price).toFixed(2)}`, 5, y);
    y += 6;
    total += item.cantidad * item.price;
  });

  doc.text("------------------------------", 5, y);
  y += 6;
  doc.text(`TOTAL: $${total.toFixed(2)}`, 5, y);
  y += 8;
  doc.text("Gracias por su compra", 5, y);

  doc.save("ticket-termico.pdf");
}

// Inicializar
obtenerProductos();
renderizarCarrito();