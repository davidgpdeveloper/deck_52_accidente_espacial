const objectiveTableBody = document.getElementById('objetivosTableBody');
const threatTableBody = document.getElementById('amenazasTableBody');
const levelInput = document.getElementById('levelInput');
const runButton = document.getElementById('runButton');
const resultSummary = document.getElementById('resultSummary');
const levelRulesContainer = document.getElementById('levelRules');

const objectiveData = [
  'Resuelve 6 o más cartas incluyendo Sala de Control.',
  'Resuelve 2 Conductos de aire.',
  'Resuelve Cubierta de Instrumentación y Puerta Antiexplosión.',
  'Resuelve Área sin Atmosfera y descarta Cristal de datos.',
  'Resuelve Torreta de Seguridad y usa Kit Médico.',
  'Resuelve Xenoterror o explora Xenoterro dos veces.',
  'Explora 2 Módulos destrozados y resuelve Área sin Atmósfera.'
];

const threatData = [
  'CUARENTENA: Retira las cartas de Sala Médica del mazo de Mapa.',
  'ALARMA: Pierde 1 Salud cuando exploras Robots Guardianes o Torretas de Seguridad.',
  'FLUCTUACIÓN GRAVITACIONAL: Cuando resuelvas Esclusa de Gravedad, baraja 2 cartas de Inventario en el mazo de Botín.',
  'TEJIDO VIVO: Cuando explores Enjambres, debes tratar de resolverlos de manera inmediata.',
  'SUELOS INESTABLES: Cuando el segundo Módulo Destrozado sea explorado, roba una carta de Acción. Con 4+, pierde 2 de Salud, pierdes 1 nivel y comienzas una nueva misión.',
  'FUGA EN TANQUES QUÍMICOS: Cada vez que robes una carta de Acción resta 1 a su valor numérico (mínimo 1).',
  'RIESGO DE RADIACIÓN: Pierde 1 de Salud por cada 3 cartas resueltas.'
];

const levelRulesData = [
  '1-9: 0 amenazas',
  '10-24: 1 amenaza',
  '25-39: 2 amenazas',
  '40 o más: 3 amenazas'
];

let objectiveRows = [];
let threatRows = [];
let levelRules = [];

function sanitizeTextList(rawText) {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);
}

function parseLevelRules(rawTextList) {
  return rawTextList
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rangePart, countPart] = line.split(':').map((part) => part.trim());
      const countMatch = countPart.match(/(\d+)/);
      if (!rangePart || !countMatch) return null;

      const count = Number(countMatch[1]);
      const matchMinMax = rangePart.match(/^(\d+)\s*(?:-\s*(\d+)|o\s*m[aá]s)?$/i);
      if (!matchMinMax) return null;

      const min = Number(matchMinMax[1]);
      const max = matchMinMax[2] ? Number(matchMinMax[2]) : null;

      return { min, max, count };
    })
    .filter(Boolean)
    .sort((a, b) => a.min - b.min);
}

function renderRules() {
  levelRulesContainer.innerHTML = levelRules
    .map((rule) => {
      const range = rule.max === null ? `${rule.min} o más` : `${rule.min}-${rule.max}`;
      const label = rule.count === 1 ? 'amenaza' : 'amenazas';
      return `<div class="level-rule"><strong>${range}</strong>: ${rule.count} ${label}</div>`;
    })
    .join('');
}

function renderTableRows(targetBody, rows, variant) {
  targetBody.innerHTML = rows
    .map(
      (row, index) => `
        <tr data-index="${index}" data-variant="${variant}">
          <td>${row}</td>
        </tr>
      `
    )
    .join('');
}

function getThreatCountForLevel(level) {
  const matchedRule = levelRules.find((rule) => {
    const inMinRange = level >= rule.min;
    const inMaxRange = rule.max === null ? true : level <= rule.max;
    return inMinRange && inMaxRange;
  });

  return matchedRule ? matchedRule.count : 0;
}

function getRandomIndexes(total, count) {
  const indexes = new Set();

  while (indexes.size < count) {
    const randomIndex = Math.floor(Math.random() * total);
    indexes.add(randomIndex);
  }

  return [...indexes];
}

function setSelectedRows(targetBody, selectedIndexes) {
  const rows = targetBody.querySelectorAll('tr');
  rows.forEach((row, index) => {
    row.classList.toggle('selected', selectedIndexes.includes(index));
  });
}

function animateSelection(targetBody, finalIndexes, totalRows, duration = 3000) {
  return new Promise((resolve) => {
    const loop = setInterval(() => {
      const randomSelection = getRandomIndexes(totalRows, Math.max(1, finalIndexes.length));
      setSelectedRows(targetBody, randomSelection);
    }, 90);

    setTimeout(() => {
      clearInterval(loop);
      setSelectedRows(targetBody, finalIndexes);
      resolve();
    }, duration);
  });
}

function revealSummary(level, objectiveIndex, threatCount, threatIndexes) {
  const objectiveText = objectiveRows[objectiveIndex];
  const totalThreatsLabel = threatCount === 1 ? 'amenaza' : 'amenazas';
  const threatTexts = threatIndexes.map((index) => threatRows[index]).join(' | ');

  resultSummary.textContent = `Nivel ${level}: ${objectiveText} • ${threatCount} ${totalThreatsLabel} • ${threatTexts}`;
}

function loadData() {
  objectiveRows = sanitizeTextList(objectiveData.join('\n'));
  threatRows = sanitizeTextList(threatData.join('\n'));
  levelRules = parseLevelRules(levelRulesData);

  renderTableRows(objectiveTableBody, objectiveRows, 'objective');
  renderTableRows(threatTableBody, threatRows, 'threat');
  renderRules();
}

function executeSelection() {
  const numericValue = Number(levelInput.value);

  if (!Number.isInteger(numericValue) || numericValue < 0) {
    resultSummary.textContent = 'Introduce un número válido';
    return;
  }

  const objectiveIndex = Math.floor(Math.random() * objectiveRows.length);
  const threatCount = getThreatCountForLevel(numericValue);
  const threatIndexes = getRandomIndexes(threatRows.length, threatCount);

  setSelectedRows(objectiveTableBody, []);
  setSelectedRows(threatTableBody, []);

  Promise.all([
    animateSelection(objectiveTableBody, [objectiveIndex], objectiveRows.length, 3000),
    animateSelection(threatTableBody, threatIndexes, threatRows.length, 3000)
  ]).then(() => {
    revealSummary(numericValue, objectiveIndex, threatCount, threatIndexes);
  });
}

levelInput.addEventListener('keydown', (event) => {
  const forbiddenKeys = ['e', 'E', '+', '-', '.', ','];
  if (forbiddenKeys.includes(event.key)) {
    event.preventDefault();
  }
});

runButton.addEventListener('click', executeSelection);

loadData();
