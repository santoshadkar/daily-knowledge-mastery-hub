const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

const { curriculumData } = require('./src/data/curriculum');
const emailService = require('./src/services/emailService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// URL Normalization Middleware for Vercel Serverless Function Rewrites
app.use((req, res, next) => {
  if (process.env.VERCEL) {
    if (req.url.startsWith('/concept') || req.url.startsWith('/history') || req.url.startsWith('/email') || req.url.startsWith('/cron')) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Application State & Daily Learning History
let activeConceptIndex = 0;
let userNotesStore = {};
let lastRotationTimestamp = new Date().toISOString();

// Daily Learning Log History Array
let learningHistoryLog = [
  {
    timestamp: new Date().toISOString(),
    conceptId: curriculumData[0].id,
    title: curriculumData[0].title,
    track: curriculumData[0].track,
    event: 'Initial Portal Launch'
  }
];

// Helper to determine today's active concepts across ALL 3 tracks
function getTodayConcepts() {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  
  const aiTracks = curriculumData.filter(c => c.track === 'Artificial Intelligence');
  const agileTracks = curriculumData.filter(c => c.track === 'Agile Coaching');
  const softTracks = curriculumData.filter(c => c.track === 'Leadership & Soft Skills');

  const aiIndex = (dayOfYear + activeConceptIndex) % Math.max(1, aiTracks.length);
  const agileIndex = (dayOfYear + activeConceptIndex) % Math.max(1, agileTracks.length);
  const softIndex = (dayOfYear + activeConceptIndex) % Math.max(1, softTracks.length);

  return [
    aiTracks[aiIndex] || curriculumData[0],
    agileTracks[agileIndex] || curriculumData[1],
    softTracks[softIndex] || curriculumData[2]
  ];
}

function getTodayConcept() {
  return getTodayConcepts()[0];
}

// 7:00 AM Cron Job Scheduler (Runs in traditional node environments; Vercel uses Vercel Cron Jobs via /api/cron/renew)
const cronSchedule = process.env.DAILY_RENEWAL_CRON || '0 7 * * *';
if (!process.env.VERCEL) {
  cron.schedule(cronSchedule, async () => {
    console.log('⏰ 07:00 AM Triggered! Renewing daily concepts and sending 3-Track Morning Digest email...');
    activeConceptIndex = (activeConceptIndex + 1) % curriculumData.length;
    lastRotationTimestamp = new Date().toISOString();
    
    const todayConcepts = getTodayConcepts();
    const emailResult = await emailService.sendMorningDigest(todayConcepts);

    // Record in History Log
    todayConcepts.forEach(concept => {
      learningHistoryLog.push({
        timestamp: lastRotationTimestamp,
        conceptId: concept.id,
        title: concept.title,
        track: concept.track,
        event: '7:00 AM Scheduled Renewal & Morning Mail Dispatched',
        emailStatus: emailResult.success ? 'Sent' : 'Failed'
      });
    });

    console.log(`✨ Concepts Renewed for AI, Agile, and Soft Skills.`);
    console.log(`📧 Email Status:`, emailResult);
  });
}

// REST API Endpoints

// 0. API Root Status Summary
app.get(['/api', '/api/'], (req, res) => {
  res.json({
    status: "online",
    service: "Daily Concept Mastery Portal API",
    version: "1.0.0",
    endpoints: {
      todayConcepts: "/api/concept/today",
      conceptsArchive: "/api/concepts",
      learningHistory: "/api/history",
      triggerEmail: "/api/email/trigger (POST)",
      cronRenew: "/api/cron/renew"
    }
  });
});

// 1. Get Today's Active Concepts
app.get('/api/concept/today', (req, res) => {
  const todayConcepts = getTodayConcepts();
  let concept = todayConcepts[0]; // Default to AI

  if (req.query.track) {
    const found = todayConcepts.find(c => c.track.toLowerCase().includes(req.query.track.toLowerCase()));
    if (found) concept = found;
  }

  const notes = userNotesStore[concept.id] || '';
  res.json({
    ...concept,
    userNotes: notes,
    todayConcepts,
    lastRotation: lastRotationTimestamp,
    totalConceptsCount: curriculumData.length,
    currentIndex: (curriculumData.findIndex(c => c.id === concept.id) + 1)
  });
});

// 1b. Get Concept by ID
app.get('/api/concept/:id', (req, res) => {
  const concept = curriculumData.find(c => c.id === req.params.id);
  if (!concept) {
    return res.status(404).json({ error: 'Concept not found' });
  }
  const notes = userNotesStore[concept.id] || '';
  res.json({
    ...concept,
    userNotes: notes,
    totalConceptsCount: curriculumData.length,
    currentIndex: (curriculumData.findIndex(c => c.id === concept.id) + 1)
  });
});

// 2. Get All Concepts Archive
app.get('/api/concepts', (req, res) => {
  res.json(curriculumData.map(c => ({
    id: c.id,
    track: c.track,
    title: c.title,
    tagline: c.tagline,
    estimatedTime: c.estimatedTime
  })));
});

// 2b. Get Daily Learning History Log
app.get('/api/history', (req, res) => {
  res.json({
    historyLog: learningHistoryLog,
    totalConceptsCovered: learningHistoryLog.length
  });
});

// 3. Manually Rotate Daily Concept (Admin / Test simulation button)
app.post('/api/concept/rotate', async (req, res) => {
  activeConceptIndex = (activeConceptIndex + 1) % curriculumData.length;
  lastRotationTimestamp = new Date().toISOString();
  const newConcept = getTodayConcept();

  learningHistoryLog.push({
    timestamp: lastRotationTimestamp,
    conceptId: newConcept.id,
    title: newConcept.title,
    track: newConcept.track,
    event: 'Manual Rotation'
  });

  res.json({
    message: "Concept rotated successfully to next concept in queue.",
    concept: newConcept
  });
});

// 3b. Vercel Cron 7:00 AM Endpoint Trigger
app.get('/api/cron/renew', async (req, res) => {
  activeConceptIndex = (activeConceptIndex + 1) % curriculumData.length;
  lastRotationTimestamp = new Date().toISOString();
  const todayConcepts = getTodayConcepts();
  
  const targetEmail = process.env.SUBSCRIBER_EMAIL || 'santoshadkar@gmail.com';
  const emailResult = await emailService.sendMorningDigest(todayConcepts, targetEmail);

  todayConcepts.forEach(concept => {
    learningHistoryLog.push({
      timestamp: lastRotationTimestamp,
      conceptId: concept.id,
      title: concept.title,
      track: concept.track,
      event: 'Vercel Cron 7:00 AM Daily Renewal',
      emailStatus: emailResult.success ? 'Sent' : 'Failed'
    });
  });

  res.json({
    success: true,
    message: "Vercel Cron 7:00 AM Daily Renewal Completed",
    todayConcepts,
    emailResult
  });
});

// 4. Trigger Email Notification (Instant preview test)
app.post('/api/email/trigger', async (req, res) => {
  const { recipient } = req.body;
  const concepts = getTodayConcepts();
  const targetEmail = recipient || process.env.SUBSCRIBER_EMAIL || 'ananya@example.com';
  
  try {
    const result = await emailService.sendMorningDigest(concepts, targetEmail);
    res.json({
      success: true,
      message: `3-Track Morning Digest trigger completed for ${targetEmail}`,
      conceptsCount: concepts.length,
      previewUrl: result.previewUrl
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// 5. Save User Notes for Concept
app.post('/api/concept/:id/notes', (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  userNotesStore[id] = notes;
  res.json({
    success: true,
    message: "Notes saved successfully.",
    id,
    notes
  });
});

// Serve frontend SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: `API route ${req.path} not found` });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server if launched directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Daily Concept Mastery Portal running at http://localhost:3000`);
    console.log(`⏰ Daily 7:00 AM Cron Renewal scheduled with pattern: "${cronSchedule}"`);
  });
}

module.exports = app;
