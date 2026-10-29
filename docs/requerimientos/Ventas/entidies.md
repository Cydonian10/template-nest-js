# Caja

id
codigo
nombre
activo
turnos

# Configuracion Descuentos

id
limiteManual
actualizadoEn

# Descuento Venta

id
venta
detalle
promocion
usuario
origen
importe

# Detalle Devolucion Venta

id
devolucion
detalleVenta
cantidad
cantidadBase
importe

# Detalle Venta

id
venta
ventaId
variante
unidad
cantidad
factorABase
cantidadBase
precioUnitario
descuentoPromocional
descuentoManual
descuentos
devoluciones

# Devolucion Venta

id
venta
ventaId
turno
usuario
movimientoInventario
tipo
motivo
baseImponible
igv
importe
fecha
detalles
reintegros

# movimiento caja

id
turno
turnoId
usuario
tipo INGRESO | EGRESO
importe
motivo
fecha

# Pago Venta

id
venta
medio
importe
fecha

# Promocion

id
producto
productoId
unidad
cantidadMinima
tipoDescuento
valor
vigenteDesde
vigenteHasta
activo

# Reintegro

id
devolucion
medio
importe
fecha

# Ticket Venta

id
venta
ventaId
fecha

# Turno Caja

id
caja
cajaId
usuarioApertura
usuarioCierre
fechaOperativa
fechaApertura
fechaCierre
saldoInicial
efectivoEsperado
efectivoContado
tipoCierre
ventas
movimientos

# Venta

turno
turnoId
almacen
almacenId
usuario
movimientoInventario
fecha
estado
subtotal
descuentoPromocional
descuentoManual
baseImponible
igv
total
detalles
pagos
vueltos
descuentos
devoluciones
ticket

# Vuelto Venta

id
venta
medio
importe
fecha
