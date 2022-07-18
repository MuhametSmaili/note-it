import { render, screen } from '@testing-library/react';
import TabContent from '../TabContent';

describe('TabContent', () => {
  it('should not render children if it`s inactive', () => {
    render(
      <TabContent isActive={false}>
        <p>Should not be visible</p>
      </TabContent>,
    );

    expect(screen.queryByText('Should not be visible')).not.toBeInTheDocument();
  });

  it('should render children for active props', () => {
    render(
      <TabContent isActive={true}>
        <p>Should be visible</p>
      </TabContent>,
    );

    expect(screen.queryByText('Should be visible')).toBeInTheDocument();
  });
});
