# Relatório de viabilidade — Smart Hub Personalizado para Samsung UN48H4203AG

**Data:** 23/10/2026 · **Etapas:** 1 (investigação) e 2 (validação documental e decisão de
viabilidade) · **Ações na TV:** nenhuma.

Legenda de classificação usada nas Etapas 1 e 2:

- **Confirmada**: há evidência específica.
- **Provável**: há evidência indireta, mas não comprovada no modelo exato.
- **Desconhecida**: depende de investigação ou de teste.
- **Incompatível**: há evidência suficiente de que não funciona.

A Etapa 2 usa uma escala mais detalhada (seção 12), sempre acompanhada do **nível de acesso à
fonte**:

- **Confirmada para o modelo exato**
- **Confirmada para a plataforma ou geração**
- **Indício indireto**
- **Desconhecida**
- **Incompatível**

> **Limitação do método (vale para as duas etapas).** Os sites da Samsung, do SamyGO e do
> Internet Archive estavam bloqueados na rede usada nesta investigação. O conteúdo deles foi
> obtido por **resumos de mecanismo de busca**, e não pela leitura das páginas inteiras.
> Detalhes e pendências estão em [`research/SOURCES.md`](../research/SOURCES.md). As
> referências [S#]/[C#]/[F#] abaixo apontam para esse arquivo.
>
> **Etapa 2:** as cinco páginas oficiais exigidas foram tentadas por leitura direta e **nenhuma
> abriu** (ver seção 11). Toda afirmação "Confirmada para a plataforma ou geração" abaixo vem do
> resumo de uma página oficial e deve ser relida na íntegra antes de qualquer decisão de
> instalação (pendência P-01).

---

## 1. Resumo executivo

1. A UN48H4203AG é uma TV da **série H (2014)**. A Samsung afirma que modelos de **2010 a 2014**
   executam **somente** aplicações da *Samsung Smart TV Legacy Platform* (a "Orsay" da
   comunidade) [F1][F4][S16]. Classificação: **Confirmada para a plataforma ou geração**. Para o
   modelo exato, a página de suporte **não pôde ser lida** (seção 11), então não há
   confirmação específica da UN48H4203AG.
2. O firmware `T-NT14MUABC` pertence à família **NT14M**, citada pela comunidade SamyGO na série
   H [C1][C2][C4]. **Confirmada**, como família de firmware conhecida.
3. Para TVs de 2014, a Samsung documenta o teste de aplicações por **User App Sync**: login
   `develop`, *IP Setting* com o IP do PC e *Start User App Sync* a partir do SDK 5.0/5.1
   [S1][S19]. O guia é "compatível com SDK 5.0, 5.1 e modelos 2014". Classificação:
   **Confirmada para a plataforma ou geração**. **Não há nenhuma evidência** de que funcione
   especificamente na UN48H4203AGXZD com o firmware 1090.0 (**Desconhecida**).
4. A Samsung **não aceita mais submissão** de apps da plataforma legada [S3][S15] (**Incompatível**
   como caminho de distribuição). A instalação por USB de apps legados é descrita pela Samsung
   como restrita, "não recomendada" ou "não suportada por segurança" [F4][S24]. Esse caminho foi
   **excluído** (seção 7).
5. **Substituir o Smart Hub ou iniciar a interface automaticamente:** não foi encontrado nenhum
   mecanismo oficial. A documentação legada indica que a tecla Return, por padrão, **volta ao
   Smart Hub** [S27], ou seja, o app seria um "convidado" aberto a partir do Smart Hub. O único
   caminho que a comunidade cita é o root [C1][C2], **rejeitado** por segurança.
6. **Correção em relação à Etapa 1:** a existência de um **navegador web** nesta TV **não está
   comprovada**. A Etapa 1 a tratava como provável com base em um item que só trazia título/URL
   [S9]. Fontes comunitárias indicam que alguns modelos de 2014 **não têm navegador**, que o
   navegador embutido pode não aceitar HTTPS e que pode deixar de funcionar com o tempo [C14].
   Isso reduz a confiança no caminho B (seção 13).
7. **Recomendação (revisada na Etapa 2):** manter o **protótipo no computador como ambiente
   principal (caminho A)**. O próximo passo é uma **observação sem alteração** da TV, para
   descobrir se existe navegador e se o menu de login de desenvolvedor aparece. O resultado
   decide entre o caminho B e o caminho C. Detalhes na seção 14 (**Decisão**).

---

## 2. Informações confirmadas sobre a TV

Os dados abaixo foram **fornecidos pelo usuário** e não puderam ser verificados nesta
investigação, porque a página de suporte estava inacessível.

| Item | Valor | Origem |
|---|---|---|
| Modelo comercial | UN48H4203AG | usuário |
| Código da etiqueta | UN48H4203AGXZD | usuário |
| Software exibido pela TV | T-NT14MUABC-1090.0 | usuário (tela da TV) |
| Versão de hardware | TD02 | usuário (etiqueta) |
| Inscrição na etiqueta | "Java Powered" | usuário |
| Firmware oficial encontrado anteriormente | 1080.3 (2017) | usuário |

### Interpretação do identificador `T-NT14MUABC-1090.0`

| Parte | Interpretação | Classificação |
|---|---|---|
| `T-` | Prefixo usado nos firmwares de TV Samsung (ex.: `T-NT14UDEUC`, `T-MST14DEUC`, `T-GFPDEUC`) [C1] | Provável |
| `NT14M` | Família de plataforma/firmware de 2014 ("14"). A comunidade a lista separadamente de `NT14U`, `MST14` e `GFP` [C1][C2] | Confirmada como família; o significado de cada letra é **Desconhecido** |
| `NT` = chipset Novatek | Associação comum na comunidade, **não verificada** nesta investigação | Desconhecida |
| `UABC` | Provável sufixo de região/variante. Existem variantes irmãs como `T-NT14MAKUC` e `T-NT14MJDEUC` [C1][C4] | Desconhecida |
| `1090.0` | Versão do firmware | Confirmada (informada pela TV) |

### Observações sobre versões

- O usuário informa **1090.0 na TV** e **1080.3 (2017)** como "firmware oficial encontrado".
  Pela numeração, 1090.0 parece **posterior** a 1080.3. Isso pode indicar que a TV já tem
  uma versão igual ou mais nova que a do arquivo encontrado. Classificação: **Desconhecida**.
  Não há confirmação de que os dois firmwares sejam da mesma variante (`UABC`).
- O resumo de busca da página de suporte do modelo [F5] menciona manual (junho de 2014), um
  guia de atualização para TVs 2014 (abril de 2015) e outro manual de atualização (outubro de
  2015). Não menciona a versão 1080.3 nem o ano 2017. Os arquivos não foram abertos; **não foi
  possível confirmar qual é o firmware mais recente**.
- **Nenhuma atualização ou downgrade deve ser feito** (ver [SECURITY.md](SECURITY.md)).

---

## 3. Informações ainda desconhecidas

| ID | Pergunta | Como descobrir | Risco do teste |
|---|---|---|---|
| D-01 | Resolução nativa do painel (1366×768 ou 1920×1080?) | Manual do modelo ou etiqueta/especificação oficial. O irmão UA48H4200 tem 1366×768 [C12], mas outro mercado não prova nada | Nenhum |
| D-02 | A TV **tem** navegador web? Se tiver, qual o motor e o nível de JavaScript? Aceita HTTP em IP local? | Observar a lista de apps do Smart Hub (H-01). Depois, só se existir, o teste H-02 | Nenhum (observação) / Baixo |
| D-03 | Quais teclas do controle chegam a uma página no navegador da TV? | Página de captura de teclas na rede local | Baixo |
| D-04 | O menu de login de desenvolvedor e o *IP Setting* existem nesta TV? | Inspeção visual dos menus, **sem confirmar nenhuma ação** | Baixo, mas exige login com conta especial (reversível com logout) |
| D-05 | O SDK 5.0/5.1 ainda pode ser obtido de fonte oficial Samsung? Em que forma (SDK completo ou só emulador "5.1 Beta")? | Leitura direta de `tools/history.html` e do arquivo de SDKs em um navegador comum | Nenhum |
| D-06 | O SDK 5.x funciona em um sistema operacional atual? | Documentação oficial do SDK. O guia do IDE cita Windows 7/XP, Ubuntu, Mac OS X e JDK 1.6 [S18] | Nenhum |
| D-07 | Existe emulador oficial para 2014 e qual a sua fidelidade? | O portal lista "SDK Emulator 5.1 **Beta**" para a plataforma 2014 [F1] | Nenhum |
| D-08 | `localStorage` funciona e persiste nos apps de usuário e no navegador? | Teste no aparelho. A documentação encontrada só afirma suporte em versões Tizen [S26] | Baixo |
| D-09 | O firmware 1090.0 é compatível com User App Sync? | Teste no aparelho (D-04). Nenhuma fonte encontrada fala de firmware específico | Baixo |
| D-10 | Situação atual de YouTube, Globoplay, Prime Video e Spotify neste modelo | Abrir o Smart Hub original e conferir a lista de apps | Nenhum |
| D-11 | O que significa "Java Powered" nesta TV? | Manual. Provavelmente se refere a um componente Java (ex.: middleware de TV digital), mas **não há evidência**, e isso não indica suporte a apps Java de usuário | Nenhum |
| D-12 | O User App Sync exige assinatura ou certificado? | Leitura integral do guia 2014 e do guia do SDK. Os resumos não citam certificado para essa rota | Nenhum |
| D-13 | Como os eventos do controle chegam ao app legado (e como interceptar Return para não sair do app)? | Seção "Handling Key Events" do guia legado [S27] (lida só por título) | Nenhum |
| D-14 | Como remover um app de usuário com segurança? | Documentação oficial. O reset do Smart Hub remove apps baixados [S8] | Nenhum |
| D-15 | Uma atualização de firmware removeria o app de usuário? | Sem fonte encontrada | — |
| D-16 | Qual é o nível de ECMAScript do motor de apps/navegador de 2014? | Não foi encontrada afirmação oficial. A string de user agent oficial indica WebKit 537.42 [S21] | Baixo (H-03) |

---

## 4. Tecnologias potencialmente compatíveis

| Tecnologia | Situação | Classificação | Base |
|---|---|---|---|
| HTML + CSS + JavaScript (apps da plataforma legada) | Modelo de app da geração 2010–2014 | Confirmada para a geração | [S1][S2][S4][F4] |
| Motor de renderização | User agent oficial da plataforma 2014: `Mozilla/5.0 (SMART-TV; X11; Linux armv7l) AppleWebkit/537.42 (KHTML, like Gecko) Safari/537.42` → motor **WebKit** | Confirmada para a geração (resumo); vale para o ambiente de apps, não necessariamente para um navegador de usuário | [S21] |
| Nível de JavaScript | As fontes antigas conflitam ("JavaScript 1.6 / Maple 5.1" [C10] × "WebKit desde 2012" [C11]). O user agent oficial favorece WebKit. **Nenhuma fonte oficial informa o nível de ECMAScript** | Desconhecida (indício indireto de ES5 por ser WebKit 537) | — |
| ES5 sem APIs modernas | Opção mais conservadora; é a adotada no protótipo | Escolha de projeto | — |
| CSS 2D/3D transform | A especificação CSS3 do navegador "para modelos 2013 e 2014" marca a maioria dos itens de transformação como "Yes", mas alguns como "No" | Confirmada para a geração (parcial; a tabela não foi lida) | [S22] |
| Fontes personalizadas (`@font-face`) | "Desde os modelos 2014" | Confirmada para a geração (resumo) | [S22] |
| CSS flexbox, grid, variáveis, `calc()` | Nenhuma evidência encontrada | Desconhecida (evitados no protótipo) | — |
| APIs HTML5 | A referência Samsung lista muitos recursos como **parciais** (ex.: `video`, formulários) | Confirmada para a geração (parcial) | [S23] |
| APIs Samsung legadas (`Common.API.Widget`, `TVKeyValue`) | Nomes e uso (`sendReadyEvent`, `sendReturnEvent`, `tvKey.KEY_RETURN`) aparecem em páginas oficiais legadas | Confirmada para a plataforma (resumo) | [S27] |
| Cordova/TOAST para Orsay | Biblioteca oficial existente. Repositório ativo até 2023 | Confirmada (existência) | [S4][S5][S6] |
| Tizen Studio / apps Tizen (.wgt) | "Tizen Studio não consegue empacotar apps legados; é preciso usar o SDK para plataforma legada" | **Incompatível** | [S3][S16] |
| Android TV, Google TV, webOS | Plataformas diferentes | Incompatível | — |
| Apps Java ("Java Powered") | Sem evidência de suporte a apps Java de usuário | Desconhecida | — |

---

## 5. SDKs e ferramentas identificados

| Ferramenta | O que é | Disponibilidade | Riscos |
|---|---|---|---|
| **Samsung Smart TV SDK 5.0 / 5.1** | SDK oficial da geração 2014, com IDE e servidor de *User App Sync* [S1][S2]. O portal lista **"SDK Emulator 5.1 Beta"** como o emulador da plataforma 2014 [F1] | **Desconhecida** (D-05). O portal diz oferecer o SDK de TVs 2012–2015 "baseadas na plataforma legada" e "todas as versões dos últimos 3 anos" [S17]. Um relato de fórum diz que a 5.0 foi removida [C15]. Não foi baixado | Ferramenta de 2013–2014. Guia do IDE (compatível com SDK 5.1): Windows 7 recomendado, XP SP2 ou superior, Linux (Ubuntu recomendado), Mac OS X, **Oracle JDK 1.6 ou superior** [S18]. Executar só em **máquina virtual isolada**, a partir de fonte oficial, com hash verificado quando houver |
| Documentação legada (*Legacy Platform Library*) | Guias e referência de API | Existe no portal Samsung [S1][S18][S22][S27] e parcialmente em CDN [S11]. Inacessível nesta investigação | Nenhum (leitura) |
| Samsung/cordova-sectv-orsay + TOAST | Camada Cordova para Orsay. Empacotamento em zip com `config.xml` [S4] | Confirmada (GitHub oficial) | Baixo. Útil como referência de formato, mas adiciona dependências. Não adotado por enquanto |
| Emulador | Incluído no SDK, rotulado "Beta" para 2014 [F1] | Desconhecida (D-07) | Um app que roda no emulador pode não rodar na TV |
| Ferramentas SamyGO (root, extensões) | Modificações de firmware | Documentadas [C1][C2] | **Alto**. Rejeitadas |
| *USB Demo Packaging Tool* (Seller Office) | Cria pacote `.tmg` e licença para instalação por USB | Existe segundo a Samsung [S24], mas é do Seller Office e não foi avaliada | **Fora do escopo** (ver M10) |

**Não presumir:** o Tizen Studio atual **não** gera pacotes para esta plataforma [S3][S16].

---

## 6. Limitações conhecidas

1. Não é possível publicar na loja: a Samsung afirma que a submissão da versão legada **não é
   mais suportada** [S15] (Incompatível).
2. Não há caminho oficial conhecido para substituir o Smart Hub como tela inicial, nem para
   iniciar o app automaticamente. O comportamento padrão da tecla Return é voltar ao Smart Hub
   [S27].
3. Serviços de streaming: há indício oficial de que a Netflix não funciona em TVs de 2014
   [S7]. Os demais serviços não foram verificados. **Não se deve prometer reprodução.**
4. Hardware de entrada de 2014: CPU e memória modestas (valores exatos **desconhecidos**).
   A interface deve ser leve.
5. O nível de JavaScript e CSS não foi confirmado oficialmente. Por isso o protótipo usa ES5 e
   CSS conservador.
6. Os códigos das teclas do controle não foram confirmados. Por isso a camada de teclas é
   abstrata.
7. **Novo:** a presença de navegador web não é garantida em todos os modelos de 2014; onde
   existe, relatos indicam falta de HTTPS [C14].
8. **Novo:** o protótipo escala a tela inteira com `transform: scale()`. Se o motor de apps da
   TV não suportar essa propriedade como esperado, o layout quebraria. A tabela oficial de CSS
   marca a maioria dos itens de transformação como suportados [S22], mas **nenhuma linha
   específica foi lida**. Registrado como risco; **o protótipo não foi alterado** nesta etapa.

---

## 7. Métodos de execução investigados

| # | Método | Altera firmware? | Reversível? | Evidência para este modelo | Classificação | Decisão |
|---|---|---|---|---|---|---|
| M1 | Protótipo no **navegador do computador** | Não | — | — | Confirmada (testado) | **Adotado** |
| M2 | Protótipo aberto no **navegador da TV** a partir de servidor local | Não | Sim (nada é instalado) | **Nenhuma evidência de que este modelo tenha navegador.** Relatos de modelos 2014 sem navegador, sem HTTPS e com navegador quebrado [C14] | Desconhecida | Só será considerado se a observação H-01 mostrar um navegador |
| M3 | **User App Sync** oficial (conta `develop` + SDK 5.x) | Não | Provável: remover o app, fazer logout, ou reset do Smart Hub [S8] | Documentado para modelos 2014 em geral [S1][S19]. Sem confirmação para H4203 / 1090.0 | Confirmada para a geração / Desconhecida (modelo) | Segundo passo, depois da observação H-01 e da leitura integral das fontes |
| M4 | Sincronização com **servidores públicos de terceiros** (IPs de guias) | Não | Parcial | Comunidade | — | **Rejeitado**: instala código não auditado |
| M5 | Publicação na loja Samsung Apps | Não | Sim | [S3][S15] | Incompatível | Descartado |
| M6 | **Root SamyGO** (série H, "Network root") | Sim (modifica o sistema) | Incerto | NT14M listado com limite de versão "?" [C1][C2]. Pode exigir downgrade e alteração no menu de serviço | Desconhecida, alto risco | **Rejeitado** |
| M7 | Root pelo método "Skype" | Sim | — | "T-NT14 nunca foi rooteável por este método" [C5] | Incompatível | Descartado |
| M8 | Substituir o Smart Hub / definir como tela inicial | Provavelmente exige M6 | — | Nenhuma | Desconhecida | Fora do escopo |
| M9 | **Instalação por USB com arquivo `.sig`** (DUID + chamado no Seller Office) | Não | Parcial | O FAQ legado descreve o processo; a própria Samsung diz que apps legados por USB só funcionam na plataforma de 2012 e "não são recomendados", e outra página diz que a instalação por USB não é mais suportada por segurança [F4][S24] | Incompatível / sem evidência para 2014 | **Excluído**: depende de um canal (Seller Office) que não aceita mais a plataforma legada |
| M10 | *USB Demo Packaging Tool* (`.tmg`) | Não | Desconhecida | Citada em [S24], sem relação documentada com 2014 | Desconhecida | **Excluído** desta etapa |

---

## 8. Riscos de cada alternativa

| Método | Principais riscos | Mitigação |
|---|---|---|
| M2 (navegador da TV) | Navegador inexistente, sem HTTPS ou quebrado. Teclas capturadas pelo navegador (cursor virtual). Página lenta. | Sem risco ao aparelho. Servidor só na rede local, sem dados pessoais. Só testar se H-01 mostrar um navegador |
| M3 (User App Sync) | Login com conta especial. App de usuário com permissões desconhecidas. Ferramenta antiga no PC. Possível perda do app em reset ou atualização (D-15) | Usar só o pacote do próprio projeto. SDK em máquina virtual isolada. Documentar a remoção antes de instalar |
| M4 | Código de terceiros com acesso à rede e à TV | Rejeitado |
| M6/M7 | Inutilizar a TV (*brick*). Perda de garantia ou de suporte. Necessidade de downgrade. Alteração no menu de serviço | Rejeitado. **Não presumir** que um reset de fábrica recupera a TV |
| M9/M10 | Depender de um canal descontinuado; enviar o DUID da TV a terceiros; instalar pacote com licença de origem duvidosa | Excluídos |

---

## 9. Testes necessários para confirmar a compatibilidade

Executar **somente após autorização explícita**, em ordem crescente de risco:

| # | Teste | Método | Pré-requisito | Altera a TV? |
|---|---|---|---|---|
| H-01 | **Observação:** anotar a lista de apps do Smart Hub (existe app de navegador, "Internet" ou "Web Browser"?), os menus (existe login de conta/desenvolvedor?) e fotografar *Informações do produto* | Observação | Autorização | Não |
| H-02 | **Só se H-01 achar um navegador:** abrir `http://<ip-do-pc>:8080` pela rede local (`npm run serve`, ver DEPLOYMENT.md) | M2 | H-01 positivo + autorização | Não (pode ficar no histórico do navegador) |
| H-03 | Página de diagnóstico: user agent, ES5 (JSON, `Array.prototype.forEach`, `Object.keys`), `localStorage`, `transform` | M2 | H-02 | Não |
| H-04 | Captura de teclas: registrar o `keyCode` de cada tecla do controle | M2 | H-02 | Não |
| H-05 | Navegar no protótipo completo e medir a fluidez | M2 | H-02 | Não |
| H-06 | Verificar se o menu `develop` / *IP Setting* existe (sem sincronizar) | M3 | SDK oficial lido + autorização | Login reversível |
| H-07 | Sincronizar um pacote "olá mundo" do próprio projeto e removê-lo | M3 | H-06 + procedimento de remoção documentado | Sim (app de usuário) |

---

## 10. Recomendação técnica

1. **Agora:** o protótipo web em ES5 com camada de plataforma separada está concluído e
   testado no computador ([TEST_PLAN.md](TEST_PLAN.md)). Ele segue como ambiente principal.
2. **Pendências sem risco (P-01 a P-04):** ler na íntegra, em um navegador comum, as fontes
   oficiais listadas na seção 11; localizar o SDK 5.1 e o guia de 2014; obter o manual do
   modelo (resolução, D-01).
3. **Primeiro contato com o hardware (com autorização):** apenas **H-01 (observação)**. Ele
   decide o caminho seguinte (seção 14).
4. **Se houver navegador:** testes H-02 a H-05. **Se não houver navegador:** o caminho B fica
   descartado para esta unidade e o caminho C passa a ser avaliado só documentalmente.
5. **Não seguir** caminhos de root, downgrade, menu de serviço, servidores de terceiros,
   instalação por USB/`.sig` ou Seller Office.
6. **Expectativa realista:** mesmo no melhor caso, o Smart Hub Personalizado seria **um app
   aberto a partir do Smart Hub original**, e não um substituto da tela inicial. Os serviços
   de streaming continuarão dependendo dos apps oficiais que ainda existirem na TV.

---

# Etapa 2 — Validação documental e decisão de viabilidade

## 11. Validação das fontes oficiais

Para cada fonte, foi feita primeiro uma tentativa de **leitura direta** (ferramenta de
busca de páginas e `curl` pelo proxy do ambiente). Em seguida, foram obtidos **resumos de
busca**. Os dois níveis **não são equivalentes**: o resumo é produzido por uma ferramenta
intermediária, pode omitir ou resumir mal o texto e não substitui a leitura da página.

| ID | Fonte | Leitura direta | Resumo de busca | O que o resumo sustenta |
|---|---|---|---|---|
| F1 | [Plataforma legada — visão geral](https://developer.samsung.com/smarttv/legacy/overview.html) | **Não.** Falha de DNS na ferramenta e `CONNECT 403` no proxy | Sim, com trecho | Emuladores por ano: SDK 1.5 (2010), 2.5 (2011), 3.5 (2012), 4.5 (2013) e **"5.1 Beta" (2014)**. "O SDK mais recente inclui emuladores de todas as plataformas" |
| F2 | [Histórico de versões do SDK](https://developer.samsung.com/smarttv/legacy/tools/history.html) | **Não** (mesmo erro) | Parcial: apenas título e URL com trecho incompleto | Nenhuma data ou lista de sistemas operacionais do 5.1 foi obtida. **Pendência** |
| F3 | [Guia de desenvolvimento legado — Getting started](https://developer.samsung.com/smarttv/legacy/development-guides/getting-started.html) | **Não** (mesmo erro) | **Só título e URL** (apareceu em listas de resultados, sem trecho) | Nada além da existência da página. **Pendência** |
| F4 | [FAQ da plataforma legada](https://developer.samsung.com/smarttv/legacy/samsung-legacy-platform-faq.html) | **Não** (mesmo erro) | Sim, com trecho | Modelos 2010–2014 executam **apenas** apps legados; 2015 executa legados por compatibilidade; 2016+ só Tizen. Teste por USB exige arquivo `.sig` obtido no Seller Office com o DUID da TV (às vezes renomeado `Developer.sig`). Cita que apps legados por USB só funcionam na plataforma 2012 e "não são recomendados" (**página de origem dessa frase não identificada com certeza**) |
| F5 | [Suporte do modelo UN48H4203AGXZD](https://www.samsung.com/br/support/model/UN48H4203AGXZD/) | **Não** (DNS e `CONNECT 403`) | Sim, **apenas a existência da página** e a lista de downloads | Existem manual em PT/EN (junho de 2014), guia de atualização para TVs 2014 (abril de 2015) e outro manual de atualização (outubro de 2015). Os arquivos **não foram abertos**; não há especificações, firmware 1080.3 nem 2017 |

**Resultado: 0 de 5 fontes obrigatórias lidas diretamente.**

Outras páginas oficiais da Samsung foram encontradas **apenas por resumos de busca** (todas
sem leitura direta). As principais estão em [`research/SOURCES.md`](../research/SOURCES.md),
IDs S15 a S28: Seller Office (submissão legada encerrada), Q&A de especificações, arquivo de
SDKs, guia do IDE "compatível com SDK 5.1", guia de teste em TV de 2014, Remote Web Inspector,
CSS3 Browser Specification, W3C/HTML5 API References, User-Agent String Format, Application
Installation Q&A e as páginas de API legada (`Widget`, Return × Exit).

**Pendência P-01 (reforçada):** o usuário, ou outro ambiente com acesso, pode abrir esses
endereços, salvar como PDF ou HTML e anexá-los. Isso converteria resumos em leitura direta.

---

## 12. Respostas às perguntas técnicas

Cada resposta traz o **nível de evidência** e o **acesso à fonte**.

### 1. Qual plataforma de aplicativos corresponde à geração de 2014?

**Samsung Smart TV Legacy Platform** (comunidade: "Orsay"), baseada em aplicações web
(HTML/CSS/JS) com APIs Samsung. A Samsung afirma que modelos de 2010 a 2014 executam apenas apps
legados e que o emulador "5.1 Beta" é o da plataforma 2014 [F1][F4][S16].

- **Nível:** Confirmada para a plataforma ou geração.
- **Acesso:** resumos de busca de páginas oficiais.
- **Modelo exato:** a página do modelo não foi lida (F5). Nada indica que a UN48H4203AGXZD
  seja exceção, mas isso **não está confirmado para o modelo exato**.

### 2. O SDK 5.1 tem documentação e ferramentas para desenvolver aplicações nessa plataforma?

Sim, segundo o portal: há emulador "5.1 Beta" para 2014 [F1], documentação legada, um guia do IDE
"compatível com SDK 5.1" [S18] e o guia de teste em TV "compatível com SDK 5.0, 5.1 e modelos
2014" [S1]. O arquivo de SDKs diz oferecer o SDK das TVs 2012–2015 da plataforma legada [S17].

- **Nível:** Confirmada para a plataforma ou geração (existência de documentação e ferramenta).
- **Desconhecida:** se o SDK 5.1 completo ainda está disponível para download (D-05), em que
  versão (o emulador é "Beta") e se o arquivo oficial atual é íntegro. Um relato de fórum diz que
  a 5.0 foi removida [C15] (indício indireto).
- **Acesso:** resumos de busca. A página de histórico (F2) não foi lida.

### 3. Quais sistemas operacionais eram oficialmente suportados pelo SDK 5.1?

Pelos resumos: o guia do IDE "compatível com SDK 5.1" lista **Windows 7 (recomendado), Windows XP
SP2 ou superior, Linux (Ubuntu recomendado) e Mac OS X**, com **Oracle JDK 1.6 ou superior** [S18].
A visão geral do SDK 5.0 cita Windows, Mac OS X e Linux; a do 4.5 cita também 32 e 64 bits
[S20].

- **Nível:** Confirmada para a plataforma ou geração.
- **Acesso:** resumos de busca. Os requisitos exatos do 5.1 (versões de Mac OS X, distribuições
  Linux) **não foram obtidos**.
- **Desconhecida:** funcionamento em sistemas operacionais atuais. **Esse SDK não deve ser
  executado no computador principal** (ver seção 14).

### 4. Existe uma forma documentada de executar aplicações de teste em TVs de 2014?

Sim: o guia *Testing Your Application on a TV for 2014* descreve **User Applications**, enviadas
do PC de desenvolvimento para a TV: configurar o *User App Sync Server* do SDK, empacotar o app,
fazer login na TV, informar o IP do PC e iniciar o *User App Sync* pelo controle [S1][S19].
Mudanças exigem reempacotar e sincronizar de novo.

- **Nível:** Confirmada para a plataforma ou geração.
- **Acesso:** resumos de busca (duas buscas independentes). A página não foi lida.
- **Rota alternativa por USB (`.sig`):** descrita no FAQ [F4], mas a própria Samsung a trata como
  restrita ou não recomendada [S24]. **Excluída.**

### 5. Quais requisitos, autenticações, certificados ou assinaturas são necessários?

- **User App Sync:** login na TV com o ID `develop` (o guia de 2014 fala em senha em branco;
  a tela de acesso é descrita como *Smart Features > Samsung Account > Log In* na versão 2014 e
  de outra forma em 2013, onde a conta já vem criada); informar o IP do PC no *Develop IP /
  IP Setting*; servidor de sincronização do SDK em execução; PC e TV na mesma rede [S1][S19][S25].
- **Certificados/assinaturas para User App Sync:** **os resumos não citam nenhum** (D-12).
- **Rota USB `.sig`:** exige o DUID da TV e um chamado no Seller Office [F4] (excluída).
- **Apps publicados:** exigem assinatura do autor e a mesma certificação nas atualizações
  [S15]. Não se aplica ao teste local.
- **Nível:** Confirmada para a plataforma ou geração (login e IP); **Desconhecida** (assinatura).
- **Acesso:** resumos de busca. Há divergência entre guias de terceiros sobre a senha
  (em branco, `000000`, `111111`); **não adotar valores de terceiros**.

### 6. O User App Sync está documentado para 2014? Há evidência para o modelo e o firmware?

- **Documentado para 2014:** sim [S1][S19] — **Confirmada para a plataforma ou geração.**
- **Para a UN48H4203AGXZD com firmware 1090.0:** **nenhuma evidência encontrada** — nem oficial,
  nem comunitária. **Desconhecida.**
- **Ponto de atenção:** a UN48H4203AG é de entrada ("Série 4"). Nenhuma fonte lida diz que modelos
  da série 4 tenham ou não o menu de conta/desenvolvedor. A única forma de saber é a
  observação H-01/H-06 no aparelho.

### 7. É possível comprovar que o navegador da TV aceita páginas servidas por um computador na rede local?

**Não, com a documentação disponível.** Esta resposta corrige a Etapa 1.

- Nenhuma fonte afirma que a UN48H4203AG tem navegador web. Os resumos das páginas de suporte do
  modelo e de modelos irmãos não listam essa característica.
- Há **indício indireto** de que o navegador **não é universal** nos modelos de 2014: um
  moderador da comunidade Samsung observa que o suporte ao navegador está ausente em alguns
  modelos mais antigos; um usuário relata que a ficha oficial de um modelo de 2014 listava o
  navegador como ausente (paráfrases de resumos de busca, ver [C14]).
- Onde existe, relatos dizem que **não suporta HTTPS**, não pode ser substituído e pode ter parado
  de funcionar [C14]. O servidor do protótipo usa HTTP; se HTTP em IP local funciona, **não há
  fonte**.
- O user agent oficial da plataforma 2014 (WebKit 537.42) [S21] descreve o ambiente de apps, e
  **não prova** que exista um navegador de usuário.
- **Nível:** Desconhecida (indício indireto de que pode não existir).
- **Como comprovar:** observação H-01 (existe app de navegador?) e, só então, H-02.

### 8. Quais recursos HTML, CSS e JavaScript podem ser usados com segurança no protótipo antes de testar no aparelho?

Nenhum recurso pode ser declarado "seguro" sem teste no aparelho. O que a documentação permite
dizer:

| Recurso | Evidência | Nível |
|---|---|---|
| JavaScript ES5 (sem `let`, `const`, setas, classes, `Promise`) | Nenhuma fonte oficial informa o nível de ECMAScript. O user agent oficial é WebKit 537.42 [S21], de uma época em que o ES5 era comum nos motores WebKit/Chrome. Isso é inferência | Indício indireto |
| `JSON`, `Array.prototype.forEach`, `Object.keys` | Parte do ES5; sem fonte específica | Indício indireto |
| `localStorage` | A referência W3C/HTML5 lista *Web Storage* sem dizer em quais plataformas; as páginas que afirmam suporte são de **Tizen** [S23][S26]. O protótipo tem *fallback* para memória | Desconhecida |
| CSS 2D `transform` | A tabela de CSS3 "para modelos 2013/2014" marca a maioria dos itens de transformação como "Yes", e alguns como "No" [S22]. Nenhuma linha foi lida | Confirmada para a geração (parcial) |
| CSS `transition` | Sem evidência específica nos resumos | Desconhecida |
| `@font-face` (fontes personalizadas) | "Desde os modelos 2014" [S22]. O protótipo **não** usa fontes personalizadas | Confirmada para a geração (resumo) |
| Flexbox, grid, variáveis CSS, `calc()` | Sem evidência | Desconhecida (evitar, como hoje) |
| Eventos de teclado no `document` | O guia legado trata de *Handling Key Events* e usa `Common.API.TVKeyValue` [S27]. Não foi lido como os eventos chegam ao app (D-13) | Desconhecida |
| `navigator.onLine` e eventos online/offline | Sem evidência | Desconhecida |
| Recursos HTML5 em geral | Muitos itens "parciais" [S23] | Confirmada para a geração (parcial) |

**Risco registrado (sem alterar o protótipo):** a escala 1280×720 da tela inteira depende de
CSS `transform`. Se o teste H-03 mostrar que isso não funciona, será preciso um plano
alternativo em etapa posterior.

### 9. Há forma oficial de substituir o Smart Hub ou iniciar automaticamente a interface?

**Nenhum mecanismo oficial foi encontrado.**

- A documentação legada sobre Return × Exit indica que a tecla Return, por padrão, volta ao
  Smart Hub, e que `sendReturnEvent()` fecha o app e retorna ao Smart Hub [S27] — o app é um
  convidado.
- A página oficial sobre *prelaunch* se aplica a **Tizen 2015–2018**, não a 2014 [S28].
- Q&As oficiais (de páginas voltadas à plataforma atual) dizem que apps instalados por USB não
  são iniciados automaticamente [S24]. Aplicação à plataforma legada **não foi estabelecida**.
- O único caminho de comunidade para mudar o comportamento do sistema é o root (M6), rejeitado.
- **Nível:** Desconhecida, com **indício indireto** de que não existe. Não é "Incompatível" porque
  não houve leitura integral de nenhuma documentação legada sobre inicialização.

### 10. Quais limitações impedem que a interface seja considerada substituta completa do sistema da TV?

1. Não substitui o Smart Hub nem inicia sozinha: o usuário abre o app a partir do Smart Hub, e o
   Return volta a ele (pergunta 9).
2. Não controla a TV: sem acesso comprovado a entradas HDMI, canais, volume, configurações ou
   apps nativos (`Abrir aplicativo` permanece não implementado).
3. Serviços de streaming dependem dos apps oficiais; Netflix provavelmente indisponível [S7].
   DRM e autenticação ficam fora do escopo.
4. Sem loja e sem publicação: o app só existiria como app de usuário de teste, com possível
   perda em reset do Smart Hub [S8] ou em atualização (D-15).
5. Mídia local (USB/DLNA): sem integração comprovada.
6. Hardware de entrada de 2014 com recursos desconhecidos; fluidez não medida.
7. Ferramental legado, de 2013–2014, sem suporte, com disponibilidade incerta.
8. Navegador possivelmente inexistente neste modelo (pergunta 7).
9. Nenhuma evidência para o modelo exato nem para o firmware 1090.0.

---

## 13. Avaliação dos três caminhos

### A. Protótipo web no computador

| Aspecto | Avaliação |
|---|---|
| Viabilidade | **Confirmada** (existente, testado: 20/20 unitários, verificação ES5/CSS aprovada, 11/11 ponta a ponta) |
| Evidências | Resultados em [TEST_PLAN.md](TEST_PLAN.md) |
| Limitações | **Não comprova nada sobre a TV.** Navegador moderno, teclado do PC, adaptador simulado |
| Riscos | Falsa confiança: passar nos testes não implica funcionar no legado |
| Próximo critério | Continua como ambiente principal. Qualquer alteração futura deve manter a verificação ES5/CSS |

### B. Protótipo aberto no navegador da TV pela rede local

| Aspecto | Avaliação |
|---|---|
| Viabilidade | **Desconhecida**; depende de existir um navegador na UN48H4203AG (pergunta 7) |
| Evidências | Nenhuma de que o modelo tenha navegador. Indícios de que alguns modelos 2014 não têm, de que não há HTTPS e de que o navegador pode estar quebrado [C14] |
| Pré-requisitos | Autorização; PC e TV na mesma rede local; app de navegador visível no Smart Hub; `HOST=0.0.0.0 npm run serve`, encerrado após o teste |
| O que pode validar | Existência e uso do navegador; user agent e recursos ES5/CSS (H-03); códigos de tecla (H-04); fluidez (H-05); se HTTP em IP local funciona |
| O que **não** valida | Execução como app de usuário (outro motor/ambiente, outras APIs, `Common.API`); persistência no modo app; abertura automática; instalação |
| Limitações | O navegador é um ambiente diferente do de apps; o cursor virtual pode capturar as setas |
| Riscos | Baixos para o aparelho (nada instalado, configurações intactas); possível entrada no histórico do navegador |
| Próximo critério | **H-01:** se não houver app de navegador → caminho B descartado nesta unidade; se houver → H-02 a H-05 |

### C. Aplicativo Samsung Legacy de teste

| Aspecto | Avaliação |
|---|---|
| Viabilidade | **Confirmada para a plataforma ou geração** (existe método oficial de teste para 2014); **Desconhecida para o modelo e o firmware** |
| Evidências | Guia oficial de 2014 compatível com SDK 5.0/5.1 [S1][S19]; emulador "5.1 Beta" [F1]; guia do IDE [S18]. Nenhuma evidência específica para H4203/1090.0 |
| Pré-requisitos | Leitura integral de F1–F4 e dos guias [S1][S18][S27]; SDK 5.1 obtido de domínio Samsung (D-05); máquina virtual isolada com sistema e JDK compatíveis; pacote "olá mundo" mínimo e revisado; procedimento de remoção documentado; autorização; observação H-06 |
| O que pode validar | Se o modelo aceita app de usuário; o motor e as APIs reais de apps (`Widget`, `TVKeyValue`); teclas; persistência; fluidez; se o app aparece no Smart Hub |
| O que **não** valida | Substituição do Smart Hub; abertura de apps nativos; mídia local; serviços de streaming |
| Limitações | SDK possivelmente indisponível ou apenas emulador beta; ferramenta de 2013–2014 em máquina virtual; desconhecimento de assinatura e certificados (D-12) e de remoção (D-14) |
| Riscos | Médios: ferramenta antiga no PC (R-04), login especial na TV, perda de apps em reset (R-02), efeitos de firmware desconhecidos (D-15). Baixo risco de inutilizar a TV pelo método oficial, **mas não há prova no modelo** |
| Próximo critério | **Só avaliar instalação** quando houver: leitura integral das fontes oficiais; SDK oficial disponível; H-01/H-06 mostrando o menu de login; procedimento de remoção claro; autorização explícita. Não presumir que a documentação genérica vale para o firmware 1090.0 |

---

## 14. Decisão

### O que está comprovado

- **Comprovado por testes no computador:** o protótipo funciona e passa nos testes (20/20 unitários,
  verificação ES5/CSS, 11/11 ponta a ponta). **Isso não prova compatibilidade com a TV.**
- **Confirmado para a plataforma ou geração (por resumos de páginas oficiais, sem leitura
  direta):**
  - modelos de 2010–2014 executam apps da plataforma legada;
  - existe documentação, emulador "5.1 Beta" e guia de teste em TV para 2014 (User App Sync com
    login `develop`, IP do PC e sincronização);
  - a submissão de apps legados à loja foi encerrada;
  - o Tizen Studio não gera pacotes para essa plataforma;
  - o user agent oficial da plataforma 2014 é WebKit 537.42;
  - a documentação legada cita `Common.API.Widget` (`sendReadyEvent`, `sendReturnEvent`) e
    `Common.API.TVKeyValue`;
  - por padrão, Return volta ao Smart Hub.
- **Confirmado para a família do firmware:** `T-NT14M` existe e é citada pela comunidade.

### O que continua desconhecido

- Qualquer fato **específico da UN48H4203AGXZD e do firmware 1090.0** (nenhuma evidência
  encontrada, oficial ou comunitária).
- Se a TV **tem navegador** e se ele aceita HTTP em IP local.
- Se o menu de login/desenvolvedor existe nesta TV de entrada.
- Disponibilidade atual do SDK 5.1 e requisitos exatos de sistema; se há exigência de
  assinatura/certificado no User App Sync.
- Nível de ECMAScript; suporte a `localStorage`, `transition` e `navigator.onLine`; códigos de tecla
  e como os eventos chegam ao app.
- Resolução do painel, memória e desempenho.
- Como remover um app de usuário com segurança e se uma atualização o apaga.
- Se existe qualquer mecanismo para inicialização automática.

### Caminho recomendado

1. **A (computador) como ambiente principal.**
2. **Leitura integral das fontes oficiais** em ambiente com acesso (P-01), antes de qualquer
   decisão sobre o caminho C.
3. **B ou C** só serão escolhidos depois da observação H-01:
   - H-01 **encontra navegador** → seguir com **B** (H-02 a H-05), que é o de menor risco;
   - H-01 **não encontra navegador** → **B descartado**; seguir só com a **avaliação documental
     de C**, sem instalar nada.

### Teste que deve acontecer a seguir

**H-01 — observação (sem alterar nada), com autorização explícita:** na TV, anotar (e fotografar)
os apps do Smart Hub (em especial "Internet", "Web Browser" ou equivalente), a tela
*Informações do produto* (versão `T-NT14MUABC-1090.0`) e a existência de um menu de conta/login.
**Não** entrar em login de desenvolvedor, **não** alterar configurações e **não** abrir o menu de
serviço.

Em paralelo, e sem a TV: **P-01/P-02** (leitura integral das fontes oficiais; manual do modelo para
D-01).

### O que não deve ser tentado

- Root, SamyGO, exploits, downgrade/upgrade de firmware, menu de serviço, "OTN support".
- Instalação por USB com `.sig`, DUID, chamados no Seller Office ou *USB Demo Packaging Tool*.
- Servidores de sincronização de terceiros e IPs divulgados em guias.
- Download ou execução do SDK 5.1 antes de ler a documentação oficial; nunca no computador
  principal.
- Tentar Tizen Studio ou pacotes `.wgt` para esta TV.
- Prometer substituição do Smart Hub, início automático, abertura de apps nativos, reprodução de
  streaming ou suporte a "Java".
- Acessar páginas HTTPS pelo navegador da TV (relato de não suportar) ou presumir que o navegador
  exista.
- Alterar o protótipo para "adivinhar" a plataforma antes dos testes (ex.: remover `transform`).

### Evidências ainda necessárias para avaliar a instalação de um aplicativo

1. Leitura **integral** de F1–F4, do guia de teste em TV de 2014 [S1], do guia do IDE [S18] e da
   seção de eventos de tecla [S27].
2. SDK 5.1 (ou instruções oficiais para o *User App Sync Server*) **disponível em domínio Samsung**,
   com versão, hash e requisitos oficiais de sistema; máquina virtual isolada preparada.
3. Confirmação **no aparelho, por observação**, de que o menu de login/IP existe (H-01, depois H-06).
4. Esclarecimento oficial sobre **assinatura/certificado** no User App Sync (D-12).
5. Procedimento oficial de **remoção** do app de usuário e comportamento em reset/atualização
   (D-14, D-15).
6. Preferencialmente, **relato específico** de uma TV H4/NT14M com User App Sync (não encontrado).
7. Pacote "olá mundo" mínimo, revisado, sem rede e sem dados pessoais.
8. Autorização explícita e respostas escritas às 8 perguntas de [SECURITY.md](SECURITY.md).

### Incertezas registradas desta etapa

- Nenhuma das 5 fontes oficiais obrigatórias foi lida diretamente.
- As conclusões "Confirmada para a plataforma ou geração" vêm de resumos e podem conter erros.
- A premissa de navegador da Etapa 1 foi **rebaixada** (de provável para desconhecida).
- A frase sobre USB "não recomendado/apenas 2012" não teve a página de origem identificada.
