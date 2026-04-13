USE NaciónBurgerDB;
GO

--INSERTAR LOS CARGOS
IF NOT EXISTS (SELECT 1 FROM Cargos)
BEGIN
    INSERT INTO CARGOS(ID_CARGO, DESCRIPCION) VALUES
    (1,'admin'), 
    (2,'mozo'), 
    (3,'cocinero'), 
    (4,'cajero');
END
GO

--INSERTAR LOS HORARIOS
IF NOT EXISTS (SELECT 1 FROM Horarios)
BEGIN
    INSERT INTO HORARIOS(HORA_INICIO, HORA_FIN) VALUES
    ('6:00 PM','11:00 PM'), 
    ('6:00 PM','3:00 AM');
END
GO

--INSERTAMOS LOS ESTADOS DE LOS PEDIDOS
IF NOT EXISTS (SELECT 1 FROM Estados_Pedido)
BEGIN
    INSERT INTO ESTADOS_PEDIDO (DESCRIPCION) VALUES
    ('pendiente'),
    ('en preparación'),
    ('listo'),
    ('entregado'),
    ('en camino'),
    ('devuelto');
END
GO

--INSERTAMOS EL TIPO_ENTREGA
IF NOT EXISTS (SELECT 1 FROM Tipos_Entrega)
BEGIN
    INSERT INTO TIPOS_ENTREGA (DESCRIPCION) VALUES
    ('En local'),
    ('Delivery'),
    ('Recojo en tienda');
END
GO

--INSERTAMOS ESTADOS DE PAGO
IF NOT EXISTS (SELECT 1 FROM Estados_Pago)
BEGIN
    INSERT INTO Estados_Pago(DESCRIPCION) VALUES
    ('pendiente'),
    ('pagado'),
    ('cancelado');
END
GO

--INSERTAMOS LOS METODOS DE PAGO
-- NOTA: Lo he adaptado a tus nuevas modalidades (Tarjeta, Yape, Plin) que pediste antes, en lugar de poner solo "Billetera electronica".
IF NOT EXISTS (SELECT 1 FROM Modalidades_Pago)
BEGIN
    INSERT INTO Modalidades_Pago(DESCRIPCION)
    VALUES 
    ('Efectivo'),
    ('Tarjeta'),
    ('Yape'),
    ('Plin'),
    ('MercadoPago');
END
GO

--INSERTAMOS LA CATEGORIA DE LOS PRODUCTOS O PLATOS
IF NOT EXISTS (SELECT 1 FROM Categoria_Productos)
BEGIN
    INSERT INTO CATEGORIA_PRODUCTOS(DESCRIPCION, CARPETA) VALUES
    ('Hamburguesas','Hamburguesas'),
    ('Alitas','Alitas y Chicken'),
    ('Chicken','Alitas y Chicken'),
    ('Salchipapas','Salchipapas'),
    ('Combos','Combos'),
    ('Sanguches','Sánguches y Broaster'),
    ('Broaster','Sánguches y Broaster'),
    ('Promo','Promos');
END
GO

--INSERTAMOS LOS ESTADOS
IF NOT EXISTS (SELECT 1 FROM Estados_Producto)
BEGIN
    INSERT INTO Estados_Producto(DESCRIPCION) VALUES 
    ('Activo'),
    ('Desactivado');
END
GO

--INSERTAMOS LOS PLATOS O PRODUCTOS A LA CARTA
IF NOT EXISTS (SELECT 1 FROM Carta)
BEGIN
    INSERT INTO CARTA(NOMBRE,PRECIO, DESCRIPCION, IMAGEN, ID_CATEGORIA, ID_ESTADO) VALUES 
    ('Hamburguesa Clásica', 20, 'Medallon de Carne, Lechuga, Tomate, Cebolla Brunoise & Pickles.', 'hamburguesa1.jpg', 1, 1),
    ('Cheese', 22, 'Medallon de carne, Doble Queso Cheddar, Sasa de la casa, Pepinillos Cebolla en Brunoise, Lechuga y Tomate.', 'hamburguesa2.jpg', 1,1),
    ('Hamburguesa Royal',24.00,'Medallon de Carne, Queso, Tocino, Huevo, Lechuga, Tomate, Cebolla Brunoise & Pickles, Mayo de aji Amarillo.','hamburguesa3.jpg',1,1),
    ('Hamburguesa A lo pobre',24.00,'Medallon de carne, Platano, Huevo, Lechuga, Tomate, Chalaquita, Mayo de aji Amarillo, Lechuga y Tomate.','hamburguesa4.jpg',1,1),
    ('Hamburguesa Bacon',24.00,'Medallon de carne, Queso Cheddar, Doble Tocino, Lechuga, Tomate, Cebolla Brunoise & Pickles.','hamburguesa5.jpg',1,1),
    ('Hamburguesa Nacion Burger',32.00,'Doble Medallon de Carne, Doble queso Cheddar, Tocino, Chorizo, Huevo, Lechuga, Tomate, Cebolla, brunoise & Pickles.','hamburguesa6.jpg',1,1),
    ('Hamburguesa American Classic simple',23.00,'Carne SMASH, Cheddar, Cebolla en aros, Ketchup, Mostaza, Pickles, Lechuga, Tomate.','hamburguesa7.jpeg',1,1),
    ('Hamburguesa American Bacon',27.00,'Carne SMASH, Cebolla Acaramelizada, Tocino, Chunchy, Cheddar, Pickles, Salsa Tousand.','hamburguesa8.jpg',1,1),
    ('Hamburguesa La Gringa',29.00, 'Carne SMASH, Onion Ring al Panko, Cheddar, Tocino, Mayo BBQ, Cebolla caramelizada, Salsa Americana.','hamburguesa9.jpg',1,1),
    ('Hamburguesa Hawaiana',29.00, 'Carne SMASH, Queso Dambo, Mermelada de Piña y Tocino, Cebolla Caramelizada, Salsa Americana.', 'hamburguesa10.jpeg', 1,1),
    ('Hamburguesa California',29.00, 'Carne SMASH, Cheddar, Cebolla en Brunoise, Mermelada de Tocino, Pickles, Salsa de la casa.','hamburguesa11.jpg',1,1),
    ('Hamburguesa Mega Cheese',32.00 ,'DOBLE Carne SMASH, Cuadruple queso Cheddar, Cebolla caramelizada, Pickles .','hamburguesa12.jpeg', 1,1),
    ('Hamburguesa American Classic Doble',27.00 ,'Carne SMASH, Cheddar, Cebolla en aros, Ketchup, Mostaza, Pickles, Lechuga, Tomate.','hamburguesa7.jpeg', 1,1),
    ('Hamburguesa American Bacon Doble',34.00,'Carne SMASH, Cebolla Acaramelizada, Tocino, Chunchy, Cheddar, Pickles, Salsa Tousand.','hamburguesa8.jpg',1,1),
    ('Hamburguesa La Gringa Doble',34.00,'Carne SMASH, Onion Ring al Panko, Cheddar, Tocino, Mayo BBQ, Cebolla caramelizada, Salsa Americana.','hamburguesa9.jpg',1,1),
    ('Hamburguesa Hawaiana Doble',34.00,'Carne SMASH, Queso Dambo, Mermelada de Piña y Tocino, Cebolla Caramelizada, Salsa Americana.','hamburguesa10.jpeg', 1,1),
    ('Hamburguesa California Doble',34.00,'Carne SMASH, Cheddar, Cebolla en Brunoise, Mermelada de Tocino, Pickles, Salsa de la casa.','hamburguesa11.jpg',1,1),
    ('Alitas BBQ',24.00,'Jugosas alitas con salsa BBQ.','alitas1.jpg',2,1),
    ('Alitas Crispy',24.00,'Alitas de Pollo, cobertura crujiente, especies secretas, salsa ranch.','alitas2.jpg',2,1),
    ('Alitas Honey Mustard',24.00,'Alitas de pollo glaseadas con miel y mostaza, salsa agridulce, cebollin picado.','alitas3.jpeg',2,1),
    ('Alitas Lemon Pepper',24.00,'Alitas de Pollo, Pimienta negra molida, ralladura de limón, mantequilla de ajo.','alitas4.jpg',2,1),
    ('Alitas Salsa Cheddar',24.00,'Alitas de pollo, salsa de queso cheddar cremosa, cebollin fresco, paprika.','alitas5.jpeg',2,1),
    ('Alitas Teriyaki',24.00,'Alitas de pollo, salsa teriyaki dulce, sésamo tostato, cebollin verde.','alitas6.jpg',2,1),
    ('Alitas búfalo',24.00,'Con salsa búfalo y especias.','alitas7.jpg',2,1),
    ('Alitas Mango Habanero',24.00,'Alitas de pollo, salsa de mango dulce, chile habanero, cilantro fresco.','alitas8.jpg',2,1),
    ('Alitas Acevichada',24.00,'Alitas de pollo, leche de tigre, limón, ají amarillo, cebolla morada.','alitas9.jpg',2,1),
    ('Alitas A la chalaca',24.00,'Alitas de pollo, salsa chalaca, choclo, cancha serrana, rocoto picado.','alitas10.jpg',2,1),
    ('Cryspy chicken',22.00,'Pan Brioche, Pollo crispy, Salsa de la casa, papa amarilla.','ckicken1.jpg',3,1),
    ('Cryspy Cheese',24.00,'Pan Brioche, Pollo crispy, Salsa Cheddar, papa amarilla.','ckicken2.jpg',3,1),
    ('Bacon & Cheese',26.00,'Pan Brioche, Pollo crispy, Salsa de la casa,queso, tocino, papa amarilla.','ckicken3.jpg',3,1),
    ('Salchipapas Tradicional',18.00,'Salchichas premium y papas crocantes con salsas caseras.','salchipapas.jpg',4,1),
    ('Salchipapa Montana',19.00,'FrankFurter, Huevo, Papa amarilla','salchipapa1.png',4,1),
    ('Salchipapa Mixta',20.00,'FrankFurter, Chorizo Parrillero, Papa amarilla','salchipapa2.jpg',4,1),
    ('Salchipollo',21.00,'FrankFurter, Pollo deshilachado, Papa amarilla','salchipapa3.jpg',4,1),
    ('Especial',22.00,'FrankFurter, Huevo, Platano, Chorizo Parrillero, Papa amarilla','salchipapa4.jpg',4,1),
    ('Cheddar',24.00,'FrankFurter, Salsa Cheddar, Toble tocino picado, Papa amarilla','salchipapa5.jpeg',4,1),
    ('Salchialita',26.00,'FrankFurter, 3 Alitas bañadas Cualquier sabor, Papas','salchipapa6.jpeg',4,1),
    ('Parrillera',26.00,'FrankFurter, Chorizo parrillero, pollo al chimichurri, Papas','salchipapa7.jpeg',4,1),
    ('Salchialita Especial',32.00,'FrankFurter, Huevo, Platano, Chorizo, 3 Alitas de Cualquier sabor, papas','salchipapa8.jpeg',4,1),
    ('Nacion',50.00,'FrankFurter, 02 Huevos, Platano, Chorizo, 6 alitas bañadas en Cualquier sabor, papas','salchipapa9.jpeg',4,1),
    ('Combo Clasico',49.00,'1 Hamburguesa Clasica + 1 Alita(Cualquier sabor)+ 2 bebidas.','combo1.jpeg',5,1),
    ('Combo Alitas',62.00,'18 Alitas en 3 sabores a combinar + Porcion de paspas personal.','combo2.jpeg',5,1),
    ('Combo Wings Couple',45.00,'12 Alitas en 2 sabores a cobinar + 2 bebidas.','combo3.jpeg',5,1),
    ('Combo Nacion',90.00,'2 Hamburguesas nacionales + 2 porciones de alas(Cualquier sabor) + 2 bebidas.','combo4.jpeg',5,1),
    ('Combo Burger',52.00,'2 Hamburguesas Nacionales + 2 bebidas.','combo5.jpeg',5,1),
    ('Combo Salchi',48.00,'1 Hamburguesa nacional + 1 Salchi alita + 2 bebidas.','combo6.jpeg',5,1),
    ('Sánguche Deshilachado',18.00,'Pollo Deshilachado, vegetales y papas.','S1.jpeg',6,1),
    ('Sánguche Chicken Grill',22.00,'Pollo a la plancha, vegetales y papas.','S2.jpg',6,1),
    ('Sánguche Chicken Bacon',22.00,'Pollo a la plancha ahumada con queso y tocino, vegetales y papas.','S3.webp',6,1),
    ('Sánguche Chicken Grill',16.00,'Pan Brioche, chorizo parrillero, salsa chimichurri, vegetales.','S4.jpg',6,1),
    ('Broaster Pierna',19.00,'Pierna Broaster, papas, arroz, ensalada o coleslaw.','broaster1.jpeg',7,1),
    ('Broaster Pierna a lo pobre',23.00,'Pierna Broaster, platano, Huevo, papas, arroz, ensalada o coleslaw.','broaster2.jpeg',7,1),
    ('Broaster Pecho',20.00,'Pecho Broaster, papas, arroz, ensalada o coleslaw.','broaster3.png',7,1),
    ('Broaster Pecho A lo pobre',24.00,'Pecho Broaster,platano, huevo, papas, arroz, ensalada o coleslaw.','broaster4.jpg',7,1);
END
GO

--INSERTAMOS LOS ESTADOS DE LAS MESAS
IF NOT EXISTS (SELECT 1 FROM Estados_Mesa)
BEGIN
    INSERT INTO Estados_Mesa (DESCRIPCION) VALUES
    ('Disponible'),
    ('Ocupado');
END
GO

--INSERTAMOS LAS MESAS:
IF NOT EXISTS (SELECT 1 FROM Mesas)
BEGIN
    INSERT INTO Mesas (NUMERO, ID_ESTADO)
    VALUES 
    (1, 1),
    (2, 1),
    (3, 1),
    (4, 1),
    (5, 1),
    (6, 1),
    (7, 1),
    (8, 1),
    (9, 1),
    (10, 1),
    (11, 1),
    (12, 1);
END
GO

--INSERTAMOS LAS PROVINCIAS (1)
IF NOT EXISTS (SELECT 1 FROM Provincias)
BEGIN
    INSERT INTO Provincias(NOMBRE) 
    VALUES
    ('LIMA');
END
GO

--INSERTAMOS LOS DISTRITOS (3 operativos)
IF NOT EXISTS (SELECT 1 FROM Distritos)
BEGIN
    INSERT INTO Distritos(NOMBRE,ID_PROVINCIA)
    VALUES
    ('La Molina', 1),
    ('Santa Anita', 1),
    ('Ate', 1);
END
GO
