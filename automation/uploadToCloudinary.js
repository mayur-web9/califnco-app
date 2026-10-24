/**
 * Califnco - Direct Cloudinary Upload Utility (CLI & Module)
 * 
 * Supports:
 *  - Uploading local image files (PNG, JPG, WebP)
 *  - Uploading remote image URLs (CDN sync)
 *  - Unsigned uploads (via upload_preset)
 *  - Signed uploads (via api_key + api_secret HMAC SHA-1)
 * 
 * Usage from Terminal:
 *   node automation/uploadToCloudinary.js <file-or-url> [options]
 * 
 * Examples:
 *   node automation/uploadToCloudinary.js https://images.unsplash.com/photo-1548839140-29a749e1bc4e
 *   node automation/uploadToCloudinary.js ./mobile/assets/icon.png --cloud mycloud --preset mypreset
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// Load environment variables from .env files if present
['../server/.env', '../.env', '.env'].forEach(rel => {
  const p = path.resolve(__dirname, rel);
  if (fs.existsSync(p)) {
    const lines = fs.readFileSync(p, 'utf-8').split('\n');
    lines.forEach(line => {
      const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)?\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
      }
    });
  }
});

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    target: null,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'califnco_marketing',
    apiKey: process.env.CLOUDINARY_API_KEY || null,
    apiSecret: process.env.CLOUDINARY_API_SECRET || null,
    folder: 'califnco_products'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--cloud' || arg === '-c') options.cloudName = args[++i];
    else if (arg === '--preset' || arg === '-p') options.uploadPreset = args[++i];
    else if (arg === '--key' || arg === '-k') options.apiKey = args[++i];
    else if (arg === '--secret' || arg === '-s') options.apiSecret = args[++i];
    else if (arg === '--folder' || arg === '-f') options.folder = args[++i];
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (!options.target && !arg.startsWith('-')) options.target = arg;
  }

  return options;
}

function printHelp() {
  console.log(`
Califnco Direct Cloudinary Upload CLI
--------------------------------------
Usage:
  node automation/uploadToCloudinary.js <file_path_or_url> [options]

Options:
  --cloud, -c     Cloudinary cloud name (or env: CLOUDINARY_CLOUD_NAME)
  --preset, -p    Unsigned upload preset (default: 'califnco_marketing')
  --key, -k       API Key (for signed uploads)
  --secret, -s    API Secret (for signed uploads)
  --folder, -f    Target folder in Cloudinary (default: 'califnco_products')
  --help, -h      Show this help message

PowerShell / curl.exe direct terminal command:
  curl.exe -X POST "https://api.cloudinary.com/v1_1/<YOUR_CLOUD_NAME>/image/upload" \\
    -F "file=@path/to/image.jpg" \\
    -F "upload_preset=<YOUR_PRESET>"
`);
}

async function uploadImage(target, opts) {
  if (!opts.cloudName) {
    console.log('\n❌ Cloudinary Cloud Name is required.');
    console.log('Provide it via:');
    console.log('  1. CLI option: --cloud <your_cloud_name>');
    console.log('  2. Environment: CLOUDINARY_CLOUD_NAME=<name> in server/.env\n');
    console.log('To get free Cloudinary credentials in 60 seconds (no credit card):');
    console.log('  1. Sign up free at https://cloudinary.com');
    console.log('  2. Copy your Cloud name from the Dashboard');
    console.log('  3. Under Settings -> Upload -> Enable "Unsigned Uploads" and name preset "califnco_marketing"\n');
    return null;
  }

  console.log('='.repeat(65));
  console.log('  CALIFNCO CLOUDINARY UPLOAD PIPELINE');
  console.log('='.repeat(65));
  console.log(`• Cloud Name:     ${opts.cloudName}`);
  console.log(`• Target Source:  ${target}`);
  console.log(`• Target Folder:  ${opts.folder}`);

  let filePayload = target;
  let isLocalFile = false;

  // Check if target is a local file
  if (fs.existsSync(target)) {
    isLocalFile = true;
    const stats = fs.statSync(target);
    const ext = path.extname(target).toLowerCase().replace('.', '') || 'jpeg';
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    console.log(`• Local File:     ${path.resolve(target)} (${(stats.size / 1024).toFixed(1)} KB)`);
    const buffer = fs.readFileSync(target);
    filePayload = `data:${mime};base64,${buffer.toString('base64')}`;
  } else if (target.startsWith('http://') || target.startsWith('https://')) {
    console.log(`• Source Type:    Remote Image URL (Downloading stream...)`);
    try {
      const resp = await fetch(target, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(15000)
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      const arrayBuf = await resp.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      const contentType = resp.headers.get('content-type') || 'image/jpeg';
      console.log(`  ✓ Successfully fetched ${(buffer.length / 1024).toFixed(1)} KB image data (${contentType}).`);
      filePayload = `data:${contentType};base64,${buffer.toString('base64')}`;
    } catch (e) {
      console.log(`  ⚠ Fallback: Passing URL directly to Cloudinary (${e.message})`);
      filePayload = target;
    }
  } else {
    console.log(`❌ Target is neither a valid local file nor an HTTP/HTTPS URL: ${target}`);
    return null;
  }

  // Construct request payload
  const postData = {
    file: filePayload,
    folder: opts.folder
  };

  // Signed vs Unsigned
  if (opts.apiKey && opts.apiSecret) {
    const timestamp = Math.round(Date.now() / 1000);
    const toSign = `folder=${opts.folder}&timestamp=${timestamp}${opts.apiSecret}`;
    const signature = crypto.createHash('sha1').update(toSign).digest('hex');
    postData.api_key = opts.apiKey;
    postData.timestamp = timestamp;
    postData.signature = signature;
    console.log(`• Mode:           Signed Upload (HMAC SHA-1 verified)`);
  } else {
    postData.upload_preset = opts.uploadPreset;
    console.log(`• Mode:           Unsigned Upload (Preset: "${opts.uploadPreset}")`);
  }

  console.log('\n▶ Uploading to Cloudinary REST API endpoint...');
  const jsonBody = JSON.stringify(postData);

  return new Promise((resolve, reject) => {
    const req = https.request(`https://api.cloudinary.com/v1_1/${opts.cloudName}/image/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(jsonBody)
      }
    }, (res) => {
      let rawData = '';
      res.on('data', chunk => rawData += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(rawData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('\n' + '='.repeat(65));
            console.log('✅ UPLOAD SUCCESSFUL!');
            console.log('='.repeat(65));
            console.log(`• Public HTTPS URL: ${result.secure_url}`);
            console.log(`• Public ID:        ${result.public_id}`);
            console.log(`• Dimensions:       ${result.width}x${result.height} px`);
            console.log(`• Format & Size:    ${result.format.toUpperCase()} (${(result.bytes / 1024).toFixed(1)} KB)`);
            console.log(`• CDN Host:         ${result.secure_url}`);
            console.log('='.repeat(65));
            resolve(result);
          } else {
            console.log(`\n❌ Cloudinary API Error (${res.statusCode}):`);
            console.log(result.error ? result.error.message : rawData);
            resolve(null);
          }
        } catch (e) {
          console.log(`\n❌ Failed to parse response:`, rawData);
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.log(`\n❌ Network Error connecting to Cloudinary:`, err.message);
      reject(err);
    });

    req.write(jsonBody);
    req.end();
  });
}

// Main execution
const opts = parseArgs();
if (opts.help || !opts.target) {
  printHelp();
  process.exit(0);
}

uploadImage(opts.target, opts).catch(err => {
  console.error('Fatal upload error:', err);
  process.exit(1);
});
