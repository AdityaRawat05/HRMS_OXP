import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/prisma';

describe('POST /api/auth/login', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should successfully log in with valid credentials and return JWT & user info without passwordHash', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@peoplepay360.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Login successful');
    expect(res.body.data).toBeDefined();
    expect(res.body.data.token).toBeDefined();
    expect(typeof res.body.data.token).toBe('string');
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe('admin@peoplepay360.com');
    expect(res.body.data.user.roles).toContain('ADMIN');
    // Crucial security requirement: never return passwordHash
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('should reject nonexistent user with 401 and generic error message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'unknown.user@peoplepay360.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('should reject incorrect password with 401 and generic error message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@peoplepay360.com',
        password: 'WrongPassword999!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('should reject inactive user with 403 status', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'inactive@peoplepay360.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Account is deactivated');
  });

  it('should reject invalid email format with 400 validation error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'not-an-email',
        password: 'Password123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.some((e: any) => e.field === 'email')).toBe(true);
  });

  it('should reject empty / malformed request body with 400 validation error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('should access protected /api/auth/me when provided with valid JWT Bearer token', async () => {
    // 1. Log in to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@peoplepay360.com',
        password: 'Password123!',
      });

    const token = loginRes.body.data.token;

    // 2. Access /api/auth/me
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.user.email).toBe('admin@peoplepay360.com');
  });

  it('should reject /api/auth/me without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
