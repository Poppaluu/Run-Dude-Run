export default class TileBuilder {
  constructor(scene, tileSize = 32) {
    this.scene = scene;
    this.T = tileSize;

    // groups where tiles will go
    this.ground = scene.physics.add.staticGroup();
    this.platforms = scene.physics.add.staticGroup();
  }

  // === GROUND: grass top + mud layers ===
  buildGround(rows = 3) {
    const width = this.scene.scale.width;
    const columns = Math.ceil(width / this.T) + 1;

    const topY = this.scene.scale.height - rows * this.T;

    for (let x = 0; x < columns; x++) {
      const worldX = x * this.T;

      // Grass tile top
      this._placeTile(this.ground, worldX, topY, 'grass_tile');

      // Mud below (rows-1 layers)
      for (let y = 1; y < rows; y++) {
        this._placeTile(this.ground, worldX, topY + y * this.T, 'mud_tile');
      }
    }
  }

  // === WOOD PLATFORM: end – mid – mid – flipped end ===
  buildWoodPlatform(startX, y, length = 4) {
    // left end
    this._placeTile(this.platforms, startX, y, 'platform_wood_end');

    // mid pieces
    for (let i = 1; i < length - 1; i++) {
      this._placeTile(this.platforms, startX + i * this.T, y, 'platform_wood');
    }

    // right end (flipped)
    this._placeTile(this.platforms, startX + (length - 1) * this.T, y, 'platform_wood_end', true);
  }

  // === internal helper ===
  _placeTile(group, x, y, key, flipX = false) {
    const tile = group.create(x, y, key).setOrigin(0, 0).setFlipX(flipX);
    tile.refreshBody();
    return tile;
  }
}
