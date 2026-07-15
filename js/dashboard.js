// Voter Dashboard, Elections, Candidates, and Vote Casting logic

document.addEventListener('DOMContentLoaded', () => {
    // 1. Countdown Timer for Active Election
    const updateCountdown = () => {
        const daysEl = document.getElementById('countdown-days');
        const hoursEl = document.getElementById('countdown-hours');
        const minutesEl = document.getElementById('countdown-minutes');
        const secondsEl = document.getElementById('countdown-seconds');

        if (!daysEl) return; // Not on dashboard page or no active election timer

        const electionsList = db.getElections();
        const activeElection = electionsList.find(e => e.status === 'active');
        if (!activeElection) {
            const timerContainer = document.querySelector('.countdown-timer-container');
            if (timerContainer) timerContainer.innerHTML = '<p class="text-danger font-semibold">No active election currently running.</p>';
            return;
        }

        const endDate = new Date(activeElection.endDate).getTime();
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = endDate - now;

            if (distance < 0) {
                clearInterval(interval);
                daysEl.textContent = '00';
                hoursEl.textContent = '00';
                minutesEl.textContent = '00';
                secondsEl.textContent = '00';
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            daysEl.textContent = String(days).padStart(2, '0');
            hoursEl.textContent = String(hours).padStart(2, '0');
            minutesEl.textContent = String(minutes).padStart(2, '0');
            secondsEl.textContent = String(seconds).padStart(2, '0');
        }, 1000);
    };

    updateCountdown();

    // 2. Profile Page Editing Logic
    const profileForm = document.getElementById('edit-profile-form');
    if (profileForm) {
        const user = db.getCurrentUser();
        // prefill
        document.getElementById('profile-name').value = user.name;
        document.getElementById('profile-email').value = user.email;
        document.getElementById('profile-mobile').value = user.mobile;
        document.getElementById('profile-voterid').value = user.voterId;

        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const updatedUser = {
                ...user,
                name: document.getElementById('profile-name').value,
                email: document.getElementById('profile-email').value,
                mobile: document.getElementById('profile-mobile').value
            };
            db.setCurrentUser(updatedUser);
            showToast('Profile updated successfully!', 'success');
            // update header avatar/name if present
            const headerName = document.getElementById('navbar-user-name');
            if (headerName) headerName.textContent = updatedUser.name;
        });
    }

    const passwordForm = document.getElementById('change-password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const oldP = document.getElementById('old-password').value;
            const newP = document.getElementById('new-password').value;
            const confirmP = document.getElementById('confirm-new-password').value;
            
            if (newP !== confirmP) {
                showToast('Passwords do not match', 'error');
                return;
            }
            
            showToast('Password changed successfully!', 'success');
            passwordForm.reset();
            passwordForm.classList.remove('was-validated');
        });
    }

    // 3. Elections List Search/Filter Logic
    const electionSearch = document.getElementById('election-search');
    const electionFilter = document.getElementById('election-filter');
    const electionsGrid = document.getElementById('elections-grid');

    if (electionsGrid) {
        const renderElections = () => {
            const list = db.getElections();
            const query = electionSearch ? electionSearch.value.toLowerCase() : '';
            const statusFilter = electionFilter ? electionFilter.value : 'all';

            let html = '';
            const filtered = list.filter(e => {
                const matchesSearch = e.title.toLowerCase().includes(query) || e.description.toLowerCase().includes(query);
                const matchesFilter = statusFilter === 'all' || e.status === statusFilter;
                return matchesSearch && matchesFilter;
            });

            if (filtered.length === 0) {
                electionsGrid.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="bi bi-search text-muted" style="font-size: 3rem;"></i>
                        <p class="mt-3 text-muted">No elections found matching your criteria.</p>
                    </div>
                `;
                return;
            }

            filtered.forEach(e => {
                let badgeClass = 'active';
                if (e.status === 'upcoming') badgeClass = 'upcoming';
                if (e.status === 'completed') badgeClass = 'completed';

                let actionBtn = '';
                const user = db.getCurrentUser();
                
                if (e.status === 'active') {
                    if (user.hasVoted) {
                        actionBtn = `<button class="btn btn-secondary w-100 disabled" disabled><i class="bi bi-check-circle-fill"></i> Already Voted</button>`;
                    } else {
                        actionBtn = `<a href="candidates.html?electionId=${e.id}" class="btn btn-gradient w-100">Vote Now</a>`;
                    }
                } else if (e.status === 'completed') {
                    actionBtn = `<a href="results.html?electionId=${e.id}" class="btn btn-outline-custom w-100">View Results</a>`;
                } else {
                    actionBtn = `<button class="btn btn-secondary w-100 disabled" disabled><i class="bi bi-clock"></i> Upcoming</button>`;
                }

                html += `
                    <div class="col-md-6 col-lg-4 mb-4">
                        <div class="card-premium h-100 d-flex flex-column justify-content-between">
                            <div>
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <span class="status-badge ${badgeClass}">${e.status}</span>
                                    <small class="text-muted"><i class="bi bi-calendar3"></i> ${e.startDate.split('T')[0]}</small>
                                </div>
                                <h5 class="card-title text-primary">${e.title}</h5>
                                <p class="card-text text-muted small">${e.description}</p>
                                <div class="my-3 small border-top pt-2">
                                    <strong>End Date:</strong> ${e.endDate.replace('T', ' ')}<br>
                                    <strong>Total Registered:</strong> ${e.totalVoters.toLocaleString()}<br>
                                    ${e.status !== 'upcoming' ? `<strong>Votes Cast:</strong> ${e.votesCast.toLocaleString()}` : ''}
                                </div>
                            </div>
                            <div class="mt-3">
                                ${actionBtn}
                            </div>
                        </div>
                    </div>
                `;
            });
            electionsGrid.innerHTML = html;
        };

        if (electionSearch) electionSearch.addEventListener('input', renderElections);
        if (electionFilter) electionFilter.addEventListener('change', renderElections);
        renderElections();
    }

    // 4. Candidate List Search/Filter Logic
    const candidateSearch = document.getElementById('candidate-search');
    const positionFilter = document.getElementById('position-filter');
    const candidatesGrid = document.getElementById('candidates-grid');

    if (candidatesGrid) {
        const urlParams = new URLSearchParams(window.location.search);
        const electionId = urlParams.get('electionId') || 'EL001';

        const renderCandidates = () => {
            const list = db.getCandidates().filter(c => c.electionId === electionId);
            const query = candidateSearch ? candidateSearch.value.toLowerCase() : '';
            const posFilter = positionFilter ? positionFilter.value : 'all';

            let html = '';
            const filtered = list.filter(c => {
                const matchesSearch = c.name.toLowerCase().includes(query) || c.party.toLowerCase().includes(query);
                const matchesFilter = posFilter === 'all' || c.position === posFilter;
                return matchesSearch && matchesFilter;
            });

            if (filtered.length === 0) {
                candidatesGrid.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="bi bi-people text-muted" style="font-size: 3rem;"></i>
                        <p class="mt-3 text-muted">No candidates registered for this search query.</p>
                    </div>
                `;
                return;
            }

            const user = db.getCurrentUser();

            filtered.forEach(c => {
                let actionBtn = '';
                if (user.hasVoted) {
                    actionBtn = `<button class="btn btn-secondary w-100 disabled" disabled><i class="bi bi-check-circle"></i> Voted</button>`;
                } else {
                    actionBtn = `<button class="btn btn-gradient w-100 select-candidate-btn" data-id="${c.id}">Vote</button>`;
                }

                html += `
                    <div class="col-md-6 col-lg-4 mb-4">
                        <div class="card-premium h-100 d-flex flex-column justify-content-between">
                            <div class="text-center mb-3">
                                <img src="${c.avatar}" alt="${c.name}" class="rounded-circle border border-primary border-3 mb-3" style="width: 100px; height: 100px; object-fit: cover;">
                                <h5 class="mb-1">${c.name}</h5>
                                <span class="badge bg-primary-light text-primary mb-2">${c.position}</span>
                                <div class="d-flex align-items-center justify-content-center text-muted small mb-3">
                                    <i class="${c.symbol} me-1 text-primary"></i> <span>${c.party}</span>
                                </div>
                                <p class="text-muted small text-start px-2">${c.description}</p>
                            </div>
                            <div class="mt-2">
                                ${actionBtn}
                            </div>
                        </div>
                    </div>
                `;
            });
            candidatesGrid.innerHTML = html;

            // Bind click handler for vote selection
            document.querySelectorAll('.select-candidate-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    sessionStorage.setItem('selectedCandidateId', id);
                    window.location.href = `vote.html`;
                });
            });
        };

        if (candidateSearch) candidateSearch.addEventListener('input', renderCandidates);
        if (positionFilter) positionFilter.addEventListener('change', renderCandidates);
        renderCandidates();
    }

    // 5. Vote Confirmation Page logic
    const selectedCandidateContainer = document.getElementById('selected-candidate-container');
    const confirmVoteBtn = document.getElementById('confirm-vote-btn');
    const cancelVoteBtn = document.getElementById('cancel-vote-btn');

    if (selectedCandidateContainer) {
        const candidateId = sessionStorage.getItem('selectedCandidateId');
        if (!candidateId) {
            selectedCandidateContainer.innerHTML = `
                <div class="alert alert-danger text-center">
                    No candidate selected. <a href="elections.html">Return to elections list</a>.
                </div>
            `;
            if (confirmVoteBtn) confirmVoteBtn.disabled = true;
        } else {
            const cand = db.getCandidates().find(c => c.id === candidateId);
            if (!cand) {
                selectedCandidateContainer.innerHTML = `<div class="alert alert-danger">Candidate not found.</div>`;
            } else {
                selectedCandidateContainer.innerHTML = `
                    <div class="text-center p-4 border rounded-3 bg-light-card">
                        <img src="${cand.avatar}" alt="${cand.name}" class="rounded-circle border border-primary border-4 mb-3" style="width: 120px; height: 120px; object-fit: cover;">
                        <h4 class="mb-1">${cand.name}</h4>
                        <span class="badge bg-primary text-white mb-2 fs-6">${cand.position}</span>
                        <div class="d-flex align-items-center justify-content-center text-muted mb-3">
                            <i class="${cand.symbol} me-2 text-primary fs-5"></i> <strong>${cand.party}</strong>
                        </div>
                        <p class="text-muted text-start border-top pt-3 mt-3">${cand.description}</p>
                    </div>
                `;
            }
        }

        if (confirmVoteBtn) {
            confirmVoteBtn.addEventListener('click', () => {
                const candidateId = sessionStorage.getItem('selectedCandidateId');
                const user = db.getCurrentUser();
                
                // Show loading spinner
                confirmVoteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Recording Secure Ballot...';
                confirmVoteBtn.disabled = true;
                if (cancelVoteBtn) cancelVoteBtn.disabled = true;

                setTimeout(() => {
                    // Update candidate count
                    const candidatesList = db.getCandidates();
                    const updatedCandidates = candidatesList.map(c => {
                        if (c.id === candidateId) {
                            return { ...c, votes: c.votes + 1 };
                        }
                        return c;
                    });
                    db.setCandidates(updatedCandidates);

                    // Update active election count
                    const electionsList = db.getElections();
                    const updatedElections = electionsList.map(e => {
                        if (e.id === 'EL001') {
                            return { ...e, votesCast: e.votesCast + 1 };
                        }
                        return e;
                    });
                    db.setElections(updatedElections);

                    // Find selected candidate info
                    const candidateInfo = candidatesList.find(c => c.id === candidateId);

                    // Update user voted state
                    const updatedUser = {
                        ...user,
                        hasVoted: true,
                        votedFor: candidateInfo ? candidateInfo.name : 'Unknown',
                        history: [
                            {
                                electionTitle: '2026 Student Council General Election',
                                position: candidateInfo ? candidateInfo.position : 'President',
                                candidateName: candidateInfo ? candidateInfo.name : 'Selected Candidate',
                                date: new Date().toISOString().split('T')[0]
                            },
                            ...user.history
                        ]
                    };
                    db.setCurrentUser(updatedUser);

                    // Show success elements
                    const voteWorkspace = document.getElementById('vote-workspace');
                    const voteSuccess = document.getElementById('vote-success-workspace');
                    if (voteWorkspace && voteSuccess) {
                        voteWorkspace.classList.add('d-none');
                        voteSuccess.classList.remove('d-none');
                        // Trigger Success Animation
                        const icon = voteSuccess.querySelector('.success-checkmark i');
                        if (icon) icon.style.transform = 'scale(1)';
                    }

                    showToast('Ballot cast and encrypted successfully!', 'success');
                }, 2000);
            });
        }
    }
});
