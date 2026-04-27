// Analytics New Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Feather icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }

    // Do NOT initialize charts automatically - only after authentication
    // Charts will be initialized by analytics-auth.js when user logs in
    
    // Initialize fade-in animations
    initFadeInAnimations();
    
    // Initialize interactive elements
    initInteractiveElements();
});

function initCharts(userStats = null) {
    // Only initialize charts if user data is available
    if (!userStats) {
        console.log('No user stats available, skipping chart initialization');
        return;
    }

    // Hero Chart Large
    const heroCtxLarge = document.getElementById('heroChartLarge');
    if (heroCtxLarge) {
        new Chart(heroCtxLarge, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Savings',
                    data: [28500, 32100, 36800, 41200, 44700, 47832],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { display: false },
                    x: { display: false }
                },
                interaction: { intersect: false }
            }
        });
    }

    // Waste Chart Demo
    const wasteCtxDemo = document.getElementById('wasteChartDemo');
    if (wasteCtxDemo) {
        new Chart(wasteCtxDemo, {
            type: 'doughnut',
            data: {
                labels: ['Unused Licenses', 'Duplicate Tools', 'Over-provisioned', 'Optimized'],
                datasets: [{
                    data: [4200, 2800, 1420, 23580],
                    backgroundColor: ['#dc2626', '#f59e0b', '#ef4444', '#10b981'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: { size: 12 }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    // Savings Chart Demo
    const savingsCtxDemo = document.getElementById('savingsChartDemo');
    if (savingsCtxDemo) {
        new Chart(savingsCtxDemo, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Monthly Savings',
                    data: [15200, 18700, 22100, 28500, 32100, 36800, 39200, 41200, 43800, 44700, 46200, 47832],
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#8b5cf6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        display: true,
                        grid: { color: '#f1f5f9' },
                        ticks: {
                            callback: value => '$' + (value/1000) + 'k',
                            color: '#64748b',
                            font: { size: 11 }
                        }
                    },
                    x: {
                        display: true,
                        grid: { display: false },
                        ticks: {
                            color: '#64748b',
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    }

    // Main Dashboard Chart
    const mainCtx = document.getElementById('mainChart');
    if (mainCtx) {
        new Chart(mainCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [
                    {
                        label: 'Monthly Savings',
                        data: [15200, 18700, 22100, 28500, 32100, 36800, 39200, 41200, 43800, 44700, 46200, 47832],
                        borderColor: '#059669',
                        backgroundColor: 'rgba(5, 150, 105, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#059669',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 3,
                        pointRadius: 6
                    },
                    {
                        label: 'Cost Reduction %',
                        data: [8, 12, 15, 19, 23, 26, 28, 29, 31, 32, 33, 34],
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#8b5cf6',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 3,
                        pointRadius: 6,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 14,
                                weight: '600'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#334155',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                if (context.dataset.label === 'Monthly Savings') {
                                    return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
                                } else {
                                    return `${context.dataset.label}: ${context.parsed.y}%`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 12,
                                weight: '500'
                            },
                            color: '#64748b'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: {
                            color: '#f1f5f9'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            },
                            font: {
                                size: 12,
                                weight: '500'
                            },
                            color: '#64748b'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            },
                            font: {
                                size: 12,
                                weight: '500'
                            },
                            color: '#64748b'
                        }
                    }
                },
                elements: {
                    point: {
                        hoverRadius: 8
                    }
                }
            }
        });
    }
}

function initFadeInAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, delay);
            }
        });
    }, observerOptions);

    // Observe fade-in elements
    const fadeElements = document.querySelectorAll('.fade-in-up');
    fadeElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

function initInteractiveElements() {
    // Scan Progress Animation
    const scanProgress = document.getElementById('scanProgress');
    const scanCount = document.getElementById('scanCount');
    if (scanProgress && scanCount) {
        let count = 47;
        setInterval(() => {
            count = Math.min(count + Math.floor(Math.random() * 3), 52);
            scanCount.textContent = count;
        }, 2000);
    }

    // Calendar interactions
    const calendarDays = document.querySelectorAll('.cal-day.renewal');
    calendarDays.forEach(day => {
        day.addEventListener('click', () => {
            const app = day.dataset.app;
            if (app) {
                // Update renewal details
                const renewalApp = document.querySelector('.renewal-app');
                if (renewalApp) {
                    renewalApp.textContent = app + ' Pro';
                }
            }
        });
    });

    // Action buttons
    const actionButtons = document.querySelectorAll('.action-btn, .renewal-action');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 150);
        });
    });

    // Stat cards hover effect
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-4px)';
            card.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        });
    });
}

// Add some CSS for active calendar day
const style = document.createElement('style');
style.textContent = `
    .calendar-day-active {
        background: #f1f5f9 !important;
        color: #8b5cf6 !important;
        border: 2px solid #8b5cf6 !important;
    }
    
    .renewal-day-large.calendar-day-active {
        background: #7c3aed !important;
        color: white !important;
        border: 2px solid #ffffff !important;
    }
`;
document.head.appendChild(style);