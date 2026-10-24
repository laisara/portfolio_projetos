' ==========================================================================
' Util.brs — utilitários puros compartilhados.
' ==========================================================================

' Em BrightScript, comparar invalid com string pode gerar "Type Mismatch";
' checar o tipo antes de comparar evita erros com dados inesperados.
function Util_isString(value as dynamic) as boolean
    t = type(value)
    return t = "roString" or t = "String"
end function

function Util_max(a as dynamic, b as dynamic) as dynamic
    if a > b then return a
    return b
end function

' Arredonda para múltiplo de 3: a Roku recomenda posições e tamanhos
' divisíveis por 3 em layouts FHD (escalam sem frações para HD).
function Util_snap3(value as dynamic) as integer
    return Int((value + 2) / 3) * 3
end function

function Util_min(a as dynamic, b as dynamic) as dynamic
    if a < b then return a
    return b
end function

' Converte para texto valores que a plataforma pode devolver como número
' ou string (ex.: GetOSVersion), sem presumir o tipo.
function Util_str(value as dynamic) as string
    if value = invalid then return "—"
    if Util_isString(value) then return value
    return value.ToStr()
end function

' Normaliza texto para comparação na Busca: minúsculas e sem acentos do
' português. Cobre maiúsculas acentuadas explicitamente, porque LCase()
' só é garantida para ASCII.
function Util_fold(text as dynamic) as string
    if not Util_isString(text) then return ""
    result = LCase(text)
    map = [
        ["á", "a"], ["à", "a"], ["â", "a"], ["ã", "a"], ["ä", "a"], ["Á", "a"], ["À", "a"], ["Â", "a"], ["Ã", "a"], ["Ä", "a"]
        ["é", "e"], ["è", "e"], ["ê", "e"], ["ë", "e"], ["É", "e"], ["È", "e"], ["Ê", "e"], ["Ë", "e"]
        ["í", "i"], ["ì", "i"], ["î", "i"], ["ï", "i"], ["Í", "i"], ["Ì", "i"], ["Î", "i"], ["Ï", "i"]
        ["ó", "o"], ["ò", "o"], ["ô", "o"], ["õ", "o"], ["ö", "o"], ["Ó", "o"], ["Ò", "o"], ["Ô", "o"], ["Õ", "o"], ["Ö", "o"]
        ["ú", "u"], ["ù", "u"], ["û", "u"], ["ü", "u"], ["Ú", "u"], ["Ù", "u"], ["Û", "u"], ["Ü", "u"]
        ["ç", "c"], ["Ç", "c"], ["ñ", "n"], ["Ñ", "n"], ["'", " "]
    ]
    for each pair in map
        result = result.Replace(pair[0], pair[1])
    end for
    return result
end function

' Primeiros n elementos de um array (sem alterar o original).
function Util_take(list as object, count as integer) as object
    result = []
    for i = 0 to list.Count() - 1
        if i >= count then exit for
        result.Push(list[i])
    end for
    return result
end function

' Copia e ordena textos em ordem alfabética (ordenação por inserção).
' Evita depender de Sort() sobre o retorno de Keys(), cujo tipo não foi
' confirmado na documentação consultada; a lista tem poucas dezenas de itens.
function Util_sortedStrings(list as object) as object
    result = []
    for each entry in list
        position = result.Count()
        while position > 0 and result[position - 1] > entry
            position = position - 1
        end while
        result.Push(entry) ' abre espaço; o valor é reposto abaixo
        for i = result.Count() - 1 to position + 1 step -1
            result[i] = result[i - 1]
        end for
        result[position] = entry
    end for
    return result
end function
