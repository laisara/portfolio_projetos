# Relatório de viabilidade — Smart Hub Personalizado para Samsung UN48H4203AG

**Data:** 23/10/2026 · **Etapa:** 1 (investigação) · **Ações na TV:** nenhuma.

Legenda de classificação:

- **Confirmada**: há evidência específica.
- **Provável**: há evidência indireta, mas não comprovada no modelo exato.
- **Desconhecida**: depende de investigação ou de teste.
- **Incompatível**: há evidência suficiente de que não funciona.

> **Limitação do método.** Os sites da Samsung, do SamyGO e do Internet Archive estavam
> bloqueados na rede usada nesta investigação. O conteúdo deles foi obtido por resumos de
> mecanismo de busca, e não pela leitura das páginas inteiras. Detalhes e pendências estão em
> [`research/SOURCES.md`](../research/SOURCES.md). As referências [S#]/[C#] abaixo apontam para
> esse arquivo.

---

## 1. Resumo executivo

1. A UN48H4203AG é uma TV da **série H (2014)**. Essa geração usa a **plataforma legada da
   Samsung**, anterior ao Tizen e chamada de "Orsay" pela própria Samsung [S4][C8][C9].
   Classificação: **Provável**. O vínculo vale para a geração H, mas não foi confirmado
   para este modelo de entrada.
2. O firmware `T-NT14MUABC` pertence à família **NT14M**. A comunidade SamyGO cita essa
   família na série H [C1][C2][C4]. **Confirmada**, como família de firmware conhecida.
3. Para TVs de 2014, a Samsung documentou um mecanismo de **sincronização de apps de usuário**:
   conta `develop`, depois *IP Setting* e *User App Sync* a partir do SDK 5.0/5.1 [S1]. Esse
   mecanismo não altera o firmware. Classificação: **Provável** para este modelo. Não há
   evidência de que funcione na UN48H4203AG nem no firmware 1090.0.
4. A Samsung **não aceita mais publicação** de apps para TVs de 2014 [S3]. A loja oficial,
   portanto, não é um caminho viável. Classificação: **Incompatível**.
5. **Substituir o Smart Hub** ou tornar um app a tela inicial padrão: não foi encontrada
   nenhuma evidência de mecanismo oficial. O único caminho citado pela comunidade é o root
   [C1][C2]. Esse root exige possível *downgrade* e alteração no menu de serviço, e por
   isso foi **rejeitado** por segurança.
6. **Recomendação:** manter o projeto como **protótipo web em ES5**. O protótipo já foi
   construído e testado no computador. O primeiro teste em hardware, que depende de
   autorização, deve ser o de **menor risco**: abrir o protótipo pelo **navegador da própria
   TV**, servido a partir do computador na rede local. Esse teste não instala nada nem altera
   configurações. Só depois disso, e com o SDK obtido de fonte oficial, vale avaliar a
   sincronização de app de usuário.

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
- **Nenhuma atualização ou downgrade deve ser feito** (ver [SECURITY.md](SECURITY.md)).

---

## 3. Informações ainda desconhecidas

| ID | Pergunta | Como descobrir | Risco do teste |
|---|---|---|---|
| D-01 | Resolução nativa do painel (1366×768 ou 1920×1080?) | Manual do modelo ou etiqueta/especificação oficial. O irmão UA48H4200 tem 1366×768 [C12], mas outro mercado não prova nada | Nenhum |
| D-02 | A TV tem navegador web? Qual o motor (WebKit/Maple) e o nível de JavaScript? | Abrir o navegador da TV e acessar uma página de diagnóstico na rede local | Baixo (só navegação) |
| D-03 | Quais teclas do controle chegam a uma página no navegador da TV? | Página de captura de teclas na rede local | Baixo |
| D-04 | O menu de opções dos apps tem *IP Setting* / *User App Sync* depois do login `develop`? | Inspeção visual dos menus, **sem confirmar nenhuma ação** | Baixo, mas exige login com conta especial (reversível com logout) |
| D-05 | O SDK 5.0/5.1 ainda pode ser obtido de fonte oficial Samsung? | Acesso a developer.samsung.com em um navegador comum | Nenhum |
| D-06 | Com quais sistemas operacionais o SDK 5.x é compatível? Ele funciona em um SO atual? | Documentação oficial do SDK | Nenhum |
| D-07 | Existe emulador oficial para 2014 e qual a sua fidelidade? | Documentação oficial do SDK | Nenhum |
| D-08 | `localStorage` funciona e persiste nos apps de usuário e no navegador? | Teste no aparelho | Baixo |
| D-09 | O firmware 1090.0 é compatível com User App Sync? | Teste no aparelho (D-04) | Baixo |
| D-10 | Situação atual de YouTube, Globoplay, Prime Video e Spotify neste modelo | Abrir o Smart Hub original e conferir a lista de apps | Nenhum |
| D-11 | O que significa "Java Powered" nesta TV? | Manual. Provavelmente se refere a um componente Java (ex.: middleware de TV digital), mas **não há evidência**, e isso não indica suporte a apps Java de usuário | Nenhum |

---

## 4. Tecnologias potencialmente compatíveis

| Tecnologia | Situação | Classificação | Base |
|---|---|---|---|
| HTML + CSS + JavaScript (apps da plataforma legada) | Modelo de app da geração 2011–2015 | Provável | [S1][S2][S4] |
| Nível de JavaScript | As fontes conflitam: "JavaScript 1.6 / Maple 5.1" [C10] × "WebKit desde 2012" [C11] | Desconhecida | — |
| ES5 sem APIs modernas | Opção mais conservadora; é a adotada no protótipo | Escolha de projeto | — |
| CSS sem flexbox, grid, variáveis ou calc | Opção conservadora adotada | Escolha de projeto | — |
| APIs Samsung legadas (Widget, TVKeyValue, Plugin) | Nomes conhecidos da documentação legada, **não conferidos** nesta investigação | Desconhecida | — |
| Cordova/TOAST para Orsay | Biblioteca oficial existente. Repositório ativo até 2023 | Confirmada (existência) | [S4][S5][S6] |
| Tizen Studio / apps Tizen (.wgt) | A Samsung trata as TVs pré-2015 como plataforma diferente | **Incompatível** (provável) | [S3] |
| Android TV, Google TV, webOS | Plataformas diferentes | Incompatível | — |
| Apps Java ("Java Powered") | Sem evidência de suporte a apps Java de usuário | Desconhecida | — |

---

## 5. SDKs e ferramentas identificados

| Ferramenta | O que é | Disponibilidade | Riscos |
|---|---|---|---|
| **Samsung Smart TV SDK 5.0 / 5.1** | SDK oficial da geração 2014, com IDE, servidor de *User App Sync* e possivelmente emulador [S1][S2] | **Desconhecida** (D-05). Não foi baixado | Ferramenta de 2013–2014. Pode exigir SO e runtime antigos e sem patches de segurança. Executar só em **máquina virtual isolada**, a partir de fonte oficial, com hash verificado quando houver |
| Documentação legada (*Legacy Platform Library*) | Guias e referência de API | Existe no portal Samsung [S1] e parcialmente em CDN [S11]. Inacessível nesta investigação | Nenhum (leitura) |
| Samsung/cordova-sectv-orsay + TOAST | Camada Cordova para Orsay. Empacotamento em zip com `config.xml` [S4] | Confirmada (GitHub oficial) | Baixo. Útil como referência de formato, mas adiciona dependências. Não adotado por enquanto |
| Emulador | Possivelmente incluído no SDK | Desconhecida (D-07) | Um app que roda no emulador pode não rodar na TV |
| Ferramentas SamyGO (root, extensões) | Modificações de firmware | Documentadas [C1][C2] | **Alto**. Rejeitadas |

**Não presumir:** o Tizen Studio atual **não** gera pacotes para esta plataforma (ver [S3]).

---

## 6. Limitações conhecidas

1. Não é possível publicar na loja (Incompatível [S3]).
2. Não há caminho oficial conhecido para substituir o Smart Hub como tela inicial.
3. Serviços de streaming: há indício oficial de que a Netflix não funciona em TVs de 2014
   [S7]. Os demais serviços não foram verificados. **Não se deve prometer reprodução.**
4. Hardware de entrada de 2014: CPU e memória modestas (valores exatos **desconhecidos**).
   A interface deve ser leve.
5. O nível de JavaScript e CSS não foi confirmado. Por isso o protótipo usa ES5 e CSS
   conservador.
6. Os códigos das teclas do controle não foram confirmados. Por isso a camada de teclas é
   abstrata.

---

## 7. Métodos de execução investigados

| # | Método | Altera firmware? | Reversível? | Evidência para este modelo | Classificação | Decisão |
|---|---|---|---|---|---|---|
| M1 | Protótipo no **navegador do computador** | Não | — | — | Confirmada (testado) | **Adotado** |
| M2 | Protótipo aberto no **navegador da TV** a partir de servidor local | Não | Sim (nada é instalado) | Navegador existe na série H [S9]. O suporte às teclas e o nível de JS são desconhecidos | Desconhecida | **Primeiro teste em hardware recomendado** (após autorização) |
| M3 | **User App Sync** oficial (conta `develop` + SDK 5.x) | Não | Provável: remover o app, fazer logout, ou reset do Smart Hub [S8] | Documentado para modelos 2014 em geral [S1]. Sem confirmação para H4203 / 1090.0 | Provável (geração) / Desconhecida (modelo) | Segundo passo, depois de M2 e de obter o SDK oficial |
| M4 | Sincronização com **servidores públicos de terceiros** (IPs de guias) | Não | Parcial | Comunidade | — | **Rejeitado**: instala código não auditado |
| M5 | Publicação na loja Samsung Apps | Não | Sim | [S3] | Incompatível | Descartado |
| M6 | **Root SamyGO** (série H, "Network root") | Sim (modifica o sistema) | Incerto | NT14M listado com limite de versão "?" [C1][C2]. Pode exigir downgrade e alteração no menu de serviço | Desconhecida, alto risco | **Rejeitado** |
| M7 | Root pelo método "Skype" | Sim | — | "T-NT14 nunca foi rooteável por este método" [C5] | Incompatível | Descartado |
| M8 | Substituir o Smart Hub / definir como tela inicial | Provavelmente exige M6 | — | Nenhuma | Desconhecida | Fora do escopo |

---

## 8. Riscos de cada alternativa

| Método | Principais riscos | Mitigação |
|---|---|---|
| M2 (navegador da TV) | Teclas capturadas pelo navegador (cursor virtual). Página lenta. Navegador removido por atualização | Sem risco ao aparelho. Servidor só na rede local, sem dados pessoais |
| M3 (User App Sync) | Login com conta especial. App de usuário com permissões desconhecidas. Ferramenta antiga no PC | Usar só o pacote do próprio projeto. SDK em máquina virtual isolada. Documentar a remoção antes de instalar |
| M4 | Código de terceiros com acesso à rede e à TV | Rejeitado |
| M6/M7 | Inutilizar a TV (*brick*). Perda de garantia ou de suporte. Necessidade de downgrade. Alteração no menu de serviço | Rejeitado. **Não presumir** que um reset de fábrica recupera a TV |

---

## 9. Testes necessários para confirmar a compatibilidade

Executar **somente após autorização explícita**, em ordem crescente de risco:

| # | Teste | Método | Pré-requisito | Altera a TV? |
|---|---|---|---|---|
| H-01 | Anotar a lista de apps e menus atuais e fotografar a tela *Informações do produto* | Observação | — | Não |
| H-02 | Abrir o navegador da TV e acessar `http://<ip-do-pc>:8080` (`npm run serve`, com o servidor escutando na LAN; ver DEPLOYMENT.md) | M2 | Autorização | Não (pode ficar no histórico do navegador) |
| H-03 | Página de diagnóstico: user agent, ES5 (JSON, `Array.prototype.forEach`, `Object.keys`), `localStorage`, `transform` | M2 | H-02 | Não |
| H-04 | Captura de teclas: registrar o `keyCode` de cada tecla do controle no navegador | M2 | H-02 | Não |
| H-05 | Navegar no protótipo completo pelo navegador da TV e medir a fluidez | M2 | H-02 | Não |
| H-06 | Verificar se o menu `develop` / *IP Setting* existe (sem sincronizar) | M3 | SDK oficial obtido + autorização | Login reversível |
| H-07 | Sincronizar um pacote "olá mundo" do próprio projeto e removê-lo | M3 | H-06 + procedimento de remoção documentado | Sim (app de usuário) |

---

## 10. Recomendação técnica

1. **Agora:** o protótipo web em ES5 com camada de plataforma separada está concluído e
   testado no computador ([TEST_PLAN.md](TEST_PLAN.md)).
2. **Pendências sem risco (P-01, P-02):** reler as fontes oficiais em um navegador comum,
   localizar o SDK 5.1 e o guia de 2014 no portal Samsung e obter o manual do modelo
   (resolução, D-01).
3. **Primeiro contato com o hardware (com autorização):** testes H-01 a H-05 pelo
   navegador da TV. Não instalam nada e respondem às maiores dúvidas: motor JS, teclas e
   desempenho.
4. **Se H-02 a H-05 forem positivos:** avaliar M3 (User App Sync) com o SDK oficial
   executado em máquina virtual. Só então criar o pacote de destino e o adaptador real
   (`platform/adapters`).
5. **Não seguir** caminhos de root, downgrade, menu de serviço ou servidores de terceiros.
6. **Expectativa realista:** mesmo no melhor caso, o Smart Hub Personalizado seria **um app
   aberto a partir do Smart Hub original**, e não um substituto da tela inicial. Os serviços
   de streaming continuarão dependendo dos apps oficiais que ainda existirem na TV.
