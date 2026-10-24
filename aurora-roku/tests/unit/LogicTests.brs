' ==========================================================================
' LogicTests.brs — testes da lógica pura (source/shared/*.brs).
'
' Executados no computador pelo interpretador brs-cli (pacote brs-node,
' de terceiros), via tools/run-unit-tests.js. NÃO executam SceneGraph e
' NÃO comprovam comportamento no Roku: só verificam regras de dados.
' ==========================================================================

sub Main()
    m.passed = 0
    m.failed = 0

    testNavigationBackHierarchy()
    testNavigationApply()
    testFavoritesToggle()
    testStateSanitize()
    testThemes()
    testDemoContentConsistency()
    testIncompleteData()
    testGridNavigation()
    testSearch()
    testKeyboardInput()

    print "RESULTADO: " + m.passed.ToStr() + " aprovados, " + m.failed.ToStr() + " reprovados"
    if m.failed > 0 then print "FALHA_NOS_TESTES"
end sub

sub check(condition as boolean, name as string)
    if condition then
        m.passed = m.passed + 1
        print "ok   - " + name
    else
        m.failed = m.failed + 1
        print "FAIL - " + name
    end if
end sub

sub testNavigationBackHierarchy()
    s = Nav_initialState()
    check(Nav_onBack(s) = "focusNav", "Voltar no conteúdo do Início sobe para a barra")
    s.zone = "nav"
    check(Nav_onBack(s) = "exit", "Voltar na barra do Início deixa o sistema encerrar o app")
    s.tab = "movies"
    s.zone = "content"
    check(Nav_onBack(s) = "goHome", "Voltar em outra aba volta ao Início")
    s.zone = "nav"
    check(Nav_onBack(s) = "goHome", "Voltar na barra de outra aba volta ao Início")
    s.overlay = "details"
    check(Nav_onBack(s) = "closeOverlay", "Voltar com detalhes abertos fecha os detalhes primeiro")
end sub

sub testNavigationApply()
    s = Nav_initialState()
    s = Nav_apply(s, "selectTab", "movies")
    check(s.tab = "movies" and s.zone = "nav", "Selecionar aba mantém o foco na barra")
    s = Nav_apply(s, "focusContent")
    s = Nav_apply(s, "openDetails")
    check(s.overlay = "details" and s.zone = "overlay", "Abrir detalhes move o foco para a camada")
    s = Nav_apply(s, Nav_onBack(s))
    check(s.overlay = invalid and s.zone = "content" and s.tab = "movies", "Fechar detalhes devolve o foco ao conteúdo da mesma aba")
    s = Nav_apply(s, Nav_onBack(s))
    check(s.tab = "home" and s.zone = "nav", "Voltar leva ao Início com foco na barra")
    s2 = Nav_apply(s, "selectTab", "inexistente")
    check(s2.tab = "home", "Aba inexistente é ignorada")
    ' Sequência de Voltar sempre termina em "exit" (sem ciclos).
    s = { tab: "settings", zone: "content", overlay: "details" }
    steps = 0
    while Nav_onBack(s) <> "exit" and steps < 10
        s = Nav_apply(s, Nav_onBack(s))
        steps = steps + 1
    end while
    check(steps = 2 and Nav_onBack(s) = "exit", "Voltar repetido sai em no máximo 3 passos, sem ciclo")
    check(Nav_tabs().Count() = 7, "Sete abas na navegação")
    labels = ""
    for each tabInfo in Nav_tabs()
        labels = labels + tabInfo.label + "|"
    end for
    check(labels = "Início|Filmes|Séries|Aplicativos|Biblioteca|Busca|Configurações|", "Abas na ordem do briefing")
    check(Nav_tabIndex("search") = 5 and Nav_tabIndex("favorites") = -1, "Busca é a 6ª aba; Favoritos agora vive na Biblioteca")
end sub

sub testFavoritesToggle()
    favs = []
    favs = AppState_toggleFavorite(favs, "m01")
    check(favs.Count() = 1 and favs[0] = "m01", "Adicionar favorito")
    favs = AppState_toggleFavorite(favs, "s02")
    favs = AppState_toggleFavorite(favs, "m01")
    check(favs.Count() = 1 and favs[0] = "s02", "Remover favorito preserva os demais")
    check(AppState_contains(favs, "s02") and not AppState_contains(favs, "m01"), "Consulta de favorito")
end sub

sub testStateSanitize()
    d = AppState_sanitize(invalid)
    check(d.themeId = "noturna" and d.favorites.Count() = 0 and d.animations = true, "Estado ausente usa padrões")
    d = AppState_sanitize({ animations: false, favorites: ["a03", "m01"] })
    check(d.animations = false and d.favorites.Count() = 2, "Animações desligadas e favoritos de aplicativos são mantidos")
    d = AppState_sanitize({ animations: "não" })
    check(d.animations = true, "Animações inválidas voltam ao padrão")
    d = AppState_sanitize({ themeId: 42, favorites: "x" })
    check(d.themeId = "noturna" and d.favorites.Count() = 0, "Tipos inválidos voltam ao padrão")
    d = AppState_sanitize({ themeId: "boreal", favorites: ["m01", "m01", "zz", 7, "s03"] })
    check(d.themeId = "boreal", "Tema válido é mantido")
    check(d.favorites.Count() = 2 and d.favorites[1] = "s03", "Favoritos duplicados, desconhecidos e não-texto são descartados")
    parsed = ParseJson("{quebrado")
    check(AppState_sanitize(parsed).themeId = "noturna", "JSON corrompido não impede a abertura")
end sub

sub testThemes()
    for each id in Theme_ids()
        t = Theme_get(id)
        check(t.id = id and Left(t.accent, 2) = "0x" and Len(t.accent) = 10, "Tema " + id + " tem cores no formato 0xRRGGBBAA")
    end for
    check(Theme_get("inexistente").id = "noturna", "Tema desconhecido usa o padrão")
    check(Theme_get(invalid).id = "noturna", "Tema invalid usa o padrão")
    check(Theme_next("noturna") = "boreal" and Theme_next("boreal") = "noturna", "Alternância entre os dois temas")
    check(Theme_typeScale().caption mod 3 = 0, "Escala tipográfica em múltiplos de 3")
end sub

sub testDemoContentConsistency()
    items = DemoContent_items()
    layoutData = DemoContent_layout()
    allIds = []
    for each slide in layoutData.featured
        allIds.Push(slide.id)
    end for
    for each group in [layoutData.homeRows, layoutData.movieRows, layoutData.seriesRows, layoutData.appRows]
        for each row in group
            if row.ids <> invalid then allIds.Append(row.ids)
            if row.items <> invalid then
                for each entry in row.items
                    allIds.Push(entry.id)
                end for
            end if
        end for
    end for
    allIds.Append(layoutData.librarySaved)
    allIds.Append(layoutData.searchSuggestions)
    for each entry in layoutData.libraryContinue
        allIds.Push(entry.id)
    end for
    missing = 0
    for each id in allIds
        if not items.DoesExist(id) then missing = missing + 1
    end for
    check(missing = 0, "Todo id usado no layout existe no catálogo")

    wrongKind = 0
    for each row in layoutData.movieRows
        for each id in row.ids
            if items[id].kind <> "movie" then wrongKind = wrongKind + 1
        end for
    end for
    for each row in layoutData.seriesRows
        for each id in row.ids
            if items[id].kind <> "series" then wrongKind = wrongKind + 1
        end for
    end for
    for each row in layoutData.appRows
        for each id in row.ids
            if items[id].kind <> "app" then wrongKind = wrongKind + 1
        end for
    end for
    check(wrongKind = 0, "Fileiras de filmes, séries e aplicativos só têm o tipo certo")

    titles = ""
    for each row in layoutData.homeRows
        titles = titles + row.title + "|"
    end for
    check(titles = "Continue assistindo|Em alta|Filmes para você|Séries para você|Ficção científica e fantasia|Recomendados|Seus aplicativos|", "Sete fileiras da tela inicial na ordem do briefing")
    check(layoutData.featured.Count() = 5, "Carrossel com 5 banners")

    movies = 0
    series = 0
    apps = 0
    for each id in items.Keys()
        kind = items[id].kind
        if kind = "movie" then movies = movies + 1
        if kind = "series" then series = series + 1
        if kind = "app" then apps = apps + 1
    end for
    check(movies = 11 and series = 9 and apps = 8, "Catálogo: 11 filmes, 9 séries e 8 aplicativos fictícios")
    check(DemoContent_metaLine(items.m02) = "2023 · Drama · 1h 47min", "Linha de metadados de filme")
    check(DemoContent_metaLine(items.a01) = "Vídeo · Aplicativo", "Linha de metadados de aplicativo")
    check(DemoContent_cardMeta(items.s03) = "2025 · Ficção científica", "Linha curta do cartão")
    for each id in items.Keys()
        item = items[id]
        if Len(item.title) > 22 then missing = missing + 1
    end for
    check(missing = 0, "Títulos cabem no cartão de 384 px (até 22 caracteres)")
end sub

sub testIncompleteData()
    check(DemoContent_safeItem("nao-existe") = invalid, "Id desconhecido não gera item")
    check(DemoContent_safeItem(invalid) = invalid and DemoContent_safeItem(42) = invalid, "Id inválido não gera item")
    safe = DemoContent_safeItem("m01")
    check(safe.title = "Horizonte de Vidro" and safe.year = 2024, "Item completo é devolvido sem alterações")
    ' Item sem campos: valores padrão (testa o formatador, não o catálogo).
    bare = { title: "Sem dados", kind: "movie", year: 0, genre: "", duration: "", synopsis: "" }
    check(DemoContent_metaLine(bare) = "" and DemoContent_cardMeta(bare) = "", "Item sem ano, gênero e duração gera metadados vazios")
    partial = { title: "Parcial", kind: "movie", year: 2020, genre: "", duration: "1h", synopsis: "" }
    check(DemoContent_metaLine(partial) = "2020 · 1h", "Metadados pulam campos vazios sem separadores soltos")
end sub

sub testGridNavigation()
    rows = Search_rowLengths()
    check(rows.Count() = 5 and rows[0] = 9 and rows[3] = 9 and rows[4] = 2, "Teclado: 4 linhas de 9 teclas e 1 de 2 teclas largas")
    r = Nav_gridMove(rows, 0, 0, "left")
    check(r = invalid, "Esquerda na primeira tecla sai da grade (sem dar a volta)")
    r = Nav_gridMove(rows, 0, 8, "right")
    check(r = invalid, "Direita na última tecla sai da grade (sem dar a volta)")
    r = Nav_gridMove(rows, 1, 4, "right")
    check(r.row = 1 and r.col = 5, "Direita move uma tecla")
    r = Nav_gridMove(rows, 0, 4, "up")
    check(r = invalid, "Cima na primeira linha sai da grade (sobe para a barra)")
    r = Nav_gridMove(rows, 3, 2, "down")
    check(r.row = 4 and r.col = 0, "Baixo das teclas à esquerda vai para Espaço")
    r = Nav_gridMove(rows, 3, 7, "down")
    check(r.row = 4 and r.col = 1, "Baixo das teclas à direita vai para Apagar")
    r = Nav_gridMove(rows, 4, 1, "up")
    check(r.row = 3 and r.col = 6, "Cima de Apagar volta à tecla sob o centro da metade direita")
    r = Nav_gridMove(rows, 4, 0, "up")
    check(r.row = 3 and r.col = 2, "Cima de Espaço volta ao centro da metade esquerda")
    r = Nav_gridMove(rows, 4, 1, "down")
    check(r = invalid, "Baixo na última linha sai da grade (vai aos resultados)")
    ' Toda tecla é alcançável a partir da primeira, só com setas.
    visited = {}
    queue = [{ row: 0, col: 0 }]
    while queue.Count() > 0
        cur = queue.Shift()
        keyName = cur.row.ToStr() + "," + cur.col.ToStr()
        if not visited.DoesExist(keyName) then
            visited[keyName] = true
            for each dir in ["left", "right", "up", "down"]
                nxt = Nav_gridMove(rows, cur.row, cur.col, dir)
                if nxt <> invalid then queue.Push(nxt)
            end for
        end if
    end while
    check(visited.Count() = 38, "As 38 teclas são alcançáveis só com as setas (sem teclas presas)")
end sub

sub testSearch()
    check(Util_fold("Órbita Baixa") = "orbita baixa", "Normalização remove acentos e maiúsculas")
    check(Util_fold("ÇÃO ÉÍÓÚ") = "cao eiou", "Normalização cobre maiúsculas acentuadas")
    check(Util_fold("Linha d'Água") = "linha d agua", "Apóstrofo vira espaço")
    check(Util_fold(invalid) = "", "Texto inválido vira vazio")
    check(Search_find("").Count() = 0 and Search_find("   ").Count() = 0, "Busca vazia não retorna nada")
    r = Search_find("orbita")
    check(r.Count() = 1 and r[0] = "s03", "Busca ignora acentos: ORBITA encontra Órbita Baixa")
    r = Search_find("FANTASIA")
    check(r.Count() = 4, "Busca por gênero (FANTASIA) encontra 4 itens (2 filmes e 2 séries)")
    r = Search_find("serie fantasia")
    check(r.Count() = 2 and r[0] = "s07" and r[1] = "s08", "Várias palavras: todas precisam combinar (série + fantasia = 2)")
    r = Search_find("aplicativo")
    check(r.Count() = 8, "Busca pelo tipo APLICATIVO encontra os 8 aplicativos")
    r = Search_find("filme ficcao")
    check(r.Count() = 2 and r[0] = "m01" and r[1] = "m07", "Filme + ficção científica = 2, em ordem estável por id")
    check(Search_find("zzzz").Count() = 0, "Sem correspondência retorna lista vazia")
    check(Search_statusText("", 0) = "Digite para buscar em títulos e aplicativos.", "Status sem texto")
    check(Search_statusText("ZZ", 0) = "Nenhum resultado para ZZ.", "Status sem resultados")
    check(Search_statusText("OR", 1) = "1 resultado para OR.", "Status com 1 resultado")
    check(Search_statusText("A", 12) = "12 resultados para A.", "Status com vários resultados")
    check(Util_take([1, 2, 3, 4], 2).Count() = 2 and Util_take([1], 5).Count() = 1, "Util_take limita sem estourar")
    sorted = Util_sortedStrings(["m10", "a02", "s01", "a01", "m02"])
    check(sorted[0] = "a01" and sorted[1] = "a02" and sorted[2] = "m02" and sorted[3] = "m10" and sorted[4] = "s01", "Ordenação alfabética própria (independe de Sort)")
    check(Util_sortedStrings([]).Count() = 0 and Util_sortedStrings(["x"]).Count() = 1, "Ordenação de listas vazias e de um item")
end sub

sub testKeyboardInput()
    keyRows = Search_keyRows()
    total = 0
    for each row in keyRows
        total = total + row.Count()
    end for
    check(total = 38, "Teclado tem 36 caracteres e 2 teclas de ação")
    letterA = keyRows[0][0]
    letterZ = keyRows[2][7]
    zero = keyRows[2][8]
    check(letterA.value = "A" and letterZ.value = "Z" and zero.value = "0" and keyRows[3][8].value = "9", "Ordem das teclas: A-Z, depois 0-9")
    spaceKey = keyRows[4][0]
    deleteKey = keyRows[4][1]
    q = ""
    q = Search_applyKey(q, letterA)
    q = Search_applyKey(q, zero)
    check(q = "A0", "Digitar acrescenta caracteres")
    q = Search_applyKey(q, deleteKey)
    check(q = "A", "Apagar remove o último caractere")
    q = Search_applyKey("", deleteKey)
    check(q = "", "Apagar com texto vazio não falha")
    check(Search_applyKey("", spaceKey) = "", "Espaço no início é ignorado")
    q = Search_applyKey(Search_applyKey("A", spaceKey), spaceKey)
    check(q = "A ", "Espaços seguidos são ignorados")
    long = "ABCDEFGHIJKLMNOPQRSTUVWX"
    check(Len(long) = Search_maxQueryLength() and Search_applyKey(long, letterA) = long, "Texto não passa do limite")
end sub
