// build-standalone.js - Create a single, self-contained HTML file
const fs = require('fs');
const path = require('path');
const { minify: minifyHTML } = require('html-minifier-terser');
const { minify: minifyJS } = require('terser');
const CleanCSS = require('clean-css');

async function buildStandalone() {
  console.log('Building standalone HTML file...');

  // Read source files
  const htmlContent = fs.readFileSync('src/index.html', 'utf8');
  const jsContent = fs.readFileSync('src/app.js', 'utf8');
  const cssContent = fs.readFileSync('src/style.css', 'utf8');

  console.log('Read source files');

  // Minify JavaScript
  const minifiedJS = await minifyJS(jsContent, {
    module: false,
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info', 'console.debug'],
    },
    mangle: {
      toplevel: true,
    },
    format: {
      comments: false,
    },
  });

  if (minifiedJS.error) {
    throw new Error('JavaScript minification failed: ' + minifiedJS.error);
  }

  console.log(`Minified JavaScript (${jsContent.length} → ${minifiedJS.code.length} bytes)`);

  // Minify CSS
  const minifiedCSS = new CleanCSS({
    level: 2,
    returnPromise: false
  }).minify(cssContent);

  if (minifiedCSS.errors && minifiedCSS.errors.length > 0) {
    throw new Error('CSS minification failed: ' + minifiedCSS.errors.join(', '));
  }

  console.log(`Minified CSS (${cssContent.length} → ${minifiedCSS.styles.length} bytes)`);

  // Create self-contained HTML
  let standaloneHTML = htmlContent;

  // Replace CSS link with inline styles
  standaloneHTML = standaloneHTML.replace(
    /<link rel="stylesheet" href="style\.css">/,
    `<style>${minifiedCSS.styles}</style>`
  );

  // Remove favicon references for the standalone version (they won't work without separate files)
  standaloneHTML = standaloneHTML.replace(
    /<link rel="icon"[^>]*>/g,
    ''
  );

  // Add the minified JavaScript inline at the end of body
  standaloneHTML = standaloneHTML.replace(
    /<\/body>/,
    `<script>${minifiedJS.code}</script></body>`
  );

  console.log('Inlined CSS and JavaScript');

  // Minify the final HTML
  const finalHTML = await minifyHTML(standaloneHTML, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    minifyCSS: true,
    minifyJS: true,
    useShortDoctype: true,
    removeEmptyAttributes: true,
    removeOptionalTags: false, // Keep for compatibility
    caseSensitive: false,
    minifyURLs: true,
  });

  console.log(`Minified final HTML (${standaloneHTML.length} → ${finalHTML.length} bytes)`);

  // Ensure dist directory exists
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }

  // Write the standalone file
  fs.writeFileSync('dist/templatimator-standalone.html', finalHTML);

  console.log('Created dist/templatimator-standalone.html');
  console.log(`\nStandalone file size: ${Math.round(finalHTML.length / 1024)}KB`);
  console.log('This file can be opened directly in any web browser and requires no server or external files.');
}

// Run the build
buildStandalone().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
});