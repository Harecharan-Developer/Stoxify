const cron = require('node-cron');

describe('Cron Jobs', () => {
	test('should execute cron job as expected', () => {
		const mockFunction = jest.fn();
		const job = cron.schedule('* * * * *', mockFunction);
		job.start();
		expect(mockFunction).toHaveBeenCalled();
		job.stop();
	});
});