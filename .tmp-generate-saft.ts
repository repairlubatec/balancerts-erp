import { buildSaftAoXml } from './server/reports';
import { writeFileSync } from 'node:fs';
const xml = buildSaftAoXml({
  companyName: 'Empresa Teste', nif: '5001121871', address: 'Rua Teste', municipality: 'Lubango', province: 'Huíla', functionalCurrency: 'AOA',
  periodStart: new Date('2025-01-01T00:00:00Z'), periodEnd: new Date('2025-12-31T00:00:00Z'),
  accounts: [{ id: 1, code: '11', description: 'Caixa', postable: true }, { id: 2, code: '71', description: 'Prestação de serviços', postable: true }],
  journalEntries: [{ id: 1, transactionDate: new Date('2025-01-01T00:00:00Z'), description: 'Teste', lines: [{ accountCode: '11', debit: 100, credit: 0 }, { accountCode: '71', debit: 0, credit: 100 }] }],
  sourceDocuments: [{ id: 1, documentNumber: 'FT S001/1', documentType: 'FT', status: 'ISSUED', issueDate: new Date('2025-01-01T00:00:00Z'), customerName: 'C1', netAmount: 100, taxAmount: 0, totalAmount: 100, ivaRegime: 'EXCLUSAO' }],
});
writeFileSync('/tmp/saft-current.xml', xml);
console.log(xml);
