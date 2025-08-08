const db = require('../../db/config');

test('database config should be defined', () => {
    expect(db).toBeDefined();
    expect(typeof db.execute).toBe('function');
    expect(typeof db.query).toBe('function');
});

test('database should have proper connection methods', () => {
    // Test that db has the methods we expect
    expect(db.execute).toBeDefined();
    expect(db.query).toBeDefined();
    expect(typeof db.execute).toBe('function');
    expect(typeof db.query).toBe('function');
});