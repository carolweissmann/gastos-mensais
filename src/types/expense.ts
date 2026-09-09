export type ExpenseCategory =
  | 'Alimentação'
  | 'Transporte'
  | 'Moradia'
  | 'Lazer'
  | 'Saúde'
  | 'Educação'
  | 'Outros';

export type ExpenseType = 'Fixa' | 'Variável';

export type Expense = {
  id: string;
  description: string;
  value: number;
  category: ExpenseCategory;
  date: string;
  type: ExpenseType;
};