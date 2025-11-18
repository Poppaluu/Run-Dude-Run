import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import GameScene from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1600,
  height: 600,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#1d1d1d',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false
    }
  },
  scene: [BootScene, PreloadScene, GameScene]
};

new Phaser.Game(config);
