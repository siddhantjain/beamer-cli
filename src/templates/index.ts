/**
 * LaTeX templates for Beamer presentations
 */

interface MainTemplateOptions {
  title: string;
  theme: string;
  colorTheme: string;
  aspectRatio: string;
}

const templates = {
  main: (opts: MainTemplateOptions) => `\\documentclass[aspectratio=${opts.aspectRatio}]{beamer}
\\usetheme{${opts.theme}}
\\usecolortheme{${opts.colorTheme}}

% Packages
\\usepackage{listings}
\\usepackage{tikz}
\\usepackage{fontawesome5}
\\usetikzlibrary{shapes,arrows,positioning}

% Code styling
\\lstset{
  basicstyle=\\ttfamily\\small,
  breaklines=true,
  frame=single,
  backgroundcolor=\\color{gray!10},
  keywordstyle=\\color{blue},
  commentstyle=\\color{green!60!black},
  stringstyle=\\color{orange}
}

% Title
\\title{${opts.title}}
\\author{Your Name}
\\date{\\today}

\\begin{document}

% Title slide
\\begin{frame}
  \\titlepage
\\end{frame}

% Outline
\\begin{frame}{Outline}
  \\tableofcontents
\\end{frame}

% --- Your slides here ---

\\section{Introduction}

\\begin{frame}{Welcome}
  \\begin{itemize}
    \\item First point
    \\item Second point
    \\item Third point
  \\end{itemize}
\\end{frame}

% --- End slides ---

\\begin{frame}
  \\centering
  \\Huge Questions?
\\end{frame}

\\end{document}
`,

  code: () => `
% --- Code Slide ---
\\begin{frame}[fragile]{Code Example}
  \\begin{lstlisting}[language=Python]
def hello(name):
    """Greet someone."""
    print(f"Hello, {name}!")
    return True
  \\end{lstlisting}
\\end{frame}
`,

  diagram: () => `
% --- Diagram Slide ---
\\begin{frame}{Architecture}
  \\centering
  \\begin{tikzpicture}[
    node distance=1.5cm,
    box/.style={rectangle, draw, rounded corners, minimum width=2cm, minimum height=1cm, align=center},
    arrow/.style={->, thick}
  ]
    \\node[box, fill=blue!20] (a) {Input};
    \\node[box, fill=green!20, right=of a] (b) {Process};
    \\node[box, fill=orange!20, right=of b] (c) {Output};
    
    \\draw[arrow] (a) -- (b);
    \\draw[arrow] (b) -- (c);
  \\end{tikzpicture}
\\end{frame}
`,

  columns: () => `
% --- Two Column Slide ---
\\begin{frame}{Comparison}
  \\begin{columns}
    \\begin{column}{0.5\\textwidth}
      \\textbf{Option A}
      \\begin{itemize}
        \\item Pro 1
        \\item Pro 2
        \\item Con 1
      \\end{itemize}
    \\end{column}
    \\begin{column}{0.5\\textwidth}
      \\textbf{Option B}
      \\begin{itemize}
        \\item Pro 1
        \\item Con 1
        \\item Con 2
      \\end{itemize}
    \\end{column}
  \\end{columns}
\\end{frame}
`,

  image: () => `
% --- Image Slide ---
\\begin{frame}{Visual}
  \\centering
  \\includegraphics[width=0.8\\textwidth]{image.png}
  
  \\vspace{1em}
  \\small Caption goes here
\\end{frame}
`,

  animated: () => `
% --- Animated Slide ---
\\begin{frame}{Step by Step}
  \\begin{itemize}
    \\item<1-> First, we do this
    \\item<2-> Then, we do that
    \\item<3-> Finally, we finish
  \\end{itemize}
  
  \\only<1>{\\textit{Starting out...}}
  \\only<2>{\\textit{Making progress...}}
  \\only<3>{\\textit{Done!}}
\\end{frame}
`,

  animatedDiagram: () => `
% --- Animated Diagram ---
\\begin{frame}{Building Up}
  \\centering
  \\begin{tikzpicture}[
    node distance=1.5cm,
    box/.style={rectangle, draw, rounded corners, minimum width=2cm, minimum height=1cm},
    arrow/.style={->, thick}
  ]
    \\node<1->[box, fill=blue!20] (a) {Step 1};
    \\node<2->[box, fill=green!20, right=of a] (b) {Step 2};
    \\node<3->[box, fill=orange!20, right=of b] (c) {Step 3};
    
    \\draw<2->[arrow] (a) -- (b);
    \\draw<3->[arrow] (b) -- (c);
  \\end{tikzpicture}
\\end{frame}
`,

  table: () => `
% --- Table Slide ---
\\begin{frame}{Data Overview}
  \\centering
  \\begin{tabular}{lrrr}
    \\hline
    \\textbf{Item} & \\textbf{Q1} & \\textbf{Q2} & \\textbf{Q3} \\\\
    \\hline
    Revenue  & 100 & 120 & 150 \\\\
    Costs    & 80  & 85  & 90  \\\\
    Profit   & 20  & 35  & 60  \\\\
    \\hline
  \\end{tabular}
  
  \\vspace{1em}
  \\small All figures in millions
\\end{frame}
`,

  quote: () => `
% --- Quote Slide ---
\\begin{frame}{Inspiration}
  \\centering
  \\vspace{2em}
  
  \\begin{quote}
    \\Large\\itshape
    \`\`The best way to predict the future is to invent it.''
  \\end{quote}
  
  \\vspace{1em}
  \\hfill --- Alan Kay
\\end{frame}
`,

  split: () => `
% --- Split Slide (Image + Text) ---
\\begin{frame}{Feature Highlight}
  \\begin{columns}
    \\begin{column}{0.45\\textwidth}
      \\centering
      % \\includegraphics[width=\\textwidth]{image.png}
      \\fbox{\\parbox{0.8\\textwidth}{\\centering\\vspace{2cm}Image Here\\vspace{2cm}}}
    \\end{column}
    \\begin{column}{0.55\\textwidth}
      \\textbf{Key Points}
      \\begin{itemize}
        \\item First benefit
        \\item Second benefit
        \\item Third benefit
      \\end{itemize}
      
      \\vspace{1em}
      \\small Additional context goes here.
    \\end{column}
  \\end{columns}
\\end{frame}
`,

  timeline: () => `
% --- Timeline Slide ---
\\begin{frame}{Project Timeline}
  \\centering
  \\begin{tikzpicture}[
    node distance=0.5cm,
    event/.style={rectangle, draw, rounded corners, fill=blue!20, minimum width=2cm, minimum height=0.8cm, font=\\small},
    arrow/.style={->, thick, gray}
  ]
    \\node[event] (e1) {Q1: Planning};
    \\node[event, right=of e1] (e2) {Q2: Development};
    \\node[event, right=of e2] (e3) {Q3: Testing};
    \\node[event, right=of e3] (e4) {Q4: Launch};
    
    \\draw[arrow] (e1) -- (e2);
    \\draw[arrow] (e2) -- (e3);
    \\draw[arrow] (e3) -- (e4);
  \\end{tikzpicture}
  
  \\vspace{1em}
  \\begin{itemize}
    \\item \\textbf{Q1:} Requirements and design
    \\item \\textbf{Q2:} Core implementation
    \\item \\textbf{Q3:} QA and bug fixes
    \\item \\textbf{Q4:} Production release
  \\end{itemize}
\\end{frame}
`,

  comparison: () => `
% --- Comparison Slide (Pros/Cons) ---
\\begin{frame}{Solution Comparison}
  \\begin{columns}
    \\begin{column}{0.48\\textwidth}
      \\centering
      \\textbf{\\color{green!60!black} Pros}
      \\begin{itemize}
        \\item[\\color{green!60!black}\\faIcon{check}] Fast performance
        \\item[\\color{green!60!black}\\faIcon{check}] Easy to use
        \\item[\\color{green!60!black}\\faIcon{check}] Low cost
      \\end{itemize}
    \\end{column}
    \\begin{column}{0.48\\textwidth}
      \\centering
      \\textbf{\\color{red!60!black} Cons}
      \\begin{itemize}
        \\item[\\color{red!60!black}\\faIcon{times}] Limited features
        \\item[\\color{red!60!black}\\faIcon{times}] Learning curve
        \\item[\\color{red!60!black}\\faIcon{times}] No mobile app
      \\end{itemize}
    \\end{column}
  \\end{columns}
\\end{frame}
`,

  highlight: () => `
% --- Highlight/Callout Slide ---
\\begin{frame}{Key Takeaway}
  \\centering
  \\vspace{2em}
  
  \\begin{beamercolorbox}[sep=1em,center,rounded=true,shadow=true]{block title}
    \\Large\\bfseries
    The most important thing to remember
  \\end{beamercolorbox}
  
  \\vspace{2em}
  
  \\begin{itemize}
    \\item Supporting point one
    \\item Supporting point two
    \\item Supporting point three
  \\end{itemize}
\\end{frame}
`,
};

export type TemplateName = keyof typeof templates;

export function getTemplate(name: 'main', opts: MainTemplateOptions): string;
export function getTemplate(name: Exclude<TemplateName, 'main'>): string;
export function getTemplate(name: TemplateName, opts?: MainTemplateOptions): string {
  if (name === 'main') {
    return templates.main(opts!);
  }
  return (templates[name] as () => string)();
}

export function listTemplates(): TemplateName[] {
  return Object.keys(templates) as TemplateName[];
}
