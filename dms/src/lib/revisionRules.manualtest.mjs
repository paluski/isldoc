import { getNextRevisionCode } from './revisionRules.js';

const cases = [
  [null, {}, '0A'],
  ['0A', { isEmission: false }, '0B'],
  ['0B', { isEmission: false }, '0C'],
  ['0C', { isEmission: true }, '1A'],
  ['1A', { isEmission: false }, '1B'],
  ['1B', { isEmission: true }, '2A'],
  ['2A', { isEmission: true }, '3A'],
  ['25Z', { isEmission: false }, '25AA']
];

let failed = 0;
for (const [current, opts, expected] of cases) {
  const result = getNextRevisionCode(current, opts, {});
  const ok = result === expected;
  if (!ok) failed++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} getNextRevisionCode(${JSON.stringify(current)}, ${JSON.stringify(opts)}) = ${result} (esperado ${expected})`);
}

console.log(failed === 0 ? '\nTodos os casos passaram.' : `\n${failed} caso(s) falharam.`);
process.exit(failed === 0 ? 0 : 1);
