// Histórico leve de projetos recentes, persistido em localStorage.
// Usado pela barra lateral para a seção "Projetos recentes".

const KEY = 'dms-recent-projects';
const MAX = 5;

export function getRecentProjects() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function pushRecentProject(project) {
  if (!project?.id) return;
  try {
    const entry = { id: project.id, name: project.name || 'Projeto', code: project.project_code || null };
    const current = getRecentProjects().filter((p) => p.id !== entry.id);
    const next = [entry, ...current].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('dms:recent-projects-changed'));
  } catch {
    // ignora indisponibilidade de storage
  }
}
