/**
 * slides from-md - Convert Markdown to Beamer
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import chalk from 'chalk';

interface FromMdOptions {
  output?: string;
  theme: string;
  color: string;
}

/**
 * Check if mmdc (mermaid-cli) is available
 */
function hasMermaidCli(): boolean {
  try {
    execSync('mmdc --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert mermaid diagram to TikZ (basic graph LR/TD support)
 */
function mermaidToTikz(mermaid: string): string {
  const lines = mermaid.trim().split('\n');
  const firstLine = lines[0]?.trim() ?? '';

  // Detect graph direction
  const isLR = firstLine.includes('LR') || firstLine.includes('-->');
  const direction = isLR ? 'right' : 'below';

  // Parse nodes and edges
  const nodes: Map<string, string> = new Map();
  const edges: Array<[string, string, string]> = [];

  for (const line of lines.slice(1)) {
    // Match: A[Label] --> B[Label]
    const edgeMatch = line.match(/(\w+)(?:\[([^\]]+)\])?\s*-->\s*(\w+)(?:\[([^\]]+)\])?/);
    if (edgeMatch) {
      const [, fromId, fromLabel, toId, toLabel] = edgeMatch;
      if (fromLabel) nodes.set(fromId, fromLabel);
      if (toLabel) nodes.set(toId, toLabel);
      if (!nodes.has(fromId)) nodes.set(fromId, fromId);
      if (!nodes.has(toId)) nodes.set(toId, toId);
      edges.push([fromId, toId, '']);
      continue;
    }

    // Match: A[Label]
    const nodeMatch = line.match(/(\w+)\[([^\]]+)\]/);
    if (nodeMatch) {
      nodes.set(nodeMatch[1], nodeMatch[2]);
    }
  }

  if (nodes.size === 0) {
    return '% Could not parse mermaid diagram\n';
  }

  // Generate TikZ
  let tikz = '\\begin{tikzpicture}[node distance=2cm, auto,\n';
  tikz += '  box/.style={draw, rounded corners, minimum width=2cm, minimum height=0.8cm}]\n';

  // Place nodes
  let prevNode = '';
  for (const [id, label] of nodes) {
    if (prevNode === '') {
      tikz += `  \\node[box] (${id}) {${label}};\n`;
    } else {
      tikz += `  \\node[box, ${direction}=of ${prevNode}] (${id}) {${label}};\n`;
    }
    prevNode = id;
  }

  // Draw edges
  for (const [from, to] of edges) {
    tikz += `  \\draw[->] (${from}) -- (${to});\n`;
  }

  tikz += '\\end{tikzpicture}';
  return tikz;
}

let mermaidWarningShown = false;

interface Slide {
  title: string;
  content: string[];
  notes?: string[];
}

/**
 * Parse markdown into slides
 * Uses ## for slide titles, --- for breaks
 */
function parseMarkdown(md: string): { meta: Record<string, string>; slides: Slide[] } {
  const lines = md.split('\n');
  const slides: Slide[] = [];
  const meta: Record<string, string> = {};
  
  let currentSlide: Slide | null = null;
  let inFrontmatter = false;
  let inCodeBlock = false;
  let inNotes = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Frontmatter parsing
    if (i === 0 && line === '---') {
      inFrontmatter = true;
      continue;
    }
    if (inFrontmatter) {
      if (line === '---') {
        inFrontmatter = false;
        continue;
      }
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        meta[match[1]] = match[2];
      }
      continue;
    }

    // Track code blocks
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
    }

    // Slide break
    if (!inCodeBlock && line === '---') {
      if (currentSlide) {
        slides.push(currentSlide);
      }
      currentSlide = null;
      inNotes = false;
      continue;
    }

    // Speaker notes
    if (line.startsWith('Note:') || line.startsWith('Notes:')) {
      inNotes = true;
      continue;
    }

    // New slide from ## header
    if (!inCodeBlock && line.startsWith('## ')) {
      if (currentSlide) {
        slides.push(currentSlide);
      }
      currentSlide = {
        title: line.slice(3).trim(),
        content: [],
        notes: [],
      };
      inNotes = false;
      continue;
    }

    // # header = title slide
    if (!inCodeBlock && line.startsWith('# ') && !line.startsWith('## ')) {
      meta['title'] = meta['title'] ?? line.slice(2).trim();
      continue;
    }

    // Add to current slide
    if (currentSlide) {
      if (inNotes) {
        currentSlide.notes?.push(line);
      } else {
        currentSlide.content.push(line);
      }
    }
  }

  // Don't forget last slide
  if (currentSlide) {
    slides.push(currentSlide);
  }

  return { meta, slides };
}

/**
 * Convert markdown content to LaTeX
 */
function mdToLatex(lines: string[]): string {
  const result: string[] = [];
  let inList: 'itemize' | 'enumerate' | null = null;
  let inCodeBlock = false;
  let codeLanguage = '';
  let codeLines: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  for (const line of lines) {
    // Table detection
    if (line.includes('|') && line.trim().startsWith('|')) {
      // Skip separator line (|---|---|)
      if (line.match(/^\|[\s\-:]+\|/)) {
        continue;
      }
      
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      
      // Parse table row
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      // End of table
      inTable = false;
      result.push(renderTable(tableRows));
      tableRows = [];
    }
    // Code blocks
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim() || 'text';
        codeLines = [];
      } else {
        inCodeBlock = false;
        // Output code block without blank lines at start/end
        const trimmedCode = codeLines.join('\n').trim();
        if (trimmedCode) {
          // Handle mermaid diagrams
          if (codeLanguage === 'mermaid') {
            if (!mermaidWarningShown && !hasMermaidCli()) {
              console.log(chalk.yellow('  Note: Install mmdc for better mermaid rendering: npm i -g @mermaid-js/mermaid-cli'));
              mermaidWarningShown = true;
            }
            // Convert mermaid to TikZ
            const tikz = mermaidToTikz(trimmedCode);
            result.push('\\centering');
            result.push(tikz);
          } else {
            result.push(`\\begin{lstlisting}[language=${codeLanguage}]`);
            result.push(trimmedCode);
            result.push('\\end{lstlisting}');
          }
        }
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      if (inList) {
        result.push(`\\end{${inList}}`);
        inList = null;
      }
      result.push('');
      continue;
    }

    // List items
    if (line.match(/^[\s]*[-*]\s/)) {
      if (inList !== 'itemize') {
        if (inList) result.push(`\\end{${inList}}`);
        result.push('\\begin{itemize}');
        inList = 'itemize';
      }
      const text = line.replace(/^[\s]*[-*]\s/, '').trim();
      result.push(`  \\item ${formatInlineMarkdown(escapeLatex(text))}`);
      continue;
    }

    // Numbered list
    if (line.match(/^[\s]*\d+\.\s/)) {
      if (inList !== 'enumerate') {
        if (inList) result.push(`\\end{${inList}}`);
        result.push('\\begin{enumerate}');
        inList = 'enumerate';
      }
      const text = line.replace(/^[\s]*\d+\.\s/, '').trim();
      result.push(`  \\item ${formatInlineMarkdown(escapeLatex(text))}`);
      continue;
    }

    // Close list if we hit regular text
    if (inList) {
      result.push(`\\end{${inList}}`);
      inList = null;
    }

    // Subheadings (### and ####)
    if (line.startsWith('#### ')) {
      const heading = line.slice(5).trim();
      result.push(`\\textbf{${escapeLatex(heading)}}`);
      result.push('');
      continue;
    }
    if (line.startsWith('### ')) {
      const heading = line.slice(4).trim();
      result.push(`\\textbf{\\large ${escapeLatex(heading)}}`);
      result.push('');
      continue;
    }

    // Regular text
    result.push(formatInlineMarkdown(escapeLatex(line)));
  }

  // Close any open list
  if (inList) {
    result.push(`\\end{${inList}}`);
  }
  
  // Close any open table
  if (inTable && tableRows.length > 0) {
    result.push(renderTable(tableRows));
  }

  return result.join('\n');
}

/**
 * Format inline markdown (bold, italic, code)
 */
function formatInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '\\textbf{$1}')
    .replace(/\*(.+?)\*/g, '\\textit{$1}')
    .replace(/`(.+?)`/g, '\\texttt{$1}');
}

/**
 * Render a markdown table as LaTeX
 */
function renderTable(rows: string[][]): string {
  if (rows.length === 0) return '';
  
  const numCols = rows[0].length;
  const colSpec = 'l'.repeat(numCols);
  
  const lines: string[] = [];
  lines.push('\\begin{center}');
  lines.push(`\\begin{tabular}{${colSpec}}`);
  lines.push('\\toprule');
  
  // Header row
  if (rows.length > 0) {
    const header = rows[0].map(c => `\\textbf{${formatInlineMarkdown(escapeLatex(c))}}`).join(' & ');
    lines.push(`${header} \\\\`);
    lines.push('\\midrule');
  }
  
  // Data rows - now with inline markdown support!
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].map(c => formatInlineMarkdown(escapeLatex(c))).join(' & ');
    lines.push(`${row} \\\\`);
  }
  
  lines.push('\\bottomrule');
  lines.push('\\end{tabular}');
  lines.push('\\end{center}');
  
  return lines.join('\n');
}

/**
 * Common emoji to text/symbol mappings for LaTeX
 */
const emojiMap: Record<string, string> = {
  '✅': '[OK]',
  '❌': '[X]',
  '⭐': '*',
  '🔥': '[!]',
  '💡': '[i]',
  '⚠️': '[!]',
  '📍': '[>]',
  '🎉': '',
  '🐙': '',
  '✨': '',
  '🚀': '[>]',
  '💰': '[$]',
  '📧': '[email]',
  '📅': '[cal]',
  '🏆': '[#1]',
  '👍': '[+]',
  '👎': '[-]',
  '❤️': '[<3]',
  '🌤️': '',
  '☀️': '',
  '⛅': '',
  '🔴': '[!]',
  '🟡': '[~]',
  '🟢': '[OK]',
  '🔧': '',
  '📋': '',
  '🛒': '',
  '🚗': '',
  '🥾': '',
  '🌲': '',
  '🏠': '',
  '👨‍👩‍👧‍👧': '',
  '🇺🇸': 'US',
  '🇮🇳': 'IN',
};

/**
 * Strip or convert emojis to LaTeX-safe text
 */
function handleEmojis(text: string): string {
  // First, replace known emojis with their mappings
  for (const [emoji, replacement] of Object.entries(emojiMap)) {
    text = text.replaceAll(emoji, replacement);
  }
  
  // Then strip any remaining emojis (Unicode emoji ranges)
  // This regex matches most common emoji ranges
  text = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '');
  
  return text;
}

function escapeLatex(text: string): string {
  // Handle emojis first
  text = handleEmojis(text);
  
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/_/g, '\\_')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
    // Undo escaping for LaTeX commands we just added
    .replace(/\\textbf\\_\{/g, '\\textbf{')
    .replace(/\\textit\\_\{/g, '\\textit{')
    .replace(/\\texttt\\_\{/g, '\\texttt{');
}

function generateLatex(meta: Record<string, string>, slides: Slide[], options: FromMdOptions): string {
  const title = meta['title'] ?? 'Presentation';
  const author = meta['author'] ?? '';
  const date = meta['date'] ?? '\\today';
  const theme = meta['theme'] ?? options.theme;
  const colorTheme = meta['colorTheme'] ?? options.color;
  
  // Check if any slides have speaker notes
  const hasNotes = slides.some(s => s.notes && s.notes.length > 0 && s.notes.some(n => n.trim()));

  let latex = `\\documentclass[aspectratio=169]{beamer}
\\usetheme{${theme}}
\\usecolortheme{${colorTheme}}
${hasNotes ? '\\setbeameroption{show notes on second screen=right}' : ''}

\\usepackage{listings}
\\usepackage{tikz}
\\usepackage{booktabs}
\\usetikzlibrary{shapes,arrows,positioning}

\\lstset{
  basicstyle=\\ttfamily\\small,
  breaklines=true,
  frame=single,
  backgroundcolor=\\color{gray!10}
}

\\title{${escapeLatex(title)}}
\\author{${escapeLatex(author)}}
\\date{${date}}

\\begin{document}

\\begin{frame}
  \\titlepage
\\end{frame}

`;

  for (const slide of slides) {
    const content = mdToLatex(slide.content);
    // Use [fragile] if slide contains code
    const hasCode = content.includes('\\begin{lstlisting}');
    const frameOpt = hasCode ? '[fragile]' : '';
    
    latex += `\\begin{frame}${frameOpt}{${escapeLatex(slide.title)}}\n`;
    latex += content;
    latex += '\n\\end{frame}\n';
    
    // Add speaker notes if present
    if (slide.notes && slide.notes.length > 0) {
      const notesContent = slide.notes
        .filter(n => n.trim())
        .map(n => escapeLatex(n))
        .join('\n');
      if (notesContent.trim()) {
        latex += `\\note{${notesContent}}\n`;
      }
    }
    latex += '\n';
  }

  latex += `\\begin{frame}
  \\centering
  \\Huge Questions?
\\end{frame}

\\end{document}
`;

  return latex;
}

export function fromMd(file: string, options: FromMdOptions): void {
  if (!existsSync(file)) {
    console.error(chalk.red(`Error: File '${file}' not found`));
    process.exit(1);
  }

  console.log(chalk.blue(`Converting ${file} to Beamer...`));

  const md = readFileSync(file, 'utf-8');
  const { meta, slides } = parseMarkdown(md);

  console.log(chalk.gray(`  Found ${slides.length} slides`));

  const latex = generateLatex(meta, slides, options);

  const outputFile = options.output ?? file.replace(/\.md$/, '.tex');
  writeFileSync(outputFile, latex);

  console.log(chalk.green(`✓ Created ${outputFile}`));
  console.log(chalk.gray('  Run `slides build` to compile'));
}
