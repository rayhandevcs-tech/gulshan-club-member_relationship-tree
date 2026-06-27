import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: 'aws-1-ap-southeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.txmraivnwjqlrcauvbjk',
  password: 'Rayhan&20011',
  ssl: { rejectUnauthorized: false },
});

try {
  const r = await pool.query('SELECT COUNT(*) as c FROM "Member"');
  console.log('Connected! Member count:', r.rows[0].c);
} catch (e) {
  console.error('Failed:', e.message);
} finally {
  await pool.end();
}
