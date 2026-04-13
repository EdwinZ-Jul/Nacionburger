const app = document.getElementById("app");

document.addEventListener("click", (e) => {
    if (e.target.matches("[data-vista]")) {
        e.preventDefault();
        cargarVista(e.target.dataset.vista);
    }
});

function cargarVista(vista) {
    fetch(`views/${vista}.html`)
        .then(res => {
            if (!res.ok) {
                throw new Error("Vista no encontrada");
            }
            return res.text();
        })
        .then(data => {
            app.innerHTML = data;
            window.scrollTo(0, 0);

            //Reiniciar animaciones AOS
            AOS.init({
                once: false,
                duration: 1000,
                offset: 100
            });
        })
        .catch(error => {
            app.innerHTML = `
                <h2 class='text-center mt-5 text-danger'>
                    Vista no encontrada
                </h2>`;
        });
}

// Cargar inicio por defecto
cargarVista("inicio");
