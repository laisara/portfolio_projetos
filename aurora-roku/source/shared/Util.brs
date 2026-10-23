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
