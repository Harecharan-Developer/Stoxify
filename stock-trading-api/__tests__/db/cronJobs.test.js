const updateStockPrices = require('../../db/cronJobs');

// Mock the database
jest.mock('../../db/config', () => ({
  execute: jest.fn().mockResolvedValue([[], {}]),
  query: jest.fn().mockResolvedValue([[], {}])
}));

describe('Cron Jobs', () => {
  test('updateStockPrices function should be defined', () => {
    expect(updateStockPrices).toBeDefined();
    expect(typeof updateStockPrices).toBe('function');
  });

  test('should handle updateStockPrices execution', async () => {
    // Test that the function can be called without errors
    await expect(updateStockPrices()).resolves.not.toThrow();
  });
});