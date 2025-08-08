const request = require('supertest');
const app = require('../../app');

describe('GET /api/routes', () => {
    it('should respond with a 200 status and JSON data', async () => {
        const response = await request(app).get('/api/routes');
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(/json/);
    });
});