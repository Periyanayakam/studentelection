// Global App Helpers & Mock Database Setup

// 1. Toast Notification Helper
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    
    let iconClass = 'bi-info-circle-fill';
    if (type === 'success') iconClass = 'bi-check-circle-fill';
    if (type === 'error') iconClass = 'bi-exclamation-octagon-fill';
    if (type === 'warning') iconClass = 'bi-exclamation-triangle-fill';

    toast.innerHTML = `
        <i class="toast-icon bi ${iconClass}"></i>
        <span>${message}</span>
        <button class="toast-close"><i class="bi bi-x"></i></button>
    `;

    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 50);

    // Auto-dismiss
    const dismissTimeout = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 4000);

    // Close button click
    toast.querySelector('.toast-close').addEventListener('click', () => {
        clearTimeout(dismissTimeout);
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    });
}

// 2. Mock Database Initialization
const INITIAL_ELECTIONS = [
    {
        id: 'EL001',
        title: '2026 Student Council General Election',
        description: 'Annual election for Student Council leadership. Vote for representatives who will shape university policies.',
        startDate: '2026-11-15T09:00',
        endDate: '2026-11-22T17:00',
        status: 'active',
        totalVoters: 4280,
        votesCast: 1847,
        positions: ['President', 'Vice President', 'Treasurer']
    },
    {
        id: 'EL002',
        title: '2026 School of Business Representative By-Election',
        description: 'By-election to fill the vacant Business School Council representative seat.',
        startDate: '2026-09-01T09:00',
        endDate: '2026-09-10T17:00',
        status: 'completed',
        totalVoters: 1200,
        votesCast: 843,
        positions: ['Business Rep']
    },
    {
        id: 'EL003',
        title: '2027 Student Council Representative Election',
        description: 'Upcoming elections for course representatives for the next academic calendar year.',
        startDate: '2027-01-15T09:00',
        endDate: '2027-01-22T17:00',
        status: 'upcoming',
        totalVoters: 4500,
        votesCast: 0,
        positions: ['Representative']
    }
];

const INITIAL_CANDIDATES = [
    {
        id: 'CAN001',
        name: 'Jordan Williams',
        party: 'Progressive Student Alliance (PSA)',
        symbol: 'bi-rocket-takeoff-fill',
        description: 'Jordan is a 3rd-year CS major advocating for mental health awareness, updated lab tech, and more research funds.',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
        votes: 942,
        electionId: 'EL001',
        position: 'President'
    },
    {
        id: 'CAN002',
        name: 'Maya Patel',
        party: 'Student Unity Coalition (SUC)',
        symbol: 'bi-people-fill',
        description: 'Maya is a Finance major prioritizing environmental sustainability, fair course fees, and expanding the campus gym.',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
        votes: 905,
        electionId: 'EL001',
        position: 'President'
    },
    {
        id: 'CAN003',
        name: 'Carlos Rodriguez',
        party: 'Progressive Student Alliance (PSA)',
        symbol: 'bi-rocket-takeoff-fill',
        description: 'Carlos is an Engineering major focused on establishing collaborative spaces and organizing more cultural fests.',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        votes: 1102,
        electionId: 'EL001',
        position: 'Vice President'
    },
    {
        id: 'CAN004',
        name: 'Aisha Thompson',
        party: 'Student Unity Coalition (SUC)',
        symbol: 'bi-people-fill',
        description: 'Aisha is a Psychology major striving to improve university counselling resources and student union communications.',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
        votes: 745,
        electionId: 'EL001',
        position: 'Vice President'
    }
];

const INITIAL_VOTERS = [
    { id: 'V001', name: 'Liam Neeson', voterId: 'VOT-998822', email: 'liam@university.edu', mobile: '9988223311', status: 'approved', registeredDate: '2026-07-10' },
    { id: 'V002', name: 'Sophia Loren', voterId: 'VOT-112233', email: 'sophia@university.edu', mobile: '9988776655', status: 'approved', registeredDate: '2026-07-11' },
    { id: 'V003', name: 'Ethan Hunt', voterId: 'VOT-007700', email: 'ethan@university.edu', mobile: '9000100020', status: 'pending', registeredDate: '2026-07-13' },
    { id: 'V004', name: 'Emma Watson', voterId: 'VOT-334455', email: 'emma@university.edu', mobile: '9111222333', status: 'pending', registeredDate: '2026-07-13' }
];

const INITIAL_USER = {
    name: 'Alex Johnson',
    voterId: 'VOT-2026-08',
    email: 'alex.johnson@university.edu',
    mobile: '9876543210',
    avatar: '',
    hasVoted: false,
    votedFor: null,
    history: []
};

function readStoredValue(key, fallback = null) {
    try {
        const storedValue = localStorage.getItem(key);
        if (storedValue === null) {
            return fallback;
        }

        const parsedValue = JSON.parse(storedValue);
        return parsedValue;
    } catch (error) {
        console.warn(`Unable to read ${key} from localStorage.`, error);
        return fallback;
    }
}

function isDefaultCandidateSeed(data) {
    return Array.isArray(data) && data.length === INITIAL_CANDIDATES.length && data.every((candidate, index) => {
        const expected = INITIAL_CANDIDATES[index];
        return candidate.id === expected.id && candidate.name === expected.name && candidate.position === expected.position && candidate.party === expected.party;
    });
}

// Seed database on startup if empty
function initializeDB() {
    const elections = readStoredValue('elections');
    if (!Array.isArray(elections) || elections.length === 0) {
        localStorage.setItem('elections', JSON.stringify(INITIAL_ELECTIONS));
    }

    const candidates = readStoredValue('candidates');
    if (!Array.isArray(candidates) || candidates.length === 0 || isDefaultCandidateSeed(candidates)) {
        localStorage.setItem('candidates', JSON.stringify([]));
    }

    const voters = readStoredValue('voters');
    if (!Array.isArray(voters) || voters.length === 0) {
        localStorage.setItem('voters', JSON.stringify(INITIAL_VOTERS));
    }

    const currentUser = readStoredValue('currentUser');
    if (!currentUser || typeof currentUser !== 'object' || Array.isArray(currentUser) || Object.keys(currentUser).length === 0) {
        localStorage.setItem('currentUser', JSON.stringify(INITIAL_USER));
    }
}

// Data Fetchers and Writers
const db = {
    getElections: () => readStoredValue('elections', INITIAL_ELECTIONS),
    setElections: (data) => localStorage.setItem('elections', JSON.stringify(data)),
    
    getCandidates: () => readStoredValue('candidates', []),
    setCandidates: (data) => localStorage.setItem('candidates', JSON.stringify(data)),
    
    getVoters: () => readStoredValue('voters', INITIAL_VOTERS),
    setVoters: (data) => localStorage.setItem('voters', JSON.stringify(data)),
    
    getCurrentUser: () => readStoredValue('currentUser', INITIAL_USER),
    setCurrentUser: (data) => localStorage.setItem('currentUser', JSON.stringify(data))
};

// 3. User Session Simulation
function checkVoterAuth() {
    const user = db.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
    }
    return user;
}

function checkAdminAuth() {
    const adminActive = sessionStorage.getItem('adminLoggedIn');
    if (!adminActive) {
        window.location.href = 'admin-login.html';
    }
}

function logOutVoter() {
    // We do not delete user information from localstorage, just redirect
    showToast('Logged out successfully', 'info');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 500);
}

function logOutAdmin() {
    sessionStorage.removeItem('adminLoggedIn');
    showToast('Admin logged out successfully', 'info');
    setTimeout(() => {
        window.location.href = 'admin-login.html';
    }, 500);
}

// 4. Global Init Calls
initializeDB();

async function apiRequest(path, options = {}) {
    const response = await fetch(`/api${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });

    return response.json();
}

async function loginVoter(email, password) {
    const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role: 'student' })
    });

    if (data.success) {
        const user = db.getCurrentUser();
        const updatedUser = { ...user, email: data.user.email, name: user.name || 'Student' };
        db.setCurrentUser(updatedUser);
        sessionStorage.setItem('authToken', data.token);
    }

    return data;
}

async function submitVoteToBackend(candidateId) {
    return apiRequest('/votes', {
        method: 'POST',
        body: JSON.stringify({ candidateId })
    });
}
