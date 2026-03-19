// ── Demo Mode ──
// Set this to false once the real Google API key is ready
const DEMO_MODE = true;

// ── State ──
let customers = [];
let config = loadConfig();

// ── DOM Elements ──
const setupSection = document.getElementById('setup-section');
const fetchSection = document.getElementById('fetch-section');
const previewSection = document.getElementById('preview-section');
const statusSection = document.getElementById('status-section');
const apiKeyInput = document.getElementById('api-key-input');
const sheetIdInput = document.getElementById('sheet-id-input');
const saveSetupBtn = document.getElementById('save-setup-btn');
const changeSettingsBtn = document.getElementById('change-settings-btn');
const sheetIdDisplay = document.getElementById('sheet-id-display');
const fetchBtn = document.getElementById('fetch-btn');
const loadingSpinner = document.getElementById('loading-spinner');
const customerCount = document.getElementById('customer-count');
const customerList = document.getElementById('customer-list');
const customerSelect = document.getElementById('customer-select');
const sendAllBtn = document.getElementById('send-all-btn');
const sendOneBtn = document.getElementById('send-one-btn');
const refetchBtn = document.getElementById('refetch-btn');
const backBtn = document.getElementById('back-btn');
const statusLog = document.getElementById('status-log');

// ── Config (localStorage) ──

function loadConfig() {
    const saved = localStorage.getItem('jassi_config');
    return saved ? JSON.parse(saved) : null;
}

function saveConfig(apiKey, sheetId) {
    const cfg = { apiKey, sheetId };
    localStorage.setItem('jassi_config', JSON.stringify(cfg));
    return cfg;
}

// ── Dummy Data for Demo ──

function loadDummyData() {
    customers = [
        {
            name: 'Ravi Kumar',
            phone: '9876543210',
            balance: -2400,
            transactions: [
                { Date: '18 Mar', Description: 'Lost', Amount: '₹800' },
                { Date: '20 Mar', Description: 'Lost', Amount: '₹1,200' },
                { Date: '22 Mar', Description: 'Lost', Amount: '₹400' },
            ],
        },
        {
            name: 'Amit Singh',
            phone: '9812345678',
            balance: 1500,
            transactions: [
                { Date: '17 Mar', Description: 'Won', Amount: '₹3,000' },
                { Date: '19 Mar', Description: 'Lost', Amount: '₹1,500' },
            ],
        },
        {
            name: 'Deepak Sharma',
            phone: '9988776655',
            balance: -5200,
            transactions: [
                { Date: '17 Mar', Description: 'Lost', Amount: '₹2,000' },
                { Date: '18 Mar', Description: 'Lost', Amount: '₹1,200' },
                { Date: '21 Mar', Description: 'Lost', Amount: '₹2,000' },
            ],
        },
        {
            name: 'Gurpreet Kaur',
            phone: '9871234567',
            balance: -800,
            transactions: [
                { Date: '19 Mar', Description: 'Lost', Amount: '₹800' },
            ],
        },
        {
            name: 'Harjeet Gill',
            phone: '9856789012',
            balance: 3200,
            transactions: [
                { Date: '17 Mar', Description: 'Won', Amount: '₹5,000' },
                { Date: '20 Mar', Description: 'Lost', Amount: '₹1,800' },
            ],
        },
        {
            name: 'Sunil Verma',
            phone: '',
            balance: -1100,
            transactions: [
                { Date: '18 Mar', Description: 'Lost', Amount: '₹600' },
                { Date: '22 Mar', Description: 'Lost', Amount: '₹500' },
            ],
        },
    ];
}

// ── Init: decide which screen to show ──

function init() {
    hideAll();

    if (DEMO_MODE) {
        document.getElementById('demo-banner').classList.remove('hidden');
        loadDummyData();
        renderPreview();
        return;
    }

    if (config && config.apiKey && config.sheetId) {
        showFetchScreen();
    } else {
        setupSection.classList.remove('hidden');
    }
}

function hideAll() {
    setupSection.classList.add('hidden');
    fetchSection.classList.add('hidden');
    previewSection.classList.add('hidden');
    statusSection.classList.add('hidden');
}

function showFetchScreen() {
    hideAll();
    fetchSection.classList.remove('hidden');
    loadingSpinner.classList.add('hidden');
    sheetIdDisplay.textContent = 'Sheet ID: ' + config.sheetId.substring(0, 20) + '...';
}

// ── Setup Events ──

saveSetupBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    const sheetId = sheetIdInput.value.trim();

    if (!apiKey) {
        alert('Please enter your Google API Key.');
        return;
    }
    if (!sheetId) {
        alert('Please enter your Google Sheet ID.');
        return;
    }

    config = saveConfig(apiKey, sheetId);
    showFetchScreen();
});

changeSettingsBtn.addEventListener('click', () => {
    hideAll();
    if (config) {
        apiKeyInput.value = config.apiKey;
        sheetIdInput.value = config.sheetId;
    }
    setupSection.classList.remove('hidden');
});

// ── Google Sheets API ──

async function fetchSheetData() {
    const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

    // Step 1: Get all sheet names
    const metaUrl = `${BASE}/${config.sheetId}?key=${config.apiKey}&fields=sheets.properties.title`;
    const metaRes = await fetch(metaUrl);

    if (!metaRes.ok) {
        const err = await metaRes.json();
        throw new Error(err.error?.message || 'Failed to connect to Google Sheets. Check your API key and Sheet ID.');
    }

    const meta = await metaRes.json();
    const sheetNames = meta.sheets.map((s) => s.properties.title);

    // Step 2: Find the Accounts and Balance sheets
    const accountsSheetName = sheetNames.find(
        (n) => n.toLowerCase().includes('account')
    );
    const balanceSheetName = sheetNames.find(
        (n) => n.toLowerCase().includes('balance') || n.toLowerCase().includes('net')
    );

    // Step 3: Fetch all sheets data in one batch request
    const ranges = sheetNames.map((name) => encodeURIComponent(name));
    const batchUrl = `${BASE}/${config.sheetId}/values:batchGet?key=${config.apiKey}&ranges=${ranges.join('&ranges=')}`;
    const batchRes = await fetch(batchUrl);

    if (!batchRes.ok) {
        const err = await batchRes.json();
        throw new Error(err.error?.message || 'Failed to fetch sheet data.');
    }

    const batchData = await batchRes.json();

    // Convert raw values into a lookup: sheetName → array of row objects
    const sheetsData = {};
    batchData.valueRanges.forEach((range, i) => {
        const name = sheetNames[i];
        const rows = range.values || [];
        if (rows.length < 2) {
            sheetsData[name] = [];
            return;
        }
        // First row is headers, rest are data
        const headers = rows[0];
        const data = rows.slice(1).map((row) => {
            const obj = {};
            headers.forEach((h, j) => {
                obj[h] = row[j] || '';
            });
            return obj;
        });
        sheetsData[name] = data;
    });

    // Step 4: Build phone lookup from Accounts sheet
    const phoneLookup = {};
    if (accountsSheetName && sheetsData[accountsSheetName]) {
        sheetsData[accountsSheetName].forEach((row) => {
            const name = row['Name'] || row['name'] || row['Customer'] || row['customer'] || Object.values(row)[0];
            const phone = row['Phone'] || row['phone'] || row['WhatsApp'] || row['whatsapp'] || row['Number'] || row['number'] || Object.values(row)[1];
            if (name && phone) {
                phoneLookup[String(name).trim()] = String(phone).trim();
            }
        });
    }

    // Step 5: Build balance lookup
    const balanceLookup = {};
    if (balanceSheetName && sheetsData[balanceSheetName]) {
        sheetsData[balanceSheetName].forEach((row) => {
            const name = row['Name'] || row['name'] || row['Customer'] || row['customer'] || Object.values(row)[0];
            const balance = row['Net Balance'] || row['net balance'] || row['Balance'] || row['balance'] || Object.values(row)[1];
            if (name !== undefined) {
                balanceLookup[String(name).trim()] = Number(balance) || 0;
            }
        });
    }

    // Step 6: Build customer list from individual sheets
    const metaSheets = new Set(
        [accountsSheetName, balanceSheetName].filter(Boolean).map((s) => s.toLowerCase())
    );

    customers = [];
    sheetNames.forEach((sheetName) => {
        if (metaSheets.has(sheetName.toLowerCase())) return;

        const transactions = sheetsData[sheetName] || [];
        if (transactions.length === 0) return;

        const name = sheetName.trim();
        customers.push({
            name,
            phone: phoneLookup[name] || '',
            balance: balanceLookup[name] || 0,
            transactions,
        });
    });

    return customers;
}

// ── Fetch Button ──

fetchBtn.addEventListener('click', async () => {
    fetchBtn.classList.add('hidden');
    changeSettingsBtn.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');

    try {
        await fetchSheetData();

        if (customers.length === 0) {
            alert('No customer sheets found. Make sure your Google Sheet has individual customer tabs.');
            showFetchScreen();
            return;
        }

        renderPreview();
    } catch (err) {
        alert('Error: ' + err.message);
        console.error(err);
        showFetchScreen();
    }
});

// ── Render Preview ──

function renderPreview() {
    hideAll();
    previewSection.classList.remove('hidden');

    customerCount.textContent = customers.length;

    customerList.innerHTML = customers
        .map((c) => {
            const balanceClass = c.balance < 0 ? 'negative' : c.balance > 0 ? 'positive' : '';
            const balanceStr = c.balance < 0
                ? `-₹${Math.abs(c.balance).toLocaleString('en-IN')}`
                : `₹${c.balance.toLocaleString('en-IN')}`;
            const phoneStr = c.phone ? c.phone : 'No phone number';
            return `
                <div class="customer-row">
                    <div>
                        <div class="customer-name">${c.name}</div>
                        <div class="customer-phone">${phoneStr}</div>
                    </div>
                    <div class="customer-balance ${balanceClass}">${balanceStr}</div>
                </div>
            `;
        })
        .join('');

    customerSelect.innerHTML = '<option value="">Pick a customer...</option>' +
        customers.map((c, i) => `<option value="${i}">${c.name}</option>`).join('');
}

// ── WhatsApp Message Builder ──

function buildMessage(customer) {
    const balanceStr = customer.balance < 0
        ? `-₹${Math.abs(customer.balance).toLocaleString('en-IN')}`
        : `₹${customer.balance.toLocaleString('en-IN')}`;

    let txLines = '';
    customer.transactions.forEach((tx) => {
        const values = Object.values(tx);
        txLines += '• ' + values.join(' — ') + '\n';
    });

    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    const formatDate = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    return `Hi ${customer.name}, here's your weekly account summary:

Net Balance: ${balanceStr}
Week: ${formatDate(weekAgo)} – ${formatDate(today)}

Transaction History:
${txLines}
For any questions, contact Jassi.`;
}

function formatPhone(phone) {
    let cleaned = String(phone).replace(/[\s\-()]/g, '');
    if (!cleaned.startsWith('+') && !cleaned.startsWith('91')) {
        cleaned = '91' + cleaned;
    }
    cleaned = cleaned.replace(/^\+/, '');
    return cleaned;
}

function openWhatsApp(customer) {
    if (!customer.phone) {
        return { success: false, reason: 'No phone number' };
    }
    const phone = formatPhone(customer.phone);
    const message = encodeURIComponent(buildMessage(customer));
    const url = `https://wa.me/${phone}?text=${message}`;
    window.open(url, '_blank');
    return { success: true };
}

// ── Send Actions ──

sendAllBtn.addEventListener('click', () => {
    statusSection.classList.remove('hidden');
    statusLog.innerHTML = '';

    let delay = 0;
    customers.forEach((customer) => {
        setTimeout(() => {
            const result = openWhatsApp(customer);
            const icon = result.success ? '✅' : '⚠️';
            const text = result.success
                ? `${customer.name} — WhatsApp opened`
                : `${customer.name} — ${result.reason}`;
            statusLog.innerHTML += `<div class="status-item"><span class="status-icon">${icon}</span>${text}</div>`;
        }, delay);
        delay += 800;
    });
});

customerSelect.addEventListener('change', () => {
    sendOneBtn.disabled = customerSelect.value === '';
});

sendOneBtn.addEventListener('click', () => {
    const index = parseInt(customerSelect.value);
    if (isNaN(index)) return;

    const customer = customers[index];
    const result = openWhatsApp(customer);

    statusSection.classList.remove('hidden');
    const icon = result.success ? '✅' : '⚠️';
    const text = result.success
        ? `${customer.name} — WhatsApp opened`
        : `${customer.name} — ${result.reason}`;
    statusLog.innerHTML = `<div class="status-item"><span class="status-icon">${icon}</span>${text}</div>`;
});

// ── Refresh & Back ──

refetchBtn.addEventListener('click', async () => {
    fetchBtn.classList.remove('hidden');
    changeSettingsBtn.classList.remove('hidden');
    showFetchScreen();
    fetchBtn.click();
});

backBtn.addEventListener('click', () => {
    statusSection.classList.add('hidden');
    previewSection.classList.remove('hidden');
});

// ── Start the app ──
init();
