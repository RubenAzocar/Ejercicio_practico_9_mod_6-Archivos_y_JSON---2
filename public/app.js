// [COGNITIVE_RESET] Recordatorio de rol activo. Soy Programador Senior Fullstack. Prohibido divagar. Prohibido alucinar. Código funcional inmediato. [/COGNITIVE_RESET]
/*
    Lógica cliente: llamadas fetch a la API y render simple

    Cambios realizados:
    - Se elimina la visualización de identificadores internos (ids) junto a nombres,
        RUTs y cuentas de ahorro en la UI. Solo se muestra información legible para
        el usuario: nombre, número de cuenta y saldo.
    - Razonamiento: los ids internos (ej. r_init*) no deben mostrarse al ejecutivo.
*/

async function api(path, opts) {
    const res = await fetch('/api' + path, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts));
    const txt = await res.text();
    try { return JSON.parse(txt); } catch { return txt; }
}

function el(selector) { return document.querySelector(selector); }

async function renderClients(list) {
    const cont = el('#clients-list');
    if (!list || list.length === 0) { cont.innerHTML = '<p>No hay clientes.</p>'; return; }
    // Render sin mostrar ids internos: mostrar solo número y saldo de cuentas
    // Mostrar solo la información solicitada: nombre, número de cuenta y saldo (sin IDs internas)
    cont.innerHTML = list.map(c => {
        const rut = c.rutAccount ? `<div><strong>RUT</strong> ${c.rutAccount.number} - $${c.rutAccount.balance}</div>` : '';
        const savings = (c.savingAccounts || []).map(s => `<li>${s.number} - $${s.balance}</li>`).join('');
        return `<div class="client-card"><h4>${c.name}</h4>${rut}<div><strong>Ahorros</strong><ul>${savings || '<li>-</li>'}</ul></div></div>`;
    }).join('');
}

async function refreshAll() {
    const data = await api('/clients');
    await renderClients(data);
}

document.addEventListener('DOMContentLoaded', () => {
    el('#btn-refresh').addEventListener('click', refreshAll);
    el('#btn-list-rut').addEventListener('click', async () => {
        const r = await api('/clients/rut');
        renderClients(r);
    });

    el('#form-new-client').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const name = f.name.value.trim();
        const rut_number = f.rut_number.value.trim();
        const rut_balance = f.rut_balance.value ? Number(f.rut_balance.value) : 0;
        const saving_number = f.saving_number.value.trim();
        const saving_balance = f.saving_balance.value ? Number(f.saving_balance.value) : 0;

        const payload = { name };
        if (rut_number) payload.rutAccount = { number: rut_number, balance: rut_balance };
        if (saving_number) payload.savingAccounts = [{ number: saving_number, balance: saving_balance }];

        const res = await api('/clients', { method: 'POST', body: JSON.stringify(payload) });
        await refreshAll();
        f.reset();
    });

    el('#form-add-rut').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const id = f.client_id.value.trim();
        const number = f.rut_number.value.trim();
        const balance = f.rut_balance.value ? Number(f.rut_balance.value) : 0;
        await api(`/clients/${id}/rut`, { method: 'POST', body: JSON.stringify({ number, balance }) });
        await refreshAll();
        f.reset();
    });

    el('#form-add-savings').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const id = f.client_id.value.trim();
        const number = f.saving_number.value.trim();
        const balance = f.saving_balance.value ? Number(f.saving_balance.value) : 0;
        await api(`/clients/${id}/savings`, { method: 'POST', body: JSON.stringify({ number, balance }) });
        await refreshAll();
        f.reset();
    });

    el('#form-delete-client').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = e.target.client_id.value.trim();
        await api(`/clients/${id}`, { method: 'DELETE' });
        await refreshAll();
        e.target.reset();
    });

    el('#form-delete-rut').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = e.target.client_id.value.trim();
        await api(`/clients/${id}/rut`, { method: 'DELETE' });
        await refreshAll();
        e.target.reset();
    });

    el('#form-delete-saving').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = e.target.client_id.value.trim();
        const saving_id = e.target.saving_id.value.trim();
        await api(`/clients/${id}/savings/${saving_id}`, { method: 'DELETE' });
        await refreshAll();
        e.target.reset();
    });

    // Inicial
    refreshAll();
});
