import fs from 'fs';
import path from 'path';

const root = 'C:/Users/yosee/Documents/qr/QR-Scanning-System';

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath);
    } else if (stat.isFile()) {
      const ext = path.extname(file);
      if (['.js', '.jsx', '.md', '.json', '.html', '.css', '.example', ''].includes(ext) || file === '.env.example' || file === '.env') {
        try {
          let content = fs.readFileSync(filePath, 'utf8');
          const newContent = content
            .replace(/groq/g, 'groq')
            .replace(/Groq/g, 'Groq')
            .replace(/GROQ/g, 'GROQ');
          if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated ${filePath}`);
          }
        } catch (err) {
          // Ignore non-utf8 files
        }
      }
    }
  }
}

walk(root);

try {
  fs.renameSync(
    path.join(root, 'server/src/services/groq.js'),
    path.join(root, 'server/src/services/groq.js')
  );
  console.log('Renamed groq.js to groq.js');
} catch (e) {
  console.log('Could not rename groq.js:', e.message);
}
