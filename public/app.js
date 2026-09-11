/**
 * Daily Concept Mastery Portal - Frontend Application Controller
 * Enriched with Mermaid.js Diagrams, Detailed Principles Cards, AI Prompts, Toolkits, and 25-Question Assessment Engine.
 */

let currentConcept = null;
let allConcepts = [];
let speechSynth = window.speechSynthesis;
let currentUtterance = null;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Daily Concept Mastery App Initialized.');
  
  initTabNavigation();
  initEventListeners();
  initCountdownTimer();
  await loadTodayConcept();
  await loadConceptsArchive();
});

// Markdown & Code & Math & Mermaid Parser
function formatMarkdown(text) {
  if (!text) return '';
  let html = text;

  // Mermaid Diagrams ```mermaid ... ```
  html = html.replace(/```mermaid([\s\S]*?)```/g, (match, diagram) => {
    return `<div class="mermaid">${diagram.trim()}</div>`;
  });

  // Code blocks ```python ... ```
  html = html.replace(/```(python|js|json|bash)?([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre class="code-block"><code>${escapeHtml(code.trim())}</code></pre>`;
  });

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3 class="md-h3">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="md-h2">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="md-h1">$1</h1>');

  // Math equations $$\text{...}$$ or $...$
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, '<div class="math-block">$1</div>');
  html = html.replace(/\$([^\$\n]+)\$/g, '<span class="inline-math">$1</span>');

  // Bold & Italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Paragraphs
  const paragraphs = html.split('\n\n');
  return paragraphs.map(p => {
    p = p.trim();
    if (p.startsWith('<h') || p.startsWith('<pre') || p.startsWith('<div class="math') || p.startsWith('<div class="mermaid') || p.startsWith('<ul') || p.startsWith('<ol')) {
      return p;
    }
    return `<p class="body-p">${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');
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

// 1. Fetch Today's Active Concept
async function loadTodayConcept() {
  try {
    const response = await fetch('/api/concept/today');
    const data = await response.json();
    currentConcept = data;
    renderConceptDetails(data);
  } catch (err) {
    console.error('❌ Failed to fetch today concept:', err);
  }
}

// 1b. Fetch Specific Concept by ID
async function loadConceptById(id) {
  try {
    const response = await fetch(`/api/concept/${id}`);
    const data = await response.json();
    currentConcept = data;
    renderConceptDetails(data);
  } catch (err) {
    console.error(`❌ Failed to fetch concept ${id}:`, err);
  }
}

// 2. Load Concept Archive
async function loadConceptsArchive() {
  try {
    const response = await fetch('/api/concepts');
    allConcepts = await response.json();
    renderArchiveList(allConcepts);
  } catch (err) {
    console.error('❌ Failed to fetch archive:', err);
  }
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
        mermaid.run({ nodes: document.querySelectorAll('.mermaid') });
      } catch (err) {
        console.log('Mermaid render:', err);
      }
    }
  }, 100);

  // Tab 2: Books with Direct Links
  const booksContainer = document.getElementById('books-container');
  booksContainer.innerHTML = concept.books.map(b => `
    <div class="book-card full-width-card">
      <div class="card-header-flex">
        <div>
          <h3>📚 ${b.title}</h3>
          <div class="book-author">by ${b.author}</div>
        </div>
        ${b.url ? `<a href="${b.url}" target="_blank" class="btn btn-sm btn-accent">Explore Book ↗</a>` : ''}
      </div>
      <div class="book-chapters">🔑 Focus Chapters: ${b.keyChapters}</div>
      <div class="book-summary-body">${formatMarkdown(b.summary)}</div>
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

// 4. Render Quiz Options
function renderQuiz(quizArray) {
  const quizContainer = document.getElementById('quiz-container');
  document.getElementById('quiz-score-banner').className = 'score-banner hidden';
  
  quizContainer.innerHTML = `
    <div class="quiz-header-badge">
      <span>📊 TOTAL ASSESSMENT QUESTIONS: ${quizArray.length}</span>
      <span>Passing Score: 80% (20/25)</span>
    </div>
    ${quizArray.map((q, qIndex) => `
      <div class="quiz-item" data-qindex="${qIndex}">
        <div class="quiz-question">${q.question}</div>
        <div class="quiz-options">
          ${q.options.map((opt, optIndex) => `
            <label class="quiz-option-label">
              <input type="radio" name="quiz-q-${qIndex}" value="${optIndex}">
              <span>${opt}</span>
            </label>
          `).join('')}
        </div>
        <div class="quiz-explanation hidden" id="explanation-${qIndex}"></div>
      </div>
    `).join('')}
  `;
}

// 5. Evaluate Quiz Answers
function evaluateQuiz() {
  if (!currentConcept || !currentConcept.quiz) return;
  
  let score = 0;
  const total = currentConcept.quiz.length;

  currentConcept.quiz.forEach((q, qIndex) => {
    const selected = document.querySelector(`input[name="quiz-q-${qIndex}"]:checked`);
    const expDiv = document.getElementById(`explanation-${qIndex}`);
    expDiv.classList.remove('hidden');

    if (selected && parseInt(selected.value) === q.answer) {
      score++;
      expDiv.innerHTML = `<span style="color: var(--success); font-weight: bold;">✅ Correct!</span> ${q.explanation}`;
    } else {
      expDiv.innerHTML = `<span style="color: var(--danger); font-weight: bold;">❌ Incorrect.</span> Correct Answer: ${q.options[q.answer]}.<br>${q.explanation}`;
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
  // Curriculum Track Selection in Sidebar
  document.querySelectorAll('.track-item').forEach(trackItem => {
    trackItem.addEventListener('click', () => {
      const selectedTrack = trackItem.dataset.track;
      
      const trackConcepts = allConcepts.filter(c => c.track === selectedTrack);
      if (trackConcepts.length > 0) {
        loadConceptById(trackConcepts[0].id);
      }
    });
  });

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
