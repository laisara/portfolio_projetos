# Segurança

Objetivo: **preservar a TV** e evitar a execução de código não confiável, tanto na TV quanto
no computador.

## Regras do projeto

1. Nenhuma ação na TV sem **autorização explícita** do proprietário para aquele teste
   específico.
2. Nada de atualizar, fazer *downgrade*, desbloquear, fazer root ou redefinir a TV como
   parte do projeto.
3. Nada de acessar o **menu de serviço** ou alterar parâmetros internos. Isso inclui
   "OTN support", citado pelos guias de root [C1].
4. Nada de instalar certificados, executáveis ou pacotes de origem desconhecida, nem
   sincronizar apps a partir de **servidores públicos de terceiros**.
5. Não incluir no repositório firmware proprietário, credenciais, certificados privados ou
   instaladores de procedência duvidosa.
6. **Não presumir** que um reset de fábrica recupera a TV se o firmware for danificado.

## Riscos identificados

| ID | Risco | Onde | Probabilidade | Impacto | Prevenção |
|---|---|---|---|---|---|
| R-01 | TV inutilizada (*brick*) por root ou firmware | Métodos M6/M7 | Alta se tentado | Crítico | Métodos rejeitados |
| R-02 | Perda de apps ou configurações por reset do Smart Hub | Remoção de app de usuário (M3) | Média | Médio | Anotar a configuração antes (H-01). Usar o reset só como último recurso [S8] |
| R-03 | App de terceiro com acesso à rede local ou a dados da TV | M4 | Alta se usado | Alto | M4 rejeitado. Só o código deste repositório |
| R-04 | SDK antigo (2013–2014) com vulnerabilidades ou dependências obsoletas no PC | M3 | Média | Médio | Usar só fonte oficial Samsung, conferir o hash quando houver e rodar em **máquina virtual isolada**, sem dados pessoais |
| R-05 | Servidor do protótipo exposto na rede | Teste H-02 | Baixa | Baixo | `tools/serve.js` escuta só em `127.0.0.1` por padrão, serve apenas `prototype/` (bloqueia `..`) e só abre para a rede com `HOST=0.0.0.0`, durante o teste |
| R-06 | Atualização automática da TV mudar o comportamento | Qualquer teste | Desconhecida | Médio | Registrar a versão do firmware em cada teste. Não alterar a configuração de atualização |
| R-07 | Dados pessoais no app | Protótipo | Baixa | Médio | O protótipo não coleta, não guarda e não transmite dados pessoais. Guarda só preferências de interface |
| R-08 | Contorno de DRM ou autenticação de serviços | Integrações de streaming | — | Alto (legal) | Fora de escopo: os atalhos são informativos |

## Dados e permissões do protótipo

| Recurso | Uso |
|---|---|
| `localStorage` | Preferências de interface e IDs de atalhos favoritos |
| Rede | **Nenhuma requisição.** Lê apenas o estado `online`/`offline` informado pelo navegador |
| Câmera, microfone, localização, contas | Não usados |

## Antes de qualquer teste no aparelho

Responder por escrito no registro do teste ([TEST_PLAN.md](TEST_PLAN.md)):

1. O método funciona especificamente na UN48H4203AG? Qual é a evidência?
2. Há evidência de compatibilidade com o firmware `T-NT14MUABC-1090.0`?
3. O método altera o firmware? (Se sim: **não executar**.)
4. É reversível? Como?
5. Existe procedimento de recuperação documentado?
6. Há risco de perder configurações ou de inutilizar a TV?
7. Que dados e permissões o app usa?
8. Existe alternativa de teste com menos risco?
