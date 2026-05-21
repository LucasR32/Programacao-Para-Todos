import fs from 'fs';
import path from 'path';

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const DATA_FOLDER = path.join(process.cwd(), 'data');
const VALID_TRAILS = ['frontend', 'backend', 'banco-de-dados'];

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
      mensagem: 'Método não permitido. Use GET.',
      codigo: 405
    });
  }

  const trailId = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
  if (!trailId || !VALID_TRAILS.includes(trailId)) {
    return sendJson(res, 400, {
      erro: true,
      mensagem: 'Parâmetro id inválido ou ausente.',
      codigo: 400
    });
  }

  try {
    const filePath = path.join(DATA_FOLDER, `trilha-${trailId}.json`);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const nodes = JSON.parse(fileContent);
    return sendJson(res, 200, nodes);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return sendJson(res, 404, {
        erro: true,
        mensagem: 'Trilha não encontrada.',
        codigo: 404
      });
    }
    return sendJson(res, 500, {
      erro: true,
      mensagem: 'Erro interno ao ler os dados da trilha.',
      codigo: 500
    });
  }
}
