/**
 * Alerts Authentication Handler
 * Controls alerts data visibility based on authentication state
 */

import { getUser } from './auth.js';

export class AlertsAuthHandler {
  constructor() {
    this.isAuthenticated = false;
    this.user = null;
    this.alerts = [];
  }

  /**
   * Initialize authentication check and alerts loading
   */
  async initialize() {
    try {
      // Check authentication status
      const authResult = await getUser();
      
      if (authResult.success && authResult.data.user) {
        this.isAuthenticated = true;
        this.user = authResult.data.user;
        await this.loadUserAlerts();
        this.displayAuthenticatedContent();
      } else {
        this.displayUnauthenticatedMessage();
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      this.displayUnauthenticatedMessage();
    }
  }

  /**
   * Load user-specific alerts from backend
   */
  async loadUserAlerts() {
    try {
      const response = await fetch('/api/alerts', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        this.alerts = result.data || [];
      } else if (response.status === 401) {
        // User not authenticated
        this.displayUnauthenticatedMessage();
        return;
      } else {
        console.error('Failed to load alerts:', response.statusText);
        this.alerts = [];
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
      this.alerts = [];
    }
  }

  /**
   * Display unauthenticated message
   */
  displayUnauthenticatedMessage() {
    // Show placeholder, hide authenticated content
    const placeholder = document.getElementById('alerts-placeholder');
    const authenticatedContent = document.getElementById('alerts-authenticated-content');
    
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
    
    if (authenticatedContent) {
      authenticatedContent.style.display = 'none';
    }
    
    // Replace feather icons for the placeholder
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }

  /**
   * Display authenticated content with real alerts
   */
  displayAuthenticatedContent() {
    // Hide placeholder, show authenticated content
    const placeholder = document.getElementById('alerts-placeholder');
    const authenticatedContent = document.getElementById('alerts-authenticated-content');
    
    if (placeholder) {
      placeholder.style.display = 'none';
    }
    
    if (authenticatedContent) {
      authenticatedContent.style.display = 'block';
    }
    
    // Update content with real data
    this.updateAlertsStats();
    this.displayAlertsList();
    this.showWelcomeMessage();
  }

  /**
   * Update alerts statistics with real data
   */
  updateAlertsStats() {
    const highPriority = this.alerts.filter(alert => alert.priority === 'high').length;
    const mediumPriority = this.alerts.filter(alert => alert.priority === 'medium').length;
    const lowPriority = this.alerts.filter(alert => alert.priority === 'low').length;

    // Update stat cards
    const highElement = document.querySelector('[data-stat="high-priority"]');
    if (highElement) {
      highElement.textContent = highPriority.toString();
    }

    const mediumElement = document.querySelector('[data-stat="medium-priority"]');
    if (mediumElement) {
      mediumElement.textContent = mediumPriority.toString();
    }

    const lowElement = document.querySelector('[data-stat="low-priority"]');
    if (lowElement) {
      lowElement.textContent = lowPriority.toString();
    }

    const totalElement = document.querySelector('[data-stat="total-alerts"]');
    if (totalElement) {
      totalElement.textContent = this.alerts.length.toString();
    }
  }

  /**
   * Display alerts list with real data
   */
  displayAlertsList() {
    const alertsList = document.querySelector('.alerts-list, #alerts-list');
    if (!alertsList) return;

    // Clear existing content
    alertsList.innerHTML = '';

    if (this.alerts.length === 0) {
      // Create safe static content for empty state
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'alert-item text-center py-8';
      
      const icon = document.createElement('i');
      icon.setAttribute('data-feather', 'check-circle');
      icon.className = 'w-12 h-12 text-green-500 mx-auto mb-4';
      
      const title = document.createElement('h3');
      title.className = 'text-lg font-semibold text-gray-900 mb-2';
      title.textContent = 'No alerts at this time';
      
      const description = document.createElement('p');
      description.className = 'text-gray-600';
      description.textContent = 'All your subscriptions are running smoothly!';
      
      emptyDiv.appendChild(icon);
      emptyDiv.appendChild(title);
      emptyDiv.appendChild(description);
      alertsList.appendChild(emptyDiv);
    } else {
      // Create safe alert elements
      this.alerts.forEach(alert => {
        const alertElement = this.createSafeAlertElement(alert);
        alertsList.appendChild(alertElement);
      });
    }

    // Initialize feather icons for the new content
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }

  /**
   * Create safe alert element using DOM methods
   */
  createSafeAlertElement(alert) {
    const priorityColors = {
      high: 'text-red-600 bg-red-50',
      medium: 'text-yellow-600 bg-yellow-50',
      low: 'text-green-600 bg-green-50'
    };

    const priorityIcons = {
      high: 'alert-triangle',
      medium: 'alert-circle',
      low: 'info'
    };

    // Main alert container
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert-item';

    // Alert icon section
    const iconDiv = document.createElement('div');
    iconDiv.className = `alert-icon ${priorityColors[alert.priority] || priorityColors.low}`;
    const icon = document.createElement('i');
    icon.setAttribute('data-feather', priorityIcons[alert.priority] || priorityIcons.low);
    iconDiv.appendChild(icon);

    // Alert content section
    const contentDiv = document.createElement('div');
    contentDiv.className = 'alert-content';

    // Alert header
    const headerDiv = document.createElement('div');
    headerDiv.className = 'alert-header';
    
    const title = document.createElement('h3');
    title.className = 'alert-title';
    title.textContent = alert.title || 'Subscription Alert'; // Safe text assignment
    
    const time = document.createElement('span');
    time.className = 'alert-time';
    time.textContent = this.formatDate(alert.created_at || new Date()); // Safe text assignment
    
    headerDiv.appendChild(title);
    headerDiv.appendChild(time);

    // Alert description
    const description = document.createElement('p');
    description.className = 'alert-description';
    description.textContent = alert.message || alert.description || 'No description available'; // Safe text assignment

    // Alert metadata
    const metaDiv = document.createElement('div');
    metaDiv.className = 'alert-meta';
    
    const priorityBadge = document.createElement('span');
    priorityBadge.className = `priority-badge priority-${alert.priority || 'low'}`;
    priorityBadge.textContent = (alert.priority || 'low').toUpperCase(); // Safe text assignment
    
    const category = document.createElement('span');
    category.className = 'alert-category';
    category.textContent = alert.category || 'General'; // Safe text assignment
    
    metaDiv.appendChild(priorityBadge);
    metaDiv.appendChild(category);

    contentDiv.appendChild(headerDiv);
    contentDiv.appendChild(description);
    contentDiv.appendChild(metaDiv);

    // Alert actions section
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'alert-actions';
    
    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'btn-icon';
    dismissBtn.setAttribute('title', 'Dismiss');
    // Safe event handler assignment instead of onclick attribute
    dismissBtn.addEventListener('click', () => {
      if (alert.id) {
        window.dismissAlert(alert.id);
      }
    });
    
    const dismissIcon = document.createElement('i');
    dismissIcon.setAttribute('data-feather', 'x');
    dismissBtn.appendChild(dismissIcon);
    actionsDiv.appendChild(dismissBtn);

    // Assemble the complete alert element
    alertDiv.appendChild(iconDiv);
    alertDiv.appendChild(contentDiv);
    alertDiv.appendChild(actionsDiv);

    return alertDiv;
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Show personalized welcome message
   */
  showWelcomeMessage() {
    const headerElement = document.querySelector('h1');
    if (headerElement && this.user) {
      const userName = this.user.user_metadata?.full_name || this.user.email?.split('@')[0] || 'User';
      const originalText = headerElement.textContent;
      if (!originalText.includes('Welcome')) {
        headerElement.textContent = `${originalText} - Welcome, ${userName}`;
      }
    }
  }
}

// Global function for dismissing alerts
window.dismissAlert = async function(alertId) {
  try {
    const response = await fetch(`/api/alerts/${alertId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      // Remove alert from DOM
      const alertElement = document.querySelector(`[data-alert-id="${alertId}"]`);
      if (alertElement) {
        alertElement.remove();
      }
      
      // Reload alerts to update counts
      const authHandler = new AlertsAuthHandler();
      await authHandler.loadUserAlerts();
      authHandler.updateAlertsStats();
    }
  } catch (error) {
    console.error('Failed to dismiss alert:', error);
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const authHandler = new AlertsAuthHandler();
  authHandler.initialize();
});

export default AlertsAuthHandler;