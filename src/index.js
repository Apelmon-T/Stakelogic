import * as PIXI from "pixi.js";
import { TweenMax } from "gsap";

import { lerp, backout, tweenTo } from "./helpers/index.js";

const app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
});
document.body.appendChild(app.view);

const starTexture = PIXI.Texture.from("./assets/unnamed.png");

const starAmount = 800;
let cameraZ = 0;
const fov = 20;
const baseSpeed = 0.025;
let speed = 0;
let warpSpeed = 0;
const starStretch = 5;
const starBaseSize = 0.05;

// Create the stars
const stars = [];
for (let i = 0; i < starAmount; i++) {
  const star = {
    sprite: new PIXI.Sprite(starTexture),
    z: 0,
    x: 0,
    y: 0,
  };

  star.sprite.anchor.x = 0.5;
  star.sprite.anchor.y = 0.7;
  randomizeStar(star, true);
  app.stage.addChild(star.sprite);
  stars.push(star);
}

function randomizeStar(star, initial) {
  star.z = initial
    ? Math.random() * 2000
    : cameraZ + Math.random() * 1000 + 2000;

  // Calculate star positions with radial random coordinate so no star hits the camera.
  const deg = Math.random() * Math.PI * 2;
  const distance = Math.random() * 50 + 1;
  star.x = Math.cos(deg) * distance;
  star.y = Math.sin(deg) * distance;
}

// Change flight speed every 5 seconds
setInterval(() => {
  warpSpeed = warpSpeed > 0 ? 0 : 1;
}, 3500);

// Listen for animate update
app.ticker.add((delta) => {
  // Simple easing. This should be changed to proper easing function when used for real.
  speed += (warpSpeed - speed) / 20;
  cameraZ += delta * 10 * (speed + baseSpeed);
  for (let i = 0; i < starAmount; i++) {
    const star = stars[i];
    if (star.z < cameraZ) randomizeStar(star);

    // Map star 3d position to 2d with really simple projection
    const z = star.z - cameraZ;
    star.sprite.x =
      star.x * (fov / z) * app.renderer.screen.width +
      app.renderer.screen.width / 2;
    star.sprite.y =
      star.y * (fov / z) * app.renderer.screen.width +
      app.renderer.screen.height / 2;

    // Calculate star scale & rotation.
    const dxCenter = star.sprite.x - app.renderer.screen.width / 2;
    const dyCenter = star.sprite.y - app.renderer.screen.height / 2;
    const distanceCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);
    const distanceScale = Math.max(0, (2000 - z) / 2000);
    star.sprite.scale.x = distanceScale * starBaseSize;
    // Star is looking towards center so that y axis is towards center.
    // Scale the star depending on how fast we are moving, what the stretchfactor is and depending on how far away it is from the center.
    star.sprite.scale.y =
      distanceScale * starBaseSize +
      (distanceScale * speed * starStretch * distanceCenter) /
        app.renderer.screen.width;
    star.sprite.rotation = Math.atan2(dyCenter, dxCenter) + Math.PI / 2;
  }
});

app.loader
  .add("./assets/unnamed.png", "./assets/unnamed.png")
  .load(onAssetsLoaded);

const REEL_WIDTH = 160;
const SYMBOL_SIZE = 150;

// onAssetsLoaded handler builds the example.
function onAssetsLoaded() {
  // Create different slot symbols.
  const slotTextures = [PIXI.Texture.from("./assets/unnamed.png")];

  // Build the reels
  const reels = [];
  const reelContainer = new PIXI.Container();
  for (let i = 0; i < 1; i++) {
    const rc = new PIXI.Container();
    rc.x = REEL_WIDTH;
    reelContainer.addChild(rc);

    const reel = {
      container: rc,
      symbols: [],
      position: 0,
      previousPosition: 0,
      blur: new PIXI.filters.BlurFilter(),
    };
    reel.blur.blurX = 0;
    reel.blur.blurY = 0;
    rc.filters = [reel.blur];

    const square = new PIXI.Graphics(
      slotTextures[Math.floor(Math.random() * slotTextures.length)]
    );
    square.lineStyle(10, 0x000000, 1);
    square.beginFill(0xacacac, 0.2);
    square.drawRect(
      -SYMBOL_SIZE * 0.5,
      margin,
      SYMBOL_SIZE * 2,
      SYMBOL_SIZE * 3
    );
    square.endFill();
    reelContainer.addChild(square);

    // Build the symbols
    for (let j = 0; j < 5; j++) {
      const symbol = new PIXI.Sprite(
        slotTextures[Math.floor(Math.random() * slotTextures.length)]
      );
      // Scale the symbol to fit symbol area.
      symbol.y = j * SYMBOL_SIZE;
      symbol.scale.x = symbol.scale.y = Math.min(
        SYMBOL_SIZE / symbol.width,
        SYMBOL_SIZE / symbol.height
      );
      symbol.x = Math.round((SYMBOL_SIZE - symbol.width) / 2);
      reel.symbols.push(symbol);
      square.addChild(symbol);
    }
    reels.push(reel);
  }
  app.stage.addChild(reelContainer);

  // Build top & bottom covers and position reelContainer
  const margin = (app.screen.height - SYMBOL_SIZE * 3) / 2;
  reelContainer.y = margin;
  reelContainer.x = Math.round(app.screen.width - REEL_WIDTH * 5);
  const top = new PIXI.Graphics();
  top.beginFill(0, 1);
  top.drawRect(0, 0, app.screen.width, margin);
  const bottom = new PIXI.Graphics();
  bottom.beginFill(0, 1);
  bottom.drawRect(0, SYMBOL_SIZE * 3 + margin, app.screen.width, margin);

  const circle = new PIXI.Graphics();
  circle.lineStyle(3, 0xedd6ad, 1);
  circle.beginFill(0x000000, 1);
  circle.drawCircle(SYMBOL_SIZE * 4.8, SYMBOL_SIZE * 3 + margin * 1.5, 40);
  circle.endFill();
  bottom.addChild(circle);

  // Add play text
  const style = new PIXI.TextStyle({
    fontFamily: "Arial",
    fontSize: 24,
    fontStyle: "italic",
    fontWeight: "bold",
    fill: ["#edd6ad"],
  });

  const playText = new PIXI.Text("Spin", style);
  playText.x = Math.round((bottom.width - playText.width) / 2);
  playText.y =
    app.screen.height - margin + Math.round((margin - playText.height) / 2);
  circle.addChild(playText);

  app.stage.addChild(top);
  app.stage.addChild(bottom);

  // Set the interactivity.
  circle.interactive = true;
  circle.buttonMode = true;
  circle.addListener("pointerdown", () => {
    startPlay();
  });

  let running = false;

  // Function to start playing.
  function startPlay() {
    if (running) return;
    running = true;

    for (let i = 0; i < reels.length; i++) {
      const r = reels[i];
      const extra = 3;
      const target = r.position + 10 + i * 5 + extra;
      const time = 2500 + i * 600 + extra * 600;
      const tweenItem = tweenTo(
        r,
        "position",
        target,
        time,
        backout(0.5),
        null,
        i === reels.length - 1 ? reelsComplete : null
      );
      tweening.push(tweenItem);
    }
    showFPS();
  }

  function showFPS() {
    const styleFPS = new PIXI.TextStyle({
      fontFamily: "Arial",
      fontSize: 14,
      fontStyle: "italic",
      fontWeight: "bold",
      fill: ["#edd6ad"],
    });
    const fps = new PIXI.Text(PIXI.ticker.shared.FPS, styleFPS);
    top.addChild(fps);

    setTimeout(() => {
      fps.destroy();
    }, 3500);
  }

  // Reels done handler.
  function reelsComplete() {
    running = false;

    const style = new PIXI.TextStyle({
      fontFamily: "Arial",
      fontSize: 36,
      fontStyle: "italic",
      fontWeight: "bold",
      fill: ["#cdd19f", "#edd6ad"], // gradient
      stroke: "#4a1850",
      strokeThickness: 5,
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowBlur: 4,
      dropShadowAngle: Math.PI / 6,
      dropShadowDistance: 6,
      wordWrap: true,
      wordWrapWidth: 440,
    });
    const headerText = new PIXI.Text("WIN!", style);
    headerText.x = Math.round((top.width - headerText.width) / 2);
    headerText.y = Math.round((margin - headerText.height) / 2);
    headerText.scale.x = 0;
    headerText.scale.y = 0;
    top.addChild(headerText);
    const time = 2;
    TweenMax.to(headerText.scale, time, {
      x: 1.5,
      y: 1.5,
      repeat: 0,
      yoyo: false,
    });
    setTimeout(() => {
      headerText.destroy();
    }, 2000);
  }

  // Listen for animate update.
  app.ticker.add((delta) => {
    // Update the slots.
    for (let i = 0; i < reels.length; i++) {
      const r = reels[i];
      // Update blur filter y amount based on speed.
      r.blur.blurY = (r.position - r.previousPosition) * 8;
      r.previousPosition = r.position;

      // Update symbol positions on reel.
      for (let j = 0; j < r.symbols.length; j++) {
        const s = r.symbols[j];
        const prevy = s.y;
        s.y = ((r.position + j) % r.symbols.length) * SYMBOL_SIZE - SYMBOL_SIZE;
        if (s.y < 0 && prevy > SYMBOL_SIZE) {
          // Detect going over and swap a texture.
          s.texture =
            slotTextures[Math.floor(Math.random() * slotTextures.length)];
          s.scale.x = s.scale.y = Math.min(
            SYMBOL_SIZE / s.texture.width,
            SYMBOL_SIZE / s.texture.height
          );
          s.x = Math.round((SYMBOL_SIZE - s.width) / 2);
        }
      }
    }
  });
}

// // Animation
const tweening = [];

// Listen for animate update.
app.ticker.add((delta) => {
  const now = Date.now();
  const remove = [];
  for (let i = 0; i < tweening.length; i++) {
    const t = tweening[i];
    const phase = Math.min(1, (now - t.start) / t.time);

    t.object[t.property] = lerp(
      t.propertyBeginValue,
      t.target,
      t.easing(phase)
    );
    if (t.change) t.change(t);
    if (phase === 1) {
      t.object[t.property] = t.target;
      if (t.complete) t.complete(t);
      remove.push(t);
    }
  }
  for (let i = 0; i < remove.length; i++) {
    tweening.splice(tweening.indexOf(remove[i]), 1);
  }
});
