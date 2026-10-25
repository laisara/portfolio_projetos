' ==========================================================================
' DemoContent.brs — CATÁLOGO DEMONSTRATIVO (dados fictícios)
'
' Todos os títulos, aplicativos, anos, sinopses, durações e progressos
' abaixo são INVENTADOS para demonstrar a interface. Não há catálogo real,
' nenhum serviço externo e nenhuma URL remota: as imagens são arquivos
' locais gerados por tools/generate_assets.py. Os aplicativos NÃO
' representam produtos reais e não podem ser abertos.
'
' Para trocar o conteúdo, edite só este arquivo (e gere a arte de cada id
' em images/posters/<id>.png e images/backgrounds/<id>.jpg).
' Arquivo puro (sem nós SceneGraph): usado pelos componentes e pelos testes.
' ==========================================================================

' O catálogo é construído uma vez por escopo (cada componente tem o seu "m")
' e reutilizado: montar o dicionário a cada consulta pesava na abertura do
' Início e a cada tecla da Busca. Quem recebe o resultado só lê; para
' alterar um item, use DemoContent_safeItem (devolve uma cópia).
function DemoContent_items() as object
    if m.auroraItems = invalid then m.auroraItems = DemoContent_buildItems()
    return m.auroraItems
end function

function DemoContent_buildItems() as object
    return {
        m01: { title: "Horizonte de Vidro", kind: "movie", year: 2024, genre: "Ficção científica", duration: "1h 54min", synopsis: "Uma engenheira descobre que a cidade flutuante onde vive está perdendo altitude — e que alguém sabe disso há anos." }
        m02: { title: "A Última Estação", kind: "movie", year: 2023, genre: "Drama", duration: "1h 47min", synopsis: "Na véspera do fim de uma ferrovia centenária, três desconhecidos dividem a viagem final e um segredo em comum." }
        m03: { title: "Maré Vermelha", kind: "movie", year: 2025, genre: "Suspense", duration: "1h 39min", synopsis: "Uma bióloga marinha investiga o sumiço de um barco de pesquisa durante uma maré que só acontece uma vez por século." }
        m04: { title: "Os Relojoeiros", kind: "movie", year: 2022, genre: "Aventura", duration: "2h 01min", synopsis: "Dois irmãos herdam uma oficina de relógios e um mapa escondido no mecanismo de um antigo carrilhão." }
        m05: { title: "Cidade Sem Sombras", kind: "movie", year: 2024, genre: "Mistério", duration: "1h 58min", synopsis: "Numa metrópole iluminada dia e noite, um detetive aposentado persegue o único homem que ninguém consegue ver." }
        m06: { title: "Jardim de Inverno", kind: "movie", year: 2021, genre: "Romance", duration: "1h 42min", synopsis: "Uma paisagista e um músico em turnê se reencontram todo inverno no mesmo jardim botânico abandonado." }
        m07: { title: "Ecos de Netuno", kind: "movie", year: 2025, genre: "Ficção científica", duration: "2h 08min", synopsis: "A tripulação de uma sonda recebe uma transmissão com as próprias vozes, enviada décadas antes da partida." }
        m08: { title: "O Farol do Fim", kind: "movie", year: 2023, genre: "Drama", duration: "1h 36min", synopsis: "O último faroleiro de uma ilha remota precisa decidir se apaga a luz pela última vez." }
        m09: { title: "A Torre de Cinzas", kind: "movie", year: 2024, genre: "Fantasia", duration: "2h 12min", synopsis: "Uma jovem cartógrafa herda a chave de uma torre que reaparece em um lugar diferente a cada lua cheia." }
        m10: { title: "Reino de Musgo", kind: "movie", year: 2023, genre: "Fantasia", duration: "1h 49min", synopsis: "Quando a floresta começa a avançar sobre a vila, um carteiro aprende a língua das árvores para negociar a paz." }
        m11: { title: "Areias de Cobre", kind: "movie", year: 2025, genre: "Aventura", duration: "2h 03min", synopsis: "Uma caravana atravessa um deserto onde a areia revela, por uma noite, as cidades que já existiram ali." }
        s01: { title: "Arquivo Boreal", kind: "series", year: 2024, genre: "Mistério", duration: "2 temporadas", synopsis: "No extremo norte, uma arquivista cataloga cartas que chegam de um futuro próximo." }
        s02: { title: "Contracorrente", kind: "series", year: 2023, genre: "Drama", duration: "1 temporada", synopsis: "Uma família de pescadores enfrenta a empresa que quer transformar a baía em porto industrial." }
        s03: { title: "Órbita Baixa", kind: "series", year: 2025, genre: "Ficção científica", duration: "1 temporada", synopsis: "A rotina de uma estação espacial comercial, onde cada turno pode ser o último antes do retorno." }
        s04: { title: "Casa das Marés", kind: "series", year: 2022, genre: "Suspense", duration: "3 temporadas", synopsis: "Uma pousada que só existe na maré baixa recebe hóspedes que não lembram de ter feito reserva." }
        s05: { title: "Sinal Fraco", kind: "series", year: 2024, genre: "Comédia", duration: "2 temporadas", synopsis: "Numa cidade sem sinal de celular, a rádio comunitária é o centro de todos os boatos." }
        s06: { title: "Linha d'Água", kind: "series", year: 2025, genre: "Aventura", duration: "1 temporada", synopsis: "Velejadores amadores tentam completar uma regata ao redor do continente num barco emprestado." }
        s07: { title: "Guardiões do Vale", kind: "series", year: 2024, genre: "Fantasia", duration: "2 temporadas", synopsis: "Cinco aldeias dividem um vale protegido por criaturas de pedra que só acordam quando alguém mente." }
        s08: { title: "A Cidade das Brumas", kind: "series", year: 2023, genre: "Fantasia", duration: "1 temporada", synopsis: "Numa cidade coberta de névoa, cada pessoa carrega uma lanterna que mostra o que ela esqueceu." }
        s09: { title: "Miragem", kind: "series", year: 2025, genre: "Mistério", duration: "1 temporada", synopsis: "Uma equipe de topógrafos encontra no deserto um oásis que não aparece em nenhum mapa — nem nas fotos." }
        a01: { title: "Telão", kind: "app", year: 0, genre: "Vídeo", duration: "", synopsis: "Aplicativo fictício de vídeo, criado só para demonstrar como seus aplicativos aparecem na interface." }
        a02: { title: "Rádio Maré", kind: "app", year: 0, genre: "Música", duration: "", synopsis: "Aplicativo fictício de rádio e música, criado só para demonstrar a organização de aplicativos." }
        a03: { title: "Galeria", kind: "app", year: 0, genre: "Fotos", duration: "", synopsis: "Aplicativo fictício de fotos, criado só para demonstrar a organização de aplicativos." }
        a04: { title: "Notícias Já", kind: "app", year: 0, genre: "Notícias", duration: "", synopsis: "Aplicativo fictício de notícias, criado só para demonstrar a organização de aplicativos." }
        a05: { title: "Tempo", kind: "app", year: 0, genre: "Clima", duration: "", synopsis: "Aplicativo fictício de previsão do tempo, criado só para demonstrar a organização de aplicativos." }
        a06: { title: "Arcade Mini", kind: "app", year: 0, genre: "Jogos", duration: "", synopsis: "Aplicativo fictício de jogos, criado só para demonstrar a organização de aplicativos." }
        a07: { title: "Receitas", kind: "app", year: 0, genre: "Culinária", duration: "", synopsis: "Aplicativo fictício de culinária, criado só para demonstrar a organização de aplicativos." }
        a08: { title: "Treino", kind: "app", year: 0, genre: "Saúde", duration: "", synopsis: "Aplicativo fictício de exercícios, criado só para demonstrar a organização de aplicativos." }
    }
end function

' Item com todos os campos garantidos (dados incompletos não quebram a
' interface). Devolve invalid se o id não existir no catálogo.
function DemoContent_safeItem(id as dynamic) as dynamic
    if not Util_isString(id) then return invalid
    items = DemoContent_items()
    if not items.DoesExist(id) then return invalid
    raw = items[id]
    item = { title: id, kind: "movie", year: 0, genre: "", duration: "", synopsis: "" }
    for each key in item
        if raw[key] <> invalid then item[key] = raw[key]
    end for
    return item
end function

' Ordem de exibição de cada seção (ids de DemoContent_items).
function DemoContent_layout() as object
    if m.auroraLayout = invalid then m.auroraLayout = DemoContent_buildLayout()
    return m.auroraLayout
end function

function DemoContent_buildLayout() as object
    return {
        ' Carrossel do banner: id, selo e ordem. Navegação manual (sem
        ' avanço automático).
        featured: [
            { id: "m07", tag: "EM ALTA" }
            { id: "m09", tag: "NOVO" }
            { id: "s01", tag: "SÉRIE EM DESTAQUE" }
            { id: "m03", tag: "SUSPENSE DA SEMANA" }
            { id: "s07", tag: "RECOMENDADO PARA VOCÊ" }
        ]
        ' Fileiras da tela inicial, na ordem de exibição.
        ' "items" = ids com progresso fictício; "ids" = ids simples.
        homeRows: [
            { title: "Continue assistindo", items: DemoContent_continueWatching() }
            { title: "Em alta", ids: ["m07", "s03", "m09", "m05", "s07", "m01", "s01"] }
            { title: "Filmes para você", ids: ["m01", "m10", "m04", "m11", "m06", "m08"] }
            { title: "Séries para você", ids: ["s05", "s04", "s06", "s08", "s09", "s02"] }
            { title: "Ficção científica e fantasia", ids: ["m07", "m09", "s03", "m10", "s07", "m01", "s08"] }
            { title: "Recomendados", ids: ["m03", "m11", "s09", "m08", "s02", "m05"] }
            { title: "Seus aplicativos", ids: DemoContent_appIds() }
        ]
        movieRows: [
            { title: "Ficção científica e fantasia", ids: ["m07", "m09", "m01", "m10"] }
            { title: "Drama e romance", ids: ["m02", "m08", "m06"] }
            { title: "Suspense, mistério e aventura", ids: ["m03", "m05", "m04", "m11"] }
        ]
        seriesRows: [
            { title: "Para maratonar", ids: ["s01", "s03", "s04", "s07"] }
            { title: "Fantasia e mistério", ids: ["s08", "s09", "s01"] }
            { title: "Leves e aventureiras", ids: ["s05", "s06", "s02"] }
        ]
        appRows: [
            { title: "Seus aplicativos", ids: DemoContent_appIds() }
            { title: "Vídeo e música", ids: ["a01", "a02"] }
            { title: "Fotos, notícias e clima", ids: ["a03", "a04", "a05"] }
            { title: "Jogos e estilo de vida", ids: ["a06", "a07", "a08"] }
        ]
        ' Biblioteca: o painel "Favoritos" é inserido em tempo de execução.
        libraryContinue: DemoContent_continueWatching()
        librarySaved: ["m04", "s05", "m08", "m11"]
        ' Sugestões da Busca quando não há texto digitado.
        searchSuggestions: ["m07", "s03", "m09", "m05", "s07", "m01"]
    }
end function

' Progresso e episódio também são fictícios.
function DemoContent_continueWatching() as object
    return [
        { id: "m02", progress: 0.45, note: "Restam 59min" }
        { id: "s01", progress: 0.7, note: "T1 · E4" }
        { id: "m06", progress: 0.2, note: "Restam 1h 22min" }
        { id: "s04", progress: 0.35, note: "T2 · E2" }
        { id: "m10", progress: 0.6, note: "Restam 44min" }
    ]
end function

function DemoContent_appIds() as object
    return ["a01", "a02", "a03", "a04", "a05", "a06", "a07", "a08"]
end function

function DemoContent_posterUri(id as string) as string
    return "pkg:/images/posters/" + id + ".png"
end function

function DemoContent_backdropUri(id as string) as string
    return "pkg:/images/backgrounds/" + id + ".jpg"
end function

' Linha completa de metadados (banner, painéis e detalhes):
' "2024 · Drama · 1h 47min"; aplicativos: "Vídeo · Aplicativo".
function DemoContent_metaLine(item as object) as string
    if item.kind = "app" then return item.genre + " · Aplicativo"
    parts = []
    if item.year > 0 then parts.Push(item.year.ToStr())
    if item.genre <> "" then parts.Push(item.genre)
    if item.duration <> "" then parts.Push(item.duration)
    return DemoContent_join(parts, " · ")
end function

' Linha curta sob o título dos cartões (cabe em 384 px): "2024 · Drama".
function DemoContent_cardMeta(item as object) as string
    if item.kind = "app" then return item.genre
    if item.year > 0 and item.genre <> "" then return item.year.ToStr() + " · " + item.genre
    if item.genre <> "" then return item.genre
    return ""
end function

function DemoContent_join(parts as object, separator as string) as string
    result = ""
    for i = 0 to parts.Count() - 1
        if i > 0 then result = result + separator
        result = result + parts[i]
    end for
    return result
end function
