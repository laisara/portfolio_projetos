/*
 * Formatação de data/hora em português sem depender de Intl ou
 * toLocaleString, cuja disponibilidade e saída na plataforma legada
 * não foram confirmadas.
 */
(function (root) {
  var SH = root.SmartHub;
  var pad2 = SH.util.pad2;

  var WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
    'quinta-feira', 'sexta-feira', 'sábado'];
  var WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  var MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
    'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  SH.clock = {
    WEEKDAYS_SHORT: WEEKDAYS_SHORT,
    MONTHS: MONTHS,

    formatTime: function (date, withSeconds) {
      var text = pad2(date.getHours()) + ':' + pad2(date.getMinutes());
      return withSeconds ? text + ':' + pad2(date.getSeconds()) : text;
    },

    formatDate: function (date) {
      return WEEKDAYS[date.getDay()] + ', ' + date.getDate() + ' de ' + MONTHS[date.getMonth()];
    },

    formatMonthTitle: function (year, month) {
      var name = MONTHS[month];
      return name.charAt(0).toUpperCase() + name.slice(1) + ' de ' + year;
    },

    /*
     * Matriz do calendário (semanas x 7 dias, começando no domingo).
     * Células fora do mês recebem null.
     */
    buildMonthMatrix: function (year, month) {
      var first = new Date(year, month, 1).getDay();
      var days = new Date(year, month + 1, 0).getDate();
      var weeks = [];
      var week = [];
      var i;
      for (i = 0; i < first; i++) { week.push(null); }
      for (i = 1; i <= days; i++) {
        week.push(i);
        if (week.length === 7) {
          weeks.push(week);
          week = [];
        }
      }
      if (week.length) {
        while (week.length < 7) { week.push(null); }
        weeks.push(week);
      }
      return weeks;
    },

    // Desloca {year, month} em `delta` meses.
    shiftMonth: function (year, month, delta) {
      var total = year * 12 + month + delta;
      return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
    }
  };
})(this);
