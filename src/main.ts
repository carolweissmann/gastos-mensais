import './style.css';
import type { Expense } from './types/expense';
import type { ExpenseCategory, ExpenseType } from './types/expense';
import { formatCurrency } from './utils/formatCurrency';
import { saveExpenses, loadExpenses } from './services/storage';

let expenses: Expense[] = loadExpenses();
let editingId: string | null = null;
let currentFilter: string = 'Todos';

// Elementos do HTML
const btnAdicionar = document.getElementById('btn-adicionar')!;
const btnCancelar = document.getElementById('btn-cancelar')!;
const btnSalvar = document.getElementById('btn-salvar')!;
const formSection = document.getElementById('form-section')!;
const expenseList = document.getElementById('expense-list')!;
const emptyState = document.getElementById('empty-state')!;
const totalGasto = document.getElementById('total-gasto')!;

const inputDescricao = document.getElementById('descricao') as HTMLInputElement;
const inputValor = document.getElementById('valor') as HTMLInputElement;
const inputCategoria = document.getElementById('categoria') as HTMLSelectElement;
const inputData = document.getElementById('data') as HTMLInputElement;
const inputTipo = document.getElementById('tipo') as HTMLSelectElement;
const filtroCategoria = document.getElementById('filtro-categoria') as HTMLSelectElement;

// Renderizar gastos na tela
function renderExpenses() {
  expenseList.innerHTML = '';

  const filtered = currentFilter === 'Todos'
    ? expenses
    : expenses.filter((exp) => exp.category === currentFilter);

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    saveExpenses(expenses);
    return;
  }

  emptyState.classList.add('hidden');

  expenseList.innerHTML = filtered.map((expense) => `
    <li class="expense-item" data-id="${expense.id}">
      <div class="expense-info">
        <strong>${expense.description}</strong>
        <span>${expense.category} • ${expense.type} • ${expense.date}</span>
      </div>
      <div class="expense-actions">
        <span class="expense-value">${formatCurrency(expense.value)}</span>
        <button class="btn-editar" data-id="${expense.id}">Editar</button>
        <button class="btn-excluir" data-id="${expense.id}">Excluir</button>
      </div>
    </li>
  `).join('');

  // Eventos de excluir
  document.querySelectorAll('.btn-excluir').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = (e.target as HTMLElement).dataset.id;
      expenses = expenses.filter((expense) => expense.id !== id);
      renderExpenses();
    });
  });

  // Eventos de editar
  document.querySelectorAll('.btn-editar').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = (e.target as HTMLElement).dataset.id;
      const expense = expenses.find((exp) => exp.id === id);
      if (!expense) return;

      editingId = id!;
      inputDescricao.value = expense.description;
      inputValor.value = String(expense.value);
      inputCategoria.value = expense.category;
      inputData.value = expense.date;
      inputTipo.value = expense.type;

      formSection.classList.remove('hidden');
    });
  });

  // Salvar no localStorage
  saveExpenses(expenses);

  // Atualizar total
  const total = expenses.reduce((acc, expense) => acc + expense.value, 0);
  totalGasto.textContent = formatCurrency(total);
}

// Mostrar formulário
btnAdicionar.addEventListener('click', () => {
  formSection.classList.remove('hidden');
});

// Esconder formulário
btnCancelar.addEventListener('click', () => {
  formSection.classList.add('hidden');
});

// Salvar gasto
btnSalvar.addEventListener('click', () => {
  if (editingId) {
    expenses = expenses.map((exp) =>
      exp.id === editingId
        ? {
            ...exp,
            description: inputDescricao.value,
            value: Number(inputValor.value),
            category: inputCategoria.value as ExpenseCategory,
            date: inputData.value,
            type: inputTipo.value as ExpenseType,
          }
        : exp
    );
    editingId = null;
  } else {
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      description: inputDescricao.value,
      value: Number(inputValor.value),
      category: inputCategoria.value as ExpenseCategory,
      date: inputData.value,
      type: inputTipo.value as ExpenseType,
    };
    expenses.push(newExpense);
  }

  renderExpenses();
  formSection.classList.add('hidden');
});

// Filtro por categoria
filtroCategoria.addEventListener('change', () => {
  currentFilter = filtroCategoria.value;
  renderExpenses();
});

// Iniciar o app
renderExpenses();