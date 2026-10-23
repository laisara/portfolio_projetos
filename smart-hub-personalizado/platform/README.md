# platform/ — Integração com a TV

Esta pasta guarda o que é **específico da plataforma da TV**. Nada aqui foi executado em uma
Samsung UN48H4203AG.

| Arquivo | Estado | Uso |
|---|---|---|
| `adapters/orsay-adapter.draft.js` | **Rascunho, não testado** | Esboço de adaptador para a plataforma legada ("Orsay"). Não é carregado pelo protótipo. |

O adaptador usado pelo protótipo (`prototype/scripts/platform/browser-adapter.js`) é uma
**simulação** em navegador de computador.

## Contrato do adaptador

Todo adaptador precisa fornecer o mesmo conjunto de campos (detalhes em
[`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md#contrato-do-adaptador-de-plataforma)):

`id`, `name`, `isSimulation`, `keymap`, `keyHints`, `ready()`, `storageBackend()`,
`isOnline()`, `onConnectivityChange(cb)`, `getSystemInfo()`, `exit()`.

## Regras para evoluir esta pasta

1. Nenhuma API entra como "suportada" sem fonte oficial **ou** teste no aparelho
   registrado em [`docs/PLATFORM_COMPATIBILITY.md`](../docs/PLATFORM_COMPATIBILITY.md).
2. Códigos de tecla não são fixados no código: devem vir da plataforma ou de um teste
   de captura de teclas feito no aparelho.
3. Toda chamada a API da TV deve ter detecção de recurso e degradação segura.
4. O pacote de destino (`config.xml`, zip, etc.) **não** será criado enquanto o SDK e o
   formato de instalação não forem confirmados (ver [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md)).
