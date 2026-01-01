import { render, screen } from '@testing-library/react';
import { FinanceStats } from '../finance-stats';

describe('FinanceStats', () => {
  const mockTransactions = [
    { id: '1', amount: 1000, type: 'income' as const },
    { id: '2', amount: 500, type: 'income' as const },
    { id: '3', amount: 200, type: 'expense' as const },
    { id: '4', amount: 100, type: 'expense' as const },
  ];

  it('calculates total income correctly', () => {
    render(<FinanceStats transactions={mockTransactions} />);
    // 1000 + 500 = 1500. 
    // Match "1500,00" or "1.500,00" and ignore whitespace/currency symbol
    expect(screen.getByText((content) => content.includes('1500,00') || content.includes('1.500,00'))).toBeInTheDocument();
  });

  it('calculates total expense correctly', () => {
    render(<FinanceStats transactions={mockTransactions} />);
    // 200 + 100 = 300
    expect(screen.getByText((content) => content.includes('300,00'))).toBeInTheDocument();
  });

  it('calculates balance correctly', () => {
    render(<FinanceStats transactions={mockTransactions} />);
    // 1500 - 300 = 1200
    expect(screen.getByText((content) => content.includes('1200,00') || content.includes('1.200,00'))).toBeInTheDocument();
  });

  it('handles empty transactions', () => {
    render(<FinanceStats transactions={[]} />);
    
    // Should show 0 for all
    const zeros = screen.getAllByText((content) => content.includes('0,00'));
    expect(zeros.length).toBeGreaterThanOrEqual(3);
  });
  
  it('displays negative balance with red color class', () => {
     const negativeTransactions = [
         { id: '1', amount: 100, type: 'income' as const },
         { id: '2', amount: 200, type: 'expense' as const },
     ];
     
     render(<FinanceStats transactions={negativeTransactions} />);
     
     // Balance should be -100
     const balanceElement = screen.getByText((content) => content.includes('-100,00'));
     expect(balanceElement).toBeInTheDocument();
     expect(balanceElement).toHaveClass('text-red-600');
  });
});
