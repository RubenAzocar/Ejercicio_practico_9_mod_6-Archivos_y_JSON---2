// [COGNITIVE_RESET] Recordatorio de rol activo. Soy Programador Senior Fullstack. Prohibido divagar. Prohibido alucinar. Código funcional inmediato. [/COGNITIVE_RESET]
/*
  Servidor Node + Express que persiste en archivo JSON.
  - Rutas expuestas bajo /api
  - Reglas: máximo 1 cuenta RUT por cliente; cada cliente debe tener al menos una cuenta (RUT o AHORRO)
  - Seguridad: sencillo servidor de desarrollo. No usar en producción sin autenticar/validar entradas más estrictamente.
*/

const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'data', 'clients.json');

async function loadData() {
    try {
        const txt = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(txt);
    } catch (err) {
        if (err.code === 'ENOENT') return { clients: [] };
        throw err;
    }
}

async function saveData(data) {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function genId(prefix = '') {
    return prefix + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36);
}

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// API: Listar todos los clientes y sus cuentas
app.get('/api/clients', async (req, res) => {
    const data = await loadData();
    res.json(data.clients);
});

// API: Listar clientes con cuenta RUT
app.get('/api/clients/rut', async (req, res) => {
    const data = await loadData();
    const list = data.clients.filter(c => c.rutAccount);
    res.json(list);
});

// Agregar cliente nuevo (según reglas de negocio: RUT es obligatorio para todos los clientes)
app.post('/api/clients', async (req, res) => {
    const { name, rutAccount, savingAccounts } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre requerido' });
    // Regla: cada cliente debe tener una cuenta RUT. No se permiten clientes con solo cuentas de ahorro.
    if (!rutAccount) {
        return res.status(400).json({ error: 'Cuenta RUT obligatoria al crear un cliente' });
    }

    const data = await loadData();
    const client = {
        id: genId('c_'),
        name,
        rutAccount: null,
        savingAccounts: []
    };

    if (rutAccount) {
        client.rutAccount = Object.assign({ id: genId('r_'), number: rutAccount.number || '', balance: rutAccount.balance || 0 });
    }

    if (savingAccounts && Array.isArray(savingAccounts)) {
        client.savingAccounts = savingAccounts.map(sa => ({ id: genId('s_'), number: sa.number || '', balance: sa.balance || 0 }));
    }

    data.clients.push(client);
    await saveData(data);
    res.status(201).json(client);
});

// Agregar cuenta RUT a cliente existente
app.post('/api/clients/:id/rut', async (req, res) => {
    const { number, balance } = req.body;
    const data = await loadData();
    const client = data.clients.find(c => c.id === req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    if (client.rutAccount) return res.status(400).json({ error: 'El cliente ya tiene cuenta RUT' });

    client.rutAccount = { id: genId('r_'), number: number || '', balance: balance || 0 };
    await saveData(data);
    res.json(client);
});

// Agregar cuenta de AHORRO a cliente existente
app.post('/api/clients/:id/savings', async (req, res) => {
    const { number, balance } = req.body;
    const data = await loadData();
    const client = data.clients.find(c => c.id === req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

    // Regla: no se puede agregar cuenta de ahorro a un cliente que no tenga cuenta RUT
    if (!client.rutAccount) {
        return res.status(400).json({ error: 'No se puede agregar cuenta de ahorro: el cliente no tiene cuenta RUT' });
    }

    const account = { id: genId('s_'), number: number || '', balance: balance || 0 };
    client.savingAccounts = client.savingAccounts || [];
    client.savingAccounts.push(account);
    await saveData(data);
    res.json(client);
});

// Eliminar cliente y todas sus cuentas
app.delete('/api/clients/:id', async (req, res) => {
    const data = await loadData();
    const idx = data.clients.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Cliente no encontrado' });
    const removed = data.clients.splice(idx, 1)[0];
    await saveData(data);
    res.json({ removed });
});

// Eliminar cuenta RUT de cliente (solo permitido si quedan otras cuentas)
app.delete('/api/clients/:id/rut', async (req, res) => {
    const data = await loadData();
    const client = data.clients.find(c => c.id === req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    if (!client.rutAccount) return res.status(400).json({ error: 'Cliente no tiene cuenta RUT' });
    // Según reglas de negocio actualizadas:
    // - La cuenta RUT es obligatoria para los clientes (no se permiten clientes sin RUT).
    // - Además, no es válido que existan cuentas de ahorro sin una cuenta RUT.
    // Por lo tanto, no permitimos eliminar la cuenta RUT de un cliente.
    return res.status(400).json({ error: 'Operación no permitida: no se puede eliminar la cuenta RUT. Para eliminar todas las cuentas, elimine el cliente con DELETE /api/clients/:id' });
});

// Eliminar cuenta de AHORRO por id
app.delete('/api/clients/:id/savings/:accId', async (req, res) => {
    const data = await loadData();
    const client = data.clients.find(c => c.id === req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    const idx = (client.savingAccounts || []).findIndex(a => a.id === req.params.accId);
    if (idx === -1) return res.status(404).json({ error: 'Cuenta de ahorro no encontrada' });

    // Si es la última cuenta y no existe RUT, no permitir eliminación
    if ((client.savingAccounts.length === 1) && !client.rutAccount) {
        return res.status(400).json({ error: 'No se puede eliminar la última cuenta de ahorro: el cliente quedaría sin cuentas' });
    }

    const removed = client.savingAccounts.splice(idx, 1)[0];
    await saveData(data);
    res.json({ removed, client });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));
