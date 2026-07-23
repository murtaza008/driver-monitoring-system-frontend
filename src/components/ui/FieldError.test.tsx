import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FieldError from './FieldError';

describe('FieldError', () => {
  it('renders a validation message when provided', () => {
    render(<FieldError message="Company name is required" />);
    expect(screen.getByText('Company name is required')).toBeInTheDocument();
  });
});
