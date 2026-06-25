import { computeApplicabilityGaps } from './applicability.js';

const required = [
  { document_type_id: 'a', document_types: { name: 'Anexo 1' } },
  { document_type_id: 'b', document_types: { name: 'Anexo 2' } },
  { document_type_id: 'c', document_types: { name: 'Anexo 3' } }
];

const linked = [
  { document_type_id: 'a', status: 'emitido' },
  { document_type_id: 'b', status: 'em_revisao' }
];

const result = computeApplicabilityGaps(required, linked);

const checks = [
  ['gapCount === 2', result.gapCount === 2],
  ['missing tem 1 item (c)', result.missing.length === 1 && result.missing[0].document_type_id === 'c'],
  ['pending tem 1 item (b)', result.pending.length === 1 && result.pending[0].document_type_id === 'b'],
  ['requiredCount === 3', result.requiredCount === 3]
];

let failed = 0;
checks.forEach(([label, ok]) => {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}`);
  if (!ok) failed++;
});

console.log(failed === 0 ? '\nTodos os casos passaram.' : `\n${failed} caso(s) falharam.`);
process.exit(failed === 0 ? 0 : 1);
