/**
 * Daily Concept Mastery Portal - Frontend Application Controller
 * Enriched with Mermaid.js Diagrams, Detailed Principles Cards, AI Prompts, Toolkits, and 25-Question Assessment Engine.
 */

let currentConcept = null;
let allConcepts = [];
let conceptsById = {};
let todayActiveByTrack = {};
let speechSynth = window.speechSynthesis;
let currentUtterance = null;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Daily Concept Mastery App Initialized with 0ms Instant Track Caching.');
  
  initTabNavigation();
  initEventListeners();
  initCountdownTimer();

  // Load Archive & Today Concepts in parallel for instant memory caching
  await Promise.all([
    loadConceptsArchive(),
    loadTodayConcept()
  ]);
});

// Markdown & Code & Math & Mermaid Parser
function formatMarkdown(text) {
  if (!text) return '';
  let html = text;

  // Normalize escaped newlines
  html = html.replace(/\\n/g, '\n');

  // Extract & preserve Mermaid Diagrams before regex processing
  const mermaidBlocks = [];
  html = html.replace(/```mermaid([\s\S]*?)```/g, (match, diagram) => {
    const placeholder = `__MERMAID_BLOCK_${mermaidBlocks.length}__`;
    mermaidBlocks.push(`<div class="mermaid">\n${diagram.trim()}\n</div>`);
    return placeholder;
  });

  // Extract & preserve Code blocks
  const codeBlocks = [];
  html = html.replace(/```(python|js|json|bash)?([\s\S]*?)```/g, (match, lang, code) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(`<pre class="code-block"><code>${escapeHtml(code.trim())}</code></pre>`);
    return placeholder;
  });

  // Display Math equations $$...$$
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
    return `<div class="math-block">$$\\text{${math.trim()}}$$</div>`;
  });

  // Inline Math equations $...$
  html = html.replace(/\$([^\$\n]+)\$/g, '<span class="inline-math">$$$1$$</span>');

  // Headings (#, ##, ###)
  html = html.replace(/^### (.*$)/gim, '<h3 class="md-h3">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="md-h2">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="md-h1">$1</h1>');

  // Markdown Links [Label](URL) -> <a href="URL" target="_blank" rel="noopener noreferrer" class="md-link">Label ↗</a>
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1 ↗</a>');

  // Bold & Italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr class="md-hr">');

  // Paragraphs & Lists
  const lines = html.split('\n\n');
  let result = lines.map(p => {
    p = p.trim();
    if (!p) return '';
    if (p.startsWith('__MERMAID_BLOCK_') || p.startsWith('__CODE_BLOCK_') || p.startsWith('<h') || p.startsWith('<pre') || p.startsWith('<div class="math') || p.startsWith('<hr')) {
      return p;
    }
    // Handle bullet lists starting with - or *
    if (p.startsWith('- ') || p.startsWith('* ')) {
      const listItems = p.split('\n').map(li => {
        const itemText = li.replace(/^[-*]\s+/, '').trim();
        return `<li>${itemText}</li>`;
      }).join('');
      return `<ul class="md-ul">${listItems}</ul>`;
    }
    // Handle numbered lists starting with 1., 2., etc.
    if (/^\d+\.\s+/.test(p)) {
      const listItems = p.split('\n').map(li => {
        const itemText = li.replace(/^\d+\.\s+/, '').trim();
        return `<li>${itemText}</li>`;
      }).join('');
      return `<ol class="md-ol">${listItems}</ol>`;
    }
    return `<p class="body-p">${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  // Re-inject preserved Mermaid blocks
  mermaidBlocks.forEach((block, idx) => {
    result = result.replace(`__MERMAID_BLOCK_${idx}__`, block);
    result = result.replace(`<p class="body-p">__MERMAID_BLOCK_${idx}__</p>`, block);
  });

  // Re-inject preserved Code blocks
  codeBlocks.forEach((block, idx) => {
    result = result.replace(`__CODE_BLOCK_${idx}__`, block);
    result = result.replace(`<p class="body-p">__CODE_BLOCK_${idx}__</p>`, block);
  });

  return result;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Copy AI Prompt Helper
function copyPromptToClipboard(promptText, btnElement) {
  navigator.clipboard.writeText(promptText).then(() => {
    const originalText = btnElement.innerHTML;
    btnElement.innerHTML = '✅ Copied to Clipboard!';
    btnElement.style.background = 'var(--success)';
    btnElement.style.color = 'white';
    setTimeout(() => {
      btnElement.innerHTML = originalText;
      btnElement.style.background = '';
      btnElement.style.color = '';
    }, 2500);
  }).catch(err => {
    console.error('Failed to copy prompt:', err);
  });
}

// 1. Fetch Today's Active Concept & Cache Active Concepts for All Tracks
async function loadTodayConcept() {
  try {
    const response = await fetch('/api/concept/today');
    const data = await response.json();
    currentConcept = data;

    // Cache active concepts for all 3 tracks
    const activeList = data.todayConcepts || data.todayAllTracks || [data];
    if (Array.isArray(activeList)) {
      activeList.forEach(tc => {
        todayActiveByTrack[tc.track] = tc;
        conceptsById[tc.id] = tc;
      });
    }

    renderConceptDetails(data);
    renderSidebarTrackList();
  } catch (err) {
    console.error('❌ Failed to fetch today concept:', err);
  }
}

// Instant Local Switcher (0ms Network Delay)
function loadConceptByIdLocally(id) {
  if (conceptsById[id]) {
    currentConcept = conceptsById[id];
    renderConceptDetails(currentConcept);
    renderSidebarTrackList();
  } else {
    loadConceptById(id);
  }
}

// Instant Track Switcher (0ms Network Delay)
function selectTrack(trackName) {
  let target = todayActiveByTrack[trackName];
  if (!target) {
    target = allConcepts.find(c => c.track === trackName) || allConcepts[0];
  }
  if (target) {
    currentConcept = target;
    renderConceptDetails(target);
    renderSidebarTrackList();
  }
}

// 1b. Fetch Specific Concept by ID
async function loadConceptById(id) {
  try {
    const response = await fetch(`/api/concept/${id}`);
    const data = await response.json();
    currentConcept = data;
    conceptsById[data.id] = data;
    renderConceptDetails(data);
    renderSidebarTrackList();
  } catch (err) {
    console.error(`❌ Failed to fetch concept ${id}:`, err);
  }
}

// 2. Load Concept Archive & Pre-Cache All Concepts
async function loadConceptsArchive() {
  try {
    const response = await fetch('/api/concepts');
    allConcepts = await response.json();
    
    // Build memory lookup map
    allConcepts.forEach(c => {
      conceptsById[c.id] = c;
    });

    renderArchiveList(allConcepts);
    renderSidebarTrackList();
  } catch (err) {
    console.error('❌ Failed to fetch archive:', err);
  }
}

// Render Left Sidebar Tracks & Sub-Topics
function renderSidebarTrackList() {
  const tracksContainer = document.querySelector('.tracks-card');
  if (!tracksContainer) return;

  const tracks = [
    { name: 'Artificial Intelligence', icon: '🤖', desc: 'Transformers, RAG & LLMs' },
    { name: 'Agile Coaching', icon: '🎯', desc: 'SAFe PI Planning & Systemic Teams' },
    { name: 'Leadership & Soft Skills', icon: '🧠', desc: 'Psychological Safety & Executive Presence' }
  ];

  tracksContainer.innerHTML = `
    <h3>🎓 Curriculum Tracks</h3>
    ${tracks.map(t => {
      const isActiveTrack = currentConcept && currentConcept.track === t.name;
      const trackConcepts = allConcepts.filter(c => c.track === t.name);
      const activeRotated = todayActiveByTrack[t.name] || (isActiveTrack ? currentConcept : trackConcepts[0]);

      return `
        <div class="track-item ${isActiveTrack ? 'active' : ''}" onclick="selectTrack('${t.name}')">
          <div class="track-header-flex">
            <span class="track-icon">${t.icon}</span>
            <div class="track-info">
              <h4>${t.name}</h4>
              <p>${t.desc}</p>
            </div>
          </div>
          
          ${activeRotated ? `
            <div class="track-active-badge">
              <span class="active-dot"></span>
              <span class="active-label">LATEST: ${activeRotated.title.split(',')[0]}</span>
            </div>
          ` : ''}
        </div>
      `;
    }).join('')}
  `;
}

// 3. Render Concept Details into UI
function renderConceptDetails(concept) {
  // Update Active Track Highlight in Sidebar
  document.querySelectorAll('.track-item').forEach(item => {
    if (item.dataset.track === concept.track) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Sidebar Spotlight
  document.getElementById('sidebar-track-badge').textContent = concept.track;
  document.getElementById('sidebar-concept-title').textContent = concept.title;
  document.getElementById('sidebar-concept-tagline').textContent = `"${concept.tagline}"`;
  document.getElementById('sidebar-read-time').textContent = concept.estimatedTime;
  document.getElementById('sidebar-day-index').textContent = concept.currentIndex || 1;

  // Header Banner
  const trackBadge = document.getElementById('concept-track-badge');
  trackBadge.textContent = concept.track.toUpperCase();
  trackBadge.className = 'badge ' + (
    concept.track.includes('AI') || concept.track.includes('Artificial') ? 'badge-ai' : 
    concept.track.includes('Agile') ? 'badge-agile' : 'badge-soft'
  );
  document.getElementById('concept-id-badge').textContent = `CONCEPT ID: ${concept.id.toUpperCase()}`;
  document.getElementById('concept-main-title').textContent = concept.title;
  document.getElementById('concept-main-tagline').textContent = concept.tagline;

  // Tab 1: Overview & Diagrams
  document.getElementById('concept-overview-body').innerHTML = formatMarkdown(concept.overview);
  
  // Render Detailed Core Principles Cards
  const principlesList = document.getElementById('concept-principles-list');
  principlesList.innerHTML = concept.corePrinciples.map(p => {
    if (typeof p === 'string') {
      return `
        <div class="principle-card">
          <div class="principle-title">⚡ ${formatMarkdown(p)}</div>
        </div>
      `;
    }
    return `
      <div class="principle-card">
        <div class="principle-title">${p.title}</div>
        <div class="principle-section"><span class="principle-label">📌 CORE MEANING:</span> ${formatMarkdown(p.meaning)}</div>
        <div class="principle-section"><span class="principle-label">🎯 WHY IT MATTERS (ENTERPRISE IMPACT):</span> ${formatMarkdown(p.whyItMatters)}</div>
        <div class="principle-section"><span class="principle-label">⚡ PRACTICAL IMPLEMENTATION PATTERN:</span> ${formatMarkdown(p.implementation)}</div>
      </div>
    `;
  }).join('');

  // Re-run Mermaid Renderer on new DOM nodes
  setTimeout(() => {
    if (window.mermaid) {
      try {
        document.querySelectorAll('.mermaid').forEach(el => el.removeAttribute('data-processed'));
        mermaid.run({ nodes: document.querySelectorAll('.mermaid') });
      } catch (err) {
        console.log('Mermaid render:', err);
      }
    }
  }, 100);

  // Tab 2: Books & Chapter Summaries
  const booksContainer = document.getElementById('books-container');
  booksContainer.innerHTML = concept.books.map((b, idx) => `
      <div class="book-card full-width-card">
        <div class="card-header-flex">
          <div>
            <span class="book-badge-pill">BOOK ${idx + 1} EXECUTIVE BREAKDOWN</span>
            <h3 style="margin-top: 8px; font-size: 20px; color: var(--accent-cyan);">📚 ${b.title}</h3>
            <div class="book-author">by ${b.author}</div>
          </div>
          ${b.url ? `<a href="${b.url}" target="_blank" class="btn btn-sm btn-outline" style="font-size: 11px; opacity: 0.75;" title="Optional publisher link">Publisher Page ↗</a>` : ''}
        </div>
        
        <div class="book-chapters-box">
          <div class="chapters-tag">🔑 FOCUS CHAPTERS ANALYZED:</div>
          <div class="chapters-list-text">${b.keyChapters}</div>
        </div>

        <div class="chapter-summary-content">
          <div class="summary-section-title">💡 Executive Chapter Breakdown</div>
          <div class="book-summary-body">${formatMarkdown(b.summary)}</div>
        </div>

        ${b.keyTakeaways && b.keyTakeaways.length ? `
          <div class="chapter-takeaways-box">
            <div class="summary-section-title">📌 Essential Takeaways & Mental Models from these Chapters</div>
            <ul class="takeaways-list">
              ${b.keyTakeaways.map(t => `<li>${formatMarkdown(t)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `).join('');

  // Tab 3: Articles & Papers with Direct Links
  const articlesContainer = document.getElementById('articles-container');
  articlesContainer.innerHTML = concept.articles.map(a => `
    <div class="article-item">
      <div class="article-info">
        <h3>📄 ${a.title}</h3>
        <div class="article-source">Source: ${a.source}</div>
        <div class="article-takeaway-body">${formatMarkdown(a.takeaway)}</div>
      </div>
      ${a.url ? `<a href="${a.url}" target="_blank" class="btn btn-sm btn-secondary">Read Article / Paper ↗</a>` : ''}
    </div>
  `).join('');

  // Tab 4: Video & Podcasts with Direct Links
  const mediaContainer = document.getElementById('media-container');
  mediaContainer.innerHTML = concept.media.map(m => `
    <div class="media-card">
      <div class="card-header-flex">
        <h3>${m.type.includes('Video') || m.type.includes('Talk') || m.type.includes('Lecture') || m.type.includes('Workshop') ? '🎬' : '🎙️'} ${m.title}</h3>
        ${m.url ? `<a href="${m.url}" target="_blank" class="btn btn-sm btn-primary">Watch / Listen ↗</a>` : ''}
      </div>
      <div class="book-author">${m.channel} • ${m.duration}</div>
      <p class="article-takeaway"><strong>Key Insight:</strong> ${m.keyInsight}</p>
    </div>
  `).join('');

  // Tab 5: Case Study & Actions with AI Prompts & AI Toolkits
  document.getElementById('case-study-title').textContent = concept.caseStudy.title;
  document.getElementById('case-study-context').innerHTML = formatMarkdown(concept.caseStudy.context);
  document.getElementById('case-study-solution').innerHTML = formatMarkdown(concept.caseStudy.solution);
  document.getElementById('case-study-impact').innerHTML = formatMarkdown(concept.caseStudy.impact);

  const actionList = document.getElementById('concept-action-list');
  actionList.innerHTML = concept.actionPlan.map((a, idx) => {
    if (typeof a === 'string') {
      return `
        <li class="action-step-card">
          <div class="action-step-header">ACTION STEP ${idx + 1}</div>
          <div class="action-step-body">${formatMarkdown(a)}</div>
        </li>
      `;
    }

    const promptEscaped = escapeHtml(a.aiPrompt);
    return `
      <li class="action-step-card">
        <div class="action-step-header">ACTION STEP ${idx + 1}: ${a.title}</div>
        <div class="action-step-body">${formatMarkdown(a.instructions)}</div>

        <!-- Executive AI Prompt Box -->
        <div class="ai-prompt-container">
          <div class="ai-prompt-header">
            <span>🤖 EXECUTIVE AI PROMPT (COPY & EXECUTE WITH LLM)</span>
            <button class="btn btn-sm btn-secondary copy-prompt-btn" onclick="copyPromptToClipboard(\`${promptEscaped}\`, this)">
              📋 Copy AI Prompt
            </button>
          </div>
          <pre class="ai-prompt-code"><code>${promptEscaped}</code></pre>
        </div>

        <!-- AI Toolkit & Recommended Stack -->
        <div class="ai-toolkit-box">
          <span class="toolkit-label">🛠️ RECOMMENDED PARTICIPANT AI TOOLKIT & STACK:</span>
          <div class="toolkit-badges">
            ${a.aiToolkit.map(tool => `<span class="tool-badge">${tool}</span>`).join('')}
          </div>
        </div>
      </li>
    `;
  }).join('');

  // Tab 6: 25-Question Quiz Assessment
  renderQuiz(concept.quiz);

  // Tab 7: Notes
  document.getElementById('user-notes-input').value = concept.userNotes || '';
  document.getElementById('notes-status-msg').textContent = '';
}

// 4. Render Quiz Options (With Robust Fallbacks & Option Lettering)
function renderQuiz(quizArray) {
  const quizContainer = document.getElementById('quiz-container');
  document.getElementById('quiz-score-banner').className = 'score-banner hidden';
  
  const optionLetters = ['A', 'B', 'C', 'D'];

  quizContainer.innerHTML = `
    <div class="quiz-header-badge">
      <span>📊 TOTAL ASSESSMENT QUESTIONS: ${quizArray.length}</span>
      <span>Passing Score: 80% (20/25)</span>
    </div>
    ${quizArray.map((q, qIndex) => {
      const questionText = q.question || q.title || q.q || `Question ${qIndex + 1}`;
      const correctIndex = typeof q.answer === 'number' ? q.answer : 0;

      return `
        <div class="quiz-item" data-qindex="${qIndex}" data-correct="${correctIndex}">
          <div class="quiz-question"><span class="q-number-badge">Q${qIndex + 1}</span> ${questionText}</div>
          <div class="quiz-options">
            ${q.options.map((opt, optIndex) => `
              <label class="quiz-option-label" id="opt-label-${qIndex}-${optIndex}">
                <input type="radio" name="quiz-q-${qIndex}" value="${optIndex}">
                <span class="opt-letter">${optionLetters[optIndex] || ''}.</span>
                <span class="opt-text">${opt}</span>
              </label>
            `).join('')}
          </div>
          <div class="quiz-explanation hidden" id="explanation-${qIndex}"></div>
        </div>
      `;
    }).join('')}
  `;
}

// 5. Evaluate Quiz Answers
function evaluateQuiz() {
  if (!currentConcept || !currentConcept.quiz) return;
  
  let score = 0;
  const total = currentConcept.quiz.length;
  const optionLetters = ['A', 'B', 'C', 'D'];

  currentConcept.quiz.forEach((q, qIndex) => {
    const selected = document.querySelector(`input[name="quiz-q-${qIndex}"]:checked`);
    const expDiv = document.getElementById(`explanation-${qIndex}`);
    const correctIndex = typeof q.answer === 'number' ? q.answer : 0;
    const correctLetter = optionLetters[correctIndex] || 'A';
    const correctText = q.options[correctIndex] || '';

    expDiv.classList.remove('hidden');

    // Reset option label styles
    q.options.forEach((_, oIdx) => {
      const lbl = document.getElementById(`opt-label-${qIndex}-${oIdx}`);
      if (lbl) lbl.classList.remove('opt-correct', 'opt-incorrect');
    });

    if (selected) {
      const selectedIndex = parseInt(selected.value);
      const selectedLabel = document.getElementById(`opt-label-${qIndex}-${selectedIndex}`);

      if (selectedIndex === correctIndex) {
        score++;
        if (selectedLabel) selectedLabel.classList.add('opt-correct');
        expDiv.innerHTML = `<span style="color: var(--success); font-weight: bold;">✅ Correct! (${correctLetter})</span> ${q.explanation}`;
      } else {
        if (selectedLabel) selectedLabel.classList.add('opt-incorrect');
        const correctLabel = document.getElementById(`opt-label-${qIndex}-${correctIndex}`);
        if (correctLabel) correctLabel.classList.add('opt-correct');

        expDiv.innerHTML = `<span style="color: var(--danger); font-weight: bold;">❌ Incorrect.</span> Correct Answer: <strong>Option ${correctLetter}</strong> — ${correctText}.<br><br>${q.explanation}`;
      }
    } else {
      // Unanswered
      const correctLabel = document.getElementById(`opt-label-${qIndex}-${correctIndex}`);
      if (correctLabel) correctLabel.classList.add('opt-correct');

      expDiv.innerHTML = `<span style="color: #f59e0b; font-weight: bold;">⚠️ Not Answered.</span> Correct Answer: <strong>Option ${correctLetter}</strong> — ${correctText}.<br><br>${q.explanation}`;
    }
  });

  const percentage = Math.round((score / total) * 100);
  const scoreBanner = document.getElementById('quiz-score-banner');
  scoreBanner.classList.remove('hidden');
  
  if (percentage >= 80) {
    scoreBanner.className = 'score-banner pass';
    scoreBanner.innerHTML = `🏆 EXCELLENT! You scored ${score} / ${total} (${percentage}%) - Domain Mastery Certified!`;
  } else {
    scoreBanner.className = 'score-banner fail';
    scoreBanner.innerHTML = `⚠️ Assessment Complete: You scored ${score} / ${total} (${percentage}%). Review explanations above to strengthen your understanding.`;
  }

  scoreBanner.scrollIntoView({ behavior: 'smooth' });
}

// 6. Navigation Tabs Logic
function initTabNavigation() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.dataset.tab;
      document.getElementById(targetId).classList.add('active');
    });
  });
}

// 7. Event Listeners & Buttons
function initEventListeners() {
  // Rotate Concept Button
  document.getElementById('btn-rotate-concept').addEventListener('click', async () => {
    try {
      const response = await fetch('/api/concept/rotate', { method: 'POST' });
      const data = await response.json();
      await loadTodayConcept();
    } catch (err) {
      console.error(err);
    }
  });

  // Trigger Email Test Button
  document.getElementById('btn-trigger-email').addEventListener('click', async () => {
    const recipient = document.getElementById('subscriber-email-input').value;
    try {
      const response = await fetch('/api/email/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient })
      });
      const data = await response.json();
      
      document.getElementById('email-modal-status').textContent = data.message;
      document.getElementById('email-modal-preview-link').href = data.previewUrl;
      document.getElementById('email-modal-preview-link').textContent = data.previewUrl;
      document.getElementById('email-preview-modal').classList.remove('hidden');
    } catch (err) {
      alert('Failed to send email: ' + err.message);
    }
  });

  // Submit Quiz Button
  document.getElementById('btn-submit-quiz').addEventListener('click', evaluateQuiz);

  // Save Notes Button
  document.getElementById('btn-save-notes').addEventListener('click', async () => {
    if (!currentConcept) return;
    const notes = document.getElementById('user-notes-input').value;
    try {
      const response = await fetch(`/api/concept/${currentConcept.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      const data = await response.json();
      const statusMsg = document.getElementById('notes-status-msg');
      statusMsg.textContent = '✅ Notes saved successfully!';
      setTimeout(() => statusMsg.textContent = '', 3000);
    } catch (err) {
      console.error(err);
    }
  });

  // Save Email Settings Button
  document.getElementById('btn-save-email').addEventListener('click', () => {
    const toast = document.getElementById('email-toast');
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
  });

  // Audio Read-Aloud TTS Buttons
  document.getElementById('btn-play-tts').addEventListener('click', playAudioSummary);
  document.getElementById('btn-stop-tts').addEventListener('click', stopAudioSummary);

  // Archive Modal Buttons
  document.getElementById('btn-open-archive').addEventListener('click', () => {
    document.getElementById('archive-modal').classList.remove('hidden');
  });
  document.getElementById('btn-close-modal').addEventListener('click', () => {
    document.getElementById('archive-modal').classList.add('hidden');
  });
  document.getElementById('btn-close-email-modal').addEventListener('click', () => {
    document.getElementById('email-preview-modal').classList.add('hidden');
  });

  // Archive Search Input
  document.getElementById('archive-search-input').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allConcepts.filter(c => 
      c.title.toLowerCase().includes(term) ||
      c.track.toLowerCase().includes(term) ||
      c.tagline.toLowerCase().includes(term)
    );
    renderArchiveList(filtered);
  });
}

// 8. Render Archive List in Modal
function renderArchiveList(concepts) {
  const archiveList = document.getElementById('archive-list');
  archiveList.innerHTML = concepts.map(c => `
    <div class="archive-item" onclick="selectArchivedConcept('${c.id}')">
      <div>
        <span class="track-chip">${c.track}</span>
        <h4 style="color: white; margin-top: 4px;">${c.title}</h4>
        <p style="font-size: 12px; color: var(--text-muted);">${c.tagline}</p>
      </div>
      <button class="btn btn-sm btn-outline">Study ➔</button>
    </div>
  `).join('');
}

async function selectArchivedConcept(id) {
  await loadConceptById(id);
  document.getElementById('archive-modal').classList.add('hidden');
}

// 9. Audio Text-To-Speech Reader
function playAudioSummary() {
  if (!currentConcept || !speechSynth) {
    alert('Speech synthesis is not supported in this browser environment.');
    return;
  }
  
  speechSynth.cancel();
  
  const cleanText = currentConcept.overview.replace(/[#*`$\\]/g, '');
  const text = `Today's Concept is ${currentConcept.title} in the ${currentConcept.track} track. ${cleanText.substring(0, 350)}`;
  
  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.rate = 1.0;
  currentUtterance.pitch = 1.0;
  
  document.getElementById('tts-status').textContent = '🔊 Reading...';
  
  currentUtterance.onend = () => {
    document.getElementById('tts-status').textContent = 'Completed';
  };
  
  speechSynth.speak(currentUtterance);
}

function stopAudioSummary() {
  if (speechSynth) {
    speechSynth.cancel();
    document.getElementById('tts-status').textContent = 'Stopped';
  }
}

// 10. Live Countdown Timer to Next 7:00 AM
function initCountdownTimer() {
  function updateTimer() {
    const now = new Date();
    const nextSeven = new Date();
    nextSeven.setHours(7, 0, 0, 0);
    
    if (now >= nextSeven) {
      nextSeven.setDate(nextSeven.getDate() + 1);
    }
    
    const diff = nextSeven - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    document.getElementById('countdown-timer').textContent = 
      `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  }
  
  updateTimer();
  setInterval(updateTimer, 1000);
}
