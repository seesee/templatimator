// minify-html.js
const fs = require('fs');
const { minify } = require('html-minifier-terser');

const input = fs.readFileSync('dist/index.html', 'utf8');

minify(input, {
  collapseWhitespace: true,
  removeComments: true,
  minifyCSS: true,
  minifyJS: true,
}).then((output) => {
  fs.writeFileSync('dist/index.html', output);
  console.log('HTML minified successfully');
}).catch((err) => {
  console.error('Error minifying HTML:', err);
  process.exit(1);
});
