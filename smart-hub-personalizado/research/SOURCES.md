# Fontes consultadas

**Data de acesso de todas as fontes: 23/10/2026.**

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
| S9 | Samsung Índia — *What is Web Browser in Samsung H Series TV?* — <https://www.samsung.com/in/support/tv-audio-video/what-is-web-browser-in-samsung-h-series-tv> | só título/URL | Existência de navegador web na série H (modelo e região não confirmados). |
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
