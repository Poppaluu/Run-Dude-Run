import Phaser from 'phaser';

export default class HealthPickup extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y, healAmount = 25) {
    super(scene, x, y, 20, 20, 0x00ff00);

    this.healAmount = healAmount;

    scene.add.existing(this);
  }

  applyEffect(playerStats) {
    playerStats.health = Math.min(
      playerStats.health + this.healAmount,
      playerStats.maxHealth
    );
  }
}
