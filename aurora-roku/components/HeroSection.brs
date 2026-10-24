sub init()
    m.kicker = m.top.findNode("kicker")
    m.title = m.top.findNode("title")
    m.meta = m.top.findNode("meta")
    m.synopsis = m.top.findNode("synopsis")
    m.button = m.top.findNode("detailsButton")
    m.dots = m.top.findNode("dots")

    ts = Theme_typeScale()
    Ui_setFont(m.kicker, true, ts.caption)
    Ui_setFont(m.title, true, ts.display)
    Ui_setFont(m.meta, false, ts.label)
    Ui_setFont(m.synopsis, false, ts.body)

    m.index = 0
    m.slides = []
    m.dotNodes = []
    m.top.observeField("focusedChild", "onFocusChanged")
    m.global.observeFieldScoped("themeId", "applyTheme")
    applyTheme()
end sub

sub applyTheme()
    theme = Ui_theme()
    m.kicker.color = theme.accent
    m.title.color = theme.textPrimary
    m.meta.color = theme.textSecondary
    m.synopsis.color = theme.textPrimary
    m.button.themeId = theme.id
    refreshDots()
end sub

sub onSlidesChanged()
    ' Dados incompletos: ignora ids que não existem no catálogo.
    m.slides = []
    if type(m.top.slides) = "roArray" then
        for each slide in m.top.slides
            if type(slide) = "roAssociativeArray" and Util_isString(slide.id) and Util_isString(slide.tag) then
                if DemoContent_safeItem(slide.id) <> invalid then m.slides.Push(slide)
            end if
        end for
    end if
    buildDots()
    m.index = 0
    showSlide()
end sub

sub buildDots()
    while m.dots.getChildCount() > 0
        m.dots.removeChildIndex(0)
    end while
    m.dotNodes = []
    for i = 0 to m.slides.Count() - 1
        dot = m.dots.createChild("Poster")
        dot.height = 12
        dot.width = 12
        m.dotNodes.Push(dot)
    end for
    refreshDots()
end sub

' Indicador de posição: o ponto do banner atual é uma pílula na cor de
' destaque; os demais são pontos discretos.
sub refreshDots()
    theme = Ui_theme()
    x = 0
    for i = 0 to m.dotNodes.Count() - 1
        dot = m.dotNodes[i]
        if i = m.index then
            dot.uri = theme.assets.dotOn
            dot.width = 36
        else
            dot.uri = theme.assets.dotOff
            dot.width = 12
        end if
        dot.translation = [x, 0]
        x = x + dot.width + 12
    end for
end sub

sub showSlide()
    if m.slides.Count() = 0 then
        m.top.current = invalid
        return
    end if
    if m.index < 0 or m.index >= m.slides.Count() then m.index = 0
    slide = m.slides[m.index]
    node = CB_itemNode(slide.id)
    if node = invalid then
        ' Dado removido depois do filtro: descarta o slide e tenta o próximo.
        m.slides.Delete(m.index)
        buildDots()
        showSlide()
        return
    end if
    node.tag = slide.tag
    m.kicker.text = slide.tag + "  ·  " + AppConfig().demoKicker
    m.title.text = node.title
    m.meta.text = node.metaFull
    m.synopsis.text = node.description
    m.top.current = node
    refreshDots()
    print "AURORA_BANNER " + (m.index + 1).ToStr() + "/" + m.slides.Count().ToStr() + " " + node.itemId
end sub

sub onFocusChanged()
    m.button.highlighted = m.top.isInFocusChain()
end sub

function onKeyEvent(key as string, press as boolean) as boolean
    if not press then return false
    if key = "left" or key = "right" then
        ' Esquerda/direita sempre pertencem ao carrossel; nas pontas a
        ' tecla é consumida e o foco não "escapa" de lado.
        if key = "left" then target = m.index - 1 else target = m.index + 1
        if target >= 0 and target < m.slides.Count() then
            m.index = target
            showSlide()
        end if
        return true
    else if key = "OK" then
        if m.slides.Count() > 0 then m.top.action = "details"
        return true
    end if
    return false
end function
