import { createClient } from '@supabase/supabase-js'
import * as lucide from 'lucide'

// Safe Supabase initialization
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let supabase
let isDemoMode = false

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

// --- ENHANCED MOCK DATA ---
const MOCK_DATA = {
    vehicles: [
        { id: 1, make: 'Toyota', model: 'Fortuner', plate_number: 'MH 12 AB 1234', fuel_type: 'Diesel', last_odometer: 45000, status: 'available' },
        { id: 2, make: 'Mahindra', model: 'Scorpio-N', plate_number: 'MH 14 CD 5678', fuel_type: 'Diesel', last_odometer: 12400, status: 'on_trip' },
        { id: 3, make: 'Tesla', model: 'Model 3', plate_number: 'MH 01 EV 0001', fuel_type: 'EV', last_odometer: 8200, status: 'maintenance' },
        { id: 4, make: 'Hyundai', model: 'Creta', plate_number: 'MH 12 XY 9999', fuel_type: 'Petrol', last_odometer: 25000, status: 'available' }
    ],
    drivers: [
        { id: 1, full_name: 'Rahul Sharma', license_number: 'IND-DL-12345678', phone: '+91 9876543210', status: 'active' },
        { id: 2, full_name: 'Amit Patel', license_number: 'IND-DL-87654321', phone: '+91 9123456789', status: 'inactive' },
        { id: 3, full_name: 'Vikram Singh', license_number: 'IND-DL-44556677', phone: '+91 8888888888', status: 'active' }
    ],
    maintenance: [
        { id: 1, vehicles: { make: 'Toyota', model: 'Fortuner', plate_number: 'MH 12 AB 1234' }, service_date: '2026-03-15', description: 'Oil Change & Filter Replacement', cost: 150 },
        { id: 2, vehicles: { make: 'Tesla', model: 'Model 3', plate_number: 'MH 01 EV 0001' }, service_date: '2026-04-01', description: 'Battery System Check', cost: 300 }
    ],
    fuel_logs: [
        { id: 1, vehicles: { plate_number: 'MH 12 AB 1234' }, date: '2026-04-10', liters: 45, cost: 4200, location: 'Shell - Pune' },
        { id: 2, vehicles: { plate_number: 'MH 14 CD 5678' }, date: '2026-04-12', liters: 30, cost: 2800, location: 'HP - Mumbai' }
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
    if (user) currentView = 'dashboard'
    render()
}

async function render() {
    const app = document.querySelector('#app')
    if (currentView === 'login') {
        app.innerHTML = renderLogin()
        attachLoginEvents()
    } else {
        app.innerHTML = `
            <div class="dashboard-layout fade-in">
                <nav class="sidebar glass">
                    <div class="brand">
                        <div style="background:var(--accent-primary); width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center;">
                            <i data-lucide="shield" style="width:18px; color:white;"></i>
                        </div>
                        DriveControl
                    </div>
                    <ul class="nav-links">
                        <li class="nav-item ${subView === 'dashboard-home' ? 'active' : ''}" data-view="dashboard-home">
                            <i data-lucide="layout-dashboard"></i> Dashboard
                        </li>
                        <li class="nav-item ${subView === 'vehicles' ? 'active' : ''}" data-view="vehicles">
                            <i data-lucide="car"></i> Vehicles
                        </li>
                        <li class="nav-item ${subView === 'drivers' ? 'active' : ''}" data-view="drivers">
                            <i data-lucide="users"></i> Drivers
                        </li>
                        <li class="nav-item ${subView === 'fuel' ? 'active' : ''}" data-view="fuel">
                            <i data-lucide="fuel"></i> Fuel Logs
                        </li>
                        <li class="nav-item ${subView === 'maintenance' ? 'active' : ''}" data-view="maintenance">
                            <i data-lucide="wrench"></i> Maintenance
                        </li>
                    </ul>
                    <div class="user-footer" style="margin-top:auto;">
                        <div style="padding:1rem; background:rgba(255,255,255,0.03); border-radius:12px; margin-bottom:1rem; display:flex; gap:10px; align-items:center;">
                            <div style="width:32px; height:32px; background:#4f46e5; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.75rem;">JD</div>
                            <div>
                                <p style="font-size:0.8rem; font-weight:600;">Jaydip Patel</p>
                                <p style="font-size:0.6rem; color:var(--text-secondary);">Administrator</p>
                            </div>
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

async function renderSubView() {
    if (subView === 'dashboard-home') {
        return renderDashboard()
    }
    
    // Header for sub-views
    const viewTitles = {
        'vehicles': 'Vehicle Inventory',
        'drivers': 'Manage Drivers',
        'fuel': 'Fuel Consumption',
        'maintenance': 'Service History'
    }

    let searchHTML = ''
    if (['vehicles', 'drivers'].includes(subView)) {
        searchHTML = `
            <div class="search-container">
                <div class="search-input-wrapper">
                    <i data-lucide="search"></i>
                    <input type="text" class="search-input" placeholder="Search by name, plate, or status..." id="mainSearch" value="${searchQuery}">
                </div>
                <button class="btn btn-primary" id="openAdd${subView === 'vehicles' ? 'Vehicle' : 'Driver'}Modal">
                    <i data-lucide="plus"></i> Add ${subView === 'vehicles' ? 'Vehicle' : 'Driver'}
                </button>
            </div>
        `
    }

    let content = ''
    if (subView === 'vehicles') {
        const vehicles = isDemoMode ? MOCK_DATA.vehicles : (await supabase.from('vehicles').select('*')).data
        const filtered = vehicles?.filter(v => 
            v.make.toLowerCase().includes(searchQuery.toLowerCase()) || 
            v.model.toLowerCase().includes(searchQuery.toLowerCase()) || 
            v.plate_number.toLowerCase().includes(searchQuery.toLowerCase())
        )
        content = `<div class="vehicle-grid">${filtered?.map(v => renderVehicleCard(v)).join('') || '<p>No matching vehicles.</p>'}</div>`
    }
    
    if (subView === 'drivers') {
        const drivers = isDemoMode ? MOCK_DATA.drivers : (await supabase.from('drivers').select('*')).data
        const filtered = drivers?.filter(d => d.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
        content = `<div class="vehicle-grid">${filtered?.map(d => renderDriverCard(d)).join('') || '<p>No drivers found.</p>'}</div>`
    }

    if (subView === 'fuel') {
        const logs = isDemoMode ? MOCK_DATA.fuel_logs : (await supabase.from('fuel_logs').select('*, vehicles(plate_number)')).data
        content = renderFuelTable(logs)
    }

    if (subView === 'maintenance') {
        const logs = isDemoMode ? MOCK_DATA.maintenance : (await supabase.from('maintenance_logs').select('*, vehicles(plate_number, make, model)')).data
        content = renderMaintenanceTable(logs)
    }

    return `
        <header style="margin-bottom: 2rem;">
            <h1 style="font-family: 'Outfit'; font-size:2.5rem;">${viewTitles[subView]}</h1>
            <p style="color: var(--text-secondary);">Manage and monitor your fleet records in real-time</p>
        </header>
        ${searchHTML}
        ${content}
    `
}

function renderDashboard() {
    return `
        <header>
            <h1 style="font-family: 'Outfit'; font-size:2.5rem;">Fleet Analytics</h1>
            <p style="color: var(--text-secondary);">Welcome back, Jaydip. Here's what's happening today.</p>
        </header>
        <div class="stats-grid" style="margin-top: 2rem;">
            ${renderStatCard('Vehicles', '24', 'Active', 'success', 'car')}
            ${renderStatCard('Drivers', '18', 'Online', 'success', 'users')}
            ${renderStatCard('Fuel Spent', '₹1.2L', 'Monthly', 'warning', 'fuel')}
            ${renderStatCard('Safety Score', '94%', '+2.1%', 'success', 'shield-check')}
        </div>
        
        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:1.5rem; margin-top:2rem;">
            <div class="glass" style="padding:2rem;">
                <h3 style="margin-bottom:1.5rem; font-family:'Outfit';">Monthly Utilization</h3>
                <div style="height:300px; display:flex; align-items:flex-end; gap:20px; padding-bottom:20px; border-bottom:1px solid var(--border-color);">
                    <div style="flex:1; background:var(--accent-primary); height:60%; border-radius:8px 8px 0 0; position:relative;" title="Jan"></div>
                    <div style="flex:1; background:var(--accent-primary); height:40%; border-radius:8px 8px 0 0; position:relative;" title="Feb"></div>
                    <div style="flex:1; background:var(--accent-primary); height:70%; border-radius:8px 8px 0 0; position:relative;" title="Mar"></div>
                    <div style="flex:1; background:var(--accent-secondary); height:90%; border-radius:8px 8px 0 0; position:relative;" title="Apr"></div>
                </div>
                <p style="text-align:center; font-size:0.8rem; color:var(--text-secondary); margin-top:10px;">Jan &nbsp;&nbsp;&nbsp; Feb &nbsp;&nbsp;&nbsp; Mar &nbsp;&nbsp;&nbsp; Apr (Current)</p>
            </div>
            <div class="glass" style="padding:2rem;">
                <h3 style="margin-bottom:1.5rem; font-family:'Outfit';">Recent Activity</h3>
                <div style="display:flex; flex-direction:column; gap:1.5rem;">
                    ${renderActivityItem('Vehicle MH 12 checked in', '10 mins ago', 'success')}
                    ${renderActivityItem('Service due for MH 14', '2 hours ago', 'warning')}
                    ${renderActivityItem('Fuel logged for MH 01', '5 hours ago', 'primary')}
                </div>
            </div>
        </div>
    `
}

function renderActivityItem(text, time, type) {
    const colors = { success: '#10b981', warning: '#f59e0b', primary: '#3b82f6' }
    return `
        <div style="display:flex; gap:15px; align-items:center;">
            <div style="width:8px; height:8px; border-radius:50%; background:${colors[type]}"></div>
            <div>
                <p style="font-size:0.85rem; font-weight:500;">${text}</p>
                <p style="font-size:0.7rem; color:var(--text-secondary);">${time}</p>
            </div>
        </div>
    `
}

function renderFuelTable(logs) {
    return `
        <div class="glass" style="overflow:auto;">
            <table style="width:100%; border-collapse:collapse;">
                <thead style="background: rgba(255,255,255,0.02);">
                    <tr>
                        <th style="padding:1.2rem; text-align:left; color:var(--text-secondary);">Vehicle</th>
                        <th style="padding:1.2rem; text-align:left; color:var(--text-secondary);">Date</th>
                        <th style="padding:1.2rem; text-align:left; color:var(--text-secondary);">Liters</th>
                        <th style="padding:1.2rem; text-align:left; color:var(--text-secondary);">Amount</th>
                        <th style="padding:1.2rem; text-align:left; color:var(--text-secondary);">Vendor</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs?.map(l => `
                        <tr style="border-top:1px solid var(--border-color); transition:background 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                            <td style="padding:1.2rem; font-weight:600;">${l.vehicles?.plate_number}</td>
                            <td style="padding:1.2rem;">${l.date}</td>
                            <td style="padding:1.2rem;">${l.liters} L</td>
                            <td style="padding:1.2rem; color:var(--success);">₹${l.cost}</td>
                            <td style="padding:1.2rem; color:var(--text-secondary);">${l.location}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="5" style="padding:3rem; text-align:center;">No fuel logs found.</td></tr>'}
                </tbody>
            </table>
        </div>
    `
}

function renderMaintenanceTable(logs) {
    return `
         <div class="glass" style="overflow:auto;">
            <table style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr>
                        <th style="padding:1.2rem; text-align:left; color:var(--text-secondary);">Vehicle</th>
                        <th style="padding:1.2rem; text-align:left; color:var(--text-secondary);">Service Date</th>
                        <th style="padding:1.2rem; text-align:left; color:var(--text-secondary);">Work Description</th>
                        <th style="padding:1.2rem; text-align:left; color:var(--text-secondary);">Total Cost</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs?.map(l => `
                        <tr style="border-top:1px solid var(--border-color); transition:background 0.3s;">
                            <td style="padding:1.2rem; font-weight:600;">${l.vehicles?.make} ${l.vehicles?.model}</td>
                            <td style="padding:1.2rem;">${new Date(l.service_date).toDateString()}</td>
                            <td style="padding:1.2rem; color: var(--text-secondary);">${l.description}</td>
                            <td style="padding:1.2rem; font-weight:700;">$${l.cost}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="4" style="padding:3rem; text-align:center;">No service history available.</td></tr>'}
                </tbody>
            </table>
         </div>
    `
}

function renderStatCard(label, value, trend, type, icon) {
    return `
        <div class="stat-card glass fade-in">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="stat-label">${label}</span>
                <div style="width:32px; height:32px; background:rgba(255,255,255,0.05); border-radius:8px; display:flex; align-items:center; justify-content:center;">
                    <i data-lucide="${icon}" style="width:16px; color: var(--accent-primary);"></i>
                </div>
            </div>
            <span class="stat-value">${value}</span>
            <div style="display:flex; align-items:center; gap:5px; font-size: 0.825rem;">
                <span style="color: var(--${type === 'success' ? 'success' : 'warning'}); font-weight:600;">${trend}</span>
                <span style="color:var(--text-secondary); opacity:0.6;">vs last week</span>
            </div>
        </div>
    `
}

function renderVehicleCard(v) {
    return `
        <div class="vehicle-card glass fade-in">
            <div class="vehicle-img" style="height:180px; background: linear-gradient(135deg, #111, #222); display:flex; flex-direction:column; align-items:center; justify-content:center; border-bottom:1px solid var(--border-color);">
                <i data-lucide="car-front" style="width:64px; height:64px; color:var(--accent-primary); opacity:0.8;"></i>
                <div style="margin-top:1rem; padding:4px 12px; background:rgba(0,0,0,0.5); border-radius:4px; font-monospace; font-size:0.7rem; border:1px solid var(--border-color);">
                    ${v.plate_number}
                </div>
            </div>
            <div class="vehicle-info">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.2rem;">
                    <div>
                        <h3 style="font-family:'Outfit'; font-size:1.25rem;">${v.make} ${v.model}</h3>
                        <p style="font-size:0.75rem; color:var(--text-secondary);">${v.fuel_type} • ID: ${v.id}</p>
                    </div>
                    <span class="badge badge-${v.status}">${v.status.replace('_', ' ')}</span>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <div style="background:rgba(255,255,255,0.02); padding:10px; border-radius:8px; border:1px solid var(--border-color);">
                        <p style="font-size:0.6rem; color:var(--text-secondary); text-transform:uppercase;">Odometer</p>
                        <p style="font-size:0.9rem; font-weight:700;">${v.last_odometer} km</p>
                    </div>
                    <div style="background:rgba(255,255,255,0.02); padding:10px; border-radius:8px; border:1px solid var(--border-color);">
                        <p style="font-size:0.6rem; color:var(--text-secondary); text-transform:uppercase;">Usage</p>
                        <p style="font-size:0.9rem; font-weight:700;">88%</p>
                    </div>
                </div>
            </div>
        </div>
    `
}

function renderDriverCard(d) {
    return `
        <div class="vehicle-card glass fade-in" style="display:flex; padding:1.5rem; gap:1.5rem; align-items:center;">
            <div style="width:70px; height:70px; background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); border-radius:18px; display:flex; align-items:center; justify-content:center; font-size:1.5rem; font-weight:800; color:white; box-shadow: 0 10px 20px rgba(79, 70, 229, 0.3);">
                ${d.full_name.charAt(0)}
            </div>
            <div style="flex-grow:1;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <h3 style="font-family:'Outfit'; font-size:1.1rem; margin-bottom:4px;">${d.full_name}</h3>
                        <p style="font-size:0.8rem; color: var(--text-secondary);"><i data-lucide="hash" style="width:12px; display:inline;"></i> ${d.license_number}</p>
                    </div>
                    <span class="badge badge-${d.status}">${d.status}</span>
                </div>
                <div style="margin-top:1rem; display:flex; gap:1rem; font-size:0.8rem; color: var(--text-secondary);">
                    <span><i data-lucide="phone" style="width:12px; display:inline;"></i> ${d.phone}</span>
                    <span><i data-lucide="star" style="width:12px; display:inline; color:var(--warning);"></i> 4.9</span>
                </div>
            </div>
        </div>
    `
}

function attachDashboardEvents() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            subView = item.dataset.view
            searchQuery = '' // Reset search on view change
            render()
        })
    })

    document.querySelector('#logoutBtn').addEventListener('click', async () => {
        if (!isDemoMode) await supabase.auth.signOut()
        currentView = 'login'
        render()
    })

    // Search logic
    const searchInput = document.querySelector('#mainSearch')
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value
            renderSubView().then(html => {
                document.querySelector('.content').innerHTML = html
                lucide.createIcons()
                // Re-attach modal openers since content was replaced
                attachModalTriggers()
            })
        })
    }

    attachModalTriggers()
}

function attachModalTriggers() {
    document.querySelector('#openAddVehicleModal')?.addEventListener('click', showAddVehicleModal)
    document.querySelector('#openAddDriverModal')?.addEventListener('click', showAddDriverModal)
}

function showAddVehicleModal() {
    const modal = document.querySelector('#modalContainer')
    modal.innerHTML = `
        <div class="modal-overlay active">
            <div class="modal-content glass fade-in">
                <h2 style="font-family:'Outfit'; margin-bottom:1.5rem; font-size:1.75rem;">Add New Fleet Vehicle</h2>
                <form id="addVehicleForm">
                    <div class="input-group">
                        <label>Make / Brand</label>
                        <input type="text" id="vMake" placeholder="e.g. Toyota" required>
                    </div>
                    <div class="input-group">
                        <label>Model Name</label>
                        <input type="text" id="vModel" placeholder="e.g. Camry" required>
                    </div>
                    <div class="input-group">
                        <label>License Plate Number</label>
                        <input type="text" id="vPlate" placeholder="e.g. MH 12 AB 0001" required>
                    </div>
                    <div class="input-group">
                        <label>Fuel Configuration</label>
                        <select id="vFuel" style="width:100%;">
                            <option value="Petrol">Petrol (91/95)</option>
                            <option value="Diesel">Diesel (V-Power)</option>
                            <option value="EV">Electric (100% BEV)</option>
                            <option value="CNG">Compressed Natural Gas</option>
                        </select>
                    </div>
                    <div style="display:flex; gap:1rem; margin-top:2rem;">
                        <button type="button" class="btn" style="flex:1; background:rgba(255,255,255,0.05); color:white; border:1px solid var(--border-color);" onclick="document.querySelector('.modal-overlay').classList.remove('active')">Cancel</button>
                        <button type="submit" class="btn btn-primary" style="flex:1; justify-content:center;">Register Vehicle</button>
                    </div>
                </form>
            </div>
        </div>
    `
    document.querySelector('#addVehicleForm').addEventListener('submit', async (e) => {
        e.preventDefault()
        const data = {
            id: Date.now(),
            make: document.querySelector('#vMake').value,
            model: document.querySelector('#vModel').value,
            plate_number: document.querySelector('#vPlate').value,
            fuel_type: document.querySelector('#vFuel').value,
            last_odometer: 0,
            status: 'available'
        }
        if (isDemoMode) {
            MOCK_DATA.vehicles.unshift(data)
            render()
        } else {
            const { error } = await supabase.from('vehicles').insert([data])
            if (error) alert(error.message)
            else render()
        }
    })
}

function showAddDriverModal() {
    const modal = document.querySelector('#modalContainer')
    modal.innerHTML = `
        <div class="modal-overlay active">
            <div class="modal-content glass fade-in">
                <h2 style="font-family:'Outfit'; margin-bottom:1.5rem; font-size:1.75rem;">Register New Driver</h2>
                <form id="addDriverForm">
                    <div class="input-group">
                        <label>Full Name</label>
                        <input type="text" id="dName" placeholder="Enter legal name" required>
                    </div>
                    <div class="input-group">
                        <label>Professional License No.</label>
                        <input type="text" id="dLicense" placeholder="IND-DL-..." required>
                    </div>
                    <div class="input-group">
                        <label>Direct Contact Number</label>
                        <input type="text" id="dPhone" placeholder="+91 ..." required>
                    </div>
                    <div style="display:flex; gap:1rem; margin-top:2rem;">
                        <button type="button" class="btn" style="flex:1; background:rgba(255,255,255,0.05); color:white; border:1px solid var(--border-color);" onclick="document.querySelector('.modal-overlay').classList.remove('active')">Dismiss</button>
                        <button type="submit" class="btn btn-primary" style="flex:1; justify-content:center;">Approve & Add</button>
                    </div>
                </form>
            </div>
        </div>
    `
    document.querySelector('#addDriverForm').addEventListener('submit', async (e) => {
        e.preventDefault()
        const data = {
            id: Date.now(),
            full_name: document.querySelector('#dName').value,
            license_number: document.querySelector('#dLicense').value,
            phone: document.querySelector('#dPhone').value,
            status: 'active'
        }
        if (isDemoMode) {
            MOCK_DATA.drivers.unshift(data)
            render()
        } else {
            const { error } = await supabase.from('drivers').insert([data])
            if (error) alert(error.message)
            else render()
        }
    })
}

function renderLogin() {
    return `
        <div class="auth-container">
            <div class="auth-card glass fade-in" style="box-shadow: 0 0 80px rgba(59, 130, 246, 0.1);">
                <div style="margin-bottom:2rem; display:inline-block; padding:15px; background:rgba(255,255,255,0.03); border-radius:24px; border:1px solid var(--border-color);">
                     <i data-lucide="shield" style="width:40px; height:40px; color:var(--accent-primary);"></i>
                </div>
                <h1 style="font-family:'Outfit'; font-size:3rem; letter-spacing:-1px;">DriveControl</h1>
                <p style="color:var(--text-secondary); margin-bottom:2.5rem; font-size:0.9rem;">Advanced Vehicle Management Solution</p>
                <form id="loginForm">
                    <div class="input-group" style="text-align:left;">
                        <label>Work Identity (User/Email)</label>
                        <input type="text" id="email" placeholder="${isDemoMode ? 'admin' : 'your@company.com'}" required style="padding-left:15px;">
                    </div>
                    <div class="input-group" style="text-align:left;">
                        <label>Security Key (Password)</label>
                        <input type="password" id="password" required style="padding-left:15px;">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; padding:15px; font-size:1rem; margin-top:1rem;">
                        Establish Session <i data-lucide="arrow-right" style="width:18px;"></i>
                    </button>
                    ${isDemoMode ? '<p style="margin-top:2rem; color:var(--accent-primary); font-size:0.75rem; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Demo Session: admin / admin</p>' : ''}
                </form>
            </div>
        </div>
    `
}

function attachLoginEvents() {
    document.querySelector('#loginForm').addEventListener('submit', async (e) => {
        e.preventDefault()
        const email = document.querySelector('#email').value
        const password = document.querySelector('#password').value
        
        if (isDemoMode) {
            if (email === 'admin' && password === 'admin') {
                currentView = 'dashboard'
                render()
            } else {
                alert('Invalid Credentials for Demo Access.')
            }
            return
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) alert(error.message)
        else {
            currentView = 'dashboard'
            render()
        }
    })
}

init()
