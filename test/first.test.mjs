import assert from 'assert';
import request from 'supertest';
import { createApp } from '../app.js';

describe('Backend Tests', function () {
  let app;

  // Create a fresh instance of the app before tests run
  before(() => {
    app = createApp();
  });

  describe('Root Route', function () {
    it('should return 200 for the root route', async function () {
      const response = await request(app).get('/');
      assert.strictEqual(response.status, 200);
      assert(response.text.includes('Welcome'));
    });
  });

  describe('Health Check Route', function () {
    it('should return 200 and OK for the /status route', async function () {
      const response = await request(app).get('/status');
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.text, 'OK');
    });
  });

  describe('Invalid Routes', function () {
    it('should return 404 for an unknown route', async function () {
      const response = await request(app).get('/unknown-route');
      assert.strictEqual(response.status, 404);
      assert(response.text.includes('Not Found'));
    });
  });

  describe('Input Validation', function () {
    it('should return 400 for invalid query parameter', async function () {
      const response = await request(app).get('/home?title=123');
      // Expect a 400 error because "123" is numeric.
      assert.strictEqual(response.status, 400);
      assert(response.body.errors.some(e => e.msg === 'Title must be a string'));
    });

    it('should return 200 for valid query parameter', async function () {
      const response = await request(app).get('/home?title=Test');
      assert.strictEqual(response.status, 200);
      assert(response.text.includes('Test'));
    });
  });
});
