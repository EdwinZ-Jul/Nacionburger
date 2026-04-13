document.addEventListener("click", function (e) {

    if (e.target.classList.contains("categoria-btn")) {

        const botones = document.querySelectorAll(".categoria-btn");
        const bloques = document.querySelectorAll(".categoria-bloque");

        botones.forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");

        const categoria = e.target.dataset.categoria;

        bloques.forEach(bloque => {
            bloque.classList.remove("active");

            if (bloque.dataset.categoria === categoria) {
                bloque.classList.add("active");
            }
        });
    }

});



