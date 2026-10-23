'use strict';
// Carrega os scripts ES5 do protótipo num contexto isolado do Node (vm),
// do mesmo jeito que o navegador os carrega: em ordem, no escopo global.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SCRIPTS = path.join(__dirname, '..', '..', 'scripts');

function load(files, globals) {
  const context = vm.createContext(Object.assign({ console: { info() {}, warn() {}, error() {} } }, globals));
  for (const file of ['core/namespace.js'].concat(files)) {
    const source = fs.readFileSync(path.join(SCRIPTS, file), 'utf8');
    vm.runInContext(source, context, { filename: file });
  }
  return context.SmartHub;
}

module.exports = { load };
