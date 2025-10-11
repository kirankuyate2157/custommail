import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ✅ ES Modules compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const modelsDir = path.join(__dirname, 'models');
const schemaFile = path.join(__dirname, 'schema.prisma');

// Base schema
let schemaContent = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
`;

// Merge all model files
fs.readdirSync(modelsDir)
  .filter(file => file.endsWith('.prisma'))
  .forEach(file => {
    const content = fs.readFileSync(path.join(modelsDir, file), 'utf8');
    schemaContent += '\n' + content + '\n';
  });

// Write schema.prisma
fs.writeFileSync(schemaFile, schemaContent);

console.log('✅ schema.prisma generated with all models!');
