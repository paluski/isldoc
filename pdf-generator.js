const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const NAVY = '#222842';
const GRAY = '#595959';
const RED = '#EE0000';
const HEADER_FILL = '#EDEFF4';
const BORDER_GRAY = '#8C95A8';
const TABLE_BORDER = '#BFBFBF';
const COORD_FILL = '#BDD7EE';

const letterheadPath = path.join(__dirname, 'assets', 'letterhead.png');

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_LEFT = 72;
const MARGIN_RIGHT = 72;
const MARGIN_TOP = 117;
const MARGIN_BOTTOM = 95;
const CONTENT_LEFT = MARGIN_LEFT;
const CONTENT_WIDTH = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT;

function has(v) {
  return v !== undefined && v !== null && String(v).trim() !== '';
}

function valueOrPlaceholder(v, placeholder) {
  return has(v) ? String(v).trim() : placeholder;
}

function generateMemorialPdf(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT, right: MARGIN_RIGHT },
      bufferPages: true
    });

    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const letterheadExists = fs.existsSync(letterheadPath);
    function drawLetterhead() {
      if (!letterheadExists) return;
      doc.image(letterheadPath, -3, -2.85, { width: 594, height: 840.75 });
    }

    let pageCount = 1;
    doc.on('pageAdded', () => { pageCount++; drawLetterhead(); });
    drawLetterhead();

    drawCoverPage(doc, data);
    doc.addPage();

    drawSumario(doc);
    doc.addPage();

    drawSections(doc, data);

    const totalContentPages = pageCount - 1;
    for (let i = 1; i < pageCount; i++) {
      doc.switchToPage(i);
      const savedBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.fontSize(8).fillColor(GRAY).font('Helvetica')
        .text(`Página ${i} de ${totalContentPages}`, CONTENT_LEFT, PAGE_H - 60, { width: CONTENT_WIDTH, align: 'right', lineBreak: false });
      doc.page.margins.bottom = savedBottom;
    }

    doc.end();
  });
}

function drawCoverPage(doc, data) {
  doc.fontSize(20).font('Helvetica-Bold').fillColor(NAVY)
    .text('MEMORIAL DESCRITIVO', CONTENT_LEFT, 280, { width: CONTENT_WIDTH, align: 'center' });
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000')
    .text(valueOrPlaceholder(data.nomeEmpreendimento, '[NOME DO EMPREENDIMENTO]'), { width: CONTENT_WIDTH, align: 'center' });

  const projeto = valueOrPlaceholder(data.nomeEmpreendimento, '[NOME DO EMPREENDIMENTO]');
  const local = (has(data.municipio) && has(data.estado))
    ? `${data.municipio} - ${data.estado}`
    : valueOrPlaceholder(data.municipio || data.estado, '[LOCAL]');

  const tablesHeight = 90;
  let y = PAGE_H - MARGIN_BOTTOM - tablesHeight - 10;

  const w6Labels = ['REV.', 'DATA', 'DESCRIÇÃO', 'ELAB.', 'VER.', 'APR.'];
  const w6Values = [data.revisao, data.dataRevisao, data.descricaoRevisao, data.elaboradoPor, data.verificadoPor, data.aprovadoPor];
  y = drawValueLabelRow(doc, CONTENT_LEFT, y, CONTENT_WIDTH, w6Labels, w6Values);

  const w3Labels = ['DEPARTAMENTO:', 'CONTRATO:', 'PROJETO:'];
  const w3Values = [data.departamento, data.contrato, projeto];
  y = drawLabelValueRow(doc, CONTENT_LEFT, y, CONTENT_WIDTH, w3Labels, w3Values);

  const w4Labels = ['LOCAL:', 'CÓDIGO:', 'REV:', 'DATA:'];
  const w4Values = [local, data.codigoDocumento, data.revisao, data.dataDocumento];
  drawLabelValueRow(doc, CONTENT_LEFT, y, CONTENT_WIDTH, w4Labels, w4Values);
}

function drawValueLabelRow(doc, x, y, width, labels, values) {
  const n = labels.length;
  const colW = width / n;
  const rowH = 32;
  for (let i = 0; i < n; i++) {
    const cx = x + i * colW;
    doc.rect(cx, y, colW, rowH).stroke(BORDER_GRAY);
    const valueText = valueOrPlaceholder(values[i], `[${labels[i].replace(/[:.]+$/, '')}]`);
    const isPlaceholder = !has(values[i]);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(isPlaceholder ? RED : '#000000')
      .text(valueText, cx + 2, y + 4, { width: colW - 4, align: 'center' });
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000')
      .text(labels[i], cx + 2, y + 19, { width: colW - 4, align: 'center' });
  }
  return y + rowH;
}

function drawLabelValueRow(doc, x, y, width, labels, values) {
  const n = labels.length;
  const colW = width / n;
  const rowH = 29;
  for (let i = 0; i < n; i++) {
    const cx = x + i * colW;
    doc.rect(cx, y, colW, rowH).stroke(BORDER_GRAY);
    const valueText = valueOrPlaceholder(values[i], `[${labels[i].replace(/[:.]+$/, '')}]`);
    const isPlaceholder = !has(values[i]);
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000')
      .text(labels[i], cx + 5, y + 4, { width: colW - 10, align: 'left' });
    doc.fontSize(8).font('Helvetica-Bold').fillColor(isPlaceholder ? RED : '#000000')
      .text(valueText, cx + 5, y + 16, { width: colW - 10, align: 'left' });
  }
  return y + rowH;
}

function drawSumario() {}

const SUMARIO_ENTRIES = [
  ['1', 'IDENTIFICAÇÃO DO EMPREENDIMENTO', false],
  ['1.1', 'Dados Gerais do Empreendimento', true],
  ['1.2', 'Tecnologia Adotada', true],
  ['1.3', 'Dimensionamento do Sistema', true],
  ['1.4', 'Simulação do Perfil Diário Médio Anual do Estado de Carga da Bateria', true],
  ['1.5', 'Estudo de Degradação da Bateria', true],
  ['1.6', 'Estimativa de Eficiência de Carga e Descarga da Bateria', true],
  ['1.7', 'Estratégia de "Augmentation"', true],
  ['1.8', 'Plano de Descarte/Reciclagem', true],
  ['1.9', 'Catálogo dos Equipamentos', true],
  ['1.10', 'Identificação', true],
  ['2', 'DESENHOS DE LOCALIZAÇÃO', false],
  ['2.1', 'Propriedades Utilizadas', true],
  ['3', 'POLIGONAL DA ÁREA OCUPADA PELO EMPREENDIMENTO', false],
  ['4', 'INFORMAÇÃO DE SEGURANÇA E PREVENÇÃO A INCÊNDIO', false],
  ['4.1', 'Plano de resposta a emergência', true],
  ['4.2', 'Procedimentos de operação e manutenção', true],
  ['4.3', 'Integração com Empreendimentos e Instalações Vizinhas', true],
  ['5', 'DIAGRAMA UNIFILAR', false],
  ['6', 'ANOTAÇÃO DE RESPONSABILIDADE TÉCNICA (ART)', false]
];

function drawSumario(doc) {
  doc.fontSize(16).font('Helvetica-Bold').fillColor(NAVY)
    .text('SUMÁRIO', CONTENT_LEFT, MARGIN_TOP, { width: CONTENT_WIDTH, align: 'center' });
  doc.moveTo(CONTENT_LEFT, doc.y + 4).lineTo(CONTENT_LEFT + CONTENT_WIDTH, doc.y + 4).lineWidth(1.5).stroke(NAVY);
  doc.moveDown(1.5);

  SUMARIO_ENTRIES.forEach(([num, title, indent]) => {
    const size = indent ? 9.5 : 11;
    const color = indent ? '#000000' : NAVY;
    const x = CONTENT_LEFT + (indent ? 18 : 0);
    doc.fontSize(size).font('Helvetica-Bold').fillColor(color)
      .text(`${num}  ${title}`, x, doc.y, { width: CONTENT_WIDTH - (indent ? 18 : 0) });
    doc.moveDown(indent ? 0.15 : 0.3);
  });
}

function heading1(doc, num, text) {
  ensureSpace(doc, 40);
  doc.moveDown(0.6);
  doc.fontSize(15).font('Helvetica-Bold').fillColor(NAVY)
    .text(`${num}  ${text}`, CONTENT_LEFT, doc.y, { width: CONTENT_WIDTH });
  const lineY = doc.y + 2;
  doc.moveTo(CONTENT_LEFT, lineY).lineTo(CONTENT_LEFT + CONTENT_WIDTH, lineY).lineWidth(1.2).stroke(NAVY);
  doc.moveDown(0.6);
}

function heading2(doc, num, text) {
  ensureSpace(doc, 30);
  doc.moveDown(0.4);
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#262626')
    .text(`${num}  ${text}`, CONTENT_LEFT, doc.y, { width: CONTENT_WIDTH });
  doc.moveDown(0.3);
}

function ensureSpace(doc, minHeight) {
  if (doc.y + minHeight > PAGE_H - MARGIN_BOTTOM) {
    doc.addPage();
  }
}

function run(text, opts) {
  return Object.assign({ text }, opts || {});
}

function fillRun(value, placeholder) {
  if (has(value)) return run(String(value).trim(), { bold: true });
  return run(placeholder, { bold: true, italic: true, color: RED });
}

function writeRuns(doc, runs, opts) {
  opts = opts || {};
  ensureSpace(doc, 20);
  doc.fontSize(opts.size || 10);
  runs.forEach((r, i) => {
    const isLast = i === runs.length - 1;
    doc.font(r.bold ? 'Helvetica-Bold' : (r.italic ? 'Helvetica-Oblique' : 'Helvetica'))
      .fillColor(r.color || '#000000')
      .text(r.text, { continued: !isLast, width: CONTENT_WIDTH });
  });
  doc.moveDown(opts.spacingAfter != null ? opts.spacingAfter : 0.5);
}

function bodyText(doc, text, opts) {
  writeRuns(doc, [run(text)], opts);
}

function instructionText(doc, value, placeholder) {
  writeRuns(doc, [fillRun(value, placeholder)]);
}

function anexoSuffix(checked, label) {
  if (checked) return [];
  return [run(` [${label}]`, { bold: true, italic: true, color: RED })];
}

function bulletText(doc, text) {
  ensureSpace(doc, 16);
  doc.fontSize(10).font('Helvetica').fillColor('#000000')
    .text(`•  ${text}`, CONTENT_LEFT + 10, doc.y, { width: CONTENT_WIDTH - 10 });
  doc.moveDown(0.2);
}

function drawTable(doc, columns, headerRow, dataRows) {
  const totalWidth = columns.reduce((a, c) => a + c.width, 0);
  let x0 = CONTENT_LEFT;
  const headerH = 20;
  ensureSpace(doc, headerH + 20);
  let y = doc.y;

  let x = x0;
  columns.forEach((col, i) => {
    doc.rect(x, y, col.width, headerH).fillAndStroke(HEADER_FILL, TABLE_BORDER);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(NAVY)
      .text(headerRow[i], x + 3, y + 5, { width: col.width - 6, align: 'center' });
    x += col.width;
  });
  y += headerH;

  dataRows.forEach((row) => {
    doc.fontSize(9);
    const cellHeights = columns.map((col, i) => {
      const cell = row[i] || {};
      const text = cell.text != null ? cell.text : '-';
      doc.font(cell.bold ? 'Helvetica-Bold' : 'Helvetica');
      return doc.heightOfString(text, { width: col.width - 6, align: cell.align || 'center' });
    });
    const rowH = Math.max(18, ...cellHeights) + 8;

    if (y + rowH > PAGE_H - MARGIN_BOTTOM) {
      doc.addPage();
      y = doc.y;
    }
    x = x0;
    columns.forEach((col, i) => {
      const cell = row[i] || {};
      doc.rect(x, y, col.width, rowH).stroke(TABLE_BORDER);
      doc.fontSize(9).font(cell.bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(cell.color || '#000000')
        .text(cell.text != null ? cell.text : '-', x + 3, y + 4, { width: col.width - 6, align: cell.align || 'center' });
      x += col.width;
    });
    y += rowH;
  });

  doc.y = y + 10;
}

function paramCell(text, opts) {
  return Object.assign({ text }, opts || {});
}

function paramValueCell(value, unit) {
  const placeholder = !has(value);
  return paramCell(placeholder ? '[A PREENCHER]' : `${String(value).trim()}${unit || ''}`, {
    bold: placeholder, color: placeholder ? RED : '#000000'
  });
}

function drawSections(doc, data) {
  heading1(doc, '1', 'IDENTIFICAÇÃO DO EMPREENDIMENTO');
  heading2(doc, '1.1', 'Dados Gerais do Empreendimento');
  writeRuns(doc, [
    run('O presente Memorial Descritivo refere-se ao Sistema de Armazenamento de Energia por Baterias (SAE, do inglês Battery Energy Storage System – BESS), denominado '),
    fillRun(data.nomeEmpreendimento, '[NOME DO EMPREENDIMENTO]'),
    run(', a ser implantado no município de '),
    fillRun(data.municipio, '[MUNICÍPIO]'),
    run(', estado de '),
    fillRun(data.estado, '[ESTADO]'),
    run(', situado em '),
    fillRun(data.endereco, '[ENDEREÇO]'),
    run(', ocupando uma área aproximada de '),
    fillRun(data.area, '[ÁREA]'),
    run(' hectares com a potência instalada de '),
    fillRun(data.potenciaInstalada, '[POTÊNCIA INSTALADA]'),
    run(' kW.')
  ]);

  heading2(doc, '1.2', 'Tecnologia Adotada');
  writeRuns(doc, [
    run('O sistema de armazenamento utilizará a tecnologia '),
    fillRun(data.descricaoTecnologia, '[DESCRIÇÃO DA TECNOLOGIA]'),
    run(', composta por baterias eletroquímicas com cátodo de composição '),
    fillRun(data.quimicaCatodo, '[QUÍMICA DO CÁTODO]'),
    run(' e ânodo de composição '),
    fillRun(data.quimicaAnodo, '[QUÍMICA DO ÂNODO]'),
    run('.')
  ]);

  heading2(doc, '1.3', 'Dimensionamento do Sistema');
  writeRuns(doc, [
    run('O dimensionamento do sistema foi desenvolvido para uma potência nominal de '),
    fillRun(data.potenciaNominal, '[POTÊNCIA NOMINAL]'),
    run(' kW e capacidade de armazenamento de '),
    fillRun(data.capacidadeArmazenamento, '[CAPACIDADE DE ARMAZENAMENTO]'),
    run(' kWh, considerando um regime de descarga de '),
    fillRun(data.regimeDescarga, '[REGIME DE DESCARGA]'),
    run('. A análise energética inclui o ciclo completo de operação, considerando o suprimento à rede, perdas inerentes ao sistema e o autoconsumo: '),
    fillRun(data.analiseEnergeticaDetalhada, '[DETALHAR A ANÁLISE ENERGÉTICA COM CICLO COMPLETO]'),
    run('.')
  ]);

  bodyText(doc, 'Para o dimensionamento e avaliação de desempenho do empreendimento foram considerados os seguintes parâmetros:', { spacingAfter: 0.4 });

  drawTable(doc,
    [{ width: 280 }, { width: 171 }],
    ['Parâmetro', 'Valor'],
    [
      [paramCell('Eficiência de carga/descarga da bateria', { align: 'left' }), paramValueCell(data.eficienciaCargaDescarga, '%')],
      [paramCell('Limites máximo e mínimo da profundidade máxima de descarga (DoD Máxima)', { align: 'left' }), paramValueCell(data.limitesDoD, '')],
      [paramCell('Estado mínimo de carga (SOC Mínimo)', { align: 'left' }), paramValueCell(data.socMinimo, '%')],
      [paramCell('Eficiência dos conversores (PCS)', { align: 'left' }), paramValueCell(data.eficienciaPCS, '%')],
      [paramCell('Consumo interno do sistema', { align: 'left' }), paramValueCell(data.consumoInterno, '')],
      [paramCell('Consumo em stand-by', { align: 'left' }), paramValueCell(data.consumoStandby, '')]
    ]
  );

  heading2(doc, '1.4', 'Simulação do Perfil Diário Médio Anual do Estado de Carga da Bateria');
  bodyText(doc, 'Uma simulação do perfil diário médio anual do estado de carga da bateria foi realizada, considerando os ciclos de carga e descarga previstos para todo o período contratual.', { spacingAfter: 0.4 });
  instructionText(doc, data.simulacaoPerfilCarga, '[APRESENTAR SIMULAÇÃO CONSIDERANDO OS CICLOS DE CARGA E DESCARGA DURANTE O PERÍODO CONTRATUAL]');

  heading2(doc, '1.5', 'Estudo de Degradação da Bateria');
  instructionText(doc, data.estudoDegradacao, '[DETALHAR O PROCESSO DE DEGRADAÇÃO DA BATERIA CONSIDERANDO O NÚMERO DE CICLOS, AS PROFUNDIDADES DE CARGA E DESCARGA, OS EFEITOS DE TEMPERATURA E OUTRAS VARIÁVEIS QUE INTERFIRAM NA DEGRADAÇÃO].');

  heading2(doc, '1.6', 'Estimativa de Eficiência de Carga e Descarga da Bateria');
  instructionText(doc, data.estimativaEficienciaRTE, '[COM REFERÊNCIA AO PMI, EM FUNÇÃO DO NÚMERO DE CICLOS, CONSIDERANDO AS PROFUNDIDADES DE CARGA E DESCARGA NOS CICLOS, OS EFEITOS DE TEMPERATURA E OUTRAS VARIÁVEIS QUE INTERFIRAM NA EFICIÊNCIA, INCLUINDO PERDAS ÔHMICAS, PERDAS NO TRAFO, CONSUMO DOS EQUIPAMENTOS AUXILIARES, CONSUMO EM STAND-BY E DEMAIS PERDAS CONSIDERADAS RELEVANTES. O ESTUDO DEVE INDICAR A RTE REMANESCENTE MÍNIMA PROJETADA AO LONGO DOS ANOS PREVISTOS NO CONTRATO DE SUPRIMENTO E ESTAR COMPATÍVEL COM OS PARÂMETROS DECLARADOS NA FICHA DE DADOS DO SISTEMA AEGE. DEVEM AINDA SER APRESENTADOS A MEMÓRIA DE CÁLCULO E A REPRESENTAÇÃO GRÁFICA DA RTE AO LONGO DO PERÍODO CONTRATUAL.]');
  instructionText(doc, data.areaAbrangenciaRTE, '[AINDA, PARA FINS DE DEFINIÇÃO DA RTE, DEVERÁ SER OBSERVADA A ÁREA DE ABRANGÊNCIA CONFORME A FIGURA A SEGUIR - PÁG.8 INSTRUÇÃO, ALÉM DOS CRITÉRIOS DE CÁLCULO ESTABELECIDOS NA PORTARIA DE DIRETRIZES DO RESPECTIVO LEILÃO.]');

  heading2(doc, '1.7', 'Estratégia de "Augmentation"');
  bodyText(doc, 'Para garantir a manutenção da capacidade contratada e do desempenho operacional ao longo da vida útil do empreendimento, será adotada a seguinte estratégia de augmentation:', { spacingAfter: 0.4 });
  instructionText(doc, data.estrategiaAugmentation, '[DESCREVER ESTRATÉGIA]');

  heading2(doc, '1.8', 'Plano de Descarte/Reciclagem');
  bodyText(doc, 'Ao final da vida útil do sistema, os equipamentos serão destinados a processos de reutilização, reciclagem ou descarte ambientalmente adequado, em conformidade com a legislação ambiental vigente e com as diretrizes do fabricante.');

  heading2(doc, '1.9', 'Catálogo dos Equipamentos');
  writeRuns(doc, [run('Os catálogos dos equipamentos utilizados se encontram em anexo.'), ...anexoSuffix(data.catalogoAnexado, 'INSERIR CATÁLOGO')]);

  heading2(doc, '1.10', 'Identificação');
  instructionText(doc, data.identificacaoProjetosAssociados, '[IDENTIFICAÇÃO, CASO PREVISTO NAS REGRAS DO LEILÃO, DO(S) PROJETO(S) DE GERAÇÃO DE ENERGIA ASSOCIADO(S), RESPONSÁVEL(IS) PELO FORNECIMENTO DE ENERGIA PARA O SISTEMA DE ARMAZENAMENTO DE ENERGIA.]');

  heading1(doc, '2', 'DESENHOS DE LOCALIZAÇÃO');
  bodyText(doc, 'Os desenhos de localização têm por finalidade apresentar a implantação física do empreendimento, demonstrando sua compatibilidade com a documentação fundiária, a infraestrutura de acesso e as instalações associadas.');
  heading2(doc, '2.1', 'Propriedades Utilizadas');
  writeRuns(doc, [
    run('O empreendimento será implantado em área localizada na matrícula nº '),
    fillRun(data.numeroMatricula, '[NÚMERO DA MATRÍCULA]'),
    run(' do Registro Geral de Imóveis (RGI), cuja documentação comprobatória encontra-se apresentada nos anexos deste memorial.'),
    ...anexoSuffix(data.matriculaAnexada, 'ANEXAR MATRÍCULA DO IMÓVEL')
  ]);
  writeRuns(doc, [
    run('O desenho de localização do empreendimento, disponibilizado em formato DWG, apresenta a delimitação da(s) propriedade(s) envolvida(s), a poligonal da área destinada à implantação do projeto, a localização das instalações e demais elementos relevantes.'),
    ...anexoSuffix(data.dwgAnexado, 'ANEXAR ARQUIVO DWG – VERIFICAR ORIENTAÇÕES DE ELABORAÇÃO DO DOCUMENTO DWG NA PÁGINA 9 DA INSTRUÇÃO')
  ]);
  writeRuns(doc, [
    run('Adicionalmente, é apresentada imagem de localização georreferenciada compatível com o desenho técnico, permitindo a visualização da área de implantação e de seu entorno imediato.'),
    ...anexoSuffix(data.imagemLocalizacaoAnexada, 'INSERIR IMAGEM DE LOCALIZAÇÃO COMPATÍVEL COM O DESENHO DWG')
  ]);

  heading1(doc, '3', 'POLIGONAL DA ÁREA OCUPADA PELO EMPREENDIMENTO');
  bodyText(doc, 'A área destinada à implantação do empreendimento encontra-se delimitada por uma poligonal georreferenciada, definida pelos vértices apresentados na tabela a seguir.', { spacingAfter: 0.4 });

  drawCoordenadasTable(doc, data.coordenadas, data.nomeEmpreendimento);

  writeRuns(doc, [
    run('A tabela acima também é apresentada em anexo no formato Excel ("xls" ou "xlsx"), conforme modelo indicado no Anexo IV.'),
    ...anexoSuffix(data.planilhaCoordenadasAnexada, 'ANEXAR PLANILHA "ANEXO IV" COM O NOME DO PROJETO')
  ]);

  heading1(doc, '4', 'INFORMAÇÃO DE SEGURANÇA E PREVENÇÃO A INCÊNDIO');
  heading2(doc, '4.1', 'Plano de resposta a emergência');
  bodyText(doc, 'O empreendimento contará com um Plano de Resposta a Emergências (PRE), estabelecendo os procedimentos a serem adotados em situações de anormalidade operacional, falhas de equipamentos, eventos térmicos e demais ocorrências de risco.', { spacingAfter: 0.4 });
  writeRuns(doc, [run('O plano contemplará, no mínimo: '), fillRun(data.planoRespostaEmergenciaDetalhe, '[FAZER O PLANO E INCLUIR AQUI]')], { spacingAfter: 0.3 });
  [
    'Identificação dos cenários de risco associados ao sistema de armazenamento;',
    'Métodos de isolamento elétrico e operacional dos equipamentos afetados;',
    'Estratégias de contenção da propagação de incêndio entre módulos, racks ou contêineres;',
    'Procedimentos de combate e supressão de incêndio compatíveis com a tecnologia das baterias adotadas;',
    'Fluxo de comunicação e acionamento das equipes de emergência;',
    'Procedimentos de evacuação e isolamento de áreas de risco;',
    'Integração com órgãos externos de atendimento emergencial, quando aplicável.'
  ].forEach((t) => bulletText(doc, t));

  doc.moveDown(0.3);
  writeRuns(doc, [
    run('O sistema será equipado com dispositivos de monitoramento e proteção capazes de identificar condições anormais de operação e atuar preventivamente para minimizar riscos à integridade das instalações. Assim, as soluções adotadas incluem: '),
    fillRun(data.solucoesMonitoramentoDetalhe, '[FAZER O PLANO E INCLUIR AQUI]')
  ], { spacingAfter: 0.3 });
  [
    'Sensores de temperatura;',
    'Alarmes locais e remotos;',
    'Sistemas automáticos de desligamento e isolamento;',
    'Barreiras físicas para contenção de propagação térmica;',
    'Sistemas de supressão de incêndio específicos para ambientes com baterias eletroquímicas.'
  ].forEach((t) => bulletText(doc, t));

  heading2(doc, '4.2', 'Procedimentos de operação e manutenção');
  bodyText(doc, 'Serão implementados procedimentos operacionais e de manutenção voltados à prevenção de falhas e à mitigação de riscos operacionais, incluindo inspeções periódicas, monitoramento contínuo dos parâmetros operacionais e capacitação das equipes.', { spacingAfter: 0.4 });
  writeRuns(doc, [run('Os procedimentos contam com: '), fillRun(data.procedimentosManutencaoDetalhe, '[FAZER O PLANO E INCLUIR AQUI]')], { spacingAfter: 0.3 });
  [
    'Rotinas de inspeção visual;',
    'Monitoramento do estado de carga e temperatura das baterias;',
    'Verificação dos sistemas de proteção e segurança;',
    'Testes dos sistemas de detecção e supressão de incêndio;',
    'Controle de acesso às áreas técnicas;',
    'Capacitação e treinamento das equipes de operação e manutenção.'
  ].forEach((t) => bulletText(doc, t));

  doc.moveDown(0.3);
  bodyText(doc, 'O empreendimento contará com sistemas de refrigeração e ventilação adequados às condições operacionais dos equipamentos instalados, visando garantir a manutenção dos parâmetros térmicos dentro dos limites de projeto.');

  heading2(doc, '4.3', 'Integração com Empreendimentos e Instalações Vizinhas');
  writeRuns(doc, [
    run('Quando aplicável, o Plano de Resposta a Emergências será compatibilizado com os procedimentos de segurança de instalações adjacentes, incluindo subestações, usinas associadas ou outros empreendimentos compartilhados. '),
    fillRun(data.integracaoInstalacoesVizinhasDetalhe, '[FAZER O PLANO E INCLUIR AQUI]')
  ]);

  heading1(doc, '5', 'DIAGRAMA UNIFILAR');
  writeRuns(doc, [
    run('O diagrama unifilar em anexo tem por finalidade representar de forma simplificada a configuração elétrica do SAE, abrangendo os circuitos em corrente contínua (CC) e corrente alternada (CA), os equipamentos de proteção e a interligação com a rede.'),
    ...anexoSuffix(data.diagramaUnifilarAnexado, 'INSERIR DIAGRAMA UNIFILAR')
  ], { spacingAfter: 0.3 });
  [
    'Módulos, racks ou contêineres de baterias;',
    'Conversores de potência (Power Conversion System – PCS);',
    'Equipamentos de proteção e seccionamento;',
    'Transformadores associados ao sistema;',
    'Níveis de tensão de entrada e saída;',
    'Barramentos da subestação;',
    'Disjuntores e seccionadoras;',
    'Nome da subestação de conexão;',
    'Nível de tensão de acesso;',
    'Identificação do barramento de conexão;',
    'Linhas de transmissão ou alimentadores associados.'
  ].forEach((t) => bulletText(doc, t));

  heading1(doc, '6', 'ANOTAÇÃO DE RESPONSABILIDADE TÉCNICA (ART)');
  writeRuns(doc, [
    run('Em anexo, consta a(s) ART(s) associadas ao empreendimento, contendo os nomes e endereços das empresas contratante e contratada, nome e número do registro do profissional, título do responsável pelo projeto, nome do empreendimento, potência instalada e o endereço onde o empreendimento será construído.'),
    ...anexoSuffix(data.artAnexado, 'ANEXAR ART')
  ]);
}

function drawCoordenadasTable(doc, coordenadas, projectName) {
  const columns = [{ width: 60 }, { width: 110 }, { width: 110 }, { width: 90 }, { width: 81 }];
  const totalWidth = columns.reduce((a, c) => a + c.width, 0);

  ensureSpace(doc, 24);
  let y = doc.y;
  doc.rect(CONTENT_LEFT, y, totalWidth, 18).fillAndStroke(COORD_FILL, TABLE_BORDER);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(NAVY)
    .text('Nome do Projeto', CONTENT_LEFT + 4, y + 4, { width: 168, align: 'left' });
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000')
    .text(valueOrPlaceholder(projectName, '[NOME DO EMPREENDIMENTO]'), CONTENT_LEFT + 174, y + 4, { width: totalWidth - 178, align: 'left' });
  doc.y = y + 18;

  const dataRows = (coordenadas && coordenadas.length > 0)
    ? coordenadas.map((c) => [
        paramCell(c.vertice || '-'),
        paramCell(c.e || '-'),
        paramCell(c.n || '-'),
        paramCell(c.hemisferio || '-'),
        paramCell(c.fuso || '-')
      ])
    : [[paramCell('[TABELA DAS COORDENADAS]', { bold: true, italic: true, color: RED, align: 'left' })]];

  if (!coordenadas || coordenadas.length === 0) {
    ensureSpace(doc, 28);
    const yy = doc.y;
    const rowH = 22;
    doc.rect(CONTENT_LEFT, yy, totalWidth, rowH).stroke(TABLE_BORDER);
    doc.fontSize(9).font('Helvetica-BoldOblique').fillColor(RED)
      .text('[TABELA DAS COORDENADAS]', CONTENT_LEFT + 4, yy + 6, { width: totalWidth - 8 });
    doc.y = yy + rowH + 10;
    return;
  }

  drawTable(doc, columns, ['Vértice', 'Coordenada E (m)', 'Coordenada N (m)', 'Hemisfério', 'Fuso'], dataRows);
}

module.exports = { generateMemorialPdf };
