import type { Expense } from '../types/expense';

const KEY = 'gastos-mensais';

export function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(KEY, JSON.stringify(expenses));
}

export function loadExpenses(): Expense[] {
  const data = localStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
}

const KEY_FIXOS = 'gastos-fixos';

export type GastoFixo = {
  id: string;
  description: string;
  value: number;
  category: string;
};

export function saveFixos(fixos: GastoFixo[]): void {
  localStorage.setItem(KEY_FIXOS, JSON.stringify(fixos));
}

export function loadFixos(): GastoFixo[] {
  const data = localStorage.getItem(KEY_FIXOS);
  return data ? JSON.parse(data) : [];
}