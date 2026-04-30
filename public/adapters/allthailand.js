const COLUMNS = [
  { key: 'pos',     label: 'Pos',    align: 'center', width: 56 },
  { key: 'score',   label: 'Score',  align: 'center', width: 64 },
  { key: 'player',  label: 'Player', align: 'left' },
  { key: 'country', label: '',       align: 'center', width: 44 },
  { key: 'thru',    label: 'Thru',   align: 'center', width: 56 },
  { key: 'today',   label: 'Today',  align: 'center', width: 64 }
];

function parse(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  if (!table) return { columns: COLUMNS, rows: [] };

  const rows = [];
  for (const tr of table.querySelectorAll('tbody tr')) {
    const cells = tr.querySelectorAll('td');
    if (cells.length < 5) continue;

    const pos = cells[0].textContent.trim();
    const score = cells[1].textContent.trim();
    const player = formatName(cells[2].textContent.trim());
    const flag = cells[3].querySelector('img');
    const country = flag ? (flag.getAttribute('alt') || '').trim() : '';

    const todayCell = cells[cells.length - 1];
    const today = todayCell.textContent.trim();
    const holesPlayed = Number(todayCell.getAttribute('data-holes-played') || '0');
    const thru = holesPlayed === 18 ? 'F' : holesPlayed === 0 ? '—' : String(holesPlayed);

    rows.push({ pos, score, player, country, thru, today });
  }
  return { columns: COLUMNS, rows };
}

function formatName(name) {
  // "Amarin KRAIVIXIEN" -> "Amarin Kraivixien"
  return name.split(/\s+/).map(part => {
    if (part.length > 1 && part === part.toUpperCase()) {
      return part[0] + part.slice(1).toLowerCase();
    }
    return part;
  }).join(' ');
}

export default {
  id: 'allthailand',
  name: 'All Thailand Golf Tour',
  defaultUrl: 'https://www.allthailandgolftour.com/tournaments/gettable/3755/score',
  broadcastSearch: '"All Thailand Golf Tour" live',
  parse
};
