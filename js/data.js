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
        sections: [], 
        message: "> Initialisation du formulaire de contact...",
        label: "Formulaire",
        isAction: true 
    },
    'help()': {
        sections: [], 
        message: "> Affichage de l'aide...",
        label: "Aide",
        isAction: true 
    },
    'openAll()': {
        sections: ['section-hero', 'section-expertise', 'section-work', 'section-contact'],
        message: "> Accès total accordé. Initialisation du portfolio complet...",
        label: "Tout"
    }
};

const ALL_COMMANDS = Object.keys(COMMANDS);
const TOTAL_MAIN_SECTIONS = 4;

// Données des projets pour la modale
const PROJECTS_DATA = {
    'alpha': {
        title: 'Alpha Analytics',
        tag: 'App Web',
        year: '2024',
        desc: 'Dashboard temps réel pour une fintech. Gestion de flux de données complexes, de la conception à la mise en production. Le projet inclut un système de cache optimisé et une UI ultra réactive.',
        stack: ['React', 'Node.js', 'Socket.io'],
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop',
        bgColor: '#E0F2FE',
        liveLink: '#',
        githubLink: '#'
    },
    'beta': {
        title: 'Beta Store',
        tag: 'E-commerce',
        year: '2023',
        desc: 'Refonte complète d\'une plateforme e-commerce avec paiement sécurisé. Migration vers Next.js pour le SEO et Stripe pour les transactions. Intégration d\'un CMS headless (Sanity).',
        stack: ['Next.js', 'Stripe', 'Sanity'],
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
        bgColor: '#FCE7F3',
        liveLink: '#',
        githubLink: '#'
    },
    'gamma': {
        title: 'Gamma API',
        tag: 'SaaS',
        year: '2023',
        desc: 'Plateforme SaaS de gestion de projet avec architecture microservices. Backend en Python (FastAPI) et frontend React. Base de données PostgreSQL gérée avec Prisma.',
        stack: ['React', 'Python', 'PostgreSQL'],
        image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop',
        bgColor: '#F3E8FF',
        liveLink: '#',
        githubLink: '#'
    }
};