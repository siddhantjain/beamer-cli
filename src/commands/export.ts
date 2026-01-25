/**
 * slides export - Export presentation to HTML (reveal.js)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import chalk from 'chalk';

interface ExportOptions {
  format: string;
  output?: string;
  theme?: string;
}

interface Slide {
  title: string;
  content: string;
  notes?: string;
}

/**
 * Parse LaTeX file to extract slides
 */
function parseLatex(content: string): { meta: Record<string, string>; slides: Slide[] } {
  const meta: Record<string, string> = {};
  const slides: Slide[] = [];

  // Extract title
  const titleMatch = content.match(/\\title\{([^}]+)\}/);
  if (titleMatch) meta.title = titleMatch[1];

  // Extract author
  const authorMatch = content.match(/\\author\{([^}]+)\}/);
  if (authorMatch) meta.author = authorMatch[1];

  // Extract frames
  const frameRegex = /\\begin\{frame\}(?:\[.*?\])?\{([^}]*)\}([\s\S]*?)\\end\{frame\}/g;
  let match;

  while ((match = frameRegex.exec(content)) !== null) {
    const title = match[1] || '';
    const frameContent = match[2];

    // Convert LaTeX content to HTML
    const html = latexToHtml(frameContent);

    // Check for notes
    const noteMatch = content.slice(match.index + match[0].length).match(/^[\s\n]*\\note\{([\s\S]*?)\}/);
    const notes = noteMatch ? noteMatch[1].replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>') : undefined;

    slides.push({ title, content: html, notes });
  }

  return { meta, slides };
}

/**
 * Convert LaTeX content to HTML
 */
function latexToHtml(latex: string): string {
  let html = latex;

  // Remove fragile options and other frame options
  html = html.replace(/\[fragile\]/g, '');

  // Convert itemize/enumerate to ul/ol
  html = html.replace(/\\begin\{itemize\}/g, '<ul>');
  html = html.replace(/\\end\{itemize\}/g, '</ul>');
  html = html.replace(/\\begin\{enumerate\}/g, '<ol>');
  html = html.replace(/\\end\{enumerate\}/g, '</ol>');
  html = html.replace(/\\item(?:\[.*?\])?\s*/g, '<li>');

  // Close li tags (rough heuristic)
  html = html.replace(/<li>([^<]*?)(?=<li>|<\/ul>|<\/ol>|$)/g, '<li>$1</li>');

  // Convert text formatting
  html = html.replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>');
  html = html.replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>');
  html = html.replace(/\\texttt\{([^}]+)\}/g, '<code>$1</code>');
  html = html.replace(/\\emph\{([^}]+)\}/g, '<em>$1</em>');

  // Convert code blocks
  html = html.replace(/\\begin\{lstlisting\}(?:\[.*?\])?([\s\S]*?)\\end\{lstlisting\}/g, 
    '<pre><code>$1</code></pre>');

  // Convert centering
  html = html.replace(/\\centering/g, '');
  html = html.replace(/\\Huge\s*/g, '');
  html = html.replace(/\\Large\s*/g, '');

  // Remove TikZ (can't convert easily)
  html = html.replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g, 
    '<p><em>[Diagram - see PDF version]</em></p>');

  // Remove other LaTeX commands
  html = html.replace(/\\[a-zA-Z]+\{[^}]*\}/g, '');
  html = html.replace(/\\[a-zA-Z]+/g, '');

  // Clean up whitespace
  html = html.replace(/\n\s*\n/g, '\n');
  html = html.trim();

  return html;
}

/**
 * Generate reveal.js HTML
 */
function generateRevealHtml(meta: Record<string, string>, slides: Slide[], theme: string): string {
  const title = meta.title || 'Presentation';
  const author = meta.author || '';

  const slidesHtml = slides.map(slide => {
    const notesHtml = slide.notes ? `<aside class="notes">${slide.notes}</aside>` : '';
    return `
        <section>
          <h2>${slide.title}</h2>
          ${slide.content}
          ${notesHtml}
        </section>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4/dist/theme/${theme}.css">
  <style>
    .reveal pre { font-size: 0.7em; }
    .reveal code { background: rgba(0,0,0,0.1); padding: 0.2em 0.4em; border-radius: 4px; }
    .reveal pre code { background: none; padding: 0; }
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
      <!-- Title slide -->
      <section>
        <h1>${title}</h1>
        ${author ? `<p>${author}</p>` : ''}
      </section>
${slidesHtml}
      <!-- End slide -->
      <section>
        <h1>Questions?</h1>
      </section>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@4/dist/reveal.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@4/plugin/notes/notes.js"></script>
  <script>
    Reveal.initialize({
      hash: true,
      plugins: [RevealNotes]
    });
  </script>
</body>
</html>`;
}

/**
 * Find source file
 */
function findSourceFile(file?: string): string {
  if (file) {
    if (!existsSync(file)) {
      console.error(chalk.red(`Error: File '${file}' not found`));
      process.exit(1);
    }
    return file;
  }

  // Look for .tex or .md file
  const dirName = basename(process.cwd());
  const candidates = [`${dirName}.tex`, 'main.tex', `${dirName}.md`];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  console.error(chalk.red('Error: No .tex or .md file found'));
  process.exit(1);
}

export function exportPresentation(file: string | undefined, options: ExportOptions): void {
  const format = options.format?.toLowerCase() || 'html';

  if (format !== 'html') {
    console.error(chalk.red(`Unsupported format: ${format}`));
    console.error(chalk.yellow('Currently supported: html'));
    process.exit(1);
  }

  const sourceFile = findSourceFile(file);
  const content = readFileSync(sourceFile, 'utf-8');

  console.log(chalk.blue(`Exporting ${sourceFile} to HTML...`));

  // Parse source
  const { meta, slides } = parseLatex(content);

  if (slides.length === 0) {
    console.error(chalk.red('No slides found in source file'));
    process.exit(1);
  }

  console.log(chalk.gray(`  Found ${slides.length} slides`));

  // Generate HTML
  const theme = options.theme || 'black';
  const html = generateRevealHtml(meta, slides, theme);

  // Write output
  const outputFile = options.output || sourceFile.replace(/\.(tex|md)$/, '.html');
  writeFileSync(outputFile, html);

  console.log(chalk.green(`✓ Created ${outputFile}`));
  console.log(chalk.gray(`  Open in browser to view`));
  console.log(chalk.gray(`  Speaker notes: Press 'S' in presentation`));
}
