const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) {
    const name = `${dir}/${file}`;
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else if (/\.(tsx|ts|css|html)$/.test(name)) {
      files.push(name);
    }
  }
  return files;
}

const files = getFiles('packages/web/src');

const replacements = [
  // Remove hover:underline offsets and hover underlines from links/buttons
  { regex: / hover:underline-offset-\[calc\(3\/16\*1rem\)\]/g, replace: '' },
  { regex: / underline-offset-\[calc\(3\/16\*1rem\)\]/g, replace: '' },
  { regex: / hover:decoration-\[calc\(3\/16\*1rem\)\]/g, replace: '' },
  { regex: / group-hover:decoration-\[calc\(3\/16\*1rem\)\]/g, replace: '' },
  // Be careful with hover:underline so we don't accidentally remove it from actual links, but user wants it gone for buttons.
  // We'll replace it generally as requested to remove as many custom styles as possible.
  { regex: / hover:underline(?!\w)/g, replace: '' },
  { regex: / group-hover:underline(?!\w)/g, replace: '' },
  { regex: / hover:decoration-1(?!\w)/g, replace: '' },
  { regex: / hover:text-blue-700(?!\w)/g, replace: '' },
  
  // Simplify focus-visible styling
  { regex: /focus-visible:rounded-?(?:sm|md|lg|xl|2xl|[0-9]+)? /g, replace: 'focus-visible:rounded ' },
  { regex: /focus-visible:bg-yellow-300 focus-visible:ring-\[calc\(2\/16\*1rem\)\] focus-visible:ring-yellow-300 focus-visible:outline-4 focus-visible:outline-offset-\[calc\(2\/16\*1rem\)\] focus-visible:outline-black focus-visible:outline-solid/g, replace: 'focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2' },
  { regex: /focus-visible:bg-yellow-300 focus-visible:ring-\[calc\(2\/16\*1rem\)\] focus-visible:ring-yellow-300 focus-visible:outline-4 focus-visible:outline-offset-0 focus-visible:outline-black focus-visible:outline-solid focus-visible:ring-inset/g, replace: 'focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2' },
  
  // Headless UI specific focus state
  { regex: /\[:root\[data-headlessui-focus-visible\]_&\]:bg-yellow-300 \[:root\[data-headlessui-focus-visible\]_&\]:ring-\[calc\(6\/16\*1rem\)\] \[:root\[data-headlessui-focus-visible\]_&\]:ring-yellow-300 \[:root\[data-headlessui-focus-visible\]_&\]:outline-4 \[:root\[data-headlessui-focus-visible\]_&\]:-outline-offset-4 \[:root\[data-headlessui-focus-visible\]_&\]:outline-black \[:root\[data-headlessui-focus-visible\]_&\]:outline-solid \[:root\[data-headlessui-focus-visible\]_&\]:ring-inset/g, replace: 'bg-gray-100' },
  { regex: /\[:root\[data-headlessui-focus-visible\]_&\]:bg-yellow-300 \[:root\[data-headlessui-focus-visible\]_&\]:text-gray-800 \[:root\[data-headlessui-focus-visible\]_&\]:ring-\[calc\(6\/16\*1rem\)\] \[:root\[data-headlessui-focus-visible\]_&\]:ring-yellow-300 \[:root\[data-headlessui-focus-visible\]_&\]:outline-4 \[:root\[data-headlessui-focus-visible\]_&\]:-outline-offset-4 \[:root\[data-headlessui-focus-visible\]_&\]:outline-black \[:root\[data-headlessui-focus-visible\]_&\]:outline-solid \[:root\[data-headlessui-focus-visible\]_&\]:ring-inset/g, replace: 'bg-gray-100' },
  { regex: /focus-visible:data-focus:bg-yellow-300 focus-visible:data-focus:ring-\[calc\(6\/16\*1rem\)\] focus-visible:data-focus:ring-yellow-300 focus-visible:data-focus:outline-4 focus-visible:data-focus:-outline-offset-4 focus-visible:data-focus:outline-black focus-visible:data-focus:outline-solid focus-visible:data-focus:ring-inset/g, replace: 'focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2' },
  
  // Custom text focus
  { regex: /focus-visible:bg-yellow-300 focus-visible:text-blue-700 focus-visible:ring-\[calc\(2\/16\*1rem\)\] focus-visible:ring-yellow-300 focus-visible:outline-4 focus-visible:outline-offset-\[calc\(2\/16\*1rem\)\] focus-visible:outline-black focus-visible:outline-solid/g, replace: 'focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2' },
  
  // NavSkip focus
  { regex: /focus-visible:bg-yellow-300 focus-visible:px-3 focus-visible:py-0\.5 focus-visible:ring-\[calc\(2\/16\*1rem\)\] focus-visible:ring-yellow-300 focus-visible:outline-4 focus-visible:outline-offset-\[calc\(2\/16\*1rem\)\] focus-visible:outline-black focus-visible:outline-solid/g, replace: 'focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 focus-visible:px-3 focus-visible:py-0.5' },

  // Any remaining generic yellow-300 focus styles
  { regex: /focus-visible:bg-yellow-300/g, replace: 'focus-visible:bg-gray-100' },
  
  // Multiple spaces clean up
  { regex: /  +/g, replace: ' ' }
];

let changedCount = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  for (const { regex, replace } of replacements) {
    content = content.replace(regex, replace);
  }
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
  }
}
console.log(`Updated ${changedCount} files.`);
