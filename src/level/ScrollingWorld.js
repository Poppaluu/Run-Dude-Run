// src/level/ScrollingWorld.js
import TileBuilder from './TileBuilder.js';
import FlyingEnemy from '../entities/FlyingEnemy.js';

export default class ScrollingWorld {
  constructor(scene, tileSize = 32, scrollSpeed = 150) {
    this.scene = scene;
    this.T = tileSize;
    this.scrollSpeed = scrollSpeed;

    this.baseScrollSpeed = scrollSpeed;
    this.scrollSpeed = scrollSpeed;
    this.maxScrollSpeed = 350;

    this.maxDifficulty = 120;

    this.spawnedPlatforms = [];
	  this.spawnedSpikes = [];
    this.spawnedEnemies = [];

    this.tileBuilder = new TileBuilder(scene, tileSize);

    // Solid ground group
    this.ground = scene.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    // Platform group
    this.platforms = scene.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    // Pickup group
    this.pickups = scene.add.group();

    // Enemy group
    this.enemies = scene.physics.add.group({
      allowGravity: false,
      immovable: true
    });
	
	// Spikes group
	this.spikes = scene.physics.add.group({
	  allowGravity: false,
	  immovable: true
	});

    this.groundRows = 3;

    // platform chances
    this.platformChance = 0.005;              // current chance per update
    this.platformChanceMin = 0.0001;          // never go below this
    this.platformChanceMax = 0.25;           // never go above this
    this.platformChanceIncreasePerColumn = 0.0004; // how much to increase per ground column recycled
    this.platformChanceDecreaseOnSpawn = 0.25;     // drop chance to zero and below
    this.groundSinceLastPlatform = 0;        // how many columns since last platform
	
    // negative chances - Determines if spawning platform or obstacle.
    this.negativeChance = 0;
    this.enemyChance = 0.01;
    this.enemyChanceMin = 0.01;
    this.enemyChanceMax = 0.10;
	
    // Other obstacles
    this.obstacleChances = {
      platform: () => this.platformChance,
      // placeholders for future obstacles:
      spike: 0.0,
      flyingEnemy: () => this.enemyChance
      
    };

    this._initGround();
  }

  // Fill the screen with ground columns, built by TileBuilder.
  _initGround() {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // how many vertical columns do we need to cover the screen + a bit extra
    this.numColumns = Math.ceil(width / this.T) + 2;
    this.groundColumns = [];

    // top Y of the ground (3 rows high by default)
    this.groundTopY = height - this.groundRows * this.T;

    for (let col = 0; col < this.numColumns; col++) {
      const x = col * this.T;

      // use TileBuilder to create this column
      const columnTiles = this.tileBuilder.buildGroundColumn(
        this.ground,
        x,
        this.groundTopY,
        this.groundRows
      );

      // give every tile a scrolling velocity to the left
      columnTiles.forEach(tile => {
        tile.body.setVelocityX(-150);
        tile.body.allowGravity = false;
        tile.body.immovable = true;
      });

      this.groundColumns.push(columnTiles);
    }
  }

  // Increase platform chance as ground recycles
  _increasePlatformChance() {
    this.platformChance = Math.min(
      this.platformChanceMax,
      this.platformChance + this.platformChanceIncreasePerColumn
    );
  }

  // Decrease platform chance right after a spawn
  _decreasePlatformChanceOnSpawn() {
    this.platformChance = Math.max(
      this.platformChanceMin,
      this.platformChance - this.platformChanceDecreaseOnSpawn
    );
    this.groundSinceLastPlatform = 0;
  }

  groundSpawn() {
    const totalWidth = this.numColumns * this.T;

    this.groundColumns.forEach((columnTiles, index) => {
      const leftGroundColumn = columnTiles[0];

      // when the whole column has gone off the left side
      if (leftGroundColumn.x + this.T < 0) {
        // X position where the new column should appear (far right)
        const newX = leftGroundColumn.x + totalWidth;

        // destroy the old tiles
        columnTiles.forEach(tile => tile.destroy());

        // build a fresh ground column using TileBuilder
        const newColumn = this.tileBuilder.buildGroundColumn(
          this.ground,
          newX,
          this.groundTopY,
          this.groundRows
        );

        // give them scrolling velocity again
        newColumn.forEach(tile => {
          tile.body.setVelocityX(-150);
          tile.body.allowGravity = false;
          tile.body.immovable = true;
        });

        // replace the entry in the array
        this.groundColumns[index] = newColumn;

        // track distance since last platform & ramp chance up slowly
        this.groundSinceLastPlatform++;
        this._increasePlatformChance();
      }
    });
  }

  // This both handles platform and spikes. 
  platformSpawn() {
    if (Math.random() < this.platformChance) {
		const width = this.scene.scale.width;

		const newX = width + this.T;

		const minLength = 3;
		const maxLength = 7;
		const length = minLength + Math.floor(Math.random() * (maxLength - minLength + 1));

		const minRowsAboveGround = 4;
		const maxRowsAboveGround = 10;
		const rowsAboveGround =
		minRowsAboveGround + Math.floor(Math.random() * (maxRowsAboveGround - minRowsAboveGround + 1));

		const newY = this.groundTopY - rowsAboveGround * this.T;	
	  if(this.negativeChance < 3) {
        // returns an array of tile sprites
        const platformTiles = this.tileBuilder.buildWoodPlatform(
          this.platforms,
          newX,
          newY,
          length
        );

        platformTiles.forEach(tile => {
          tile.body.setVelocityX(-150);
          tile.body.allowGravity = false;
          tile.body.immovable = true;
        });

        // track the entire platform as one unit
        this.spawnedPlatforms.push(platformTiles);

        // reduce spawn chance
        this._decreasePlatformChanceOnSpawn();
		this.negativeChance++;
	  }
	  else {
		// returns an array of tile sprites
		const spikesTiles = this.tileBuilder.buildSpikes(
		  this.spikes,
		  newX,
		  newY,
		  length
		);
		
		spikesTiles.forEach(tile => {
		  tile.body.setVelocityX(-150);
		  tile.body.allowGravity = false;
		  tile.body.immovable = true;
		});
		
		// track the entire spikes as one unit
		this.spawnedSpikes.push(spikesTiles);
		
		// reduce spawn chance, shares same with platform
		this._decreasePlatformChanceOnSpawn();
		this.negativeChance = 0;
	  }	
	}
  }
  


  spawnEnemy() {
    if (Math.random() < this.enemyChance) {
      const width = this.scene.scale.width;
      const newX = width + this.T;

      const minRowsAboveGround = 2;
      const maxRowsAboveGround = 12;

      const rowsAboveGround =
        minRowsAboveGround +
        Math.floor(Math.random() * (maxRowsAboveGround - minRowsAboveGround + 1));

      const newY = this.groundTopY - rowsAboveGround * this.T;

      const flyingEnemy = new FlyingEnemy(this.scene, newX, newY);

      // add to physics group if you plan collisions vs player
      this.enemies.add(flyingEnemy);

      flyingEnemy.setScrollSpeed(this.scrollSpeed + 100);

      this.spawnedEnemies.push(flyingEnemy);
    }
  }

  _cleanupPlatforms() {
    const leftLimit = -this.T * 2;

    this.spawnedPlatforms = this.spawnedPlatforms.filter(platformTiles => {
      const rightmost = platformTiles[platformTiles.length - 1];

      if (rightmost.x < leftLimit) {
        // destroy whole platform
        platformTiles.forEach(tile => tile.destroy());
        return false; // remove from array
      }

      return true; // keep it
    });
	
	this.spawnedSpikes = this.spawnedSpikes.filter(spikesTiles => {
	  const rightmost = spikesTiles[spikesTiles.length - 1];
	  
	  if (rightmost.x < leftLimit) {
		//destroy whole spikes
		spikesTiles.forEach(tile => tile.destroy());
		return false; // remove from array
	  }
	  
	  return true; // keep it
	});
  }

  _cleanupEnemies() {
    const leftLimit = -this.T * 2;

    this.spawnedEnemies = this.spawnedEnemies.filter(flyingEnemy => {
      if (flyingEnemy.x < leftLimit) {
        flyingEnemy.destroy();
        return false;
      }
      return true;
    });
  }

  _updateEnemies() {
    this.spawnedEnemies.forEach(enemy => enemy.update(this.scene.time.now));
  }

  _updateDifficulty(playTimeSeconds) {
    // How long until max difficulty
    const rampDuration = this.maxDifficulty;
    const t = Math.min(playTimeSeconds / rampDuration, 1); // 0 → 1

    // Scroll speed ramps from base → max
    this.scrollSpeed =
      this.baseScrollSpeed +
      t * (this.maxScrollSpeed - this.baseScrollSpeed);

    // Enemy spawn chance ramps from min → max
    this.enemyChance =
      this.enemyChanceMin +
      t * (this.enemyChanceMax - this.enemyChanceMin);
  }

  _applyScrollSpeed() {
    const sx = -this.scrollSpeed;

    // ground tiles
    /*
    this.ground.children.iterate(tile => {
      if (tile && tile.body) {
        tile.body.setVelocityX(sx);
      }
    });
    

    // platforms
    this.platforms.children.iterate(tile => {
      if (tile && tile.body) {
        tile.body.setVelocityX(sx);
      }
    });

    // spikes
    this.spikes.children.iterate(tile => {
      if (tile && tile.body) {
        tile.body.setVelocityX(sx);
      }
    });
    */

    // flying enemies (use their helper if available)
    this.spawnedEnemies.forEach(enemy => {
      if (enemy.setScrollSpeed) {
        enemy.setScrollSpeed(this.scrollSpeed + 100);
      } else if (enemy.body) {
        enemy.body.setVelocityX(-(this.scrollSpeed + 100));
      }
    });
  }

  update() {
    // read elapsed time
    const playTime = this.scene.playTime || 0;

    // adjust scroll speed + enemy chance from time
    this._updateDifficulty(playTime);
    this._applyScrollSpeed();

    this.groundSpawn();

    this.platformSpawn();
    this._cleanupPlatforms();

    this.spawnEnemy();
    this._cleanupEnemies();
    this._updateEnemies();
  }
}
