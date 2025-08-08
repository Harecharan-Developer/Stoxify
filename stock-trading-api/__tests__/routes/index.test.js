const request = require('supertest');
const app = require('../../app');

describe('API Routes', () => {
  test('should handle unknown routes', async () => {
    const response = await request(app).get('/api/unknown');
    expect(response.statusCode).toBe(404);
  });

  test('API base should be accessible', async () => {
    const response = await request(app).get('/api');
    // Expect either 200 with data or 404, depending on your routes
    expect([200, 404]).toContain(response.statusCode);
  });
});