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
            <div class="dashboard-layout fade-in">
                <nav class="sidebar glass">
                    <div class="brand">
                        <div style="background:var(--accent-primary); width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                            <i data-lucide="shield" style="width:18px; color:white;"></i>
                        </div>
                        DriveControl
                    </div>
                    <ul class="nav-links">
                        ${accessibleViews.map(view => `
                            <li class="nav-item ${subView === view.id ? 'active' : ''}" data-view="${view.id}">
                                <i data-lucide="${view.icon}"></i> ${view.label}
                            </li>
                        `).join('')}
                    </ul>
                    <div class="user-footer" style="margin-top:auto;">
                        <div style="padding:1rem; background:rgba(255,255,255,0.03); border-radius:12px; margin-bottom:1rem;">
                            <p style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:1px; margin-bottom:5px;">Session: ${userRole}</p>
                            <p style="font-size:0.85rem; font-weight:600;">${isDemoMode ? 'Jaydip Jadhav' : 'Authenticated User'}</p>
                        </div>
                        <button id="logoutBtn" class="btn btn-outline" style="width:100%; border:1px solid var(--border-color); color: white; justify-content:center;">
                             <i data-lucide="log-out"></i> Logout
                        </button>
                    </div>
                </nav>
                <main class="content">
                    ${await renderSubView()}
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
        { id: 'workers', label: 'Workers', icon: 'wrench', roles: ['superadmin', 'admin'] },
        { id: 'sales', label: 'Sales/Cashbook', icon: 'banknote', roles: ['superadmin', 'admin', 'worker'] },
        { id: 'inventory', label: 'Inventories', icon: 'package', roles: ['superadmin', 'admin'] },
        { id: 'banking', label: 'Bank & Finance', icon: 'wallet', roles: ['superadmin', 'admin'] },
        { id: 'salaries', label: 'Payroll', icon: 'coins', roles: ['superadmin', 'admin'] },
        { id: 'expenses', label: 'Workshop Exp', icon: 'history', roles: ['superadmin', 'admin'] },
        { id: 'settings', label: 'System Settings', icon: 'settings', roles: ['superadmin'] }
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
        'settings': renderSettings
    }
    return views[subView] ? await views[subView]() : '<h2>View Not Found</h2>'
}

// --- VIEW RENDERERS ---

async function renderDashboard() {
    return `
        <header>
            <h1 style="font-family: 'Outfit'; font-size:2.5rem;">Enterprise Overview</h1>
            <p style="color: var(--text-secondary);">Business summary for Jayvik Labs Systems</p>
        </header>
        <div class="stats-grid" style="margin-top: 2rem;">
            ${renderStatCard('Total Assets', '₹45L', 'Fleet Value', 'success', 'car')}
            ${renderStatCard('Cash in Hand', '₹1.24L', 'Today', 'success', 'banknote')}
            ${renderStatCard('Bank Balance', '₹18.5L', 'Safe', 'success', 'wallet')}
            ${renderStatCard('Exp. Month', '₹12K', 'Workshop', 'danger', 'history')}
        </div>
        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:1.5rem; margin-top:2rem;">
            <div class="glass" style="padding:2rem;">
                <h3 style="margin-bottom:1.5rem; font-family:'Outfit';">Revenue vs Expenses</h3>
                <div style="height:250px; display:flex; align-items:flex-end; gap:20px; padding-bottom:10px; border-bottom:1px solid var(--border-color);">
                    <div style="flex:1; background:var(--accent-primary); height:85%; border-radius:6px; transition:height 0.5s;"></div>
                    <div style="flex:1; background:var(--danger); height:30%; border-radius:6px; transition:height 0.5s;"></div>
                    <div style="flex:1; background:var(--accent-primary); height:70%; border-radius:6px; transition:height 0.5s;"></div>
                    <div style="flex:1; background:var(--danger); height:25%; border-radius:6px; transition:height 0.5s;"></div>
                </div>
                <div style="display:flex; justify-content:center; gap:20px; margin-top:15px; font-size:0.75rem;">
                    <span><i style="color:var(--accent-primary)">●</i> Revenue</span>
                    <span><i style="color:var(--danger)">●</i> Expenses</span>
                </div>
            </div>
            <div class="glass" style="padding:2rem;">
                <h3 style="margin-bottom:1.5rem; font-family:'Outfit';">Low Stock Alerts</h3>
                <div style="display:flex; flex-direction:column; gap:1rem;">
                    ${MOCK_DATA.inventory.filter(i => i.quantity < i.min_stock + 1).map(i => `
                        <div style="padding:10px; background:rgba(239, 68, 68, 0.05); border:1px solid rgba(239, 68, 68, 0.1); border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:0.85rem;">${i.part_name}</span>
                            <span style="color:var(--danger); font-weight:700;">${i.quantity} left</span>
                        </div>
                    `).join('')}
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
        
        if (isDemoMode) {
            const roles = ['superadmin', 'admin', 'worker']
            if (roles.includes(email.toLowerCase())) {
                userRole = email.toLowerCase()
                currentView = 'dashboard'
                subView = 'dashboard-home'
                render()
            } else {
                alert('For Demo, type a role in the Email field: superadmin, admin, or worker.')
            }
            return
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
        if (error) alert(error.message)
        else {
            currentView = 'dashboard'
            init()
        }
    })
}

init()
