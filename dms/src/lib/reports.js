import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { supabase } from './supabaseClient';

function documentRows(project, documents) {
  return documents.map((d) => ({
    tipo: d.document_types?.name ?? '',
    nome: d.nome_padrao_arquivo,
    revisao: d.revisions?.[0]?.revision_code ?? '—',
    status: d.status,
    responsavel: d.responsible_user_id_name ?? ''
  }));
}

/**
 * Gera o índice do databook (PDF): cabeçalho do projeto + tabela com todos os
 * documentos vinculados, revisão atual e status.
 */
export function generateDatabookIndexPdf(project, documents) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  doc.setFontSize(16);
  doc.text('Databook — Índice de Documentos', 40, 50);

  doc.setFontSize(10);
  doc.setTextColor(90);
  const headerLines = [
    project.project_code ? `Código: ${project.project_code}` : null,
    `Projeto: ${project.name}`,
    project.client_name ? `Cliente: ${project.client_name}` : null,
    [project.municipio, project.estado].filter(Boolean).join(' - ') || null,
    `Gerado em: ${new Date().toLocaleString('pt-BR')}`
  ].filter(Boolean);
  headerLines.forEach((line, i) => doc.text(line, 40, 70 + i * 14));

  const rows = documentRows(project, documents);

  autoTable(doc, {
    startY: 70 + headerLines.length * 14 + 16,
    head: [['Tipo de Documento', 'Nome do Arquivo', 'Revisão', 'Status']],
    body: rows.map((r) => [r.tipo, r.nome, r.revisao, r.status]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [44, 58, 143] }
  });

  doc.save(`Databook_${project.project_code || project.name}.pdf`);
}

/**
 * Exporta a lista de documentos do projeto para Excel (.xlsx).
 */
export async function exportProjectDocumentsToExcel(project, documents) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Documentos');

  sheet.addRow(['Projeto', project.name]);
  if (project.project_code) sheet.addRow(['Código', project.project_code]);
  if (project.client_name) sheet.addRow(['Cliente', project.client_name]);
  sheet.addRow([]);

  const headerRow = sheet.addRow(['Tipo de Documento', 'Nome do Arquivo', 'Revisão Atual', 'Status']);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDEFF4' } };
  });

  documentRows(project, documents).forEach((r) => {
    sheet.addRow([r.tipo, r.nome, r.revisao, r.status]);
  });

  sheet.columns.forEach((col) => {
    col.width = 32;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Documentos_${project.project_code || project.name}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Monta um ZIP com a revisão atual (emitida) de cada documento do projeto,
 * mais o índice do databook em texto simples.
 */
export async function downloadDatabookZip(project, documents) {
  const zip = new JSZip();
  const emitted = documents.filter((d) => d.revisions?.[0]?.status === 'emitido');

  let indexText = `Databook — ${project.name}\n`;
  if (project.project_code) indexText += `Código: ${project.project_code}\n`;
  if (project.client_name) indexText += `Cliente: ${project.client_name}\n`;
  indexText += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n\n`;

  let includedCount = 0;
  for (const doc of emitted) {
    const rev = doc.revisions[0];
    const { data, error } = await supabase.storage.from('documents').download(rev.storage_path);
    if (error) continue;

    const ext = rev.file_name.includes('.') ? rev.file_name.slice(rev.file_name.lastIndexOf('.')) : '';
    const fileName = `${doc.nome_padrao_arquivo}_${rev.revision_code}${ext}`;
    zip.file(fileName, data);
    indexText += `- ${doc.document_types?.name ?? ''}: ${fileName}\n`;
    includedCount += 1;
  }

  if (includedCount === 0) {
    indexText += '(Nenhum documento emitido disponível para download.)\n';
  }

  zip.file('00_INDICE.txt', indexText);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Databook_${project.project_code || project.name}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return includedCount;
}
