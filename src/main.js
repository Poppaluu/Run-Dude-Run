import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import PreLoadScene from './scenes/PreLoadScene.js';
import GameScene from './scenes/GameScene.js';
import MenuScene from './scenes/MenuScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1200,
  height: 550,
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
  scene: [BootScene, PreLoadScene, MenuScene, GameScene]
};

new Phaser.Game(config);
