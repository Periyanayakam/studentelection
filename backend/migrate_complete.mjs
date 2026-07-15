import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  console.log('Connecting to MySQL...');
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST || '127.0.0.1',
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'root',
    multipleStatements: true,
  });

  const sqlPath = path.resolve(__dirname, '../database/online_voting.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  console.log('Running complete database rebuild and seeding...');
  try {
    await conn.query(sql);
    console.log('✨ Database rebuilt and seeded successfully!');
  } catch (e) {
    console.error('Database migration error:', e.message);
  } finally {
    await conn.end();
  }
}

run();
