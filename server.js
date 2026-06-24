const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, WidthType, BorderStyle, Header, Footer, ImageRun, PageBreak, PageNumber, HorizontalPositionAlign, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom, TextWrappingType, TextWrappingSide, ShadingType, TabStopType, TabStopPosition } = require('docx');
const { generateMemorialPdf } = require('./pdf-generator');

const letterheadPath = path.join(__dirname, 'assets', 'letterhead.png');
const letterheadBuffer = fs.existsSync(letterheadPath) ? fs.readFileSync(letterheadPath) : null;

const NAVY = '222842';
const GRAY = '595959';
const LIGHT_GRAY = 'D9D9D9';
const HEADER_FILL = 'EDEFF4';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const subfolderNames = {
  'anexo1': 'Anexo1_Requerimento',
  'anexo2': 'Anexo2_Memorial',
  'anexo3': 'Anexo3_Licenca',
  'anexo4': 'Anexo4_DocumentosDeAcessoEContratos',
  'anexo5': 'Anexo5_Ficha',
  'anexo6': 'Anexo6_DireitoUso',
  'anexo7': 'Anexo7_Declaracao',
  'anexo8': 'Anexo8_EstudosAmbientais'
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { projectName, docType } = req.body;
    const projectDir = path.join(uploadsDir, projectName);
    const docTypeDir = path.join(projectDir, subfolderNames[docType] || docType);

    if (!fs.existsSync(docTypeDir)) {
      fs.mkdirSync(docTypeDir, { recursive: true });
    }

    cb(null, docTypeDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    const { projectName, docType } = req.body;
    res.json({
      success: true,
      message: 'Arquivo enviado com sucesso',
      file: {
        name: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        path: req.file.path
      },
      projectName,
      docType
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/projects', (req, res) => {
  try {
    const projects = fs.readdirSync(uploadsDir).filter(f =>
      fs.statSync(path.join(uploadsDir, f)).isDirectory()
    );
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/project/:name', (req, res) => {
  try {
    const projectPath = path.join(uploadsDir, req.params.name);
    const folders = fs.readdirSync(projectPath).filter(f =>
      fs.statSync(path.join(projectPath, f)).isDirectory()
    );

    const structure = {};
    folders.forEach(folder => {
      const folderPath = path.join(projectPath, folder);
      const files = fs.readdirSync(folderPath).map(f => ({
        name: f,
        path: path.relative(uploadsDir, path.join(folderPath, f))
      }));
      structure[folder] = files;
    });

    res.json({ structure });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate-memorial', async (req, res) => {
  try {
    const data = req.body;

    const doc = new Document({
      styles: {
        default: { document: { run: { font: 'Arial', size: 22 } } }
      },
      sections: [{
        properties: {
          page: {
            size: {
              width: 11906,
              height: 16838
            },
            margin: { top: 2340, right: 1440, bottom: 1440, left: 1440, footer: 1100 }
          },
          titlePage: true
        },
        headers: { default: buildLetterheadHeader(), first: buildLetterheadHeader() },
        footers: { default: buildPageNumberFooter(), first: new Footer({ children: [new Paragraph({ text: '' })] }) },
        children: createMemorialContent(data)
      }]
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="Memorial_${data.nomeEmpreendimento}.docx"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate-memorial-pdf', async (req, res) => {
  try {
    const data = req.body;
    const buffer = await generateMemorialPdf(data);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Memorial_${data.nomeEmpreendimento}.pdf"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function buildLetterheadHeader() {
  if (!letterheadBuffer) return undefined;

  return new Header({
    children: [
      new Paragraph({
        children: [
          new ImageRun({
            type: 'png',
            data: letterheadBuffer,
            transformation: { width: 792, height: 1121 },
            floating: {
              horizontalPosition: { relative: HorizontalPositionRelativeFrom.COLUMN, offset: -952500 },
              verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: -485775 },
              behindDocument: true,
              wrap: { type: TextWrappingType.NONE }
            },
            altText: { title: 'Letterhead', description: 'Papel timbrado Ilumisol', name: 'Letterhead' }
          })
        ]
      })
    ]
  });
}

function buildPageNumberFooter() {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: LIGHT_GRAY, space: 4 } },
        children: [
          new TextRun({ text: 'Página ', size: 16, color: GRAY, font: 'Arial' }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GRAY, font: 'Arial' }),
          new TextRun({ text: ' de ', size: 16, color: GRAY, font: 'Arial' }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: GRAY, font: 'Arial' })
        ]
      })
    ]
  });
}

function valueText(label, value) {
  const hasValue = value && String(value).trim() !== '';
  return {
    text: hasValue ? String(value).trim() : `[${label.replace(/[:.]+$/, '')}]`,
    isPlaceholder: !hasValue
  };
}

function cellValueOverLabel(label, value, width, borders) {
  const { text, isPlaceholder } = valueText(label, value);
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 20 }, children: [new TextRun({ text, bold: true, italics: isPlaceholder, color: isPlaceholder ? 'EE0000' : undefined, size: 20 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: label, bold: true, size: 16 })] })
    ]
  });
}

function cellLabelOverValue(label, value, width, borders) {
  const { text, isPlaceholder } = valueText(label, value);
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    margins: { top: 40, bottom: 40, left: 100, right: 80 },
    children: [
      new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: label, bold: true, size: 16 })] }),
      new Paragraph({ children: [new TextRun({ text, bold: true, italics: isPlaceholder, color: isPlaceholder ? 'EE0000' : undefined, size: 18 })] })
    ]
  });
}

function buildCoverPage(data) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: '8C95A8' };
  const borders = { top: border, bottom: border, left: border, right: border };
  const w6 = [1504, 1504, 1504, 1504, 1504, 1506];
  const w3 = [3009, 3009, 3008];
  const w4 = [2257, 2257, 2256, 2256];

  const projeto = data.nomeEmpreendimento || '[NOME DO EMPREENDIMENTO]';
  const local = (data.municipio && data.estado) ? `${data.municipio} - ${data.estado}` : (data.municipio || data.estado || '[LOCAL]');

  return [
    new Paragraph({ text: '', spacing: { after: 4400 } }),
    new Paragraph({
      children: [new TextRun({ text: 'MEMORIAL DESCRITIVO', bold: true, size: 40, color: NAVY, font: 'Arial' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 150 }
    }),
    new Paragraph({
      children: [new TextRun({ text: projeto, bold: true, size: 26, color: '000000', font: 'Arial' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),
    new Paragraph({ text: '', spacing: { after: 4400 } }),

    new Table({
      width: { size: 9026, type: WidthType.DXA },
      columnWidths: w6,
      borders,
      rows: [
        new TableRow({ children: [
          cellValueOverLabel('REV.', data.revisao, w6[0], borders),
          cellValueOverLabel('DATA', data.dataRevisao, w6[1], borders),
          cellValueOverLabel('DESCRIÇÃO', data.descricaoRevisao, w6[2], borders),
          cellValueOverLabel('ELAB.', data.elaboradoPor, w6[3], borders),
          cellValueOverLabel('VER.', data.verificadoPor, w6[4], borders),
          cellValueOverLabel('APR.', data.aprovadoPor, w6[5], borders)
        ] })
      ]
    }),

    new Table({
      width: { size: 9026, type: WidthType.DXA },
      columnWidths: w3,
      borders,
      rows: [
        new TableRow({ children: [
          cellLabelOverValue('DEPARTAMENTO:', data.departamento, w3[0], borders),
          cellLabelOverValue('CONTRATO:', data.contrato, w3[1], borders),
          cellLabelOverValue('PROJETO:', projeto, w3[2], borders)
        ] })
      ]
    }),

    new Table({
      width: { size: 9026, type: WidthType.DXA },
      columnWidths: w4,
      borders,
      rows: [
        new TableRow({ children: [
          cellLabelOverValue('LOCAL:', local, w4[0], borders),
          cellLabelOverValue('CÓDIGO:', data.codigoDocumento, w4[1], borders),
          cellLabelOverValue('REV:', data.revisao, w4[2], borders),
          cellLabelOverValue('DATA:', data.dataDocumento, w4[3], borders)
        ] })
      ]
    }),

    new Paragraph({ children: [new PageBreak()] })
  ];
}

function sumarioEntry(num, title, indent) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${num}  `, bold: true, size: indent ? 20 : 22, font: 'Arial', color: indent ? '000000' : NAVY }),
      new TextRun({ text: title, bold: !indent, size: indent ? 20 : 22, font: 'Arial', color: indent ? '000000' : NAVY })
    ],
    indent: { left: indent ? 460 : 0 },
    spacing: { before: indent ? 0 : 160, after: indent ? 60 : 80 }
  });
}

function buildSumario() {
  const entries = [
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

  return [
    new Paragraph({
      children: [new TextRun({ text: 'SUMÁRIO', bold: true, size: 32, font: 'Arial', color: NAVY })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY, space: 6 } }
    }),
    new Paragraph({ text: '', spacing: { after: 360 } }),
    ...entries.map(([num, title, indent]) => sumarioEntry(num, title, indent)),
    new Paragraph({ children: [new PageBreak()] })
  ];
}

function fillRun(value, placeholder) {
  if (value && String(value).trim() !== '') {
    return new TextRun({ text: String(value).trim(), bold: true });
  }
  return new TextRun({ text: placeholder, bold: true, color: 'EE0000', italics: true });
}

function instructionParagraph(value, placeholder, spacing) {
  const text = (value && String(value).trim() !== '') ? String(value).trim() : placeholder;
  const isPlaceholder = !(value && String(value).trim() !== '');
  return new Paragraph({
    children: [new TextRun({ text, color: isPlaceholder ? 'EE0000' : undefined, italics: isPlaceholder, bold: isPlaceholder })],
    spacing: spacing || { after: 200 }
  });
}

function anexoNote(checked, label) {
  if (checked) return [];
  return [new TextRun({ text: ` [${label}]`, bold: true, italics: true, color: 'EE0000' })];
}

function heading1(num, text) {
  return new Paragraph({
    children: [new TextRun({ text: `${num}  ${text}`, bold: true, size: 30, color: NAVY, font: 'Arial' })],
    spacing: { before: 480, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY, space: 4 } },
    keepNext: true
  });
}

function heading2(num, text) {
  return new Paragraph({
    children: [new TextRun({ text: `${num}  ${text}`, bold: true, size: 24, color: '262626', font: 'Arial' })],
    spacing: { before: 280, after: 150 },
    keepNext: true
  });
}

function bodyParagraph(text, opts) {
  opts = opts || {};
  return new Paragraph({
    text,
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 200, line: 300, ...(opts.spacing || {}) }
  });
}

function bulletParagraph(text) {
  return new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 80, line: 280 }, alignment: AlignmentType.JUSTIFIED });
}

function paramRow(label, value, unit, columnWidths) {
  const border = { style: BorderStyle.SINGLE, size: 2, color: 'BFBFBF' };
  const borders = { top: border, bottom: border, left: border, right: border };
  const valueText = (value && String(value).trim() !== '')
    ? `${String(value).trim()}${unit || ''}`
    : '[A PREENCHER]';
  const isPlaceholder = !(value && String(value).trim() !== '');
  return new TableRow({
    children: [
      new TableCell({
        borders,
        width: { size: columnWidths[0], type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: label })] })]
      }),
      new TableCell({
        borders,
        width: { size: columnWidths[1], type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: valueText, bold: isPlaceholder, italics: isPlaceholder, color: isPlaceholder ? 'EE0000' : undefined })] })]
      })
    ]
  });
}

function createMemorialContent(data) {
  const border = { style: BorderStyle.SINGLE, size: 2, color: 'BFBFBF' };
  const borders = { top: border, bottom: border, left: border, right: border };
  const colWidths = [4823, 4203];

  const paragraphs = [
    ...buildCoverPage(data),
    ...buildSumario(),

    heading1('1', 'IDENTIFICAÇÃO DO EMPREENDIMENTO'),
    heading2('1.1', 'Dados Gerais do Empreendimento'),

    new Paragraph({
      children: [
        new TextRun('O presente Memorial Descritivo refere-se ao Sistema de Armazenamento de Energia por Baterias (SAE, do inglês Battery Energy Storage System – BESS), denominado '),
        fillRun(data.nomeEmpreendimento, '[NOME DO EMPREENDIMENTO]'),
        new TextRun(', a ser implantado no município de '),
        fillRun(data.municipio, '[MUNICÍPIO]'),
        new TextRun(', estado de '),
        fillRun(data.estado, '[ESTADO]'),
        new TextRun(', situado em '),
        fillRun(data.endereco, '[ENDEREÇO]'),
        new TextRun(', ocupando uma área aproximada de '),
        fillRun(data.area, '[ÁREA]'),
        new TextRun(' hectares com a potência instalada de '),
        fillRun(data.potenciaInstalada, '[POTÊNCIA INSTALADA]'),
        new TextRun(' kW.')
      ],
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 200, line: 300 }
    }),

    heading2('1.2', 'Tecnologia Adotada'),

    new Paragraph({
      children: [
        new TextRun('O sistema de armazenamento utilizará a tecnologia '),
        fillRun(data.descricaoTecnologia, '[DESCRIÇÃO DA TECNOLOGIA]'),
        new TextRun(', composta por baterias eletroquímicas com cátodo de composição '),
        fillRun(data.quimicaCatodo, '[QUÍMICA DO CÁTODO]'),
        new TextRun(' e ânodo de composição '),
        fillRun(data.quimicaAnodo, '[QUÍMICA DO ÂNODO]'),
        new TextRun('.')
      ],
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 200, line: 300 }
    }),

    heading2('1.3', 'Dimensionamento do Sistema'),

    new Paragraph({
      children: [
        new TextRun('O dimensionamento do sistema foi desenvolvido para uma potência nominal de '),
        fillRun(data.potenciaNominal, '[POTÊNCIA NOMINAL]'),
        new TextRun(' kW e capacidade de armazenamento de '),
        fillRun(data.capacidadeArmazenamento, '[CAPACIDADE DE ARMAZENAMENTO]'),
        new TextRun(' kWh, considerando um regime de descarga de '),
        fillRun(data.regimeDescarga, '[REGIME DE DESCARGA]'),
        new TextRun('. A análise energética inclui o ciclo completo de operação, considerando o suprimento à rede, perdas inerentes ao sistema e o autoconsumo: '),
        fillRun(data.analiseEnergeticaDetalhada, '[DETALHAR A ANÁLISE ENERGÉTICA COM CICLO COMPLETO]'),
        new TextRun('.')
      ],
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 200, line: 300 }
    }),

    new Paragraph({
      text: 'Para o dimensionamento e avaliação de desempenho do empreendimento foram considerados os seguintes parâmetros:',
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 150, line: 300 }
    }),

    new Table({
      width: { size: colWidths[0] + colWidths[1], type: WidthType.DXA },
      columnWidths: colWidths,
      borders,
      rows: [
        new TableRow({
          children: [
            new TableCell({ borders, shading: { fill: HEADER_FILL, type: ShadingType.CLEAR }, width: { size: colWidths[0], type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: 'Parâmetro', bold: true, color: NAVY })] })] }),
            new TableCell({ borders, shading: { fill: HEADER_FILL, type: ShadingType.CLEAR }, width: { size: colWidths[1], type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: 'Valor', bold: true, color: NAVY })] })] })
          ]
        }),
        paramRow('Eficiência de carga/descarga da bateria', data.eficienciaCargaDescarga, '%', colWidths),
        paramRow('Limites máximo e mínimo da profundidade máxima de descarga (DoD Máxima)', data.limitesDoD, '', colWidths),
        paramRow('Estado mínimo de carga (SOC Mínimo)', data.socMinimo, '%', colWidths),
        paramRow('Eficiência dos conversores (PCS)', data.eficienciaPCS, '%', colWidths),
        paramRow('Consumo interno do sistema', data.consumoInterno, '', colWidths),
        paramRow('Consumo em stand-by', data.consumoStandby, '', colWidths)
      ]
    }),

    new Paragraph({ text: '', spacing: { after: 200 } }),

    heading2('1.4', 'Simulação do Perfil Diário Médio Anual do Estado de Carga da Bateria'),
    new Paragraph({
      text: 'Uma simulação do perfil diário médio anual do estado de carga da bateria foi realizada, considerando os ciclos de carga e descarga previstos para todo o período contratual.',
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 150, line: 300 }
    }),
    instructionParagraph(data.simulacaoPerfilCarga, '[APRESENTAR SIMULAÇÃO CONSIDERANDO OS CICLOS DE CARGA E DESCARGA DURANTE O PERÍODO CONTRATUAL]'),

    heading2('1.5', 'Estudo de Degradação da Bateria'),
    instructionParagraph(data.estudoDegradacao, '[DETALHAR O PROCESSO DE DEGRADAÇÃO DA BATERIA CONSIDERANDO O NÚMERO DE CICLOS, AS PROFUNDIDADES DE CARGA E DESCARGA, OS EFEITOS DE TEMPERATURA E OUTRAS VARIÁVEIS QUE INTERFIRAM NA DEGRADAÇÃO].'),

    heading2('1.6', 'Estimativa de Eficiência de Carga e Descarga da Bateria'),
    instructionParagraph(data.estimativaEficienciaRTE, '[COM REFERÊNCIA AO PMI, EM FUNÇÃO DO NÚMERO DE CICLOS, CONSIDERANDO AS PROFUNDIDADES DE CARGA E DESCARGA NOS CICLOS, OS EFEITOS DE TEMPERATURA E OUTRAS VARIÁVEIS QUE INTERFIRAM NA EFICIÊNCIA, INCLUINDO PERDAS ÔHMICAS, PERDAS NO TRAFO, CONSUMO DOS EQUIPAMENTOS AUXILIARES, CONSUMO EM STAND-BY E DEMAIS PERDAS CONSIDERADAS RELEVANTES. O ESTUDO DEVE INDICAR A RTE REMANESCENTE MÍNIMA PROJETADA AO LONGO DOS ANOS PREVISTOS NO CONTRATO DE SUPRIMENTO E ESTAR COMPATÍVEL COM OS PARÂMETROS DECLARADOS NA FICHA DE DADOS DO SISTEMA AEGE. DEVEM AINDA SER APRESENTADOS A MEMÓRIA DE CÁLCULO E A REPRESENTAÇÃO GRÁFICA DA RTE AO LONGO DO PERÍODO CONTRATUAL.]'),
    instructionParagraph(data.areaAbrangenciaRTE, '[AINDA, PARA FINS DE DEFINIÇÃO DA RTE, DEVERÁ SER OBSERVADA A ÁREA DE ABRANGÊNCIA CONFORME A FIGURA A SEGUIR - PÁG.8 INSTRUÇÃO, ALÉM DOS CRITÉRIOS DE CÁLCULO ESTABELECIDOS NA PORTARIA DE DIRETRIZES DO RESPECTIVO LEILÃO.]'),

    heading2('1.7', 'Estratégia de "Augmentation"'),
    new Paragraph({
      text: 'Para garantir a manutenção da capacidade contratada e do desempenho operacional ao longo da vida útil do empreendimento, será adotada a seguinte estratégia de augmentation:',
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 150, line: 300 }
    }),
    instructionParagraph(data.estrategiaAugmentation, '[DESCREVER ESTRATÉGIA]'),

    heading2('1.8', 'Plano de Descarte/Reciclagem'),
    new Paragraph({
      text: 'Ao final da vida útil do sistema, os equipamentos serão destinados a processos de reutilização, reciclagem ou descarte ambientalmente adequado, em conformidade com a legislação ambiental vigente e com as diretrizes do fabricante.',
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 200, line: 300 }
    }),

    heading2('1.9', 'Catálogo dos Equipamentos'),
    new Paragraph({
      children: [
        new TextRun('Os catálogos dos equipamentos utilizados se encontram em anexo.'),
        ...anexoNote(data.catalogoAnexado, 'INSERIR CATÁLOGO')
      ],
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 200, line: 300 }
    }),

    heading2('1.10', 'Identificação'),
    instructionParagraph(data.identificacaoProjetosAssociados, '[IDENTIFICAÇÃO, CASO PREVISTO NAS REGRAS DO LEILÃO, DO(S) PROJETO(S) DE GERAÇÃO DE ENERGIA ASSOCIADO(S), RESPONSÁVEL(IS) PELO FORNECIMENTO DE ENERGIA PARA O SISTEMA DE ARMAZENAMENTO DE ENERGIA.]'),

    heading1('2', 'DESENHOS DE LOCALIZAÇÃO'),
    new Paragraph({
      text: 'Os desenhos de localização têm por finalidade apresentar a implantação física do empreendimento, demonstrando sua compatibilidade com a documentação fundiária, a infraestrutura de acesso e as instalações associadas.',
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 200, line: 300 }
    }),
    heading2('2.1', 'Propriedades Utilizadas'),
    new Paragraph({
      children: [
        new TextRun('O empreendimento será implantado em área localizada na matrícula nº '),
        fillRun(data.numeroMatricula, '[NÚMERO DA MATRÍCULA]'),
        new TextRun(' do Registro Geral de Imóveis (RGI), cuja documentação comprobatória encontra-se apresentada nos anexos deste memorial.'),
        ...anexoNote(data.matriculaAnexada, 'ANEXAR MATRÍCULA DO IMÓVEL')
      ],
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 200, line: 300 }
    }),
    new Paragraph({
      children: [
        new TextRun('O desenho de localização do empreendimento, disponibilizado em formato DWG, apresenta a delimitação da(s) propriedade(s) envolvida(s), a poligonal da área destinada à implantação do projeto, a localização das instalações e demais elementos relevantes.'),
        ...anexoNote(data.dwgAnexado, 'ANEXAR ARQUIVO DWG – VERIFICAR ORIENTAÇÕES DE ELABORAÇÃO DO DOCUMENTO DWG NA PÁGINA 9 DA INSTRUÇÃO')
      ],
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 200, line: 300 }
    }),
    new Paragraph({
      children: [
        new TextRun('Adicionalmente, é apresentada imagem de localização georreferenciada compatível com o desenho técnico, permitindo a visualização da área de implantação e de seu entorno imediato.'),
        ...anexoNote(data.imagemLocalizacaoAnexada, 'INSERIR IMAGEM DE LOCALIZAÇÃO COMPATÍVEL COM O DESENHO DWG')
      ],
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 200, line: 300 }
    }),

    heading1('3', 'POLIGONAL DA ÁREA OCUPADA PELO EMPREENDIMENTO'),
    new Paragraph({
      text: 'A área destinada à implantação do empreendimento encontra-se delimitada por uma poligonal georreferenciada, definida pelos vértices apresentados na tabela a seguir.',
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 150, line: 300 }
    }),

    buildCoordenadasTable(data.coordenadas, data.nomeEmpreendimento, borders),

    new Paragraph({ text: '', spacing: { after: 150 } }),
    new Paragraph({
      children: [
        new TextRun('A tabela acima também é apresentada em anexo no formato Excel ("xls" ou "xlsx"), conforme modelo indicado no Anexo IV.'),
        ...anexoNote(data.planilhaCoordenadasAnexada, 'ANEXAR PLANILHA "ANEXO IV" COM O NOME DO PROJETO')
      ],
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 200, line: 300 }
    }),

    heading1('4', 'INFORMAÇÃO DE SEGURANÇA E PREVENÇÃO A INCÊNDIO'),
    heading2('4.1', 'Plano de resposta a emergência'),
    new Paragraph({
      text: 'O empreendimento contará com um Plano de Resposta a Emergências (PRE), estabelecendo os procedimentos a serem adotados em situações de anormalidade operacional, falhas de equipamentos, eventos térmicos e demais ocorrências de risco.',
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 150, line: 300 }
    }),
    new Paragraph({
      children: [
        new TextRun('O plano contemplará, no mínimo: '),
        fillRun(data.planoRespostaEmergenciaDetalhe, '[FAZER O PLANO E INCLUIR AQUI]')
      ],
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 100, line: 300 }
    }),
    bulletParagraph('Identificação dos cenários de risco associados ao sistema de armazenamento;'),
    bulletParagraph('Métodos de isolamento elétrico e operacional dos equipamentos afetados;'),
    bulletParagraph('Estratégias de contenção da propagação de incêndio entre módulos, racks ou contêineres;'),
    bulletParagraph('Procedimentos de combate e supressão de incêndio compatíveis com a tecnologia das baterias adotadas;'),
    bulletParagraph('Fluxo de comunicação e acionamento das equipes de emergência;'),
    bulletParagraph('Procedimentos de evacuação e isolamento de áreas de risco;'),
    bulletParagraph('Integração com órgãos externos de atendimento emergencial, quando aplicável.'),

    new Paragraph({
      children: [
        new TextRun('O sistema será equipado com dispositivos de monitoramento e proteção capazes de identificar condições anormais de operação e atuar preventivamente para minimizar riscos à integridade das instalações. Assim, as soluções adotadas incluem: '),
        fillRun(data.solucoesMonitoramentoDetalhe, '[FAZER O PLANO E INCLUIR AQUI]')
      ],
      spacing: { before: 150, after: 100 }
    }),
    bulletParagraph('Sensores de temperatura;'),
    bulletParagraph('Alarmes locais e remotos;'),
    bulletParagraph('Sistemas automáticos de desligamento e isolamento;'),
    bulletParagraph('Barreiras físicas para contenção de propagação térmica;'),
    bulletParagraph('Sistemas de supressão de incêndio específicos para ambientes com baterias eletroquímicas.'),

    heading2('4.2', 'Procedimentos de operação e manutenção'),
    new Paragraph({
      text: 'Serão implementados procedimentos operacionais e de manutenção voltados à prevenção de falhas e à mitigação de riscos operacionais, incluindo inspeções periódicas, monitoramento contínuo dos parâmetros operacionais e capacitação das equipes.',
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 150, line: 300 }
    }),
    new Paragraph({
      children: [
        new TextRun('Os procedimentos contam com: '),
        fillRun(data.procedimentosManutencaoDetalhe, '[FAZER O PLANO E INCLUIR AQUI]')
      ],
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 100, line: 300 }
    }),
    bulletParagraph('Rotinas de inspeção visual;'),
    bulletParagraph('Monitoramento do estado de carga e temperatura das baterias;'),
    bulletParagraph('Verificação dos sistemas de proteção e segurança;'),
    bulletParagraph('Testes dos sistemas de detecção e supressão de incêndio;'),
    bulletParagraph('Controle de acesso às áreas técnicas;'),
    bulletParagraph('Capacitação e treinamento das equipes de operação e manutenção.'),

    new Paragraph({
      text: 'O empreendimento contará com sistemas de refrigeração e ventilação adequados às condições operacionais dos equipamentos instalados, visando garantir a manutenção dos parâmetros térmicos dentro dos limites de projeto.',
      spacing: { before: 150, after: 200 }
    }),

    heading2('4.3', 'Integração com Empreendimentos e Instalações Vizinhas'),
    new Paragraph({
      children: [
        new TextRun('Quando aplicável, o Plano de Resposta a Emergências será compatibilizado com os procedimentos de segurança de instalações adjacentes, incluindo subestações, usinas associadas ou outros empreendimentos compartilhados. '),
        fillRun(data.integracaoInstalacoesVizinhasDetalhe, '[FAZER O PLANO E INCLUIR AQUI]')
      ],
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 200, line: 300 }
    }),

    heading1('5', 'DIAGRAMA UNIFILAR'),
    new Paragraph({
      children: [
        new TextRun('O diagrama unifilar em anexo tem por finalidade representar de forma simplificada a configuração elétrica do SAE, abrangendo os circuitos em corrente contínua (CC) e corrente alternada (CA), os equipamentos de proteção e a interligação com a rede.'),
        ...anexoNote(data.diagramaUnifilarAnexado, 'INSERIR DIAGRAMA UNIFILAR')
      ],
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 100, line: 300 }
    }),
    bulletParagraph('Módulos, racks ou contêineres de baterias;'),
    bulletParagraph('Conversores de potência (Power Conversion System – PCS);'),
    bulletParagraph('Equipamentos de proteção e seccionamento;'),
    bulletParagraph('Transformadores associados ao sistema;'),
    bulletParagraph('Níveis de tensão de entrada e saída;'),
    bulletParagraph('Barramentos da subestação;'),
    bulletParagraph('Disjuntores e seccionadoras;'),
    bulletParagraph('Nome da subestação de conexão;'),
    bulletParagraph('Nível de tensão de acesso;'),
    bulletParagraph('Identificação do barramento de conexão;'),
    bulletParagraph('Linhas de transmissão ou alimentadores associados.'),

    heading1('6', 'ANOTAÇÃO DE RESPONSABILIDADE TÉCNICA (ART)'),
    new Paragraph({
      children: [
        new TextRun('Em anexo, consta a(s) ART(s) associadas ao empreendimento, contendo os nomes e endereços das empresas contratante e contratada, nome e número do registro do profissional, título do responsável pelo projeto, nome do empreendimento, potência instalada e o endereço onde o empreendimento será construído.'),
        ...anexoNote(data.artAnexado, 'ANEXAR ART')
      ],
      alignment: AlignmentType.JUSTIFIED, spacing: { after: 200, line: 300 }
    })
  ];

  return paragraphs;
}

function buildCoordenadasTable(coordenadas, projectName, borders) {
  const COORD_FILL = 'BDD7EE';
  const totalWidth = 9026;
  const w5 = [1100, 2400, 2400, 1563, 1563];
  const headers = ['Vértice', 'Coordenada E (m)', 'Coordenada N (m)', 'Hemisfério', 'Fuso'];

  const projectRow = new TableRow({
    children: [
      new TableCell({
        borders, shading: { fill: COORD_FILL, type: ShadingType.CLEAR }, width: { size: w5[0] + w5[1], type: WidthType.DXA }, columnSpan: 2,
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: 'Nome do Projeto', bold: true, color: NAVY })] })]
      }),
      new TableCell({
        borders, width: { size: w5[2] + w5[3] + w5[4], type: WidthType.DXA }, columnSpan: 3,
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [fillRun(projectName, '[NOME DO EMPREENDIMENTO]')] })]
      })
    ]
  });

  const headerRow = new TableRow({
    children: headers.map((h, i) => new TableCell({
      borders, shading: { fill: COORD_FILL, type: ShadingType.CLEAR }, width: { size: w5[i], type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, color: NAVY })] })]
    }))
  });

  const dataRows = (coordenadas && coordenadas.length > 0)
    ? coordenadas.map(c => new TableRow({
        children: [c.vertice, c.e, c.n, c.hemisferio, c.fuso].map((v, i) => new TableCell({
          borders, width: { size: w5[i], type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: v || '-' })] })]
        }))
      }))
    : [new TableRow({
        children: [new TableCell({
          borders, width: { size: totalWidth, type: WidthType.DXA }, columnSpan: 5,
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: '[TABELA DAS COORDENADAS]', bold: true, italics: true, color: 'EE0000' })] })]
        })]
      })];

  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: w5,
    borders,
    rows: [projectRow, headerRow, ...dataRows]
  });
}

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Diretório de uploads: ${uploadsDir}`);
});
