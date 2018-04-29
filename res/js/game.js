'use strict';

const size = {
    width: window.innerWidth || document.body.clientWidth,
    height: window.innerHeight || document.body.clientHeight
};

let SCALE = 1;
let tick = 0;


const app = new PIXI.Application({
    width: size.width * SCALE,
    height: size.height * (SCALE - 0.00)
});

let BUMP = new Bump(PIXI);

// MARK - Helper functions
// function contain(sprite, container) {
//     let collision = undefined;
//     //Left
//     if (sprite.x < container.x) {
//         sprite.x = container.x;
//         collision = "left";
//     }
//     //Top
//     if (sprite.y < container.y) {
//         sprite.y = container.y;
//         collision = "top";
//     }
//     //Right
//     if (sprite.x + sprite.width > container.width) {
//         sprite.x = container.width - sprite.width;
//         collision = "right";
//     }
//     //Bottom
//     if (sprite.y + sprite.height > container.height) {
//         sprite.y = container.height - sprite.height;
//         collision = "bottom";
//     }
//     //Return the `collision` value
//     return collision;
// }

function keyboard(keyCode) {
    var key = {};
    key.code = keyCode;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    //The `downHandler`
    key.downHandler = function (event) {
        if (event.keyCode === key.code) {
            if (key.isUp && key.press) key.press();
            key.isDown = true;
            key.isUp = false;
        }
        event.preventDefault();
    };
    //The `upHandler`
    key.upHandler = function (event) {
        if (event.keyCode === key.code) {
            if (key.isDown && key.release) key.release();
            key.isDown = false;
            key.isUp = true;
        }
        event.preventDefault();
    };
    //Attach event listeners
    window.addEventListener(
        "keydown", key.downHandler.bind(key), false
    );
    window.addEventListener(
        "keyup", key.upHandler.bind(key), false
    );
    return key;
}

function debounce(tick, interval, fn) {
    if (tick % interval === 0) {
        fn();
    }
}

/* credit:
    http://pixeljoint.com/pixelart/46064.htm
    http://pixeljoint.com/pixelart/35997.htm
*/
// document.addEventListener("DOMContentLoaded", () => );


// load fonts
WebFont.load({
    google: {
        families: ["Press Start 2P"]
    },
    active: function () {
        init()
    }
});

function init() {
    // console.log("Init");
    $("#load-text").hide();
    document.querySelector("#wrapper").appendChild(app.view);
    PIXI.loader
    // .add('bunny', 'img/bunny.png')
        .add('bg_tile', 'img/bg_tile.png')
        .add('vg_ship', 'img/vg_ship.png')
        .add('bullet1', 'img/bullet1.png')  // 5 health
        .add('bullet2', 'img/bullet2.png') //10 health
        .add('play_btn', 'img/play.png')
        .add('arthur_ship', 'img/arthur.png')
        .add('info_btn', 'img/info.png')
        // fonts
        // .add('Upheaval', 'font/upheaval/upheaval.ttf')
        .load(setup);
}


function setup(loader, resources) {

    class Zone {
        constructor(yBand, label) {
            console.log(yBand);
            this.band = yBand;
            this.label = label || "Zone@" + this.band;
        }
    }


    const enemyZones = [
        // new Zone(app.screen.width / 3, "Top"),
        new Zone(app.screen.height / 5, "Top"),
        new Zone(app.screen.height / 3, "Mid"),
        new Zone(app.screen.height * 0.8),
        // new Zone(app.screen.width / 12),
        // new Zone(app.screen.width / 12)
    ];

    function getRandomZone() {
        return enemyZones[Math.floor(Math.random() * enemyZones.length)];
    }

    class Ship {

        constructor(texture, scale) {
            // noinspection JSAccessibilityCheck
            this.sprite = new PIXI.Sprite(texture);
            this.health = 100;
            this.scale = scale || 1;
            this.sprite.scale.x *= this.scale;
            this.sprite.scale.y *= this.scale;
        }

        addToStage() {
            app.stage.addChild(this.sprite);
        }

        moveX(amt) {
            this.sprite.vx = amt;
            this.sprite.x += this.sprite.vx;
        }

        moveY(amt) {
            this.sprite.vy = amt;
            this.sprite.y += this.sprite.vy;
        }


        shootBullet() {
            // noinspection JSAccessibilityCheck
            bullets.push(new Bullet(PIXI.utils.TextureCache["bullet1"], 5));
        }

    }

    class ArthurShip extends Ship {
        constructor() {
            let shipScale = 1 / 2;
            super(resources.arthur_ship.texture, shipScale);
            this.health = playerMaxHealth;
            this.sprite.visible = false; // not visible by default
            this.sprite.anchor.set(0.5, 0.5);
            this.sprite.position.set(app.screen.width / 4, app.screen.height / 2);
        }

        shootBullet() {
            let pos = {
                x: this.sprite.position.x,
                y: this.sprite.position.y
            };
            bullets.push(new FriendlyBullet(pos));
        }

        moveX() {
            console.log("no moving x on the arthur ship")
        }
    }

    class EnemyShip extends Ship {

        constructor() {
            let shipScale = 1;
            super(resources.vg_ship.texture, shipScale);
            this.dirty = false;
            this.health = 15; // make it easier lmao
            this.sprite.anchor.set(0.5, 0.5);
            // todo randomize position of ships
            this.sprite.position.set(app.screen.width * 3 / 4, getRandomZone().band);
        }

        clean() {
            if (this.health <= 0) {
                this.dirty = true;
                _.pull(enemies, this);
                app.stage.removeChild(this.sprite);
            }
        }

        moveAI() {
            let upOrDown = Math.random() < 0.5 ? -1 : 1; // move up or down in y
            this.moveY((Math.floor(Math.random() * 40) + 1) * upOrDown);
        }

        shootAI() {
            let shouldShoot = Math.floor(Math.random() * 100) < 20; //shoots 20 % of time
            if (shouldShoot) {
                this.shootBullet();
            }
        }

        shootBullet() {
            bullets.push(new EnemyBullet({x: this.sprite.position.x, y: this.sprite.position.y}));
        }

    }

// generic
    class Bullet {
        constructor(texture, damage, position, bulletOffset) {
            this.damage = damage || 5;
            this.tickCreated = null;
            this.collided = false;
            this.moveRate = 5;
            this.scale = 1 / 4;
            this.bulletOffset = bulletOffset || 0;
            if (!texture) {
                texture = resources.bullet1.texture;
            }
            this.dirty = false;

            this.sprite = new PIXI.Sprite(texture);
            this.sprite.anchor.set(0.5, 0.5);
            this.sprite.position.set(position.x + this.bulletOffset, position.y);
            // console.log("Bullet Sprite", this.sprite.position);
            this.sprite.scale.x *= this.scale;
            this.sprite.scale.y *= this.scale;
            app.stage.addChild(this.sprite);
        }

        move() {
            this.sprite.vx = this.moveRate;
            this.sprite.x += this.sprite.vx;
        }

        clean(tick) {
            if (this.collided || this.sprite.position.x > app.screen.width) {
                this.dirty = true;
                _.pull(bullets, this);
                app.stage.removeChild(this.sprite);
            }
            if (!this.tickCreated) {
                this.tickCreated = tick;
            } else if ((tick - this.tickCreated) > 10000) {
                app.stage.removeChild(this.sprite);
                this.dirty = true;
            }
        }
    }

    class FriendlyBullet extends Bullet {
        constructor(pos) {
            super(resources.bullet2.texture, 20, pos, 75);
        }

        getCollidedShip() {
            // returns first matching element
            return _.find(enemies, (e) => {
                let isHit = BUMP.hit(e.sprite, this.sprite, false, false, true);
                if(isHit) this.collided = true;
                return isHit;
            });
            // enemies.forEach((e) => {
            //     if (BUMP.hit(e.sprite, this.sprite, false, false, true)) {
            //         console.log("Enemy ship", e);
            //         this.collided = true;
            //         // return e;
            //     }
            // });
        }
    }

// helps differentiate
    class EnemyBullet extends Bullet {
        constructor(pos) {
            super(resources.bullet1.texture, 5, pos, -50);
            this.moveRate = 4;
        }

        move() {
            this.sprite.vx = this.moveRate;
            this.sprite.x += -this.sprite.vx; // move towards player
        }

        getCollidedShip() {
            let possiblePlayer = null;
            if (BUMP.hit(this.sprite, player.sprite, false, false, true)) {
                this.collided = true;
                possiblePlayer = player;
            }
            return possiblePlayer;
        }
    }

    // MARK - Main variables
    let started = false;
    let playerScore = 0;
    let state;
    // todo fix bounds
    let BOUNDS = {
        x: 0,
        y: 0,
        width: app.screen.width,
        height: app.screen.height
    };


    // MARK - Game vars
    let bullets = [];
    let enemies = [];
    let scores = localStorage.scores || [];
    let playerMaxHealth = 100;
    let player = new ArthurShip();
    let playerAccel = 5.5;
    let playerShootRate = 5;
    let enemySpawnRate = 50; // every 20 ticks? idk lmao
    let maxEnemies = 10;
    let enemyMoveRate = 20;
    let enemyShootRate = 30;

    let bulletProcessTimeout = 500; // ms

    window.player = player;
    window.bullets = bullets;
    window.enemies = enemies;
    window.playerScore = playerScore;
    window.scores = scores;

    // MARK - Game Cleaning + misc
    function cleanBullets(tick) {
        bullets.forEach((b) => {
            b.clean(tick);
            if(b.dirty) {
                _.pull(bullets, b);
            }
        })
    }

    function cleanEnemies(tick) {
        enemies.forEach((e) => {
            e.clean(tick);
            if (e.dirty) {
                // is only dirty if killed, so we can add score
                // console.log("Score incrementing");
                e.sprite.destroy();
                e = null;
                _.pull(enemies, e);
                playerScore += 1; // hack
            }
        })
    }

    // todo fix container
    function containPlayer() {
        // bullets.forEach((b) => {
        //     contain(b, BOUNDS);
        // });
        enemies.forEach((e) => {
            if(e.sprite.parent) {
                BUMP.contain(e.sprite, BOUNDS, true);
            }
        });
        BUMP.contain(player.sprite, BOUNDS, true);
    }

    function hideAllBtns() {
        btns.forEach((b) => {
            b.visible = false;
        })
    }

    function showAllBtns() {
        btns.forEach((b) => {
            b.visible = true;
        });
    }

    function addAllEnemiesToStage() {
        enemies.forEach((e) => {
            app.stage.addChild(e.sprite);
        })
    }

    // function addAllBulletsToStage() {
    //     bullets.forEach((b) => {
    //         app.stage.addChild(b);
    //     })
    // }

    function getBGDelta(t) {
        var bg_delta = Math.log(bgAccelRate * t * 5) / Math.log(2);
        // console.log(bg_delta);
        // normalize
        if (bg_delta >= bgMaxAccelDelta) {
            bg_delta = bgMaxAccelDelta;
        }
        return bg_delta;
    }

    function processPlayerMovement() {
        if (up.isDown || w.isDown) {
            player.moveY(-playerAccel);
        } else if (down.isDown || s.isDown) {
            player.moveY(playerAccel);
        }
    }

    function processPlayerShooting(tick) {
        debounce(tick, playerShootRate, () => {
            if (space.isDown) {
                // console.log("Shooting");
                player.shootBullet();
            }
        });
    }

    function spawnEnemies(tick) {
        debounce(tick, enemySpawnRate, () => {
            if (!(enemies.length >= maxEnemies)) {
                enemies.push(new EnemyShip());
            }
        })
    }

    function processBullets() {
        bullets.forEach((b) => {
            b.move();
        })
    }

    function forceClearBullets() {
        bullets.forEach((b) => {
            app.stage.removeChild(b.sprite);
        });
        bullets = [];
    }

    function forceClearEnemyShips() {
        enemies.forEach((e) => {
            app.stage.removeChild(e.sprite);
        });
        enemies = [];
    }

    let ranOnceD = false;
    let ranOnceI = false;
    function decrementOnce(ship, amt) {
        if(!ranOnceD) {
            // console.log("Ship hit", ship);
            ship.health -= amt;
            ranOnceD = true;
            setTimeout(() => ranOnceD = false, bulletProcessTimeout);
        }
    }

    function incrementOnce(val, amt) {
        if(!ranOnceI) {
            val += (amt || 1);
            ranOnceI = true;
            return val;
        }
        setTimeout(() => ranOnceI = false, 2000);

    }

    function processCollisions() {
        bullets.forEach((b) => {
            // b.getCollidedShip().health -= b.damage;
            // console.log("Collided", b.getCollidedShip())
            let ship = b.getCollidedShip();
            if(ship) {
                decrementOnce(ship, b.damage);
            }
        });
    }

    // MARK - enemy helper functions
    // from https://codereview.stackexchange.com/a/75663/123525
    // adapted for lodash 4
    function pairwise(list) {
        if (list.length < 2) { return []; }
        let first = _.first(list),
            rest = _.tail(list),
            pairs = _.map(rest, function (x) {
                return [first, x];
            });
        return _.flatten([pairs, pairwise(rest)]);
    }


    function processEnemyMovement(tick) {
        debounce(tick, enemyMoveRate, () => {
            enemies.forEach((e) => {
                e.moveAI();
            })
        });
    }

    function shootEnemies(tick) {
        debounce(tick, enemyShootRate, () => {
            enemies.forEach((e) => {
                e.shootAI();
            })
        });
    }

    function unstackEnemies(tick) {
        // probably very expensive
        debounce(tick, 1, () => {
            let allEnemyCombinations = pairwise(enemies);
            // console.log("All enemy", allEnemyCombinations);
            _.forEach(allEnemyCombinations, (enemyPair) => {
                // console.log(enemyPair);
                let e1Sprite = enemyPair[0].sprite;
                let e2Sprite = enemyPair[1].sprite;
                // console.log("S1, S2", e1Sprite, e2Sprite);
                BUMP.rectangleCollision(e1Sprite, e2Sprite, true, true);
            })
        });

    }

    // MARK - fonts
    let splashTextStyle = new PIXI.TextStyle({
        fontFamily: "Upheaval",
        fontSize: 200,
        fill: "#6483BD",
        align: "center"
    });

    let subtitleStyle = new PIXI.TextStyle({
        fontFamily: "Press Start 2P",
        fontSize: 20,
        fill: "#efefef"
    });

    let regularTextStyle = new PIXI.TextStyle({
        fontFamily: "VCR OSD Mono",
        fontSize: 42,
        fill: "#6fa0a7",
        align: "left"
    });

    // MARK - buttons
    let playBtn = new PIXI.Sprite(resources.play_btn.texture);
    let infoBtn = new PIXI.Sprite(resources.info_btn.texture);
    // let infoBackBtn = new PIXI.Sprite(resources.info_btn.texture); // todo change back btn texture
    let btns = [playBtn, infoBtn]; // todo implement info back btn

    // MARK - Button offsets
    let startBtnOffsetX = 200;
    let startBtnOffsetY = 0;

    let infoBtnOffsetX = -300;
    let infoBtnOffsetY = 40;

    // let infoBackBtnOffsetX = 0;
    // let infoBackBtnOffsetY = 0;

    btns.forEach((btn) => {
        btn.buttonMode = true;
        btn.interactive = true;
        btn.anchor.set(0.5, 0.5);
    });

    // MARK - Button positioning
    playBtn.position.set((app.screen.width / 2 + startBtnOffsetY), (app.screen.height / 2 + startBtnOffsetX));
    infoBtn.position.set((app.screen.width / 2 + infoBtnOffsetX), (app.screen.height / 2 + infoBtnOffsetY));
    // infoBackBtn.position.set((app.screen.width / 2 + infoBtnOffsetX), (app.screen.height / 2 + infoBtnOffsetY));
    // infoBackBtn.visible = false; // not visible by default

    // MARK - Button logic
    playBtn.on('pointerdown', () => {
        started = true;
    });
    infoBtn.on('pointerdown', () => {
        state = infoState;
    });


    // MARK - Background
    const bg = new PIXI.extras.TilingSprite(resources.bg_tile.texture, app.screen.width, app.screen.height);
    const bgAccelRate = 0.03;
    const bgMaxAccelDelta = 20;
    const bg_static = 10;
    let bg_delta;

    // MARK - Text Initialization
    let splashText = new PIXI.Text('hitchhikers\nrun', splashTextStyle);
    let splashTextOffset = -130;
    let infoText = new PIXI.Text(
        `Book: The Hitchhiker's Guide to the Galaxy
        Quote 1: towel thing take granted etc.
        Quote 2: Randomness dolphin
        Quote 3: Idk lmao
        `, regularTextStyle);


    // MARK - Text positioning
    splashText.anchor.set(0.5, 0.5);
    splashText.position.set(app.screen.width / 2, (app.screen.height / 2 + splashTextOffset));

    // MARK - Alternate Stages

    // GAME OVER (only display on end, then after x amount of time, go back to beginning
    let gameOverDelay = 200; // ticks
    let gameOverStage = new PIXI.Container();
    gameOverStage.addChild(bg);
    let gameOverText = new PIXI.Text("GAME\nOVER\nSCORE:0", splashTextStyle); // default
    gameOverText.anchor.set(0.5, 0.5);
    gameOverText.position.set(app.screen.width / 2, app.screen.height / 2);
    gameOverStage.addChild(gameOverText);
    gameOverStage.visible = false;
    // GAME OVER

    // INFO
    let infoStage = new PIXI.Container();
    infoText.anchor.set(0.5, 0.5);
    infoText.position.set(app.screen.width / 2, app.screen.height / 2);
    infoStage.addChild(bg);
    infoStage.addChild(infoText);
    infoStage.visible = false;
    // INFO

    // MARK - keyboard hooks
    let up = keyboard(38);
    let down = keyboard(40);
    let w = keyboard(87);
    let s = keyboard(83);
    let space = keyboard(32);

    // MARK - Score saving
    window.onbeforeunload = function(e) {
        localStorage.scores = scores;
    };

    // MARK - add all elements
    app.stage.addChild(bg);
    app.stage.addChild(splashText);
    app.stage.addChild(playBtn);
    app.stage.addChild(infoBtn);
    app.stage.addChild(player.sprite);
    app.stage.addChild(gameOverStage);
    app.stage.addChild(infoStage);


    // // debug
    // if(tick > 300 && started) {
    //     gameOver = true;
    // }


    // Main game loop
    state = initialState;

    app.ticker.add(gameLoop);

    function gameLoop() {
        state();
    }

    function initialState() {
        tick++;

        bg.tilePosition.x += -bg_static;
        if (started) {
            splashText.visible = false;
            hideAllBtns();
            player.sprite.visible = true;
            state = mainGameState;
        }
    }

    // todo implement exit to info state
    function infoState() {
        splashText.visible = false;
        hideAllBtns();
        infoStage.visible = true;
        // don't move the bg
        // bg.tilePosition.x = 0;
        // if(shouldExitInfo) {
        //     state = initialState();
        // }
    }

    function gameOverState() {
        tick++;
        // don't move the bg
        // bg.tilePosition.x = 0;

        gameOverText.text = `GAME\nOVER\nSCORE:${playerScore}`;

        gameOverStage.visible = true;
        if (tick > gameOverDelay) {
            tick = 0;
            scores.push({score: playerScore, ts: Date.now(), pts: Date()});
            player.health = playerMaxHealth; // reset health
            playerScore = 0;
            gameOverStage.visible = false;
            started = false;
            forceClearEnemyShips();
            enemies = [];
            // make stuff visible again
            splashText.visible = true;
            showAllBtns();
            state = initialState;
        }
    }

    function mainGameState() {
        tick++;

        // move background
        // bg.tilePosition.x += -bg_delta;
        bg_delta = getBGDelta(tick);
        bg.tilePosition.x += -bg_delta;

        // cleanup before
        cleanBullets(tick);
        cleanEnemies(tick);

        processCollisions();
        unstackEnemies(tick);

        // contain all sprites in canvas
        containPlayer();
        processEnemyMovement(tick);
        processPlayerMovement();
        processPlayerShooting(tick);
        processBullets();
        // addAllBulletsToStage(); // these don't do anything for now, but i guess its alright?
        addAllEnemiesToStage();
        spawnEnemies(tick);
        shootEnemies(tick); // todo make better system for this?


        if (player.health <= 0) {
            tick = 0;
            player.sprite.visible = false;
            forceClearEnemyShips();
            forceClearBullets();
            state = gameOverState;
            // todo scoring system
        }
    }

    // function loop() {
    //     // tick++;
    //     //
    //     // // MARK - Background processing
    //     // bg_delta = bg_accel_rate * tick;
    //     // if (!started) {
    //     //     bg.tilePosition.x += -bg_static;
    //     // } else if (gameOver) {
    //     //     // don't move the bg
    //     //     // bg.tilePosition.x = 0;
    //     // } else {
    //     //     bg.tilePosition.x += -bg_delta;
    //     // }
    //
    //     //
    //     // if (gameOver) {
    //     //     if (!relTick) {
    //     //         relTick = tick; // takes snapshot of tick for comparison
    //     //     }
    //     //     console.log("rel tick", relTick);
    //     //     // we are done, wait for gameOver stage to finish
    //     //     if ((tick - relTick) >= gameOverDelay) {
    //     //         // reset everything after game over delay
    //     //         tick = 0;
    //     //         relTick = null;
    //     //         started = false;
    //     //         gameOver = false;
    //     //         gameOverStage.visible = false;
    //     //     } else {
    //     //         gameOverStage.visible = true;
    //     //     }
    //     //
    //     // }
    //
    //     // // MARK - splash text processing
    //     // if (started) {
    //     //     // console.log("Started", started);
    //     //     splashText.visible = false;
    //     //     btns.forEach((b) => {
    //     //         b.visible = false;
    //     //     })
    //     // } else if (!gameOver) {
    //     //     // console.log("Not started");
    //     //     splashText.visible = true; // todo test / delay
    //     //     btns.forEach((b) => {
    //     //         b.visible = true;
    //     //     })
    //     // }
    //
    // }
}
