require('dotenv').config();
const fs = require('fs');

const API_URL = 'https://aguamarina-backend-q7gd.onrender.com';
const STORE_ID = 'karaz';
const ADMIN_PASS = 'karaz2024';

const productos = JSON.parse(fs.readFileSync('../productos.json', 'utf8'));

async function uploadProduct(p) {
  try {
    const res = await fetch(`${API_URL}/api/productos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-store-id': STORE_ID,
        'x-admin-password': ADMIN_PASS
      },
      body: JSON.stringify({
        codigo: p.id,
        nombre: p.name,
        precio: String(p.price),
        categoria: p.category,
        imagen: p.image,
        descripcion: p.description || '',
        activo: true
      })
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`✅ ${p.id}: ${p.name}`);
    } else {
      console.log(`❌ ${p.id}: ${data.error}`);
    }
  } catch (e) {
    console.log(`❌ ${p.id}: ${e.message}`);
  }
}

async function main() {
  console.log(`🚀 Subiendo ${productos.length} productos a KARAZ...\n`);
  for (const p of productos) {
    await uploadProduct(p);
  }
  console.log('\n✅ Completado!');
}

main();