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
    check(Nav_tabs().Count() = 6, "Seis categorias na navegação")
    check(Nav_tabIndex("favorites") = 4, "Índice da aba Favoritos")
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
    check(d.themeId = "noturna" and d.favorites.Count() = 0, "Estado ausente usa padrões")
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
    layout = DemoContent_layout()
    allIds = [layout.featured]
    allIds.Append(layout.explore)
    for each row in layout.movieRows
        allIds.Append(row.ids)
    end for
    for each row in layout.seriesRows
        allIds.Append(row.ids)
    end for
    for each row in layout.library
        for each entry in row.items
            allIds.Push(entry.id)
        end for
    end for
    missing = 0
    for each id in allIds
        if not items.DoesExist(id) then missing = missing + 1
    end for
    check(missing = 0, "Todo id usado no layout existe no catálogo")
    for each row in layout.movieRows
        for each id in row.ids
            if items[id].kind <> "movie" then missing = missing + 1
        end for
    end for
    for each row in layout.seriesRows
        for each id in row.ids
            if items[id].kind <> "series" then missing = missing + 1
        end for
    end for
    check(missing = 0, "Fileiras de filmes só têm filmes e de séries só séries")
    cols = DemoContent_collections()
    check(DemoContent_collectionSubtitle(cols[0]) = "Coleção · 2 filmes", "Contagem de coleção derivada dos dados")
    check(DemoContent_collectionSubtitle(cols[3]) = "Coleção · 3 séries", "Contagem de coleção de séries")
    check(DemoContent_metaLine(items.m02) = "2023 · Drama · 1h 47min", "Linha de metadados")
end sub
