const request = require('supertest');
const app = require('../app');

describe('App Tests', () => {
  test('should respond to health check', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('OK');
  });

  test('should serve static files', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
  });
});