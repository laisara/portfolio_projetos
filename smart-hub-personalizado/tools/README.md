# tools/ — Ferramentas de desenvolvimento

Ferramentas que rodam **no computador**. Nenhuma delas se comunica com a TV.

| Ferramenta | Comando | O que faz |
|---|---|---|
| `check-legacy-compat.js` | `npm run check:legacy` | Analisa `prototype/scripts` como ECMAScript 5 (parser `acorn`), procura APIs modernas não garantidas (Promise, fetch, classList, Intl...) e recursos CSS evitados (variáveis, flexbox, grid, calc, filtros). |
| `serve.js` | `npm run serve` | Servidor estático só com Node, escutando em `127.0.0.1:8080`, para abrir o protótipo no navegador. |

## Por que `acorn`

É a única dependência de desenvolvimento: um parser JavaScript pequeno, sem dependências
próprias, mantido há muitos anos e usado por ferramentas como ESLint e webpack. Ele permite
verificar de forma objetiva se o código é ES5 válido. Não é enviado para a TV.

## Ferramentas **não** incluídas

- **SDK legado da Samsung (Smart TV SDK 5.x)**: não foi baixado. Ver avaliação em
  [`docs/FEASIBILITY.md`](../docs/FEASIBILITY.md#sdks-e-ferramentas-identificados).
- **Firmware, ferramentas de root, utilitários de terceiros para a TV**: excluídos por política
  ([`docs/SECURITY.md`](../docs/SECURITY.md)).
