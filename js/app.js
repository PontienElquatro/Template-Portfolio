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
    const drawerHeader = document.getElementById('drawer-header');

    const remainingPanel = document.getElementById('remaining-panel');
    const remainingChips = document.getElementById('remaining-chips');
    const remainingCount = document.getElementById('remaining-count');
    const remainingClose = document.getElementById('remaining-close');

    // Modales
    const modalOverlay = document.getElementById('modal-overlay'); 
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');

    const contactModal = document.getElementById('contact-modal');
    const contactClose = document.getElementById('contact-close');
    const contactForm = document.getElementById('contact-form');
    const contactChat = document.getElementById('contact-chat');

    const projectModal = document.getElementById('project-modal');
    const projectClose = document.getElementById('project-close');
    const projectModalBody = document.getElementById('project-modal-body');
    const projectCards = document.querySelectorAll('.project-card');

    // --- État ---
    const STORAGE_KEY = 'portfolio_state_v1';
    const MAIN_IDS = ['section-hero', 'section-expertise', 'section-work', 'section-contact'];
    let unlockedSections = new Set();
    let hiddenRemaining = false;
    let errorCount = 0; // Pour suggérer help()

    // Historique des commandes
    let commandHistory = [];
    let historyIndex = -1;

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

    // --- Drag & Drop Console ---
    let isDragging = false;
    let dragStartX, dragStartY;
    let drawerStartX, drawerStartY;

    drawerHeader.addEventListener('mousedown', (e) => {
        if (e.target.closest('.drawer-close')) return;
        isDragging = true;
        drawerPanel.classList.add('dragging');
        
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        
        const rect = drawerPanel.getBoundingClientRect();
        drawerStartX = rect.left;
        drawerStartY = rect.top;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        
        let newLeft = drawerStartX + dx;
        let newTop = drawerStartY + dy;
        
        newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - drawerPanel.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - drawerPanel.offsetHeight));
        
        drawerPanel.style.left = newLeft + 'px';
        drawerPanel.style.top = newTop + 'px';
        drawerPanel.style.transform = 'none'; 
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            drawerPanel.classList.remove('dragging');
        }
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

    // --- Helpers ---
    function showHelp(outputEl) {
        appendMessage("> Commandes de navigation :", 'hint-msg', outputEl);
        appendMessage("  openParcours()    - Débloquer le profil et les stacks", 'user-cmd', outputEl);
        appendMessage("  openRealisations() - Débloquer la section projets", 'user-cmd', outputEl);
        appendMessage("  openContact()      - Débloquer la section contact", 'user-cmd', outputEl);
        appendMessage("  openAll()          - Tout débloquer", 'user-cmd', outputEl);
        appendMessage("> Commandes d'action (dans le portfolio) :", 'hint-msg', outputEl);
        appendMessage("  contact()          - Ouvrir le formulaire de contact", 'user-cmd', outputEl);
        appendMessage("  viewProject('id')  - Voir les détails d'un projet (ex: alpha)", 'user-cmd', outputEl);
        appendMessage("  clear()            - Nettoyer la console", 'user-cmd', outputEl);
        appendMessage("> Tapez une commande ou cliquez sur les boutons pour agir.", 'sys-msg', outputEl);
    }

    function clearConsole(outputEl) {
        outputEl.innerHTML = `<p class="sys-msg">// Console nettoyée.</p>`;
    }

    // --- Exécution des commandes ---
    function resolveCommand(raw) {
        const trimmed = raw.trim();
        if (!trimmed) return null;
        
        // Support basique pour viewProject('id')
        if (trimmed.toLowerCase().startsWith('viewproject(')) {
            return 'viewProject()';
        }

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
        
        commandHistory.push(rawCmd);
        historyIndex = commandHistory.length;

        const targetOutput = input && input.offsetParent !== null ? consoleOutput : drawerOutput;
        const targetContainer = input && input.offsetParent !== null ? consoleContainer : drawerPanel;

        appendMessage(`$ ${rawCmd}`, 'user-cmd', targetOutput);
        const resolved = resolveCommand(rawCmd);

        if (resolved) {
            errorCount = 0; // Reset erreur
            
            if (resolved === 'help()') {
                showHelp(targetOutput);
                return;
            }
            if (resolved === 'clear()') {
                clearConsole(targetOutput);
                return;
            }

            // Vérifier si c'est une commande dynamique avec argument
            if (rawCmd.toLowerCase().startsWith('viewproject(')) {
                const match = rawCmd.match(/['"]([^'"]+)['"]/);
                if (match && match[1]) {
                    const projectId = match[1].toLowerCase();
                    if (PROJECTS_DATA[projectId]) {
                        appendMessage(`> Ouverture du projet '${projectId}'...`, 'success-msg', targetOutput);
                        setTimeout(() => openProjectModal(projectId), 400);
                    } else {
                        appendMessage(`> Erreur : projet '${projectId}' introuvable.`, 'error-msg', targetOutput);
                    }
                } else {
                    appendMessage(`> Usage : viewProject('alpha')`, 'error-msg', targetOutput);
                }
                return;
            }

            appendMessage(COMMANDS[resolved].message, 'success-msg', targetOutput);
            
            if (resolved === 'contact()') {
                setTimeout(openContactModal, 400);
            } else {
                unlockSections(COMMANDS[resolved].sections, resolved);
            }
        } else {
            // Gestion des erreurs (shake + suggestions)
            errorCount++;
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
            
            // UX Fallback : si 3 erreurs de suite, suggérer help()
            if (errorCount >= 3) {
                appendMessage(`> Tapez "help()" pour voir la liste des commandes valides.`, 'hint-msg', targetOutput);
                errorCount = 0;
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
                item.innerHTML = `<span>${cmd}</span><span class="sg-label">${COMMANDS[cmd]?.label || 'Action'}</span>`;
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
            // Historique (Flèches haut/bas)
            if (e.key === 'ArrowUp' && !box.classList.contains('visible')) {
                e.preventDefault();
                if (historyIndex > 0) {
                    historyIndex--;
                    inputEl.value = commandHistory[historyIndex];
                }
            } else if (e.key === 'ArrowDown' && !box.classList.contains('visible')) {
                e.preventDefault();
                if (historyIndex < commandHistory.length - 1) {
                    historyIndex++;
                    inputEl.value = commandHistory[historyIndex];
                } else {
                    historyIndex = commandHistory.length;
                    inputEl.value = '';
                }
            }
            
            // Autocomplete
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
        
        drawerPanel.style.left = '';
        drawerPanel.style.top = '';
        drawerPanel.style.transform = '';
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
        contactChat.innerHTML = `
            <p class="sys-msg">// Initialisation du formulaire de contact...</p>
            <p class="sys-msg">// Veuillez répondre aux questions.</p>
        `;
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

        contactChat.innerHTML += `<p class="user-cmd">> Envoi du message...</p>`;
        
        setTimeout(() => {
            contactChat.innerHTML += `<p class="success-msg">> Message envoyé avec succès par ${name}. Je vous recontacterai à l'adresse ${email}.</p>`;
            contactForm.reset();
            addSystemMessage(`// Message de contact envoyé par ${name} (${email}).`);
            setTimeout(closeContactModal, 2500);
        }, 800);
    });

    // Gestion Modale Projet
    function openProjectModal(projectId) {
        const data = PROJECTS_DATA[projectId];
        if (!data) return;

        // Construire le contenu HTML de la modale
        const stackBadges = data.stack.map(s => `<span class="tech-badge" style="background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2);">${s}</span>`).join('');
        
        projectModalBody.innerHTML = `
            <div class="project-modal-hero" style="background: ${data.bgColor};">
                <img src="${data.image}" alt="${data.title}">
            </div>
            <div class="project-modal-title">${data.title}</div>
            <div class="project-price" style="color: var(--text-dim); margin-bottom: 0.5rem;">${data.year} — ${data.tag}</div>
            <p class="project-modal-desc">${data.desc}</p>
            <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">${stackBadges}</div>
            
            <div class="project-modal-links">
                <a href="${data.liveLink}" target="_blank" class="link-live">Voir le site →</a>
                <a href="${data.githubLink}" target="_blank" class="link-github">Code source</a>
            </div>
        `;

        projectModal.classList.add('visible');
        projectModal.setAttribute('aria-hidden', 'false');
    }
    
    function closeProjectModal() {
        projectModal.classList.remove('visible');
        projectModal.setAttribute('aria-hidden', 'true');
    }
    
    projectClose.addEventListener('click', closeProjectModal);
    projectModal.addEventListener('click', (e) => {
        if (e.target === projectModal) closeProjectModal();
    });

    // Clic sur les cartes projets
    projectCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault(); // Empêche le lien # par défaut
            const projectId = card.dataset.project;
            openProjectModal(projectId);
        });
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
            <p class="sys-msg">// Tapez <span style="color:var(--accent);">help()</span> pour voir les commandes.</p>
        `;
        drawerOutput.innerHTML = `<p class="sys-msg">// Console persistante. Tapez une commande.</p>`;

        closeDrawer();
        closeContactModal();
        closeProjectModal();
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