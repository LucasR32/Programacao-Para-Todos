import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import trilhasHandler from './trilhas.js';
import trilhaHandler from './trilha.js';
import noHandler from './no.js';
import pontosWifiHandler from './pontos-wifi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const STATIC_FOLDER = path.join(process.cwd(), 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif'
};

function getContentType(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function sendNotFound(res) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Not Found');
}

function sendFile(res, filePath) {
  const stream = fs.createReadStream(filePath);
  res.statusCode = 200;
  res.setHeader('Content-Type', getContentType(filePath));
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  stream.pipe(res);
}

function isInsideStaticFolder(filePath) {
  const relativePath = path.relative(STATIC_FOLDER, filePath);
  return relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
}

function serveStatic(req, res, pathname) {
  // Prevent directory traversal
  const safePath = path.normalize(pathname).replace(/^\.+/, '');
  const filePath = path.join(STATIC_FOLDER, safePath);

  // If the path is a directory, try index.html inside it
  let finalPath = filePath;
  try {
    const stats = fs.statSync(finalPath);
    if (stats.isDirectory()) finalPath = path.join(finalPath, 'index.html');
  } catch (e) {
    // file/directory doesn't exist — continue to try to serve as-is
  }

  if (!isInsideStaticFolder(finalPath)) {
    return sendNotFound(res);
  }

  fs.stat(finalPath, (err, stats) => {
    if (!err && stats.isFile()) {
      return sendFile(res, finalPath);
    }

    const fallbackPath = path.join(STATIC_FOLDER, 'index.html');
    fs.stat(fallbackPath, (fallbackErr, fallbackStats) => {
      if (fallbackErr || !fallbackStats.isFile()) return sendNotFound(res);
      return sendFile(res, fallbackPath);
    });
  });
}

function parseQuery(urlObj) {
  const q = Object.create(null);
  for (const [k, v] of urlObj.searchParams) {
    if (q[k] === undefined) q[k] = v;
    else if (Array.isArray(q[k])) q[k].push(v);
    else q[k] = [q[k], v];
  }
  return q;
}

const server = http.createServer((req, res) => {
  try {
    const base = `http://${req.headers.host}`;
    const urlObj = new URL(req.url, base);
    const pathname = urlObj.pathname;

    if (!pathname.startsWith('/api')) {
      // serve static files from the Vite production build
      // remove leading slash
      const relPath = pathname.replace(/^\//, '') || 'index.html';
      return serveStatic(req, res, relPath);
    }

    // API routing
    // attach parsed query to req in the same shape handlers expect
    req.query = parseQuery(urlObj);

    if (pathname === '/api/trilhas') return trilhasHandler(req, res);
    if (pathname === '/api/trilha') return trilhaHandler(req, res);
    if (pathname === '/api/no') return noHandler(req, res);
    if (pathname === '/api/pontos-wifi') return pontosWifiHandler(req, res);

    // Unknown API route
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
    res.end(JSON.stringify({ erro: true, mensagem: 'Rota não encontrada', codigo: 404 }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ erro: true, mensagem: 'Erro interno', detalhe: String(err) }));
  }
});

server.listen(PORT, () => {
  console.log(`Dev server listening on PORT=${PORT}`);
});

export default server;
