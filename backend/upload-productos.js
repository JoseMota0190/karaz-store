require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dh6kkq9w7',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const IMAGENES_DIR = path.join(__dirname, '..', 'imagenes');

const IMAGENES = [
  { file: 'anillo.jpeg', category: 'anillos' },
  { file: 'pulsera.jpeg', category: 'pulseras' },
  { file: 'pulsera2.jpeg', category: 'pulseras' },
  { file: 'collar.jpeg', category: 'collares' },
  { file: 'aretes.jpeg', category: 'aretes' }
];

async function uploadImage(img) {
  const filePath = path.join(IMAGENES_DIR, img.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ No encontrada: ${img.file}`);
    return null;
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, {
      folder: `stores/karaz/productos/${img.category}`,
      public_id: path.basename(img.file, path.extname(img.file)),
      resource_type: 'image'
    }, (error, result) => {
      if (error) {
        console.log(`❌ Error subiendo ${img.file}:`, error.message);
        reject(error);
      } else {
        console.log(`✅ Subido: ${img.file} → ${result.secure_url}`);
        resolve({ ...img, url: result.secure_url });
      }
    });
  });
}

async function main() {
  console.log('🚀 Subiendo imágenes a Cloudinary...\n');
  
  const results = [];
  
  for (const img of IMAGENES) {
    try {
      const result = await uploadImage(img);
      if (result) results.push(result);
    } catch (e) {
      console.error(`Error: ${e.message}`);
    }
  }

  console.log(`\n📊 Resultado: ${results.length}/5 imágenes subidas\n`);
  
  // Generar JSON de productos
  console.log('📦 Generando productos.json...\n');
  
  const productos = [];
  let idCounter = { anillos: 1, pulseras: 1, collares: 1, aretes: 1 };
  
  const categoryMap = {
    anillos: { prefijo: 'AN-', imgIndex: 0 },
    pulseras: { prefijo: 'PU-', imgIndex: [0, 1] },
    collares: { prefijo: 'CL-', imgIndex: 2 },
    aretes: { prefijo: 'AR-', imgIndex: 3 }
  };
  
  for (const [cat, config] of Object.entries(categoryMap)) {
    for (let i = 0; i < 8; i++) {
      const idNum = String(idCounter[cat]).padStart(3, '0');
      const imgIdx = Array.isArray(config.imgIndex) 
        ? config.imgIndex[i % config.imgIndex.length] 
        : config.imgIndex;
      const img = results[imgIdx];
      
      productos.push({
        id: `${config.prefijo}${idNum}`,
        name: `${cat.charAt(0).toUpperCase() + cat.slice(1)} Modelo ${i + 1}`,
        price: [8, 12, 15, 18, 22, 25, 30, 35][i],
        category: cat,
        stock: 10,
        featured: i < 2,
        description: '',
        image: img?.url || ''
      });
      
      idCounter[cat]++;
    }
  }
  
  console.log(JSON.stringify(productos, null, 2));
}

main().catch(console.error);