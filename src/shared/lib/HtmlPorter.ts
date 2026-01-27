import { SavedLesson } from "@shared/types";

/**
 * Elite Porter Core
 * Generates standalone, premium HTML lessons with interactive scientific rendering.
 * Phase 27: Porter Pro Upgrade (SVGs, TOC, and Interactive Quiz)
 */
export class HtmlPorter {
    private static readonly ICONS = {
        elite: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="icon-brand"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>`,
        subject: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
        calendar: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
        pitfall: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
        quiz: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
        print: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>`,
        chevronDown: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
        link: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
        globe: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`
    };

    public static generateEliteHtml(lesson: SavedLesson): string {
        const title = lesson.title || "Elite Les";
        const subject = lesson.subject || "VWO Elite";
        const date = new Date(lesson.createdAt || Date.now()).toLocaleDateString();

        const sectionsHtml = lesson.sections.map((section, idx) => `
      <div class="lesson-section" id="section-${idx}">
        <h2 class="section-title">${section.heading}</h2>
        <div class="section-content">
          ${this.formatMarkdownToHtml(section.content)}
        </div>
        ${section.examples ? `
          <div class="examples-box">
            <p class="examples-label">Praktijk Uitwerking:</p>
            <ul>
              ${section.examples.map(ex => `<li>${this.formatMarkdownToHtml(ex)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `).join('');

        const pitfallsHtml = lesson.pitfalls && lesson.pitfalls.length > 0 ? `
      <div class="pitfalls-container" id="pitfalls">
        <h2 class="pitfalls-title">${this.ICONS.pitfall} Valkuilen & Cruciale Checks</h2>
        <ul class="pitfalls-list">
          ${lesson.pitfalls.map(p => `<li>${this.formatMarkdownToHtml(p)}</li>`).join('')}
        </ul>
      </div>
    ` : '';

        const connectionsHtml = (lesson.subjectConnections || lesson.crossCurricularConnections) ? `
      <div class="connections-wrapper" id="synergy">
        <div class="synergy-header">
           <h2 class="synergy-main-title">Synergie & Context</h2>
        </div>
        <div class="connections-grid">
          ${lesson.subjectConnections && lesson.subjectConnections.length > 0 ? `
            <div class="connection-box subject">
              <h3 class="connection-title">${this.ICONS.link} Vakinhoudelijke Samenhang</h3>
              <ul class="connection-list">
                ${lesson.subjectConnections.map(c => `<li>${this.formatMarkdownToHtml(c)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${lesson.crossCurricularConnections && lesson.crossCurricularConnections.length > 0 ? `
            <div class="connection-box cross">
              <h3 class="connection-title">${this.ICONS.globe} Interdisciplinaire Raakvlakken</h3>
              <ul class="connection-list">
                ${lesson.crossCurricularConnections.map(c => `<li>${this.formatMarkdownToHtml(c)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      </div>
    ` : '';

        const quizHtml = lesson.quiz && lesson.quiz.length > 0 ? `
      <div class="quiz-container" id="quiz">
        <h2 class="quiz-title">${this.ICONS.quiz} Interactieve Kennisquiz</h2>
        ${lesson.quiz.map((q, idx) => `
          <div class="quiz-question">
            <div class="question-header">
                <span class="question-number">${idx + 1}</span>
                <p class="question-text">${this.formatMarkdownToHtml(q.text || (q as { text?: string; question?: string }).question || "")}</p>
            </div>
            <ul class="question-options">
              ${q.options?.map((opt, oIdx) => `
                <li class="${oIdx === q.correctAnswerIndex ? 'correct-answer-hint' : ''}">
                  <span class="option-label">${String.fromCharCode(65 + oIdx)}</span>
                  <span>${this.formatMarkdownToHtml(opt)}</span>
                </li>
              `).join('')}
            </ul>
            <div class="quiz-actions">
                <button class="reveal-btn" onclick="toggleExplanation(this)">${this.ICONS.chevronDown} Toon Uitleg & Correct Antwoord</button>
            </div>
            <div class="explanation-box hidden">
              <p class="correct-marker">Correct Antwoord: ${String.fromCharCode(65 + (q.correctAnswerIndex ?? 0))}</p>
              <div class="explanation-text">${this.formatMarkdownToHtml(q.explanation || "")}</div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : '';

        const tocHtml = `
      <nav class="toc">
        <p class="toc-label">Navigator</p>
        <ul>
          ${lesson.sections.map((s, idx) => `<li><a href="#section-${idx}">${s.heading}</a></li>`).join('')}
          ${lesson.pitfalls ? '<li><a href="#pitfalls">Valkuilen</a></li>' : ''}
          ${(lesson.subjectConnections || lesson.crossCurricularConnections) ? '<li><a href="#synergy">Synergie</a></li>' : ''}
          ${lesson.quiz ? '<li><a href="#quiz">Kennisquiz</a></li>' : ''}
        </ul>
        <button class="print-btn" onclick="window.print()">${this.ICONS.print} Export naar PDF</button>
      </nav>
    `;

        return `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | VWO Elite</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;0,800;1,400&family=Outfit:wght@400;700;900&display=swap" rel="stylesheet">
    
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>

    <style>
        :root {
            --obsidian-950: #020617;
            --obsidian-900: #0f172a;
            --obsidian-800: #1e293b;
            --electric: #3b82f6;
            --electric-dim: rgba(59, 130, 246, 0.1);
            --gold: #fcc131;
            --gold-dim: rgba(252, 193, 49, 0.1);
            --rose: #fb7185;
            --rose-dim: rgba(251, 113, 133, 0.1);
            --emerald: #10b981;
            --slate-300: #cbd5e1;
            --slate-400: #94a3b8;
            --white: #ffffff;
            --sidebar-width: 250px;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            scroll-behavior: smooth;
        }

        body {
            background-color: var(--obsidian-950);
            color: var(--slate-300);
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            display: flex;
            min-height: 100vh;
        }

        /* Sidebar Navigation */
        .toc {
            width: var(--sidebar-width);
            height: 100vh;
            position: fixed;
            left: 0;
            top: 0;
            background: var(--obsidian-900);
            border-right: 1px solid rgba(255,255,255,0.05);
            padding: 2rem 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            z-index: 100;
        }

        .toc-label {
            color: var(--white);
            font-family: 'Outfit', sans-serif;
            font-weight: 900;
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            opacity: 0.4;
        }

        .toc ul {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .toc li a {
            color: var(--slate-400);
            text-decoration: none;
            font-size: 0.85rem;
            font-weight: 600;
            transition: all 0.2s;
            display: block;
            padding: 0.5rem 0.75rem;
            border-radius: 0.5rem;
        }

        .toc li a:hover {
            color: var(--electric);
            background: var(--electric-dim);
        }

        /* Main Content */
        .main-wrapper {
            margin-left: var(--sidebar-width);
            flex: 1;
            padding: 4rem 2rem;
            max-width: 1000px;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
        }

        header {
            margin-bottom: 4rem;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding-bottom: 2rem;
        }

        .brand {
            font-family: 'Outfit', sans-serif;
            font-weight: 900;
            color: var(--electric);
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.4em;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .icon-brand { color: var(--gold); }

        h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 3rem;
            font-weight: 900;
            color: var(--white);
            line-height: 1.1;
            letter-spacing: -0.02em;
        }

        .metadata {
            margin-top: 1.5rem;
            font-size: 0.75rem;
            display: flex;
            gap: 2rem;
            color: var(--slate-400);
        }

        .meta-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .meta-item svg { opacity: 0.5; color: var(--electric); }

        /* Sections */
        .lesson-section {
            margin-bottom: 5rem;
        }

        .section-title {
            color: var(--white);
            font-size: 1.75rem;
            font-weight: 900;
            margin-bottom: 1.5rem;
            font-family: 'Outfit', sans-serif;
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .section-title::before {
            content: "";
            width: 4px;
            height: 1.5rem;
            background: var(--electric);
            border-radius: 2px;
            display: inline-block;
        }

        .section-content {
            font-size: 1.05rem;
            color: var(--slate-300);
        }

        /* Math Shielding */
        .katex-display {
            background: rgba(0,0,0,0.2);
            padding: 2rem;
            border-radius: 1.25rem;
            margin: 2rem 0;
            border: 1px solid rgba(255,255,255,0.05);
            box-shadow: inset 0 2px 10px rgba(0,0,0,0.3);
        }

        /* Boxes */
        .examples-box {
            background: var(--gold-dim);
            border: 1px solid rgba(252, 193, 49, 0.2);
            padding: 2rem;
            border-radius: 1.25rem;
            margin-top: 2rem;
        }

        .examples-label {
            color: var(--gold);
            font-weight: 900;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 1rem;
        }

        .pitfalls-container {
            background: var(--rose-dim);
            border: 1px solid rgba(251, 113, 133, 0.3);
            padding: 2.5rem;
            border-radius: 1.5rem;
            margin-bottom: 4rem;
        }

        .pitfalls-title {
            color: var(--rose);
            font-size: 1.2rem;
            text-transform: uppercase;
            font-weight: 900;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-family: 'Outfit', sans-serif;
        }

        .pitfalls-list {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .pitfalls-list li::before {
            content: "→";
            margin-right: 0.75rem;
            color: var(--rose);
            font-weight: bold;
        }

        /* Connections & Synergy */
        .connections-wrapper {
            margin-bottom: 4rem;
        }
        .synergy-main-title {
            color: var(--white);
            font-family: 'Outfit', sans-serif;
            font-size: 1.2rem;
            text-transform: uppercase;
            letter-spacing: 0.2rem;
            margin-bottom: 2rem;
            opacity: 0.6;
        }
        .connections-grid {
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 2rem;
        }
        .connection-box {
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.05);
            padding: 2rem;
            border-radius: 1.5rem;
        }
        .connection-title {
            color: var(--white);
            font-size: 0.9rem;
            font-weight: 800;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .connection-list {
            list-style: none;
            font-size: 0.85rem;
            color: var(--slate-400);
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .connection-list li {
            border-left: 2px solid rgba(255,255,255,0.1);
            padding-left: 1rem;
        }
        .connection-box.subject .connection-title svg { color: var(--electric); }
        .connection-box.cross .connection-title svg { color: var(--emerald); }

        /* Quiz */
        .quiz-container {
            background: var(--obsidian-900);
            padding: 3rem;
            border-radius: 2.5rem;
            border: 1px solid rgba(255,255,255,0.05);
            margin-top: 6rem;
        }

        .quiz-title {
            color: var(--white);
            font-size: 2rem;
            margin-bottom: 3rem;
            font-family: 'Outfit', sans-serif;
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .quiz-question {
            margin-bottom: 4rem;
            padding-bottom: 3rem;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .quiz-question:last-child { border-bottom: none; }

        .question-header {
            display: flex;
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .question-number {
            background: var(--electric);
            color: var(--obsidian-950);
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-family: 'Outfit', sans-serif;
            flex-shrink: 0;
        }

        .question-text {
            color: var(--white);
            font-weight: 600;
            font-size: 1.15rem;
            line-height: 1.4;
        }

        .question-options {
            list-style: none;
            display: grid;
            gap: 0.75rem;
            margin-bottom: 2rem;
            padding-left: 3.5rem;
        }

        .question-options li {
            background: rgba(255,255,255,0.03);
            padding: 1rem 1.5rem;
            border-radius: 1rem;
            border: 1px solid rgba(255,255,255,0.05);
            font-size: 0.95rem;
            display: flex;
            gap: 1rem;
            align-items: center;
            transition: all 0.2s;
        }

        .option-label {
            color: var(--slate-400);
            font-weight: 900;
            font-size: 0.8rem;
            width: 24px;
        }

        .correct-answer-hint {
            /* Hidden by default, only shown when revealed */
        }

        .quiz-question.revealed .correct-answer-hint {
            border-color: var(--emerald) !important;
            background: rgba(16, 185, 129, 0.05) !important;
        }

        .quiz-question.revealed .correct-answer-hint .option-label {
            color: var(--emerald);
        }

        .reveal-btn {
            background: var(--obsidian-800);
            color: var(--white);
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.75rem;
            font-weight: 700;
            font-size: 0.8rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s;
            margin-left: 3.5rem;
        }

        .reveal-btn:hover { background: var(--electric); color: var(--obsidian-950); }

        .explanation-box {
            margin-top: 2rem;
            padding: 2rem;
            background: rgba(255,255,255,0.02);
            border-radius: 1.5rem;
            margin-left: 3.5rem;
            border-left: 4px solid var(--emerald);
        }

        .hidden { display: none; }

        .correct-marker {
            color: var(--emerald);
            font-weight: 900;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.1em;
            margin-bottom: 0.5rem;
        }

        .explanation-text { font-size: 0.9rem; color: var(--slate-400); }

        /* Misc */
        .print-btn {
            margin-top: auto;
            border: 1px solid var(--electric);
            background: transparent;
            color: var(--electric);
            padding: 0.75rem;
            border-radius: 0.75rem;
            font-weight: bold;
            font-size: 0.75rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }

        .print-btn:hover { background: var(--electric); color: var(--white); }

        @media print {
            :root {
                --obsidian-950: #fff;
                --obsidian-900: #fff;
                --obsidian-800: #fff;
                --white: #000;
                --slate-300: #000;
                --slate-400: #111;
                --electric: #000;
                --gold: #000;
                --rose: #000;
            }

            @page {
                margin: 1.5cm;
                size: portrait;
            }

            body { 
                background: white !important; 
                color: black !important;
                font-size: 10pt;
            }
            
            .toc { display: none !important; }
            .main-wrapper { 
                margin-left: 0 !important; 
                padding: 0 !important; 
                width: 100% !important;
                max-width: 100% !important;
            }

            header { 
                margin-bottom: 2rem !important; 
                border-bottom: 2px solid #000 !important;
            }

            h1 { 
                font-size: 22pt !important; 
                color: black !important;
                margin-bottom: 0.5rem !important;
            }

            .brand { 
                color: black !important; 
                font-size: 8pt !important;
                margin-bottom: 0.5rem !important;
            }

            .lesson-section { 
                margin-bottom: 2rem !important;
                page-break-inside: avoid;
            }

            .section-title { 
                font-size: 14pt !important; 
                color: black !important;
                margin-bottom: 0.75rem !important;
                border-bottom: 1px solid #eee;
                padding-bottom: 0.25rem;
            }

            .section-title::before { display: none; }

            .section-content { 
                font-size: 10pt !important; 
                color: black !important;
            }

            .katex-display {
                background: none !important;
                border: 1px solid #eee !important;
                padding: 1rem !important;
                margin: 1rem 0 !important;
                box-shadow: none !important;
                color: black !important;
            }

            .examples-box, .pitfalls-container, .quiz-container, .explanation-box, .connection-box { 
                background: #fff !important;
                border: 1.5pt solid #eee !important;
                padding: 1.25rem !important;
                margin-bottom: 1.5rem !important;
                color: black !important;
                box-shadow: none !important;
                page-break-inside: avoid;
            }

            .examples-label, .pitfalls-title, .quiz-title, .correct-marker, .connection-title, .synergy-main-title { 
                color: black !important; 
                border-bottom: 1px solid #eee;
                padding-bottom: 4px;
                margin-bottom: 8px !important;
                font-size: 11pt !important;
            }

            .connections-grid { 
                display: block !important; 
            }
            
            .connection-list li {
                border-left-color: #eee !important;
            }

            .explanation-box { 
                display: block !important; 
                border-left: 3pt solid #000 !important;
            }
            
            .reveal-btn, .print-btn { display: none !important; }
            
            p, li, span, div { 
                color: black !important; 
            }

            footer { border-top-color: #000 !important; }
        }

        @media (max-width: 1100px) {
            .toc { display: none; }
            .main-wrapper { margin-left: 0; }
        }
    </style>
</head>
<body>
    ${tocHtml}

    <main class="main-wrapper">
        <div class="container">
            <header>
                <div class="brand">${this.ICONS.elite} ELITE EXAM ENGINE</div>
                <h1>${title}</h1>
                <div class="metadata">
                    <div class="meta-item">${this.ICONS.subject} ${subject}</div>
                    <div class="meta-item">${this.ICONS.calendar} ${date}</div>
                </div>
            </header>

            ${pitfallsHtml}
            ${connectionsHtml}

            <div class="content-body">
                ${sectionsHtml}
            </div>

            ${quizHtml}

            <footer style="margin-top: 8rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 2rem;">
              <p style="opacity: 0.5; font-size: 0.7rem; text-align: center;">VWO ELITE &bull; PREMIERE EXAM PREPARATION</p>
            </footer>
        </div>
    </main>

    <script>
        function toggleExplanation(btn) {
            const question = btn.closest('.quiz-question');
            const box = question.querySelector('.explanation-box');
            question.classList.toggle('revealed');
            box.classList.toggle('hidden');
            btn.innerHTML = question.classList.contains('revealed') 
                ? 'Verberg Uitleg' 
                : '${this.ICONS.chevronDown.replace(/'/g, "\\'")} Toon Uitleg & Correct Antwoord';
        }

        document.addEventListener("DOMContentLoaded", function() {
            renderMathInElement(document.body, {
                delimiters: [
                    {left: "$$", right: "$$", display: true},
                    {left: "$", right: "$", display: false},
                    {left: "\\(", right: "\\)", display: false},
                    {left: "\\[", right: "\\]", display: true}
                ],
                throwOnError : false
            });
        });
    </script>
</body>
</html>`;
    }

    /**
     * Refined markdown translator for Elite Porter.
     * Uses a two-pass shielding approach to protect scientific math.
     */
    private static formatMarkdownToHtml(text: string): string {
        if (!text) return "";

        // 0. Normalize LaTeX Block delimiters before shielding
        const normalized = text
            .replace(/\\\[/g, "$$")
            .replace(/\\\]/g, "$$")
            .replace(/\\\(/g, "$")
            .replace(/\\\)/g, "$");

        // 1. Shield Math blocks ($...$ and $$...$$)
        const mathBlocks: string[] = [];
        let processed = normalized.replace(/(\$\$[\s\S]*?\$\$|\$.*?\$)/g, (match) => {
            mathBlocks.push(match);
            return `__MATH_BLOCK_${mathBlocks.length - 1}__`;
        });

        // 2. Safe HTML pass
        processed = processed
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // 3. Simple Markdown features
        // Headings
        processed = processed.replace(/^### (.*$)/gim, '<h3 style="color:var(--white); margin-top:2rem; font-weight:800; font-family:Outfit; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:0.5rem;">$1</h3>');
        processed = processed.replace(/^#+ (.*$)/gim, '<h4 style="color:var(--electric); margin-top:1.5rem; font-weight:700;">$1</h4>');

        // Bold/Italic (Added styling for labels)
        processed = processed.replace(/\*\*(.*?)\*\*/gim, '<strong style="color:var(--white); background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px; font-weight:bold; border:1px solid rgba(255,255,255,0.1);">$1</strong>');
        processed = processed.replace(/\*(.*?)\*/gim, '<em>$1</em>');

        // Lists (Bullet)
        processed = processed.replace(/^-(.*$)/gim, '<li style="margin-left:1.5rem; margin-bottom:0.5rem;">$1</li>');

        // Paragraphs
        processed = processed.split('\n\n').map(p => {
            if (p.trim().startsWith('<')) return p;
            return `<p style="margin-bottom:1.5rem; line-height:1.7;">${p.replace(/\n/g, '<br>')}</p>`;
        }).join('');

        // 4. Unshield Math
        mathBlocks.forEach((block, idx) => {
            processed = processed.replace(`__MATH_BLOCK_${idx}__`, block);
        });

        return processed;
    }
}
