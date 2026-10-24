const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function getFolderStats(dirPath) {
  if (!fs.existsSync(dirPath)) return { totalBytes: 0, count: 0, formatted: '0 MB' };
  let totalBytes = 0;
  let count = 0;
  fs.readdirSync(dirPath).forEach(file => {
    const p = path.join(dirPath, file);
    const stat = fs.statSync(p);
    if (stat.isFile()) {
      totalBytes += stat.size;
      count++;
    }
  });
  return {
    totalBytes,
    count,
    formatted: (totalBytes / (1024 * 1024)).toFixed(2) + ' MB'
  };
}

async function resizeFolder(dirPath, label) {
  const absPath = path.resolve(dirPath);
  if (!fs.existsSync(absPath)) {
    console.log(`Directory does not exist: ${absPath}`);
    return;
  }

  const files = fs.readdirSync(absPath).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
  console.log(`Processing ${files.length} images in ${label} (${absPath})...`);

  for (const file of files) {
    const filePath = path.join(absPath, file);
    const tempPath = path.join(absPath, `_temp_${file}`);

    try {
      await sharp(filePath)
        .resize({ width: 800, withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toFile(tempPath);

      // Replace original with resized version
      fs.unlinkSync(filePath);
      fs.renameSync(tempPath, filePath);
    } catch (err) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      console.error(`Error resizing ${file}:`, err.message);
    }
  }
}

async function main() {
  const serverProductsDir = path.resolve(__dirname, '../public/products');
  const mobileProductsDir = path.resolve(__dirname, '../../mobile/assets/products');

  console.log('='.repeat(60));
  console.log('   TASK C: PRODUCT IMAGE RESIZING (800px, JPEG quality 80)');
  console.log('='.repeat(60));

  const serverBefore = getFolderStats(serverProductsDir);
  const mobileBefore = getFolderStats(mobileProductsDir);

  console.log('\n--- BEFORE RESIZING ---');
  console.log(`server/public/products: ${serverBefore.formatted} (${serverBefore.count} files, ${serverBefore.totalBytes} bytes)`);
  console.log(`mobile/assets/products: ${mobileBefore.formatted} (${mobileBefore.count} files, ${mobileBefore.totalBytes} bytes)`);
  console.log(`Total footprint before: ${((serverBefore.totalBytes + mobileBefore.totalBytes) / (1024 * 1024)).toFixed(2)} MB\n`);

  console.log('--- RESIZING WITH SHARP ---');
  await resizeFolder(serverProductsDir, 'server/public/products');
  await resizeFolder(mobileProductsDir, 'mobile/assets/products');

  const serverAfter = getFolderStats(serverProductsDir);
  const mobileAfter = getFolderStats(mobileProductsDir);

  console.log('\n--- AFTER RESIZING ---');
  console.log(`server/public/products: ${serverAfter.formatted} (${serverAfter.count} files, ${serverAfter.totalBytes} bytes)`);
  console.log(`mobile/assets/products: ${mobileAfter.formatted} (${mobileAfter.count} files, ${mobileAfter.totalBytes} bytes)`);
  console.log(`Total footprint after:  ${((serverAfter.totalBytes + mobileAfter.totalBytes) / (1024 * 1024)).toFixed(2)} MB`);
  
  const savedBytes = (serverBefore.totalBytes + mobileBefore.totalBytes) - (serverAfter.totalBytes + mobileAfter.totalBytes);
  console.log(`Total disk space saved: ${(savedBytes / (1024 * 1024)).toFixed(2)} MB (${((savedBytes / (serverBefore.totalBytes + mobileBefore.totalBytes)) * 100).toFixed(1)}% reduction)\n`);
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
