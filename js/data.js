const COMMANDS = {
    'openParcours()': {
        sections: ['section-hero', 'section-expertise'],
        message: "> Chargement du profil et des stacks...",
        label: "Profil & Stack"
    },
    'openRealisations()': {
        sections: ['section-work'],
        message: "> Chargement des projets...",
        label: "Projets"
    },
    'openContact()': {
        sections: ['section-contact'],
        message: "> Coordonnées débloquées...",
        label: "Contact"
    },
    'openAll()': {
        sections: ['section-hero', 'section-expertise', 'section-work', 'section-contact'],
        message: "> Accès total accordé. Initialisation du portfolio complet...",
        label: "Tout"
    }
};

const ALL_COMMANDS = Object.keys(COMMANDS);
const TOTAL_MAIN_SECTIONS = 4;