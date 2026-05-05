const request = require('supertest');
const app = require('../app');

describe('Auth Endpoints', () => {
  it('should return 400 for invalid email on login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'invalid-email', password: '123456' });
    expect(res.statusCode).toBe(400);
  });
});
