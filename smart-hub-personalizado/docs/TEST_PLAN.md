# Plano de testes

> Um teste aprovado no navegador moderno **não** prova que o código funciona no ambiente
> legado da TV. Os níveis abaixo são independentes.

## Níveis

| Nível | Ferramenta | Comando | Prova o quê |
|---|---|---|---|
| U — Unitário | `node:test` (Node ≥ 20) | `npm run test:unit` | Lógica pura (foco, teclas, roteador, armazenamento, preferências, relógio, biblioteca) |
| L — Compatibilidade estática | `acorn` | `npm run check:legacy` | Código analisável como ES5, sem APIs modernas listadas e CSS sem recursos evitados. **Não** prova a execução na TV |
| E — Ponta a ponta | Playwright + Chromium | `npm run test:e2e` | Comportamento completo da interface por teclado, num navegador **moderno** |
| H — Hardware | TV real | manual | Compatibilidade real. **Pendente de autorização** |

## Casos de teste e resultados

Execução de 23/10/2026: Node 22.22.0, Chromium do Playwright 1.63, Linux.

### Unitários (U) — 20/20 aprovados

| ID | Caso | Resultado |
|---|---|---|
| U-01 | Foco horizontal para nos limites da linha | Aprovado |
| U-02 | Foco vertical pula linhas vazias, limita a coluna e lembra a coluna | Aprovado |
| U-03 | Linha ancorada (barra de abas) sempre recebe o foco na aba ativa | Aprovado |
| U-04 | Sair de linha ancorada não herda a coluna dela | Aprovado |
| U-05 | Tela sem itens focáveis não gera posição inválida | Aprovado |
| U-06 | Restaurar foco depois que as linhas mudam | Aprovado |
| U-07 | Mapeamento de teclas e teclas desconhecidas | Aprovado |
| U-08 | Segurar seta: repetição limitada. Segurar ENTER: não repete | Aprovado |
| U-09 | Roteador: empilhar, voltar e trocar raiz | Aprovado |
| U-10 | Armazenamento: grava e lê em JSON | Aprovado |
| U-11 | Armazenamento: valor corrompido devolve o padrão | Aprovado |
| U-12 | Armazenamento: backend com falha passa para memória sem erro | Aprovado |
| U-13 | Armazenamento: funciona sem backend | Aprovado |
| U-14 | Preferências: padrões, ciclo, favoritos e persistência | Aprovado |
| U-15 | Preferências: dados inválidos substituídos pelos padrões | Aprovado |
| U-16 | Data e hora em português sem `Intl` | Aprovado |
| U-17 | Calendário: matriz do mês e troca de mês e ano | Aprovado |
| U-18 | Biblioteca: estados vazio, demonstração e erro de integração | Aprovado |
| U-19 | Catálogo: todo serviço tem status conhecido | Aprovado |
| U-20 | Logger: buffer circular | Aprovado |

### Compatibilidade estática (L) — aprovado

| ID | Caso | Resultado |
|---|---|---|
| L-01 | `prototype/scripts/**` e `platform/adapters/**` analisáveis como ES5 | Aprovado |
| L-02 | Scripts embutidos em `index.html` e `diagnostics.html` analisáveis como ES5 | Aprovado |
| L-03 | Sem `Promise`, `fetch`, `classList`, `Intl`, `Map`/`Set`, `includes` etc. | Aprovado |
| L-04 | CSS sem variáveis, flexbox, grid, `calc()` e filtros | Aprovado |
| L-05 | O verificador detecta violações (sanidade): arquivo com `let` e `display:flex` foi rejeitado | Aprovado (teste manual) |

### Ponta a ponta (E) — 11/11 aprovados

| ID | Caso | Resultado |
|---|---|---|
| E-01 | Carrega sem erros, abre o Início com foco no destaque e exibe o selo SIMULAÇÃO | Aprovado |
| E-02 | Navegação horizontal e vertical previsível. Não perde o foco nas bordas | Aprovado |
| E-03 | Segurar a seta não "atropela" a navegação | Aprovado |
| E-04 | Selecionar aba, abrir cartão e voltar com o foco restaurado | Aprovado |
| E-05 | "Abrir aplicativo" informa que não há integração comprovada | Aprovado |
| E-06 | Favorito e cor de destaque persistem após recarregar a página | Aprovado |
| E-07 | Biblioteca: estado vazio, erro de integração simulado e dados de demonstração | Aprovado |
| E-08 | Sem internet (`setOffline`): o indicador muda e relógio e calendário funcionam | Aprovado |
| E-09 | Voltar numa aba leva ao Início. No Início, pede confirmação para sair | Aprovado |
| E-10 | A tela 16:9 cabe em 1920×1080, 1366×768, 1280×720, 1024×768 e 800×600 | Aprovado |
| E-11 | Nenhum erro de JavaScript durante a sessão | Aprovado |

O teste E usa somente o teclado: nenhum clique ou toque.

### Hardware (H) — pendente

Ver a definição em [FEASIBILITY.md §9](FEASIBILITY.md#9-testes-necessários-para-confirmar-a-compatibilidade).

| ID | Caso | Estado |
|---|---|---|
| H-01 | Inventário de menus, apps e versão | Pendente (sem autorização) |
| H-02 | Protótipo abre no navegador da TV | Pendente |
| H-03 | `diagnostics.html`: recursos (ES5, JSON, localStorage, transform) | Pendente |
| H-04 | `diagnostics.html`: códigos das teclas do controle | Pendente |
| H-05 | Fluidez da navegação no aparelho | Pendente |
| H-06 | Menu *IP Setting* / conta `develop` existe? (só observação) | Pendente. Depende do SDK oficial |
| H-07 | Instalar e remover um app "olá mundo" próprio | Pendente. Depende de H-06 |

Modelo de registro para testes H: data, versão de firmware exibida, método, passos,
resultado, fotos e respostas às 8 perguntas de [SECURITY.md](SECURITY.md#antes-de-qualquer-teste-no-aparelho).

## Pendências

| ID | Pendência |
|---|---|
| T-01 | Executar os testes H após autorização |
| T-02 | Emulador oficial do SDK 5.x: localizar, documentar a configuração e os limites (D-07) |
| T-03 | Medir o tempo de renderização e o uso de memória no aparelho (não há como medir no PC de forma representativa) |
| T-04 | Validar a legibilidade a 2–3 m de distância numa TV de 48" |
| T-05 | Os testes E dependem de Playwright instalado. Não é dependência do projeto (ver README) |
