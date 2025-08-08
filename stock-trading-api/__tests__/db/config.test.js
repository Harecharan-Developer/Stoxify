const db = require('../../db/config');

test('database connection should be established', async () => {
    const connection = await db.connect();
    expect(connection).toBeTruthy();
});