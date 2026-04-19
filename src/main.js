import { createClient } from '@supabase/supabase-js'
import * as lucide from 'lucide'

// Safe Supabase initialization
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let supabase
let isDemoMode = false
let userRole = 'admin' // Default for demo: admin, worker, superadmin

try {
    if (supabaseUrl && supabaseAnonKey) {
        supabase = createClient(supabaseUrl, supabaseAnonKey)
    } else {
        isDemoMode = true
        console.warn('Running in Demo Mode: No Supabase keys found.')
    }
} catch (e) {
    isDemoMode = true
    console.error('Supabase initialization failed, entering Demo Mode', e)
}

// --- ENTERPRISE MOCK DATA ---
const MOCK_DATA = {
    vehicles: [
        { id: 1, make: 'Toyota', model: 'Fortuner', plate_number: 'MH 12 AB 1234', fuel_type: 'Diesel', last_odometer: 45000, status: 'available' },
        { id: 2, make: 'Mahindra', model: 'Scorpio-N', plate_number: 'MH 14 CD 5678', fuel_type: 'Diesel', last_odometer: 12400, status: 'on_trip' }
    ],
    drivers: [
        { id: 1, full_name: 'Rahul Sharma', license_number: 'IND-DL-1234', phone: '+91 9876543210', status: 'active' }
    ],
    workers: [
        { id: 1, full_name: 'Snehal Deshmukh', position: 'Mechanic', phone: '+91 8888777766', salary: 25000, status: 'active' },
        { id: 2, full_name: 'Karan Malhotra', position: 'Attendant', phone: '+91 7777666655', salary: 18000, status: 'active' }
    ],
    sales: [
        { id: 1, driver_name: 'Rahul Sharma', amount: 3500, date: '2026-04-18', shift: 'Day' },
        { id: 2, driver_name: 'Rahul Sharma', amount: 4200, date: '2026-04-19', shift: 'Night' }
    ],
    inventory: [
        { id: 1, part_name: 'Brake Pads', part_code: 'BP-TYT-01', quantity: 12, unit_price: 1200, min_stock: 5 },
        { id: 2, part_name: 'Engine Oil (5L)', part_code: 'EO-MOB-05', quantity: 4, unit_price: 3500, min_stock: 10 }
    ],
    banking: [
        { id: 1, type: 'deposit', amount: 50000, date: '2026-04-15', description: 'Weekly Cash Deposit' },
        { id: 2, type: 'withdrawal', amount: 12000, date: '2026-04-17', description: 'Spare Parts Purchase' }
    ],
    expenses: [
        { id: 1, category: 'Workshop Rent', amount: 15000, date: '2026-04-01', description: 'Monthly Rent' },
        { id: 2, category: 'Electricity Bill', amount: 4200, date: '2026-04-05', description: 'Power usage' }
    ],
    salaries: [
        { id: 1, recipient: 'Rahul Sharma', type: 'driver', amount: 15000, date: '2026-04-01' },
        { id: 2, recipient: 'Snehal Deshmukh', type: 'worker', amount: 25000, date: '2026-04-01' }
    ]
}

let currentView = 'login'
let subView = 'dashboard-home'
let searchQuery = ''

async function init() {
    if (isDemoMode) {
        render()
        return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        currentView = 'dashboard'
        // In real app, fetch role from profiles
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        userRole = profile?.role || 'worker'
    }
    render()
}

async function render() {
    const app = document.querySelector('#app')
    if (currentView === 'login') {
        app.innerHTML = renderLogin()
        attachLoginEvents()
    } else {
        const accessibleViews = getAccessibleViews()
        app.innerHTML = `
            <div class="dashboard-layout">
                <aside class="sidebar">
                    <div class="brand">
                        <div class="brand-icon">
                            <i data-lucide="shield" style="width:20px; color:white;"></i>
                        </div>
                        <span>DriveControl</span>
                    </div>
                    <ul class="nav-links">
                        ${accessibleViews.map(v => `
                            <li class="nav-item ${subView === v.id ? 'active' : ''}" data-view="${v.id}">
                                <i data-lucide="${v.icon}"></i>
                                <span>${v.label}</span>
                            </li>
                        `).join('')}
                    </ul>
                    <div style="margin-top:auto; padding:1.5rem; background:rgba(255,255,255,0.03); border-radius:12px;">
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:1rem;">
                            <div style="width:40px; height:40px; background:var(--accent-primary); border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:800; font-family:'Outfit';">
                                ${userRole[0].toUpperCase()}
                            </div>
                            <div style="font-size:0.8rem;">
                                <p style="font-weight:700; color:white;">${userRole.toUpperCase()}</p>
                                <p style="color:var(--text-secondary); font-size:0.7rem;">Jayvik Labs User</p>
                            </div>
                        </div>
                        <button id="logoutBtn" class="btn btn-outline" style="width:100%; font-size:0.8rem; padding:0.6rem;">
                            <i data-lucide="log-out" style="width:14px;"></i> Logout
                        </button>
                    </div>
                </aside>
                <main class="content">
                    <div id="subViewContent">
                        ${await renderSubView()}
                    </div>
                    <footer style="margin-top:5rem; padding-top:2rem; border-top:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:var(--text-secondary);">
                        <p>© 2026 <span style="color:white; font-weight:600;">Jayvik Labs Systems</span>. All Rights Reserved.</p>
                        <div style="display:flex; gap:20px;">
                            <a href="#" style="color:var(--text-secondary); text-decoration:none;">Documentation</a>
                            <a href="#" style="color:var(--text-secondary); text-decoration:none;">Privacy Policy</a>
                            <a href="#" style="color:var(--text-secondary); text-decoration:none;">Support Desk</a>
                        </div>
                        <div style="display:flex; gap:12px;">
                            <i data-lucide="github" style="width:16px; cursor:pointer;"></i>
                            <i data-lucide="twitter" style="width:16px; cursor:pointer;"></i>
                            <i data-lucide="linkedin" style="width:16px; cursor:pointer;"></i>
                        </div>
                    </footer>
                </main>
            </div>
            <div id="modalContainer"></div>
        `
        attachDashboardEvents()
    }
    lucide.createIcons()
}

function getAccessibleViews() {
    const allViews = [
        { id: 'dashboard-home', label: 'Dashboard', icon: 'layout-dashboard', roles: ['superadmin', 'admin', 'worker'] },
        { id: 'vehicles', label: 'Vehicles', icon: 'car', roles: ['superadmin', 'admin', 'worker'] },
        { id: 'drivers', label: 'Drivers', icon: 'users', roles: ['superadmin', 'admin', 'worker'] },
        { id: 'workers', label: 'Workers', icon: 'hard-hat', roles: ['superadmin', 'admin'] },
        { id: 'sales', label: 'Sales/Cashbook', icon: 'banknote', roles: ['superadmin', 'admin', 'worker'] },
        { id: 'inventory', label: 'Inventories', icon: 'package', roles: ['superadmin', 'admin'] },
        { id: 'banking', label: 'Bank & Finance', icon: 'wallet', roles: ['superadmin', 'admin'] },
        { id: 'salaries', label: 'Payroll', icon: 'coins', roles: ['superadmin', 'admin'] },
        { id: 'expenses', label: 'Workshop Exp', icon: 'wrench', roles: ['superadmin', 'admin'] },
        { id: 'settings', label: 'System Settings', icon: 'settings', roles: ['superadmin'] },
        { id: 'system-guide', label: 'System Guide', icon: 'info', roles: ['superadmin', 'admin', 'worker'] }
    ]
    return allViews.filter(v => v.roles.includes(userRole))
}

async function renderSubView() {
    const views = {
        'dashboard-home': renderDashboard,
        'vehicles': renderVehicles,
        'drivers': renderDrivers,
        'workers': renderWorkers,
        'sales': renderSales,
        'inventory': renderInventory,
        'banking': renderBanking,
        'salaries': renderSalaries,
        'expenses': renderExpenses,
        'settings': renderSettings,
        'system-guide': renderSystemGuide
    }
    return views[subView] ? await views[subView]() : '<h2>View Not Found</h2>'
}

// --- VIEW RENDERERS ---

async function renderDashboard() {
    return `
        <header>
            <h1 style="font-family: 'Outfit'; font-size:2.8rem; letter-spacing:-1px;">Enterprise Overview</h1>
            <div style="display:flex; align-items:center; gap:10px; color: var(--text-secondary); margin-top:0.5rem;">
                <span style="width:8px; height:8px; background:var(--success); border-radius:50%; box-shadow:0 0 10px var(--success);"></span>
                Real-time business performance analytics
            </div>
        </header>
        <div class="stats-grid">
            ${renderStatCard('Total Assets', '₹45.2L', '+12.5%', 'success', 'car')}
            ${renderStatCard('Cash in Hand', '₹1.24L', 'Active', 'success', 'banknote')}
            ${renderStatCard('Bank Balance', '₹18.5L', 'Verified', 'success', 'wallet')}
            ${renderStatCard('Exp. Month', '₹12K', 'Predicted', 'danger', 'history')}
        </div>
        <div style="display:grid; grid-template-columns: 2.2fr 1fr; gap:1.5rem; margin-top:2rem;">
            <div class="glass" style="padding:2rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
                    <h3 style="font-family:'Outfit'; font-size:1.25rem;">Financial Trajectory</h3>
                    <div style="display:flex; gap:15px; font-size:0.75rem;">
                        <span style="display:flex; align-items:center; gap:6px;"><i style="color:var(--accent-primary); font-style:normal;">●</i> Revenue</span>
                        <span style="display:flex; align-items:center; gap:6px;"><i style="color:var(--danger); font-style:normal;">●</i> Expenses</span>
                    </div>
                </div>
                <div style="height:280px; display:flex; align-items:flex-end; gap:25px; padding-bottom:10px; border-bottom:1px solid var(--border-color); padding: 0 1rem;">
                    <div class="chart-bar" data-value="₹25L" style="background:linear-gradient(to top, var(--accent-primary), var(--accent-secondary)); height:85%;"></div>
                    <div class="chart-bar" data-value="₹12K" style="background:linear-gradient(to top, #ef4444, #f87171); height:35%;"></div>
                    <div class="chart-bar" data-value="₹18L" style="background:linear-gradient(to top, var(--accent-primary), var(--accent-secondary)); height:65%;"></div>
                    <div class="chart-bar" data-value="₹14K" style="background:linear-gradient(to top, #ef4444, #f87171); height:40%;"></div>
                    <div class="chart-bar" data-value="₹30L" style="background:linear-gradient(to top, var(--accent-primary), var(--accent-secondary)); height:95%;"></div>
                    <div class="chart-bar" data-value="₹10K" style="background:linear-gradient(to top, #ef4444, #f87171); height:25%;"></div>
                </div>
            </div>
            <div class="glass" style="padding:2rem;">
                <h3 style="margin-bottom:1.5rem; font-family:'Outfit';">Critical Alerts</h3>
                <div style="display:flex; flex-direction:column; gap:1rem;">
                    ${MOCK_DATA.inventory.slice(0, 4).map(i => `
                        <div style="padding:15px; background:rgba(239, 68, 68, 0.03); border:1px solid rgba(239, 68, 68, 0.1); border-radius:12px; display:flex; justify-content:space-between; align-items:center; transition:0.3s;" onmouseover="this.style.borderColor='rgba(239,68,68,0.3)'" onmouseout="this.style.borderColor='rgba(239,68,68,0.1)'">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <div style="width:10px; height:10px; background:var(--danger); border-radius:50%;"></div>
                                <span style="font-size:0.85rem; font-weight:500;">${i.part_name}</span>
                            </div>
                            <span style="color:var(--danger); font-size:0.75rem; font-weight:800; background:rgba(239,68,68,0.1); padding:4px 8px; border-radius:6px;">${i.quantity} Left</span>
                        </div>
                    `).join('')}
                    <button class="btn btn-outline" style="width:100%; margin-top:auto; font-size:0.8rem; border-style:dashed;">Order New Stock</button>
                </div>
            </div>
        </div>
    `
}

async function renderVehicles() {
    const searchHTML = renderSearchHeader('Vehicle', 'Vehicle');
    const vehicles = isDemoMode ? MOCK_DATA.vehicles : (await supabase.from('vehicles').select('*')).data
    const filtered = vehicles?.filter(v => v.plate_number.toLowerCase().includes(searchQuery.toLowerCase()))
    return `${searchHTML} <div class="vehicle-grid">${filtered?.map(v => renderCard(v, 'vehicle')).join('')}</div>`
}

async function renderDrivers() {
    const searchHTML = renderSearchHeader('Driver', 'Driver');
    const drivers = isDemoMode ? MOCK_DATA.drivers : (await supabase.from('drivers').select('*')).data
    const filtered = drivers?.filter(d => d.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
    return `${searchHTML} <div class="vehicle-grid">${filtered?.map(d => renderCard(d, 'driver')).join('')}</div>`
}

async function renderWorkers() {
    const searchHTML = renderSearchHeader('Worker', 'Worker');
    const workers = isDemoMode ? MOCK_DATA.workers : (await supabase.from('workers').select('*')).data
    return `${searchHTML} <div class="vehicle-grid">${workers?.map(w => renderCard(w, 'worker')).join('')}</div>`
}

async function renderSales() {
    const searchHTML = renderSearchHeader('Sale', 'Sale Record');
    const sales = isDemoMode ? MOCK_DATA.sales : (await supabase.from('sales').select('*')).data
    return `
        ${searchHTML}
        <div class="glass" style="overflow:auto;">
            <table style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr><th style="padding:1.2rem; text-align:left;">Driver</th><th style="padding:1.2rem; text-align:left;">Date</th><th style="padding:1.2rem; text-align:left;">Amount</th><th style="padding:1.2rem; text-align:left;">Shift</th></tr>
                </thead>
                <tbody>
                    ${sales?.map(s => `
                        <tr style="border-top:1px solid var(--border-color);">
                            <td style="padding:1.2rem;">${s.driver_name || 'Driver'}</td>
                            <td style="padding:1.2rem;">${s.date}</td>
                            <td style="padding:1.2rem; color:var(--success); font-weight:700;">₹${s.amount}</td>
                            <td style="padding:1.2rem;"><span class="badge badge-available">${s.shift}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `
}

async function renderInventory() {
    const searchHTML = renderSearchHeader('Part', 'Inventory');
    const parts = isDemoMode ? MOCK_DATA.inventory : (await supabase.from('inventory').select('*')).data
    return `
        ${searchHTML}
        <div class="vehicle-grid">
            ${parts?.map(p => `
                <div class="glass stat-card">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="font-family:'Outfit';">${p.part_name}</h3>
                        <span style="font-size:0.7rem; color:var(--text-secondary);">${p.part_code}</span>
                    </div>
                    <div style="margin-top:1.5rem; display:flex; justify-content:space-between;">
                        <div>
                            <p style="font-size:0.6rem; color:var(--text-secondary); text-transform:uppercase;">Stock</p>
                            <p style="font-size:1.5rem; font-weight:700; color:${p.quantity <= p.min_stock ? 'var(--danger)' : 'white'}">${p.quantity}</p>
                        </div>
                        <div style="text-align:right;">
                            <p style="font-size:0.6rem; color:var(--text-secondary); text-transform:uppercase;">Price/Unit</p>
                            <p style="font-size:1rem; font-weight:600;">₹${p.unit_price}</p>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `
}

async function renderBanking() {
    const searchHTML = renderSearchHeader('Transaction', 'Banking');
    const tx = isDemoMode ? MOCK_DATA.banking : (await supabase.from('bank_transactions').select('*')).data
    return `
        ${searchHTML}
        <div class="glass" style="overflow:auto;">
            <table style="width:100%; border-collapse:collapse;">
                <thead><tr><th style="padding:1.2rem; text-align:left;">Description</th><th style="padding:1.2rem; text-align:left;">Date</th><th style="padding:1.2rem; text-align:left;">Amount</th></tr></thead>
                <tbody>
                    ${tx?.map(t => `
                        <tr style="border-top:1px solid var(--border-color);">
                            <td style="padding:1.2rem;">${t.description}</td><td style="padding:1.2rem;">${t.date}</td>
                            <td style="padding:1.2rem; color:var(--${t.type === 'deposit' ? 'success' : 'danger'}); font-weight:700;">${t.type === 'deposit' ? '+' : '-'} ₹${t.amount}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `
}

async function renderSalaries() { return renderSimpleTable('Payroll History', MOCK_DATA.salaries, ['recipient', 'amount', 'date']); }
async function renderExpenses() { return renderSimpleTable('Workshop Expenses', MOCK_DATA.expenses, ['category', 'amount', 'date']); }
async function renderSettings() { return `<h2>System Settings</h2><p style="color:var(--text-secondary);">Only visible to SuperAdmin.</p>`; }

// --- REUSABLE COMPONENTS ---

function renderSearchHeader(btnLabel, title) {
    return `
        <header style="margin-bottom: 2rem;">
            <h1 style="font-family: 'Outfit'; font-size:2.5rem;">${title}</h1>
        </header>
        <div class="search-container">
            <div class="search-input-wrapper">
                <i data-lucide="search"></i>
                <input type="text" class="search-input" placeholder="Quick search..." id="mainSearch" value="${searchQuery}">
            </div>
            <button class="btn btn-primary" id="openAddModal">
                <i data-lucide="plus"></i> Add ${btnLabel}
            </button>
        </div>
    `
}

function renderSimpleTable(title, data, columns) {
    return `
        <h2 style="font-family:'Outfit'; margin-bottom:1.5rem;">${title}</h2>
        <div class="glass" style="overflow:auto;">
            <table style="width:100%; border-collapse:collapse;">
                <thead><tr>${columns.map(c => `<th style="padding:1.2rem; text-align:left; text-transform:capitalize;">${c}</th>`).join('')}</tr></thead>
                <tbody>
                    ${data.map(d => `<tr style="border-top:1px solid var(--border-color);">${columns.map(c => `<td style="padding:1.2rem;">${d[c]}</td>`).join('')}</tr>`).join('')}
                </tbody>
            </table>
        </div>
    `
}

function renderStatCard(label, value, trend, type, icon) {
    const colors = { success: '#10b981', danger: '#ef4444', warning: '#f59e0b', primary: '#3b82f6' }
    return `
        <div class="stat-card glass fade-in">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="stat-label">${label}</span>
                <div style="width:32px; height:32px; background:rgba(255,255,255,0.05); border-radius:8px; display:flex; align-items:center; justify-content:center;">
                    <i data-lucide="${icon}" style="width:16px; color: ${colors[type] || colors.primary};"></i>
                </div>
            </div>
            <span class="stat-value">${value}</span>
            <div style="display:flex; align-items:center; gap:5px; font-size: 0.825rem;">
                <span style="color: ${colors[type] || colors.primary}; font-weight:600;">${trend}</span>
                <span style="color:var(--text-secondary); opacity:0.6;">status</span>
            </div>
        </div>
    `
}

function renderCard(item, type) {
    const icons = { vehicle: 'car-front', driver: 'user', worker: 'wrench' }
    const title = type === 'vehicle' ? `${item.make} ${item.model}` : item.full_name
    const subtitle = type === 'vehicle' ? item.plate_number : (item.license_number || item.position)
    
    return `
        <div class="vehicle-card glass fade-in">
            <div style="padding:1.5rem; display:flex; gap:1.2rem; align-items:center;">
                <div style="width:60px; height:60px; background:rgba(255,255,255,0.03); border-radius:12px; display:flex; align-items:center; justify-content:center;">
                    <i data-lucide="${icons[type]}" style="width:24px; color:var(--accent-primary);"></i>
                </div>
                <div style="flex-grow:1;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <h3 style="font-family:'Outfit'; font-size:1.1rem; margin-bottom:2px;">${title}</h3>
                            <p style="font-size:0.75rem; color:var(--text-secondary);">${subtitle}</p>
                        </div>
                        <span class="badge badge-${item.status}">${item.status}</span>
                    </div>
                </div>
            </div>
        </div>
    `
}

// --- EVENTS & AUTH ---

function attachDashboardEvents() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            subView = item.dataset.view
            searchQuery = ''
            render()
        })
    })

    document.querySelector('#logoutBtn').addEventListener('click', async () => {
        if (!isDemoMode) await supabase.auth.signOut()
        currentView = 'login'
        render()
    })

    document.querySelector('#mainSearch')?.addEventListener('input', (e) => {
        searchQuery = e.target.value
        // Real-time render optimization
        const activeContainer = document.querySelector('.vehicle-grid') || document.querySelector('tbody')
        if (activeContainer) render() 
    })
    
    document.querySelector('#openAddModal')?.addEventListener('click', () => alert('Action Modal coming in v2.1'))
}

function renderLogin() {
    return `
        <div class="auth-container">
            <div class="auth-visual-side">
                <div class="auth-overlay"></div>
                <div class="auth-visual-content fade-in">
                    <span style="color:var(--accent-primary); font-weight:700; text-transform:uppercase; letter-spacing:3px; font-size:0.75rem;">Premium Experience</span>
                    <h2>Intelligent Fleet Management</h2>
                    <p style="color:rgba(255,255,255,0.6); line-height:1.6; font-size:1rem; margin-top:-0.5rem;">
                        Command your entire business operations from a single high-performance dashboard. Built for scale, security, and absolute control.
                    </p>
                    <div style="display:flex; gap:20px; margin-top:3rem;">
                        <div style="text-align:left;">
                            <p style="font-size:1.5rem; font-weight:700; font-family:'Outfit';">₹45L+</p>
                            <p style="font-size:0.65rem; color:var(--text-secondary); text-transform:uppercase;">Managed Assets</p>
                        </div>
                        <div style="width:1px; background:rgba(255,255,255,0.1);"></div>
                        <div style="text-align:left;">
                            <p style="font-size:1.5rem; font-weight:700; font-family:'Outfit';">99.9%</p>
                            <p style="font-size:0.65rem; color:var(--text-secondary); text-transform:uppercase;">System Uptime</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="auth-form-side">
                <div class="auth-card fade-in">
                    <div class="brand-logo">
                         <i data-lucide="shield" style="width:32px; height:32px; color:var(--accent-primary);"></i>
                    </div>
                    <h3 style="font-family:'Outfit'; font-size:2rem; margin-bottom:0.5rem;">Secure Login</h3>
                    <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:2.5rem;">Enter your credentials to access Jayvik Labs VMS</p>
                    
                    <form id="loginForm">
                        <div class="input-group">
                            <label>Professional Email</label>
                            <input type="text" id="loginEmail" placeholder="e.g. admin" required>
                        </div>
                        <div class="input-group">
                            <label>Security Password</label>
                            <input type="password" id="loginPass" placeholder="••••••••" required>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; padding:1.2rem; font-size:1rem; margin-top:1.5rem;">
                            Establish Session <i data-lucide="arrow-right" style="width:18px;"></i>
                        </button>
                    </form>
                    
                    <div style="margin-top:2.5rem; padding-top:2rem; border-top:1px solid var(--border-color); text-align:center;">
                        <p style="font-size:0.75rem; color:var(--text-secondary);">Enterprise Solution by <span style="color:white; font-weight:600;">Jayvik Labs</span></p>
                    </div>
                </div>
            </div>
        </div>
    `
}

function attachLoginEvents() {
    document.querySelector('#loginForm').addEventListener('submit', async (e) => {
        e.preventDefault()
        const email = document.querySelector('#loginEmail').value
        const pass = document.querySelector('#loginPass').value
        
        // --- HYBRID LOGIN LOGIC ---
        const demoRoles = ['superadmin', 'admin', 'worker']
        
        // If user enters a demo role name, bypass Supabase for quick testing
        if (demoRoles.includes(email.toLowerCase())) {
            userRole = email.toLowerCase()
            currentView = 'dashboard'
            subView = 'dashboard-home'
            isDemoMode = true // Force demo mode for this session
            render()
            return
        }

        // Otherwise, attempt real Supabase authentication
        if (supabase) {
            const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
            if (error) {
                alert('Live Login Failed: ' + error.message + '\n\nTry "superadmin" or "admin" for Demo Mode.')
            } else {
                currentView = 'dashboard'
                isDemoMode = false
                init()
            }
        } else {
            alert('Supabase is not initialized. Please check your .env keys.')
        }
}

async function renderSystemGuide() {
    return `
        <header style="margin-bottom: 3rem;">
            <h1 style="font-family:'Outfit'; font-size:2.5rem;">System Architecture</h1>
            <p style="color:var(--text-secondary);">Enterprise technical guide for DriveControl Business Suite</p>
        </header>

        <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:2rem;">
            <div class="glass" style="padding:2.5rem; position:relative; overflow:hidden;">
                <div style="position:absolute; top:-20px; right:-20px; opacity:0.1;">
                     <i data-lucide="car" style="width:120px; height:120px; color:var(--accent-primary);"></i>
                </div>
                <h3 style="font-family:'Outfit'; font-size:1.5rem; margin-bottom:1rem; color:var(--accent-primary);">1. Fleet Intelligence</h3>
                <p style="color:var(--text-secondary); line-height:1.6; font-size:0.9rem; margin-bottom:1.5rem;">
                    The core engine manages the lifecycle of taxis and cabs. It tracks registration numbers, fuel types, and real-time maintenance status via a central registry.
                </p>
                <ul style="list-style:none; display:flex; flex-direction:column; gap:8px; font-size:0.85rem;">
                    <li><i data-lucide="check-circle" style="width:14px; color:var(--success); vertical-align:middle; margin-right:8px;"></i> Automated Plate Recognition Logic</li>
                    <li><i data-lucide="check-circle" style="width:14px; color:var(--success); vertical-align:middle; margin-right:8px;"></i> Odometer & Health Monitoring</li>
                </ul>
            </div>

            <div class="glass" style="padding:2.5rem; position:relative; overflow:hidden;">
                <div style="position:absolute; top:-20px; right:-20px; opacity:0.1;">
                     <i data-lucide="users" style="width:120px; height:120px; color:var(--accent-secondary);"></i>
                </div>
                <h3 style="font-family:'Outfit'; font-size:1.5rem; margin-bottom:1rem; color:var(--accent-secondary);">2. Workforce Management</h3>
                <p style="color:var(--text-secondary); line-height:1.6; font-size:0.9rem; margin-bottom:1.5rem;">
                    Handles the dual-stream workforce: Drivers and Internal Staff. Tracks licenses, phone records, and active/inactive status across the enterprise.
                </p>
                <ul style="list-style:none; display:flex; flex-direction:column; gap:8px; font-size:0.85rem;">
                    <li><i data-lucide="check-circle" style="width:14px; color:var(--success); vertical-align:middle; margin-right:8px;"></i> License Expiry Tracking</li>
                    <li><i data-lucide="check-circle" style="width:14px; color:var(--success); vertical-align:middle; margin-right:8px;"></i> Role Assignment & Verification</li>
                </ul>
            </div>

            <div class="glass" style="padding:2.5rem; position:relative; overflow:hidden;">
                <div style="position:absolute; top:-20px; right:-20px; opacity:0.1;">
                     <i data-lucide="banknote" style="width:120px; height:120px; color:var(--success);"></i>
                </div>
                <h3 style="font-family:'Outfit'; font-size:1.5rem; margin-bottom:1rem; color:var(--success);">3. Financial Ecosystem</h3>
                <p style="color:var(--text-secondary); line-height:1.6; font-size:0.9rem; margin-bottom:1.5rem;">
                    A comprehensive cashbook module that bridges Driver daily sales with Bank transactions and Payroll. Logic ensures a balanced ledger.
                </p>
                <ul style="list-style:none; display:flex; flex-direction:column; gap:8px; font-size:0.85rem;">
                    <li><i data-lucide="check-circle" style="width:14px; color:var(--success); vertical-align:middle; margin-right:8px;"></i> Real-time Bank Balance Reconciliation</li>
                    <li><i data-lucide="check-circle" style="width:14px; color:var(--success); vertical-align:middle; margin-right:8px;"></i> Salary Ledger & Reference Generation</li>
                </ul>
            </div>

            <div class="glass" style="padding:2.5rem; position:relative; overflow:hidden;">
                <div style="position:absolute; top:-20px; right:-20px; opacity:0.1;">
                     <i data-lucide="package" style="width:120px; height:120px; color:var(--warning);"></i>
                </div>
                <h3 style="font-family:'Outfit'; font-size:1.5rem; margin-bottom:1rem; color:var(--warning);">4. Inventory Core</h3>
                <p style="color:var(--text-secondary); line-height:1.6; font-size:0.9rem; margin-bottom:1.5rem;">
                    Spare parts monitoring system with stock alerts. Logic automatically flags parts that fall below the Minimum Stock Level (MSL).
                </p>
                <ul style="list-style:none; display:flex; flex-direction:column; gap:8px; font-size:0.85rem;">
                    <li><i data-lucide="check-circle" style="width:14px; color:var(--success); vertical-align:middle; margin-right:8px;"></i> Intelligent Stock Level Warnings</li>
                    <li><i data-lucide="check-circle" style="width:14px; color:var(--success); vertical-align:middle; margin-right:8px;"></i> Part Coding & Unit Price Tracking</li>
                </ul>
            </div>
        </div>
    `
}

init()
