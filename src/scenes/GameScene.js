import Phaser from 'phaser';
import Player from '../entities/Player.js';

import HealthPickup from '../pickups/HealthPickup.js';
import SpeedPickup from '../pickups/SpeedPickup.js';
import JumpPickup from '../pickups/JumpPickup.js';

import ScrollingWorld from '../level/ScrollingWorld.js';

import { submitGameSession } from "../api/leaderboard.js";
import { getPlayerId } from "../utils/storage.js";
import {calculateScore} from "../utils/scoring.js";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.playTime = 0;
    this.enemyScore = 0;
  }

  create() {
    this.world = new ScrollingWorld(this, 32, 150);
    this.player = new Player(this, 100, 250);

    //reset score
    this.playTime   = 0;
    this.enemyScore = 0;

    this.add.image(0, 0, 'bg')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-10);

    //for temperary escape key to terminate game and see statistics
    this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    //Collision flags
    this.canCollideSpikeFlag = true;
    this.canCollideEnemyFlag = true;

    //Collisions
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

    // Enemies
    this.physics.add.collider(
      this.player,
      this.world.enemies,
      this.handleEnemyCollision,
      null,
      this
    );

    // Spikes (WIP)
    this.physics.add.collider(
      this.player,
      this.world.spikes,
      null,
      this.handleSpikesCollision,
      this
    );
	
    // Stats display
    this.statsText = this.add.text(16, 16, '', {
      fontSize: '18px',
      fill: '#ffffff'
    });

    this.updateStatsText();
  }

  update(time, delta) {
    this.player.update();
    this.world.update();

    this.playTime += delta / 1000;

    this.updateStatsText();

    if (Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
      this.endGame();
    }

    if(this.player.stats.health <= 0){
      this.endGame();
    }
  }

  //not in use at the moment
  handlePickup(player, pickup) {
    if (pickup instanceof HealthPickup) {
      player.heal(pickup.healAmount || 25);
    } else if (pickup instanceof SpeedPickup) {
      player.addSpeed(pickup.speedBoost || 75);
    } else if (pickup instanceof JumpPickup) {
      player.grantExtraJump();
    }
    pickup.destroy();

    this.updateStatsText();
  }

  handleEnemyCollision(player, enemy) {
    const playerBody = player.body;
    const enemyBody  = enemy.body;

    if(!this.canCollideSpikeFlag) {
      return;
    }
    
    const isAbove = player.body.bottom <= enemy.body.top;

    if (isAbove) {
      console.log('Killed enemy!');
      //player bounce up
      playerBody.velocity.y = -500;
      this.enemyScore += 10;
      enemy.disableBody(true, true);
    } 
    else if(!isAbove && this.canCollideEnemyFlag) {
        this.canCollideEnemyFlag = false;
        this.player.stats.health -= 10;

        //knock things around a bit
        playerBody.velocity.y = -200;
        enemyBody.velocity.x = -100;

        //Start short invincibility
        this.time.delayedCall(800, () => {
          this.canCollideEnemyFlag = true;
        });
    }

    this.updateStatsText();
  }
  
  handleSpikesCollision(player, spikes) {
	
    if(!this.canCollideSpikeFlag) {
      return;
    }
    
    this.canCollideSpikeFlag = false;
    
    this.player.stats.health -= 10;
    this.updateStatsText();
      
    //Start short invincibility
    this.time.delayedCall(800, () => {
      this.canCollideSpikeFlag = true;
    });
      
  }

  //player can dash trhough platforms
  platformCollisionCheck(player, platform) {
    if (player.dropThrough) return false;
    return (
      player.body.velocity.y >= 0 &&
      player.y + player.height / 2 <= platform.y + 5
    );
  }

  updateStatsText() {
    const playTime = Math.floor(this.playTime);
    const score = calculateScore(playTime, this.enemyScore);
    
    this.statsText.setText(
      `Health: ${this.player.stats.health}/${this.player.stats.maxHealth}\n` +
      `Time: ${playTime}s\n` +
      `Score: ${score}`
    );
  }

  //End game and see statistics
  endGame() {
    const playTime = Math.floor(this.playTime);
    const score = calculateScore(playTime, this.enemyScore);

    const sessionData = {
      player_id: getPlayerId(),
      play_time: playTime,
      score: score ?? 0
    };

    console.log(sessionData);
    submitGameSession(sessionData);

    this.scene.start("MenuScene");
  }

}
