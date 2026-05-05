# Documento de Diseño: Backend para Servicios Bancarios (Extendido)

## 1. Introducción
Este sistema backend profesional gestiona servicios financieros mediante una estructura de base de datos robusta en MySQL, con lógica automatizada mediante modelos y un asistente inteligente integrado.

## 2. Estructura de Tablas (15 en total)
1.  **Usuarios**: Datos personales de clientes.
2.  **Cuentas**: Información financiera vinculada a usuarios.
3.  **Transacciones**: Registro de movimientos de fondos.
4.  **Tarjetas**: Plásticos de débito/crédito.
5.  **Sucursales**: Ubicaciones físicas del banco.
6.  **Empleados**: Personal bancario asignado a sucursales.
7.  **Prestamos**: Créditos otorgados a usuarios.
8.  **Pagos**: Amortizaciones de préstamos.
9.  **Beneficiarios**: Personas designadas por los usuarios.
10. **Auditoria**: Registro de logs de operaciones sensibles.
11. **Divisas**: Tipos de moneda y tasas de cambio.
12. **Inversiones**: Productos de inversión contratados.
13. **Notificaciones**: Mensajes automáticos para el usuario.
14. **Direcciones**: Domicilio fiscal de los usuarios.
15. **SequelizeMeta**: Control de versiones de la base de datos.

## 3. Lógica de Negocio Compleja
- **Transacciones con Validación**: Antes de registrar un Retiro o Transferencia, el sistema verifica que la cuenta origen tenga saldo suficiente. Se utiliza `sequelize.transaction()` para asegurar que la operación sea atómica.
- **Seguridad Bancaria**: Las contraseñas se cifran automáticamente usando `bcryptjs` (salt de 10) antes de guardarse en la base de datos.
- **Gestión de Préstamos**: Los préstamos tienen un estado (Pendiente, Aprobado, Pagado). Solo se pueden registrar pagos si el préstamo ha sido previamente aprobado.

## 4. Endpoints Principales
- `POST /api/usuarios`: Registro de clientes con cifrado automático.
- `POST /api/transacciones`: Ejecución de movimientos financieros con validación de saldo.
- `PATCH /api/prestamos/:id/status`: Aprobación de créditos por parte del banco.
- `POST /api/pagos`: Abono a préstamos aprobados.

## 5. Asistente Inteligente (Simulación IA)
Para evitar el uso constante de MySQL Workbench, se ha implementado un asistente que responde preguntas en lenguaje natural sobre el estado del banco:
- **Endpoint**: `POST /api/chat/ask`
- **Body JSON**: `{"pregunta": "¿Cuántos usuarios hay?"}`
- **Capacidades**:
    - Consultar total de usuarios.
    - Consultar saldo total del banco.
    - Consultar préstamos pendientes.
    - Ver últimas transacciones.
    - Identificar al usuario con mayor saldo.
    - Contar total de cuentas registradas.
