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

  const total2 = expenses.reduce((acc, exp) => acc + exp.value, 0);

  categoriesList.innerHTML = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([category, value]) => {
      const pct = Math.round((value / total2) * 100);
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

function renderChart() {
  const container = document.getElementById('chart-gastos-container');
  if (!container) return;

  const byMonth: Record<string, number> = {};
  expenses.forEach((exp) => {
    const [year, month] = exp.date.split('-');
    const key = `${month}/${year}`;
    byMonth[key] = (byMonth[key] || 0) + exp.value;
  });

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const allKeys = new Set([
    ...Object.keys(byMonth),
    `${String(currentMonth + 1).padStart(2, '0')}/${currentYear}`,
  ]);

  const months = Array.from(allKeys)
    .sort((a, b) => {
      const [ma, ya] = a.split('/');
      const [mb, yb] = b.split('/');
      return new Date(`${ya}-${ma}-01`).getTime() - new Date(`${yb}-${mb}-01`).getTime();
    })
    .map((key) => {
      const [m, y] = key.split('/');
      const d = new Date(parseInt(y), parseInt(m) - 1, 1);
      return {
        key,
        label: monthNames[d.getMonth()],
        value: byMonth[key] || 0,
        isActive: d.getMonth() === currentMonth && parseInt(y) === currentYear,
      };
    });

  const chartTotal = document.getElementById('chart-total');
  if (chartTotal) {
    const currentMonthTotal = months.find(m => m.isActive)?.value || 0;
    chartTotal.textContent = formatCurrency(currentMonthTotal);
  }

  const maxValue = Math.max(...months.map(m => m.value), 1);
  const barWidth = 40;
  const gap = 16;
  const chartHeight = 100;
  const totalWidth = months.length * (barWidth + gap);

  const bars = months.map(({ label, value, isActive }, i) => {
    const h = value > 0 ? Math.max(Math.round((value / maxValue) * chartHeight), 8) : 12;
    const x = i * (barWidth + gap);
    const y = chartHeight - h;
    const fill = isActive ? 'url(#blueGradient)' : 'rgba(0,0,0,0.07)';
    const shadow = isActive ? 'filter: drop-shadow(0 4px 8px rgba(37,99,235,0.35))' : '';
    const labelColor = isActive ? '#2563eb' : 'rgba(0,0,0,0.3)';
    const fontWeight = isActive ? '600' : '400';

    return `
      <g>
        <rect x="${x}" y="${y}" width="${barWidth}" height="${h}" rx="6" fill="${fill}" style="${shadow}" />
        <text x="${x + barWidth / 2}" y="${chartHeight + 18}" text-anchor="middle" font-size="10" font-family="sans-serif" fill="${labelColor}" font-weight="${fontWeight}">${label}</text>
      </g>
    `;
  }).join('');

  container.innerHTML = `
    <svg width="100%" viewBox="0 0 ${totalWidth} ${chartHeight + 28}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3b82f6"/>
          <stop offset="100%" stop-color="#2563eb"/>
        </linearGradient>
      </defs>
      ${bars}
    </svg>
  `;
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Alimentação': '🛒',
    'Transporte': '🚗',
    'Moradia': '🏠',
    'Lazer': '🎮',
    'Saúde': '💊',
    'Educação': '📚',
    'Outros': '💳',
  };
  return icons[category] || '💰';
}

function renderRecent() {
  const recentList = document.getElementById('recent-list');
  if (!recentList) return;

  const recent = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (recent.length === 0) {
    recentList.innerHTML = '<p style="color:#aaa; font-size:14px">Nenhuma transação ainda.</p>';
    return;
  }

  recentList.innerHTML = recent.map((expense) => `
    <li class="recent-item">
      <div class="recent-icon">${getCategoryIcon(expense.category)}</div>
      <div class="recent-info">
        <strong>${expense.description}</strong>
        <span>${expense.category} • ${formatDate(expense.date)}</span>
      </div>
      <span class="recent-value">- ${formatCurrency(expense.value)}</span>
    </li>
  `).join('');
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
    renderChart();
    renderRecent();
    return;
  }

  emptyState.classList.add('hidden');

  expenseList.innerHTML = filtered.map((expense) => `
    <li class="expense-item" data-id="${expense.id}">
      <div class="expense-info">
        <strong>${expense.description}</strong>
        <span>${expense.category} • ${expense.type}</span>
        <span>${formatDate(expense.date)}</span>
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

  saveExpenses(expenses);

  const total = expenses.reduce((acc, expense) => acc + expense.value, 0);
  totalGasto.textContent = formatCurrency(total);
  renderDashboard();
  renderChart();
  renderRecent();
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

const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = (tab as HTMLElement).dataset.tab;

    tabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');

    tabContents.forEach((content) => {
      const el = content as HTMLElement;
      if (el.id === `tab-${target}`) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });
  });
});

renderDashboard();
renderChart();
renderRecent();
renderExpenses();