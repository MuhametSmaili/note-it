import { render, screen } from '@testing-library/react';
import { Spinner } from '../Spinner';

describe('spinner component', () => {
  it('should render with loading text ', async () => {
    render(<Spinner />);

    const result = screen.queryByText('Loading');

    expect(result).toBeInTheDocument();
  });
});
