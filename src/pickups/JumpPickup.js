import Phaser from 'phaser';

export default class JumpPickup extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y) {
    super(scene, x, y, 20, 20, 0xffff00);

    scene.add.existing(this);
  }

  applyEffect(gameScene) {
    if (!gameScene.extraJumpActive) {
      gameScene.extraJumpActive = true;
      gameScene.maxJumps = gameScene.baseMaxJumps + 1;
    }
  }
}
