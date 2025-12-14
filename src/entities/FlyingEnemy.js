import Phaser from 'phaser';

export default class FlyingEnemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'ufoEnemy');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.body.setImmovable(true);

    this.setScrollSpeed(150);

    // Save starting Y position for wobbling
    this.baseY = y;

    // Randomize wobble so multiple enemies don’t sync perfectly
    this.wobbleOffset = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 2;    // radians per second
    this.wobbleAmount = 48;  // pixels of vertical movement
  }

  setScrollSpeed(speed) {
    this.body.setVelocityX(-speed);
  }

  update(time, delta) {
    // wobble using a sine wave
    const t = time / 1000; // convert ms → seconds
    const offset = Math.sin(t * this.wobbleSpeed + this.wobbleOffset) * this.wobbleAmount;

    this.setY(this.baseY + offset);
  }
}
