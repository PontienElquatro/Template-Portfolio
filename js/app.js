document.addEventListener('DOMContentLoaded', () => {

    // --- Éléments ---
    const header = document.getElementById('main-header');
    const input = document.getElementById('command-input');
    const consoleOutput = document.getElementById('console-output');
    const consoleContainer = document.getElementById('console-container');
    const portfolio = document.getElementById('portfolio-content');
    const gatekeeper = document.getElementById('gatekeeper');
    const hintChips = document.querySelectorAll('.hint-chip');
    const resetBtn = document.getElementById('reset-btn');
    const navItems = document.querySelectorAll('.nav-item');
    const progressBadge = document.getElementById('progress-badge');
    const cinematic = document.getElementById('cinematic-transition');
    const scrollIndicator = document.getElementById('scroll-indicator');
    const logo = document.querySelector('.logo');

    const drawer = document.getElementById('terminal-drawer');
    const drawerToggle = document.getElementById('drawer-toggle');
    const drawerPanel = document.getElementById('drawer-panel');
    const drawerOutput = document.getElementById('drawer-output');
    const drawerInput = document.getElementById('drawer-input');
    const drawerClose = document.getElementById('drawer-close');

    const remainingPanel = document.getElementById('remaining-panel');
    const remainingChips = document.getElementById('remaining-chips');
    const remainingCount = document.getElementById('remaining-count');
    const remainingClose = document.getElementById('remaining-close');

    // Modales
    const modalOverlay = document.getElementById('modal-overlay'); // Reset
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');

    const contactModal = document.getElementById('contact-modal');
    const contactClose = document.getElementById('contact-close');
    const contactForm = document.getElementById('contact-form');
    const contactChat = document.getElementById('contact-chat');
    const btnContactTriggers = document.querySelectorAll('.btn-contact-trigger');

    // --- État ---
    const STORAGE_KEY = 'portfolio_state_v1';
    const MAIN_IDS = ['section-hero', 'section-expertise', 'section-work', 'section-contact'];
    let unlockedSections = new Set();
    let hiddenRemaining = false;

    // --- Curseur ---
    const cursor = document.createElement('div');
    cursor.className = 'cursor-dot';
    document.body.appendChild(cursor);

    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });
    document.querySelectorAll('a, button, .nav-item, .remaining-chip, .project-card, .stack-val, .btn-contact-trigger').forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('expanded'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('expanded'));
    });

    // --- Header scroll ---
    window.addEventListener('scroll', () => {
        if (window.scrollY > 30) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    });

    // --- Persistance ---
    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                unlocked: Array.from(unlockedSections),
                hiddenRemaining
            }));
        } catch (e) { /* ignore */ }
    }

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const data = JSON.parse(raw);
            if (Array.isArray(data.unlocked)) data.unlocked.forEach(id => unlockedSections.add(id));
            hiddenRemaining = !!data.hiddenRemaining;
        } catch (e) { /* ignore */ }
    }

    function applyLoadedState() {
        if (unlockedSections.size === 0) return;

        unlockedSections.forEach(id => {
            const sec = document.getElementById(id);
            if (sec) {
                sec.classList.remove('hidden-section');
                sec.classList.add('revealed');
            }
        });

        navItems.forEach(n => {
            if (unlockedSections.has(n.dataset.target)) {
                n.classList.add('unlocked');
                n.disabled = false;
            }
        });

        gatekeeper.classList.add('dismissed');
        portfolio.classList.add('revealed');
        document.body.classList.add('portfolio-open');

        updateProgressBadge();
        updateRemainingPanel();
        updateScrollIndicator();

        addSystemMessage("// Session restaurée. Progression rechargée.");
    }

    // --- Logique de déblocage ---
    function unlockSections(sectionIds, cmdLabel) {
        sectionIds.forEach(id => {
            if (unlockedSections.has(id)) return;
            unlockedSections.add(id);
            const section = document.getElementById(id);
            if (section) {
                section.classList.remove('hidden-section');
                section.classList.add('revealed');
            }
            const nav = document.querySelector(`.nav-item[data-target="${id}"]`);
            if (nav) {
                nav.classList.add('unlocked');
                nav.disabled = false;
            }
        });

        if (sectionIds.length > 0) {
            cinematic.classList.add('active');
            setTimeout(() => cinematic.classList.remove('active'), 1200);

            setTimeout(() => {
                gatekeeper.classList.add('dismissed');
                portfolio.classList.add('revealed');
                document.body.classList.add('portfolio-open');
            }, 400);
        }

        updateProgressBadge();
        updateRemainingPanel();
        updateScrollIndicator();
        saveState();

        if (unlockedSections.size >= TOTAL_MAIN_SECTIONS) {
            setTimeout(() => {
                addSystemMessage("// ✓ Toutes les sections sont débloquées. Bonne visite.");
            }, 1200);
        }
    }

    function countMainUnlocked() {
        return MAIN_IDS.filter(id => unlockedSections.has(id)).length;
    }

    function updateProgressBadge() {
        const count = countMainUnlocked();
        progressBadge.textContent = `${count}/${TOTAL_MAIN_SECTIONS}`;
        if (count === TOTAL_MAIN_SECTIONS) progressBadge.classList.add('complete');
        else progressBadge.classList.remove('complete');
    }

    function updateRemainingPanel() {
        const remaining = MAIN_IDS.filter(id => !unlockedSections.has(id));
        const cmds = new Set();
        remaining.forEach(id => {
            if (id === 'section-hero' || id === 'section-expertise') cmds.add('openParcours()');
            if (id === 'section-work') cmds.add('openRealisations()');
            if (id === 'section-contact') cmds.add('openContact()');
        });

        if (cmds.size === 0 || hiddenRemaining) {
            remainingPanel.classList.remove('visible');
            return;
        }

        remainingCount.textContent = `${remaining.length} section${remaining.length > 1 ? 's' : ''} restante${remaining.length > 1 ? 's' : ''}`;
        remainingChips.innerHTML = '';
        cmds.forEach(cmd => {
            const btn = document.createElement('button');
            btn.className = 'remaining-chip';
            btn.dataset.cmd = cmd;
            btn.textContent = cmd;
            btn.addEventListener('click', () => executeCommand(cmd));
            remainingChips.appendChild(btn);
        });
        remainingPanel.classList.add('visible');
    }

    function updateScrollIndicator() {
        if (unlockedSections.size >= 2) scrollIndicator.classList.add('visible');
        else scrollIndicator.classList.remove('visible');
    }

    // --- Exécution des commandes ---
    function resolveCommand(raw) {
        const trimmed = raw.trim();
        if (!trimmed) return null;
        if (COMMANDS[trimmed]) return trimmed;
        
        const lower = trimmed.toLowerCase().replace(/;+$/, '');
        const lowerNoParens = lower.replace(/\(\)$/, '');
        for (const key of ALL_COMMANDS) {
            const keyLower = key.toLowerCase();
            const keyNoParens = keyLower.replace(/\(\)$/, '');
            if (lower === keyLower || lowerNoParens === keyNoParens) return key;
        }
        return null;
    }

    function suggestClosest(raw) {
        const lower = raw.toLowerCase().replace(/;+$/, '').replace(/\(\)$/, '');
        let best = null;
        let bestDist = Infinity;
        for (const key of ALL_COMMANDS) {
            const k = key.toLowerCase().replace(/\(\)$/, '');
            const dist = levenshtein(lower, k);
            if (dist < bestDist) { bestDist = dist; best = key; }
        }
        return bestDist <= 4 ? best : null;
    }

    function levenshtein(a, b) {
        const m = a.length, n = b.length;
        if (m === 0) return n;
        if (n === 0) return m;
        const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                dp[i][j] = a[i-1] === b[j-1]
                    ? dp[i-1][j-1]
                    : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
            }
        }
        return dp[m][n];
    }

    function executeCommand(rawCmd) {
        if (!rawCmd) return;
        const targetOutput = input && input.offsetParent !== null ? consoleOutput : drawerOutput;
        const targetContainer = input && input.offsetParent !== null ? consoleContainer : drawerPanel;

        appendMessage(`$ ${rawCmd}`, 'user-cmd', targetOutput);
        const resolved = resolveCommand(rawCmd);

        if (resolved) {
            appendMessage(COMMANDS[resolved].message, 'success-msg', targetOutput);
            
            // Si c'est la commande contact()
            if (resolved === 'contact()') {
                setTimeout(openContactModal, 400);
            } else {
                unlockSections(COMMANDS[resolved].sections, resolved);
            }
        } else {
            if (targetContainer) {
                targetContainer.classList.add('shake');
                setTimeout(() => targetContainer.classList.remove('shake'), 500);
            }
            const suggestion = suggestClosest(rawCmd);
            if (suggestion) {
                appendMessage(`> Commande inconnue. Vouliez-vous dire "${suggestion}" ?`, 'error-msg', targetOutput);
            } else {
                appendMessage(`> Erreur : commande "${rawCmd}" introuvable.`, 'error-msg', targetOutput);
            }
        }
    }

    function appendMessage(text, className, outputEl) {
        const p = document.createElement('p');
        p.textContent = text;
        if (className) p.className = className;
        outputEl.appendChild(p);
        outputEl.scrollTop = outputEl.scrollHeight;
    }

    function addSystemMessage(text) {
        const p1 = document.createElement('p');
        p1.textContent = text;
        p1.className = 'sys-msg';
        consoleOutput.appendChild(p1);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;

        const p2 = document.createElement('p');
        p2.textContent = text;
        p2.className = 'sys-msg';
        drawerOutput.appendChild(p2);
        drawerOutput.scrollTop = drawerOutput.scrollHeight;
    }

    // --- Ghost typing ---
    function simulateTyping(text, targetInput) {
        targetInput.value = '';
        targetInput.focus();
        let i = 0;
        targetInput.disabled = true;
        const interval = setInterval(() => {
            if (i < text.length) {
                targetInput.value += text.charAt(i);
                i++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    targetInput.disabled = false;
                    executeCommand(text);
                    targetInput.value = '';
                }, 300);
            }
        }, 50);
    }

    hintChips.forEach(chip => {
        chip.addEventListener('click', () => {
            if (input.disabled) return;
            simulateTyping(chip.dataset.cmd, input);
        });
    });

    // --- Bouton Contact dans la section Contact ---
    btnContactTriggers.forEach(btn => {
        btn.addEventListener('click', () => {
            openContactModal();
        });
    });

    // --- Autocomplete ---
    function attachAutocomplete(inputEl, outputEl) {
        const parent = inputEl.parentElement;
        const box = document.createElement('div');
        box.className = 'suggestion-box';
        parent.appendChild(box);
        let selectedIndex = -1;
        let currentSuggestions = [];

        function hide() {
            box.classList.remove('visible');
            box.innerHTML = '';
            selectedIndex = -1;
            currentSuggestions = [];
        }

        function render(suggestions) {
            if (suggestions.length === 0) { hide(); return; }
            box.innerHTML = '';
            suggestions.forEach((cmd, i) => {
                const item = document.createElement('div');
                item.className = 'suggestion-item' + (i === selectedIndex ? ' selected' : '');
                item.innerHTML = `<span>${cmd}</span><span class="sg-label">${COMMANDS[cmd].label}</span>`;
                item.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    inputEl.value = cmd;
                    hide();
                    inputEl.focus();
                });
                box.appendChild(item);
            });
            box.classList.add('visible');
        }

        function updateSuggestions() {
            const val = inputEl.value.trim();
            if (val.length === 0) { hide(); return; }
            const lower = val.toLowerCase();
            currentSuggestions = ALL_COMMANDS.filter(cmd => cmd.toLowerCase().includes(lower));
            if (currentSuggestions.length === 0) { hide(); return; }
            selectedIndex = -1;
            render(currentSuggestions);
        }

        inputEl.addEventListener('input', updateSuggestions);

        inputEl.addEventListener('keydown', (e) => {
            if (!box.classList.contains('visible')) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % currentSuggestions.length;
                render(currentSuggestions);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = (selectedIndex - 1 + currentSuggestions.length) % currentSuggestions.length;
                render(currentSuggestions);
            } else if (e.key === 'Tab' || (e.key === 'Enter' && selectedIndex >= 0)) {
                if (selectedIndex >= 0) {
                    e.preventDefault();
                    inputEl.value = currentSuggestions[selectedIndex];
                    hide();
                    inputEl.focus();
                }
            } else if (e.key === 'Escape') {
                hide();
            }
        });

        inputEl.addEventListener('blur', () => {
            setTimeout(hide, 150);
        });
    }

    attachAutocomplete(input, consoleOutput);
    attachAutocomplete(drawerInput, drawerOutput);

    // --- Inputs manuels ---
    function bindInput(inputEl) {
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !inputEl.disabled) {
                const value = inputEl.value.trim();
                if (value) {
                    executeCommand(value);
                    inputEl.value = '';
                }
            }
        });
    }
    bindInput(input);
    bindInput(drawerInput);

    // --- Drawer ---
    function openDrawer() {
        drawerPanel.classList.add('open');
        drawerToggle.classList.add('hidden');
        drawer.setAttribute('aria-hidden', 'false');
        setTimeout(() => drawerInput.focus(), 200);
    }
    function closeDrawer() {
        drawerPanel.classList.remove('open');
        drawerToggle.classList.remove('hidden');
        drawer.setAttribute('aria-hidden', 'true');
    }
    drawerToggle.addEventListener('click', openDrawer);
    drawerClose.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            if (drawerPanel.classList.contains('open')) closeDrawer();
            else openDrawer();
        }
    });

    // --- Nav Items ---
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.dataset.target;
            const cmd = item.dataset.cmd;

            if (unlockedSections.has(target)) {
                const section = document.getElementById(target);
                if (section && !section.classList.contains('hidden-section')) {
                    const y = section.getBoundingClientRect().top + window.scrollY - 90;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }
            } else {
                openDrawer();
                simulateTyping(cmd, drawerInput);
            }
        });
    });

    // --- Scroll indicator ---
    scrollIndicator.addEventListener('click', () => {
        const sections = document.querySelectorAll('.section-container:not(.hidden-section)');
        if (sections.length === 0) return;
        const first = sections[0];
        const y = first.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: y, behavior: 'smooth' });
    });

    // --- Observer ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navItems.forEach(n => {
                    if (n.dataset.target === entry.target.id) n.classList.add('active');
                    else n.classList.remove('active');
                });
            }
        });
    }, { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('.section-container').forEach(s => observer.observe(s));

    // --- Logo ---
    logo.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- Modales ---
    function openResetModal() {
        modalOverlay.classList.add('visible');
        modalOverlay.setAttribute('aria-hidden', 'false');
    }
    function closeResetModal() {
        modalOverlay.classList.remove('visible');
        modalOverlay.setAttribute('aria-hidden', 'true');
    }
    resetBtn.addEventListener('click', openResetModal);
    modalCancel.addEventListener('click', closeResetModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeResetModal();
    });

    modalConfirm.addEventListener('click', () => {
        closeResetModal();
        resetAll();
    });

    // Gestion Modale Contact
    function openContactModal() {
        contactModal.classList.add('visible');
        contactModal.setAttribute('aria-hidden', 'false');
        contactForm.reset();
        // Réinitialiser le chat
        contactChat.innerHTML = `
            <p class="sys-msg">// Initialisation du formulaire de contact...</p>
            <p class="sys-msg">// Veuillez répondre aux questions.</p>
        `;
        // Focus sur le premier champ
        setTimeout(() => document.getElementById('contact-name').focus(), 100);
    }
    function closeContactModal() {
        contactModal.classList.remove('visible');
        contactModal.setAttribute('aria-hidden', 'true');
    }
    contactClose.addEventListener('click', closeContactModal);
    contactModal.addEventListener('click', (e) => {
        if (e.target === contactModal) closeContactModal();
    });

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('contact-name').value;
        const email = document.getElementById('contact-email').value;
        const message = document.getElementById('contact-message').value;

        // Simuler l'envoi
        contactChat.innerHTML += `<p class="user-cmd">> Envoi du message...</p>`;
        
        setTimeout(() => {
            contactChat.innerHTML += `<p class="success-msg">> Message envoyé avec succès par ${name}. Je vous recontacterai à l'adresse ${email}.</p>`;
            contactForm.reset();
            // Message dans la console principale
            addSystemMessage(`// Message de contact envoyé par ${name} (${email}).`);
            
            // Fermeture auto après 2 secondes
            setTimeout(closeContactModal, 2500);
        }, 800);
    });

    // --- Reset Global ---
    function resetAll() {
        unlockedSections.clear();
        hiddenRemaining = false;

        navItems.forEach(i => {
            i.classList.remove('unlocked', 'active');
            i.disabled = true;
        });
        progressBadge.textContent = `0/${TOTAL_MAIN_SECTIONS}`;
        progressBadge.classList.remove('complete');

        document.querySelectorAll('.section-container').forEach(sec => {
            sec.classList.add('hidden-section');
            sec.classList.remove('revealed');
        });

        portfolio.classList.remove('revealed');
        gatekeeper.classList.remove('dismissed');
        document.body.classList.remove('portfolio-open');
        scrollIndicator.classList.remove('visible');
        remainingPanel.classList.remove('visible');

        consoleOutput.innerHTML = `
            <p class="sys-msg">// Système réinitialisé.</p>
            <p class="sys-msg">// 0 / ${TOTAL_MAIN_SECTIONS} sections débloquées.</p>
            <p class="sys-msg">// Tapez une commande pour commencer.</p>
        `;
        drawerOutput.innerHTML = `<p class="sys-msg">// Console persistante. Tapez une commande.</p>`;

        closeDrawer();
        closeContactModal();
        localStorage.removeItem(STORAGE_KEY);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        if (window.innerWidth > 1024) {
            setTimeout(() => input.focus(), 400);
        }
    }

    // --- Restauration ---
    loadState();
    applyLoadedState();

    if (input && window.innerWidth > 1024) {
        setTimeout(() => input.focus(), 800);
    }

    // --- Panneau restant ---
    remainingClose.addEventListener('click', () => {
        hiddenRemaining = true;
        saveState();
        remainingPanel.classList.remove('visible');
    });
});