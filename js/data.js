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
        message: "> Section contact débloquée...",
        label: "Contact"
    },
    'contact()': {
        sections: [], // N'ouvre pas de section, ouvre une modale
        message: "> Initialisation du formulaire de contact...",
        label: "Formulaire",
        isAction: true // Indique que c'est une action spécifique
    },
    'openAll()': {
        sections: ['section-hero', 'section-expertise', 'section-work', 'section-contact'],
        message: "> Accès total accordé. Initialisation du portfolio complet...",
        label: "Tout"
    }
};

const ALL_COMMANDS = Object.keys(COMMANDS);
const TOTAL_MAIN_SECTIONS = 4;