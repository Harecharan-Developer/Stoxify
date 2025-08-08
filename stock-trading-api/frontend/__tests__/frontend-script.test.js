const { render, screen } = require('@testing-library/react');
const FrontendScript = require('../frontend-script');

test('hello world!', () => {
	render(<FrontendScript />);
	const linkElement = screen.getByText(/hello world/i);
	expect(linkElement).toBeInTheDocument();
});