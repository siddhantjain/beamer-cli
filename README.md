# beamer-cli 📊

CLI for creating LaTeX Beamer presentations with ease.

## Installation

```bash
npm install -g beamer-cli
```

**Requires:** [tectonic](https://tectonic-typesetting.github.io/) (or pdflatex/xelatex)

```bash
# Install tectonic (recommended - fast, self-contained)
curl --proto '=https' --tlsv1.2 -fsSL https://drop-sh.fullyjustified.net | sh
```

## Commands

| Command | Description |
|---------|-------------|
| `slides init [name]` | Create a new presentation |
| `slides build [file]` | Compile .tex to PDF |
| `slides watch [file]` | Watch and rebuild on changes |
| `slides add <type>` | Add slide patterns |
| `slides lint [file]` | Validate LaTeX before compiling |
| `slides from-md <file>` | Convert Markdown to Beamer |
| `slides icons <query>` | Search FontAwesome icons |
| `slides themes` | List available themes |
| `slides preview [file]` | Preview slides in terminal |
| `slides export [file]` | Export to HTML (reveal.js) |

## Quick Start

```bash
# Create new presentation
slides init my-talk --theme Berlin --color crane
cd my-talk

# Add some slides
slides add diagram
slides add code
slides add comparison

# Build PDF
slides build

# Or watch for changes
slides watch
```

## Mermaid Diagrams

Include mermaid diagrams in your markdown:

```markdown
## Architecture

\`\`\`mermaid
graph LR
  A[Input] --> B[Process]
  B --> C[Output]
\`\`\`
```

Diagrams are automatically converted to TikZ. Supports:
- `graph LR` (left-to-right)
- `graph TD` (top-down)
- Basic node labels `A[Label]`
- Arrows `-->`

## Convert Markdown to Slides

Write slides in Markdown:

```markdown
---
title: My Talk
author: Your Name
---

## Introduction

- Point one
- Point two with **bold**
- Point three with `code`

## Code Example

```python
def hello():
    print("Hello!")
```

## Data

| Metric | Value |
|--------|-------|
| Speed  | Fast  |
| Cost   | Low   |
```

Convert and build:

```bash
slides from-md talk.md
slides build talk.tex
```

## Slide Patterns

```bash
slides add code              # Code listing with syntax highlighting
slides add diagram           # TikZ flowchart
slides add columns           # Two-column layout
slides add image             # Image with caption
slides add animated          # Step-by-step bullet reveal
slides add animated-diagram  # Progressive diagram
slides add table             # Data table
slides add quote             # Quote slide
slides add split             # Image + text side by side
slides add timeline          # Project timeline
slides add comparison        # Pros/cons columns
slides add highlight         # Key takeaway callout
slides add notes             # Slide with speaker notes
```

## Lint Before Building

```bash
slides lint

# Output:
#   ✗ my-talk.tex:45 Unmatched closing brace } (brace-balance)
#   ⚠ my-talk.tex:23 Frame without title (frame-title)
#
#   1 error(s), 1 warning(s)
```

Catches:
- Missing `\begin{document}` / `\end{document}`
- Unmatched braces `{}`
- Unmatched environments (`\begin{itemize}` without `\end{itemize}`)
- Unescaped underscores outside math mode
- Frames without titles

## Icon Search

```bash
slides icons cloud

#   cloud            \faIcon{cloud}
#
# Usage in LaTeX: \faIcon{icon-name}
# Requires: \usepackage{fontawesome5}
```

## Themes

```bash
slides themes

# Presentation Themes:
#   Madrid           Professional, popular
#   Berlin           Miniframes navigation
#   Copenhagen       Blue professional
#   ...
#
# Color Themes:
#   dolphin          Light blue
#   crane            Yellow/orange
#   beaver           Gray/red
#   ...
```

## Project Structure

After `slides init`:
```
my-talk/
├── my-talk.tex      # Main presentation
└── slides.yaml      # Config (theme, engine, etc.)
```

## HTML Export (reveal.js)

Export your presentation to HTML for web viewing:

```bash
slides export                    # Export to HTML
slides export -t white           # Use white theme
slides export -o slides.html     # Custom output name
```

**Reveal.js themes:** black, white, league, beige, sky, night, serif, simple, solarized

Features:
- Speaker notes (press 'S' to view)
- Keyboard navigation
- Works in any browser
- No server required

## Terminal Preview

Preview your slides directly in the terminal:

```bash
slides preview              # Show first slide
slides preview -p 3         # Show slide 3
slides preview --all        # Thumbnail grid of all slides
```

**Requires:**
- `poppler-utils` (for pdftoppm): `apt install poppler-utils`
- A terminal image viewer: `timg`, `chafa`, or `viu`

```bash
# Install a viewer
apt install timg   # or chafa
```

## Speaker Notes

Add speaker notes in your Markdown with `Note:` or `Notes:`:

```markdown
## My Slide

Key points for the audience

Note: This is a speaker note!
- Remind them about X
- Mention the story
- Pause for questions
```

Or use `slides add notes` for a LaTeX template with notes.

### Viewing Notes

Use a presentation tool that supports Beamer notes:

```bash
# pdfpc (recommended) - shows notes on presenter screen
pdfpc my-talk.pdf

# Or enable dual-screen notes in LaTeX
\setbeameroption{show notes on second screen=right}
```

## Tips

### Animations
Use `<1->`, `<2->` etc. to reveal content step by step:
```latex
\begin{itemize}
  \item<1-> First point
  \item<2-> Second point
  \item<3-> Third point
\end{itemize}
```

### Code Blocks
Use `[fragile]` frame option for code:
```latex
\begin{frame}[fragile]{Code}
  \begin{lstlisting}[language=Python]
  def hello():
      print("hi")
  \end{lstlisting}
\end{frame}
```

### TikZ Diagrams
```latex
\begin{tikzpicture}[box/.style={draw, rounded corners}]
  \node[box] (a) {Input};
  \node[box, right=of a] (b) {Output};
  \draw[->] (a) -- (b);
\end{tikzpicture}
```

## License

MIT
