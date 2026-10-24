# Plano de testes — Aurora TV 0.2

> **Estática** = só ferramenta sobre o código. **Lógica** = BrightScript executado em `brs-cli`.
> **Simulador** = app completo no brs-engine (de terceiros, **não é o Roku OS**).
> **Dispositivo** = Roku Express 3960BR. **Nenhum teste foi executado no dispositivo.**

## Como executar

```bash
cd aurora-roku
npm install
npm test                       # bsc + bslint + check-project + check-docs + testes de lógica
npm run simulate               # roteiro de 48 verificações + capturas em docs/screenshots (requer Playwright/Chromium)
python3 tools/package.py       # out/aurora-tv.zip (somente o app)
python3 tools/package_source.py  # dist/aurora-roku-source-<versão>.zip (código + recursos + docs)
```

Procedimento no aparelho (**somente com autorização explícita**): seguir
[tests/manual-test-checklist.md](tests/manual-test-checklist.md).

## 1. Testes estáticos (executados em 24/10/2026)

| ID | Teste | Esperado | Observado |
|---|---|---|---|
| E1 | Compilação BrightScript/XML com `bsc` 0.73.8 | 0 erros | 0 erros |
| E2 | Lint `bslint` 0.8.47 (variáveis não usadas, retornos, cores fora do tema) | 0 diagnósticos | 0 diagnósticos |
| E3 | `tools/check-project.js`: estrutura, manifest, dimensões de ícone/splash, nós usados, imagens de cada título, 9-patch, ausência de URL/credencial, grade de 3 px | 0 erros, 0 avisos | 0 erros, 0 avisos |
| E4 | `tools/check-docs.js`: documentos obrigatórios, links relativos, caminhos citados, seções do FINAL_REPORT | 0 erros | 0 erros (22 caminhos verificados) |
| E5 | Eficiência de imagens: maior textura carregada pela UI | ≤ 4 MB (fundo 1280×720×4 B) | 3,5 MB (a01.jpg); pacote ≈ 3,8 MB sem compressão |
| E6 | Imagens remotas | nenhuma | nenhuma (verificado em E3) |

## 2. Testes de lógica (`tests/unit/LogicTests.brs`, `brs-cli`)

Esperado: todos aprovados. **Observado: 81 aprovados, 0 reprovados.** Cobrem: hierarquia do
Voltar e ausência de ciclos de estado; movimento em grade (pontas sem laço, linhas de tamanhos
diferentes); teclado e busca (acentos, múltiplas palavras, limite de 24, espaços);
favoritos e estado salvo corrompido; temas; consistência e **dados vazios/incompletos**
(`DemoContent_safeItem` devolve `invalid`, itens ausentes são ignorados); ordenação própria.

## 3. Roteiro no simulador (execução de 24/10/2026, código final)

Configuração: `deviceModel 3960X`, `displayMode 720p`. Teclas usadas: só up/down/left/right/
select/back. Verificação por rastros `AURORA_*` no console. **Observado: 48/48, 0 erros de console.**

| # | Verificação | Resultado |
|---|---|---|
| S1 | App inicia na tela Início | Aprovado |
| S2 | Banner 1 de 5 aparece na abertura | Aprovado |
| S3 | Direita avança para o banner 2 | Aprovado |
| S4 | Três vezes à direita chegam ao banner 5 | Aprovado |
| S5 | Direita no último banner é consumida (sem dar a volta) | Aprovado |
| S6 | Quatro vezes à esquerda voltam ao banner 1 | Aprovado |
| S7 | Esquerda no primeiro banner é consumida | Aprovado |
| S8 | OK no banner abre os detalhes do título em destaque | Aprovado |
| S9 | Foco vai para a camada de detalhes | Aprovado |
| S10 | Voltar fecha os detalhes e devolve o foco ao banner | Aprovado |
| S11 | Baixo no banner entra nas fileiras (animação ligada) | Aprovado |
| S12 | Fileira "Em alta": 3º título é A Torre de Cinzas | Aprovado |
| S13 | Foco restaurado no mesmo cartão da 2ª fileira | Aprovado |
| S14 | Fileira "Seus aplicativos" (7ª) abre um aplicativo | Aprovado |
| S15 | Abrir aplicativo avisa que é demonstrativo | Aprovado |
| S16 | Foco restaurado no cartão de aplicativo | Aprovado |
| S17 | Cima passa pelas 6 fileiras acima sem sair das fileiras | Aprovado |
| S18 | Cima na primeira fileira devolve o foco ao banner | Aprovado |
| S19 | Cima no banner sobe para a barra de abas | Aprovado |
| S20 | Filmes recebe o foco no conteúdo | Aprovado |
| S21 | Primeiro filme da fileira "Ficção científica e fantasia" | Aprovado |
| S22 | Foco restaurado em Filmes | Aprovado |
| S23 | Séries recebe o foco no conteúdo | Aprovado |
| S24 | Aplicativos recebe o foco no conteúdo | Aprovado |
| S25 | Primeiro aplicativo: Telão | Aprovado |
| S26 | Biblioteca recebe o foco no conteúdo | Aprovado |
| S27 | Biblioteca: primeiro título de "Continue assistindo" | Aprovado |
| S28 | Favoritar pelos detalhes mostra o aviso | Aprovado |
| S29 | Voltar à Biblioteca | Aprovado |
| S30 | A fileira Favoritos apareceu na Biblioteca com o título favoritado | Aprovado |
| S31 | Aba Busca abre com o foco na barra | Aprovado |
| S32 | Baixo entra no teclado | Aprovado |
| S33 | ORBITA (sem acento) encontra Órbita Baixa | Aprovado |
| S34 | Resultado da busca abre os detalhes | Aprovado |
| S35 | Foco restaurado no resultado | Aprovado |
| S36 | Apagar remove a última letra | Aprovado |
| S37 | Apagar até esvaziar volta às sugestões | Aprovado |
| S38 | Texto sem correspondência não retorna resultados | Aprovado |
| S39 | Baixo na última linha, sem resultados, não leva o foco a lugar nenhum | Aprovado |
| S40 | Voltar na Busca leva ao Início (barra) | Aprovado |
| S41 | Configurações recebe o foco | Aprovado |
| S42 | Tema alternado | Aprovado |
| S43 | Animações desligadas | Aprovado |
| S44 | Voltar nas Configurações leva ao Início | Aprovado |
| S45 | Sem animações: as fileiras abrem direto no estado final | Aprovado |
| S46 | Voltar na barra do Início encerra o app (comportamento do sistema) | Aprovado |
| S47 | Animações desligadas persistiram após reabrir | Aprovado |
| S48 | Favorito persistiu após reabrir o app | Aprovado |

## 4. Não executado

| Teste | Motivo |
|---|---|
| Qualquer execução no Roku Express 3960BR | Sem autorização para instalar/ativar modo desenvolvedor; restrição do projeto |
| Desempenho real (quadros, tempo de abertura, memória de textura) | Só mensurável no aparelho |
| Fontes do sistema, overscan, escalonamento FHD→HD pelo firmware | Dependem do Roku OS |
| Toque/contraste reais em TV | Dependem do painel |
| Teste com controle por voz/atalhos | Fora do escopo |

## 5. Defeitos encontrados e corrigidos durante a etapa

| Defeito | Onde foi achado | Correção |
|---|---|---|
| Teclado: Cima nos resultados reabria os detalhes em vez de voltar ao teclado | Simulador | Nó `keyFocus` irmão do teclado e dos resultados |
| `.Sort()` em `Keys()` (ordem não garantida no firmware) | Revisão | `Util_sortedStrings` + 2 testes |
| Harness: "invalid zip data" intermitente | Simulador | Recursos carregados antes de inicializar |
| Expectativas erradas nos meus testes (Apagar, FANTASIA) | Lógica | Teste corrigido; app inalterado |

## 6. Critérios para aprovar no aparelho

Todos os itens do checklist manual marcados, sem erros no console de depuração, sem
truncamento de texto, foco sempre visível, Voltar/Home conforme o esperado. Qualquer falha
gera correção e novo ciclo `npm test` antes de nova instalação.

## 7. Riscos

Fontes e rótulos podem ocupar mais espaço no aparelho; pressão de textura em 512 MB;
`ui_resolutions=fhd` escalado para 720p pode borrar traços finos; comportamento do
`RowList` ao segurar a seta. Mitigação: checklist de aparência (§10) e ajuste de tamanhos
em `Theme.brs`.
