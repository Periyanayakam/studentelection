import pool from './config/db.js';

async function test() {
  try {
    const [rows] = await pool.query('SELECT c.*, e.title as election_title FROM candidates c JOIN elections e ON c.election_id = e.id ORDER BY c.id ASC');
    console.log("SUCCESS");
    console.log(rows);
  } catch (err) {
    console.log("ERROR");
    console.error(err);
  }
  process.exit(0);
}
test();
