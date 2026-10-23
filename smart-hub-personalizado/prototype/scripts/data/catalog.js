/*
 * Catálogo de atalhos de entretenimento — DADOS DE DEMONSTRAÇÃO.
 *
 * Nenhum item abaixo representa uma integração funcional. O campo
 * `status` reflete o que foi (ou não) verificado para a UN48H4203AG;
 * ver docs/FEASIBILITY.md, seção "Serviços de streaming".
 * Não há logotipos nem marcas reproduzidas: apenas nome e monograma.
 */
(function (root) {
  var SH = root.SmartHub;

  SH.SERVICE_STATUS = {
    unverified: {
      label: 'Não verificado',
      detail: 'Não há evidência de que exista aplicativo compatível com este modelo. ' +
        'Este cartão é apenas um atalho informativo; nenhuma reprodução é oferecida.'
    },
    likelyUnavailable: {
      label: 'Provavelmente indisponível',
      detail: 'Há indício oficial de descontinuação para TVs Samsung de 2014 ou anteriores ' +
        '(ver research/SOURCES.md). Não confirmado no aparelho.'
    },
    internal: {
      label: 'Módulo interno',
      detail: 'Funcionalidade do próprio Smart Hub.'
    }
  };

  SH.catalog = {
    services: [
      { id: 'youtube', name: 'YouTube', monogram: 'YT', category: 'Vídeo', status: 'unverified' },
      { id: 'netflix', name: 'Netflix', monogram: 'NF', category: 'Vídeo', status: 'likelyUnavailable' },
      { id: 'primevideo', name: 'Prime Video', monogram: 'PV', category: 'Vídeo', status: 'unverified' },
      { id: 'globoplay', name: 'Globoplay', monogram: 'GP', category: 'Vídeo', status: 'unverified' },
      { id: 'spotify', name: 'Spotify', monogram: 'SP', category: 'Música', status: 'unverified' },
      { id: 'radio', name: 'Rádio on-line', monogram: 'RD', category: 'Música', status: 'unverified' },
      { id: 'navegador', name: 'Navegador da TV', monogram: 'WB', category: 'Sistema', status: 'unverified' }
    ],

    // Conteúdo do painel de destaque: dicas de uso, sem mídia real.
    highlights: [
      { id: 'boas-vindas', title: 'Bem-vindo ao Smart Hub', text: 'Use as setas do controle para navegar e OK para abrir.' },
      { id: 'favoritos', title: 'Monte seus favoritos', text: 'Em Entretenimento, abra um atalho e marque como favorito.' },
      { id: 'offline', title: 'Funciona sem internet', text: 'Relógio, calendário e configurações não dependem de rede.' }
    ],

    findService: function (id) {
      var i;
      for (i = 0; i < this.services.length; i++) {
        if (this.services[i].id === id) { return this.services[i]; }
      }
      return null;
    }
  };
})(this);
