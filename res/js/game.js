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


// credit http://pixeljoint.com/pixelart/46064.htm

// document.addEventListener("DOMContentLoaded", () => );

// TODO Make mixed tiles using groups and then make a final tile

// load fonts
WebFont.load({
    google: {
        families: ["Press Start 2P", "Pixelar"]
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
        .add('info_btn', 'img/info.png')
        // fonts
        // .add('Upheaval', 'font/upheaval/upheaval.ttf')
        .load(setup);
}


function setup(loader, resources) {

    // MARK - Main variables
    let started  = false;
    let gameOver = false;


    // MARK - fonts
    let splashTextStyle = new PIXI.TextStyle({
        fontFamily: "Upheaval",
        fontSize: 200,
        fill: "#6483BD",
        align: "center"
    });

    let subtitleStyle = new PIXI.TextStyle({
        fontFamily: "Press Start 2P"
    });

    let regularTextStyle = new PIXI.TextStyle({
        fontFamily: "VCR OSD Mono"
    });

    // MARK - buttons
    var playBtn = new PIXI.Sprite(resources.play_btn.texture);
    var infoBtn = new PIXI.Sprite(resources.info_btn.texture);
    var btns = [playBtn, infoBtn];

    let btnScale = 5;

    let startBtnOffsetX = 200;
    let startBtnOffsetY = 0;

    let infoBtnOffsetX = -300;
    let infoBtnOffsetY = 40;

    function btnDown() {
        console.log("Btn down", this);
        started = true;
    }
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
        console.log("Infooo")
    });


    // MARK - Background
    const bg = new PIXI.extras.TilingSprite(resources.bg_tile.texture, app.screen.width, app.screen.height);
    const bg_accel_rate = 0.005;
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
    let gameOverStage = new PIXI.Container();
    gameOverStage.addChild(bg);
    let gameOverText = new PIXI.Text("GAME\nOVER", splashTextStyle);
    gameOverText.anchor.set(0.5, 0.5);
    gameOverText.position.set(app.screen.width / 2, app.screen.height / 2);
    gameOverStage.addChild(gameOverText);
    // GAME OVER

    // INFO
    let infoStage = new PIXI.Container();
    infoStage.addChild(bg);
    infoStage.addChild(infoText);
    // INFO



    // MARK - add all elements
    app.stage.addChild(bg);
    app.stage.addChild(splashText);
    app.stage.addChild(playBtn);
    app.stage.addChild(infoBtn);



    // Main game loop
    app.ticker.add(() => {
        tick++;

        // debug
        if(tick > 300 && started) {
            gameOver = true;
        }

        // MARK - Background processing
        bg_delta = bg_accel_rate * tick;
        if (!started) {
            bg.tilePosition.x += -bg_static;
        } else {
            bg.tilePosition.x += -bg_delta;
        }

        if(gameOver) {
            // reset everything
            tick = 0;
            started = false;
            gameOver = false;
        }

        // MARK - splash text processing
        if (started) {
            // console.log("Started", started);
            splashText.visible = false;
            btns.forEach((b) => {
                b.visible = false; //todo make visible again
            })
        } else if(!gameOver) {
            // console.log("Not started");
            splashText.visible = true; // todo test / delay
            btns.forEach((b) => {
                b.visible = true;
            })
        }

    });
}
