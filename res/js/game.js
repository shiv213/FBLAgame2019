'use strict';

const size = {
    width: window.innerWidth || document.body.clientWidth,
    height: window.innerHeight || document.body.clientHeight
};

let SCALE = 1;

const app = new PIXI.Application({
    width: size.width * SCALE,
    height: size.height * (SCALE - 0.00)
});

// credit http://pixeljoint.com/pixelart/46064.htm

document.addEventListener("DOMContentLoaded", () => document.querySelector("#wrapper").appendChild(app.view));

var vg_ship, bullet1, bullet2;

// load the texture we need
PIXI.loader
// .add('bunny', 'img/bunny.png')
    .add('bg_tile', 'img/bg_tile.png')
    .add('vg_ship', 'img/vg_ship.png')
    .add('bullet1', 'img/bullet1.png') // 5 health
    .add('bullet2', 'img/bullet2.png') // 10 health
    .load(setup);

function setup(loader, resources) {

    // This creates a texture from a 'bunny.png' image
    const bg = new PIXI.extras.TilingSprite(resources.bg_tile.texture, size.width, size.height);


    app.stage.addChild(bg);

    // Listen for frame updates
    // app.ticker.add(() => {
    //
    // });
}
