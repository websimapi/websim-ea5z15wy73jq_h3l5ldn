import nipplejs from 'nipplejs';
import { Fighter } from './Fighter.js';
import { Physics } from './Physics.js';

// Simple Projectile class exposed on window so Fighter can spawn without imports
window.Projectile = class {
    constructor(x, y, vx, vy, owner, opts = {}) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.r = opts.r || 12;
        this.bounces = typeof opts.bounces === 'number' ? opts.bounces : 3;
        this.dmg = opts.dmg || 12;
        this.owner = owner || null;
        this.life = opts.life || 600;
        this.color = opts.color || 'orange';
    }

    update(game) {
        // simple physics
        this.vy += (game.physics && game.physics.gravity) ? game.physics.gravity * 0.3 : 0.2;
        this.x += this.vx;
        this.y += this.vy;

        // Stage bounds (same stage as game uses)
        const stageW = 800;
        const stageH = 40;
        const stageX = game.canvas.width/2 - stageW/2;
        const stageY = game.canvas.height - 200;

        // Bounce on stage top/bottom (primarily bounce on the stage top area)
        if (this.y + this.r > stageY && this.y < stageY + stageH &&
            this.x + this.r > stageX && this.x - this.r < stageX + stageW) {
            // bounce off stage surface
            if (this.vy > 0) {
                this.y = stageY - this.r;
                this.vy = -Math.abs(this.vy) * 0.6;
                this.bounces--;
            }
        }

        // Bounce on left/right walls (screen edges)
        if (this.x - this.r < 0) {
            this.x = this.r;
            this.vx = -this.vx * 0.8;
            this.bounces--;
        }
        if (this.x + this.r > game.canvas.width) {
            this.x = game.canvas.width - this.r;
            this.vx = -this.vx * 0.8;
            this.bounces--;
        }

        this.life--;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        // glow
        ctx.fillStyle = 'rgba(255,140,30,0.18)';
        ctx.beginPath();
        ctx.arc(0, 0, this.r + 10, 0, Math.PI*2);
        ctx.fill();
        // core
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.r, 0, Math.PI*2);
        ctx.fill();
        // highlight
        ctx.fillStyle = 'rgba(255,220,140,0.9)';
        ctx.beginPath();
        ctx.arc(-this.r*0.25, -this.r*0.3, Math.max(2, this.r*0.35), 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    }

    getHitbox() {
        return { x: this.x - this.r, y: this.y - this.r, w: this.r*2, h: this.r*2, dmg: this.dmg, kb: 10 };
    }

    isExpired() {
        return this.life <= 0 || this.bounces < 0;
    }
};

const CHARACTERS = [
    { id: 'red', name: 'RED SQUARE', color: '#ff4757', shape: 'square', locked: false, classicReq: 0 },
    { id: 'blue', name: 'BLUE CIRCLE', color: '#3742fa', shape: 'circle', locked: false, classicReq: 0 },

    // Extra hidden page characters (appear when selecting from Smash or HP)
    { id: 'mario', name: 'MARIO', color: '#e74c3c', shape: 'star', locked: false, specialPage: 1 },
    { id: 'luigi', name: 'LUIGI', color: '#2ecc71', shape: 'triangle', locked: false, specialPage: 1 },

    // Classic unlocks (1-40)
    { id: 'gold', name: 'GOLD STAR', color: '#ffa502', shape: 'star', locked: true, classicReq: 1, unlockMsg: 'Win 1 Classic Match' },
    { id: 'green', name: 'GREEN LEAF', color: '#2ed573', shape: 'triangle', locked: true, classicReq: 2, unlockMsg: 'Win 2 Classic Matches' },
    { id: 'purple', name: 'PURPLE ORB', color: '#a29bfe', shape: 'circle', locked: true, classicReq: 3, unlockMsg: 'Win 3 Classic Matches' },
    { id: 'pink', name: 'PINK HEART', color: '#ef5777', shape: 'star', locked: true, classicReq: 4, unlockMsg: 'Win 4 Classic Matches' },
    { id: 'orange', name: 'BLAZE', color: '#ff7f50', shape: 'square', locked: true, classicReq: 5, unlockMsg: 'Win 5 Classic Matches' },

    // Add 35 more classic-unlock characters (total classic pool ~40)
    { id: 'ember', name: 'EMBER', color: '#ff6b6b', shape: 'triangle', locked: true, classicReq: 6, unlockMsg: 'Win 6 Classic Matches' },
    { id: 'frost', name: 'FROST', color: '#74b9ff', shape: 'circle', locked: true, classicReq: 7, unlockMsg: 'Win 7 Classic Matches' },
    { id: 'terra', name: 'TERRA', color: '#55efc4', shape: 'square', locked: true, classicReq: 8, unlockMsg: 'Win 8 Classic Matches' },
    { id: 'quake', name: 'QUAKE', color: '#dfe6e9', shape: 'star', locked: true, classicReq: 9, unlockMsg: 'Win 9 Classic Matches' },
    { id: 'vortex', name: 'VORTEX', color: '#a29bfe', shape: 'circle', locked: true, classicReq: 10, unlockMsg: 'Win 10 Classic Matches' },

    { id: 'ivy', name: 'IVY', color: '#2ecc71', shape: 'triangle', locked: true, classicReq: 11, unlockMsg: 'Win 11 Classic Matches' },
    { id: 'onyx', name: 'ONYX', color: '#2f3542', shape: 'square', locked: true, classicReq: 12, unlockMsg: 'Win 12 Classic Matches' },
    { id: 'flare', name: 'FLARE', color: '#ff9f43', shape: 'star', locked: true, classicReq: 13, unlockMsg: 'Win 13 Classic Matches' },
    { id: 'plasma', name: 'PLASMA', color: '#00d2d3', shape: 'circle', locked: true, classicReq: 14, unlockMsg: 'Win 14 Classic Matches' },
    { id: 'rune', name: 'RUNE', color: '#f78fb3', shape: 'square', locked: true, classicReq: 15, unlockMsg: 'Win 15 Classic Matches' },

    { id: 'gale', name: 'GALE', color: '#70a1ff', shape: 'triangle', locked: true, classicReq: 16, unlockMsg: 'Win 16 Classic Matches' },
    { id: 'ember2', name: 'EMBER II', color: '#ff6b81', shape: 'star', locked: true, classicReq: 17, unlockMsg: 'Win 17 Classic Matches' },
    { id: 'cinder', name: 'CINDER', color: '#ff4d4d', shape: 'square', locked: true, classicReq: 18, unlockMsg: 'Win 18 Classic Matches' },
    { id: 'glint', name: 'GLINT', color: '#f1c40f', shape: 'circle', locked: true, classicReq: 19, unlockMsg: 'Win 19 Classic Matches' },
    { id: 'mire', name: 'MIRE', color: '#2d3436', shape: 'triangle', locked: true, classicReq: 20, unlockMsg: 'Win 20 Classic Matches' },

    { id: 'spire', name: 'SPIRE', color: '#dff9fb', shape: 'star', locked: true, classicReq: 21, unlockMsg: 'Win 21 Classic Matches' },
    { id: 'bolt', name: 'BOLT', color: '#00cec9', shape: 'triangle', locked: true, classicReq: 22, unlockMsg: 'Win 22 Classic Matches' },
    { id: 'shade', name: 'SHADE', color: '#636e72', shape: 'square', locked: true, classicReq: 23, unlockMsg: 'Win 23 Classic Matches' },
    { id: 'breeze', name: 'BREEZE', color: '#74b9ff', shape: 'circle', locked: true, classicReq: 24, unlockMsg: 'Win 24 Classic Matches' },
    { id: 'ember3', name: 'EMBER III', color: '#ff6b6b', shape: 'star', locked: true, classicReq: 25, unlockMsg: 'Win 25 Classic Matches' },

    { id: 'fable', name: 'FABLE', color: '#eccc68', shape: 'triangle', locked: true, classicReq: 26, unlockMsg: 'Win 26 Classic Matches' },
    { id: 'shard', name: 'SHARD', color: '#dfe6e9', shape: 'circle', locked: true, classicReq: 27, unlockMsg: 'Win 27 Classic Matches' },
    { id: 'torrent', name: 'TORRENT', color: '#00a8ff', shape: 'square', locked: true, classicReq: 28, unlockMsg: 'Win 28 Classic Matches' },
    { id: 'ember4', name: 'EMBER IV', color: '#ff7675', shape: 'star', locked: true, classicReq: 29, unlockMsg: 'Win 29 Classic Matches' },
    { id: 'forge', name: 'FORGE', color: '#ffb142', shape: 'triangle', locked: true, classicReq: 30, unlockMsg: 'Win 30 Classic Matches' },

    { id: 'dusk', name: 'DUSK', color: '#6c5ce7', shape: 'circle', locked: true, classicReq: 31, unlockMsg: 'Win 31 Classic Matches' },
    { id: 'dawn', name: 'DAWN', color: '#fd79a8', shape: 'star', locked: true, classicReq: 32, unlockMsg: 'Win 32 Classic Matches' },
    { id: 'pylon', name: 'PYLON', color: '#e17055', shape: 'square', locked: true, classicReq: 33, unlockMsg: 'Win 33 Classic Matches' },
    { id: 'rift', name: 'RIFT', color: '#00b894', shape: 'triangle', locked: true, classicReq: 34, unlockMsg: 'Win 34 Classic Matches' },
    { id: 'zephyr', name: 'ZEPHYR', color: '#0984e3', shape: 'circle', locked: true, classicReq: 35, unlockMsg: 'Win 35 Classic Matches' },

    { id: 'ember5', name: 'EMBER V', color: '#ff4757', shape: 'star', locked: true, classicReq: 36, unlockMsg: 'Win 36 Classic Matches' },
    { id: 'mantle', name: 'MANTLE', color: '#b2bec3', shape: 'square', locked: true, classicReq: 37, unlockMsg: 'Win 37 Classic Matches' },
    { id: 'pulse', name: 'PULSE', color: '#00d2d3', shape: 'circle', locked: true, classicReq: 38, unlockMsg: 'Win 38 Classic Matches' },
    { id: 'ember6', name: 'EMBER VI', color: '#ff6b6b', shape: 'triangle', locked: true, classicReq: 39, unlockMsg: 'Win 39 Classic Matches' },
    { id: 'arch', name: 'ARCH', color: '#ffeaa7', shape: 'star', locked: true, classicReq: 40, unlockMsg: 'Win 40 Classic Matches' },

    // Adventure unlocks (41-82)
    { id: 'shadow', name: 'SHADOW', color: '#2f3542', shape: 'square', locked: true, adventureReq: 1, unlockMsg: 'Win 1 Adventure Match' },
    { id: 'cyan', name: 'CYAN BOLT', color: '#00d2d3', shape: 'triangle', locked: true, adventureReq: 2, unlockMsg: 'Win 2 Adventure Matches' },
    { id: 'silver', name: 'SILVER MECH', color: '#ced6e0', shape: 'circle', locked: true, adventureReq: 3, unlockMsg: 'Win 3 Adventure Matches' },

    // Add 69 more adventure-unlock characters to reach +72 new total
    { id: 'wisp', name: 'WISP', color: '#74b9ff', shape: 'circle', locked: true, adventureReq: 4, unlockMsg: 'Win 4 Adventure Matches' },
    { id: 'glyph', name: 'GLYPH', color: '#ff9ff3', shape: 'star', locked: true, adventureReq: 5, unlockMsg: 'Win 5 Adventure Matches' },
    { id: 'bastion', name: 'BASTION', color: '#dfe6e9', shape: 'square', locked: true, adventureReq: 6, unlockMsg: 'Win 6 Adventure Matches' },
    { id: 'orchid', name: 'ORCHID', color: '#be2edd', shape: 'triangle', locked: true, adventureReq: 7, unlockMsg: 'Win 7 Adventure Matches' },
    { id: 'emberA', name: 'EMBER A', color: '#ff6b81', shape: 'star', locked: true, adventureReq: 8, unlockMsg: 'Win 8 Adventure Matches' },

    { id: 'glacier', name: 'GLACIER', color: '#74b9ff', shape: 'circle', locked: true, adventureReq: 9, unlockMsg: 'Win 9 Adventure Matches' },
    { id: 'marrow', name: 'MARROW', color: '#ffb8b8', shape: 'square', locked: true, adventureReq: 10, unlockMsg: 'Win 10 Adventure Matches' },
    { id: 'vector', name: 'VECTOR', color: '#0984e3', shape: 'triangle', locked: true, adventureReq: 11, unlockMsg: 'Win 11 Adventure Matches' },
    { id: 'sable', name: 'SABLE', color: '#2f3542', shape: 'star', locked: true, adventureReq: 12, unlockMsg: 'Win 12 Adventure Matches' },
    { id: 'cobalt', name: 'COBALT', color: '#2e86de', shape: 'circle', locked: true, adventureReq: 13, unlockMsg: 'Win 13 Adventure Matches' },

    { id: 'forgeA', name: 'FORGE A', color: '#ffb142', shape: 'square', locked: true, adventureReq: 14, unlockMsg: 'Win 14 Adventure Matches' },
    { id: 'pyre', name: 'PYRE', color: '#ff6b6b', shape: 'triangle', locked: true, adventureReq: 15, unlockMsg: 'Win 15 Adventure Matches' },
    { id: 'lumen', name: 'LUMEN', color: '#f6e58d', shape: 'star', locked: true, adventureReq: 16, unlockMsg: 'Win 16 Adventure Matches' },
    { id: 'noctis', name: 'NOCTIS', color: '#5352ed', shape: 'circle', locked: true, adventureReq: 17, unlockMsg: 'Win 17 Adventure Matches' },
    { id: 'raven', name: 'RAVEN', color: '#2d3436', shape: 'square', locked: true, adventureReq: 18, unlockMsg: 'Win 18 Adventure Matches' },

    { id: 'emberB', name: 'EMBER B', color: '#ff7b7b', shape: 'star', locked: true, adventureReq: 19, unlockMsg: 'Win 19 Adventure Matches' },
    { id: 'kairo', name: 'KAIRO', color: '#30475e', shape: 'triangle', locked: true, adventureReq: 20, unlockMsg: 'Win 20 Adventure Matches' },
    { id: 'aurora', name: 'AURORA', color: '#7bed9f', shape: 'circle', locked: true, adventureReq: 21, unlockMsg: 'Win 21 Adventure Matches' },
    { id: 'sirocco', name: 'SIROCCO', color: '#ff9f1a', shape: 'square', locked: true, adventureReq: 22, unlockMsg: 'Win 22 Adventure Matches' },
    { id: 'myst', name: 'MYST', color: '#c8d6e5', shape: 'star', locked: true, adventureReq: 23, unlockMsg: 'Win 23 Adventure Matches' },

    { id: 'emberC', name: 'EMBER C', color: '#ff6b6b', shape: 'triangle', locked: true, adventureReq: 24, unlockMsg: 'Win 24 Adventure Matches' },
    { id: 'golem', name: 'GOLEM', color: '#95a5a6', shape: 'square', locked: true, adventureReq: 25, unlockMsg: 'Win 25 Adventure Matches' },
    { id: 'wraith', name: 'WRAITH', color: '#2f3542', shape: 'circle', locked: true, adventureReq: 26, unlockMsg: 'Win 26 Adventure Matches' },
    { id: 'phoenix', name: 'PHOENIX', color: '#ff6b6b', shape: 'star', locked: true, adventureReq: 27, unlockMsg: 'Win 27 Adventure Matches' },
    { id: 'emberD', name: 'EMBER D', color: '#ff8fa3', shape: 'triangle', locked: true, adventureReq: 28, unlockMsg: 'Win 28 Adventure Matches' },

    { id: 'zeal', name: 'ZEAL', color: '#feca57', shape: 'circle', locked: true, adventureReq: 29, unlockMsg: 'Win 29 Adventure Matches' },
    { id: 'prism', name: 'PRISM', color: '#ff9ff3', shape: 'star', locked: true, adventureReq: 30, unlockMsg: 'Win 30 Adventure Matches' },
    { id: 'shiver', name: 'SHIVER', color: '#74b9ff', shape: 'triangle', locked: true, adventureReq: 31, unlockMsg: 'Win 31 Adventure Matches' },
    { id: 'titan', name: 'TITAN', color: '#dfe6e9', shape: 'square', locked: true, adventureReq: 32, unlockMsg: 'Win 32 Adventure Matches' },
    { id: 'emberE', name: 'EMBER E', color: '#ff6b6b', shape: 'circle', locked: true, adventureReq: 33, unlockMsg: 'Win 33 Adventure Matches' },

    { id: 'nova', name: 'NOVA', color: '#f78fb3', shape: 'star', locked: true, adventureReq: 34, unlockMsg: 'Win 34 Adventure Matches' },
    { id: 'halo', name: 'HALO', color: '#f6e58d', shape: 'circle', locked: true, adventureReq: 35, unlockMsg: 'Win 35 Adventure Matches' },
    { id: 'emberF', name: 'EMBER F', color: '#ff6b6b', shape: 'square', locked: true, adventureReq: 36, unlockMsg: 'Win 36 Adventure Matches' },
    { id: 'vectorA', name: 'VECTOR A', color: '#00b894', shape: 'triangle', locked: true, adventureReq: 37, unlockMsg: 'Win 37 Adventure Matches' },
    { id: 'quartz', name: 'QUARTZ', color: '#d1ccc0', shape: 'star', locked: true, adventureReq: 38, unlockMsg: 'Win 38 Adventure Matches' },

    { id: 'emberG', name: 'EMBER G', color: '#ff6b6b', shape: 'circle', locked: true, adventureReq: 39, unlockMsg: 'Win 39 Adventure Matches' },
    { id: 'emberH', name: 'EMBER H', color: '#ff6b81', shape: 'star', locked: true, adventureReq: 40, unlockMsg: 'Win 40 Adventure Matches' },
    { id: 'emberI', name: 'EMBER I', color: '#ff7b7b', shape: 'triangle', locked: true, adventureReq: 41, unlockMsg: 'Win 41 Adventure Matches' },
    { id: 'emberJ', name: 'EMBER J', color: '#ff8fa3', shape: 'circle', locked: true, adventureReq: 42, unlockMsg: 'Win 42 Adventure Matches' },
    { id: 'emberK', name: 'EMBER K', color: '#ff9fb3', shape: 'square', locked: true, adventureReq: 43, unlockMsg: 'Win 43 Adventure Matches' },

    { id: 'emberL', name: 'EMBER L', color: '#ffb3b3', shape: 'star', locked: true, adventureReq: 44, unlockMsg: 'Win 44 Adventure Matches' },
    { id: 'emberM', name: 'EMBER M', color: '#ffc9c9', shape: 'triangle', locked: true, adventureReq: 45, unlockMsg: 'Win 45 Adventure Matches' },
    { id: 'emberN', name: 'EMBER N', color: '#ffd6d6', shape: 'circle', locked: true, adventureReq: 46, unlockMsg: 'Win 46 Adventure Matches' },
    { id: 'emberO', name: 'EMBER O', color: '#ffe6e6', shape: 'square', locked: true, adventureReq: 47, unlockMsg: 'Win 47 Adventure Matches' },
    { id: 'emberP', name: 'EMBER P', color: '#fff0f0', shape: 'star', locked: true, adventureReq: 48, unlockMsg: 'Win 48 Adventure Matches' },

    { id: 'last1', name: 'APEX ONE', color: '#b8e994', shape: 'circle', locked: true, adventureReq: 49, unlockMsg: 'Win 49 Adventure Matches' },
    { id: 'last2', name: 'APEX TWO', color: '#c7ecee', shape: 'triangle', locked: true, adventureReq: 50, unlockMsg: 'Win 50 Adventure Matches' },
    { id: 'last3', name: 'APEX THREE', color: '#ffa502', shape: 'star', locked: true, adventureReq: 51, unlockMsg: 'Win 51 Adventure Matches' },
    { id: 'last4', name: 'APEX FOUR', color: '#ff6b6b', shape: 'square', locked: true, adventureReq: 52, unlockMsg: 'Win 52 Adventure Matches' },
    { id: 'last5', name: 'APEX FIVE', color: '#74b9ff', shape: 'circle', locked: true, adventureReq: 53, unlockMsg: 'Win 53 Adventure Matches' },

    { id: 'last6', name: 'APEX SIX', color: '#2ed573', shape: 'triangle', locked: true, adventureReq: 54, unlockMsg: 'Win 54 Adventure Matches' },
    { id: 'last7', name: 'APEX SEVEN', color: '#2f3542', shape: 'square', locked: true, adventureReq: 55, unlockMsg: 'Win 55 Adventure Matches' },
    { id: 'last8', name: 'APEX EIGHT', color: '#ff9ff3', shape: 'star', locked: true, adventureReq: 56, unlockMsg: 'Win 56 Adventure Matches' },
    { id: 'last9', name: 'APEX NINE', color: '#feca57', shape: 'circle', locked: true, adventureReq: 57, unlockMsg: 'Win 57 Adventure Matches' },
    { id: 'last10', name: 'APEX TEN', color: '#c7ecee', shape: 'triangle', locked: true, adventureReq: 58, unlockMsg: 'Win 58 Adventure Matches' },

    { id: 'last11', name: 'APEX ELEVEN', color: '#dfe6e9', shape: 'square', locked: true, adventureReq: 59, unlockMsg: 'Win 59 Adventure Matches' },
    { id: 'last12', name: 'APEX TWELVE', color: '#ffeaa7', shape: 'star', locked: true, adventureReq: 60, unlockMsg: 'Win 60 Adventure Matches' },
    { id: 'last13', name: 'APEX THIRTEEN', color: '#ff6b6b', shape: 'circle', locked: true, adventureReq: 61, unlockMsg: 'Win 61 Adventure Matches' },
    { id: 'last14', name: 'APEX FOURTEEN', color: '#74b9ff', shape: 'triangle', locked: true, adventureReq: 62, unlockMsg: 'Win 62 Adventure Matches' },
    { id: 'last15', name: 'APEX FIFTEEN', color: '#00d2d3', shape: 'square', locked: true, adventureReq: 63, unlockMsg: 'Win 63 Adventure Matches' },

    { id: 'last16', name: 'APEX SIXTEEN', color: '#a29bfe', shape: 'star', locked: true, adventureReq: 64, unlockMsg: 'Win 64 Adventure Matches' },
    { id: 'last17', name: 'APEX SEVENTEEN', color: '#ff7f50', shape: 'circle', locked: true, adventureReq: 65, unlockMsg: 'Win 65 Adventure Matches' },
    { id: 'last18', name: 'APEX EIGHTEEN', color: '#ef5777', shape: 'triangle', locked: true, adventureReq: 66, unlockMsg: 'Win 66 Adventure Matches' },
    { id: 'last19', name: 'APEX NINETEEN', color: '#ced6e0', shape: 'square', locked: true, adventureReq: 67, unlockMsg: 'Win 67 Adventure Matches' },
    { id: 'last20', name: 'APEX TWENTY', color: '#00a8ff', shape: 'star', locked: true, adventureReq: 68, unlockMsg: 'Win 68 Adventure Matches' },

    { id: 'last21', name: 'APEX XXI', color: '#fd79a8', shape: 'circle', locked: true, adventureReq: 69, unlockMsg: 'Win 69 Adventure Matches' },
    { id: 'last22', name: 'APEX XXII', color: '#f78fb3', shape: 'triangle', locked: true, adventureReq: 70, unlockMsg: 'Win 70 Adventure Matches' },
    { id: 'last23', name: 'APEX XXIII', color: '#ff9f43', shape: 'square', locked: true, adventureReq: 71, unlockMsg: 'Win 71 Adventure Matches' },
    { id: 'last24', name: 'APEX XXIV', color: '#74b9ff', shape: 'star', locked: true, adventureReq: 72, unlockMsg: 'Win 72 Adventure Matches' },
];

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();

        this.state = 'main-menu';
        this.fighters = [];
        this.physics = new Physics();
        this.p1 = null;
        this.p2 = null;
        this.keys = {};
        this.mobileInput = { x: 0, y: 0, buttons: {} };
        
        this.tutorialStep = 0;
        this.gameMode = null; 
        
        this.classicWins = parseInt(localStorage.getItem('smash_classic_wins') || '0');
        this.adventureWins = parseInt(localStorage.getItem('smash_adventure_wins') || '0');
        this.loadUnlocks();

        // Smash Ball
        this.smashBall = { active: false, x: 0, y: 0, r: 24, respawnTimer: 0 };
        // Projectiles (e.g., Mario fireballs)
        this.projectiles = [];

        this.initControls();
        this.initUI();
        this.loop();

        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    loadUnlocks() {
        // Unlock characters based on their classicReq or adventureReq properties.
        CHARACTERS.forEach(c => {
            if (typeof c.classicReq === 'number') {
                c.locked = this.classicWins < c.classicReq;
            } else if (typeof c.adventureReq === 'number') {
                c.locked = this.adventureWins < c.adventureReq;
            } else {
                // default: if locked property exists and no reqs, keep as-is
            }
        });
    }

    initUI() {
        // Initialize char grid with support for pages (page 0 = normal roster, page 1 = extra Mario/Luigi)
        this.charSelectPage = this.charSelectPage || 0;
        const grid = document.getElementById('char-grid');
        grid.innerHTML = '';

        // Show/hide side arrows based on mode (only show when selecting via 'smash' or 'hp')
        const prevBtn = document.getElementById('char-prev');
        const nextBtn = document.getElementById('char-next');
        if (prevBtn && nextBtn) {
            if (this.gameMode === 'smash' || this.gameMode === 'hp') {
                prevBtn.classList.remove('hidden');
                nextBtn.classList.remove('hidden');
                prevBtn.onclick = () => { this.charSelectPage = Math.max(0, (this.charSelectPage - 1)); this.initUI(); };
                nextBtn.onclick = () => { this.charSelectPage = Math.min(1, (this.charSelectPage + 1)); this.initUI(); };
            } else {
                prevBtn.classList.add('hidden');
                nextBtn.classList.add('hidden');
            }
        }

        // Render characters that belong to the current page (default page 0)
        CHARACTERS.forEach(char => {
            const page = char.specialPage || 0;
            if (page !== this.charSelectPage) return;

            const card = document.createElement('div');
            card.className = `char-card ${char.locked ? 'locked' : ''}`;
            
            let borderRadius = '4px';
            if (char.shape === 'circle') borderRadius = '50%';
            
            card.innerHTML = `
                <div class="char-img" style="background:${char.color}; border-radius:${borderRadius}"></div>
                <span>${char.name}</span>
                ${char.locked ? '<div class="lock-icon">🔒</div>' : ''}
            `;
            if (!char.locked) {
                card.onclick = () => this.selectCharacter(char);
            } else {
                card.title = char.unlockMsg;
                card.onclick = () => alert(`Locked! ${char.unlockMsg}`);
            }
            grid.appendChild(card);
        });
    }

    initControls() {
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        // Mobile NippleJS
        const joystick = nipplejs.create({
            zone: document.getElementById('joystick-zone'),
            mode: 'static',
            position: { left: '75px', bottom: '75px' },
            color: 'white'
        });

        joystick.on('move', (evt, data) => {
            this.mobileInput.x = data.vector.x;
            this.mobileInput.y = -data.vector.y;
        });
        joystick.on('end', () => {
            this.mobileInput.x = 0;
            this.mobileInput.y = 0;
        });

        ['jump', 'attack', 'special', 'smash'].forEach(btn => {
            const el = document.getElementById(`btn-${btn}`);
            if (!el) return;
            el.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.mobileInput.buttons[btn] = true;
            });
            el.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.mobileInput.buttons[btn] = false;
            });
        });
    }

    setScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('mobile-controls').classList.add('hidden');
        
        if (id !== 'none') {
            document.getElementById(id).classList.add('active');
        } else {
            document.getElementById('hud').classList.remove('hidden');
            if ('ontouchstart' in window) {
                document.getElementById('mobile-controls').classList.remove('hidden');
            }
        }
        this.state = id;
    }

    selectCharacter(char) {
        // Use current gameMode (set by menu) or default to 'smash'
        if (!this.gameMode) this.gameMode = 'smash';
        this.startMatch(char.id, 'blue');
    }

    // Open character select and remember selection mode (so arrows show for Smash/HP)
    openCharSelect(mode = 'smash') {
        this.gameMode = mode;
        this.charSelectPage = 0;
        this.setScreen('char-select');
        // reinit UI so arrows and grid update for this mode
        this.initUI();
    }

    startMatch(p1Id, p2Id) {
        this.setScreen('none');
        this.fighters = [];
        
        const p1Data = CHARACTERS.find(c => c.id === p1Id);
        const p2Data = CHARACTERS.find(c => c.id === p2Id);

        this.p1 = new Fighter(this.canvas.width / 2 - 200, 300, p1Data, false);
        this.p2 = new Fighter(this.canvas.width / 2 + 200, 300, p2Data, true);
        
        this.fighters.push(this.p1, this.p2);
        
        // Initialize HP values when in HP mode
        if (this.gameMode === 'hp') {
            this.p1.hp = 100;
            this.p2.hp = 100;
        }

        document.querySelector('.p1 .name').textContent = p1Data.name;
        document.querySelector('.p2 .name').textContent = this.gameMode === 'smash' ? 'CPU' : p2Data.name;

        // Spawn initial smash ball shortly after match start
        this.spawnSmashBall(2000);
    }

    startTutorial() {
        this.gameMode = 'tutorial';
        this.tutorialStep = 0;
        this.startMatch('red', 'blue');
        this.p2.isSandbag = true;
        document.getElementById('tutorial-box').classList.remove('hidden');
        this.updateTutorial();
    }
    
    startHP() {
        // Open character selection and set mode to HP so the chosen fighter will use HP rules
        this.gameMode = 'hp';
        this.setScreen('char-select');
    }

    startClassic() {
        this.gameMode = 'classic';
        const opponentIndex = Math.min(this.classicWins, CHARACTERS.length - 1);
        const opponent = CHARACTERS[opponentIndex % CHARACTERS.length];
        this.startMatch('red', opponent.id);
    }

    startAdventure() {
        this.gameMode = 'adventure';
        // Adventure challenges get progressively harder based on wins
        const pool = CHARACTERS.filter(c => c.id !== 'red');
        const opponent = pool[this.adventureWins % pool.length];
        this.startMatch('red', opponent.id);
    }

    updateTutorial() {
        const steps = [
            "Move with Joystick / Arrows",
            "Jump with Space / Up Arrow",
            "Up Tilt: Hold UP + Press J",
            "Smash Attack: Press S",
            "Special: Press K",
            "Shield: Press L",
            "Smash Ball: Pick up the Smash Ball to get an aura",
            "Ultimate: Press U to unleash the Ultimate when you have the aura",
            "Tutorial Complete!"
        ];
        document.getElementById('tutorial-text').textContent = steps[this.tutorialStep];
        
        if (this.tutorialStep >= steps.length - 1) {
            setTimeout(() => {
                document.getElementById('tutorial-box').classList.add('hidden');
                this.setScreen('main-menu');
            }, 3000);
        }
    }

    handleInput() {
        if (this.state !== 'none' || !this.p1) return;

        const input = {
            x: this.keys['ArrowRight'] ? 1 : (this.keys['ArrowLeft'] ? -1 : this.mobileInput.x),
            y: this.keys['ArrowDown'] ? 1 : (this.keys['ArrowUp'] ? -1 : this.mobileInput.y),
            jump: this.keys['Space'] || this.keys['ArrowUp'] || this.mobileInput.buttons['jump'],
            attack: this.keys['KeyJ'] || this.mobileInput.buttons['attack'],
            special: this.keys['KeyK'] || this.mobileInput.buttons['special'],
            smash: this.keys['KeyS'] || this.mobileInput.buttons['smash'],
            shield: this.keys['KeyL'] || this.mobileInput.buttons['shield'],
            ultimateKey: this.keys['KeyU']
        };

        this.p1.updateInput(input);
        // Ultimate activation (press U)
        if (input.ultimateKey) {
            this.p1.doUltimate && this.p1.doUltimate();
        }

        // Simple tutorial progression
        if (this.gameMode === 'tutorial') {
            if (this.tutorialStep === 0 && Math.abs(input.x) > 0.5) this.tutorialStep = 1;
            else if (this.tutorialStep === 1 && input.jump) this.tutorialStep = 2;
            else if (this.tutorialStep === 2 && input.y < -0.5 && input.attack) this.tutorialStep = 3;
            else if (this.tutorialStep === 3 && input.smash) this.tutorialStep = 4;
            else if (this.tutorialStep === 4 && input.special) this.tutorialStep = 5;
            else if (this.tutorialStep === 5 && input.shield) this.tutorialStep = 6;
            this.updateTutorial();
        }

        // Basic AI for p2
        if (this.p2 && !this.p2.isSandbag) {
            this.p2.updateAI(this.p1);
        }
    }

    update() {
        if (this.state !== 'none') return;
        
        this.handleInput();
        this.physics.update(this.fighters, this.canvas);

        // handle top-of-screen star KO: if fighter flies above top threshold or touches the top, make them disappear immediately
        this.fighters.forEach(f => {
            if (!f) return;

            // Immediate disappearance when touching the top edge
            if (f.y <= 0 && !f.starShown) {
                // In HP mode, touching the top is an instant KO: set HP to 0 and end match immediately
                if (this.gameMode === 'hp') {
                    f.state = 'starKO';
                    f.starKOTimer = 0;
                    f.starScale = 0;
                    f.starShineTimer = 120;
                    f.starShown = true;
                    f.x = -9999;
                    f.y = -9999;
                    f.vx = 0;
                    f.vy = 0;

                    // Apply instant KO to the appropriate fighter and show result
                    if (f === this.p1) {
                        this.p1.hp = 0;
                        this.showResult('DEFEAT');
                    } else if (f === this.p2) {
                        this.p2.hp = 0;
                        this.showResult('VICTORY!');
                        // award wins/unlocks if applicable
                        this.unlockCheck();
                    }
                } else {
                    // mark as starKO-complete and show shining star immediately (non-HP behavior)
                    f.state = 'starKO';
                    f.starKOTimer = 0;
                    f.starScale = 0;
                    f.starShineTimer = 120;
                    f.starShown = true;
                    // move offscreen and stop movement
                    f.x = -9999;
                    f.y = -9999;
                    f.vx = 0;
                    f.vy = 0;
                }
            } else {
                // If fighter is moving upward past the visible top and not already in starKO/shown
                if (f.y + f.height < -100 && f.state !== 'starKO' && !f.starShown) {
                    f.triggerStarKO();
                }
            }

            // run per-fighter non-physics state updates (shrink, fly, star timers)
            if (typeof f.updateState === 'function') f.updateState();
        });

        // Update projectiles: movement, bounce, collisions with fighters
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const pr = this.projectiles[i];
            pr.update(this);

            // check collision with fighters (don't hit owner)
            [this.p1, this.p2].forEach(f => {
                if (!f || !pr || !f.hitbox) return;
            });

            // collision check: use projectile hitbox against fighters
            [this.p1, this.p2].forEach(f => {
                if (!f || f === pr.owner) return;
                const ph = pr.getHitbox();
                if (this.physics.checkCollision(ph, f)) {
                    // apply damage similar to hitbox structure
                    if (this.gameMode === 'hp') {
                        f.hp = (f.hp || 0) - ph.dmg;
                    } else {
                        f.percent += ph.dmg;
                    }
                    // apply knockback (simple)
                    const kbScale = ((typeof f.percent === 'number') ? f.percent : Math.max(0, 100 - (f.hp || 100))) / 100 + 1;
                    f.vx = (pr.vx > 0 ? 1 : -1) * ph.kb * kbScale;
                    f.vy = -ph.kb * 0.35 * kbScale;
                    f.hitstun = 12;
                    f.state = 'hitstun';
                    // remove projectile on hit
                    this.projectiles.splice(i, 1);
                }
            });

            if (pr && pr.isExpired()) {
                // remove expired projectiles
                this.projectiles.splice(i, 1);
            }
        }

        // Smash Ball collision checks and respawn
        if (this.smashBall.active) {
            // pickup by p1
            if (this.p1 && this.dist(this.p1.x + this.p1.width/2, this.p1.y + this.p1.height/2, this.smashBall.x, this.smashBall.y) < this.smashBall.r + 20) {
                this.p1.hasSmashBall = true;
                this.p1.smashAuraTimer = 600; // frames of visible aura (10s)
                this.smashBall.active = false;
                this.smashBall.respawnTimer = 600; // respawn delay
            }
            // pickup by p2
            if (this.p2 && this.dist(this.p2.x + this.p2.width/2, this.p2.y + this.p2.height/2, this.smashBall.x, this.smashBall.y) < this.smashBall.r + 20) {
                this.p2.hasSmashBall = true;
                this.p2.smashAuraTimer = 600;
                this.smashBall.active = false;
                this.smashBall.respawnTimer = 600;
                // If the CPU picked up the smash ball, immediately trigger a flame circle (down-special)
                if (this.p2.isAi) {
                    try { this.p2.performAttack({ special: true, y: 1 }); } catch(e) {}
                }
            }
        } else {
            if (this.smashBall.respawnTimer > 0) {
                this.smashBall.respawnTimer--;
            } else if (this.smashBall.respawnTimer === 0) {
                this.spawnSmashBall(0);
            }
        }

        // Decrease aura timers
        [this.p1, this.p2].forEach(p => {
            if (!p) return;
            if (p.hasSmashBall && p.smashAuraTimer > 0) {
                p.smashAuraTimer--;
            }
            if (p.smashAuraTimer <= 0 && p.hasSmashBall && p.state !== 'ultimate') {
                // aura fades but player still retains smash ball until used; optionally we can expire it
                // keep as permanent until consumed for this implementation
            }
        });

        // Update HUD (show HP in HP mode, otherwise percent)
        if (this.gameMode === 'hp') {
            document.querySelector('.p1 .percent').textContent = `${Math.max(0, Math.floor(this.p1.hp || 0))} HP`;
            document.querySelector('.p2 .percent').textContent = `${Math.max(0, Math.floor(this.p2.hp || 0))} HP`;
        } else {
            document.querySelector('.p1 .percent').textContent = `${Math.floor(this.p1.percent)}%`;
            document.querySelector('.p2 .percent').textContent = `${Math.floor(this.p2.percent)}%`;
        }

        // Check for victory (HP defeat or ring out)
        if (this.gameMode === 'hp') {
            if (this.p2 && (this.p2.hp || 0) <= 0) {
                this.showResult('VICTORY!');
                this.unlockCheck();
            } else if (this.p1 && (this.p1.hp || 0) <= 0) {
                this.showResult('DEFEAT');
            }
        } else {
            if (this.p2.isDead()) {
                this.showResult('VICTORY!');
                this.unlockCheck();
            } else if (this.p1.isDead()) {
                this.showResult('DEFEAT');
            }
        }
    }

    unlockCheck() {
        let unlocked = false;
        if (this.gameMode === 'classic') {
            this.classicWins++;
            localStorage.setItem('smash_classic_wins', this.classicWins);
            unlocked = true;
        } else if (this.gameMode === 'adventure') {
            this.adventureWins++;
            localStorage.setItem('smash_adventure_wins', this.adventureWins);
            unlocked = true;
        }

        if (unlocked) {
            const oldUnlocks = CHARACTERS.filter(c => !c.locked).map(c => c.id);
            this.loadUnlocks();
            const newUnlocks = CHARACTERS.filter(c => !c.locked && !oldUnlocks.includes(c.id));
            
            if (newUnlocks.length > 0) {
                setTimeout(() => {
                    alert(`NEW CHALLENGER UNLOCKED: ${newUnlocks[0].name}!`);
                    this.initUI();
                }, 500);
            }
        }
    }

    showResult(text) {
        document.getElementById('result-text').textContent = text;
        this.setScreen('game-over');
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw Stage
        this.ctx.fillStyle = '#444';
        const stageW = 800;
        const stageH = 40;
        const stageX = this.canvas.width/2 - stageW/2;
        const stageY = this.canvas.height - 200;
        this.ctx.fillRect(stageX, stageY, stageW, stageH);
        this.ctx.strokeStyle = '#666';
        this.ctx.strokeRect(stageX, stageY, stageW, stageH);

        // Draw Smash Ball
        if (this.smashBall.active) {
            this.ctx.save();
            this.ctx.translate(this.smashBall.x, this.smashBall.y);
            // glow
            this.ctx.fillStyle = 'rgba(255,215,0,0.15)';
            this.ctx.beginPath();
            this.ctx.arc(0,0,this.smashBall.r+12,0,Math.PI*2);
            this.ctx.fill();
            // core
            this.ctx.fillStyle = 'gold';
            this.ctx.beginPath();
            this.ctx.arc(0,0,this.smashBall.r,0,Math.PI*2);
            this.ctx.fill();
            // cross emblem
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(-10,0);
            this.ctx.lineTo(10,0);
            this.ctx.moveTo(0,-10);
            this.ctx.lineTo(0,10);
            this.ctx.stroke();
            this.ctx.restore();
        }

        // Draw projectiles
        this.projectiles.forEach(p => {
            p.draw(this.ctx);
        });

        this.fighters.forEach(f => f.draw(this.ctx));

        // Draw shining stars for any fighter that completed starKO
        this.fighters.forEach((f, idx) => {
            if (f && f.starShown) {
                // position shining star at top area above the stage, stagger by player index
                const starX = this.canvas.width / 2 + (idx === 0 ? -80 : 80);
                const starY = 80;
                const t = f.starShineTimer;
                const alpha = Math.max(0, Math.min(1, t / 120));
                // glow
                this.ctx.save();
                this.ctx.translate(starX, starY);
                this.ctx.globalAlpha = alpha * 0.9;
                const glowR = 36 + (1 - alpha) * 20;
                this.ctx.fillStyle = `rgba(255, 230, 120, ${0.25 * alpha})`;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, glowR, 0, Math.PI*2);
                this.ctx.fill();
                // star core
                this.ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
                this.ctx.beginPath();
                // simple 5-point star
                const rOuter = 18;
                const rInner = 8;
                for (let i=0;i<5;i++) {
                    const a = (i * (Math.PI * 2) / 5) - Math.PI/2;
                    const ax = Math.cos(a) * rOuter;
                    const ay = Math.sin(a) * rOuter;
                    if (i === 0) this.ctx.moveTo(ax, ay); else this.ctx.lineTo(ax, ay);
                    const a2 = a + Math.PI/5;
                    const ix = Math.cos(a2) * rInner;
                    const iy = Math.sin(a2) * rInner;
                    this.ctx.lineTo(ix, iy);
                }
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.restore();
            }
        });
    }

    spawnSmashBall(delay = 0) {
        if (delay > 0) {
            setTimeout(() => this.spawnSmashBall(0), delay);
            return;
        }
        this.smashBall.active = true;
        // Random-ish position above stage center
        const stageW = 800;
        const stageY = this.canvas.height - 200;
        this.smashBall.x = this.canvas.width/2 + (Math.random() * 400 - 200);
        this.smashBall.y = stageY - 120 + (Math.random() * 30 - 15);
    }

    dist(x1,y1,x2,y2) {
        const dx = x1 - x2, dy = y1 - y2;
        return Math.sqrt(dx*dx + dy*dy);
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

window.game = new Game();