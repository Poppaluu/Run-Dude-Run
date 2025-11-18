import Phaser from 'phaser';

export default class SpeedPickup extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y, speedBoost = 75) {
    super(scene, x, y, 20, 20, 0x0000ff);

    this.speedBoost = speedBoost;

    scene.add.existing(this);
  }

  applyEffect(playerStats) {
    playerStats.moveSpeed += this.speedBoost;
  }
}
