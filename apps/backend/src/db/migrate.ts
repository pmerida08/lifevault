import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from './client.js';

async function migrate() {
  const files = ['001_initial.sql', '002_seed.sql'];

  for (const file of files) {
    const sql = readFileSync(join(__dirname, 'migrations', file), 'utf-8');
    console.log(`Running ${file}...`);
    await db.query(sql);
    console.log(`✓ ${file}`);
  }

  await db.end();
  console.log('Migration complete.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
