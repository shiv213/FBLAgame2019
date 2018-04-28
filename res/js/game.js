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

// MARK - Helper functions
function contain(sprite, container) {
    let collision = undefined;
    //Left
    if (sprite.x < container.x) {
        sprite.x = container.x;
        collision = "left";
    }
    //Top
    if (sprite.y < container.y) {
        sprite.y = container.y;
        collision = "top";
    }
    //Right
    if (sprite.x + sprite.width > container.width) {
        sprite.x = container.width - sprite.width;
        collision = "right";
    }
    //Bottom
    if (sprite.y + sprite.height > container.height) {
        sprite.y = container.height - sprite.height;
        collision = "bottom";
    }
    //Return the `collision` value
    return collision;
}
function keyboard(keyCode) {
    var key = {};
    key.code = keyCode;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    //The `downHandler`
    key.downHandler = function(event) {
        if (event.keyCode === key.code) {
            if (key.isUp && key.press) key.press();
            key.isDown = true;
            key.isUp = false;
        }
        event.preventDefault();
    };
    //The `upHandler`
    key.upHandler = function(event) {
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



/* credit:
    http://pixeljoint.com/pixelart/46064.htm
    http://pixeljoint.com/pixelart/35997.htm
*/
// document.addEventListener("DOMContentLoaded", () => );

// TODO Make mixed tiles using groups and then make a final tile

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
    console.log("Init");
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

    // MARK - Main variables
    let started = false;
    let gameOver = false;
    let relTick;
    let playerScore = 0;
    let state;
    let BOUNDS = {
        x: 0,
        y: 0,
        width: app.screen.width,
        height: app.screen.height
    };


// MARK - Game classes
    class Ship {

        constructor(texture) {
            // noinspection JSAccessibilityCheck
            this.sprite = new PIXI.Sprite(texture);
            this.health = 100;
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
            return new Bullet(PIXI.utils.TextureCache["bullet1"], 5);
        }

    }

    class ArthurShip extends Ship {
        constructor() {
            super(resources.arthur_ship.texture);
            let shipScale = 1/2;
            this.sprite.visible = false; // not visible by default
            this.sprite.scale.x *= shipScale;
            this.sprite.scale.y *= shipScale;
            this.sprite.anchor.set(0.5, 0.5);
            this.sprite.position.set(app.screen.width / 4, app.screen.height / 2);
        }

        shootBullet() {
            return new FriendlyBullet();
        }

        moveX() {
            console.log("no moving x on the arthur ship")
        }
    }

    class EnemyShip extends Ship {

        constructor() {
            super(resources.vg_ship.texture, 5);
            this.dirty = false;
        }

        clean() {
            if (this.health <= 0) {
                this.dirty = true;
                app.stage.removeChild(this.sprite);
            }
        }

        moveAI() {
            let upOrDown = Math.random() < 0.5 ? -1 : 1; // move up or down in y
            this.moveY((Math.floor(Math.random() * 4) + 1) * upOrDown);
        }

        /**
         *
         * @returns Bullet
         */
        shootAI() {
            let shouldShoot = Boolean(Math.floor(Math.random() * 2));
            if (shouldShoot) {
                return this.shootBullet();
            }
        }

        shootBullet() {
            return new EnemyBullet();
        }

    }

// generic
    class Bullet {
        constructor(texture, damage) {
            this.damage = damage || 5;
            this.tickCreated = null;
            this.collided = false;
            if (!texture) {
                texture = "bullet1";
            }
            this.dirty = false;

            // noinspection JSAccessibilityCheck
            this.sprite = new PIXI.Sprite(PIXI.utils.TextureCache[texture])
        }

        move(amt) {
            this.sprite.vx = amt;
            this.sprite.x += this.sprite.vx;
        }

        clean(tick) {
            if (this.collided) {
                self.dirty = true;
                app.stage.removeChild(this.sprite);
            }
            if (!this.tickCreated) {
                this.tickCreated = tick;
            } else if ((tick - this.tickCreated) > 10000) {
                app.stage.removeChild(this.sprite);
                self.dirty = true;
            }
        }
    }

    class FriendlyBullet extends Bullet {
        constructor() {
            super(resources.bullet2.texture, 20);
        }
    }

// helps differentiate
    class EnemyBullet extends Bullet {
        constructor() {
            super(resources.bullet1.texture, 5);
            this.moveRate = 4;
        }

        move() {
            super.move(-this.moveRate); // moves towards player
        }
    }



    // MARK - Game vars
    let bullets = [];
    let enemies = [];
    let player = new ArthurShip();
    window.player = player;

    // MARK - Game Cleaning + misc
    function cleanBullets(tick) {
        bullets.forEach((b) => {
            console.log("Bullet", b);
            b.clean(tick);
            if (b.dirty) {
                b = null;
            }
        })
    }

    function cleanEnemies(tick) {
        enemies.forEach((e) => {
            e.clean(tick);
            if (e.dirty) {
                // is only dirty if killed, so we can add score
                playerScore++;
                e = null;
            }
        })
    }

    function containAll() {
        bullets.forEach((b) => {
            contain(b, BOUNDS);
        });
        enemies.forEach((e) => {
            contain(e, BOUNDS);
        });
        contain(player, BOUNDS);
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
            app.stage.addChild(e);
        })
    }

    function addAllBulletsToStage() {
        bullets.forEach((b) => {
            app.stage.addChild(b);
        })
    }

    function getBGDelta (t) {
        var bg_delta = Math.log(bgAccelRate * t * 5) / Math.log(2);
        // console.log(bg_delta);
        // normalize
        if(bg_delta >= bgMaxAccelDelta) {
            bg_delta = bgMaxAccelDelta;
        }
        return bg_delta;
        // if(bg_delta >= )
    }

    // MARK - enemy helper functions
    function moveEnemies() {
        enemies.forEach((e) => {
            e.moveAI();
        })
    }

    function shootEnemies() {
        enemies.forEach((e) => {
            e.shootAI();
        })
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
        console.log(started);
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
    let gameOverText = new PIXI.Text(`GAME\nOVER\nSCORE: ${playerScore}`, splashTextStyle);
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
    up.press = function () {

    };

    // MARK - add all elements
    app.stage.addChild(bg);
    app.stage.addChild(splashText);
    app.stage.addChild(playBtn);
    app.stage.addChild(infoBtn);
    app.stage.addChild(player.sprite);
    addAllBulletsToStage(); // these don't do anything for now, but i guess its alright?
    addAllEnemiesToStage();
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
        if(started) {
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
        gameOverStage.visible = true;
        if (tick > gameOverDelay) {
            tick = 0;
            gameOverStage.visible = false;
            started = false;
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

        // contain all sprites in canvas
        containAll();
        if(player.health <= 0) {
            tick = 0;
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
