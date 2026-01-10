export class Physics {
    constructor() {
        this.gravity = 0.5;
        this.friction = 0.9;
    }

    update(fighters, canvas) {
        const stageW = 800;
        const stageH = 40;
        const stageX = canvas.width/2 - stageW/2;
        const stageY = canvas.height - 200;

        fighters.forEach(f => {
            // Apply Gravity
            f.vy += this.gravity;
            
            // Limit horizontal speed
            f.vx *= this.friction;

            // Apply Velocity
            f.x += f.vx;
            f.y += f.vy;

            // Stage Collision
            if (f.y + f.height > stageY && f.y < stageY + stageH &&
                f.x + f.width > stageX && f.x < stageX + stageW &&
                f.vy >= 0) {
                f.y = stageY - f.height;
                f.vy = 0;
                f.grounded = true;
                f.jumpCount = 0;
            } else {
                f.grounded = false;
            }

            // Hit Detection
            fighters.forEach(other => {
                if (f === other) return;
                if (f.hitbox && this.checkCollision(f.hitbox, other)) {
                    if (other.state !== 'shielding') {
                        this.applyHit(f, other);
                    } else {
                        // Shield pushback
                        other.vx += f.dir * 2;
                    }
                    f.hitbox = null; // Single hit per attack frame for simplicity
                }
            });
        });
    }

    checkCollision(rect1, f2) {
        return rect1.x < f2.x + f2.width &&
               rect1.x + rect1.w > f2.x &&
               rect1.y < f2.y + f2.height &&
               rect1.y + rect1.h > f2.y;
    }

    applyHit(attacker, victim) {
        const hb = attacker.hitbox;
        // Support both percent and HP game modes (HP mode reduces hp instead of percent)
        try {
            const gm = window.game && window.game.gameMode;
            if (gm === 'hp') {
                victim.hp = (victim.hp || 0) - hb.dmg;
            } else {
                victim.percent += hb.dmg;
            }
        } catch (e) {
            victim.percent += hb.dmg;
        }
        
        // Knockback formula based on percent (use percent if available, otherwise approximate from hp)
        const basePercent = (typeof victim.percent === 'number') ? victim.percent : Math.max(0, 100 - (victim.hp || 100));
        const kbScale = (basePercent / 100) + 1;
        victim.vx = attacker.dir * hb.kb * kbScale;
        victim.vy = -hb.kb * 0.5 * kbScale;
        
        // Additional special hitbox effects (e.g., Mario blanket)
        if (hb && hb.reverseDir) {
            // flip victim facing direction
            victim.dir = (victim.dir || 1) * -1;
        }
        if (hb && hb.pull) {
            // tug victim toward attacker: set lateral velocity toward attacker (negative of attacker's facing)
            // attacker.dir == 1 means attacker is facing right (so opponent to right); pulling should pull opponent toward attacker
            victim.vx = -attacker.dir * (hb.kb || 8) * 0.6;
            // small upward nudge
            victim.vy = Math.min(victim.vy, -4);
        }

        victim.hitstun = 20;
        victim.state = 'hitstun';

        // Play coin sound for special Mario up-hit (hitbox can include coin:true)
        try {
            if (hb && hb.coin) {
                const _audio = new Audio('/explode.wav');
                _audio.play().catch(() => {});
            }
        } catch (e) {
            // ignore audio errors
        }
        
        // Screenshake or other effects could go here
    }
}