/**
 * Calcula o gap entre o que é exigido (conjunto de documentos do projeto) e o que
 * já foi vinculado/emitido, de forma pura (sem I/O) para facilitar testes.
 *
 * @param {Array<{document_type_id: string, document_types?: {name: string}}>} requiredItems
 * @param {Array<{document_type_id: string, status: string}>} linkedDocuments
 */
export function computeApplicabilityGaps(requiredItems, linkedDocuments) {
  const linkedByType = new Map();
  (linkedDocuments ?? []).forEach((d) => {
    if (!linkedByType.has(d.document_type_id)) linkedByType.set(d.document_type_id, d);
  });

  const missing = [];
  const pending = [];

  (requiredItems ?? []).forEach((item) => {
    const linked = linkedByType.get(item.document_type_id);
    if (!linked) {
      missing.push(item);
    } else if (linked.status !== 'emitido') {
      pending.push({ ...item, status: linked.status });
    }
  });

  return {
    missing,
    pending,
    requiredCount: requiredItems?.length ?? 0,
    gapCount: missing.length + pending.length
  };
}
