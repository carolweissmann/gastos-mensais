import './style.css';
import type { Expense } from './types/expense';
import type { ExpenseCategory, ExpenseType } from './types/expense';
import { formatCurrency } from './utils/formatCurrency';
import { saveExpenses, loadExpenses } from './services/storage';
import { formatDate } from './utils/formatDate';

let expenses: Expense[] = loadExpenses();
let editingId: string | null = null;
let currentFilter: string = 'Todos';

const LIMITE = 3000;

// Elementos do HTML
const btnAdicionar = document.getElementById('btn-adicionar')!;
const btnCancelar = document.getElementById('btn-cancelar')!;
const btnSalvar = document.getElementById('btn-salvar')!;
const formSection = document.getElementById('form-section')!;
const expenseList = document.getElementById('expense-list')!;
const emptyState = document.getElementById('empty-state')!;
const totalGasto = document.getElementById('total-gasto')!;
const disponivelEl = document.getElementById('disponivel')!;
const percentualEl = document.getElementById('percentual')!;
const categoriesList = document.getElementById('categories-list')!;

const inputDescricao = document.getElementById('descricao') as HTMLInputElement;
const inputValor = document.getElementById('valor') as HTMLInputElement;
const inputCategoria = document.getElementById('categoria') as HTMLSelectElement;
const inputData = document.getElementById('data') as HTMLInputElement;
const inputTipo = document.getElementById('tipo') as HTMLSelectElement;
const filtroCategoria = document.getElementById('filtro-categoria') as HTMLSelectElement;

function renderDashboard() {
  const total = expenses.reduce((acc, exp) => acc + exp.value, 0);
  const disponivel = LIMITE - total;
  const percentual = Math.min(Math.round((total / LIMITE) * 100), 100);

  disponivelEl.textContent = formatCurrency(disponivel);
  percentualEl.textContent = `${percentual}%`;

  if (percentual >= 90) {
    percentualEl.style.color = '#dc2626';
  } else if (percentual >= 70) {
    percentualEl.style.color = '#f59e0b';
  } else {
    percentualEl.style.color = '#16a34a';
  }

  const byCategory: Record<string, number> = {};
  expenses.forEach((exp) => {
    byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.value;
  });

  categoriesList.innerHTML = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([category, value]) => {
      const pct = Math.round((value / total) * 100);
      return `
        <li class="category-item">
          <div style="flex: 1">
            <div style="display: flex; justify-content: space-between">
              <span>${category}</span>
              <strong>${formatCurrency(value)}</strong>
            </div>
            <div class="category-bar" style="width: ${pct}%"></div>
          </div>
        </li>
      `;
    }).join('');
}

function renderExpenses() {
  expenseList.innerHTML = '';

  const filtered = currentFilter === 'Todos'
    ? expenses
    : expenses.filter((exp) => exp.category === currentFilter);

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    saveExpenses(expenses);
    renderDashboard();
    return;
  }

  emptyState.classList.add('hidden');

  expenseList.innerHTML = filtered.map((expense) => `
    <li class="expense-item" data-id="${expense.id}">
      <div class="expense-info">
        <strong>${expense.description}</strong>
        <span>${expense.category} • ${expense.type} • ${formatDate(expense.date)}</span>
      </div>
      <div class="expense-actions">
        <span class="expense-value">${formatCurrency(expense.value)}</span>
        <button class="btn-editar" data-id="${expense.id}">Editar</button>
        <button class="btn-excluir" data-id="${expense.id}">Excluir</button>
      </div>
    </li>
  `).join('');

  document.querySelectorAll('.btn-excluir').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = (e.target as HTMLElement).dataset.id;
      expenses = expenses.filter((expense) => expense.id !== id);
      renderExpenses();
    });
  });

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

  // Atualizar total e dashboard
  const total = expenses.reduce((acc, expense) => acc + expense.value, 0);
  totalGasto.textContent = formatCurrency(total);
  renderDashboard();
}

btnAdicionar.addEventListener('click', () => {
  formSection.classList.remove('hidden');
});

btnCancelar.addEventListener('click', () => {
  formSection.classList.add('hidden');
});

btnSalvar.addEventListener('click', () => {
  if (!inputDescricao.value.trim()) {
    alert('Preencha a descrição!');
    return;
  }
  if (!inputValor.value || Number(inputValor.value) <= 0) {
    alert('Preencha um valor válido!');
    return;
  }
  if (!inputData.value) {
    alert('Preencha a data!');
    return;
  }

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

  inputDescricao.value = '';
  inputValor.value = '';
  inputCategoria.value = 'Alimentação';
  inputData.value = '';
  inputTipo.value = 'Fixa';

  renderExpenses();
  formSection.classList.add('hidden');
});

filtroCategoria.addEventListener('change', () => {
  currentFilter = filtroCategoria.value;
  renderExpenses();
});

renderExpenses();