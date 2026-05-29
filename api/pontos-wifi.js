import fs from 'fs';
import path from 'path';

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const DATA_FOLDER = path.join(process.cwd(), 'data');

function sendJson(res, status, payload) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.statusCode = status;
  res.end(JSON.stringify(payload));
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, {
      erro: true,
      mensagem: 'Metodo nao permitido. Use GET.',
      codigo: 405,
    });
  }

  try {
    const filePath = path.join(DATA_FOLDER, 'pontos-wifi.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const pontosWifi = JSON.parse(fileContent);

    return sendJson(res, 200, pontosWifi);
  } catch (error) {
    return sendJson(res, 500, {
      erro: true,
      mensagem: 'Erro interno ao ler os pontos de Wi-Fi.',
      codigo: 500,
    });
  }
}
