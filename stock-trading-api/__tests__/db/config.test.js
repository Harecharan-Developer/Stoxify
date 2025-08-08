const db = require('../../db/config');

test('database config should be defined', () => {
    expect(db).toBeDefined();
    expect(typeof db.execute).toBe('function');
    expect(typeof db.query).toBe('function');
});

test('database should have proper configuration', () => {
    expect(db.config).toBeDefined();
    expect(db.config.host).toBeDefined();
    expect(db.config.database).toBeDefined();
});