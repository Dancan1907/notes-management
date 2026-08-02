// backend/test/setup.ts
// This file runs before tests to set up the test environment

// Increase timeout for integration tests
jest.setTimeout(120000);

// Suppress console.log during tests (optional)
// jest.spyOn(console, 'log').mockImplementation(() => {});
// jest.spyOn(console, 'error').mockImplementation(() => {});
