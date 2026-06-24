const API_BASE = 'http://localhost:3000/api';

let currentProject = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  loadProjects();
  setupProjectListeners();
  addCoordenadaRow();
  addCoordenadaRow();
  addCoordenadaRow();
});

let coordenadaRowCount = 0;

function addCoordenadaRow() {
  const container = document.getElementById('coordenadasTable');
  const rowId = coordenadaRowCount++;

  const row = document.createElement('div');
  row.className = 'form-row coordenada-row';
  row.dataset.rowId = rowId;
  row.innerHTML = `
    <div class="form-group">
      <input type="text" class="coord-vertice" placeholder="Vértice (ex: 1)">
    </div>
    <div class="form-group">
      <input type="text" class="coord-e" placeholder="Coordenada E (m)">
    </div>
    <div class="form-group">
      <input type="text" class="coord-n" placeholder="Coordenada N (m)">
    </div>
    <div class="form-group">
      <input type="text" class="coord-hemisferio" placeholder="Hemisfério (ex: Sul)">
    </div>
    <div class="form-group">
      <input type="text" class="coord-fuso" placeholder="Fuso (ex: 23)">
    </div>
    <button type="button" class="btn btn-secondary btn-small" onclick="this.closest('.coordenada-row').remove()">Remover</button>
  `;
  container.appendChild(row);
}

function getCoordenadas() {
  const rows = document.querySelectorAll('#coordenadasTable .coordenada-row');
  const coordenadas = [];
  rows.forEach(row => {
    const vertice = row.querySelector('.coord-vertice').value.trim();
    const e = row.querySelector('.coord-e').value.trim();
    const n = row.querySelector('.coord-n').value.trim();
    const hemisferio = row.querySelector('.coord-hemisferio').value.trim();
    const fuso = row.querySelector('.coord-fuso').value.trim();
    if (vertice || e || n || hemisferio || fuso) {
      coordenadas.push({ vertice, e, n, hemisferio, fuso });
    }
  });
  return coordenadas;
}

function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(tabName).classList.add('active');
    });
  });
}

async function loadProjects() {
  try {
    const response = await fetch(`${API_BASE}/projects`);
    const data = await response.json();

    const projectList = document.getElementById('projectList');
    projectList.innerHTML = '<option value="">-- Selecione um projeto existente --</option>';

    if (data.projects && data.projects.length > 0) {
      data.projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project;
        option.textContent = project;
        projectList.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Erro ao carregar projetos:', error);
    showStatus('Erro ao carregar projetos', 'error');
  }
}

function setupProjectListeners() {
  document.getElementById('projectList').addEventListener('change', (e) => {
    if (e.target.value) {
      selectProject(e.target.value);
    }
  });
}

function createNewProject() {
  const name = document.getElementById('newProjectName').value.trim();

  if (!name) {
    showStatus('Por favor, digite o nome do empreendimento', 'error');
    return;
  }

  currentProject = name;
  document.getElementById('newProjectName').value = '';
  selectProject(name);
  loadProjects();
}

function selectProject(projectName) {
  currentProject = projectName;
  document.getElementById('projectNameDisplay').textContent = projectName;
  document.getElementById('currentProject').style.display = 'block';
  document.getElementById('projectList').value = projectName;

  // Scroll para a seção do projeto
  setTimeout(() => {
    document.getElementById('currentProject').scrollIntoView({ behavior: 'smooth' });
  }, 100);

  loadProjectStructure(projectName);
}

async function loadProjectStructure(projectName) {
  try {
    const response = await fetch(`${API_BASE}/project/${encodeURIComponent(projectName)}`);
    const data = await response.json();

    const container = document.getElementById('projectStructure');
    container.innerHTML = '';

    if (!data.structure || Object.keys(data.structure).length === 0) {
      container.innerHTML = '<p class="empty-message">Nenhum documento enviado ainda</p>';
      return;
    }

    Object.entries(data.structure).forEach(([folder, files]) => {
      const folderGroup = document.createElement('div');
      folderGroup.className = 'folder-group';

      const header = document.createElement('div');
      header.className = 'folder-header';
      header.innerHTML = `<span class="folder-icon">📁</span> ${folder}`;
      header.addEventListener('click', () => {
        fileList.classList.toggle('open');
      });

      const fileList = document.createElement('div');
      fileList.className = 'file-list';

      if (files.length === 0) {
        fileList.innerHTML = '<p class="empty-message">Nenhum arquivo</p>';
      } else {
        files.forEach(file => {
          const fileItem = document.createElement('div');
          fileItem.className = 'file-item';
          fileItem.innerHTML = `
            <span class="file-name">📄 ${file.name}</span>
          `;
          fileList.appendChild(fileItem);
        });
      }

      folderGroup.appendChild(header);
      folderGroup.appendChild(fileList);
      container.appendChild(folderGroup);
    });
  } catch (error) {
    console.error('Erro ao carregar estrutura do projeto:', error);
    showStatus('Erro ao carregar estrutura do projeto', 'error');
  }
}

async function uploadFile() {
  if (!currentProject) {
    showStatus('Por favor, selecione ou crie um projeto primeiro', 'error');
    return;
  }

  const fileInput = document.getElementById('fileInput');
  const docType = document.getElementById('docType').value;

  if (!fileInput.files.length) {
    showStatus('Por favor, selecione um arquivo', 'error');
    return;
  }

  if (!docType) {
    showStatus('Por favor, selecione o tipo de documento', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  formData.append('projectName', currentProject);
  formData.append('docType', docType);

  try {
    showStatus('Enviando arquivo...', 'loading');

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      showStatus(`✓ "${fileInput.files[0].name}" enviado com sucesso!`, 'success');
      fileInput.value = '';
      document.getElementById('docType').value = '';

      // Recarregar estrutura do projeto
      loadProjectStructure(currentProject);
    } else {
      showStatus(`Erro: ${data.error}`, 'error');
    }
  } catch (error) {
    console.error('Erro ao enviar arquivo:', error);
    showStatus('Erro ao enviar arquivo', 'error');
  }
}

function collectMemorialData() {
  const textFieldIds = [
    'revisao', 'dataRevisao', 'descricaoRevisao', 'elaboradoPor', 'verificadoPor', 'aprovadoPor',
    'departamento', 'contrato', 'codigoDocumento', 'dataDocumento',
    'nomeEmpreendimento', 'municipio', 'estado', 'endereco', 'area', 'potenciaInstalada',
    'descricaoTecnologia', 'quimicaCatodo', 'quimicaAnodo',
    'potenciaNominal', 'capacidadeArmazenamento', 'regimeDescarga', 'analiseEnergeticaDetalhada',
    'eficienciaCargaDescarga', 'limitesDoD', 'socMinimo', 'eficienciaPCS', 'consumoInterno', 'consumoStandby',
    'simulacaoPerfilCarga', 'estudoDegradacao', 'estimativaEficienciaRTE', 'areaAbrangenciaRTE',
    'estrategiaAugmentation', 'identificacaoProjetosAssociados', 'numeroMatricula',
    'planoRespostaEmergenciaDetalhe', 'solucoesMonitoramentoDetalhe',
    'procedimentosManutencaoDetalhe', 'integracaoInstalacoesVizinhasDetalhe'
  ];
  const checkboxIds = [
    'catalogoAnexado', 'matriculaAnexada', 'dwgAnexado', 'imagemLocalizacaoAnexada',
    'planilhaCoordenadasAnexada', 'diagramaUnifilarAnexado', 'artAnexado'
  ];

  const data = {};
  textFieldIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) data[id] = el.value;
  });
  checkboxIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) data[id] = el.checked;
  });
  data.coordenadas = getCoordenadas();
  return data;
}

async function generateMemorial(format) {
  format = format === 'pdf' ? 'pdf' : 'docx';
  const data = collectMemorialData();
  const endpoint = format === 'pdf' ? 'generate-memorial-pdf' : 'generate-memorial';

  try {
    showStatusMemorial(`Gerando ${format === 'pdf' ? 'PDF' : 'Word'}...`, 'loading');

    const response = await fetch(`${API_BASE}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Memorial_${data.nomeEmpreendimento || 'Descritivo'}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    showStatusMemorial('✓ Documento gerado e baixado com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao gerar memorial:', error);
    showStatusMemorial('Erro ao gerar documento', 'error');
  }
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('uploadStatus');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;

  if (type !== 'loading') {
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 4000);
  }
}

function showStatusMemorial(message, type) {
  // Criar elemento de status se não existir
  let statusDiv = document.getElementById('memorialStatus');
  if (!statusDiv) {
    statusDiv = document.createElement('div');
    statusDiv.id = 'memorialStatus';
    statusDiv.className = 'status';
    document.querySelector('#memorial .section').insertAdjacentElement('afterbegin', statusDiv);
  }

  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;

  if (type !== 'loading') {
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 4000);
  }
}
