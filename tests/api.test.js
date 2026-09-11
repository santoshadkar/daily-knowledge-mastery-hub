const request = require('supertest');
const app = require('../server');

describe('Daily Concept Mastery Portal API Integration Tests', () => {
  
  test('GET /api/concept/today returns active concept with full study payload', async () => {
    const res = await request(app).get('/api/concept/today');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('track');
    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('overview');
    expect(res.body).toHaveProperty('corePrinciples');
    expect(Array.isArray(res.body.corePrinciples)).toBe(true);
    expect(res.body).toHaveProperty('todayConcepts');
    expect(Array.isArray(res.body.todayConcepts)).toBe(true);
  });

  test('GET /api/concepts returns concept archive list', async () => {
    const res = await request(app).get('/api/concepts');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('track');
  });

  test('POST /api/concept/rotate advances active concept state', async () => {
    const rotateRes = await request(app).post('/api/concept/rotate');
    expect(rotateRes.statusCode).toEqual(200);
    expect(rotateRes.body.concept).toBeDefined();
  });

  test('POST /api/concept/:id/notes saves user personal notes', async () => {
    const conceptId = 'ai-01';
    const testNotes = 'Mastering multi-head attention matrix dot products today.';
    
    const saveRes = await request(app)
      .post(`/api/concept/${conceptId}/notes`)
      .send({ notes: testNotes });
      
    expect(saveRes.statusCode).toEqual(200);
    expect(saveRes.body.success).toBe(true);
  });

  test('POST /api/email/trigger dispatches 3-track morning digest test email', async () => {
    const res = await request(app)
      .post('/api/email/trigger')
      .send({ recipient: 'test@example.com' });
      
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.previewUrl).toBeDefined();
  });

});

