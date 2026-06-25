import { supabase } from './supabaseClient';
import { getNextRevisionCode } from './revisionRules';

/**
 * Cria as etapas reais de aprovação para uma revisão, a partir do workflow_template
 * vinculado ao projeto. Resolve quem é o aprovador de cada etapa:
 * - approver_type = 'specific_user' -> usa o usuário fixo do step.
 * - approver_type = 'hierarchy_level' -> procura, na hierarquia do projeto, o nível
 *   com o mesmo nome e usa a pessoa atribuída a esse nível (project_hierarchy_assignments).
 */
export async function instantiateApprovalSteps({ documentRevisionId, projectId, workflowTemplateId }) {
  const { data: steps, error: stepsError } = await supabase
    .from('workflow_template_steps')
    .select('*')
    .eq('workflow_template_id', workflowTemplateId)
    .order('step_order');

  if (stepsError) throw stepsError;
  if (!steps || steps.length === 0) {
    throw new Error('O fluxo selecionado não tem etapas configuradas.');
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('hierarchy_template_id')
    .eq('id', projectId)
    .single();
  if (projectError) throw projectError;

  let levelsByName = {};
  let assignmentsByLevelId = {};

  if (project.hierarchy_template_id) {
    const { data: levels, error: levelsError } = await supabase
      .from('hierarchy_template_levels')
      .select('*')
      .eq('hierarchy_template_id', project.hierarchy_template_id);
    if (levelsError) throw levelsError;
    levelsByName = Object.fromEntries((levels ?? []).map((l) => [l.name, l]));

    const { data: assignments, error: assignmentsError } = await supabase
      .from('project_hierarchy_assignments')
      .select('*')
      .eq('project_id', projectId);
    if (assignmentsError) throw assignmentsError;
    assignmentsByLevelId = Object.fromEntries((assignments ?? []).map((a) => [a.hierarchy_template_level_id, a.user_id]));
  }

  const rows = steps.map((step) => {
    let approverUserId = null;
    if (step.approver_type === 'specific_user') {
      approverUserId = step.specific_user_id;
    } else {
      const level = levelsByName[step.approver_level_name];
      approverUserId = level ? assignmentsByLevelId[level.id] ?? null : null;
    }
    return {
      document_revision_id: documentRevisionId,
      step_order: step.step_order,
      name: step.name,
      approver_user_id: approverUserId,
      status: 'pendente'
    };
  });

  const { error: insertError } = await supabase.from('revision_approval_steps').insert(rows);
  if (insertError) throw insertError;

  const { error: updateError } = await supabase
    .from('document_revisions')
    .update({ status: 'em_analise' })
    .eq('id', documentRevisionId);
  if (updateError) throw updateError;
}

/**
 * Aprova ou reprova a etapa atual. Se for a última etapa e for aprovada, marca a
 * revisão como 'aprovado' (pronta para ser emitida). Se reprovada, encerra o fluxo.
 */
export async function decideStep({ stepId, documentRevisionId, approved, comment }) {
  const { error: stepError } = await supabase
    .from('revision_approval_steps')
    .update({ status: approved ? 'aprovado' : 'reprovado', decided_at: new Date().toISOString(), comment: comment || null })
    .eq('id', stepId);
  if (stepError) throw stepError;

  if (!approved) {
    const { error } = await supabase.from('document_revisions').update({ status: 'reprovado' }).eq('id', documentRevisionId);
    if (error) throw error;
    return;
  }

  const { data: allSteps, error: allStepsError } = await supabase
    .from('revision_approval_steps')
    .select('status')
    .eq('document_revision_id', documentRevisionId);
  if (allStepsError) throw allStepsError;

  const allApproved = allSteps.every((s) => s.status === 'aprovado');
  if (allApproved) {
    const { error } = await supabase.from('document_revisions').update({ status: 'aprovado' }).eq('id', documentRevisionId);
    if (error) throw error;
  }
}

/**
 * Emite o documento: recalcula o código de revisão usando a regra de numeração
 * (configurável) com isEmission=true, e marca a revisão como 'emitido'.
 */
export async function emitRevision({ documentRevisionId, projectDocumentId, currentCode, settings }) {
  const newCode = getNextRevisionCode(currentCode, { isEmission: true }, settings);

  const { error: revisionError } = await supabase
    .from('document_revisions')
    .update({ revision_code: newCode, is_emission: true, status: 'emitido' })
    .eq('id', documentRevisionId);
  if (revisionError) throw revisionError;

  const { error: docError } = await supabase
    .from('project_documents')
    .update({ status: 'emitido' })
    .eq('id', projectDocumentId);
  if (docError) throw docError;

  return newCode;
}

/**
 * Finaliza formalmente o documento: marca a revisão emitida como 'finalizado',
 * registrando quem encerrou o ciclo e quando. Estado terminal, distinto de 'emitido'.
 */
export async function finalizeRevision({ documentRevisionId, projectDocumentId, userId }) {
  const { error: revisionError } = await supabase
    .from('document_revisions')
    .update({ status: 'finalizado', finalized_at: new Date().toISOString(), finalized_by: userId })
    .eq('id', documentRevisionId);
  if (revisionError) throw revisionError;

  const { error: docError } = await supabase
    .from('project_documents')
    .update({ status: 'finalizado' })
    .eq('id', projectDocumentId);
  if (docError) throw docError;
}
