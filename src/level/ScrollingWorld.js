import HealthPickup from '../pickups/HealthPickup.js';
import SpeedPickup from '../pickups/SpeedPickup.js';
import JumpPickup from '../pickups/JumpPickup.js';
import EnemyPlaceholder from '../entities/EnemyPlaceholder.js';

export default class ScrollingWorld {
  constructor(scene, tileSize = 32, scrollSpeed = 150) {
    this.scene = scene;
    this.T = tileSize;
    this.scrollSpeed = scrollSpeed;

    // Physics groups for solid things
    this.ground = scene.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    this.platforms = scene.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    // Pickups: normal group
    this.pickups = scene.add.group();

    // Enemies: physics group
    this.enemies = scene.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    this.groundRows = 3;
    this.groundTopY = scene.scale.height - this.groundRows * this.T;

    this.nextGroundX = 0;
    this.lastWasHole = false;

    // Tunable spawn chances
    this.holeChance = 0.50;
    this.platformOverHoleChance = 0.4;
    this.platformOverGroundChance = 0.1;
    this.enemyChance = 0.1;
    this.pickupOnPlatformChance = 0.5;

    this._initialFill();
  }

  // Fill enough tiles at the start to cover and extend past the screen
  _initialFill() {
    while (this._getRightmostX() < this.scene.scale.width + this.T * 4) {
      this._spawnRandomColumn();
    }
  }

  // Find the furthest X among ground + platforms
  _getRightmostX() {
    let max = 0;
    const checkGroup = (group) => {
      group.getChildren().forEach(obj => {
        if (obj.x > max) max = obj.x;
      });
    };

    checkGroup(this.ground);
    checkGroup(this.platforms);

    return max;
  }

  // One column (or several) of world: either ground stack or a hole
  _spawnRandomColumn() {
    const canMakeHole = !this.lastWasHole;
    const makeHole = canMakeHole && Math.random() < this.holeChance;

    if (makeHole) {
      this.lastWasHole = true;

      // Make bigger holes: 2–3 tiles wide
      const holeWidth = 2 + Math.floor(Math.random() * 2); // 2 or 3

      // Put a platform over the hole, at a random height
      if (Math.random() < this.platformOverHoleChance) {
        const platformHeightOffset = 2 + Math.floor(Math.random() * 10); // change height the platforms are put to
        const platformY = this.groundTopY - this.T * platformHeightOffset;
        this._spawnWoodPlatform(this.nextGroundX, platformY);
      }

      this.nextGroundX += this.T * holeWidth;
      return;
    }

    this.lastWasHole = false;

    // Make a stack of grass + mud at nextGroundX
    for (let row = 0; row < this.groundRows; row++) {
      const key = row === 0 ? 'grass_tile' : 'mud_tile';
      const tile = this.ground.create(
        this.nextGroundX,
        this.groundTopY + row * this.T,
        key
      );
      tile.setOrigin(0, 0);
      tile.body.setVelocityX(-this.scrollSpeed);
    }

    // Put a platform on top of ground by chance
    if (Math.random() < this.platformOverGroundChance) {
      const platformHeightOffset = 2 + Math.floor(Math.random() * 10); // change height the platforms are put to
      const platformY = this.groundTopY - this.T * platformHeightOffset;
      this._spawnWoodPlatform(this.nextGroundX, platformY);
    }

    // Spawn enemies by random
    if (Math.random() < this.enemyChance) {
      const enemy = new EnemyPlaceholder(
        this.scene,
        this.nextGroundX + this.T / 2,
        this.groundTopY - 8
      );
      enemy.setScrollSpeed(this.scrollSpeed);
      this.enemies.add(enemy);
    }

    this.nextGroundX += this.T;
  }

  // Wood platform: 4 tiles wide – end, mid, mid, flipped end
  _spawnWoodPlatform(startX, y) {
    // left end
    this._createPlatformTile(startX, y, 'platform_wood_end', false);

    // middle tiles
    this._createPlatformTile(startX + this.T, y, 'platform_wood', false);
    this._createPlatformTile(startX + this.T * 2, y, 'platform_wood', false);

    // right end flipped
    this._createPlatformTile(
      startX + this.T * 3,
      y,
      'platform_wood_end',
      true
    );

    // Put a pickup on the platform (middle area) (chance)
    if (Math.random() < this.pickupOnPlatformChance) {
      const centerX = startX + this.T * 2;
      const pickupY = y - this.T * 0.5;

      const roll = Math.random();
      let pickup;

      if (roll < 0.33) {
        pickup = new HealthPickup(this.scene, centerX, pickupY);
      } else if (roll < 0.66) {
        pickup = new SpeedPickup(this.scene, centerX, pickupY);
      } else {
        pickup = new JumpPickup(this.scene, centerX, pickupY);
      }

      // Give it an Arcade body and make it scroll left
      this.scene.physics.add.existing(pickup); // dynamic body
      pickup.body.setAllowGravity(false);
      pickup.body.setImmovable(true);
      pickup.body.setVelocityX(-this.scrollSpeed);

      this.pickups.add(pickup);
    }
  }

  _createPlatformTile(x, y, key, flipX) {
    const tile = this.platforms.create(x, y, key);
    tile.setOrigin(0, 0);
    tile.setFlipX(flipX);
    tile.body.setVelocityX(-this.scrollSpeed);
    return tile;
  }

  // Called from GameScene.update()
  update() {
    // Despawn anything that has gone off the left side
    this._cleanupGroup(this.ground);
    this._cleanupGroup(this.platforms);
    this._cleanupGroup(this.pickups);
    this._cleanupGroup(this.enemies);

    // Ensure we always have world extending past the right edge
    while (this._getRightmostX() < this.scene.scale.width + this.T * 2) {
      this._spawnRandomColumn();
    }
  }

  _cleanupGroup(group) {
    group.getChildren().forEach(obj => {
      if (obj.x + this.T < 0) {
        obj.destroy();
      }
    });
  }
}
