// Cloudinary Service for Califnco Admin Web Portal
// Directly uploads images to Cloudinary with secure signature and automatic fallback

const CLOUD_NAME = "pva9vk8g";
const API_KEY = "498722172537564";
const API_SECRET = "AovRo2I_ujbklSQ-Md-OJiBFmHM";
const DEFAULT_FOLDER = "califnco/products";

function sha1(str) {
  function utf8Encode(string) {
    string = string.replace(/\r\n/g, "\n");
    let utftext = "";
    for (let n = 0; n < string.length; n++) {
      let c = string.charCodeAt(n);
      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if (c > 127 && c < 2048) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      } else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
    }
    return utftext;
  }
  function hex(num) {
    let s = "", v;
    for (let i = 7; i >= 0; i--) {
      v = (num >>> (i * 4)) & 0x0f;
      s += v.toString(16);
    }
    return s;
  }
  const x = [];
  const strUtf = utf8Encode(str);
  for (let i = 0; i < strUtf.length * 8; i += 8) {
    x[i >> 5] |= (strUtf.charCodeAt(i / 8) & 0xff) << (24 - (i % 32));
  }
  const l = strUtf.length * 8;
  x[l >> 5] |= 0x80 << (24 - (l % 32));
  x[(((l + 64) >> 9) << 4) + 15] = l;
  const w = new Array(80);
  let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878, e = -1009589776;
  for (let i = 0; i < x.length; i += 16) {
    let olda = a, oldb = b, oldc = c, oldd = d, olde = e;
    for (let j = 0; j < 80; j++) {
      if (j < 16) w[j] = x[i + j] || 0;
      else w[j] = ((w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16]) << 1) | ((w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16]) >>> 31);
      let t = ((((a << 5) | (a >>> 27)) + ((j < 20) ? (b & c) | (~b & d) : (j < 40) ? b ^ c ^ d : (j < 60) ? (b & c) | (b & d) | (c & d) : b ^ c ^ d)) + e + w[j] + ((j < 20) ? 1518500249 : (j < 40) ? 1859775393 : (j < 60) ? -1894007588 : -899497514)) & 0xffffffff;
      e = d; d = c; c = ((b << 30) | (b >>> 2)) & 0xffffffff; b = a; a = t;
    }
    a = (a + olda) & 0xffffffff;
    b = (b + oldb) & 0xffffffff;
    c = (c + oldc) & 0xffffffff;
    d = (d + oldd) & 0xffffffff;
    e = (e + olde) & 0xffffffff;
  }
  return (hex(a) + hex(b) + hex(c) + hex(d) + hex(e)).toLowerCase();
}

/**
 * Upload an image (base64 data URI, File, or Blob) directly to Cloudinary
 * @param {string|File|Blob} imageInput Data URI or File/Blob object
 * @param {string} folder Target Cloudinary folder
 * @returns {Promise<string>} The secure HTTPS Cloudinary URL
 */
export async function uploadImageToCloudinary(imageInput, folder = DEFAULT_FOLDER) {
  if (!imageInput) {
    throw new Error("No image data provided for Cloudinary upload.");
  }

  let fileData = imageInput;

  // If a File object is passed in browser, read as Base64 Data URL
  if (typeof window !== "undefined" && imageInput instanceof File) {
    fileData = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(imageInput);
    });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
  const signature = sha1(toSign);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        file: fileData,
        api_key: API_KEY,
        timestamp: timestamp,
        folder: folder,
        signature: signature
      })
    });

    const data = await response.json();
    if (!response.ok || !data.secure_url) {
      throw new Error(data.error?.message || "Cloudinary direct upload rejected.");
    }
    return data.secure_url;
  } catch (directErr) {
    console.warn("Direct Cloudinary upload failed, attempting backend fallback:", directErr.message);

    // Fallback to server endpoint
    const serverUrl = import.meta.env.VITE_SERVER_URL || "https://califnco-app.onrender.com";
    const fallbackRes = await fetch(`${serverUrl}/upload/image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: fileData,
        folder: folder
      })
    });

    const fallbackData = await fallbackRes.json();
    if (!fallbackRes.ok || !fallbackData.url) {
      throw new Error(fallbackData.error || directErr.message || "Cloudinary image upload failed.");
    }
    return fallbackData.url;
  }
}
