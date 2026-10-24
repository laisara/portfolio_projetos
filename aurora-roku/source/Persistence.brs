' ==========================================================================
' Persistence.brs — leitura e gravação do estado no registro local do
' Roku (roRegistrySection). Guarda só tema, animações (ligadas/desligadas) e ids dos favoritos.
' Roda na thread principal; a validação fica em AppStateLogic.brs.
' ==========================================================================

function Persistence_section() as object
    return CreateObject("roRegistrySection", "AuroraTV")
end function

function Persistence_load() as object
    section = Persistence_section()
    raw = invalid
    if section.Exists("state") then raw = ParseJson(section.Read("state"))
    state = AppState_sanitize(raw)
    state.status = "Registro local do aparelho"
    return state
end function

sub Persistence_save(themeId as dynamic, favorites as dynamic, animations as dynamic)
    state = AppState_sanitize({ themeId: themeId, favorites: favorites, animations: animations })
    section = Persistence_section()
    section.Write("state", FormatJson(state))
    ' A Roku recomenda Flush explícito e pouco frequente: só ocorre
    ' quando o usuário muda tema, favoritos ou animações.
    section.Flush()
end sub
