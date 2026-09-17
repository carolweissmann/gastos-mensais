import './style.css';
import type { Expense } from './types/expense';
import type { ExpenseCategory, ExpenseType } from './types/expense';
import { formatCurrency } from './utils/formatCurrency';
import { saveExpenses, loadExpenses, saveFixos, loadFixos } from './services/storage';
import type { GastoFixo } from './services/storage';
import { formatDate } from './utils/formatDate';

function showConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.getElementById('modal-overlay')!;
    const msg = document.getElementById('modal-message')!;
    const btnConfirmar = document.getElementById('modal-confirmar')!;
    const btnCancelarModal = document.getElementById('modal-cancelar')!;

    msg.textContent = message;
    overlay.classList.remove('hidden');

    const close = (result: boolean) => {
      overlay.classList.add('hidden');
      btnConfirmar.removeEventListener('click', onConfirm);
      btnCancelarModal.removeEventListener('click', onCancel);
      resolve(result);
    };

    const onConfirm = () => close(true);
    const onCancel = () => close(false);

    btnConfirmar.addEventListener('click', onConfirm);
    btnCancelarModal.addEventListener('click', onCancel);
  });
}


let expenses: Expense[] = loadExpenses();
let fixos: GastoFixo[] = loadFixos();
let editingId: string | null = null;
let currentFilter: string = 'Todos';

const LIMITE = 3000;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia 👋';
  if (hour >= 12 && hour < 18) return 'Boa tarde 👋';
  return 'Boa noite 👋';
}

// Elementos do HTML
const btnCancelar = document.getElementById('btn-cancelar')!;
const btnSalvar = document.getElementById('btn-salvar')!;
const formSection = document.getElementById('form-section')!;
const expenseList = document.getElementById('expense-list')!;
const emptyState = document.getElementById('empty-state')!;
const totalGasto = document.getElementById('total-gasto')!;
const disponivelEl = document.getElementById('disponivel')!;
const percentualEl = document.getElementById('percentual')!;
const categoriesList = document.getElementById('categories-list')!;
const btnGerenciarFixos = document.getElementById('btn-gerenciar-fixos')!;
const formFixo = document.getElementById('form-fixo')!;
const btnCancelarFixo = document.getElementById('btn-cancelar-fixo')!;
const btnSalvarFixo = document.getElementById('btn-salvar-fixo')!;
const fixosList = document.getElementById('fixos-list')!;

const inputDescricao = document.getElementById('descricao') as HTMLInputElement;
const inputValor = document.getElementById('valor') as HTMLInputElement;
const inputCategoria = document.getElementById('categoria') as HTMLSelectElement;
const inputData = document.getElementById('data') as HTMLInputElement;
const inputTipo = document.getElementById('tipo') as HTMLSelectElement;
const filtroCategoria = document.getElementById('filtro-categoria') as HTMLSelectElement;
const btnAdicionarFab = document.getElementById('btn-adicionar-fab')!;
const inputFixoDescricao = document.getElementById('fixo-descricao') as HTMLInputElement;
const inputFixoValor = document.getElementById('fixo-valor') as HTMLInputElement;
const inputFixoCategoria = document.getElementById('fixo-categoria') as HTMLSelectElement;

function showToast(message: string) {
  const toast = document.getElementById('toast')!;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Alimentação': '🛒',
    'Transporte': '🚗',
    'Moradia': '🏠',
    'Lazer': '🎮',
    'Saúde': '💊',
    'Educação': '📚',
    'Entretenimento': '🎬',
    'Outros': '💳',
  };
  return icons[category] || '💰';
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Alimentação': '#f97316',
    'Transporte': '#3b82f6',
    'Moradia': '#8b5cf6',
    'Lazer': '#eab308',
    'Saúde': '#22c55e',
    'Educação': '#06b6d4',
    'Entretenimento': '#ec4899',
    'Outros': '#6b7280',
  };
  return colors[category] || '#6b7280';
}

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
      const color = getCategoryColor(category);
      return `
        <li class="category-item">
          <div style="flex: 1">
            <div style="display: flex; justify-content: space-between">
              <span>${category}</span>
              <strong>${formatCurrency(value)}</strong>
            </div>
            <div class="category-bar" style="width: ${pct}%; background: ${color}"></div>
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
    const shadow = isActive ? 'filter: drop-shadow(0 4px 8px rgba(5,38,89,0.35))' : '';
    const labelColor = isActive ? '#052659' : 'rgba(0,0,0,0.3)';
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
          <stop offset="0%" stop-color="#5483B3"/>
          <stop offset="100%" stop-color="#052659"/>
        </linearGradient>
      </defs>
      ${bars}
    </svg>
  `;
}

function renderRecent() {
  const recentList = document.getElementById('recent-list');
  if (!recentList) return;

  const recent = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (recent.length === 0) {
    recentList.innerHTML = '<p style="color:#7DA0CA; font-size:14px">Nenhuma transação ainda.</p>';
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

function renderCategories() {
  const list = document.getElementById('categories-list-detail');
  if (!list) return;

  const byCategory: Record<string, number> = {};
  expenses.forEach((exp) => {
    byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.value;
  });

  const total = expenses.reduce((acc, exp) => acc + exp.value, 0);

  if (total === 0) {
    list.innerHTML = '<p style="color:#7DA0CA; font-size:14px">Nenhum gasto cadastrado.</p>';
    return;
  }

  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  const colorBar = sorted.map(([category, value]) => {
    const pct = Math.round((value / total) * 100);
    const color = getCategoryColor(category);
    return `<div style="flex: ${pct}; background: ${color}; height: 6px;"></div>`;
  }).join('');

  list.innerHTML = `
    <div class="category-color-bar">${colorBar}</div>
    ${sorted.map(([category, value]) => {
      const pct = Math.round((value / total) * 100);
      const icon = getCategoryIcon(category);
      const color = getCategoryColor(category);
      return `
        <li class="category-detail-item">
          <div class="category-detail-header">
            <div class="category-detail-left">
              <div class="category-dot" style="background: ${color}"></div>
              <div class="category-detail-icon">${icon}</div>
              <span>${category}</span>
            </div>
            <div style="text-align: right">
              <strong>${formatCurrency(value)}</strong>
              <span class="category-detail-pct">${pct}%</span>
            </div>
          </div>
          <div class="category-detail-bar-bg">
            <div class="category-detail-bar" style="width: ${pct}%; background: ${color}"></div>
          </div>
        </li>
      `;
    }).join('')}
    <div class="category-footer">
      <div>
        <span class="chart-label">TOTAL CATEGORIZADO</span>
        <strong>${formatCurrency(total)}</strong>
      </div>
      <div style="text-align: right">
        <span class="chart-label">LIMITE</span>
        <strong style="color: #052659">${formatCurrency(LIMITE)}</strong>
      </div>
    </div>
  `;
}

function renderFixos() {
  if (fixos.length === 0) {
    fixosList.innerHTML = '<p style="color:#7DA0CA; font-size:14px">Nenhum gasto fixo cadastrado.</p>';
    return;
  }

  fixosList.innerHTML = fixos.map((fixo) => `
    <li class="fixo-item" data-id="${fixo.id}">
      <div class="fixo-swipe-content">
        <div class="fixo-info">
          <div class="recent-icon">${getCategoryIcon(fixo.category)}</div>
          <div>
            <strong>${fixo.description}</strong>
            <span style="display:block; font-size:12px; color:#7DA0CA">${fixo.category}</span>
          </div>
        </div>
        <div class="fixo-actions">
          <span class="fixo-value">${formatCurrency(fixo.value)}</span>
          <button class="btn-adicionar-fixo" data-id="${fixo.id}">Lançar</button>
        </div>
      </div>
      <div class="fixo-delete-bg">
        <button class="btn-remover-fixo" data-id="${fixo.id}">🗑️</button>
      </div>
    </li>
  `).join('');

  document.querySelectorAll('.btn-adicionar-fixo').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = (e.target as HTMLElement).dataset.id;
      const fixo = fixos.find((f) => f.id === id);
      if (!fixo) return;

      const newExpense: Expense = {
        id: crypto.randomUUID(),
        description: fixo.description,
        value: fixo.value,
        category: fixo.category as ExpenseCategory,
        date: new Date().toISOString().split('T')[0],
        type: 'Fixa' as ExpenseType,
      };
      expenses.push(newExpense);
      showToast(`✅ ${fixo.description} lançado!`);
      renderExpenses();
    });
  });

  document.querySelectorAll('.btn-remover-fixo').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = (e.target as HTMLElement).dataset.id;
      const confirmed = await showConfirm('Remover este gasto fixo?');
      if (!confirmed) return;

      fixos = fixos.filter((f) => f.id !== id);
      saveFixos(fixos);
      renderFixos();
    });
  });

  // Swipe para excluir
document.querySelectorAll('.fixo-item').forEach((item) => {
  const el = item as HTMLElement;
  const content = el.querySelector('.fixo-swipe-content') as HTMLElement;
  let startX = 0;
  let isDragging = false;

  el.addEventListener('touchstart', (e) => {
    startX = (e as TouchEvent).touches[0].clientX;
    isDragging = true;
  });

  el.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const diff = (e as TouchEvent).touches[0].clientX - startX;
    if (diff < 0) {
      content.style.transform = `translateX(${Math.max(diff, -80)}px)`;
    }
  });

  el.addEventListener('touchend', (e) => {
    const diff = (e as TouchEvent).changedTouches[0].clientX - startX;
    if (diff < -60) {
      content.style.transform = 'translateX(-80px)';
    } else {
      content.style.transform = 'translateX(0)';
    }
    isDragging = false;
  });
});
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
    renderCategories();
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
    btn.addEventListener('click', async (e) => {
      const id = (e.target as HTMLElement).dataset.id;
      const expense = expenses.find((exp) => exp.id === id);
      if (!expense) return;

      const confirmed = await showConfirm(`Excluir "${expense.description}"?`);
      if (!confirmed) return;

      expenses = expenses.filter((exp) => exp.id !== id);
      showToast('🗑️ Gasto removido!');
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
  renderCategories();
}

btnCancelar.addEventListener('click', () => {
  inputDescricao.value = '';
  inputValor.value = '';
  inputCategoria.value = 'Alimentação';
  inputData.value = '';
  inputTipo.value = 'Fixa';
  editingId = null;
  formSection.classList.add('hidden');
});

btnSalvar.addEventListener('click', () => {
  if (!inputDescricao.value.trim()) {
    showToast('⚠️ Preencha a descrição!');
    return;
  }
  if (!inputValor.value || Number(inputValor.value) <= 0) {
    showToast('⚠️ Preencha um valor válido!');
    return;
  }
  if (!inputData.value) {
    showToast('⚠️ Preencha a data!');
    return;
  }

  const isEditing = editingId !== null;

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

  showToast(isEditing ? '✅ Gasto atualizado!' : '✅ Gasto adicionado!');
  renderExpenses();
  formSection.classList.add('hidden');
});

filtroCategoria.addEventListener('change', () => {
  currentFilter = filtroCategoria.value;
  renderExpenses();
});

btnGerenciarFixos.addEventListener('click', () => {
  formFixo.classList.toggle('hidden');
});

btnCancelarFixo.addEventListener('click', () => {
  formFixo.classList.add('hidden');
  inputFixoDescricao.value = '';
  inputFixoValor.value = '';
  inputFixoCategoria.value = 'Alimentação';
});

btnSalvarFixo.addEventListener('click', () => {
  if (!inputFixoDescricao.value.trim()) {
    showToast('⚠️ Preencha a descrição!');
    return;
  }
  if (!inputFixoValor.value || Number(inputFixoValor.value) <= 0) {
    showToast('⚠️ Preencha um valor válido!');
    return;
  }

  const novoFixo: GastoFixo = {
    id: crypto.randomUUID(),
    description: inputFixoDescricao.value,
    value: Number(inputFixoValor.value),
    category: inputFixoCategoria.value,
  };

  fixos.push(novoFixo);
  saveFixos(fixos);
  renderFixos();
  formFixo.classList.add('hidden');
  inputFixoDescricao.value = '';
  inputFixoValor.value = '';
  inputFixoCategoria.value = 'Alimentação';
  showToast('📌 Gasto fixo salvo!');
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

const bottomNavItems = document.querySelectorAll('.bottom-nav-item');

bottomNavItems.forEach((item) => {
  item.addEventListener('click', () => {
    const target = (item as HTMLElement).dataset.tab;
    bottomNavItems.forEach((i) => i.classList.remove('active'));
    item.classList.add('active');
    tabs.forEach((t) => t.classList.remove('active'));
    const matchingTab = document.querySelector(`.tab[data-tab="${target}"]`);
    if (matchingTab) matchingTab.classList.add('active');
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

btnAdicionarFab.addEventListener('click', () => {
  tabContents.forEach((content) => {
    const el = content as HTMLElement;
    if (el.id === 'tab-transacoes') {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
  bottomNavItems.forEach((i) => i.classList.remove('active'));
  document.querySelector('.bottom-nav-item[data-tab="transacoes"]')?.classList.add('active');
  formSection.classList.remove('hidden');
});

const greetingEl = document.querySelector('.header-greeting');
if (greetingEl) greetingEl.textContent = getGreeting();

renderDashboard();
renderChart();
renderRecent();
renderCategories();
renderFixos();
renderExpenses();