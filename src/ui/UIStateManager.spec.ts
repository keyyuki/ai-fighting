import { describe, test, expect, beforeEach } from "vitest";
import { UIStateManager } from "./UIStateManager";
import { GameState } from "./UIManager";
import { UIComponent } from "./UIComponent";
import { Timer } from "./Timer";
import { RoundIndicator } from "./RoundIndicator";

// Mock classes
class MockUIComponent implements UIComponent {
  private visible: boolean = false;

  constructor() {
    this.visible = false;
  }

  update(deltaTime: number): void {}
  render(ctx: CanvasRenderingContext2D): void {}
  setVisible(visible: boolean): void {
    this.visible = visible;
  }
  isVisible(): boolean {
    return this.visible;
  }
}

// Modify the instanceof behavior for Timer
Object.defineProperty(Timer, Symbol.hasInstance, {
  value: (obj: any) => obj.__isTimer,
});

class MockTimer extends MockUIComponent implements Timer {
  private running: boolean = false;
  private currentTime: number = 0;
  private startTime: number = 0;
  public __isTimer = true; // Add this property to make instanceof work

  reset(): void {
    this.currentTime = this.startTime;
  }

  start(): void {
    this.running = true;
  }

  pause(): void {
    this.running = false;
  }

  getTime(): number {
    return this.currentTime;
  }

  isRunning(): boolean {
    return this.running;
  }
}

// Modify the instanceof behavior for RoundIndicator
Object.defineProperty(RoundIndicator, Symbol.hasInstance, {
  value: (obj: any) => obj.__isRoundIndicator,
});

class MockRoundIndicator extends MockUIComponent implements RoundIndicator {
  private currentRound: number = 0;
  private player1Wins: number = 0;
  private player2Wins: number = 0;
  public __isRoundIndicator = true; // Add this property to make instanceof work

  startRound(roundNumber: number): void {
    this.currentRound = roundNumber;
  }

  getCurrentRound(): number {
    return this.currentRound;
  }

  addPlayerWin(playerNumber: 1 | 2): number {
    if (playerNumber === 1) {
      return ++this.player1Wins;
    } else {
      return ++this.player2Wins;
    }
  }

  isMatchWinner(playerNumber: 1 | 2): boolean {
    if (playerNumber === 1) {
      return this.player1Wins >= 2;
    } else {
      return this.player2Wins >= 2;
    }
  }
}

describe("UIStateManager", () => {
  let stateManager: UIStateManager;
  let components: Map<string, UIComponent>;
  let mainMenu: MockUIComponent;
  let characterSelect: MockUIComponent;
  let pauseMenu: MockUIComponent;
  let player1HealthBar: MockUIComponent;
  let player2HealthBar: MockUIComponent;
  let timer: MockTimer;
  let roundIndicator: MockRoundIndicator;

  beforeEach(() => {
    // Set up components
    components = new Map<string, UIComponent>();

    mainMenu = new MockUIComponent();
    characterSelect = new MockUIComponent();
    pauseMenu = new MockUIComponent();
    player1HealthBar = new MockUIComponent();
    player2HealthBar = new MockUIComponent();
    timer = new MockTimer();
    roundIndicator = new MockRoundIndicator();

    components.set("mainMenu", mainMenu);
    components.set("characterSelect", characterSelect);
    components.set("pauseMenu", pauseMenu);
    components.set("player1HealthBar", player1HealthBar);
    components.set("player2HealthBar", player2HealthBar);
    components.set("timer", timer);
    components.set("roundIndicator", roundIndicator);

    stateManager = new UIStateManager(components);
  });

  test("initial state should be MAIN_MENU", () => {
    expect(stateManager.getGameState()).toBe(GameState.MAIN_MENU);
  });

  test("switching to MAIN_MENU shows only main menu", () => {
    stateManager.switchToState(GameState.MAIN_MENU);

    expect(mainMenu.isVisible()).toBe(true);
    expect(characterSelect.isVisible()).toBe(false);
    expect(pauseMenu.isVisible()).toBe(false);
    expect(player1HealthBar.isVisible()).toBe(false);
  });

  test("switching to CHARACTER_SELECT shows only character select", () => {
    stateManager.switchToState(GameState.CHARACTER_SELECT);

    expect(mainMenu.isVisible()).toBe(false);
    expect(characterSelect.isVisible()).toBe(true);
    expect(pauseMenu.isVisible()).toBe(false);
    expect(player1HealthBar.isVisible()).toBe(false);
  });

  test("switching to GAMEPLAY shows gameplay UI and starts timer and round", () => {
    stateManager.switchToState(GameState.GAMEPLAY);

    expect(mainMenu.isVisible()).toBe(false);
    expect(characterSelect.isVisible()).toBe(false);
    expect(player1HealthBar.isVisible()).toBe(true);
    expect(player2HealthBar.isVisible()).toBe(true);
    expect(timer.isVisible()).toBe(true);
    expect(roundIndicator.isVisible()).toBe(true);

    // Timer should be reset and started
    expect(timer.isRunning()).toBe(true);

    // Round indicator should start at round 1
    expect(roundIndicator.getCurrentRound()).toBe(1);
  });

  test("switching to PAUSED shows gameplay UI and pause menu and pauses timer", () => {
    stateManager.switchToState(GameState.GAMEPLAY);
    stateManager.switchToState(GameState.PAUSED);

    expect(mainMenu.isVisible()).toBe(false);
    expect(characterSelect.isVisible()).toBe(false);
    expect(player1HealthBar.isVisible()).toBe(true);
    expect(player2HealthBar.isVisible()).toBe(true);
    expect(timer.isVisible()).toBe(true);
    expect(roundIndicator.isVisible()).toBe(true);
    expect(pauseMenu.isVisible()).toBe(true);

    // Timer should be paused
    expect(timer.isRunning()).toBe(false);
  });

  test("pauseGame only works when in GAMEPLAY state", () => {
    stateManager.switchToState(GameState.MAIN_MENU);
    stateManager.pauseGame();
    expect(stateManager.getGameState()).toBe(GameState.MAIN_MENU);

    stateManager.switchToState(GameState.GAMEPLAY);
    stateManager.pauseGame();
    expect(stateManager.getGameState()).toBe(GameState.PAUSED);
  });

  test("resumeGame only works when in PAUSED state", () => {
    stateManager.switchToState(GameState.GAMEPLAY);
    stateManager.pauseGame();
    expect(stateManager.getGameState()).toBe(GameState.PAUSED);

    stateManager.resumeGame();
    expect(stateManager.getGameState()).toBe(GameState.GAMEPLAY);

    stateManager.switchToState(GameState.MAIN_MENU);
    stateManager.resumeGame();
    expect(stateManager.getGameState()).toBe(GameState.MAIN_MENU);
  });

  test("can set and get selected characters", () => {
    expect(stateManager.getSelectedCharacters()).toBe(null);

    stateManager.setSelectedCharacters("fighter1", "fighter2");

    expect(stateManager.getSelectedCharacters()).toEqual({
      p1: "fighter1",
      p2: "fighter2",
    });
  });
});
