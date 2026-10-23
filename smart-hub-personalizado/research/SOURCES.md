# Fontes consultadas

**Data de acesso de todas as fontes: 23/10/2026.**

> **Atualização da Etapa 2 (23/10/2026):** ver a seção "Etapa 2 — Registro de acesso às fontes
> oficiais" no final deste arquivo. Resultado: das 5 fontes oficiais exigidas, **0 foram lidas
> diretamente**; o conteúdo vem de resumos de busca.

## Limitação importante do método de coleta

A investigação foi feita a partir de um ambiente de desenvolvimento em nuvem cuja rede
**bloqueou o acesso direto** a vários domínios essenciais:

| Domínio | Resultado da tentativa de acesso direto |
|---|---|
| `wiki.samygo.tv`, `forum.samygo.tv` | Bloqueado (proxy 403 / DNS) |
| `www.samsung.com` (página de suporte do modelo) | Bloqueado |
| `developer.samsung.com` (documentação legada) | Bloqueado |
| `web.archive.org` | Bloqueado |
| `emby.media`, `www.tothenew.com` | Bloqueado |
| `github.com` (Samsung/cordova-sectv-orsay) | **Acessado** |

Para esses domínios, o conteúdo foi obtido **apenas por resumos de um mecanismo de busca**
(título, trecho e resumo automático da página). Isso tem consequências:

- O nível de evidência é **menor** do que a leitura integral da página.
- Nenhuma conclusão deste projeto foi classificada como "Confirmada" apenas com base em um
  resumo de busca quando o ponto era crítico para segurança ou implantação.
- **Pendência P-01:** reler manualmente, em um navegador comum, as fontes marcadas com
  "(resumo)" e atualizar `docs/FEASIBILITY.md` caso algo diverja.

A página oficial de suporte do modelo indicada pelo usuário
(<https://www.samsung.com/br/support/model/UN48H4203AGXZD/>) **não pôde ser lida**. As
informações sobre o firmware 1080.3 (2017) vêm do usuário, não desta investigação.

## Fontes oficiais Samsung

| # | Fonte | Acesso | O que sustenta |
|---|---|---|---|
| S1 | Samsung Developers — *Testing Your Application on a TV for 2014* — <https://developer.samsung.com/smarttv/develop/legacy-platform-library/art00121/index.html> | resumo | Documento de 2014-10-28, "compatível com SDK 5.0, 5.1 e modelos 2014". Descreve login com o ID `develop` (senha em branco), menu de opções do app, **IP Setting** e sincronização de apps de usuário a partir do servidor do SDK. |
| S2 | Samsung Newsroom — *Samsung Releases Smart TV SDK 5.0* — <https://news.samsung.com/global/samsung-releases-smart-tv-sdk-5-0> | resumo | SDK 5.0 publicado em dezembro de 2013, com IDE baseada em navegador e *Web UI Framework* para apps HTML5. |
| S3 | Samsung Developers Forum — *Developer mode option* — <https://forum.developer.samsung.com/t/developer-mode-option/18242> | resumo | Resposta indicando que TVs anteriores a 2015 são "Legacy Platforms", que não funcionam como a plataforma atual e que **não é mais possível publicar apps para modelos 2014**. |
| S4 | Samsung/cordova-sectv-orsay (GitHub, organização oficial Samsung) — <https://github.com/Samsung/cordova-sectv-orsay> | **lido** | Biblioteca para projetos Cordova na "Legacy Samsung Smart TV (A.K.A Orsay) Platform". Empacotamento: criar `config.xml` do Orsay, copiar `cordova.js` e **compactar o diretório em zip**. Não descreve instalação na TV. |
| S5 | Samsung Developers — *Migrating Legacy Platform to TOAST* — <https://developer.samsung.com/SmartTV/develop/migrating-applications/migrating-legacy-platform-to-toast.html> | só título/URL | Existência de guia oficial de migração da plataforma legada para TOAST (camada Cordova multiplataforma). |
| S6 | Samsung Developers — página do TOAST — <https://developer.samsung.com/tv/develop/extension-libraries/toast/> | só título/URL | Existência do TOAST como biblioteca de extensão. |
| S7 | Samsung LatAm — *¿Por qué en mi TV Samsung del año 2014 o anterior no funciona Netflix?* — <https://ushl.samsung.com/co/support/tv-audio-video/why-is-not-the-netflix-app-working-on-my-samsung-tv> | resumo | Página oficial de suporte que trata da Netflix não funcionar em TVs Samsung de 2014 ou anteriores e recomenda dispositivos externos. |
| S8 | Samsung HK — *How do I reset the Smart Hub on my Samsung 2014 Smart TV?* — <https://www.samsung.com/hk_en/support/tv-audio-video/how-do-i-reset-the-smart-hub-on-my-samsung-2014-smart-tv> | resumo | Reset do Smart Hub em TVs 2014 retorna aos padrões e **remove apps baixados**. Página de outra região. |
| S9 | Samsung Índia — *What is Web Browser in Samsung H Series TV?* — <https://www.samsung.com/in/support/tv-audio-video/what-is-web-browser-in-samsung-h-series-tv> | só título/URL | Existência de navegador web em **alguns** modelos da série H (modelo e região não confirmados). **Revisado na Etapa 2:** este item só trazia título e URL e **não sustenta** que a UN48H4203AG tenha navegador (ver C14). |
| S10 | Samsung — atualização de firmware por USB — <https://www.samsung.com/in/support/tv-audio-video/how-to-update-your-smart-tv-to-the-latest-software/> | resumo | Procedimento geral de atualização (não será usado neste projeto). |
| S11 | PDF legado (CDN) — *Testing Your Application on a TV for 2011* — <https://d3unf4s5rp9dfh.cloudfront.net/SmartTV_Legacy/getting-started/Testing+Your+Application+on+a+TV+for+2011.pdf> | só título/URL | Indica que parte da documentação legada está espelhada em CDN; útil para a pendência P-02 (localizar o guia de 2014 e o SDK). |

## Fontes comunitárias

| # | Fonte | Acesso | O que sustenta |
|---|---|---|---|
| C1 | SamyGO Forum — *[ROOT] H "Network" root (FW<=Oct.2015, no T-GFS)* — <https://forum.samygo.tv/viewtopic.php?f=70&t=9622> | resumo | Lista `NT14M < ?` e `NT14MJDEUC < ?` entre firmwares possivelmente compatíveis, **com limite de versão desconhecido**; menciona possível necessidade de *downgrade* e desativar "OTN support" no menu de serviço estendido. |
| C2 | SamyGO Wiki — *Rooting H series TV* — <https://wiki.samygo.tv/index.php?title=Rooting_H_series_TV> | resumo | Página de root da série H; NT14M listado com limite de firmware desconhecido. |
| C3 | SamyGO Forum — *H-series with fw T-NT14...* — <https://forum.samygo.tv/viewtopic.php?t=8508> | só título/URL | Existe discussão específica da família T-NT14 na série H. |
| C4 | SamyGO Forum — *Extracting upgrade.msd firmware file* — <https://forum.samygo.tv/viewtopic.php?t=13463> | resumo | Exemplo de firmware da mesma família: `T-NT14MAKUC` v1220.0. |
| C5 | SamyGO Forum — *[Ended][ROOT] H "Skype" root* — <https://forum.samygo.tv/viewtopic.php?p=68114> | resumo | Moderador afirma que modelos T-NT14 nunca foram "rooteáveis" pelo método Skype. |
| C6 | SamyGO Forum — *Warning: Firmware upgrade and root* — <https://forum.samygo.tv/viewtopic.php?t=8274> | só título/URL | Avisos da própria comunidade sobre riscos de atualizar firmware em TVs modificadas. |
| C7 | SamyGO Wiki — *How to install custom widgets to TV* — <https://wiki.samygo.tv/index.php?title=How_to_install_custom_widgets_to_TV> | resumo | Instalação de widgets por conta de desenvolvedor + sincronização com servidor web (documentado para séries B/C/D). |
| C8 | Emby Community — *Samsung Orsay SmartTV (2011–2015) Community app Install Instructions* | resumo | Comunidade descreve H (2014) como última geração Orsay em geral, e instalação fora da loja via sincronização de desenvolvedor. |
| C9 | xchwarze/samsung-tv-ws-api (GitHub) — <https://github.com/xchwarze/samsung-tv-ws-api> | resumo | Lista a série H (2014) entre TVs Orsay, distintas das Tizen. |
| C10 | Samsung Smart TV Challenge FAQ (Devpost) — <https://samsungsmarttvchallenge.devpost.com/details/faq> | resumo | Cita o navegador "Maple 5.1" e "JavaScript 1.6" (ano/modelo não especificados). |
| C11 | *Samsung SmartTV Application Development* (Wiley, cap. 2) — <https://www.oreilly.com/library/view/samsung-smarttv-application/9781118828021/05_chapter02.html> | resumo | Afirma que desde 2012 as Smart TVs Samsung usam o motor WebKit em vez do Maple. **Conflita com C10.** |
| C12 | B&H — Samsung UA-48H4200 — <https://www.bhphotovideo.com/c/product/1106723-REG/samsung_ua_48h4200_48_720p_multi_system.html> | resumo | Modelo irmão (UA48H4200, outro mercado) com painel 1366×768. **Não** é o modelo-alvo. |
| C13 | tvsfaq — UN48H4203AF — <https://www.tvsfaq.com/en/install-apps/samsung-un48h4203af> | resumo | Afirma "Tizen" com instruções genéricas de "modelos 2018": **considerado não confiável** e descartado. |

## Fontes descartadas ou não utilizadas

- Guias de terceiros que publicam **IPs de servidores públicos** para sincronizar apps de
  usuário (por exemplo, players IPTV): descartados por risco de instalar código de terceiros
  não auditado na TV.
- Downloads de SDK, firmware ou "pacotes prontos" hospedados fora de domínios Samsung: não
  acessados.

---

# Etapa 2 — Registro de acesso às fontes oficiais

**Data de acesso:** 23/10/2026.

## Legenda do nível de acesso

| Código | Significado |
|---|---|
| **L** | **Lida diretamente** (conteúdo da página obtido pela própria ferramenta). |
| **R** | **Resumo de busca**: texto produzido por uma ferramenta de busca sobre a página. Pode omitir, simplificar ou errar. **Não equivale a L.** |
| **T** | **Só título e URL** (a página apareceu em uma lista de resultados, sem trecho utilizável). |

Uma conclusão baseada em R ou T não deve ser tratada como confirmada sem leitura direta
(pendência **P-01**).

## Método e resultado das tentativas de leitura direta

| Tentativa | Resultado |
|---|---|
| Ferramenta de leitura de páginas (WebFetch) nos 5 endereços oficiais | `getaddrinfo ENOTFOUND` (DNS) para `developer.samsung.com` e `www.samsung.com` |
| `curl` nos mesmos 5 endereços, pelo proxy do ambiente | `CONNECT tunnel failed, response 403` (bloqueado pela política de rede) |
| Busca web restrita a `developer.samsung.com` e `samsung.com` | Retornou títulos, URLs e resumos |

O proxy não foi contornado (nenhum acesso por caminho alternativo foi tentado). A leitura direta
exige um ambiente com acesso liberado a esses domínios.

## As cinco fontes obrigatórias da Etapa 2

| ID | URL | Acesso | O que o resumo sustenta |
|---|---|---|---|
| F1 | <https://developer.samsung.com/smarttv/legacy/overview.html> | **R** | Título "Samsung Smart TV Legacy Platform". Emuladores por ano: 1.5 (2010), 2.5 (2011), 3.5 (2012), 4.5 (2013) e **5.1 Beta (2014)**. O SDK mais recente inclui emuladores de todas as plataformas |
| F2 | <https://developer.samsung.com/smarttv/legacy/tools/history.html> | **R (parcial)** | Título "TV SDK Download and Release History". Conteúdo incompleto: **sem datas nem sistemas operacionais do 5.1** |
| F3 | <https://developer.samsung.com/smarttv/legacy/development-guides/getting-started.html> | **T** | Existência da página "Getting Started". Sem conteúdo |
| F4 | <https://developer.samsung.com/smarttv/legacy/samsung-legacy-platform-faq.html> | **R** | Modelos 2010–2014 executam apenas apps legados; 2015 executa legados por compatibilidade; 2016+ só Tizen. Teste por USB exige arquivo `.sig` (DUID + chamado no Seller Office; `CPDeveloper.sig`, às vezes `Developer.sig`). O resumo também cita que USB para apps legados só funciona na plataforma 2012 e "não é recomendado" (página de origem dessa frase **não identificada com certeza**) |
| F5 | <https://www.samsung.com/br/support/model/UN48H4203AGXZD/> | **R (só existência)** | A página existe e lista manual em PT/EN (junho de 2014), guia de atualização para TVs 2014 (abril de 2015) e outro manual de atualização (outubro de 2015). Arquivos **não abertos**; sem especificações; **sem menção** ao firmware 1080.3 nem a 2017 |

## Outras fontes oficiais da Samsung (todas R, salvo indicação)

| ID | Fonte | Acesso | O que sustenta |
|---|---|---|---|
| S15 | Seller Office — *Application Registration Q&A* <https://developer.samsung.com/tv-seller-office/faq/application-registration.html> e *Application Update Q&A* <https://developer.samsung.com/tv-seller-office/faq/application-update.html> | R | Submissão da versão **legada não é mais suportada**; só Tizen. Atualizações devem usar o mesmo certificado do autor |
| S16 | *Specifications and Feature Support Q&A* <https://developer.samsung.com/smarttv/develop/faq/specifications-and-feature-support.html> | R | 2010–2014 só executam apps legados; 2015 executa ambos; Tizen Studio não empacota apps legados (é preciso o SDK para plataforma legada). Suporte a RTMP, Convergence e multicast por ano |
| S17 | *Archive* (TV Extension) <https://developer.samsung.com/smarttv/develop/tools/tv-extension/archive.html> | R | Oferece o SDK de TVs 2012–2015 da plataforma legada; "todas as versões dos últimos 3 anos" estão disponíveis (**5.1 não confirmado**) |
| S18 | *Smart TV SDK IDE Help Guide* <https://developer.samsung.com/smarttv/develop/legacy-platform-library/art00122/index.html> | R | "Compatível com SDK 5.1". Windows 7 recomendado, XP SP2 ou superior, Linux (Ubuntu recomendado), Mac OS X; Oracle JDK 1.6 ou superior |
| S19 | *Remote Web Inspector* <https://developer.samsung.com/smarttv/develop/legacy-platform-library/d44/index.html> | R | Etapa "Setting the Develop IP" entre o login e a sincronização; somente o IP de desenvolvimento pode inspecionar o app |
| S20 | *Samsung SmartTV SDK 4.5 Overview* <https://developer.samsung.com/smarttv/develop/legacy-platform-library/d08/index.html> e visão geral do SDK 5.0 (URL não listada no resultado) | R | 4.5: Windows, Mac OS X, Linux, 32/64 bits. 5.0: Windows, Mac OS X e Linux |
| S21 | *User-Agent String Format* <https://developer.samsung.com/browser/user-agent-string-format.html> | R | Linha de 2014 / "TV SDK 5.1 (2014)": `Mozilla/5.0 (SMART-TV; X11; Linux armv7l) AppleWebkit/537.42 (KHTML, like Gecko) Safari/537.42`. **Observação:** a página pertence à área do Samsung Internet e tem uma tabela de TVs; descreve o ambiente de apps, não necessariamente um navegador de usuário |
| S22 | *CSS3 Browser Specification* <https://developer.samsung.com/smarttv/develop/legacy-platform-library/art00065/index.html> (publicada em 2014-10-28, "modelos 2013 e 2014"); *Defining CSS Contents* <https://developer.samsung.com/smarttv/develop/legacy-platform-library/art00084/index.html> | R | Tabela por propriedade: maioria dos itens de transformação 2D/3D "Yes", alguns "No". Fontes personalizadas "desde os modelos 2014" (atribuição à página exata incerta). **Linhas específicas não lidas** |
| S23 | *W3C/HTML5 API References* <https://developer.samsung.com/smarttv/develop/api-references/w3chtml5-api-references.html> | R | Muitos recursos "parciais" (ex.: `video`, formulários). Lista *Web Storage* sem indicar plataformas |
| S24 | *Application Installation Q&A* <https://developer.samsung.com/smarttv/develop/faq/application-installation.html> | R | Instalação de apps/widgets por USB não é mais suportada por segurança; `.wgt` não instala por USB; *USB Demo Packaging Tool* (`.tmg`) existe no Seller Office; apps instalados por USB não iniciam automaticamente. **Página voltada à plataforma atual**; aplicação ao legado não estabelecida |
| S25 | *TV Device* <https://developer.samsung.com/smarttv/develop/getting-started/using-sdk/tv-device.html> e *Account* <https://developer.samsung.com/smarttv/develop/development-checklist/account.html> | R | Modo desenvolvedor de TVs **mais novas** (menu *Apps*, PIN) e menção de que instalar por USB não é mais suportado. Serve de **contraste**: o caminho de 2014 descrito em S1 é diferente |
| S26 | *Web Engine Specifications* <https://developer.samsung.com/smarttv/develop/specifications/web-engine-specifications.html> e *Using Web Storage* <https://developer.samsung.com/smarttv/develop/guides/data-handling/using-web-storage.html> | R | Suporte a Web Storage documentado para versões **Tizen** (desde 2.3, 2015), com limite de 5 MB. **Não se aplica comprovadamente a 2014** |
| S27 | Páginas de API/guia da plataforma legada: *Getting Started* (<https://developer.samsung.com/smarttv/develop/legacy-platform-library/ovw001/index.html>), *Coding Your JavaScript Application: Sample Code* (<https://developer.samsung.com/smarttv/develop/legacy-platform-library/cod00001/index.html>), *The difference between Return and Exit keys* (<https://developer.samsung.com/smarttv/develop/legacy-platform-library/tec00101/index.html>), *API References — Widget Object* (<https://developer.samsung.com/tv/develop/legacy-platform-library/ref00006/Widget_Object>), *TV Functionalities — Handling Key Events* (<https://developer.samsung.com/smarttv/legacy/development-guides/tv-functionalities.html>) | R (a última: T) | `new Common.API.Widget()`, `sendReadyEvent()` para iniciar o app, `sendReturnEvent()` fecha o app e volta ao Smart Hub; Return, por padrão, volta ao Smart Hub; `new Common.API.TVKeyValue()` e `tvKey.KEY_RETURN` no exemplo. **Valores numéricos das teclas: não obtidos** |
| S28 | *Prelaunching Applications* <https://developer.samsung.com/smarttv/develop/guides/fundamentals/prelaunching-applications.html> | R | *Prelaunch* só em Tizen 2015–2018 (desativado por padrão em 2015). **Não se aplica a 2014** |

> Observação sobre S1 (Etapa 1): o guia *Testing Your Application on a TV for 2014*
> (<https://developer.samsung.com/smarttv/develop/legacy-platform-library/art00121/index.html>) foi
> resumido em duas buscas independentes. Ambas descrevem: *User Applications* enviadas do PC para
> a TV, login `develop` (guia de 2014: senha em branco; contas de 2013 já criadas), *IP Setting*,
> *Start User App Sync*, e a necessidade de reempacotar e sincronizar a cada mudança. Continua sendo
> **R**.

## Fontes de comunidade e de terceiros acrescentadas na Etapa 2

| ID | Fonte | Acesso | O que sustenta | Confiabilidade |
|---|---|---|---|---|
| C14 | Threads da Samsung Community (UE48H6750 de 2014; "Webbrowser kein Update mehr"; "Browser werkt niet op TV"; "Web browser"), por exemplo <https://eu.community.samsung.com/t5/tv/samsung-smart-tv-webbrowser-kein-update-mehr/td-p/1271367> | R | Moderador observa que o navegador está ausente em alguns modelos antigos; usuário relata ficha oficial de modelo de 2014 sem navegador; navegador embutido sem HTTPS; navegador de 2014 que parou de funcionar; não é possível instalar outro navegador | Baixa a média (relatos de usuários; **modelo H4203 não citado**) |
| C15 | Samsung Developer Forum — *Begginer Developer Needing Help [SOLVED]* <https://forum.developer.samsung.com/t/begginer-developer-needing-help-solved/25244> | R | Relato de que o SDK 5.0 foi removido e nenhum SDK novo foi lançado | Baixa (post de usuário; não verificado em fonte oficial) |
| C16 | Quirksmode — *Samsung Smart TV* <https://www.quirksmode.org/blog/archives/2014/07/samsung_smart_t.html> | R | Um user agent de TV Samsung de 2014 com tokens Chromium/Chrome; autor conclui "Samsung Chrome 25". **Modelo e ambiente (navegador ou app) não identificados** | Baixa a média (blog técnico de 2014; não é o modelo-alvo) |
| C17 | Páginas de suporte Samsung do **H4203** em outros mercados (México, Canadá, Espanha, América Latina) | T | Existência de páginas de suporte para H4203 ("Smart LED TV", "HD Flat Smart TV H4203 Series 4"). **Sem especificações** | — |

## Pendências de leitura (novas)

| ID | Pendência | Resolve |
|---|---|---|
| P-01 | Ler **na íntegra** F1–F5 e S1, S18, S19, S22, S23, S27 em um navegador comum, salvar como PDF/HTML e anexar | Converte R/T em L |
| P-02 | Localizar o arquivo do **SDK 5.1** (ou a confirmação de que não existe mais) e o histórico de versões | D-05, D-06, D-07 |
| P-03 | Baixar os **manuais** do modelo (junho de 2014; guias de atualização) **apenas para leitura** | D-01, D-02, D-10 |
| P-04 | Localizar a seção oficial *Handling Key Events* e os valores de `TVKeyValue` | D-13 |
| P-05 | Procurar relatos de **H4203 / NT14M** com *User App Sync* (nenhum encontrado até agora) | D-09 |
