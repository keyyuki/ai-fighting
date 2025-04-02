import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { UIManager, GameState } from "./UIManager";
import { MainMenu } from "./MainMenu";
import { CharacterSelectMenu } from "./CharacterSelectMenu";
import { PauseMenu } from "./PauseMenu";
import { UIStateManager } from "./UIStateManager";
import { UIEventHandler } from "./UIEventHandler";
import { GameUIManager } from "./GameUIManager";
import { HealthBar } from "./HealthBar";
import { Timer } from "./Timer";
import { RoundIndicator } from "./RoundIndicator";
import { ComboCounter } from "./ComboCounter";

// Mocks for all dependencies
vi.mock("./MainMenu");
vi.mock("./CharacterSelectMenu");
vi.mock("./PauseMenu");
vi.mock("./UIStateManager");
vi.mock("./UIEventHandler");
vi.mock("./GameUIManager");

describe("UIManager", () => {
  let uiManager: UIManager;
  let mockCanvas: any;
  let mockStateManager: ReturnType<typeof vi.mocked<UIStateManager>>;
  let mockEventHandler: ReturnType<typeof vi.mocked<UIEventHandler>>;
  let mockGameUIManager: ReturnType<typeof vi.mocked<GameUIManager>>;

  beforeEach(() => {
    // Create a mock canvas instead of using document.createElement
    mockCanvas = {
      width: 800,
      height: 600,
      getContext: vi.fn().mockReturnValue({}),
    };

    // Set up mock implementations for MainMenu, CharacterSelectMenu, PauseMenu
    const MockMainMenu = MainMenu as unknown as ReturnType<
      typeof vi.mocked<typeof MainMenu>
    >;
    const MockCharacterSelectMenu =
      CharacterSelectMenu as unknown as ReturnType<
        typeof vi.mocked<typeof CharacterSelectMenu>
      >;
    const MockPauseMenu = PauseMenu as unknown as ReturnType<
      typeof vi.mocked<typeof PauseMenu>
    >;

    MockMainMenu.mockImplementation(
      () =>
        ({
          update: vi.fn(),
          render: vi.fn(),
          setVisible: vi.fn(),
          isVisible: vi.fn(),
          handleMouseMove: vi.fn(),
          handleMouseDown: vi.fn(),
          handleMouseUp: vi.fn(),
        } as unknown as MainMenu)
    );

    MockCharacterSelectMenu.mockImplementation(
      () =>
        ({
          update: vi.fn(),
          render: vi.fn(),
          setVisible: vi.fn(),
          isVisible: vi.fn(),
          handleMouseMove: vi.fn(),
          handleMouseDown: vi.fn(),
          handleMouseUp: vi.fn(),
        } as unknown as CharacterSelectMenu)
    );

    MockPauseMenu.mockImplementation(
      () =>
        ({
          update: vi.fn(),
          render: vi.fn(),
          setVisible: vi.fn(),
          isVisible: vi.fn(),
          handleMouseMove: vi.fn(),
          handleMouseDown: vi.fn(),
          handleMouseUp: vi.fn(),
        } as unknown as PauseMenu)
    );

    // Mock UIStateManager
    const MockUIStateManager = UIStateManager as unknown as ReturnType<
      typeof vi.mocked<typeof UIStateManager>
    >;
    mockStateManager = {
      switchToState: vi.fn(),
      getGameState: vi.fn().mockReturnValue(GameState.MAIN_MENU),
      getSelectedCharacters: vi.fn(),
      setSelectedCharacters: vi.fn(),
      pauseGame: vi.fn(),
      resumeGame: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<UIStateManager>>;

    MockUIStateManager.mockImplementation(() => mockStateManager);

    // Mock UIEventHandler
    const MockUIEventHandler = UIEventHandler as unknown as ReturnType<
      typeof vi.mocked<typeof UIEventHandler>
    >;
    mockEventHandler = {
      destroy: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<UIEventHandler>>;

    MockUIEventHandler.mockImplementation(() => mockEventHandler);

    // Mock GameUIManager and its methods
    const mockHealthBars = {
      player1: {} as HealthBar,
      player2: {} as HealthBar,
    };

    const mockTimer = {} as Timer;
    const mockRoundIndicator = {} as RoundIndicator;
    const mockComboCounters = {
      player1: {} as ComboCounter,
      player2: {} as ComboCounter,
    };

    const MockGameUIManager = GameUIManager as unknown as ReturnType<
      typeof vi.mocked<typeof GameUIManager>
    >;
    mockGameUIManager = {
      setupGameUI: vi.fn(),
      getHealthBars: vi.fn().mockReturnValue(mockHealthBars),
      getTimer: vi.fn().mockReturnValue(mockTimer),
      getRoundIndicator: vi.fn().mockReturnValue(mockRoundIndicator),
      getComboCounters: vi.fn().mockReturnValue(mockComboCounters),
      incrementCombo: vi.fn().mockReturnValue(1),
      resetCombo: vi.fn(),
      addRoundWin: vi.fn().mockReturnValue(1),
      startRound: vi.fn(),
      isMatchWinner: vi.fn(),
      handleResize: vi.fn(),
      setTotalRounds: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<GameUIManager>>;

    MockGameUIManager.mockImplementation(() => mockGameUIManager);

    // Create UIManager instance
    uiManager = new UIManager(mockCanvas);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("constructor initializes all required components", () => {
    // Verify GameUIManager is created and setup
    expect(mockGameUIManager.setupGameUI).toHaveBeenCalled();

    // Verify initial state is set
    expect(mockStateManager.switchToState).toHaveBeenCalledWith(
      GameState.MAIN_MENU
    );
  });

  test("addComponent adds a component to the internal map", () => {
    const mockComponent = {
      update: vi.fn(),
      render: vi.fn(),
      setVisible: vi.fn(),
      isVisible: vi.fn(),
    };

    uiManager.addComponent("testComponent", mockComponent);

    // Get the component back to verify it was added
    const component = uiManager.getComponent("testComponent");
    expect(component).toBe(mockComponent);
  });

  test("removeComponent removes a component from the internal map", () => {
    const mockComponent = {
      update: vi.fn(),
      render: vi.fn(),
      setVisible: vi.fn(),
      isVisible: vi.fn(),
    };

    // First add a component
    uiManager.addComponent("testComponent", mockComponent);

    // Then remove it
    const result = uiManager.removeComponent("testComponent");

    expect(result).toBe(true);
    expect(uiManager.getComponent("testComponent")).toBeUndefined();

    // Removing a non-existent component returns false
    const result2 = uiManager.removeComponent("nonExistent");
    expect(result2).toBe(false);
  });

  test("update calls update on the right components based on game state", () => {
    // Get references to private properties using any type assertion
    const uiManagerAny = uiManager as any;
    const mainMenu = uiManagerAny.mainMenu;
    const characterSelectMenu = uiManagerAny.characterSelectMenu;
    const pauseMenu = uiManagerAny.pauseMenu;

    // Test main menu state
    mockStateManager.getGameState.mockReturnValue(GameState.MAIN_MENU);
    uiManager.update(16);
    expect(mainMenu.update).toHaveBeenCalledWith(16);

    // Test character select state
    mockStateManager.getGameState.mockReturnValue(GameState.CHARACTER_SELECT);
    uiManager.update(16);
    expect(characterSelectMenu.update).toHaveBeenCalledWith(16);

    // Test pause menu state
    mockStateManager.getGameState.mockReturnValue(GameState.PAUSED);
    uiManager.update(16);
    expect(pauseMenu.update).toHaveBeenCalledWith(16);
  });

  test("render calls render on the right components based on game state", () => {
    // Mock canvas context
    const mockCtx = {} as CanvasRenderingContext2D;

    // Get references to private properties
    const uiManagerAny = uiManager as any;
    const mainMenu = uiManagerAny.mainMenu;
    const characterSelectMenu = uiManagerAny.characterSelectMenu;
    const pauseMenu = uiManagerAny.pauseMenu;

    // Test main menu state
    mockStateManager.getGameState.mockReturnValue(GameState.MAIN_MENU);
    uiManager.render(mockCtx);
    expect(mainMenu.render).toHaveBeenCalledWith(mockCtx);

    // Test character select state
    mockStateManager.getGameState.mockReturnValue(GameState.CHARACTER_SELECT);
    uiManager.render(mockCtx);
    expect(characterSelectMenu.render).toHaveBeenCalledWith(mockCtx);

    // Test pause menu state
    mockStateManager.getGameState.mockReturnValue(GameState.PAUSED);
    uiManager.render(mockCtx);
    expect(pauseMenu.render).toHaveBeenCalledWith(mockCtx);
  });

  test("delegates getHealthBars to gameUIManager", () => {
    uiManager.getHealthBars();
    expect(mockGameUIManager.getHealthBars).toHaveBeenCalled();
  });

  test("delegates getTimer to gameUIManager", () => {
    uiManager.getTimer();
    expect(mockGameUIManager.getTimer).toHaveBeenCalled();
  });

  test("delegates getRoundIndicator to gameUIManager", () => {
    uiManager.getRoundIndicator();
    expect(mockGameUIManager.getRoundIndicator).toHaveBeenCalled();
  });

  test("delegates getComboCounters to gameUIManager", () => {
    uiManager.getComboCounters();
    expect(mockGameUIManager.getComboCounters).toHaveBeenCalled();
  });

  test("delegates incrementCombo to gameUIManager", () => {
    uiManager.incrementCombo(1);
    expect(mockGameUIManager.incrementCombo).toHaveBeenCalledWith(1);

    uiManager.incrementCombo(2);
    expect(mockGameUIManager.incrementCombo).toHaveBeenCalledWith(2);
  });

  test("delegates resetCombo to gameUIManager", () => {
    uiManager.resetCombo(1);
    expect(mockGameUIManager.resetCombo).toHaveBeenCalledWith(1);

    uiManager.resetCombo(2);
    expect(mockGameUIManager.resetCombo).toHaveBeenCalledWith(2);
  });

  test("delegates addRoundWin to gameUIManager", () => {
    uiManager.addRoundWin(1);
    expect(mockGameUIManager.addRoundWin).toHaveBeenCalledWith(1);

    uiManager.addRoundWin(2);
    expect(mockGameUIManager.addRoundWin).toHaveBeenCalledWith(2);
  });

  test("delegates startRound to gameUIManager", () => {
    uiManager.startRound(2);
    expect(mockGameUIManager.startRound).toHaveBeenCalledWith(2);
  });

  test("delegates isMatchWinner to gameUIManager", () => {
    mockGameUIManager.isMatchWinner.mockReturnValueOnce(true);

    const result = uiManager.isMatchWinner(1);
    expect(mockGameUIManager.isMatchWinner).toHaveBeenCalledWith(1);
    expect(result).toBe(true);
  });

  test("delegates getSelectedCharacters to stateManager", () => {
    mockStateManager.getSelectedCharacters.mockReturnValue({
      p1: "fighter1",
      p2: "fighter2",
    });

    const result = uiManager.getSelectedCharacters();
    expect(mockStateManager.getSelectedCharacters).toHaveBeenCalled();
    expect(result).toEqual({ p1: "fighter1", p2: "fighter2" });
  });

  test("delegates pauseGame to stateManager", () => {
    uiManager.pauseGame();
    expect(mockStateManager.pauseGame).toHaveBeenCalled();
  });

  test("delegates resumeGame to stateManager", () => {
    uiManager.resumeGame();
    expect(mockStateManager.resumeGame).toHaveBeenCalled();
  });

  test("destroy cleans up event handler", () => {
    uiManager.destroy();
    expect(mockEventHandler.destroy).toHaveBeenCalled();
  });

  test("handleResize updates canvas dimensions and recreates components", () => {
    const MockMainMenu = MainMenu as unknown as ReturnType<
      typeof vi.mocked<typeof MainMenu>
    >;
    const MockCharacterSelectMenu =
      CharacterSelectMenu as unknown as ReturnType<
        typeof vi.mocked<typeof CharacterSelectMenu>
      >;
    const MockPauseMenu = PauseMenu as unknown as ReturnType<
      typeof vi.mocked<typeof PauseMenu>
    >;
    const MockUIEventHandler = UIEventHandler as unknown as ReturnType<
      typeof vi.mocked<typeof UIEventHandler>
    >;

    // Clear constructor call counts
    vi.mocked(MockMainMenu).mockClear();
    vi.mocked(MockCharacterSelectMenu).mockClear();
    vi.mocked(MockPauseMenu).mockClear();
    vi.mocked(MockUIEventHandler).mockClear();

    // Call handleResize
    uiManager.handleResize(1024, 768);

    // Canvas dimensions should be updated
    expect(mockCanvas.width).toBe(1024);
    expect(mockCanvas.height).toBe(768);

    // GameUIManager should handle resize
    expect(mockGameUIManager.handleResize).toHaveBeenCalledWith(1024, 768);

    // New menu instances should be created
    expect(MockMainMenu).toHaveBeenCalledWith(1024, 768);
    expect(MockCharacterSelectMenu).toHaveBeenCalledWith(1024, 768);
    expect(MockPauseMenu).toHaveBeenCalledWith(1024, 768);

    // Event handler should be recreated
    expect(mockEventHandler.destroy).toHaveBeenCalled(); // Clean up old one
    expect(MockUIEventHandler).toHaveBeenCalled();

    // Current state should be preserved
    expect(mockStateManager.switchToState).toHaveBeenCalledWith(
      mockStateManager.getGameState()
    );
  });

  test("setTotalRounds updates totalRounds and delegates to gameUIManager", () => {
    uiManager.setTotalRounds(5);

    // Should update GameUIManager
    expect(mockGameUIManager.setTotalRounds).toHaveBeenCalledWith(5);
  });
});
