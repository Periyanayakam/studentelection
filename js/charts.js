// Chart.js Configuration and Render Logic

document.addEventListener('DOMContentLoaded', () => {
    // Helper to get colors
    const chartColors = {
        primary: '#0d6efd',
        accent: '#0dcaf0',
        purple: '#6f42c1',
        orange: '#fd7e14',
        success: '#198754',
        danger: '#dc3545',
        gray: '#6c757d',
        lightGray: '#f8fafc',
        darkGray: '#334155',
        bgTheme: () => document.documentElement.getAttribute('data-bs-theme') === 'dark' ? '#1e293b' : '#ffffff',
        borderTheme: () => document.documentElement.getAttribute('data-bs-theme') === 'dark' ? '#334155' : '#e2e8f0',
        textTheme: () => document.documentElement.getAttribute('data-bs-theme') === 'dark' ? '#f1f5f9' : '#1e293b'
    };

    // Initialize Chart.js global options
    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = chartColors.textTheme();
        Chart.defaults.font.family = "'Outfit', sans-serif";
        
        // Listen to dark mode toggling to update chart theme
        document.addEventListener('click', (e) => {
            if (e.target.closest('.theme-toggle-btn')) {
                setTimeout(() => {
                    Chart.defaults.color = chartColors.textTheme();
                    // Re-render chart instances
                    updateAllCharts();
                }, 100);
            }
        });
    }

    const chartInstances = {};

    function updateAllCharts() {
        Object.keys(chartInstances).forEach(key => {
            const chart = chartInstances[key];
            if (chart) {
                chart.options.scales.x.grid.color = chartColors.borderTheme();
                chart.options.scales.y.grid.color = chartColors.borderTheme();
                chart.options.scales.x.ticks.color = chartColors.textTheme();
                chart.options.scales.y.ticks.color = chartColors.textTheme();
                chart.update();
            }
        });
    }

    // 1. Voter Results Page Chart
    const resultsCanvas = document.getElementById('results-bar-chart');
    if (resultsCanvas && typeof Chart !== 'undefined') {
        const candidates = db.getCandidates().filter(c => c.electionId === 'EL001');
        const labels = candidates.map(c => c.name);
        const votes = candidates.map(c => c.votes);

        chartInstances['resultsBar'] = new Chart(resultsCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Votes Cast',
                    data: votes,
                    backgroundColor: [
                        'rgba(13, 110, 253, 0.75)',
                        'rgba(13, 202, 240, 0.75)',
                        'rgba(111, 66, 193, 0.75)',
                        'rgba(253, 126, 20, 0.75)'
                    ],
                    borderColor: [
                        '#0d6efd',
                        '#0dcaf0',
                        '#6f42c1',
                        '#fd7e14'
                    ],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: chartColors.borderTheme() },
                        ticks: { color: chartColors.textTheme() }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: chartColors.textTheme() }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // 2. Admin Dashboard - Department Turnout Chart
    const turnoutCanvas = document.getElementById('admin-turnout-chart');
    if (turnoutCanvas && typeof Chart !== 'undefined') {
        const departments = ['CS', 'Business', 'Engineering', 'Psychology', 'Medicine', 'Law'];
        const rates = [68, 52, 61, 74, 48, 58]; // percentages

        chartInstances['turnoutBar'] = new Chart(turnoutCanvas, {
            type: 'bar',
            data: {
                labels: departments,
                datasets: [{
                    label: 'Voter Turnout %',
                    data: rates,
                    backgroundColor: 'rgba(13, 110, 253, 0.8)',
                    borderColor: '#0d6efd',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: chartColors.borderTheme() },
                        ticks: {
                            color: chartColors.textTheme(),
                            callback: function(value) { return value + "%" }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: chartColors.textTheme() }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // 3. Admin Dashboard - Hourly Voting Activity Line Chart
    const activityCanvas = document.getElementById('admin-activity-chart');
    if (activityCanvas && typeof Chart !== 'undefined') {
        const hours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
        const votesPerHour = [142, 280, 420, 310, 198, 245, 302, 189, 95];

        chartInstances['activityLine'] = new Chart(activityCanvas, {
            type: 'line',
            data: {
                labels: hours,
                datasets: [{
                    label: 'Votes Cast',
                    data: votesPerHour,
                    fill: true,
                    backgroundColor: 'rgba(13, 202, 240, 0.15)',
                    borderColor: '#0dcaf0',
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#0dcaf0'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: chartColors.borderTheme() },
                        ticks: { color: chartColors.textTheme() }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: chartColors.textTheme() }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // 4. Results Dashboard - Pie Chart (Candidate Share)
    const pieCanvas = document.getElementById('results-pie-chart');
    if (pieCanvas && typeof Chart !== 'undefined') {
        const candidates = db.getCandidates().filter(c => c.electionId === 'EL001');
        const labels = candidates.map(c => c.name);
        const votes = candidates.map(c => c.votes);

        chartInstances['resultsPie'] = new Chart(pieCanvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: votes,
                    backgroundColor: [
                        '#0d6efd',
                        '#0dcaf0',
                        '#6f42c1',
                        '#fd7e14'
                    ],
                    borderWidth: 2,
                    borderColor: chartColors.bgTheme()
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: chartColors.textTheme() }
                    }
                }
            }
        });
    }
});
