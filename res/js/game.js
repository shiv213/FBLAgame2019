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

// MARK - Game classes
class EnemyShip {

    constructor(texture, damage) {
        this.damage = damage;
        // noinspection JSAccessibilityCheck
        this._sprite = new PIXI.Sprite(PIXI.utils.TextureCache[texture]);
    }

    moveX(amt) {
        this._sprite.vx = amt;
        this._sprite.x += this._sprite.vx;
    }

    moveY(amt) {
        this._sprite.vy = amt;
        this._sprite.y += this._sprite.vy;
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
        return new Bullet(null, this.damage);
    }

}

class Bullet {
    constructor(texture, damage) {
        this.damage = damage || 5;
        this.tickCreated = null;
        if (!texture) {
            texture = "bullet1";
        }
        this.dirty = false;

        // noinspection JSAccessibilityCheck
        this._sprite = new PIXI.Sprite(PIXI.utils.TextureCache[texture])
    }

    move(amt) {
        this._sprite.vx = -amt; // it will keep moving left
        this._sprite.x += this._sprite.vx;
    }

    clean(tick) {
        if (!this.tickCreated) {
            this.tickCreated = tick;
        } else if ((tick - this.tickCreated) > 10000) {
            app.stage.remove(this._sprite);
            self.dirty = true;
        }
    }
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
        families: ["Pixelar"]
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
    let btns = [playBtn, infoBtn];


    let startBtnOffsetX = 200;
    let startBtnOffsetY = 0;

    let infoBtnOffsetX = -300;
    let infoBtnOffsetY = 40;


    btns.forEach((btn) => {
        btn.buttonMode = true;
        btn.interactive = true;
        btn.anchor.set(0.5, 0.5);
        // btn.on('pointerdown', btnDown);
        // btn.scale.x *= btnScale;
        // btn.scale.y *= btnScale;
    });

    // MARK - Button positioning
    playBtn.position.set((app.screen.width / 2 + startBtnOffsetY), (app.screen.height / 2 + startBtnOffsetX));
    infoBtn.position.set((app.screen.width / 2 + infoBtnOffsetX), (app.screen.height / 2 + infoBtnOffsetY));

    // MARK - Button logic
    playBtn.on('pointerdown', () => {
        console.log('cliccked');
        started = true;
        console.log(started);
    });
    infoBtn.on('pointerdown', () => {
        console.log("Infooo");
    });


    // MARK - Background
    const bg = new PIXI.extras.TilingSprite(resources.bg_tile.texture, app.screen.width, app.screen.height);
    const bg_accel_rate = 0.010;
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
    let gameOverDelay = 75; // ticks
    let gameOverStage = new PIXI.Container();
    gameOverStage.addChild(bg);
    let gameOverText = new PIXI.Text("GAME\nOVER", splashTextStyle);
    gameOverText.anchor.set(0.5, 0.5);
    gameOverText.position.set(app.screen.width / 2, app.screen.height / 2);
    gameOverStage.addChild(gameOverText);
    gameOverStage.visible = false;
    // GAME OVER

    // INFO
    let infoStage = new PIXI.Container();
    infoStage.addChild(bg);
    infoStage.addChild(infoText);
    infoStage.visible = false;
    // INFO


    // MARK - add all elements
    app.stage.addChild(bg);
    app.stage.addChild(splashText);
    app.stage.addChild(playBtn);
    app.stage.addChild(infoBtn);
    app.stage.addChild(gameOverStage);
    app.stage.addChild(infoStage);


    // // debug
    // if(tick > 300 && started) {
    //     gameOver = true;
    // }


    // Main game loop
    app.ticker.add(() => {
        tick++;

        // contain all sprites in canvas
        contain()


        // MARK - Background processing
        bg_delta = bg_accel_rate * tick;
        if (!started) {
            bg.tilePosition.x += -bg_static;
        } else if (gameOver) {
            // don't move the bg
            // bg.tilePosition.x = 0;
        } else {
            bg.tilePosition.x += -bg_delta;
        }


        if (gameOver) {
            if (!relTick) {
                relTick = tick; // takes snapshot of tick for comparison
            }
            console.log("rel tick", relTick);
            // we are done, wait for gameOver stage to finish
            if ((tick - relTick) >= gameOverDelay) {
                // reset everything after game over delay
                tick = 0;
                relTick = null;
                started = false;
                gameOver = false;
                gameOverStage.visible = false;
            } else {
                gameOverStage.visible = true;
            }

        }

        // MARK - splash text processing
        if (started) {
            // console.log("Started", started);
            splashText.visible = false;
            btns.forEach((b) => {
                b.visible = false; //todo make visible again
            })
        } else if (!gameOver) {
            // console.log("Not started");
            splashText.visible = true; // todo test / delay
            btns.forEach((b) => {
                b.visible = true;
            })
        }

    });
}
