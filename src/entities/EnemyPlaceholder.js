import Phaser from 'phaser';

export default class EnemyPlaceholder extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y) {
    super(scene, x, y, 32, 32, 0xff00ff); // purple box

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setImmovable(true);
    this.body.setAllowGravity(false);
  }

  setScrollSpeed(speed) {
    this.body.setVelocityX(-speed);
  }
}
