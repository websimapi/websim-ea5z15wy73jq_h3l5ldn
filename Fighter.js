export class Fighter {
    constructor(x, y, data, isAi) {
        this.x = x;
        this.y = y;
        this.data = data;
        this.isAi = isAi;
        this.isSandbag = false;
        
        this.width = 40;
        this.height = 40;
        this.vx = 0;
        this.vy = 0;
        
        this.percent = 0;
        this.stocks = 3;
        // HP mode value (separate from percent-based damage)
        this.hp = 100;
        
        this.state = 'idle'; // idle, attacking, hitstun, shielding, ultimate, starKO
        this.dir = isAi ? -1 : 1;
        this.grounded = false;
        this.jumpCount = 0;
        
        this.attackFrame = 0;
        this.ultimateFrame = 0;
        this.hitbox = null;
        this.hitstun = 0;
        
        this.color = data.color;

        // Smash Ball / Ultimate
        this.hasSmashBall = false;
        this.smashAuraTimer = 0;

        // Star KO properties
        this.starKOTimer = 0;      // countdown while shrinking/flying
        this.starScale = 1;        // visual scale during star KO
        this.starShineTimer = 0;   // timer for shining star after fly-away
        this.starShown = false;    // whether the shining star has been placed
    }

    updateInput(input) {
        if (this.hitstun > 0) {
            this.hitstun--;
            return;
        }
        // don't accept inputs during starKO or ultimate
        if (this.state === 'starKO' || this.state === 'ultimate') return;

        // Movement
        if (Math.abs(input.x) > 0.1) {
            this.vx += input.x * 0.8;
            this.dir = input.x > 0 ? 1 : -1;
        } else {
            this.vx *= 0.8;
        }

        // Jump
        if (input.jump && this.jumpCount < 2 && !this.jumpPressed) {
            this.vy = -12;
            this.jumpCount++;
            this.jumpPressed = true;
        }
        if (!input.jump) this.jumpPressed = false;

        // Attacks
        if ((input.attack || input.special || input.smash) && this.state !== 'attacking') {
            this.performAttack(input);
        }

        // Shield (Don't overwrite attacking state)
        if (this.state !== 'attacking') {
            this.state = input.shield ? 'shielding' : 'idle';
        }
    }

    performAttack(input) {
        this.state = 'attacking';
        this.attackFrame = 25;

        let type = 'jab';

        // Mario special: if this fighter is Mario and performs smash + horizontal input, do marioBlast
        const isMario = this.data && this.data.id === 'mario';
        // New Mario up-smash/head+arm strike: S + Up -> 'marioUp'
        if (input.smash && isMario && Math.abs(input.x) > 0.5) {
            type = 'marioBlast';
            this.attackFrame = 36;
            // small recoil for mario when blasting
            this.vx += -this.dir * 2;
        } else if (input.smash && isMario && input.y < -0.5) {
            // Mario-specific up-smash: head and arm strike
            type = 'marioUp';
            this.attackFrame = 36;
            // slight upward hop for dramatic effect
            this.vy = -6;
        } else if (input.smash && isMario && input.y > 0.5) {
            // Mario-specific down+smash: breakdance multi-hit that still damages opponents
            type = 'marioBreak';
            this.attackFrame = 40;
            // slight root to center and spin effect (visual only via draw)
            this.vx *= 0.2;
            this.vy = 0;
        } else if (input.smash) {
            // Special red-character smash variations and general smash handling
            if (this.data && this.data.id === 'red') {
                // Red forward smash
                if (Math.abs(input.x) > 0.5) {
                    type = 'redFsmash';
                    this.attackFrame = 38;
                    // slight recoil for tradeoff
                    this.vx += -this.dir * 2.5;
                }
                // Red up smash - a rising burst/head-smash with vertical knockback
                else if (input.y < -0.5) {
                    type = 'redUpsmash';
                    this.attackFrame = 36;
                    // small hop upward for emphasis
                    this.vy = -4;
                }
                // Red down smash - a ground stomp / shockwave that sends opponents downward/outward
                else if (input.y > 0.5) {
                    type = 'redDownsmash';
                    this.attackFrame = 40;
                    // root in place for the stomp
                    this.vx *= 0.1;
                    this.vy = 0;
                } else {
                    type = 'redFsmash';
                    this.attackFrame = 38;
                    this.vx += -this.dir * 2.5;
                }
            } else if (this.data && this.data.id === 'gold') {
                    // GOLD STAR unique smash set:
                    // Gold forward: a radiant comet slash — long reach, medium speed, extra launch angle
                    if (Math.abs(input.x) > 0.5) {
                        type = 'goldFsmash';
                        this.attackFrame = 36;
                        // lunge slightly forward with glittery recoil
                        this.vx += this.dir * 2;
                    }
                    // Gold up: vertical star lance that launches opponents at a diagonal upward-right/left depending on facing
                    else if (input.y < -0.5) {
                        type = 'goldUpsmash';
                        this.attackFrame = 38;
                        // give a small hop to emphasize the upward strike
                        this.vy = -5;
                    }
                    // Gold down: dazzling ground burst that pulls in slightly then explodes outward with multi-hit shards
                    else if (input.y > 0.5) {
                        type = 'goldDownsmash';
                        this.attackFrame = 42;
                        // root for the burst
                        this.vx *= 0.05;
                        this.vy = 0;
                    } else {
                        type = 'goldFsmash';
                        this.attackFrame = 36;
                        this.vx += this.dir * 2;
                    }
            } else if (this.data && this.data.id === 'gold') {
                    // GOLD STAR unique smash set:
                    // Gold forward: a radiant comet slash — long reach, medium speed, extra launch angle
                    if (Math.abs(input.x) > 0.5) {
                        type = 'goldFsmash';
                        this.attackFrame = 36;
                        // lunge slightly forward with glittery recoil
                        this.vx += this.dir * 2;
                    }
                    // Gold up: vertical star lance that launches opponents at a diagonal upward-right/left depending on facing
                    else if (input.y < -0.5) {
                        type = 'goldUpsmash';
                        this.attackFrame = 38;
                        // give a small hop to emphasize the upward strike
                        this.vy = -5;
                    }
                    // Gold down: dazzling ground burst that pulls in slightly then explodes outward with multi-hit shards
                    else if (input.y > 0.5) {
                        type = 'goldDownsmash';
                        this.attackFrame = 42;
                        // root for the burst
                        this.vx *= 0.05;
                        this.vy = 0;
                    } else {
                        type = 'goldFsmash';
                        this.attackFrame = 36;
                        this.vx += this.dir * 2;
                    }
            } else if (this.data && this.data.id === 'green') {
                // GREEN LEAF unique smash set:
                // Forward: barrage kicks - a rapid multi-hit forward barrage when Smash + Left/Right is pressed
                if (Math.abs(input.x) > 0.5) {
                    type = 'greenBarrage';
                    this.attackFrame = 44; // longer multi-hit duration
                    // short lunge to start the barrage
                    this.vx += this.dir * 1.8;
                }
                // Up: rising leaf spear that launches upward with slight lateral drift
                else if (input.y < -0.5) {
                    type = 'greenUpsmash';
                    this.attackFrame = 38;
                    // soft hop to style
                    this.vy = -5;
                }
                // Down: grounded leaf whirl that pulls inward briefly then bursts foes outward
                else if (input.y > 0.5) {
                    type = 'greenDownsmash';
                    this.attackFrame = 40;
                    // root in place
                    this.vx *= 0.05;
                    this.vy = 0;
                } else {
                    // neutral forward-like default fallback
                    type = 'greenFsmash';
                    this.attackFrame = 34;
                    this.vx += this.dir * 2.5;
                }
            } else if (this.data && this.data.id === 'blue') {
                // BLUE CIRCLE unique smash set:
                // Blue forward: swift piercing wave that is narrower but very fast
                if (Math.abs(input.x) > 0.5) {
                    type = 'blueFsmash';
                    this.attackFrame = 30;
                    // small lunge forward
                    this.vx += this.dir * 3;
                }
                // Blue up: elegant rising bubble column that lifts enemies gently but combos well
                else if (input.y < -0.5) {
                    type = 'blueUpsmash';
                    this.attackFrame = 36;
                    // slight flutter upward
                    this.vy = -5;
                }
                // Blue down: spinning watery stomp that knocks downwards and pulls slightly inward
                else if (input.y > 0.5) {
                    type = 'blueDownsmash';
                    this.attackFrame = 38;
                    // root and create a small downward push
                    this.vx *= 0.2;
                    this.vy = 0;
                } else {
                    // default to blue forward if neutral
                    type = 'blueFsmash';
                    this.attackFrame = 30;
                    this.vx += this.dir * 3;
                }
            } else {
                if (input.y < -0.5) {
                    type = 'upsmash';
                    this.attackFrame = 30;
                } else if (input.y > 0.5) {
                    type = 'downsmash';
                    this.attackFrame = 30;
                } else {
                    type = 'smash';
                    this.attackFrame = 30;
                }
            }
        } else if (input.special) {
            // Mario-specific up-special that jumps and deals a coin-hit if contacting an opponent
            if (isMario && input.y < -0.5) {
                type = 'marioUpSpecial';
                this.attackFrame = 36;
                // stronger launch for Mario's up-special
                this.vy = -14;
                // allow a short horizontal drift control
                this.vx += this.dir * 0.5;
            } else if (isMario && input.y > 0.5) {
                // K + Down for Mario: spinning burst that deals multi-hit during spin and a final burst
                type = 'marioSpinBurst';
                this.attackFrame = 42;
                // root in place and create a slight downward anchor
                this.vx = 0;
                this.vy = 0;
            } else if (isMario && Math.abs(input.x) > 0.5) {
                // K + Left/Right for Mario: pull-the-blanket special — creates a short-range hitbox that flips the opponent and pulls them toward Mario
                type = 'marioBlanket';
                this.attackFrame = 34;
                // small startup recoil
                this.vx += -this.dir * 1.2;
            } else if (this.data && this.data.id === 'red') {
                // RED SQUARE unique specials:
                // Forward special: quick charging dash with a piercing beam
                if (Math.abs(input.x) > 0.5) {
                    type = 'redSideSpecial';
                    this.attackFrame = 34;
                    this.vx += this.dir * 6; // lunge forward
                }
                // Up special: upward rising staggered shards that juggle
                else if (input.y < -0.5) {
                    type = 'redUpSpecial';
                    this.attackFrame = 40;
                    this.vy = -10;
                }
                // Down special: ground slam that creates short-range explosive shards
                else if (input.y > 0.5) {
                    type = 'redDownSpecial';
                    this.attackFrame = 42;
                    this.vx *= 0.2;
                    this.vy = 0;
                } else {
                    // neutral special: small grounded blade burst
                    type = 'neutralSpecial';
                    this.attackFrame = 35;
                }
            } else if (this.data && this.data.id === 'blue') {
                // BLUE CIRCLE unique specials:
                // Forward special: swift rolling dash that leaves an aqua trail
                if (Math.abs(input.x) > 0.5) {
                    type = 'blueSideSpecial';
                    this.attackFrame = 32;
                    this.vx += this.dir * 7; // quick lunge / roll
                }
                // Up special: buoyant bubble lift that spawns small bubble projectiles while rising
                else if (input.y < -0.5) {
                    type = 'blueUpSpecial';
                    this.attackFrame = 42;
                    this.vy = -11;
                }
                // Down special: watery stomp that creates a suction ripple pulling nearby foes inward
                else if (input.y > 0.5) {
                    type = 'blueDownSpecial';
                    this.attackFrame = 40;
                    this.vx *= 0.1;
                    this.vy = 0;
                } else {
                    // neutral special: bubble orb that briefly expands and knocks opponents back gently
                    type = 'blueNeutralSpecial';
                    this.attackFrame = 36;
                }
            } else if (this.data && this.data.id === 'gold') {
                // GOLD STAR unique specials:
                // Forward special: comet dash — short forward blitz that leaves trailing shards and pierces slightly
                if (Math.abs(input.x) > 0.5) {
                    type = 'goldSideSpecial';
                    this.attackFrame = 34;
                    // quick forward dash impulse
                    this.vx += this.dir * 8;
                }
                // Up special: vertical star lift — launches upward creating a vertical lance of sparkles that slightly homes outward
                else if (input.y < -0.5) {
                    type = 'goldUpSpecial';
                    this.attackFrame = 44;
                    this.vy = -13;
                    // small lateral nudge to give diagonal arc feel
                    this.vx += this.dir * 0.6;
                }
                // Down special: glittering ground burst — pulls nearby foes in briefly then explodes outward with shards
                else if (input.y > 0.5) {
                    type = 'goldDownSpecial';
                    this.attackFrame = 46;
                    // root in place for the charged burst
                    this.vx *= 0.05;
                    this.vy = 0;
                } else {
                    // fallback neutral special: small star-shot
                    type = 'goldNeutralSpecial';
                    this.attackFrame = 36;
                }
            } else if (input.y < -0.5) {
                type = 'upSpecial';
                this.vy = -12; // Recovery lift
                this.attackFrame = 40;
            } else if (input.y > 0.5) {
                type = 'downSpecial';
                this.attackFrame = 30;
            } else if (Math.abs(input.x) > 0.5) {
                type = 'sideSpecial';
                this.vx = this.dir * 10; // Side dash
                this.attackFrame = 30;
            } else {
                type = 'neutralSpecial';
                this.attackFrame = 35;
            }
        } else if (input.y < -0.5) {
            type = 'uptilt';
        } else if (Math.abs(input.x) > 0.7) {
            type = 'smash';
            this.attackFrame = 30;
        }

        this.currentAttack = type;
    }

    doUltimate() {
        if (!this.hasSmashBall || this.state === 'ultimate' || this.hitstun > 0) return;
        // Consume smash ball and enter ultimate state
        this.hasSmashBall = false;
        this.smashAuraTimer = 0;
        this.state = 'ultimate';
        this.ultimateFrame = 150; // duration counter used for visuals/timing

        const game = window.game;

        // Green Leaf unique ultimate: "Verdant Barrage" - rapid forward barrage of leaf projectiles
        if (this.data && this.data.id === 'green') {
            try { const _audio = new Audio('/recording-1768058638045.wav'); _audio.play().catch(()=>{}); } catch(e) {}

            // Create a rapid volley of leaf projectiles in a forward cone
            if (game && window.Projectile) {
                const totalLeaves = 24;
                const baseSpeed = 6;
                for (let i = 0; i < totalLeaves; i++) {
                    // spread angle in radians; favor forward facing
                    const spread = (Math.random() * 0.8) - 0.4; // -0.4 .. 0.4
                    const angle = (this.dir === 1 ? 0 : Math.PI) + spread;
                    const speed = baseSpeed + Math.random() * 3;
                    const pvx = Math.cos(angle) * speed;
                    const pvy = Math.sin(angle) * speed - (Math.random() * 1.5);
                    const sx = this.x + this.width / 2 + Math.cos(angle) * 12;
                    const sy = this.y + this.height / 2 + Math.sin(angle) * 6;
                    const pr = new window.Projectile(sx, sy, pvx, pvy, this, { r: 10, bounces: 0, dmg: 8, color: '#7be495', life: 220 });
                    game.projectiles.push(pr);
                }
            }

            // Short-lived sweeping hitbox in front to catch nearby foes (helpful for close-range)
            const sweepW = 260;
            const sweepH = 80;
            const ox = this.dir === 1 ? this.width : -sweepW;
            this.hitbox = { x: this.x + ox, y: this.y + this.height/2 - sweepH/2, w: sweepW, h: sweepH, dmg: 28, kb: 36, pull: true };

            // small forward kick-flash to emphasize the cast
            this.vx += this.dir * 1.8;
            this.vy -= 2;

            // end ultimate after a short window and clear hitbox
            setTimeout(() => {
                if (this.state === 'ultimate') {
                    this.hitbox = null;
                    this.state = 'idle';
                }
            }, 900); // ~0.9s
            return;
        }

        // Gold Star unique ultimate: "Radiant Aurora" - existing phased ultimate
        if (this.data && this.data.id === 'gold') {
            // immediate gentle chime
            try { const _audio = new Audio('/recording-1768058638045.wav'); _audio.play().catch(()=>{}); } catch(e) {}

            // Phase A: burst of radiant shards around Gold that arc outward
            if (game && window.Projectile) {
                for (let i = 0; i < 10; i++) {
                    const angle = (i / 10) * Math.PI * 2;
                    const speed = 3 + Math.random() * 2;
                    const pvx = Math.cos(angle) * speed;
                    const pvy = Math.sin(angle) * speed - 1.5;
                    const sx = this.x + this.width / 2 + Math.cos(angle) * 8;
                    const sy = this.y + this.height / 2 + Math.sin(angle) * 8;
                    const pr = new window.Projectile(sx, sy, pvx, pvy, this, { r: 10, bounces: 1, dmg: 10, color: 'gold', life: 220 });
                    game.projectiles.push(pr);
                }
            }

            // small glowing radial hitbox to push nearby foes on initial cast
            this.hitbox = { x: this.x - 48, y: this.y - 48, w: this.width + 96, h: this.height + 96, dmg: 14, kb: 24, radial: true };

            // schedule Phase B: concentrated downward light beam after a short charge
            setTimeout(() => {
                // charge sound
                try { const _audio2 = new Audio('/explode.wav'); _audio2.play().catch(()=>{}); } catch(e) {}

                // large temporary beam hitbox in front of Gold (diagonal emphasis depending on facing)
                const beamW = 260;
                const beamH = 120;
                const ox = this.dir === 1 ? this.width : -beamW;
                // set hitbox to world coords (will be processed by Physics during frames)
                this.hitbox = { x: this.x + ox, y: this.y - beamH/2 + this.height/2, w: beamW, h: beamH, dmg: 48, kb: 80, radiant: true };
                
                // create long-lived light shards raining outward from beam impact to add spectacle
                if (game && window.Projectile) {
                    for (let s = 0; s < 12; s++) {
                        const spread = (s - 6) * 0.6 + (Math.random() * 0.6 - 0.3);
                        const sx = this.x + this.width/2 + spread * 60;
                        const sy = Math.max(20, this.y - 200 + Math.random() * 80);
                        const pvx = spread * 2;
                        const pvy = 6 + Math.random() * 3;
                        const pr = new window.Projectile(sx, sy, pvx, pvy, this, { r: 14, bounces: 0, dmg: 12, color: 'rgba(255,230,140,1)', life: 260 });
                        game.projectiles.push(pr);
                    }
                }

                // remove the big beam after a short window
                setTimeout(() => {
                    if (this.state === 'ultimate') this.hitbox = null;
                }, 300);
            }, 700);

            // Give Gold a slight visual kick forward/back while charging
            this.vx += this.dir * 2;
            // End the ultimate after the full duration
            setTimeout(() => {
                if (this.state === 'ultimate') {
                    this.state = 'idle';
                    this.hitbox = null;
                }
            }, this.ultimateFrame * 16); // approximate ms
            return;
        }

        // fallback: original generic ultimate (keeps Mario behavior for others)
        try { const _audio = new Audio('/explode.wav'); _audio.play().catch(()=>{}); } catch(e) {}
        if (window && window.Projectile && game) {
            for (let i = 0; i < 5; i++) {
                const spread = (i - 2) * 0.6;
                const sx = this.x + this.width / 2 + spread * 10;
                const sy = this.y + this.height / 2;
                const pvx = spread * 4 + (this.dir * 2);
                const pvy = -10 - Math.random() * 4;
                const pr = new window.Projectile(sx, sy, pvx, pvy, this, { r: 12, bounces: 2, dmg: 8, color: 'orangered', life: 240 });
                game.projectiles.push(pr);
            }
        }

        // Small short-lived big hitbox to simulate initial impact blast
        this.hitbox = { x: this.x - 60, y: this.y - 60, w: this.width + 120, h: this.height + 120, dmg: 18, kb: 30 };

        if (game) {
            const bursts = 3;
            for (let b = 0; b < bursts; b++) {
                const delayMs = 500 + b * 300;
                setTimeout(() => {
                    try { const _audio = new Audio('/recording-1768058638045.wav'); _audio.play().catch(()=>{}); } catch(e) {}
                    const centerX = this.x + this.width / 2;
                    const count = 6;
                    for (let i = 0; i < count; i++) {
                        const offset = (i - (count-1)/2) * 40 + (Math.random() * 20 - 10);
                        const sx = Math.max(20, Math.min(game.canvas.width - 20, centerX + offset));
                        const sy = Math.max(0, this.y - 300 - (b * 40) + (Math.random() * 40 - 20));
                        const pvx = (Math.random() * 2 - 1) * 1.5;
                        const pvy = 6 + Math.random() * 3;
                        const pr = new window.Projectile(sx, sy, pvx, pvy, this, { r: 14, bounces: 0, dmg: 10 + b*2, color: 'orange', life: 200 });
                        game.projectiles.push(pr);
                    }
                }, delayMs);
            }

            setTimeout(() => {
                this.vy = 12;
                this.hitbox = { x: this.x - 80, y: this.y - 20, w: this.width + 160, h: this.height + 40, dmg: 30, kb: 36 };
                setTimeout(() => {
                    if (this.state === 'ultimate') this.hitbox = null;
                }, 200);
            }, 1200);
        }
    }

    updateAI(target) {
        if (this.isSandbag) return;
        if (this.state === 'starKO') return;

        const dx = target.x - this.x;
        const dy = target.y - this.y;

        const input = { x: 0, y: 0, jump: false, attack: false, special: false, shield: false };

        if (Math.abs(dx) > 60) {
            input.x = dx > 0 ? 0.6 : -0.6;
        } else {
            input.attack = Math.random() > 0.95;
            if (dy < -20) input.y = -1;
        }

        if (dy < -50 && this.grounded) input.jump = true;

        this.updateInput(input);
    }

    // Trigger the star KO sequence
    triggerStarKO() {
        if (this.state === 'starKO') return;
        this.state = 'starKO';
        this.starKOTimer = 90; // frames of shrinking / flying
        this.starScale = 1;
        // give a final upward burst so the fighter flies faster upward
        this.vy = Math.min(this.vy, -6);
        this.vx *= 0.2;
        // remove any active hitbox
        this.hitbox = null;
    }

    // Small per-frame update for non-physics visual effects (called from Game)
    updateState() {
        if (this.state === 'starKO') {
            // fly upward faster and shrink
            this.vy -= 0.25; // accelerate upward
            this.y += this.vy;
            this.x += this.vx * 0.6;
            // shrink smoothly
            this.starScale = Math.max(0, this.starScale - 0.01);
            this.starKOTimer--;
            if (this.starKOTimer <= 0) {
                // fully gone: mark for shining star
                this.starShineTimer = 120; // how long shining star remains
                this.starShown = true;
                // move fighter far offscreen so isDead won't trigger immediately (stocks handled elsewhere)
                this.x = -9999;
                this.y = -9999;
            }
        }
        // shining star countdown (visual only)
        if (this.starShown && this.starShineTimer > 0) {
            this.starShineTimer--;
            if (this.starShineTimer <= 0) {
                this.starShown = false;
            }
        }
    }

    isDead() {
        // Consider fully offscreen downward as death; top star KO handled via starShown and game logic
        const margin = 500;
        return (this.x < -margin || this.x > window.innerWidth + margin || this.y > window.innerHeight + margin);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Smash aura glow when holding smash ball
        if (this.hasSmashBall) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
            ctx.beginPath();
            ctx.arc(this.width/2, this.height/2, 50 + (Math.sin(Date.now()/150) * 4), 0, Math.PI*2);
            ctx.fill();
            // pulse outline
            ctx.strokeStyle = 'rgba(255,215,0,0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.width/2, this.height/2, 58, 0, Math.PI*2);
            ctx.stroke();
        }

        // Shield
        if (this.state === 'shielding') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(this.width/2, this.height/2, 35, 0, Math.PI*2);
            ctx.fill();
        }

        // Character
        ctx.fillStyle = this.color;
        const shape = this.data.shape || 'square';
        
        if (shape === 'circle') {
            ctx.beginPath();
            ctx.arc(this.width/2, this.height/2, this.width/2, 0, Math.PI*2);
            ctx.fill();
        } else if (shape === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(this.width/2, 0);
            ctx.lineTo(this.width, this.height);
            ctx.lineTo(0, this.height);
            ctx.closePath();
            ctx.fill();
        } else if (shape === 'star') {
            // Simplistic diamond/star shape
            ctx.beginPath();
            ctx.moveTo(this.width/2, -5);
            ctx.lineTo(this.width + 5, this.height/2);
            ctx.lineTo(this.width/2, this.height + 5);
            ctx.lineTo(-5, this.height/2);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(0, 0, this.width, this.height);
        }

        // Hitstun effect
        if (this.hitstun > 0) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.strokeRect(-2, -2, this.width+4, this.height+4);
        }

        // Attack visual
        if (this.state === 'attacking') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            if (this.currentAttack === 'uptilt') {
                ctx.fillRect(0, -30, this.width, 30);
                this.hitbox = { x: this.x, y: this.y - 30, w: this.width, h: 30, dmg: 5, kb: 8 };
            } else if (this.currentAttack === 'upsmash' || this.currentAttack === 'redUpsmash') {
                if (this.currentAttack === 'redUpsmash') {
                    // Red's cool up-smash: vertical flaming column with high vertical KB
                    ctx.fillStyle = 'rgba(255,140,80,0.98)';
                    const colW = 72;
                    const colH = 120;
                    const ox = this.width/2 - colW/2;
                    ctx.fillRect(ox, -colH, colW, colH);
                    // flicker highlights
                    ctx.fillStyle = 'rgba(255,220,140,0.95)';
                    for (let i=0;i<6;i++) {
                        const hx = ox + 6 + (i%2)*12;
                        const hy = -colH + i*18 + (Math.sin(Date.now()/80 + i)*6);
                        ctx.fillRect(hx, hy, 8, 14);
                    }
                    // hitbox: tall column above fighter, strong vertical KB
                    this.hitbox = { x: this.x + ox, y: this.y - colH, w: colW, h: colH, dmg: 26, kb: 36 };
                } else {
                    ctx.fillStyle = 'rgba(255, 255, 100, 0.7)';
                    ctx.fillRect(-10, -50, this.width + 20, 50);
                    this.hitbox = { x: this.x - 10, y: this.y - 50, w: this.width + 20, h: 50, dmg: 18, kb: 18 };
                }
            } else if (this.currentAttack === 'downsmash' || this.currentAttack === 'redDownsmash') {
                if (this.currentAttack === 'redDownsmash') {
                    // Red's ground stomp: shockwave rings that slam opponents outward and downward
                    const stompW = 220;
                    const stompH = 64;
                    const ox = this.width/2 - stompW/2;
                    // ground shock visual
                    ctx.fillStyle = 'rgba(255,120,100,0.95)';
                    ctx.beginPath();
                    ctx.ellipse(this.width/2, this.height + 8, stompW/2, stompH/2, 0, 0, Math.PI*2);
                    ctx.fill();
                    // radial cracks
                    ctx.strokeStyle = 'rgba(255,200,160,0.9)';
                    ctx.lineWidth = 2;
                    for (let i=0;i<8;i++) {
                        const a = i * (Math.PI*2) / 8;
                        const rx = Math.cos(a) * (stompW/2) * 0.6 + this.width/2;
                        const ry = Math.sin(a) * (stompH/2) * 0.6 + this.height + 8;
                        ctx.beginPath();
                        ctx.moveTo(this.width/2, this.height + 8);
                        ctx.lineTo(rx, ry);
                        ctx.stroke();
                    }
                    // hitbox: wide ground area with strong horizontal + downward knockback
                    this.hitbox = { x: this.x + ox, y: this.y + this.height - 10, w: stompW, h: stompH, dmg: 30, kb: 42 };
                } else {
                    ctx.fillStyle = 'rgba(255, 255, 100, 0.7)';
                    ctx.fillRect(-50, this.height - 10, this.width + 100, 20);
                    this.hitbox = { x: this.x - 50, y: this.y + this.height - 10, w: this.width + 100, h: 20, dmg: 16, kb: 14 };
                }
            } else if (this.currentAttack === 'redFsmash') {
                // Red Square's powerful forward smash: flashy horizontal burst with strong KB
                const beamW = 160;
                const beamH = 48;
                const ox = this.dir === 1 ? this.width : -beamW;
                // glowing core beam
                ctx.fillStyle = 'rgba(255,80,80,0.95)';
                ctx.fillRect(ox, this.height/2 - beamH/2, beamW, beamH);
                // intense highlight strip
                ctx.fillStyle = 'rgba(255,200,150,0.95)';
                ctx.fillRect(ox + (this.dir === 1 ? 18 : 18), this.height/2 - (beamH/2 - 6), beamW - 36, beamH - 12);
                // trailing sparks
                ctx.fillStyle = 'rgba(255,140,140,0.9)';
                for (let i = 0; i < 6; i++) {
                    const sx = (this.dir === 1) ? ox + beamW - i * 18 : ox + i * 18;
                    const sy = (this.height/2) + (Math.sin((Date.now()/120) + i) * 6);
                    ctx.fillRect(sx, sy, 6, 6);
                }
                // hitbox bigger and stronger than normal smash
                this.hitbox = { x: this.x + ox, y: this.y + this.height/2 - beamH/2, w: beamW, h: beamH, dmg: 28, kb: 36 };
            } else if (this.currentAttack === 'greenBarrage') {
                // Green Leaf forward barrage: rapid multi-kick sequence that spawns several short staggered hitboxes
                const totalFrames = 44;
                const progress = 1 - Math.max(0, this.attackFrame) / totalFrames; // 0 -> 1 over the attack
                const hits = 6; // number of staggered hits across the sequence
                const hitIndex = Math.floor(progress * hits);
                const kickW = 34;
                const kickH = 28;
                // draw a motion streak for the barrage
                const trailW = 200;
                const trailOx = this.dir === 1 ? this.width : -trailW;
                ctx.fillStyle = 'rgba(80,200,120,0.12)';
                ctx.fillRect(trailOx, this.height/2 - 28, trailW, 56);
                // draw individual kicks along the forward arc
                for (let k = 0; k < hits; k++) {
                    const t = k / hits;
                    const px = (this.dir === 1)
                        ? (this.width + t * (trailW - 20) - (progress * 20))
                        : (-t * (trailW - 20) - (progress * 20) - kickW);
                    const py = this.height/2 - 10 + Math.sin((Date.now()/100) + k) * 6;
                    const alpha = k <= hitIndex ? 0.95 : 0.35;
                    ctx.fillStyle = `rgba(110,230,150,${alpha})`;
                    ctx.fillRect(px, py, kickW, kickH);
                }
                // active hitbox corresponds to the current hit in the barrage (short, repeated)
                const activeT = hitIndex / hits;
                const hbOffset = Math.floor(activeT * (trailW - kickW));
                const hbX = this.dir === 1 ? this.x + this.width + hbOffset : this.x - hbOffset - kickW;
                const hbY = this.y + this.height/2 - 14;
                // small per-hit damage but multi-hit totals high; apply pull to keep unique green behavior
                this.hitbox = { x: hbX, y: hbY, w: kickW, h: kickH, dmg: 6, kb: 12, pull: true };
            } else if (this.currentAttack === 'greenFsmash') {
                // Green Leaf forward: swift leafy slash with vine-like reach and subtle tug
                const beamW = 130;
                const beamH = 40;
                const ox = this.dir === 1 ? this.width : -beamW;
                // leafy swipe
                ctx.fillStyle = 'rgba(80,200,120,0.95)';
                ctx.fillRect(ox, this.height/2 - beamH/2, beamW, beamH);
                // leaf veins/highlights
                ctx.fillStyle = 'rgba(160,255,180,0.95)';
                for (let i = 0; i < 6; i++) {
                    const sx = (this.dir === 1) ? ox + i * (beamW / 6) : ox + beamW - i * (beamW / 6);
                    const sy = this.height/2 + Math.sin((Date.now()/110) + i) * 4;
                    ctx.fillRect(sx, sy, 6, 4);
                }
                // vine tug visual (subtle curve)
                ctx.strokeStyle = 'rgba(60,160,90,0.9)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.width/2 + (this.dir===1?20:-20), this.height/2 - 6);
                ctx.quadraticCurveTo(this.width/2 + (this.dir===1?60:-60), this.height/2 - 20, this.width/2 + (this.dir===1?beamW-12:-(beamW-12)), this.height/2 + 4);
                ctx.stroke();
                // hitbox: elongated with modest damage and slight pull effect
                this.hitbox = { x: this.x + ox, y: this.y + this.height/2 - beamH/2, w: beamW, h: beamH, dmg: 24, kb: 34, pull: true };
            } else if (this.currentAttack === 'greenUpsmash') {
                // Green up smash: leafy lance rising with upward launch and a soft lateral drift
                const colW = 64;
                const colH = 140;
                const ox = this.width/2 - colW/2 + (this.dir === 1 ? 6 : -6);
                ctx.fillStyle = 'rgba(90,220,140,0.95)';
                ctx.fillRect(ox, -colH, colW, colH);
                // drifting leaf particles
                ctx.fillStyle = 'rgba(200,255,200,0.95)';
                for (let i=0;i<6;i++) {
                    const bx = ox + 6 + (i%2)*10;
                    const by = -colH + 10 + i * 20 + Math.sin(Date.now()/120 + i)*6;
                    ctx.beginPath();
                    ctx.ellipse(bx, by, 6, 4, 0, 0, Math.PI*2);
                    ctx.fill();
                }
                // hitbox: tall lance with stronger upward kb and slight lateral component
                this.hitbox = { x: this.x + ox, y: this.y - colH, w: colW, h: colH, dmg: 26, kb: 36, lateral: this.dir * 0.25 };
            } else if (this.currentAttack === 'greenDownsmash') {
                // Green down smash: grounded leafy whirl that pulls in then bursts outward with seed shards
                const stompW = 210;
                const stompH = 68;
                const ox = this.width/2 - stompW/2;
                // inward leafy swirl
                ctx.fillStyle = 'rgba(100,230,140,0.94)';
                ctx.beginPath();
                ctx.ellipse(this.width/2, this.height + 6, stompW/2, stompH/2, 0, 0, Math.PI*2);
                ctx.fill();
                // seed shard bloom
                ctx.fillStyle = 'rgba(180,245,170,0.95)';
                for (let i=0;i<10;i++) {
                    const angle = i * (Math.PI*2) / 10;
                    const rx = this.width/2 + Math.cos(angle) * (stompW/3) + (Math.random()*14-7);
                    const ry = this.height + 6 + Math.sin(angle) * (stompH/3) + (Math.random()*10-5);
                    ctx.fillRect(rx - 4, ry - 4, 8, 8);
                }
                // hitbox: wide area with initial pull behavior then strong outward knockback
                this.hitbox = { x: this.x + ox, y: this.y + this.height - 10, w: stompW, h: stompH, dmg: 30, kb: 40, pull: true, burst: true };
            } else if (this.currentAttack === 'goldFsmash') {
                // Gold Star forward: radiant comet slash with trail shards and diagonal launch emphasis
                const beamW = 150;
                const beamH = 44;
                const ox = this.dir === 1 ? this.width : -beamW;
                // golden beam
                ctx.fillStyle = 'rgba(255,215,120,0.98)';
                ctx.fillRect(ox, this.height/2 - beamH/2, beamW, beamH);
                // sparkling trail
                ctx.fillStyle = 'rgba(255,240,180,0.95)';
                for (let i = 0; i < 8; i++) {
                    const sx = (this.dir === 1) ? ox + i * (beamW / 8) : ox + beamW - i * (beamW / 8);
                    const sy = this.height/2 + Math.sin((Date.now()/100) + i) * 6;
                    ctx.fillRect(sx, sy, 6, 6);
                }
                // diagonal accent
                ctx.strokeStyle = 'rgba(255,200,100,0.9)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(ox + (this.dir === 1 ? 12 : beamW - 12), this.height/2 - 8);
                ctx.lineTo(ox + (this.dir === 1 ? beamW - 12 : 12), this.height/2 + 8);
                ctx.stroke();
                // hitbox: long reach with slightly increased diagonal knockback
                this.hitbox = { x: this.x + ox, y: this.y + this.height/2 - beamH/2, w: beamW, h: beamH, dmg: 26, kb: 38, diagonal: true };
            } else if (this.currentAttack === 'goldUpsmash') {
                // Gold up smash: star lance rising diagonally, strong vertical component and a sparkle column
                const colW = 68;
                const colH = 140;
                const ox = this.width/2 - colW/2 + (this.dir === 1 ? 8 : -8);
                // lance glow
                ctx.fillStyle = 'rgba(255,235,150,0.96)';
                ctx.fillRect(ox, -colH, colW, colH);
                // sparkle particles
                ctx.fillStyle = 'rgba(255,250,210,0.95)';
                for (let i=0;i<7;i++) {
                    const bx = ox + 8 + (i%2)*10;
                    const by = -colH + 8 + i * 18 + Math.sin(Date.now()/110 + i)*6;
                    ctx.beginPath();
                    ctx.arc(bx, by, 5, 0, Math.PI*2);
                    ctx.fill();
                }
                // hitbox: tall lance with stronger upward kb and slight lateral component
                this.hitbox = { x: this.x + ox, y: this.y - colH, w: colW, h: colH, dmg: 30, kb: 42, lateral: this.dir * 0.3 };
            } else if (this.currentAttack === 'goldDownsmash') {
                // Gold down smash: gathers foes inward with glitter pull then explodes outward with shards
                const stompW = 220;
                const stompH = 64;
                const ox = this.width/2 - stompW/2;
                // inward shimmer
                ctx.fillStyle = 'rgba(255,220,140,0.95)';
                ctx.beginPath();
                ctx.ellipse(this.width/2, this.height + 6, stompW/2, stompH/2, 0, 0, Math.PI*2);
                ctx.fill();
                // outward shard burst
                ctx.fillStyle = 'rgba(255,245,200,0.95)';
                for (let i=0;i<10;i++) {
                    const angle = i * (Math.PI*2) / 10;
                    const rx = this.width/2 + Math.cos(angle) * (stompW/3) + (Math.random()*12-6);
                    const ry = this.height + 6 + Math.sin(angle) * (stompH/3) + (Math.random()*8-4);
                    ctx.fillRect(rx - 5, ry - 5, 10, 10);
                }
                // hitbox: wide area with pull flag and then heavy outward KB on hit
                this.hitbox = { x: this.x + ox, y: this.y + this.height - 10, w: stompW, h: stompH, dmg: 34, kb: 48, pull: true, burst: true };
            } else if (this.currentAttack === 'goldSideSpecial') {
                // Gold forward special: comet dash visual with trailing shards and a piercing narrow hitbox
                const beamW = 160;
                const beamH = 36;
                const ox = this.dir === 1 ? this.width : -beamW;
                // main comet trail
                ctx.fillStyle = 'rgba(255,220,120,0.96)';
                ctx.fillRect(ox, this.height/2 - beamH/2, beamW, beamH);
                // sparkling shards trailing behind
                ctx.fillStyle = 'rgba(255,245,180,0.95)';
                for (let i=0;i<6;i++) {
                    const sx = (this.dir === 1) ? ox - i*20 + 8 : ox + beamW + i*20 - 8;
                    const sy = this.height/2 + Math.sin(Date.now()/100 + i) * 6 + (i%2?6:-6);
                    ctx.fillRect(sx, sy, 10, 6);
                }
                // piercing narrow hitbox with decent KB
                this.hitbox = { x: this.x + ox, y: this.y + this.height/2 - beamH/2, w: beamW, h: beamH, dmg: 22, kb: 34, pierce: true };
            } else if (this.currentAttack === 'goldUpSpecial') {
                // Gold up special: star lance rising diagonally with sparkle particles and strong upward KB
                const colW = 72;
                const colH = 160;
                const ox = this.width/2 - colW/2 + (this.dir === 1 ? 8 : -8);
                ctx.fillStyle = 'rgba(255,235,150,0.98)';
                ctx.fillRect(ox, -colH, colW, colH);
                // starry sparkle particles
                ctx.fillStyle = 'rgba(255,250,210,0.96)';
                for (let i=0;i<8;i++) {
                    const bx = ox + 6 + (i%3)*10;
                    const by = -colH + 8 + i * 18 + Math.sin(Date.now()/110 + i)*6;
                    ctx.beginPath();
                    ctx.arc(bx, by, 5, 0, Math.PI*2);
                    ctx.fill();
                }
                // hitbox: tall lance with strong upward KB and slight lateral component
                this.hitbox = { x: this.x + ox, y: this.y - colH, w: colW, h: colH, dmg: 28, kb: 44, lateral: this.dir * 0.4 };
            } else if (this.currentAttack === 'goldDownSpecial') {
                // Gold down special: glitter pull then explosive shard bloom with heavy outward KB
                const stompW = 220;
                const stompH = 80;
                const ox = this.width/2 - stompW/2;
                // warming shimmer
                ctx.fillStyle = 'rgba(255,235,160,0.95)';
                ctx.beginPath();
                ctx.ellipse(this.width/2, this.height + 8, stompW/2, stompH/2, 0, 0, Math.PI*2);
                ctx.fill();
                // bloom shards
                ctx.fillStyle = 'rgba(255,245,200,0.98)';
                for (let i=0;i<12;i++) {
                    const angle = i * (Math.PI*2) / 12;
                    const rx = this.width/2 + Math.cos(angle) * (stompW/3) + (Math.random()*18-9);
                    const ry = this.height + 8 + Math.sin(angle) * (stompH/3) + (Math.random()*12-6);
                    ctx.fillRect(rx - 6, ry - 6, 12, 12);
                }
                // hitbox: strong area with pull flag (initial) and then heavy outward knockback on hit
                this.hitbox = { x: this.x + ox, y: this.y + this.height - 10, w: stompW, h: stompH, dmg: 36, kb: 52, pull: true, burst: true };
            } else if (this.currentAttack === 'blueFsmash') {
                // Blue Circle's forward smash: a fast piercing aqua wave with a narrow high-speed hit
                const waveW = 120;
                const waveH = 32;
                const ox = this.dir === 1 ? this.width : -waveW;
                // core wave
                ctx.fillStyle = 'rgba(80,160,255,0.95)';
                ctx.fillRect(ox, this.height/2 - waveH/2, waveW, waveH);
                // inner sheen
                ctx.fillStyle = 'rgba(180,230,255,0.95)';
                ctx.fillRect(ox + (this.dir===1?12:12), this.height/2 - (waveH/2 - 4), waveW - 24, waveH - 8);
                // subtle motion streaks
                ctx.fillStyle = 'rgba(140,200,255,0.9)';
                for (let i = 0; i < 5; i++) {
                    const sx = (this.dir === 1) ? ox + waveW - i * 20 : ox + i * 20;
                    const sy = this.height/2 + (Math.sin((Date.now()/150) + i) * 4);
                    ctx.fillRect(sx, sy, 4, 8);
                }
                // narrow, fast hitbox
                this.hitbox = { x: this.x + ox, y: this.y + this.height/2 - waveH/2, w: waveW, h: waveH, dmg: 22, kb: 30 };
            } else if (this.currentAttack === 'blueUpsmash') {
                // Blue's up smash: ascending bubble column that lifts opponents gently (good for follow-ups)
                const colW = 64;
                const colH = 110;
                const ox = this.width/2 - colW/2;
                // translucent bubbling column
                ctx.fillStyle = 'rgba(100,190,255,0.85)';
                ctx.beginPath();
                ctx.rect(ox, -colH, colW, colH);
                ctx.fill();
                // draw some bubbles
                ctx.fillStyle = 'rgba(220,250,255,0.9)';
                for (let i=0;i<6;i++) {
                    const bx = ox + 8 + (i%2)*12;
                    const by = -colH + 12 + i * 16 + Math.sin(Date.now()/140 + i) * 6;
                    ctx.beginPath();
                    ctx.arc(bx, by, 6, 0, Math.PI*2);
                    ctx.fill();
                }
                // hitbox: tall gentle lift, moderate KB
                this.hitbox = { x: this.x + ox, y: this.y - colH, w: colW, h: colH, dmg: 20, kb: 18 };
            } else if (this.currentAttack === 'blueDownsmash') {
                // Blue's down smash: a watery spin stomp that pulls a bit inward and slams downward
                const stompW = 180;
                const stompH = 56;
                const ox = this.width/2 - stompW/2;
                // watery ripple
                ctx.fillStyle = 'rgba(80,170,230,0.9)';
                ctx.beginPath();
                ctx.ellipse(this.width/2, this.height + 6, stompW/2, stompH/2, 0, 0, Math.PI*2);
                ctx.fill();
                // inward swirl lines
                ctx.strokeStyle = 'rgba(180,230,255,0.95)';
                ctx.lineWidth = 2;
                for (let i=0;i<6;i++) {
                    ctx.beginPath();
                    ctx.arc(this.width/2, this.height + 6, 20 + i*18, 0, Math.PI*2);
                    ctx.stroke();
                }
                // hitbox: wide ground area with downward bias and slight inward pull (pull handled via kb orientation)
                this.hitbox = { x: this.x + ox, y: this.y + this.height - 10, w: stompW, h: stompH, dmg: 26, kb: 38, pull: true };
            } else if (this.currentAttack === 'smash') {
                const sx = this.dir === 1 ? this.width : -40;
                ctx.fillRect(sx, 0, 40, this.height);
                this.hitbox = { x: this.x + sx, y: this.y, w: 40, h: this.height, dmg: 15, kb: 15 };
            } else if (this.currentAttack === 'upSpecial') {
                ctx.fillStyle = 'rgba(0, 200, 255, 0.8)';
                ctx.fillRect(-10, -20, this.width + 20, this.height + 20);
                this.hitbox = { x: this.x - 10, y: this.y - 20, w: this.width + 20, h: this.height + 20, dmg: 7, kb: 10 };
            } else if (this.currentAttack === 'sideSpecial') {
                ctx.fillStyle = 'rgba(0, 255, 200, 0.8)';
                const sx = this.dir === 1 ? this.width : -30;
                ctx.fillRect(sx, 5, 30, this.height - 10);
                this.hitbox = { x: this.x + sx, y: this.y + 5, w: 30, h: this.height - 10, dmg: 9, kb: 11 };
            } else if (this.currentAttack === 'downSpecial') {
                ctx.fillStyle = 'rgba(150, 0, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(this.width/2, this.height/2, 45, 0, Math.PI * 2);
                ctx.fill();
                this.hitbox = { x: this.x - 25, y: this.y - 25, w: 90, h: 90, dmg: 10, kb: 13 };
            } else if (this.currentAttack === 'neutralSpecial') {
                // Mario neutral special -> bouncing fireball projectile; otherwise behave as normal neutral special
                const isMario = this.data && this.data.id === 'mario';
                if (isMario) {
                    // spawn a bouncing fireball projectile from the fighter's front
                    try {
                        const sx = this.dir === 1 ? this.x + this.width + 8 : this.x - 8;
                        const sy = this.y + this.height / 2;
                        const pvx = this.dir * 6;
                        const pvy = -2;
                        // Create projectile via global Projectile class exposed by main.js
                        if (window && window.Projectile && window.game) {
                            const pr = new window.Projectile(sx, sy, pvx, pvy, this, { r: 12, bounces: 3, dmg: 14, color: 'orangered' });
                            window.game.projectiles.push(pr);
                            try { const _audio2 = new Audio('/recording-1768058638045.wav'); _audio2.play().catch(()=>{}); } catch(e) {}
                        }
                    } catch(e){}
                    // visual cue on the fighter for firing
                    ctx.fillStyle = 'rgba(255,180,120,0.95)';
                    const sxVis = this.dir === 1 ? this.width : -20;
                    ctx.fillRect(sxVis, 10, 18, 18);
                    // Mario's projectile handled separately; no persistent local hitbox
                    this.hitbox = null;
                } else {
                    ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
                    ctx.beginPath();
                    const sx = this.dir === 1 ? 60 : -20;
                    ctx.arc(sx, 20, 30, 0, Math.PI * 2);
                    ctx.fill();
                    this.hitbox = { x: this.x + (this.dir === 1 ? 30 : -30), y: this.y - 10, w: 60, h: 60, dmg: 8, kb: 12 };
                }
            } else if (this.currentAttack === 'marioBlast') {
                // Mario's horizontal smash blast: a fast projectile-like hitbox in facing direction
                const blastW = 100;
                const blastH = 36;
                const offsetX = this.dir === 1 ? this.width : -blastW;
                // visual beam
                ctx.fillStyle = 'rgba(255,120,120,0.95)';
                ctx.fillRect(offsetX, this.height/2 - blastH/2, blastW, blastH);
                // bright core
                ctx.fillStyle = 'rgba(255,220,180,0.9)';
                ctx.fillRect(offsetX + (this.dir===1?10:10), this.height/2 - (blastH/2 - 4), blastW - 20, blastH - 8);
                this.hitbox = { x: this.x + offsetX, y: this.y + this.height/2 - blastH/2, w: blastW, h: blastH, dmg: 20, kb: 22 };
            } else if (this.currentAttack === 'marioUp') {
                // Mario head-and-arm strike: place a tall, slightly forward hitbox above the fighter
                ctx.fillStyle = 'rgba(255,140,80,0.95)';
                // head (upper) flash
                const upW = 54;
                const upH = 64;
                const offsetX = this.dir === 1 ? this.width/2 : -upW + this.width/2;
                // draw a sweeping arm/shoulder rectangle and a head circle
                ctx.fillRect(offsetX, -upH + 10, upW, upH);
                ctx.fillStyle = 'rgba(255,220,180,0.95)';
                ctx.beginPath();
                ctx.arc(offsetX + upW/2, -upH + 6, 10, 0, Math.PI*2);
                ctx.fill();
                // hitbox extends upward and slightly forward in facing direction
                const hbX = this.x + (this.dir === 1 ? this.width/2 : -upW + this.width/2);
                const hbY = this.y - upH + 10;
                this.hitbox = { x: hbX, y: hbY, w: upW, h: upH, dmg: 22, kb: 20 };
            } else if (this.currentAttack === 'marioBreak') {
                // Mario breakdance: spinning multi-hit around Mario's feet that still damages opponents
                // Visual: rotating bars/discs; Hitbox: a circular-ish multisector approximated with a box covering the ground area
                ctx.save();
                // spinning visual relative to fighter
                const t = (Date.now() / 60) % 360;
                ctx.translate(this.width/2, this.height/2);
                ctx.rotate(t * Math.PI / 180);
                // draw multiple small rectangles around center to simulate breakdance spins
                ctx.fillStyle = 'rgba(255,100,100,0.95)';
                for (let i=0;i<6;i++) {
                    const a = i * (Math.PI * 2) / 6;
                    const rx = Math.cos(a) * 22;
                    const ry = Math.sin(a) * 14 + 6;
                    ctx.fillRect(rx - 6, ry - 6, 12, 12);
                }
                ctx.restore();
                // set a broad ground-level hitbox so opponents near Mario get hit while he spins
                const hbW = 120;
                const hbH = 48;
                const hbX = this.x + this.width/2 - hbW/2;
                const hbY = this.y + this.height - (hbH/2);
                // moderate damage but multi-hit feel (we keep dmg per frame)
                this.hitbox = { x: hbX, y: hbY, w: hbW, h: hbH, dmg: 6, kb: 14 };
            } else if (this.currentAttack === 'marioSpinBurst') {
                // Mario spinning burst: sustained spinning frames with a final burst on the last frames
                // Visual: fast rotating glow and radial lines
                ctx.save();
                const tt = Date.now() / 40;
                ctx.translate(this.width/2, this.height/2);
                ctx.rotate(tt % (Math.PI*2));
                // core spinning ring
                ctx.fillStyle = 'rgba(255,120,80,0.9)';
                for (let i=0;i<8;i++) {
                    const a = i * (Math.PI*2) / 8;
                    const rx = Math.cos(a) * (18 + Math.sin(tt/4)*4);
                    const ry = Math.sin(a) * (10 + Math.cos(tt/6)*3);
                    ctx.fillRect(rx - 6, ry - 6, 12, 12);
                }
                ctx.restore();
                // While spinning, apply a circular hitbox around Mario for multi-hit frames
                const radius = 64;
                const hbXc = this.x + this.width/2 - radius;
                const hbYc = this.y + this.height/2 - radius;
                // moderate per-frame spin damage
                this.hitbox = { x: hbXc, y: hbYc, w: radius*2, h: radius*2, dmg: 8, kb: 16 };
                
                // On the final 6 frames, create a big burst effect (stronger damage & knockback)
                if (this.attackFrame <= 6) {
                    // enlarge hitbox/damage for final burst
                    const burstR = 110;
                    this.hitbox = { x: this.x + this.width/2 - burstR, y: this.y + this.height/2 - burstR, w: burstR*2, h: burstR*2, dmg: 28, kb: 32 };
                    // one-time sound attempt (will trigger repeatedly on those final frames but it's fine)
                    try { const _audio = new Audio('/explode.wav'); _audio.play().catch(()=>{}); } catch(e) {}
                    // tiny visual radial lines for the burst
                    ctx.save();
                    ctx.translate(this.x + this.width/2, this.y + this.height/2);
                    ctx.strokeStyle = 'rgba(255,200,120,0.95)';
                    ctx.lineWidth = 3;
                    for (let i=0;i<12;i++) {
                        const a = i * (Math.PI*2) / 12;
                        ctx.beginPath();
                        ctx.moveTo(Math.cos(a) * 40, Math.sin(a) * 40);
                        ctx.lineTo(Math.cos(a) * (80 + (6 - this.attackFrame) * 6), Math.sin(a) * (80 + (6 - this.attackFrame) * 6));
                        ctx.stroke();
                    }
                    ctx.restore();
                }
            } else if (this.currentAttack === 'marioBlanket') {
                // Mario's blanket pull: short-range frontal hit that flips opponent facing and tugs them toward Mario
                ctx.save();
                ctx.fillStyle = 'rgba(200,120,255,0.95)';
                const bw = 80;
                const bh = 34;
                const ox = this.dir === 1 ? this.width : -bw;
                // draw blanket visual as a stretched rectangle with a small handle
                ctx.fillRect(ox, this.height/2 - bh/2, bw, bh);
                ctx.fillStyle = 'rgba(150,100,200,0.95)';
                ctx.fillRect(ox + (this.dir===1?bw-8:0), this.height/2 - 6, 8, 12);
                ctx.restore();
                // hitbox includes special flags processed by Physics.applyHit: reverseDir flips facing, pull tugs victim toward Mario
                this.hitbox = { x: this.x + ox, y: this.y + this.height/2 - bh/2, w: bw, h: bh, dmg: 8, kb: 12, reverseDir: true, pull: true };
            } else if (this.currentAttack === 'redSideSpecial') {
                // Red forward special: piercing dash with a long, narrow beam
                const beamW = 180;
                const beamH = 28;
                const ox = this.dir === 1 ? this.width : -beamW;
                ctx.fillStyle = 'rgba(255,110,90,0.98)';
                ctx.fillRect(ox, this.height/2 - beamH/2, beamW, beamH);
                ctx.fillStyle = 'rgba(255,200,160,0.95)';
                ctx.fillRect(ox + (this.dir===1?12:12), this.height/2 - (beamH/2 - 4), beamW - 24, beamH - 8);
                // thin piercing hitbox; high KB when hits
                this.hitbox = { x: this.x + ox, y: this.y + this.height/2 - beamH/2, w: beamW, h: beamH, dmg: 20, kb: 34, pierce: true };
            } else if (this.currentAttack === 'redUpSpecial') {
                // Red up special: rising shard column that sends opponents upward in a juggle-friendly way
                const colW = 64;
                const colH = 130;
                const ox = this.width/2 - colW/2;
                ctx.fillStyle = 'rgba(255,140,110,0.96)';
                ctx.fillRect(ox, -colH, colW, colH);
                // shard accents
                ctx.fillStyle = 'rgba(255,220,200,0.95)';
                for (let i=0;i<5;i++) {
                    const sx = ox + 8 + (i%2)*10;
                    const sy = -colH + 18 + i*20 + Math.sin(Date.now()/90 + i)*6;
                    ctx.fillRect(sx, sy, 8, 18);
                }
                this.hitbox = { x: this.x + ox, y: this.y - colH, w: colW, h: colH, dmg: 22, kb: 30 };
            } else if (this.currentAttack === 'redDownSpecial') {
                // Red down special: ground slam that fractures into explosive shards around the impact zone
                const stompW = 200;
                const stompH = 64;
                const ox = this.width/2 - stompW/2;
                ctx.fillStyle = 'rgba(255,100,80,0.95)';
                ctx.beginPath();
                ctx.ellipse(this.width/2, this.height + 8, stompW/2, stompH/2, 0, 0, Math.PI*2);
                ctx.fill();
                // shard explosions
                ctx.fillStyle = 'rgba(255,220,160,0.95)';
                for (let i=0;i<8;i++) {
                    const rx = this.width/2 + (Math.random()*stompW - stompW/2) * 0.6;
                    const ry = this.height + 8 + (Math.random()*stompH - stompH/2) * 0.6;
                    ctx.fillRect(rx - 6, ry - 6, 12, 12);
                }
                // hitbox: wide ground area with heavy knockback and downward emphasis
                this.hitbox = { x: this.x + ox, y: this.y + this.height - 10, w: stompW, h: stompH, dmg: 34, kb: 46 };
            } else if (this.currentAttack === 'blueSideSpecial') {
                // Blue side special: quick rolling dash with an aqua trail and a narrow fast hit
                const beamW = 140;
                const beamH = 30;
                const ox = this.dir === 1 ? this.width : -beamW;
                ctx.fillStyle = 'rgba(60,170,255,0.95)';
                ctx.fillRect(ox, this.height/2 - beamH/2, beamW, beamH);
                // trailing bubbles
                ctx.fillStyle = 'rgba(180,230,255,0.95)';
                for (let i=0;i<6;i++) {
                    const bx = (this.dir === 1) ? ox + i * 18 : ox + beamW - i * 18;
                    const by = this.height/2 + Math.sin(Date.now()/80 + i) * 6;
                    ctx.beginPath();
                    ctx.arc(bx, by, 6, 0, Math.PI*2);
                    ctx.fill();
                }
                this.hitbox = { x: this.x + ox, y: this.y + this.height/2 - beamH/2, w: beamW, h: beamH, dmg: 18, kb: 30, pierce: false };
            } else if (this.currentAttack === 'blueUpSpecial') {
                // Blue up special: buoyant bubble column that lifts and emits small bubbles (gentle juggle)
                const colW = 72;
                const colH = 140;
                const ox = this.width/2 - colW/2;
                ctx.fillStyle = 'rgba(100,190,255,0.9)';
                ctx.fillRect(ox, -colH, colW, colH);
                // bubble particles
                ctx.fillStyle = 'rgba(220,250,255,0.95)';
                for (let i=0;i<8;i++) {
                    const bx = ox + 8 + (i%2)*10;
                    const by = -colH + 10 + i * 16 + Math.sin(Date.now()/120 + i) * 6;
                    ctx.beginPath();
                    ctx.arc(bx, by, 5 + (i%3), 0, Math.PI*2);
                    ctx.fill();
                }
                this.hitbox = { x: this.x + ox, y: this.y - colH, w: colW, h: colH, dmg: 18, kb: 20 };
            } else if (this.currentAttack === 'blueDownSpecial') {
                // Blue down special: watery stomp that creates a suction ripple pulling foes inward then releasing
                const stompW = 180;
                const stompH = 56;
                const ox = this.width/2 - stompW/2;
                // ripple visual
                ctx.fillStyle = 'rgba(60,150,220,0.92)';
                ctx.beginPath();
                ctx.ellipse(this.width/2, this.height + 6, stompW/2, stompH/2, 0, 0, Math.PI*2);
                ctx.fill();
                // inward swirl lines
                ctx.strokeStyle = 'rgba(180,230,255,0.95)';
                ctx.lineWidth = 2;
                for (let i=0;i<5;i++) {
                    ctx.beginPath();
                    ctx.arc(this.width/2, this.height + 6, 18 + i*20, 0, Math.PI*2);
                    ctx.stroke();
                }
                // hitbox: wide area with inward pull flag
                this.hitbox = { x: this.x + ox, y: this.y + this.height - 10, w: stompW, h: stompH, dmg: 26, kb: 34, pull: true };
            } else if (this.currentAttack === 'blueNeutralSpecial') {
                // Blue neutral special: expanding bubble orb that briefly stuns/knocks back
                ctx.fillStyle = 'rgba(120,205,255,0.9)';
                const orbR = 34 + Math.sin(Date.now()/120) * 6;
                const ox = this.dir === 1 ? this.width + 6 : -orbR*2 - 6;
                ctx.beginPath();
                ctx.arc(ox + orbR, this.height/2, orbR, 0, Math.PI*2);
                ctx.fill();
                ctx.fillStyle = 'rgba(220,250,255,0.95)';
                ctx.beginPath();
                ctx.arc(ox + orbR - 6, this.height/2 - 6, orbR*0.4, 0, Math.PI*2);
                ctx.fill();
                this.hitbox = { x: this.x + ox, y: this.y + this.height/2 - orbR, w: orbR*2, h: orbR*2, dmg: 12, kb: 16 };
            } else {
                const sx = this.dir === 1 ? this.width : -20;
                ctx.fillRect(sx, 10, 20, 20);
                this.hitbox = { x: this.x + sx, y: this.y + 10, w: 20, h: 20, dmg: 3, kb: 4 };
            }
            
            this.attackFrame--;
            if (this.attackFrame <= 0) {
                this.state = 'idle';
                this.hitbox = null;
            }
        }

        // Ultimate visual
        if (this.state === 'ultimate') {
            const alpha = Math.max(0.2, this.ultimateFrame / 60);
            ctx.fillStyle = `rgba(255,120,40,${alpha})`;
            // big radial flash
            ctx.beginPath();
            ctx.arc(this.width/2, this.height/2, 120 + (60 - this.ultimateFrame) * 0.8, 0, Math.PI*2);
            ctx.fill();

            // small epic outlines
            ctx.strokeStyle = `rgba(255,230,120,${alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.width/2, this.height/2, 90, 0, Math.PI*2);
            ctx.stroke();

            this.ultimateFrame--;
            if (this.ultimateFrame <= 0) {
                this.state = 'idle';
                this.hitbox = null;
            }
        }

        // Star KO visual: shrinking/flying version (drawn only while flying and before the shining star appears)
        if (this.state === 'starKO' && !this.starShown) {
            // finish current local transforms and draw the scaled/flying fighter directly in world coords
            ctx.restore();
            ctx.save();
            // draw the fighter scaled down at its current world position (centered)
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            ctx.scale(this.starScale, this.starScale);
            // draw a simplified star/diamond representing the shrinking fighter
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(0, -this.height/2 - 5);
            ctx.lineTo(this.width/2 + 5, 0);
            ctx.lineTo(0, this.height/2 + 5);
            ctx.lineTo(-(this.width/2 + 5), 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            // avoid the later ctx.restore() from running twice in the caller's flow
            return;
        }

        ctx.restore();
    }
}