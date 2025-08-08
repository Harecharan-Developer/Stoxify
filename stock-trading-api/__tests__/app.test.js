const request = require('supertest');
const app = require('../app');

test('GET /api should respond with a 200 status code', async () => {
    const response = await request(app).get('/api');
    expect(response.statusCode).toBe(200);
});

test('POST /api should create a new resource', async () => {
    const response = await request(app).post('/api').send({ name: 'Test' });
    expect(response.statusCode).toBe(201);
    expect(response.body.name).toBe('Test');
});