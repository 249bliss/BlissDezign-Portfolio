const fs = require('fs');
const path = require('path');

const files = [
  'index.html',
  'about.html',
  'blog.html',
  'case-study.html',
  'contact.html',
  'post.html',
  'work.html',
  'admin.html'
];

files.forEach(fileName => {
  const filePath = path.join(__dirname, '..', fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Regular expressions to target the logo spans
  const oldTextRegex1 = /<span class="logo-text">BlissDezign<\/span>/g;
  const oldTextRegex2 = /<span class="logo-text" style="[^"]+">BlissDezign<\/span>/g;
  
  let newContent = content.replace(oldTextRegex1, '<span class="logo-text">Blissdezigns</span>');
  newContent = newContent.replace(oldTextRegex2, '<span class="logo-text">Blissdezigns</span>');
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated: ${fileName}`);
  } else {
    console.log(`No match in: ${fileName}`);
  }
});
