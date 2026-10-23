' ==========================================================================
' Ui.brs — helpers da thread de renderização (usam nós SceneGraph).
' Incluído pelos componentes junto com source/shared/*.brs.
' ==========================================================================

function Ui_theme() as object
    return Theme_get(m.global.themeId)
end function

' Ponto ÚNICO de definição de fontes. Atribui uma fonte de sistema
' predefinida (como nos samples oficiais da Roku, ex.: "font:MediumBold
' SystemFont") e ajusta o tamanho no nó Font resultante. Ao receber uma
' string, a Label cria o próprio nó Font, então o ajuste não afeta outras
' Labels. Validado no simulador brs-engine; confirmar no aparelho (ver
' PLATFORM_COMPATIBILITY.md). Se precisar mudar, só estas funções mudam.
function Ui_systemFont(bold as boolean) as string
    if bold then return "font:MediumBoldSystemFont"
    return "font:MediumSystemFont"
end function

sub Ui_setFont(label as object, bold as boolean, size as integer)
    label.font = Ui_systemFont(bold)
    label.font.size = size
end sub

' Aplica a aparência padrão do Aurora aos RowList (rótulos das fileiras).
sub Ui_styleRowList(rowList as object)
    rowList.rowLabelFont = Ui_systemFont(true)
    rowList.rowLabelFont.size = Theme_typeScale().heading
    rowList.rowLabelColor = Ui_theme().textPrimary
end sub

' Favoritos ficam no nó global (m.global.favorites). A thread principal
' observa o campo e grava no registro (source/main.brs).
function Fav_has(id as string) as boolean
    return AppState_contains(m.global.favorites, id)
end function

function Fav_toggle(id as string) as boolean
    m.global.favorites = AppState_toggleFavorite(m.global.favorites, id)
    return Fav_has(id)
end function
