const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function (file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('packages/web/src/features');
let changedCount = 0;

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  const initialContent = content;

  // Remove Divider imports
  content = content.replace(/import\s+\{\s*Divider\s*\}\s*from\s*['"]@\/components\/ui\/dads\/Divider['"];?\s*\n?/g, '');

  // For GenerateTextPage.tsx
  if (file.includes('GenerateTextPage.tsx')) {
    content = content.replace(/<Divider[^>]*\/>\s*/g, '');
    content = content.replace(/<GenerateTextResult/g, '<div className="w-full mt-4 lg:mt-6"><GenerateTextResult');
    content = content.replace(/text={text}\s*\/>/g, 'text={text}\n        />\n        </div>');
  } 
  else if (file.includes('TranscribePage.tsx')) {
    content = content.replace(/<Divider[^>]*\/>\s*/g, '');
    content = content.replace(/<TranscribeResult/g, '<div className="w-full mt-4 lg:mt-6"><TranscribeResult');
    content = content.replace(/speakerMapping={speakerMapping}\s*\/>/g, 'speakerMapping={speakerMapping}\n        />\n        </div>');
  }
  else if (file.includes('ExAppPage.tsx')) {
    content = content.replace(/<Divider[^>]*\/>\s*/g, '<div className="h-6" />\n              ');
  }
  else {
    // For forms and other things, just use a spacer
    content = content.replace(/<Divider[^>]*\/>\s*/g, '<div className="h-6" />\n      ');
  }

  if (content !== initialContent) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log('Updated: ' + file);
  }
});

console.log('Total files changed: ' + changedCount);
