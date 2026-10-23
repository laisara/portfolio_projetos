#!/usr/bin/env node
'use strict';
/*
 * Servidor estático mínimo (somente Node, sem dependências) para abrir
 * o protótipo em http://127.0.0.1:8080. Por padrão escuta apenas em
 * localhost. HOST=0.0.0.0 expõe o protótipo na rede local — use só para
 * o teste autorizado pelo navegador da TV (docs/DEPLOYMENT.md) e encerre
 * o servidor em seguida. Só arquivos de prototype/ são servidos.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', 'prototype');
const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '127.0.0.1';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };

http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(req.url.split('?')[0]);
  } catch (e) {
    res.writeHead(400).end();
    return;
  }
  const file = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
  if (!file.startsWith(ROOT + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404).end('Não encontrado');
      return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, HOST, () => {
  console.log(`Protótipo em http://${HOST}:${PORT} (diagnóstico: /diagnostics.html)`);
  if (HOST !== '127.0.0.1') console.log('ATENÇÃO: acessível pela rede local. Encerre com Ctrl+C após o teste.');
});
