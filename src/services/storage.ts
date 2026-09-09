import type { Expense } from '../types/expense';

const KEY = 'gastos-mensais';

export function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(KEY, JSON.stringify(expenses));
}

export function loadExpenses(): Expense[] {
  const data = localStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
}