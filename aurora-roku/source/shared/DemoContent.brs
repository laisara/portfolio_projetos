' ==========================================================================
' DemoContent.brs — CATÁLOGO DEMONSTRATIVO (dados fictícios)
'
' Todos os títulos, anos, sinopses, durações e progressos abaixo são
' INVENTADOS para demonstrar a interface. Não há catálogo real, nenhum
' serviço externo e nenhuma URL remota: as imagens são arquivos locais
' gerados por tools/generate_assets.py.
'
' Arquivo puro (sem nós SceneGraph): pode ser usado pelos componentes
' (via <script uri>) e pelos testes de lógica em tests/unit.
' ==========================================================================

function DemoContent_items() as object
    return {
        m01: { title: "Horizonte de Vidro", kind: "movie", year: 2024, genre: "Ficção científica", duration: "1h 54min", synopsis: "Uma engenheira descobre que a cidade flutuante onde vive está perdendo altitude — e que alguém sabe disso há anos." }
        m02: { title: "A Última Estação", kind: "movie", year: 2023, genre: "Drama", duration: "1h 47min", synopsis: "Na véspera do fim de uma ferrovia centenária, três desconhecidos dividem a viagem final e um segredo em comum." }
        m03: { title: "Maré Vermelha", kind: "movie", year: 2025, genre: "Suspense", duration: "1h 39min", synopsis: "Uma bióloga marinha investiga o sumiço de um barco de pesquisa durante uma maré que só acontece uma vez por século." }
        m04: { title: "Os Relojoeiros", kind: "movie", year: 2022, genre: "Aventura", duration: "2h 01min", synopsis: "Dois irmãos herdam uma oficina de relógios e um mapa escondido no mecanismo de um antigo carrilhão." }
        m05: { title: "Cidade Sem Sombras", kind: "movie", year: 2024, genre: "Mistério", duration: "1h 58min", synopsis: "Numa metrópole iluminada dia e noite, um detetive aposentado persegue o único homem que ninguém consegue ver." }
        m06: { title: "Jardim de Inverno", kind: "movie", year: 2021, genre: "Romance", duration: "1h 42min", synopsis: "Uma paisagista e um músico em turnê se reencontram todo inverno no mesmo jardim botânico abandonado." }
        m07: { title: "Ecos de Netuno", kind: "movie", year: 2025, genre: "Ficção científica", duration: "2h 08min", synopsis: "A tripulação de uma sonda recebe uma transmissão com as próprias vozes, enviada décadas antes da partida." }
        m08: { title: "O Farol do Fim", kind: "movie", year: 2023, genre: "Drama", duration: "1h 36min", synopsis: "O último faroleiro de uma ilha remota precisa decidir se apaga a luz pela última vez." }
        s01: { title: "Arquivo Boreal", kind: "series", year: 2024, genre: "Mistério", duration: "2 temporadas", synopsis: "No extremo norte, uma arquivista cataloga cartas que chegam de um futuro próximo." }
        s02: { title: "Contracorrente", kind: "series", year: 2023, genre: "Drama", duration: "1 temporada", synopsis: "Uma família de pescadores enfrenta a empresa que quer transformar a baía em porto industrial." }
        s03: { title: "Órbita Baixa", kind: "series", year: 2025, genre: "Ficção científica", duration: "1 temporada", synopsis: "A rotina de uma estação espacial comercial, onde cada turno pode ser o último antes do retorno." }
        s04: { title: "Casa das Marés", kind: "series", year: 2022, genre: "Suspense", duration: "3 temporadas", synopsis: "Uma pousada que só existe na maré baixa recebe hóspedes que não lembram de ter feito reserva." }
        s05: { title: "Sinal Fraco", kind: "series", year: 2024, genre: "Comédia", duration: "2 temporadas", synopsis: "Numa cidade sem sinal de celular, a rádio comunitária é o centro de todos os boatos." }
        s06: { title: "Linha d'Água", kind: "series", year: 2025, genre: "Aventura", duration: "1 temporada", synopsis: "Velejadores amadores tentam completar uma regata ao redor do continente num barco emprestado." }
    }
end function

' Ordem de exibição de cada seção (ids de DemoContent_items).
function DemoContent_layout() as object
    return {
        featured: "m07"
        explore: ["m01", "s03", "m05", "s01", "m03", "s06", "m04"]
        movieRows: [
            { title: "Ficção científica", ids: ["m07", "m01"] }
            { title: "Drama e romance", ids: ["m02", "m08", "m06"] }
            { title: "Suspense, mistério e aventura", ids: ["m03", "m05", "m04"] }
        ]
        seriesRows: [
            { title: "Para maratonar", ids: ["s01", "s03", "s04"] }
            { title: "Leves e aventureiras", ids: ["s05", "s06", "s02"] }
        ]
        ' Progresso e episódio também são fictícios.
        library: [
            { title: "Continuar assistindo", items: [
                { id: "m02", progress: 0.45, note: "Restam 59min" }
                { id: "s01", progress: 0.7, note: "T1 · E4" }
                { id: "m06", progress: 0.2, note: "Restam 1h 22min" }
            ] }
            { title: "Salvos para depois", items: [
                { id: "m04", progress: 0, note: "" }
                { id: "s05", progress: 0, note: "" }
                { id: "m08", progress: 0, note: "" }
            ] }
        ]
    }
end function

' Coleções da tela inicial. "target" é a aba aberta ao selecionar e
' "row" a fileira dessa aba que recebe o foco. A contagem exibida é
' calculada a partir da fileira (DemoContent_collectionSubtitle).
function DemoContent_collections() as object
    return [
        { id: "col_scifi", title: "Noites de ficção", target: "movies", row: 0 }
        { id: "col_drama", title: "Drama e romance", target: "movies", row: 1 }
        { id: "col_mystery", title: "Mistério e aventura", target: "movies", row: 2 }
        { id: "col_binge", title: "Para maratonar", target: "series", row: 0 }
    ]
end function

function DemoContent_collectionSubtitle(collection as object) as string
    layoutData = DemoContent_layout()
    if collection.target = "series" then
        rows = layoutData.seriesRows
        noun = " séries"
    else
        rows = layoutData.movieRows
        noun = " filmes"
    end if
    count = rows[collection.row].ids.Count()
    return "Coleção · " + count.ToStr() + noun
end function

function DemoContent_posterUri(id as string) as string
    return "pkg:/images/posters/" + id + ".png"
end function

function DemoContent_backdropUri(id as string) as string
    return "pkg:/images/backgrounds/" + id + ".jpg"
end function

' Linha de metadados exibida sob títulos: "2024 · Drama · 1h 47min".
function DemoContent_metaLine(item as object) as string
    return item.year.ToStr() + " · " + item.genre + " · " + item.duration
end function
