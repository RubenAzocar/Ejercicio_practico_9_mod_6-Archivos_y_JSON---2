Proyecto: Banco - gestión de cuentas RUT y AHORRO

Instrucciones rápidas:

- Instalar dependencias:

````markdown
# Banco - Gestión de Cuentas RUT y AHORRO

Proyecto educativo que expone una API REST y un frontend simple para administrar cuentas RUT y de ahorro. Está pensado como ejercicio práctico para manipulación de datos en archivo JSON y operaciones CRUD básicas.

## Características

- Listar clientes y cuentas
- Filtrar clientes con cuenta RUT
- Crear cliente con cuenta RUT y/o cuentas de ahorro
- Añadir cuenta RUT o de ahorro a cliente existente
- Eliminar cuenta (RUT o ahorro) con validaciones de integridad
- Eliminar cliente y todas sus cuentas

## Requisitos

- Node.js 14+ (recomendado)
- Conexión de red local para probar el frontend

## Instalación

```powershell
npm install
```

## Ejecución

```powershell
npm start
# el servidor escucha por defecto en http://localhost:3000
```

Abrir el navegador en: http://localhost:3000

## API (endpoints principales)

- `GET /api/clients` — Listar todos los clientes
- `GET /api/clients/rut` — Listar clientes que poseen cuenta RUT
- `POST /api/clients` — Crear cliente
	- Payload ejemplo:
		```json
		{ "name": "Juan", "rutAccount": { "number": "12.345.678-9", "balance": 1000 }, "savingAccounts": [{ "number": "AH-001", "balance": 200 }] }
		```
- `POST /api/clients/:id/rut` — Agregar cuenta RUT a cliente existente
- `POST /api/clients/:id/savings` — Agregar cuenta de ahorro a cliente existente
- `DELETE /api/clients/:id` — Eliminar cliente y todas sus cuentas
- `DELETE /api/clients/:id/rut` — Eliminar cuenta RUT (solo si queda al menos otra cuenta)
- `DELETE /api/clients/:id/savings/:accId` — Eliminar cuenta de ahorro por id

### Ejemplos rápidos (curl)

```bash
# Listar clientes
curl -s http://localhost:3000/api/clients | jq

# Crear cliente con RUT
curl -s -X POST http://localhost:3000/api/clients -H 'Content-Type: application/json' -d '{"name":"Prueba","rutAccount":{"number":"11.111.111-1","balance":1000}}'
```

## Formato de datos

Los datos se persisten en `data/clients.json` con la siguiente estructura mínima:

```json
{
	"clients": [
		{
			"id": "c_...",
			"name": "Nombre",
			"rutAccount": { "id": "r_...", "number": "12.345.678-9", "balance": 1000 } | null,
			"savingAccounts": [ { "id": "s_...", "number": "AH-...", "balance": 100 } ]
		}
	]
}
```

## Notas de seguridad y uso

- Proyecto educativo: no exponer en producción sin agregar autenticación, validación de entradas y control de concurrencia sobre la escritura del archivo.
- Evitar editar `data/clients.json` mientras el servidor está en ejecución.

## Desarrollo

- Frontend simple en `/public` usando `fetch` hacia los endpoints `/api/*`.
- Código servidor en `server.js` (Express) y persistencia en `data/clients.json`.

## Licencia

Proyecto libre para uso y aprendizaje.

````
# Ejercicio_practico_9_mod_6-Archivos_y_JSON---2
