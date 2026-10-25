const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Load environment variables from server/.env or root .env
['../server/.env', '.env', 'server/.env'].forEach(rel => {
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

let cloudinary;
try {
  cloudinary = require('cloudinary').v2;
} catch (e) {
  try {
    cloudinary = require(path.resolve(__dirname, '../server/node_modules/cloudinary')).v2;
  } catch (err) {
    // Cloudinary SDK will be checked at runtime
  }
}

const isDryRun = process.argv.includes('--dry-run');

// Helper to make fetch with timeout
async function fetchWithTimeout(url, options = {}, timeoutMs = 60000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// 1. Fetch next product from catalog rotation with 60s timeout and 3 retries
async function fetchNextProduct() {
  const serverUrl = process.env.SERVER_URL || process.env.BACKEND_URL || 'https://califnco-app.onrender.com';
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`[Step 1/5] Fetching next product from ${serverUrl}/automation/next-product (attempt ${attempt}/3)...`);
    try {
      const res = await fetchWithTimeout(`${serverUrl}/automation/next-product`, {
        headers: { 'User-Agent': 'Califnco-Automation/1.0' }
      }, 60000);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (!data || !data.product) {
        throw new Error('Response did not contain a product object');
      }

      console.log(`  Product retrieved: "${data.product.name}" (${data.product.id})`);
      console.log(`  Category: ${data.product.category} | Price: Rs. ${data.product.price}`);
      return data.product;
    } catch (err) {
      lastError = err;
      console.warn(`  Attempt ${attempt} failed: ${err.message}`);
      if (attempt < 3) {
        console.log('  Waiting 3 seconds before retry...');
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }

  console.error(`FATAL: Failed to fetch next product from catalog after 3 attempts: ${lastError?.message}`);
  process.exit(1);
}

// 2. Discover available Groq models at runtime and select primary or active fallback
async function selectGroqModel(apiKey) {
  const primaryModel = 'llama-3.3-70b-versatile';
  try {
    const res = await fetchWithTimeout('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    }, 15000);

    if (res.ok) {
      const data = await res.json();
      const availableIds = Array.isArray(data?.data) ? data.data.map(m => m.id) : [];

      if (availableIds.includes(primaryModel)) {
        return { selectedModel: primaryModel, allModels: [primaryModel] };
      }

      // Find at most one valid text-generation fallback from available models
      const preferredFallbacks = [
        'llama-3.1-70b-versatile',
        'llama-3.1-8b-instant',
        'mixtral-8x7b-32768',
        'gemma2-9b-it',
        'openai/gpt-oss-120b'
      ];

      const matchedFallback = preferredFallbacks.find(fb => availableIds.includes(fb)) || availableIds.find(id => !id.includes('whisper') && !id.includes('guard'));

      if (matchedFallback) {
        return {
          selectedModel: matchedFallback,
          allModels: [primaryModel, matchedFallback]
        };
      }
    }
  } catch (err) {
    console.warn(`  Notice: Unable to query Groq models endpoint (${err.message}). Using primary model.`);
  }

  return { selectedModel: primaryModel, allModels: [primaryModel] };
}

// Strip all markdown characters from text
function stripMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    .replace(/^#+\s+/gm, '')
    .trim();
}

// Generate compliant caption via Groq or deterministic dry-run generator
async function generateCaption(product) {
  if (isDryRun) {
    const lines = [
      `${product.name}`,
      `Category: ${product.category}`,
      `Price: Rs. ${Number(product.price).toLocaleString('en-IN')}`,
      product.description ? product.description.split('.')[0] + '.' : 'Engineered for clean, safe daily drinking water.'
    ];
    const cta = 'Explore specifications and place orders on the Califnco app.';
    const hashtags = '#Califnco #WaterPurifier #DrinkingWater #CleanWater #WaterFiltration #HomeAppliances';
    const dryCaption = `${lines.join('\n')}\n\n${cta}\n\n${hashtags}`;

    return {
      caption: dryCaption,
      modelUsed: 'llama-3.3-70b-versatile (dry-run deterministic)'
    };
  }

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    console.error('FATAL: GROQ_API_KEY is not set in environment.');
    process.exit(1);
  }

  const { selectedModel } = await selectGroqModel(groqApiKey);

  const systemPrompt = `You are a copywriter for Califnco. Write an Instagram caption based STRICTLY on the facts in the product document provided.
STRICT NEGATIVE CONSTRAINTS:
- Do NOT invent discounts, "festive offers", sales, or percentage-off claims.
- Do NOT make delivery or installation promises.
- Do NOT make medical, cure, or unverified health claims.
- Output MUST be 2 to 4 short lines of factual product details.
- Include exactly ONE call to action mentioning the Califnco app.
- Conclude with 5 to 8 relevant hashtags at the end.
- Do NOT use markdown: NO bold (**), NO italics (*), NO headings (#), NO backticks.
- Maximum length 2000 characters.`;

  const userPrompt = `Product Name: ${product.name}
Category: ${product.category}
Price: Rs. ${product.price}
Specs / Description: ${product.description || 'Domestic water purification unit'}`;

  const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5
    })
  }, 30000);

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API returned HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const rawCaption = data?.choices?.[0]?.message?.content || '';
  if (!rawCaption) {
    throw new Error('Groq returned empty caption completion');
  }

  const cleanCaption = stripMarkdown(rawCaption).slice(0, 2000);
  return {
    caption: cleanCaption,
    modelUsed: selectedModel
  };
}

// Validate image buffer format (JPEG or PNG) and size (> 10 KB)
function validateImageBuffer(buffer) {
  if (!Buffer.isBuffer(buffer)) return false;
  if (buffer.length <= 10240) return false;

  // JPEG magic bytes: FF D8 FF
  const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  // PNG magic bytes: 89 50 4E 47
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;

  return isJpeg || isPng;
}

// 3. Generate image: Hugging Face FLUX.1-schnell first, Pollinations FLUX on failure
async function generateProductImage(product) {
  const prompt = `clean product photograph of ${product.name}, white or neutral studio background, no text, no logos, no people, centred`;
  const hfKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;

  if (isDryRun) {
    // Generate valid 12 KB PNG buffer for dry-run validation without remote network calls
    const dummyBuffer = Buffer.alloc(12000);
    dummyBuffer[0] = 0x89;
    dummyBuffer[1] = 0x50;
    dummyBuffer[2] = 0x4E;
    dummyBuffer[3] = 0x47;
    return {
      buffer: dummyBuffer,
      provider: 'Hugging Face FLUX.1-schnell (dry-run simulation)'
    };
  }

  // Provider 1: Hugging Face FLUX.1-schnell via router endpoint
  if (hfKey) {
    console.log('[Step 3/5] Attempting image generation via Hugging Face FLUX.1-schnell...');
    try {
      const hfRes = await fetchWithTimeout('https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: prompt })
      }, 35000);

      if (hfRes.ok) {
        const arrayBuf = await hfRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        if (validateImageBuffer(buffer)) {
          console.log(`  Image generated by Hugging Face FLUX.1-schnell (${(buffer.length / 1024).toFixed(1)} KB)`);
          return { buffer, provider: 'Hugging Face FLUX.1-schnell' };
        }
      } else {
        const status = hfRes.status;
        console.warn(`  Hugging Face router returned HTTP ${status}. Falling back to Pollinations.`);
      }
    } catch (err) {
      console.warn(`  Hugging Face generation attempt failed (${err.message}). Falling back to Pollinations.`);
    }
  }

  // Provider 2: Pollinations FLUX engine
  console.log('[Step 3/5] Generating image via Pollinations FLUX...');
  try {
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&width=1080&height=1080&nologo=true`;
    const res = await fetchWithTimeout(pollinationsUrl, {
      headers: { 'User-Agent': 'Califnco-Automation/1.0' }
    }, 45000);

    if (!res.ok) {
      throw new Error(`Pollinations HTTP ${res.status}: ${res.statusText}`);
    }

    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    if (!validateImageBuffer(buffer)) {
      throw new Error(`Generated buffer failed validation (size: ${buffer.length} bytes; must be JPEG/PNG > 10KB)`);
    }

    console.log(`  Image generated by Pollinations FLUX (${(buffer.length / 1024).toFixed(1)} KB)`);
    return { buffer, provider: 'Pollinations FLUX' };
  } catch (err) {
    console.error(`FATAL: All image generation providers failed (${err.message}). Never substituting catalog photo.`);
    process.exit(1);
  }
}

// 4. Upload to Cloudinary using signed credentials SDK
async function uploadToCloudinary(imageBuffer, productId) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error('FATAL: Cloudinary credentials missing (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).');
    process.exit(1);
  }

  if (!cloudinary) {
    console.error('FATAL: Cloudinary SDK not loaded.');
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });

  const now = new Date();
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
  const publicId = `${productId}-${yyyymmdd}`;

  if (isDryRun) {
    const simulatedSecureUrl = `https://res.cloudinary.com/${cloudName}/image/upload/v1/califnco/daily-posts/${publicId}.jpg`;
    const simulatedInstagramUrl = `https://res.cloudinary.com/${cloudName}/image/upload/f_jpg,c_fill,ar_1:1,w_1080,q_auto/v1/califnco/daily-posts/${publicId}.jpg`;
    return {
      secureUrl: simulatedSecureUrl,
      instagramImageUrl: simulatedInstagramUrl,
      publicId: `califnco/daily-posts/${publicId}`
    };
  }

  console.log(`[Step 4/5] Uploading image to Cloudinary (folder: califnco/daily-posts, public_id: ${publicId})...`);

  const uploadResult = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'califnco/daily-posts',
        public_id: publicId,
        overwrite: true,
        resource_type: 'image'
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result || !result.secure_url || !result.secure_url.startsWith('https://')) {
          return reject(new Error('Cloudinary response missing HTTPS secure_url'));
        }
        resolve(result);
      }
    );
    uploadStream.end(imageBuffer);
  });

  const secureUrl = uploadResult.secure_url;
  const instagramImageUrl = secureUrl.replace('/upload/', '/upload/f_jpg,c_fill,ar_1:1,w_1080,q_auto/');

  console.log(`  Cloudinary secure_url: ${secureUrl}`);
  console.log(`  Instagram-optimized URL: ${instagramImageUrl}`);

  // Confirm with HEAD request that it returns HTTP 200 and image/jpeg
  console.log('  Verifying Instagram image URL with HEAD request...');
  const headRes = await fetchWithTimeout(instagramImageUrl, { method: 'HEAD' }, 20000);

  if (headRes.status !== 200) {
    throw new Error(`Cloudinary Instagram URL HEAD check failed with status ${headRes.status}`);
  }

  const contentType = headRes.headers.get('content-type') || '';
  if (!contentType.includes('image/jpeg') && !contentType.includes('image/jpg')) {
    throw new Error(`Cloudinary Instagram URL HEAD check returned unexpected content type: ${contentType}`);
  }

  console.log(`  HEAD check verified: HTTP ${headRes.status} (${contentType})`);

  return {
    secureUrl,
    instagramImageUrl,
    publicId: uploadResult.public_id
  };
}

// 5. Meta Graph API Publishing
async function publishToInstagram(instagramImageUrl, caption) {
  const metaToken = process.env.META_ACCESS_TOKEN;
  const igUserId = process.env.IG_USER_ID;
  const graphVersion = process.env.META_GRAPH_VERSION || 'v21.0';

  if (!metaToken || !igUserId) {
    console.log('\nNOT POSTED: Meta credentials missing (META_ACCESS_TOKEN, IG_USER_ID)');
    process.exit(2);
  }

  console.log(`[Step 5/5] Publishing post to Instagram Graph API (${graphVersion})...`);

  // Step A: Create media container
  const createMediaUrl = `https://graph.facebook.com/${graphVersion}/${igUserId}/media`;
  const containerRes = await fetchWithTimeout(createMediaUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: instagramImageUrl,
      caption: caption,
      access_token: metaToken
    })
  }, 20000);

  const containerData = await containerRes.json();
  if (!containerRes.ok || !containerData.id) {
    const code = containerData.error?.code || 'UNKNOWN';
    const message = containerData.error?.message || JSON.stringify(containerData);
    console.error(`Meta API Error during container creation (Code: ${code}): ${message}`);
    process.exit(1);
  }

  const containerId = containerData.id;
  console.log(`  Media container created: ${containerId}`);

  // Step B: Poll container status until FINISHED (max 60 seconds)
  const startTime = Date.now();
  let isFinished = false;

  while (Date.now() - startTime < 60000) {
    await new Promise(r => setTimeout(r, 3000));
    const statusRes = await fetchWithTimeout(
      `https://graph.facebook.com/${graphVersion}/${containerId}?fields=status_code&access_token=${metaToken}`,
      {},
      10000
    );
    const statusData = await statusRes.json();

    if (statusData.status_code === 'FINISHED') {
      isFinished = true;
      break;
    } else if (statusData.status_code === 'ERROR') {
      console.error(`Meta Container Processing Error: ${JSON.stringify(statusData)}`);
      process.exit(1);
    }
  }

  if (!isFinished) {
    console.error('Meta container polling timed out after 60 seconds');
    process.exit(1);
  }

  // Step C: Publish media
  const publishUrl = `https://graph.facebook.com/${graphVersion}/${igUserId}/media_publish`;
  const publishRes = await fetchWithTimeout(publishUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: containerId,
      access_token: metaToken
    })
  }, 20000);

  const publishData = await publishRes.json();
  if (!publishRes.ok || !publishData.id) {
    const code = publishData.error?.code || 'UNKNOWN';
    const message = publishData.error?.message || JSON.stringify(publishData);
    console.error(`Meta API Error during publish (Code: ${code}): ${message}`);
    process.exit(1);
  }

  const mediaId = publishData.id;

  // Step D: Fetch permalink
  const permalinkRes = await fetchWithTimeout(
    `https://graph.facebook.com/${graphVersion}/${mediaId}?fields=permalink&access_token=${metaToken}`,
    {},
    10000
  );
  const permalinkData = await permalinkRes.json();
  const permalink = permalinkData.permalink || `https://instagram.com/p/${mediaId}`;

  console.log(`  Instagram Post Published Successfully!`);
  console.log(`  Media ID: ${mediaId}`);
  console.log(`  Permalink: ${permalink}`);

  return { mediaId, permalink };
}

// 6. Optional WAHA Status broadcast
async function broadcastToWaha(imageUrl, caption) {
  const wahaUrl = process.env.WAHA_URL;
  if (!wahaUrl) {
    console.log('WAHA Status: Skipped (WAHA_URL not configured)');
    return;
  }

  console.log(`Broadcasting image to WAHA instance at ${wahaUrl}...`);
  try {
    const res = await fetchWithTimeout(`${wahaUrl}/api/sendImage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session: 'default',
        chatId: 'status@broadcast',
        file: { url: imageUrl },
        caption: caption
      })
    }, 15000);

    if (res.ok) {
      console.log('WAHA Status: Ran successfully (Status: 200 OK)');
    } else {
      console.log(`WAHA Status: Attempted but returned HTTP ${res.status}; pipeline not blocked`);
    }
  } catch (err) {
    console.log(`WAHA Status: Attempted but failed (${err.message}); pipeline not blocked`);
  }
}

async function main() {
  console.log('======================================================================');
  console.log('         CALIFNCO DAILY SOCIAL POST AUTOMATION ENGINE');
  console.log('======================================================================\n');

  // Step 1: Catalog rotation
  const product = await fetchNextProduct();

  // Step 2: Groq caption generation
  console.log('\n[Step 2/5] Generating factual caption via Groq...');
  const { caption, modelUsed } = await generateCaption(product);
  console.log(`  Model actually used: ${modelUsed}`);
  console.log('  Caption:\n---');
  console.log(caption);
  console.log('---');

  // Step 3: Image synthesis
  const { buffer, provider } = await generateProductImage(product);
  console.log(`  Image provider logged: ${provider}`);

  // Step 4: Cloudinary upload & HEAD check
  const { secureUrl, instagramImageUrl, publicId } = await uploadToCloudinary(buffer, product.id);

  // Step 5: Optional WAHA broadcast
  console.log('\n[Optional Channel] WAHA WhatsApp Broadcast:');
  await broadcastToWaha(instagramImageUrl, caption);

  // Step 6: Instagram Publishing
  console.log('\n[Step 5/5] Meta Instagram Publishing:');
  const metaPost = await publishToInstagram(instagramImageUrl, caption);

  console.log('\n======================================================================');
  console.log('         DAILY POST PIPELINE COMPLETED SUCCESSFULLY');
  console.log(`  Product:      ${product.name} (${product.id})`);
  console.log(`  Copy Model:   ${modelUsed}`);
  console.log(`  Image Engine: ${provider}`);
  console.log(`  Cloudinary:   ${secureUrl}`);
  console.log(`  Instagram:    ${metaPost ? metaPost.permalink : 'NOT POSTED'}`);
  console.log('======================================================================');
}

main().catch(err => {
  console.error('\nFATAL PIPELINE EXECUTION ERROR:', err.message);
  process.exit(1);
});
