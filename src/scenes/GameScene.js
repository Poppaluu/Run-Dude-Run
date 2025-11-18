import Phaser from 'phaser';
import Player from '../entities/Player.js';

import HealthPickup from '../pickups/HealthPickup.js';
import SpeedPickup from '../pickups/SpeedPickup.js';
import JumpPickup from '../pickups/JumpPickup.js';

import ScrollingWorld from '../level/ScrollingWorld.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.world = new ScrollingWorld(this, 32, 150);
    this.player = new Player(this, 100, 250);

    // Collisions
    this.physics.add.collider(
      this.player,
      this.world.ground
    );

    this.physics.add.collider(
      this.player,
      this.world.platforms,
      null,
      this.platformCollisionCheck,
      this
    );

    // Pickups
    this.physics.add.overlap(
      this.player,
      this.world.pickups,
      this.handlePickup,
      null,
      this
    );

    // Enemies (empty for now)
    this.physics.add.collider(
      this.player,
      this.world.enemies,
      this.handleEnemyCollision,
      null,
      this
    );

    // Stats display
    this.statsText = this.add.text(16, 16, '', {
      fontSize: '18px',
      fill: '#ffffff'
    });

    this.updateStatsText();
  }

  update() {
    this.player.update();
    this.world.update();
    //fix later (issue created)
    this.updateStatsText();
  }

  handlePickup(player, pickup) {
    if (pickup instanceof HealthPickup) {
      player.heal(pickup.healAmount || 25);
    } else if (pickup instanceof SpeedPickup) {
      player.addSpeed(pickup.speedBoost || 75);
    } else if (pickup instanceof JumpPickup) {
      player.grantExtraJump();
    }

    pickup.destroy();
  }

  handleEnemyCollision(player, enemy) {
    console.log('Hit enemy!');
  }

  platformCollisionCheck(player, platform) {
    if (player.dropThrough) return false;
    return (
      player.body.velocity.y >= 0 &&
      player.y + player.height / 2 <= platform.y + 5
    );
  }

  updateStatsText() {
    this.statsText.setText(
      `Health: ${this.player.stats.health}/${this.player.stats.maxHealth}` +
      `\nSpeed: ${this.player.stats.moveSpeed}` +
      `\nJump Power: ${-this.player.stats.jumpVelocity}` +
      `\nMax Jumps: ${this.player.maxJumps}`
    );
  }
}
