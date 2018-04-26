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

document.addEventListener("DOMContentLoaded", () => document.querySelector("#wrapper").appendChild(app.view));

// TODO Make mixed tiles using groups and then make a final tile

PIXI.loader
// .add('bunny', 'img/bunny.png')
    .add('bg_tile', 'img/bg_tile.png')
    .add('vg_ship', 'img/vg_ship.png')
    .add('bullet1', 'img/bullet1.png') // 5 health
    .add('bullet2', 'img/bullet2.png') // 10 health
    .load(setup);


var splashTextStyle = new PIXI.TextStyle({
    fontFamily: ""
});

var subtitleStyle;

function setup(loader, resources) {

    // This creates a texture from a 'bunny.png' image
    const bg = new PIXI.extras.TilingSprite(resources.bg_tile.texture, app.screen.width, app.screen.height);

    const bg_accel_rate = 0.005;
    const bg_static = 10;
    let bg_delta;
    let started = false;
    window.started = started;
    app.stage.addChild(bg);

    //Listen for frame updates
    app.ticker.add(() => {
        // console.log("Tick:", tick, "\nbg_delta:", bg_delta);
        tick++;
        bg_delta = bg_accel_rate * tick;
        if (!started) {
            bg.tilePosition.x += -bg_static;
        } else {
            bg.tilePosition.x += -bg_delta;
        }

    });
}
