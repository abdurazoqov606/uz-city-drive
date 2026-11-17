export default async function handler(req, res) {
  const url = 'https://github.com/abdurazoqov606/uz-city-drive/releases/download/v1.0/malibu.glb';
  const response = await fetch(url);
  if (!response.ok) {
    return res.status(response.status).send('Fayl topilmadi');
  }
  


# 1. Eski vercel.json ni olib tashlaymiz va api papkasini ochamiz
rm -f vercel.json
mkdir -p api

# 2. Vercel Serverless Proxy funksiyasini yaratamiz
cat << 'EOF' > api/malibu.js
export default async function handler(req, res) {
  const url = 'https://github.com/abdurazoqov606/uz-city-drive/releases/download/v1.0/malibu.glb';
  const response = await fetch(url);
  if (!response.ok) {
    return res.status(response.status).send('Fayl topilmadi');
  }
  



# 1. Eski vercel.json ni o'chiramiz va api papkasini ochamiz
rm -f vercel.json
mkdir -p api

# 2. Vercel server funksiyasini yaratamiz (redirect va CORS ni avtomatik hal qiladi)
cat << 'EOF' > api/malibu.js
export default async function handler(req, res) {
  const url = 'https://github.com/abdurazoqov606/uz-city-drive/releases/download/v1.0/malibu.glb';
  try {
    const response = await fetch(url, { redirect: 'follow' });
    if (!response.ok) {
      return res.status(response.status).send('GitHub xatosi: ' + response.statusText);
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'model/gltf-binary');
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    const { Readable } = await import('node:stream');
    Readable.fromWeb(response.body).pipe(res);
  } catch (err) {
    res.status(500).send('Server xatosi: ' + err.message);
  }
}
