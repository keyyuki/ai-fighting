import { Menu } from "./Menu";
import { Button } from "./Button";

interface CharacterOption {
  id: string;
  name: string;
  thumbnail?: HTMLImageElement;
  selected: boolean;
  locked: boolean;
}

/**
 * Character Select Menu for choosing fighters
 */
export class CharacterSelectMenu extends Menu {
  private characters: CharacterOption[] = [];
  private selectedCharacter1: string | null = null;
  private selectedCharacter2: string | null = null;
  private isPlayerSelectingP1: boolean = true; // true = P1, false = P2
  private characterBoxSize: number = 100;
  private characterBoxSpacing: number = 20;
  private readyToFight: boolean = false;

  constructor(canvasWidth: number, canvasHeight: number) {
    super(0, 0, canvasWidth, canvasHeight, "SELECT YOUR CHARACTER");
    this.backgroundColor = "rgba(0, 0, 40, 0.9)";
    this.setupDefaultCharacters();
    this.setupButtons();
  }

  /**
   * Set up some default characters for the select screen
   */
  private setupDefaultCharacters(): void {
    // Add some placeholder characters
    this.characters = [
      { id: "fighter1", name: "Fighter A", selected: false, locked: false },
      { id: "fighter2", name: "Fighter B", selected: false, locked: false },
      { id: "fighter3", name: "Fighter C", selected: false, locked: false },
      { id: "fighter4", name: "Fighter D", selected: false, locked: false },
      { id: "fighter5", name: "Fighter E", selected: false, locked: true },
      { id: "fighter6", name: "Fighter F", selected: false, locked: true },
    ];
  }

  /**
   * Add characters with their thumbnails
   */
  public addCharacter(
    id: string,
    name: string,
    thumbnail?: HTMLImageElement,
    locked: boolean = false
  ): void {
    this.characters.push({
      id,
      name,
      thumbnail,
      selected: false,
      locked,
    });
  }

  /**
   * Set up the character select buttons
   */
  private setupButtons(): void {
    const buttonWidth = 200;
    const buttonHeight = 50;

    // Start button at the bottom
    const startButton = new Button(
      (this.width - buttonWidth) / 2,
      this.height - buttonHeight - 30,
      buttonWidth,
      buttonHeight,
      "START BATTLE",
      () => {
        if (this.selectedCharacter1 && this.selectedCharacter2) {
          this.readyToFight = true;
          if (this.onStartFight) {
            this.onStartFight(this.selectedCharacter1, this.selectedCharacter2);
          }
        }
      },
      "⚔️" // Sword icon
    );

    // Back button in the bottom left
    const backButton = new Button(
      30,
      this.height - buttonHeight - 30,
      150,
      buttonHeight,
      "BACK",
      () => {
        if (this.onBack) this.onBack();
      },
      "←" // Back arrow icon
    );

    this.addButton(startButton);
    this.addButton(backButton);
  }

  /**
   * Handle character selection
   * @param mouseX Mouse X position
   * @param mouseY Mouse Y position
   */
  public handleCharacterSelection(mouseX: number, mouseY: number): void {
    if (!this.visible) return;

    // Calculate the grid layout for character boxes
    const gridStartX =
      (this.width - 3 * (this.characterBoxSize + this.characterBoxSpacing)) / 2;
    const gridStartY = 150;

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const index = row * 3 + col;
        if (index >= this.characters.length) continue;

        const character = this.characters[index];
        if (character.locked) continue;

        const boxX =
          gridStartX + col * (this.characterBoxSize + this.characterBoxSpacing);
        const boxY =
          gridStartY + row * (this.characterBoxSize + this.characterBoxSpacing);

        // Check if mouse is inside this character box
        if (
          mouseX >= boxX &&
          mouseX <= boxX + this.characterBoxSize &&
          mouseY >= boxY &&
          mouseY <= boxY + this.characterBoxSize
        ) {
          // Select this character for the current player
          if (this.isPlayerSelectingP1) {
            this.selectedCharacter1 = character.id;

            // If P2 hasn't selected yet, switch to P2
            if (!this.selectedCharacter2) {
              this.isPlayerSelectingP1 = false;
            }
          } else {
            this.selectedCharacter2 = character.id;

            // If P1 hasn't selected yet, switch to P1
            if (!this.selectedCharacter1) {
              this.isPlayerSelectingP1 = true;
            }
          }

          // Update the selected state for visual feedback
          this.characters.forEach((c) => {
            c.selected =
              c.id === this.selectedCharacter1 ||
              c.id === this.selectedCharacter2;
          });
        }
      }
    }
  }

  /**
   * Handle mouse up event, including character selection
   * @param mouseX Mouse X position
   * @param mouseY Mouse Y position
   */
  public handleMouseUp(mouseX: number, mouseY: number): void {
    super.handleMouseUp(mouseX, mouseY);
    this.handleCharacterSelection(mouseX, mouseY);
  }

  // Event callbacks
  public onStartFight?: (character1Id: string, character2Id: string) => void;
  public onBack?: () => void;

  /**
   * Render the character select screen
   * @param ctx Canvas rendering context
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    // Draw background
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Draw title
    ctx.font = "bold 48px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(this.title, this.x + this.width / 2, this.y + 30);

    // Draw player selection indicator
    ctx.font = "24px Arial";
    ctx.fillStyle = this.isPlayerSelectingP1 ? "#4488ff" : "#ff4444";
    ctx.fillText(
      `${
        this.isPlayerSelectingP1 ? "PLAYER 1" : "PLAYER 2"
      } - SELECT YOUR CHARACTER`,
      this.x + this.width / 2,
      this.y + 100
    );

    // Draw character grid
    this.drawCharacterGrid(ctx);

    // Draw player selections
    ctx.font = "20px Arial";

    // P1 selection
    ctx.fillStyle = "#4488ff";
    ctx.textAlign = "left";
    const p1Character = this.selectedCharacter1
      ? this.characters.find((c) => c.id === this.selectedCharacter1)?.name ||
        "Unknown"
      : "Not Selected";
    ctx.fillText(`P1: ${p1Character}`, 50, this.height - 100);

    // P2 selection
    ctx.fillStyle = "#ff4444";
    ctx.textAlign = "right";
    const p2Character = this.selectedCharacter2
      ? this.characters.find((c) => c.id === this.selectedCharacter2)?.name ||
        "Unknown"
      : "Not Selected";
    ctx.fillText(`P2: ${p2Character}`, this.width - 50, this.height - 100);

    // Draw ready to fight message if both players selected
    if (this.selectedCharacter1 && this.selectedCharacter2) {
      ctx.font = "bold 36px Arial";
      ctx.fillStyle = "#ffcc00";
      ctx.textAlign = "center";
      ctx.fillText("READY TO FIGHT!", this.width / 2, this.height - 150);
    }

    // Draw buttons
    this.buttons.forEach((button) => {
      if (button.isVisible()) {
        button.render(ctx);
      }
    });
  }

  /**
   * Draw the character selection grid
   * @param ctx Canvas rendering context
   */
  private drawCharacterGrid(ctx: CanvasRenderingContext2D): void {
    const gridStartX =
      (this.width - 3 * (this.characterBoxSize + this.characterBoxSpacing)) / 2;
    const gridStartY = 150;

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const index = row * 3 + col;
        if (index >= this.characters.length) continue;

        const character = this.characters[index];
        const boxX =
          gridStartX + col * (this.characterBoxSize + this.characterBoxSpacing);
        const boxY =
          gridStartY + row * (this.characterBoxSize + this.characterBoxSpacing);

        // Determine box style based on character state
        let boxColor = "#333333";
        let borderColor = "#555555";

        if (character.locked) {
          boxColor = "#222222";
          borderColor = "#444444";
        } else if (character.id === this.selectedCharacter1) {
          boxColor = "#224488";
          borderColor = "#4488ff";
        } else if (character.id === this.selectedCharacter2) {
          boxColor = "#882222";
          borderColor = "#ff4444";
        } else if (character.selected) {
          boxColor = "#448844";
          borderColor = "#88ff88";
        }

        // Draw character box
        ctx.fillStyle = boxColor;
        ctx.fillRect(boxX, boxY, this.characterBoxSize, this.characterBoxSize);

        // Draw border
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(
          boxX,
          boxY,
          this.characterBoxSize,
          this.characterBoxSize
        );

        // Draw character thumbnail if available
        if (character.thumbnail) {
          ctx.drawImage(
            character.thumbnail,
            boxX + 5,
            boxY + 5,
            this.characterBoxSize - 10,
            this.characterBoxSize - 20
          );
        } else {
          // Draw placeholder icon if no thumbnail
          ctx.fillStyle = "#666666";
          ctx.fillRect(
            boxX + 10,
            boxY + 10,
            this.characterBoxSize - 20,
            this.characterBoxSize - 40
          );

          // Draw character icon
          ctx.font = "36px Arial";
          ctx.fillStyle = "#cccccc";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            "👤",
            boxX + this.characterBoxSize / 2,
            boxY + this.characterBoxSize / 2 - 10
          );
        }

        // Draw character name
        ctx.font = "14px Arial";
        ctx.fillStyle = character.locked ? "#666666" : "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(
          character.name,
          boxX + this.characterBoxSize / 2,
          boxY + this.characterBoxSize - 5
        );

        // Draw locked icon if character is locked
        if (character.locked) {
          ctx.font = "36px Arial";
          ctx.fillStyle = "#aaaaaa";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            "🔒",
            boxX + this.characterBoxSize / 2,
            boxY + this.characterBoxSize / 2
          );
        }
      }
    }
  }
}
