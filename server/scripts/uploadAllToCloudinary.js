const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { db } = require('../firebaseAdmin');
const cloudinary = require('cloudinary').v2;

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('FATAL: Cloudinary credentials missing in server/.env');
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});

const PRODUCTS_DIR = path.resolve(__dirname, '../public/products');

async function uploadAllImages() {
  console.log('==================================================');
  console.log('      UPLOADING ALL 52 PRODUCT ASSETS TO CLOUDINARY');
  console.log('==================================================');
  console.log(`Cloud Name: ${cloudName}`);
  console.log(`Source Directory: ${PRODUCTS_DIR}\n`);

  const snapshot = await db.collection('products').get();
  console.log(`Found ${snapshot.docs.length} products in Firestore catalog.`);

  const urlMapping = {};
  let successCount = 0;

  for (const doc of snapshot.docs) {
    const prodId = doc.id;
    const prodData = doc.data();
    const localImgPath = path.join(PRODUCTS_DIR, `${prodId}.jpg`);

    if (!fs.existsSync(localImgPath)) {
      console.warn(`[SKIP] Local image not found for ${prodId}: ${localImgPath}`);
      continue;
    }

    try {
      const uploadRes = await cloudinary.uploader.upload(localImgPath, {
        folder: 'califnco/products',
        public_id: prodId,
        overwrite: true,
        resource_type: 'image',
        format: 'jpg'
      });

      const secureUrl = uploadRes.secure_url;
      urlMapping[prodId] = secureUrl;

      // Update Firestore document with live Cloudinary URL
      await db.collection('products').doc(prodId).update({
        imageUrl: secureUrl,
        updatedAt: new Date()
      });

      console.log(`[OK] ${prodId} -> ${secureUrl}`);
      successCount++;
    } catch (err) {
      console.error(`[ERROR] Failed to upload ${prodId}: ${err.message}`);
    }
  }

  // Save the mapping to mobile and server
  const mappingPath = path.resolve(__dirname, '../../mobile/src/constants/cloudinaryImages.json');
  fs.writeFileSync(mappingPath, JSON.stringify(urlMapping, null, 2), 'utf-8');
  console.log(`\nSaved Cloudinary URL mapping to ${mappingPath}`);

  console.log('==================================================');
  console.log(`[PASS] Uploaded and updated ${successCount} product images on Cloudinary!`);
  console.log('==================================================');
}

uploadAllImages().catch(err => {
  console.error('Fatal upload error:', err);
  process.exit(1);
});
