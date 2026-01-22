// Game Constants and Tuning Values
const GAME_CONFIG = {
    WIDTH: 1024,
    HEIGHT: 768,
    BACKGROUND_COLOR: 0x1a0a2e
};

const COLORS = {
    BACKGROUND: 0x1a0a2e,
    NEON_CYAN: 0x00ffff,
    NEON_MAGENTA: 0xff00ff,
    NEON_YELLOW: 0xffff00,
    NEON_GREEN: 0x00ff00,
    NEON_ORANGE: 0xff6600,
    PLATFORM: 0x2d1b4e,
    HOME_BURROW: 0x4a2c7a
};

const PLAYER = {
    SPEED: 280,
    SIZE: 32,
    DASH_SPEED: 560,
    DASH_DURATION: 150,
    DASH_COOLDOWN: 1500,
    INVULNERABILITY_FRAMES: 100,
    COLOR: 0xffffff
};

const WOLF = {
    SPEED: 220,
    SIZE: 36,
    RECALC_INTERVAL: 500,
    MIN_PACK_SPACING: 80,
    CHASE_WEIGHT: 0.6,
    FLANK_WEIGHT: 0.4,
    COLOR: 0x888888
};

const SCORE = {
    REQUIRED_BERRY: 100,
    BONUS_BERRY: 250,
    TIME_BONUS_THRESHOLD: 30,
    TIME_BONUS_PER_SECOND: 10,
    LEVEL_COMPLETE: 500
};

// Level Generation Parameters for Roguelike Mode
const LEVEL_GEN = {
    // Base arena size
    BASE_ARENA_WIDTH: 850,
    BASE_ARENA_HEIGHT: 600,
    // Arena grows slightly each floor
    ARENA_GROWTH: 15,
    MAX_ARENA_WIDTH: 980,
    MAX_ARENA_HEIGHT: 720,

    // Wolf scaling
    BASE_WOLF_COUNT: 3,
    WOLF_INCREMENT: 0.5,  // Add wolf every 2 floors
    MAX_WOLVES: 8,

    // Wolf speed scaling (percentage increase per floor)
    WOLF_SPEED_INCREMENT: 0.02,
    MAX_WOLF_SPEED_MULTIPLIER: 1.4,

    // Platform/wall generation
    BASE_PLATFORMS: 3,
    PLATFORM_INCREMENT: 0.5,
    MAX_PLATFORMS: 10,

    // Vertical wall probability increases with floor
    BASE_VERTICAL_CHANCE: 0.3,
    VERTICAL_CHANCE_INCREMENT: 0.05,
    MAX_VERTICAL_CHANCE: 0.6,

    // Platform size ranges
    PLATFORM_MIN_LENGTH: 80,
    PLATFORM_MAX_LENGTH: 150,
    WALL_MIN_HEIGHT: 100,
    WALL_MAX_HEIGHT: 220,
    WALL_WIDTH: 20,
    PLATFORM_HEIGHT: 20,

    // Safe zones (no platforms here)
    SPAWN_SAFE_RADIUS: 100,
    HOME_SAFE_RADIUS: 80,
    BERRY_SAFE_RADIUS: 50,

    // Floor name prefixes
    FLOOR_NAMES: [
        "Meadow", "Forest", "Canyon", "Cliffs", "Cavern",
        "Ruins", "Wasteland", "Tundra", "Swamp", "Abyss"
    ],
    FLOOR_MODIFIERS: [
        "", "Dark ", "Frozen ", "Cursed ", "Ancient ",
        "Twisted ", "Shadow ", "Burning ", "Lost ", "Final "
    ]
};

const UI = {
    FONT_FAMILY: 'Courier New',
    TITLE_SIZE: '48px',
    MENU_SIZE: '24px',
    HUD_SIZE: '18px'
};

// Leaderboard Manager - Persistent high scores using localStorage
const Leaderboard = {
    STORAGE_KEY: 'rabbitrun_leaderboard',
    MAX_ENTRIES: 5,

    // Get all leaderboard entries
    getScores() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.warn('Failed to load leaderboard:', e);
        }
        return [];
    },

    // Save scores to localStorage
    saveScores(scores) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scores));
        } catch (e) {
            console.warn('Failed to save leaderboard:', e);
        }
    },

    // Check if a score qualifies for the leaderboard
    isHighScore(score) {
        const scores = this.getScores();
        if (scores.length < this.MAX_ENTRIES) {
            return true;
        }
        return score > scores[scores.length - 1].score;
    },

    // Add a new score to the leaderboard
    addScore(initials, score, floor) {
        const scores = this.getScores();

        // Sanitize initials: uppercase, 3 chars max, alphanumeric only
        const cleanInitials = initials
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .substring(0, 3)
            .padEnd(3, '_');

        const entry = {
            initials: cleanInitials,
            score: score,
            floor: floor,
            date: Date.now()
        };

        scores.push(entry);

        // Sort by score descending
        scores.sort((a, b) => b.score - a.score);

        // Keep only top entries
        const topScores = scores.slice(0, this.MAX_ENTRIES);

        this.saveScores(topScores);

        // Return the rank (1-indexed)
        return topScores.findIndex(s => s.date === entry.date) + 1;
    },

    // Clear all scores (for testing)
    clearScores() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
};
