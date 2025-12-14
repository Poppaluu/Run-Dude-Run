import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player'); // use the aseprite texture key

    // add to scene & enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);

    // Match the frame size from your JSON (32x48)
    this.body.setSize(32, 48);
    this.body.setOffset(0, 0); // adjust if needed

    // --- Player Stats ---
    this.stats = {
      health: 100,
      maxHealth: 100,
      moveSpeed: 250,
      jumpVelocity: -400
    };

    // --- Jump Logic ---
    this.baseMaxJumps = 2;
    this.maxJumps = this.baseMaxJumps;
    this.jumpCount = 0;
    this.extraJumpActive = false;

    // --- Dash Logic ---
    this.dashSpeed = 1000;         // how fast the dash moves
    this.dashDuration = 175;      // milliseconds
    this.dashCooldown = 600;      // milliseconds after dash
    this.isDashing = false;
    this.canDash = true;

    // double-tap timing
    this.doubleTapThreshold = 250; // ms within which taps count
    this.lastTapTimeLeft = 0;
    this.lastTapTimeRight = 0;

    // --- Input ---
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keyA = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyS = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

    // Start in idle
    this.anims.play('Idle');
  }

  handleDash() {
    const now = this.scene.time.now;

    const leftDown = Phaser.Input.Keyboard.JustDown(this.cursors.left) ||
                    Phaser.Input.Keyboard.JustDown(this.keyA);

    const rightDown = Phaser.Input.Keyboard.JustDown(this.cursors.right) ||
                      Phaser.Input.Keyboard.JustDown(this.keyD);

    // Detect double-tap LEFT
    if (leftDown) {
      if (now - this.lastTapTimeLeft < this.doubleTapThreshold && this.canDash) {
        this.startDash(-1);  // dash left
      }
      this.lastTapTimeLeft = now;
    }

    // Detect double-tap RIGHT
    if (rightDown) {
      if (now - this.lastTapTimeRight < this.doubleTapThreshold && this.canDash) {
        this.startDash(1);  // dash right
      }
      this.lastTapTimeRight = now;
    }
  }

  startDash(direction) {
    this.isDashing = true;
    this.canDash = false;

    // lock velocity for dash
    this.body.setVelocityX(direction * this.dashSpeed);

    // Optional: lock gravity slightly so dash is clean
    this.body.setAllowGravity(false);

    // End dash after duration
    this.scene.time.delayedCall(this.dashDuration, () => {
      this.isDashing = false;
      this.body.setAllowGravity(true);
    });

    // Reset dash availability after cooldown
    this.scene.time.delayedCall(this.dashCooldown, () => {
      this.canDash = true;
    });
  }

  update() {
    const body = this.body;

    // horizontal movement
    const left = this.cursors.left.isDown || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;
    
    if (!this.isDashing) {
      if (left) {
        body.setVelocityX(-this.stats.moveSpeed);
        this.setFlipX(true);
      } else if (right) {
        body.setVelocityX(this.stats.moveSpeed);
        this.setFlipX(false);
      } else {
        body.setVelocityX(0);
      }
    }

    // jumping
    const onGround = body.blocked.down || body.touching.down;

    if (onGround) {
      this.jumpCount = 0;
    }

    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.keyW);

    if (jumpPressed && this.jumpCount < this.maxJumps) {
      body.setVelocityY(this.stats.jumpVelocity);
      this.jumpCount++;

      if (this.extraJumpActive && this.jumpCount === this.maxJumps) {
        this.extraJumpActive = false;
        this.maxJumps = this.baseMaxJumps;
      }
    }

    // down movement (drop & fast fall)
    if (Phaser.Input.Keyboard.JustDown(this.keyS)) {
      this.dropThrough = true;
      this.scene.time.delayedCall(200, () => {
        this.dropThrough = false;
      });
    }

    if (this.keyS.isDown && !this.body.blocked.down) {
      this.body.setVelocityY(500); // fast fall
    }

    this.handleDash();

    // Animation logic
    if (!onGround) {
      this.anims.play('Running', true);
    } else if (body.velocity.x !== 0) {
      this.anims.play('Running', true);
    } else {
      this.anims.play('Idle', true);
    }
  }

  // player pickup methods
  heal(amount) {
    this.stats.health = Math.min(this.stats.health + amount, this.stats.maxHealth);
  }

  addSpeed(amount) {
    this.stats.moveSpeed += amount;
  }

  grantExtraJump() {
    if (!this.extraJumpActive) {
      this.extraJumpActive = true;
      this.maxJumps = this.baseMaxJumps + 1;
    }
  }
}
