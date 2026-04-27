/**
 * Subscription Renewal Calendar Component
 * Displays accurate renewal dates based on real user data
 */

class SubscriptionCalendar {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.currentDate = new Date();
    this.currentMonth = this.currentDate.getMonth();
    this.currentYear = this.currentDate.getFullYear();
    this.renewalData = {};
    this.userId = options.userId || '1';
    this.onDateClick = options.onDateClick || null;
    
    this.monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    this.dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    this.init();
  }
  
  async init() {
    this.createCalendarStructure();
    await this.loadRenewalData();
    this.renderCalendar();
    this.setupEventListeners();
  }
  
  createCalendarStructure() {
    this.container.innerHTML = `
      <div class="calendar-container">
        <div class="calendar-header">
          <button class="calendar-nav prev" data-nav="prev">
            <i data-feather="chevron-left"></i>
          </button>
          <h3 class="calendar-title">
            ${this.monthNames[this.currentMonth]} ${this.currentYear}
          </h3>
          <button class="calendar-nav next" data-nav="next">
            <i data-feather="chevron-right"></i>
          </button>
        </div>
        
        <div class="calendar-legend">
          <div class="legend-item">
            <span class="legend-dot monthly"></span>
            <span>Monthly</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot quarterly"></span>
            <span>Quarterly</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot annual"></span>
            <span>Annual</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot estimated"></span>
            <span>Estimated</span>
          </div>
        </div>
        
        <div class="calendar-days-header">
          ${this.dayNames.map(day => `<div class="day-header">${day}</div>`).join('')}
        </div>
        
        <div class="calendar-grid" id="calendar-grid">
          <!-- Calendar days will be populated here -->
        </div>
        
        <div class="calendar-summary" id="calendar-summary">
          <!-- Summary will be populated here -->
        </div>
      </div>
    `;
    
    // Initialize feather icons
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }
  
  async loadRenewalData() {
    try {
      console.log('📅 Loading calendar renewal data...');
      
      const response = await fetch(`/api/calendar/renewals/${this.userId}?months=24`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.renewalData = data.renewals;
          this.summary = data.summary;
          console.log('📅 Loaded renewal data:', Object.keys(this.renewalData).length, 'dates');
        }
      } else {
        console.warn('Failed to load renewal data');
        this.renewalData = {};
        this.summary = { total_subscriptions: 0, monthly_renewals: 0, annual_renewals: 0 };
      }
    } catch (error) {
      console.error('Calendar data loading error:', error);
      this.renewalData = {};
      this.summary = { total_subscriptions: 0, monthly_renewals: 0, annual_renewals: 0 };
    }
  }
  
  renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    let calendarHTML = '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let week = 0; week < 6; week++) {
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (week * 7) + day);
        
        const dateKey = currentDate.toISOString().split('T')[0];
        const renewals = this.renewalData[dateKey] || [];
        const isCurrentMonth = currentDate.getMonth() === this.currentMonth;
        const isToday = currentDate.getTime() === today.getTime();
        const isInPast = currentDate < today;
        
        let dayClasses = ['calendar-day'];
        if (!isCurrentMonth) dayClasses.push('other-month');
        if (isToday) dayClasses.push('today');
        if (isInPast) dayClasses.push('past');
        if (renewals.length > 0) dayClasses.push('has-renewals');
        
        // Calculate total amount for the day
        const totalAmount = renewals.reduce((sum, renewal) => sum + (renewal.amount || 0), 0);
        
        calendarHTML += `
          <div class="${dayClasses.join(' ')}" data-date="${dateKey}">
            <div class="day-number">${currentDate.getDate()}</div>
            ${renewals.length > 0 ? `
              <div class="renewals-container">
                ${renewals.slice(0, 2).map(renewal => `
                  <div class="renewal-item ${renewal.billing_frequency} ${renewal.is_estimated ? 'estimated' : ''}" title="${renewal.vendor_name} - $${renewal.amount} (${renewal.billing_frequency})">
                    <span class="vendor-name">${renewal.vendor_name.substring(0, 8)}${renewal.vendor_name.length > 8 ? '...' : ''}</span>
                    <span class="amount">$${Math.round(renewal.amount)}</span>
                  </div>
                `).join('')}
                ${renewals.length > 2 ? `
                  <div class="more-renewals">+${renewals.length - 2} more</div>
                ` : ''}
              </div>
            ` : ''}
            ${totalAmount > 0 ? `
              <div class="day-total">$${Math.round(totalAmount)}</div>
            ` : ''}
          </div>
        `;
      }
    }
    
    grid.innerHTML = calendarHTML;
    this.renderSummary();
    
    // Re-initialize feather icons
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }
  
  renderSummary() {
    const summaryContainer = document.getElementById('calendar-summary');
    
    // Calculate month summary
    const monthStart = new Date(this.currentYear, this.currentMonth, 1);
    const monthEnd = new Date(this.currentYear, this.currentMonth + 1, 0);
    
    let monthlyTotal = 0;
    let monthlyRenewals = 0;
    
    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      const renewals = this.renewalData[dateKey] || [];
      monthlyRenewals += renewals.length;
      monthlyTotal += renewals.reduce((sum, renewal) => sum + (renewal.amount || 0), 0);
    }
    
    summaryContainer.innerHTML = `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-value">${monthlyRenewals}</div>
          <div class="summary-label">Renewals This Month</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">$${monthlyTotal.toFixed(0)}</div>
          <div class="summary-label">Monthly Total</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${this.summary?.total_subscriptions || 0}</div>
          <div class="summary-label">Total Subscriptions</div>
        </div>
      </div>
    `;
  }
  
  setupEventListeners() {
    // Navigation buttons
    this.container.addEventListener('click', (e) => {
      if (e.target.closest('[data-nav="prev"]')) {
        this.previousMonth();
      } else if (e.target.closest('[data-nav="next"]')) {
        this.nextMonth();
      } else if (e.target.closest('.calendar-day')) {
        const dayElement = e.target.closest('.calendar-day');
        const date = dayElement.dataset.date;
        this.handleDayClick(date, dayElement);
      }
    });
  }
  
  previousMonth() {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.updateCalendarTitle();
    this.renderCalendar();
  }
  
  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.updateCalendarTitle();
    this.renderCalendar();
  }
  
  updateCalendarTitle() {
    const titleElement = this.container.querySelector('.calendar-title');
    titleElement.textContent = `${this.monthNames[this.currentMonth]} ${this.currentYear}`;
  }
  
  handleDayClick(dateKey, dayElement) {
    const renewals = this.renewalData[dateKey] || [];
    
    if (renewals.length === 0) return;
    
    // Remove existing popover
    this.removePopover();
    
    // Create popover with renewal details
    const popover = document.createElement('div');
    popover.className = 'renewal-popover';
    popover.innerHTML = `
      <div class="popover-header">
        <h4>Renewals on ${new Date(dateKey).toLocaleDateString()}</h4>
        <button class="close-popover">&times;</button>
      </div>
      <div class="popover-content">
        ${renewals.map(renewal => `
          <div class="renewal-detail ${renewal.billing_frequency}">
            <div class="renewal-vendor">
              <strong>${renewal.vendor_name}</strong>
              ${renewal.is_estimated ? '<span class="estimated-badge">Estimated</span>' : ''}
            </div>
            <div class="renewal-info">
              <span class="amount">$${renewal.amount}</span>
              <span class="frequency">${renewal.billing_frequency}</span>
              ${renewal.license_count > 1 ? `<span class="licenses">${renewal.license_count} licenses</span>` : ''}
            </div>
            ${renewal.subscription_plan ? `<div class="plan">${renewal.subscription_plan}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
    
    // Position popover
    const rect = dayElement.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    
    popover.style.position = 'absolute';
    popover.style.left = `${rect.left - containerRect.left}px`;
    popover.style.top = `${rect.bottom - containerRect.top + 5}px`;
    popover.style.zIndex = '1000';
    
    this.container.style.position = 'relative';
    this.container.appendChild(popover);
    
    // Add close event listener
    popover.querySelector('.close-popover').addEventListener('click', () => {
      this.removePopover();
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!popover.contains(e.target) && !dayElement.contains(e.target)) {
        this.removePopover();
      }
    }, { once: true });
    
    // Call custom click handler if provided
    if (this.onDateClick) {
      this.onDateClick(dateKey, renewals);
    }
  }
  
  removePopover() {
    const existingPopover = this.container.querySelector('.renewal-popover');
    if (existingPopover) {
      existingPopover.remove();
    }
  }
  
  // Public methods for external control
  async refresh() {
    await this.loadRenewalData();
    this.renderCalendar();
  }
  
  goToDate(year, month) {
    this.currentYear = year;
    this.currentMonth = month;
    this.updateCalendarTitle();
    this.renderCalendar();
  }
  
  async enhanceWithAI() {
    try {
      console.log('🤖 Enhancing calendar data with AI...');
      
      // Get current subscriptions data
      const subscriptionsResponse = await fetch('/api/subscriptions', {
        credentials: 'include'
      });
      
      if (!subscriptionsResponse.ok) return;
      
      const subscriptionsData = await subscriptionsResponse.json();
      if (!subscriptionsData.success) return;
      
      // Send to AI enhancement
      const enhanceResponse = await fetch(`/api/calendar/enhance/${this.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          subscriptions: subscriptionsData.subscriptions
        })
      });
      
      if (enhanceResponse.ok) {
        const enhancedData = await enhanceResponse.json();
        console.log('🤖 AI enhancement completed');
        
        // Reload calendar with enhanced data
        await this.refresh();
        
        return enhancedData;
      }
    } catch (error) {
      console.error('AI enhancement error:', error);
    }
  }
}

// Calendar styles
const calendarStyles = `
  <style>
  .calendar-container {
    max-width: 100%;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    overflow: hidden;
  }

  .calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: white;
  }

  .calendar-nav {
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    padding: 0.5rem;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .calendar-nav:hover {
    background: rgba(255,255,255,0.3);
  }

  .calendar-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  .calendar-legend {
    display: flex;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    flex-wrap: wrap;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #64748b;
  }

  .legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .legend-dot.monthly { background: #10b981; }
  .legend-dot.quarterly { background: #f59e0b; }
  .legend-dot.annual { background: #3b82f6; }
  .legend-dot.estimated { background: #64748b; border: 2px dashed #94a3b8; }

  .calendar-days-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  .day-header {
    padding: 1rem 0.5rem;
    text-align: center;
    font-weight: 600;
    color: #64748b;
    font-size: 0.875rem;
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background: #e2e8f0;
  }

  .calendar-day {
    min-height: 100px;
    background: white;
    padding: 0.5rem;
    position: relative;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .calendar-day:hover {
    background: #f8fafc;
  }

  .calendar-day.other-month {
    background: #f8fafc;
    color: #94a3b8;
  }

  .calendar-day.today {
    background: #eff6ff;
    border: 2px solid #3b82f6;
  }

  .calendar-day.past {
    opacity: 0.7;
  }

  .calendar-day.has-renewals {
    background: #fefce8;
  }

  .day-number {
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .renewals-container {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 0.25rem;
  }

  .renewal-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 0.75rem;
    line-height: 1.2;
  }

  .renewal-item.monthly { background: #d1fae5; color: #065f46; }
  .renewal-item.quarterly { background: #fef3c7; color: #92400e; }
  .renewal-item.annual { background: #dbeafe; color: #1e40af; }
  .renewal-item.estimated { background: #f1f5f9; color: #475569; opacity: 0.8; }

  .vendor-name {
    font-weight: 500;
    flex: 1;
  }

  .amount {
    font-weight: 600;
    font-size: 0.7rem;
  }

  .more-renewals {
    font-size: 0.7rem;
    color: #64748b;
    text-align: center;
    padding: 2px;
  }

  .day-total {
    position: absolute;
    bottom: 2px;
    right: 4px;
    font-size: 0.7rem;
    font-weight: 700;
    color: #059669;
    background: white;
    padding: 1px 3px;
    border-radius: 2px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }

  .calendar-summary {
    padding: 1.5rem;
    background: #f8fafc;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }

  .summary-card {
    text-align: center;
    padding: 1rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .summary-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.25rem;
  }

  .summary-label {
    font-size: 0.875rem;
    color: #64748b;
  }

  .renewal-popover {
    background: white;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    border: 1px solid #e2e8f0;
    min-width: 300px;
    max-width: 400px;
  }

  .popover-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  .popover-header h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
  }

  .close-popover {
    background: none;
    border: none;
    font-size: 1.25rem;
    color: #64748b;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .popover-content {
    padding: 1rem;
    max-height: 300px;
    overflow-y: auto;
  }

  .renewal-detail {
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 0.5rem;
    border-left: 4px solid;
  }

  .renewal-detail.monthly { 
    background: #f0fdf4; 
    border-left-color: #10b981;
  }
  .renewal-detail.quarterly { 
    background: #fffbeb; 
    border-left-color: #f59e0b;
  }
  .renewal-detail.annual { 
    background: #eff6ff; 
    border-left-color: #3b82f6;
  }

  .renewal-vendor {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .estimated-badge {
    background: #f1f5f9;
    color: #475569;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 500;
  }

  .renewal-info {
    display: flex;
    gap: 1rem;
    align-items: center;
    font-size: 0.875rem;
    color: #64748b;
  }

  .renewal-info .amount {
    font-weight: 600;
    color: #1e293b;
  }

  .plan {
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 0.25rem;
  }

  @media (max-width: 768px) {
    .calendar-day {
      min-height: 80px;
      padding: 0.25rem;
    }
    
    .day-header {
      padding: 0.5rem 0.25rem;
    }
    
    .calendar-legend {
      padding: 0.75rem;
    }
    
    .summary-grid {
      grid-template-columns: 1fr;
    }
    
    .renewal-popover {
      max-width: 90vw;
    }
  }
  </style>
`;

// Inject styles into document
if (!document.querySelector('#calendar-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'calendar-styles';
  styleSheet.innerHTML = calendarStyles.replace('<style>', '').replace('</style>', '');
  document.head.appendChild(styleSheet);
}

// Export for global use
window.SubscriptionCalendar = SubscriptionCalendar;