// Shared ESPN scoreboard adapter factory.
// ESPN's undocumented public API at site.api.espn.com returns the same
// JSON shape for every golf tour they cover. One factory → many adapters.
//
// Verified leagues: pga, eur, liv, lpga, ntw (Korn Ferry), champions-tour, tgl.
// Doesn't cover: Asian Tour, Ladies European Tour (different vendor).

const COLUMNS = [
  { key: 'pos',     label: 'Pos',    align: 'center', width: 56 },
  { key: 'score',   label: 'Score',  align: 'center', width: 64 },
  { key: 'player',  label: 'Player', align: 'left' },
  { key: 'country', label: '',       align: 'center', width: 44 },
  { key: 'thru',    label: 'Thru',   align: 'center', width: 56 },
  { key: 'today',   label: 'Today',  align: 'center', width: 64 }
];

function defaultUrlForLeague(league) {
  return `https://site.api.espn.com/apis/site/v2/sports/golf/${league}/scoreboard`;
}

function parseFactory(league) {
  return function parse(text) {
    let data;
    try { data = JSON.parse(text); }
    catch { return { columns: COLUMNS, rows: [] }; }

    const event = (data.events || [])[0];
    if (!event) return { columns: COLUMNS, rows: [] };

    const competition = (event.competitions || [])[0];
    if (!competition) return { columns: COLUMNS, rows: [] };

    const currentPeriod = competition.status?.period || 1;
    const competitors = competition.competitors || [];

    const rows = competitors.map(c => {
      const athlete = c.athlete || {};
      const status = c.status || {};
      const linescores = c.linescores || [];

      const pos = status.position?.id
        ? String(status.position.id)
        : (c.order != null ? String(c.order) : '');

      const country = athlete.flag?.alt || '';

      const thru = (() => {
        if (status.thru != null) return String(status.thru);
        const completed = linescores.filter(ls => ls.value != null).length;
        if (completed === 0) return '—';
        if (completed >= 4) return 'F';
        return '—';
      })();

      const today = (() => {
        const ls = linescores.find(l => l.period === currentPeriod);
        if (ls && ls.displayValue != null) return ls.displayValue;
        if (ls && ls.value != null) return String(ls.value);
        return '—';
      })();

      return {
        pos,
        score: c.score || 'E',
        player: athlete.displayName || athlete.fullName || '',
        country,
        thru,
        today
      };
    });

    return { columns: COLUMNS, rows };
  };
}

export function createEspnAdapter({ id, name, league, broadcastSearch }) {
  return {
    id,
    name,
    league,
    defaultUrl: defaultUrlForLeague(league),
    broadcastSearch: broadcastSearch || `${name} live`,
    parse: parseFactory(league)
  };
}
