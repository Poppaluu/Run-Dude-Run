import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // loading text
    this.add.text(20, 20, 'Loading...', { fontSize: '28px', fill: '#ffffff' });

    // platform and ground tiles
    this.load.image('grass_tile', 'assets/images/platforms/grass_tile.png');
    this.load.image('mud_tile', 'assets/images/platforms/mud_tile.png');
    this.load.image('platform_wood', 'assets/images/platforms/platform_wood.png');
    this.load.image('platform_wood_end', 'assets/images/platforms/platform_wood_end.png');

    //player sprite

    //enemy sprite

  }

  create() {
    this.scene.start('GameScene');
  }
}
