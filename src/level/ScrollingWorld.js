// src/level/ScrollingWorld.js
import TileBuilder from './TileBuilder.js';

export default class ScrollingWorld {
  constructor(scene, tileSize = 32, scrollSpeed = 150) {
    this.scene = scene;
    this.T = tileSize;
    this.scrollSpeed = scrollSpeed;
    this.spawnedPlatforms = [];
	this.spawnedSpikes = [];

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
    this.platformChanceIncreasePerColumn = 0.004; // how much to increase per ground column recycled
    this.platformChanceDecreaseOnSpawn = 0.25;     // drop chance to zero and below
    this.groundSinceLastPlatform = 0;        // how many columns since last platform
	
	// negative chances - Determines if spawning platform or obstacle.
	this.negativeChance = 0;
	
    // Other obstacles
    this.obstacleChances = {
      platform: () => this.platformChance,
      // placeholders for future obstacles:
      spike: 0.0,
      flyingEnemy: 0.0,
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
        tile.body.setVelocityX(-this.scrollSpeed);
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
          tile.body.setVelocityX(-this.scrollSpeed);
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
          tile.body.setVelocityX(-this.scrollSpeed);
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
		  tile.body.setVelocityX(-this.scrollSpeed);
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

  update() {
    this.groundSpawn();
    this.platformSpawn();
    this._cleanupPlatforms();

    // this.spawnSpikes();
    // this.spawnFlyingEnemies();
    // this.spawnEnemy()
  }
}
