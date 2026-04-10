const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

// Provide required env vars so app bootstraps predictably in CI/local tests.
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/test";

const app = require("../src/app");

test("GET / returns API metadata", async () => {
  const res = await request(app).get("/");

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.match(res.body.message, /AI Train Traffic Control System API/i);
});

test("Unknown route returns 404 JSON response", async () => {
  const res = await request(app).get("/api/this-route-does-not-exist");

  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /not found/i);
});

test("GET /api/traffic/dashboard requires authentication", async () => {
  const res = await request(app).get("/api/traffic/dashboard");

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /authentication required/i);
});

test("GET /api/ai/history requires authentication", async () => {
  const res = await request(app).get("/api/ai/history");

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /authentication required/i);
});
