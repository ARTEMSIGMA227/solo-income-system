import { readFileSync, writeFileSync } from 'fs';

const fontData = readFileSync('scripts/roboto.ttf');
const base64 = fontData.toString('base64');

writeFileSync(
  'src/lib/roboto-font.ts',
  `// Auto-generated Roboto Variable TTF\nexport const ROBOTO_BASE64 = '${base64}';\n`
);

console.log('Done:', Math.round(base64.length / 1024), 'KB');