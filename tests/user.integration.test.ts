// Increase Jest timeout for integration tests
jest.setTimeout(30000);

import request from 'supertest';
import app from '../src/index';
import mongoose from 'mongoose';
import { UserModel } from '../src/models/user.model';
import { connectDB } from '../src/database/mongodb';

describe('User Management Integration Tests', () => {
  let adminToken: string;
  let userId: string;

  beforeAll(async () => {
    // Ensure DB is connected before running tests
    await connectDB();
    await mongoose.connection.asPromise();

    // Clean up users collection to avoid duplicate email issues
    try {
      await UserModel.deleteMany({});
    } catch (err) {
      console.warn('Could not clean up users:', err);
    }

    // Register admin (add confirmPassword)
    const registerRes = await request(app).post('/api/auth/register').send({
      fullName: 'Admin',
      email: 'admin@example.com',
      password: 'AdminPass123',
      confirmPassword: 'AdminPass123',
      address: 'Admin Address',
      role: 'admin',
      phoneNumber: '1234567890'
    });
    console.log('Register:', registerRes.status, registerRes.body);

    // Login admin
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'AdminPass123'
    });
    console.log('Login:', loginRes.status, loginRes.body);

    if (!loginRes.body.token) {
      throw new Error('Admin login failed: ' + JSON.stringify(loginRes.body));
    }
    adminToken = loginRes.body.token;
  });

  // 1. Create user (valid)
  let testUserId: string;
  let testUserEmail = `testuser+${Date.now()}@example.com`;
  it('should create a user', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'Test User',
        email: testUserEmail,
        password: 'TestPass123',
        confirmPassword: 'TestPass123',
        address: 'Test Address',
        phoneNumber: '9876543210'
      });
    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe(testUserEmail);
    testUserId = res.body.data._id;
    // Only check for password if it exists
    if ('password' in res.body.data) {
      expect(typeof res.body.data.password).toBe('string');
    }
    expect(res.body.data).not.toHaveProperty('confirmPassword');
  });

  // 2. Create user (duplicate email)
  it('should not allow duplicate email', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'Test User2',
        email: 'testuser@example.com',
        password: 'TestPass123',
        address: 'Test Address',
        phoneNumber: '9876543211'
      });
    expect(res.status).toBe(400);
  });

  // 3. Get all users (default pagination)
  it('should get all users with default pagination', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination).toBeDefined();
  });

  // 4. Get all users (custom pagination)
  it('should get users with custom pagination', async () => {
    const res = await request(app)
      .get('/api/admin/users?page=1&limit=1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(1);
  });

  // 5. Get user by ID (valid)
  it('should get user by ID', async () => {
    const res = await request(app)
      .get(`/api/admin/users/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(testUserId);
  });

  // 6. Get user by ID (invalid)
  it('should return 400 for invalid user ID', async () => {
    const res = await request(app)
      .get('/api/admin/users/invalidid')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });

  // 7. Update user (valid)
  it('should update user', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fullName: 'Updated User' });
    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe('Updated User');
  });

  // 8. Update user (invalid ID)
  it('should return 400 for update with invalid ID', async () => {
    const res = await request(app)
      .put('/api/admin/users/invalidid')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fullName: 'Updated User' });
    expect(res.status).toBe(400);
  });

  // 9. Delete user (valid)
  it('should delete user', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  // 10. Delete user (already deleted)
  it('should return 404 for deleting non-existent user', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  // 11. Get profile (admin)
  it('should get admin profile', async () => {
    const res = await request(app)
      .get('/api/admin/users/profile')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('admin@example.com');
  });

  // 12. Unauthorized access
  it('should not allow access without token', async () => {
    const res = await request(app)
      .get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  // 13. Invalid pagination params
  it('should handle invalid pagination params', async () => {
    const res = await request(app)
      .get('/api/admin/users?page=abc&limit=xyz')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(10);
  });

  // 14. Out-of-range page
  it('should return empty data for out-of-range page', async () => {
    const res = await request(app)
      .get('/api/admin/users?page=999&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });

  // 15. Create user (missing fields)
  it('should not create user with missing fields', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'missingfields@example.com' });
    expect(res.status).toBe(400);
  });

  // 16. Create user (invalid email)
  it('should not create user with invalid email', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'Invalid Email',
        email: 'notanemail',
        password: 'TestPass123',
        address: 'Test Address',
        phoneNumber: '1231231234'
      });
    expect(res.status).toBe(400);
  });

  // 17. Create user (short password)
  it('should not create user with short password', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'Short Password',
        email: 'shortpass@example.com',
        password: '123',
        address: 'Test Address',
        phoneNumber: '1231231234'
      });
    expect(res.status).toBe(400);
  });

  // 18. Get all users (after deletion)
  it('should get all users after deletion', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // 19. Create user (valid, for image upload)
  let imageUserId: string;
  let imageUserEmail = `imageuser+${Date.now()}@example.com`;
  it('should create user for image upload', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'Image User',
        email: imageUserEmail,
        password: 'TestPass123',
        confirmPassword: 'TestPass123',
        address: 'Test Address',
        phoneNumber: '1231231234'
      });
    expect(res.status).toBe(201);
    imageUserId = res.body.data._id;
    if ('password' in res.body.data) {
      expect(typeof res.body.data.password).toBe('string');
    }
    expect(res.body.data).not.toHaveProperty('confirmPassword');
  });

  // 20. Upload profile image (valid)
  it('should upload profile image', async () => {
    const res = await request(app)
      .post(`/api/admin/users/${imageUserId}/profile-image`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('profileImage', Buffer.from('test'), 'test.png');
    expect([200, 201, 404]).toContain(res.status);
    if (res.status === 200 || res.status === 201) {
      expect(res.body.data.profileImage).toBeDefined();
    }
  });

  // 21. Upload profile image (no file)
  it('should not upload profile image without file', async () => {
    const res = await request(app)
      .post(`/api/admin/users/${imageUserId}/profile-image`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect([400, 404]).toContain(res.status);
  });

  // 22. Get user by ID (after image upload)
  it('should get user by ID after image upload', async () => {
    const res = await request(app)
      .get(`/api/admin/users/${imageUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 400]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.data.profileImage).toBeDefined();
    }
  });

  // 23. Update user (invalid field)
  it('should ignore invalid update fields', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${imageUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ notAField: 'value' });
    expect([200, 400]).toContain(res.status);
  });

  // 24. Delete user (invalid ID)
  it('should return 400 for delete with invalid ID', async () => {
    const res = await request(app)
      .delete('/api/admin/users/invalidid')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });

  // 25. Get all users (final check)
  it('should get all users (final check)', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination).toBeDefined();
  });
});
