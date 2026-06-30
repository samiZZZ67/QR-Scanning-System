const {DatabaseSync} = require('node:sqlite');
const db = new DatabaseSync(':memory:');
db.exec('CREATE TABLE test(v TEXT); INSERT INTO test(v) VALUES (\\'a\\');');
const rows = db.prepare('SELECT rowid FROM test').all();
console.log(rows);
const row = rows[0];
try {
  db.prepare('UPDATE test SET v = ? WHERE rowid = ?').run('b', row.rowid);
  console.log('Update success');
} catch (err) {
  console.error('Update error:', err);
}
