# Checklist manual — teste no Roku Express 3960BR

> **Só use depois de uma autorização explícita para instalar o app no aparelho.**
> Nesta etapa, **nenhum item foi executado no hardware**. Marque `[x]` ao aprovar e anote a
> data, a versão do Roku OS (Configurações → Diagnóstico) e as observações.

Data: ____ · Roku OS: ____ · Modelo exibido no Diagnóstico: ____ · Pacote (`build_version`): ____

## 1. Abertura
- [ ] O ícone "Aurora TV" aparece na tela inicial do Roku (última fileira, por ser sideload)
- [ ] O splash aparece e o app abre na tela Início em menos de 5 s
- [ ] A barra superior mostra a marca, "Versão demonstrativa" e as 7 abas: Início, Filmes, Séries, Aplicativos, Biblioteca, Busca, Configurações
- [ ] A última aba (Configurações) não é cortada pela borda direita
- [ ] Nenhum texto ou imagem importante é cortado pelas bordas da TV (overscan)

## 2. Banner em carrossel (Início)
- [ ] Banner mostra imagem, selo, título, metadados, sinopse, "Ver detalhes" e o indicador de pontos
- [ ] Direita troca para o banner seguinte; o ponto ativo vira pílula; a imagem acompanha
- [ ] Esquerda volta ao banner anterior; nas pontas a tecla não faz nada (sem dar a volta)
- [ ] **Não há troca automática** de banner
- [ ] OK abre os detalhes do banner atual

## 3. Fileiras (Início)
- [ ] Baixo no banner recolhe o banner e entra na 1ª fileira ("Continue assistindo"), em animação curta
- [ ] As 7 fileiras aparecem na ordem: Continue assistindo, Em alta, Filmes para você, Séries para você, Ficção científica e fantasia, Recomendados, Seus aplicativos
- [ ] O cartão com foco recebe anel na cor de destaque e leve ampliação, imediatamente visível
- [ ] Segurar a seta rola as fileiras sem travar
- [ ] Cima na 1ª fileira volta ao banner; cima no banner vai para a barra de abas
- [ ] O foco nunca desaparece

## 4. Detalhes e favoritos
- [ ] OK num cartão abre os detalhes com imagem, título, metadados e sinopse
- [ ] "Assistir"/"Continuar" mostra "Conteúdo demonstrativo: a reprodução não está disponível nesta versão."
- [ ] Em aplicativos, "Abrir" mostra "Conteúdo demonstrativo: o aplicativo não pode ser aberto nesta versão."
- [ ] "Adicionar aos favoritos" mostra o aviso e o botão muda para "Remover dos favoritos"
- [ ] Voltar fecha os detalhes e o foco volta **ao mesmo cartão** (Início, Filmes, Aplicativos, Biblioteca e Busca)

## 5. Abas de catálogo
- [ ] Filmes e Séries: o painel superior atualiza título, metadados e sinopse ao mover o foco
- [ ] Aplicativos: 4 fileiras de cartões 16:9 com ícones de glifo; aviso de "aplicativos fictícios"
- [ ] Biblioteca: barras de progresso; ao favoritar um título, a fileira **Favoritos** aparece na hora ao voltar
- [ ] Remover o favorito pelos detalhes faz a fileira Favoritos sumir ao voltar

## 6. Busca
- [ ] Baixo na barra entra no teclado; a tecla com foco é inconfundível
- [ ] As setas percorrem as 36 teclas e as 2 teclas largas sem travar; as pontas não dão a volta
- [ ] OK digita; o texto aparece na caixa; "Espaço" e "Apagar" funcionam
- [ ] Sem texto, a fileira mostra "Sugestões"
- [ ] **"ORBITA" (sem acento) encontra "Órbita Baixa"** (confirma a normalização de acentos no aparelho)
- [ ] "ZZZ" mostra "Nenhum resultado" e o foco não vai a lugar nenhum com Baixo
- [ ] Baixo na última linha leva ao 1º resultado; Cima volta ao teclado, na mesma tecla
- [ ] Cima na 1ª linha do teclado sobe para a barra

## 7. Configurações
- [ ] "Tema visual" alterna entre Aurora Noturna e Aurora Boreal em todas as telas
- [ ] "Animações" liga/desliga; desligadas, o Início recolhe o banner na hora, com o mesmo resultado final
- [ ] "Limpar favoritos" funciona e avisa quando não há favoritos
- [ ] O Diagnóstico mostra modelo, Roku OS, interface (esperado: HD 1280x720) e design (FHD 1920x1080)

## 8. Voltar e saída
- [ ] Voltar numa aba diferente do Início volta ao Início, com o foco na barra
- [ ] Voltar no conteúdo do Início sobe para a barra
- [ ] Voltar na barra do Início fecha o app, sem confirmação
- [ ] Home sai para a tela inicial do Roku (comportamento do sistema)

## 9. Persistência
- [ ] Ao reabrir o app, tema, animações e favoritos escolhidos continuam

## 10. Desempenho e aparência
- [ ] Pílulas, teclas e painéis com cantos arredondados corretos (9-patch)
- [ ] Textos legíveis a cerca de 3 m; tamanhos coerentes entre telas; nada truncado nos cartões
- [ ] Contraste do texto sobre as imagens de banner é suficiente (principalmente à esquerda)
- [ ] (Opcional) `r2d2_bitmaps` (porta 8080) sem pressão excessiva de memória de textura
- [ ] Console de depuração (porta 8085) sem erros durante todo o checklist

Observações:
