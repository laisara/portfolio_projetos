# Checklist manual — teste no Roku Express 3960BR

> **Só use depois de uma autorização explícita para instalar o app no aparelho.**
> Nesta etapa, nenhum item foi executado no hardware. Marque `[x]` ao aprovar e anote a
> data, a versão do Roku OS (Configurações → Diagnóstico) e as observações.

Data: ____ · Roku OS: ____ · Modelo exibido no Diagnóstico: ____ · Pacote (`build_version`): ____

## Abertura
- [ ] O ícone "Aurora TV" aparece na tela inicial do Roku (última fileira, por ser sideload)
- [ ] O splash aparece e o app abre na tela Início em menos de 5 s
- [ ] O destaque mostra imagem, título, sinopse, "Ver detalhes" e "Adicionar aos favoritos"
- [ ] "Versão demonstrativa" aparece sob o nome do app
- [ ] Nenhum texto ou imagem é cortado nas bordas da TV (overscan)

## Navegação (controle remoto)
- [ ] Esquerda/direita alternam os botões do destaque; o realce é imediatamente visível
- [ ] Baixo no destaque leva às fileiras, com o conteúdo subindo em animação curta
- [ ] Esquerda/direita percorrem os cartões; o anel de foco e a ampliação acompanham
- [ ] Segurar a seta rola as fileiras sem travar
- [ ] Cima na primeira fileira volta ao destaque; cima no destaque vai para a barra de abas
- [ ] Na barra, esquerda/direita movem o realce; OK troca de aba; baixo entra no conteúdo
- [ ] Em nenhum momento o foco desaparece

## Detalhes e favoritos
- [ ] OK num cartão abre os detalhes com a imagem do título
- [ ] "Assistir"/"Continuar" mostra "Conteúdo demonstrativo: a reprodução não está disponível nesta versão."
- [ ] "Adicionar aos favoritos" mostra o aviso e o botão muda para "Remover dos favoritos"
- [ ] Voltar fecha os detalhes e o foco volta ao mesmo cartão
- [ ] A aba Favoritos mostra o título na hora; vazia, mostra a mensagem de estado vazio
- [ ] Remover o favorito pelos detalhes atualiza a aba Favoritos ao voltar

## Abas
- [ ] Filmes e Séries: o painel superior atualiza título, ano, gênero e sinopse ao mover o foco
- [ ] Coleções no Início abrem a aba Filmes/Séries já na fileira correspondente
- [ ] Minha biblioteca: barras de progresso e o aviso de biblioteca de demonstração
- [ ] Configurações: "Tema visual" alterna entre Aurora Noturna e Aurora Boreal em todas as telas
- [ ] Configurações: "Limpar favoritos" funciona e avisa quando não há favoritos
- [ ] Diagnóstico mostra modelo, Roku OS, interface (esperado: HD 1280x720) e design (FHD 1920x1080)

## Voltar e saída
- [ ] Voltar numa aba diferente do Início volta ao Início, com o foco na barra
- [ ] Voltar no conteúdo do Início sobe para a barra
- [ ] Voltar na barra do Início fecha o app
- [ ] Home sai para a tela inicial do Roku (comportamento do sistema)

## Persistência
- [ ] Ao reabrir o app, o tema e os favoritos escolhidos continuam

## Desempenho e aparência
- [ ] Pílulas e painéis com cantos arredondados corretos (9-patch)
- [ ] Textos legíveis a cerca de 3 m; tamanhos coerentes entre telas
- [ ] (Opcional) `r2d2_bitmaps` (porta 8080) sem pressão excessiva de memória de textura
- [ ] Console de depuração (porta 8085) sem erros durante todo o checklist

Observações:
