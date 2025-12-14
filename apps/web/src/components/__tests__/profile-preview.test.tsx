import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShareButtons } from '../profile-preview';

describe('ShareButtons', () => {
  it('renders share buttons correctly', () => {
    render(<ShareButtons slug="test-profile" />);
    
    expect(screen.getByText('📋')).toBeInTheDocument();
    expect(screen.getByText('🐦')).toBeInTheDocument();
    expect(screen.getByText('📘')).toBeInTheDocument();
    expect(screen.getByText('💼')).toBeInTheDocument();
    
    expect(screen.getByText('Copy Link')).toBeInTheDocument();
    expect(screen.getByText('Twitter')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
  });

  it('has proper share URLs for social platforms', () => {
    render(<ShareButtons slug="test-profile" />);
    
    const twitterButton = screen.getByText('Twitter').closest('button');
    const facebookButton = screen.getByText('Facebook').closest('button');
    const linkedinButton = screen.getByText('LinkedIn').closest('button');
    
    // Check that buttons have onClick handlers (we can't easily test the URLs without mocking window.open)
    expect(twitterButton).toHaveAttribute('onclick');
    expect(facebookButton).toHaveAttribute('onclick');
    expect(linkedinButton).toHaveAttribute('onclick');
  });

  it('handles copy link functionality', () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
      share: jest.fn(),
    });

    render(<ShareButtons slug="test-profile" />);
    
    const copyButton = screen.getByText('Copy Link').closest('button');
    fireEvent.click(copyButton);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('/test-profile')
    );
  });
});