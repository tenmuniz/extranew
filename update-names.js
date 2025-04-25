import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar os dados atuais
const personnelPath = path.join(__dirname, 'data', 'personnel.json');
const personnel = JSON.parse(fs.readFileSync(personnelPath, 'utf8'));

// Percorrer cada militar e remover os termos PM e QOPM dos nomes
const updatedPersonnel = personnel.map(person => {
  // Remover os termos PM e QOPM
  const name = person.name
    .replace(/ PM /g, ' ')
    .replace(/ QOPM /g, ' ')
    .replace(/^PM /, '')
    .replace(/ PM$/, '')
    .replace(/^QOPM /, '')
    .replace(/ QOPM$/, '')
    // Remover espaços duplos que possam ter ficado
    .replace(/\s+/g, ' ')
    .trim();
  
  return { ...person, name };
});

// Salvar os dados atualizados
fs.writeFileSync(personnelPath, JSON.stringify(updatedPersonnel, null, 2));

console.log(`Nomes atualizados! Removidos termos "PM" e "QOPM" de ${personnel.length} registros.`);