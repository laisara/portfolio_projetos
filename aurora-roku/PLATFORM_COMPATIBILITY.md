# Compatibilidade de plataforma — Aurora Roku

Última atualização: 23/10/2026 (versão 0.2.0). **Nenhum teste foi feito no Roku físico.**

Referências [L#], [R#], [C#]: ver [SOURCES.md](SOURCES.md), que registra se cada fonte foi
**lida diretamente (L)** ou obtida só por **resumo de busca (R)**. Isso importa: "Confirmado pela
documentação" com base em resumo de busca ainda merece releitura da página oficial.

## Classificação usada

| Classe | Significado |
|---|---|
| **Confirmado pela documentação** | Há fonte oficial (da Roku, ou sample oficial) que sustenta o requisito. A coluna *Fonte* diz se foi lida ou resumida |
| **Implementado, mas ainda não testado no dispositivo** | O recurso está no código e **executou no simulador** brs-engine, mas isso não prova o comportamento no aparelho |
| **Dependente de teste físico** | Só um teste no Roku Express 3960BR confirma (desempenho, aparência real, comportamento do sistema) |
| **Não suportado ou fora do escopo** | Não implementado, de propósito ou por limitação |

## 1. Aparelho-alvo

| Requisito | Classe | Fonte / observação |
|---|---|---|
| Roku Express **3960X**: modelo de 2022, 512 MB de RAM, CPU ARM Cortex A55, OpenGL ES 2.0 | Confirmado pela documentação | [R1] (resumo) |
| **Interface (UI) de no máximo 720p** neste hardware; vídeo até 1080p, sem HDR | Confirmado pela documentação | [R1] (resumo). Orienta todo o dimensionamento de imagens |
| O modelo informado **3960BR** é a variante brasileira do 3960X | Dependente de teste físico | Nenhuma fonte associa o sufixo BR. O app mostra o modelo real em Configurações → Diagnóstico |
| **Roku OS 15.3** informado pelo usuário | Dependente de teste físico | Não verificado. O Diagnóstico mostra a versão real |

## 2. Estrutura do app e manifest

| Requisito | Classe | Fonte / observação |
|---|---|---|
| Pastas `source/`, `components/`, `images/` e arquivo `manifest` na raiz | Confirmado pela documentação | [L3] (lida) |
| Atributos obrigatórios: `title`, `major_version`, `minor_version`, `build_version` | Confirmado pela documentação | [R3] (resumo); formato visto em [L2] (lida) |
| Ícones `mm_icon_focus_fhd` e `mm_icon_focus_hd` (540×405 / 290×218) e splash `splash_screen_fhd` e `splash_screen_hd` (1920×1080 / 1280×720) | Confirmado pela documentação | [L2] (lida); dimensões conferidas por `tools/check-project.js` |
| `ui_resolutions=fhd`: layout em FHD escalado para HD/SD pelo firmware | Confirmado pela documentação | [L3] (lida), [R2] |
| `rsg_version=1.2` (o OS 14.5 encerrou o suporte ao RSG 1.1) | Confirmado pela documentação | [R14] (resumo). Dependente de teste físico no OS 15.3 |
| Todo arquivo XML de `components/` vira um tipo de nó; um `<component>` por arquivo | Confirmado pela documentação | [L3] (lida) |
| `Main()` com `roSGScreen`, `roMessagePort`, `CreateScene` e laço `wait` | Confirmado pela documentação | [L2] (lida) |
| Código compilado sem erros pelo BrighterScript e sem alertas do `bslint` | Implementado, mas ainda não testado no dispositivo | Ferramentas de terceiros; não equivalem à validação do firmware |

## 3. Componentes SceneGraph

| Requisito | Classe | Fonte / observação |
|---|---|---|
| `Scene`, `Group`, `Poster`, `Label`, `Rectangle`, `RowList` | Confirmado pela documentação | [L2–L5] (lidas) |
| `RowList` + componente de item (`itemComponentName`) com `focusPercent` e `rowListHasFocus` | Confirmado pela documentação | [L4] (lida), [R6]. Realce = `rowListHasFocus and focusPercent > 0` |
| `RowList`: `rowItemFocused`, `rowItemSelected` | Confirmado pela documentação | [L3] (lida) |
| `RowList`: `jumpToRowItem` (restaurar a posição ao reconstruir o conteúdo) | Implementado, mas ainda não testado no dispositivo | Usado e executado no simulador; **não visto nas fontes obtidas** |
| `RowList`: `rowFocusAnimationStyle="floatingFocus"` | Confirmado pela documentação | [L3] (lida), [R6]. Escolhido porque há relato de defeito de `focusPercent` em `fixedFocus` [C1] |
| `Timer` (aviso de disparo único) | Implementado, mas ainda não testado no dispositivo | Nó não confirmado nas fontes obtidas |
| `Animation` + `Vector2DFieldInterpolator` / `FloatFieldInterpolator` | Implementado, mas ainda não testado no dispositivo | Nomes não confirmados nas fontes obtidas; podem ser desligados pela opção Animações |
| `Font` (tamanho) e fontes de sistema `font:MediumBoldSystemFont` | Confirmado pela documentação | Fontes predefinidas em [L5] (lida). **Ajuste de `size` sobre a fonte atribuída**: relato [C2]; Dependente de teste físico |
| Imagens 9-patch (`*.9.png`) para botões, painéis e anel de foco | Implementado, mas ainda não testado no dispositivo | [R7] cita `bitmapMargins`. **No simulador os cantos saem diferentes do esperado** → Dependente de teste físico |
| PNG com transparência (cantos dos cartões) e JPEG | Confirmado pela documentação | [R7] (resumo) |
| `callFunc` com funções declaradas em `<interface>` | Implementado, mas ainda não testado no dispositivo | Executado no simulador; não confirmado nas fontes obtidas |
| `m.global` com `addFields` na thread principal e `observeFieldScoped` / `unobserveFieldScoped` | Confirmado pela documentação | [R11] (resumo) para o uso escopado; Dependente de teste físico |
| `Scene.currentDesignResolution` (diagnóstico) | Confirmado pela documentação | [R2] (resumo) |
| Teclado na tela **próprio** (36 teclas + 2 ações, feito de `PillButton`) | Implementado, mas ainda não testado no dispositivo | Não usa o teclado do sistema; navegação testada por lógica pura e no simulador |
| Carrossel de banners **manual** (sem avanço automático) | Implementado, mas ainda não testado no dispositivo | Escolha de projeto: evita carga e foco imprevisível |

## 4. Navegação por controle remoto

| Requisito | Classe | Fonte / observação |
|---|---|---|
| Setas, OK e Voltar tratados em `onKeyEvent`; `true` consome a tecla, `false` a deixa subir | Confirmado pela documentação | [R5] (resumo) |
| **Voltar** encerra o app no último nível se a tecla não for tratada e o foco estiver numa cena (`backExitsScene`) | Confirmado pela documentação | [R5] (resumo). Executado no simulador (`EXIT_USER_NAV`); Dependente de teste físico no OS 15.3 |
| **Home** é tratado pelo firmware (o app não o intercepta) | Confirmado pela documentação | [R5] (resumo) |
| Retomada ao sair (Instant Resume, OS 12+) | Dependente de teste físico | [R5] (resumo) |
| Estratégia de foco: um dono por região; `setFocus` entre irmãos | Implementado, mas ainda não testado no dispositivo | Executado no simulador. Dar foco a um **ancestral** do nó focado falhou no simulador e foi evitado (ver TEST_PLAN) |
| Restauração de foco ao voltar dos detalhes | Implementado, mas ainda não testado no dispositivo | Verificada no simulador em 3 telas (Início, Filmes e Busca) |
| Comportamento ao **segurar** uma seta | Dependente de teste físico | Não simulado; o `RowList` e a grade do teclado reagem a cada evento de tecla |
| Navegação **em laço** (último → primeiro) | Não suportado ou fora do escopo | Decisão: as pontas consomem a tecla (a guia do Android TV sugere laço [L6]; o briefing pede previsibilidade) |

## 5. Dados, persistência e funções de linguagem

| Requisito | Classe | Fonte / observação |
|---|---|---|
| `roRegistrySection` (`Read`, `Write`, `Exists`, `Flush`) para tema, animações e favoritos; `Flush` raro | Confirmado pela documentação | [R8] (resumo). Persistência verificada no simulador; Dependente de teste físico |
| `FormatJson` / `ParseJson` do estado salvo, com validação (JSON corrompido volta ao padrão) | Implementado, mas ainda não testado no dispositivo | Testado com `brs-cli` e no simulador, incluindo JSON quebrado |
| `Tokenize`, `Instr`, `LCase`, `Trim`, `Keys().Sort()` na Busca | Implementado, mas ainda não testado no dispositivo | Funções-padrão do BrightScript, executadas nos testes de lógica |
| **Normalização de acentos** (`String.Replace` com caracteres UTF-8 do português) | **Dependente de teste físico** | Funciona no simulador; no aparelho, confirmar com "orbita" → "Órbita Baixa". Risco: se a plataforma tratar bytes em vez de caracteres, a busca sem acento deixaria de achar títulos acentuados |
| `roDeviceInfo` (`GetModel`, `GetOSVersion`, `GetUIResolution`) e `roAppInfo` | Confirmado pela documentação | [R10] (resumo) |
| Nenhuma rede, nenhuma API externa, nenhuma credencial | Confirmado pela documentação | Verificado por varredura (`tools/check-project.js`) |

## 6. Desempenho, imagens e memória

| Requisito | Classe | Fonte / observação |
|---|---|---|
| Textura custa 4 bytes por pixel; usar imagens no tamanho de exibição | Confirmado pela documentação | [R7] (resumo) |
| Cartões em 256×144 (≈0,15 MB) e fundos em 1280×720 (≈3,5 MB); só um fundo de tela cheia por vez | Implementado, mas ainda não testado no dispositivo | Dimensões conferidas pelo verificador; memória real: `r2d2_bitmaps` no aparelho |
| Telas descartáveis são removidas ao sair (só o Início fica criado) | Implementado, mas ainda não testado no dispositivo | Verificada no simulador (sem erros de memória) |
| Orçamento de 16 ms por quadro na thread de renderização | Dependente de teste físico | [R9] (resumo). Nada de pesado roda na renderização; fluidez só no aparelho |
| Rolagem das 7 fileiras e animação de recolhimento (0,3 s) no Cortex A55 | Dependente de teste físico | Pode ser desligada em Configurações → Animações |
| Imagens 100% locais (nenhuma remota) | Confirmado pela documentação | Verificado por varredura |

## 7. Apresentação

| Requisito | Classe | Fonte / observação |
|---|---|---|
| Margem de pelo menos 5% por causa de overscan | Confirmado pela documentação | [R16] (resumo), [L8] (lida). Margem de 96 px (5%) aplicada |
| Texto legível a ~3 m | Dependente de teste físico | Tamanhos definidos no DESIGN_SYSTEM; contraste da paleta medido (≥ 7,7:1). Contraste sobre as imagens não medido |
| Fonte real do aparelho × fonte do simulador (*Metropolis*) | Dependente de teste físico | Larguras de texto (7 abas, títulos) podem diferir; no simulador o texto da última aba termina em x≈1533, com folga de ≈ 290 px até o limite seguro (1824) |
| Cantos arredondados dos cartões | Implementado, mas ainda não testado no dispositivo | Estão na própria imagem; independem do firmware |

## 8. Fora do escopo ou não suportado

| Item | Classe | Observação |
|---|---|---|
| Substituir a tela inicial do Roku ou iniciar o app automaticamente | Não suportado ou fora do escopo | O app é iniciado pelo sistema e roda como canal |
| Abrir outros canais/aplicativos (os cartões de aplicativo são fictícios) | Não suportado ou fora do escopo | Nenhum mecanismo foi implementado ou comprovado; "Abrir" só avisa |
| Reprodução de vídeo, DRM, streaming, contas, autenticação | Não suportado ou fora do escopo | O briefing exclui |
| Busca por voz, teclado do sistema, integração com a Busca do Roku | Não suportado ou fora do escopo | |
| Conteúdo real e imagens licenciadas | Não suportado ou fora do escopo | A arte é original e provisória (ver SOURCES.md, seção 6) |
| Roku Cloud Emulator, sideload e qualquer ação no aparelho | Não suportado ou fora do escopo | Exige conta de desenvolvedor/aparelho; proibido nesta etapa |
| Certificação e publicação na Roku Channel Store | Não suportado ou fora do escopo | Não é objetivo |

## 9. Limites do simulador usado (brs-engine + brs-scenegraph)

- **Não é o Roku OS.** É um simulador de terceiros [C3]; o que passa nele não comprova o
  comportamento no aparelho.
- Roda a lógica e a cena numa **única thread**, enquanto o Roku separa a thread principal da de
  renderização [C3]; restrições de thread do aparelho não são exercitadas.
- A extensão SceneGraph é **beta**; "espere diferenças de renderização" [C3]. A animação nativa
  de foco de listas não está implementada [C3].
- As **fontes** são substitutas (*Metropolis*); os **9-patch** têm cantos menores que os do
  aparelho.
- Os valores do Diagnóstico nas capturas (modelo **3960X**, **Roku OS 16.0.4**, interface
  **HD 1280×720**) vêm da **configuração do simulador**, não do aparelho do usuário.
- O registro do Roku é simulado no `localStorage` do navegador.
- Falhas do **harness** (não do app) encontradas e corrigidas: corrida entre o download dos
  arquivos do simulador e o início do app (`DeviceInfo.assets`), e arquivos servidos em *stream*.

## 10. Pendências para o teste no hardware

Todas as linhas "Dependente de teste físico" acima, com procedimento em
[tests/manual-test-checklist.md](tests/manual-test-checklist.md). Prioridade sugerida:

1. Abrir o app e percorrer as 7 abas (identidade do modelo, fontes reais, larguras de texto).
2. Busca sem acento ("orbita" → Órbita Baixa).
3. Rolar as fileiras segurando a seta (fluidez) e alternar Animações.
4. Cantos das pílulas e das teclas (9-patch).
5. Voltar/Home/saída e retomada do app.
