' ==========================================================================
' SearchLogic.brs — lógica pura da aba Busca (teclado na tela + filtro).
'
' O teclado é próprio (não o do sistema), para seguir o tema e permitir
' teste fora do aparelho. Layout: 4 linhas de 9 teclas (A-Z e 0-9) e uma
' linha com duas teclas largas (Espaço e Apagar).
' ==========================================================================

function Search_maxQueryLength() as integer
    return 24
end function

' Linhas do teclado: cada tecla é { label, action, value }.
' action: "char" (acrescenta value), "space" ou "delete".
function Search_keyRows() as object
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    rows = []
    for r = 0 to 3
        row = []
        for c = 0 to 8
            index = r * 9 + c
            if index < Len(chars) then
                ch = Mid(chars, index + 1, 1)
                row.Push({ label: ch, action: "char", value: ch })
            end if
        end for
        rows.Push(row)
    end for
    rows.Push([
        { label: "Espaço", action: "space", value: " " }
        { label: "Apagar", action: "delete", value: "" }
    ])
    return rows
end function

' Quantidade de teclas por linha (usada pela navegação em grade).
function Search_rowLengths() as object
    lengths = []
    for each row in Search_keyRows()
        lengths.Push(row.Count())
    end for
    return lengths
end function

' Aplica uma tecla ao texto digitado. Nunca ultrapassa o limite, nunca
' começa com espaço e nunca acumula espaços seguidos.
function Search_applyKey(query as string, key as object) as string
    if key.action = "delete" then
        if Len(query) = 0 then return query
        return Left(query, Len(query) - 1)
    end if
    if Len(query) >= Search_maxQueryLength() then return query
    if key.action = "space" then
        if Len(query) = 0 or Right(query, 1) = " " then return query
        return query + " "
    end if
    return query + key.value
end function

' Busca no catálogo demonstrativo (títulos e aplicativos). Cada palavra
' digitada precisa aparecer no título, no gênero ou no tipo (filme, série,
' aplicativo). Sem acentos e sem diferenciar maiúsculas. Devolve ids.
function Search_find(query as dynamic) as object
    found = []
    folded = Util_fold(query).Trim()
    if folded = "" then return found
    words = folded.Tokenize(" ")
    items = DemoContent_items()
    for each id in Util_sortedStrings(items.Keys())
        item = DemoContent_safeItem(id)
        if item <> invalid then
            haystack = Util_fold(item.title + " " + item.genre + " " + Search_kindWords(item.kind))
            matches = true
            for each word in words
                if Instr(1, haystack, word) = 0 then matches = false
            end for
            if matches then found.Push(id)
        end if
    end for
    return found
end function

function Search_kindWords(kind as string) as string
    if kind = "movie" then return "filme"
    if kind = "series" then return "serie"
    if kind = "app" then return "aplicativo app"
    return ""
end function

' Texto do resultado exibido ao lado do teclado.
function Search_statusText(query as string, count as integer) as string
    if Len(query) = 0 then return "Digite para buscar em títulos e aplicativos."
    if count = 0 then return "Nenhum resultado para " + query + "."
    if count = 1 then return "1 resultado para " + query + "."
    return count.ToStr() + " resultados para " + query + "."
end function
