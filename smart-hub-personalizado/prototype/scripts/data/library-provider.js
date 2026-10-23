/*
 * Fonte de dados da "Minha biblioteca".
 *
 * A integração de mídia real (USB, DLNA, etc.) não foi comprovada na TV,
 * portanto o provedor padrão não tem conteúdo. O modo "demo" usa itens
 * fictícios e o modo "error" simula uma falha de integração, ambos para
 * testar os estados da interface.
 *
 * Contrato: getSections() devolve
 *   { state: 'empty' | 'ready' | 'error', sections: [...], message: '...' }
 */
(function (root) {
  var SH = root.SmartHub;

  var DEMO_SECTIONS = [
    { id: 'videos', title: 'Vídeos (demonstração)', items: [
      { id: 'v1', name: 'Viagem de férias', meta: 'Vídeo fictício · 12 min' },
      { id: 'v2', name: 'Aniversário', meta: 'Vídeo fictício · 4 min' }
    ] },
    { id: 'musicas', title: 'Músicas (demonstração)', items: [
      { id: 'm1', name: 'Playlist da sala', meta: 'Álbum fictício · 18 faixas' }
    ] },
    { id: 'fotos', title: 'Fotos (demonstração)', items: [
      { id: 'f1', name: 'Praia 2023', meta: 'Álbum fictício · 86 fotos' },
      { id: 'f2', name: 'Família', meta: 'Álbum fictício · 140 fotos' },
      { id: 'f3', name: 'Pets', meta: 'Álbum fictício · 32 fotos' }
    ] }
  ];

  SH.createLibraryProvider = function (mode) {
    return {
      mode: mode,
      getSections: function () {
        if (mode === 'error') {
          throw new Error('Falha simulada ao acessar a fonte de mídia.');
        }
        if (mode === 'demo') {
          return { state: 'ready', sections: DEMO_SECTIONS, message: '' };
        }
        return {
          state: 'empty',
          sections: [],
          message: 'Nenhuma fonte de mídia disponível. O acesso a USB ou rede local ' +
            'ainda não foi comprovado nesta TV.'
        };
      }
    };
  };

  // Encapsula erros do provedor para que a tela nunca quebre.
  SH.loadLibrary = function (provider, logger) {
    try {
      return provider.getSections();
    } catch (err) {
      if (logger) { logger.error('Biblioteca: ' + err.message); }
      return { state: 'error', sections: [], message: 'Não foi possível carregar a biblioteca. ' + err.message };
    }
  };
})(this);
