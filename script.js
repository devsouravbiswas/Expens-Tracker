/**
 * Budget Tracker Application
 * Dependencies: Chart.js (include via <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>)
 * Ensure CSS defines variables: --category-food, --category-travel, --category-entertainment, --category-shopping, --neon-blue
 */

let monthlyLimit = 0;
let expenses = [];
let isDarkMode = true;

// Load data from localStorage on page load
window.addEventListener('load', loadData);

// DOM Elements with validation
const elements = {
    setLimit: document.getElementById('setLimit'),
    addExpense: document.getElementById('addExpense'),
    themeToggle: document.getElementById('themeToggle'),
    monthlyLimitInput: document.getElementById('monthlyLimit'),
    expenseName: document.getElementById('expenseName'),
    expenseAmount: document.getElementById('expenseAmount'),
    expenseDate: document.getElementById('expenseDate'),
    expenseCategory: document.getElementById('expenseCategory'),
    limitAmount: document.getElementById('limitAmount'),
    totalExpenses: document.getElementById('totalExpenses'),
    remainingAmount: document.getElementById('remainingAmount'),
    expensesList: document.getElementById('expensesList'),
    expenseChart: document.getElementById('expenseChart')
};

// Check for missing DOM elements
for (const [key, element] of Object.entries(elements)) {
    if (!element) {
        console.error(`Element with ID "${key}" not found.`);
    }
}

// Add event listeners if elements exist
if (elements.setLimit) elements.setLimit.addEventListener('click', setMonthlyLimit);
if (elements.addExpense) elements.addExpense.addEventListener('click', addExpense);
if (elements.themeToggle) elements.themeToggle.addEventListener('click', toggleTheme);

// Load data from localStorage
function loadData() {
    try {
        monthlyLimit = parseFloat(localStorage.getItem('monthlyLimit')) || 0;
        expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        updateUI();
    } catch (error) {
        console.error('Error loading data from localStorage:', error);
    }
}

// Save data to localStorage
function saveData() {
    try {
        localStorage.setItem('monthlyLimit', monthlyLimit);
        localStorage.setItem('expenses', JSON.stringify(expenses));
    } catch (error) {
        console.error('Error saving data to localStorage:', error);
    }
}

// Set Monthly Limit
function setMonthlyLimit() {
    if (!elements.monthlyLimitInput) return;
    const limit = parseFloat(elements.monthlyLimitInput.value) || 0;
    if (limit >= 0) {
        monthlyLimit = limit;
        elements.monthlyLimitInput.value = '';
        saveData();
        updateUI();
    } else {
        showAlert('Please enter a valid monthly limit.');
    }
}

// Add Expense
function addExpense() {
    if (!elements.expenseName || !elements.expenseAmount || !elements.expenseDate || !elements.expenseCategory) return;

    const name = elements.expenseName.value.trim();
    const amount = parseFloat(elements.expenseAmount.value) || 0;
    const date = elements.expenseDate.value;
    const category = elements.expenseCategory.value;

    if (name && amount > 0 && date && category) {
        expenses.push({ name, amount, date, category });
        elements.expenseName.value = '';
        elements.expenseAmount.value = '';
        elements.expenseDate.value = '';
        elements.expenseCategory.value = 'Food';
        saveData();
        updateUI();
        checkLimitExceeded();
    } else {
        showAlert('Please fill all fields with valid values.');
    }
}

// Check if limit is exceeded
function checkLimitExceeded() {
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    if (totalExpenses > monthlyLimit && monthlyLimit > 0) {
        showAlert(`You've exceeded your monthly limit of ₹${monthlyLimit.toFixed(2)}!`);
    }
}

// Show Alert
function showAlert(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert';
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        <span class="closebtn" role="button" tabindex="0" aria-label="Close alert">×</span>
        ${message}
    `;
    document.body.appendChild(alertDiv);

    const closeBtn = alertDiv.querySelector('.closebtn');
    closeBtn.addEventListener('click', () => alertDiv.remove());
    closeBtn.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') alertDiv.remove();
    });

    setTimeout(() => alertDiv.remove(), 5000);
}

// Toggle Theme
function toggleTheme() {
    if (!elements.themeToggle) return;
    document.body.classList.toggle('light-mode');
    isDarkMode = !isDarkMode;
    elements.themeToggle.textContent = isDarkMode ? '🌙' : '🌞';
}

// Update UI
function updateUI() {
    if (!elements.limitAmount || !elements.totalExpenses || !elements.remainingAmount) return;

    elements.limitAmount.textContent = `₹${monthlyLimit.toFixed(2)}`;
    const totalExpensesValue = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    elements.totalExpenses.textContent = `₹${totalExpensesValue.toFixed(2)}`;
    const remaining = monthlyLimit - totalExpensesValue;
    elements.remainingAmount.textContent = `₹${remaining.toFixed(2)}`;

    renderExpensesList();
    updateChart();
}

// Render Expenses List
function renderExpensesList() {
    if (!elements.expensesList) return;
    elements.expensesList.innerHTML = expenses.map((expense, index) => `
        <li>
            <span class="expense-category" style="color: ${getCategoryColor(expense.category)}">${expense.category}</span> 
            ${expense.name} - ₹${(expense.amount || 0).toFixed(2)} - ${expense.date || 'N/A'}
            <button class="delete-btn" data-index="${index}">Delete</button>
        </li>
    `).join('');

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', () => {
            const index = parseInt(button.dataset.index);
            deleteExpense(index);
        });
    });
}

// Delete Expense
function deleteExpense(index) {
    expenses.splice(index, 1);
    saveData();
    updateUI();
}

// Update Chart
function updateChart() {
    if (!elements.expenseChart || !window.Chart) {
        console.error('Chart.js or canvas element not found.');
        return;
    }

    const ctx = elements.expenseChart.getContext('2d');

    const expensesByDate = expenses.reduce((acc, expense) => {
        acc[expense.date || 'N/A'] = (acc[expense.date || 'N/A'] || 0) + (expense.amount || 0);
        return acc;
    }, {});

    const dates = Object.keys(expensesByDate);
    const amounts = Object.values(expensesByDate);

    const chartData = {
        labels: dates,
        datasets: [{
            label: 'Expenses',
            data: amounts,
            backgroundColor: 'rgba(0, 191, 255, 0.5)',
            borderColor: 'rgba(0, 191, 255, 1)',
            borderWidth: 1
        }]
    };

    if (window.myChart) {
        window.myChart.data = chartData;
        window.myChart.update();
    } else {
        window.myChart = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                animation: { duration: 1000 },
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: { label: function (tooltipItem) { return '₹' + tooltipItem.raw.toFixed(2); } }
                    }
                },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Amount (₹)' } }
                }
            }
        });
    }
}

// Get Category Color
function getCategoryColor(category) {
    switch (category) {
        case 'Food': return 'var(--category-food)';
        case 'Travel': return 'var(--category-travel)';
        case 'Entertainment': return 'var(--category-entertainment)';
        case 'Shopping': return 'var(--category-shopping)';
        case 'Other': return 'var(--neon-blue)';
        default: return 'var(--neon-blue)';
    }
}