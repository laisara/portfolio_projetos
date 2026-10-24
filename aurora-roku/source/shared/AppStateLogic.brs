' ==========================================================================
' AppStateLogic.brs — regras do estado persistente (favoritos e tema).
'
' Funções puras sobre arrays/AAs, sem nós SceneGraph nem registro, para
' serem usadas pela thread principal (persistência), pelos componentes
' e pelos testes de lógica.
' ==========================================================================

function AppState_maxFavorites() as integer
    return 50
end function

function AppState_defaults() as object
    return { themeId: AppConfig().defaultThemeId, favorites: [], animations: true }
end function

' Valida um estado lido do registro. Qualquer valor inesperado volta ao
' padrão: dados corrompidos nunca impedem o app de abrir.
function AppState_sanitize(raw as dynamic) as object
    state = AppState_defaults()
    if type(raw) <> "roAssociativeArray" then return state

    if Util_isString(raw.themeId) then
        for each id in Theme_ids()
            if raw.themeId = id then state.themeId = id
        end for
    end if

    if type(raw.animations) = "roBoolean" or type(raw.animations) = "Boolean" then state.animations = raw.animations

    if type(raw.favorites) = "roArray" then
        known = DemoContent_items()
        for each fav in raw.favorites
            if Util_isString(fav) and known.DoesExist(fav) and not AppState_contains(state.favorites, fav) then
                if state.favorites.Count() < AppState_maxFavorites() then state.favorites.Push(fav)
            end if
        end for
    end if
    return state
end function

function AppState_contains(list as object, value as string) as boolean
    for each entry in list
        if entry = value then return true
    end for
    return false
end function

' Retorna um NOVO array (campos de nós SceneGraph guardam cópias, então
' o chamador deve reatribuir o resultado ao campo).
function AppState_toggleFavorite(favorites as object, id as string) as object
    result = []
    removed = false
    for each entry in favorites
        if entry = id then
            removed = true
        else
            result.Push(entry)
        end if
    end for
    if not removed and result.Count() < AppState_maxFavorites() then result.Push(id)
    return result
end function
