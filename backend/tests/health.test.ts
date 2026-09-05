import request from 'supertest';
import app from '../src/app';

describe('GET /api/health', () => {
  it('should return 200 and successful health check payload', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      success: true,
      message: 'PeoplePay360 API is running',
    });
  });
});
