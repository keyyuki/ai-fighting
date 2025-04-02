import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { UIEventHandler } from "./UIEventHandler";
import { MainMenu } from "./MainMenu";
import { CharacterSelectMenu } from "./CharacterSelectMenu";
import { PauseMenu } from "./PauseMenu";
import { UIStateManager } from "./UIStateManager";
import { GameState } from "./UIManager";

// Mock classes
vi.mock("./UIStateManager");
vi.mock("./MainMenu");
vi.mock("./CharacterSelectMenu");
vi.mock("./PauseMenu");

describe("UIEventHandler", () => {
  let eventHandler: UIEventHandler;
  let mockCanvas: any;
  let mockMainMenu: ReturnType<typeof vi.mocked<MainMenu>>;
  let mockCharacterSelectMenu: ReturnType<
    typeof vi.mocked<CharacterSelectMenu>
  >;
  let mockPauseMenu: ReturnType<typeof vi.mocked<PauseMenu>>;
  let mockStateManager: ReturnType<typeof vi.mocked<UIStateManager>>;
  let canvasRect: DOMRect;

  beforeEach(() => {
    // Create mocks
    mockCanvas = {
      width: 800,
      height: 600,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };

    // Define getBoundingClientRect to return consistent dimensions
    canvasRect = {
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    };
    mockCanvas.getBoundingClientRect = vi.fn().mockReturnValue(canvasRect);

    // Mock window event listeners
    vi.stubGlobal("window", {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    // Create mock implementations
    mockMainMenu = {
      update: vi.fn(),
      render: vi.fn(),
      setVisible: vi.fn(),
      isVisible: vi.fn(),
      handleMouseMove: vi.fn(),
      handleMouseDown: vi.fn(),
      handleMouseUp: vi.fn(),
      onStartGame: null,
      onCharacterSelect: null,
      onQuit: null,
    } as unknown as ReturnType<typeof vi.mocked<MainMenu>>;

    mockCharacterSelectMenu = {
      update: vi.fn(),
      render: vi.fn(),
      setVisible: vi.fn(),
      isVisible: vi.fn(),
      handleMouseMove: vi.fn(),
      handleMouseDown: vi.fn(),
      handleMouseUp: vi.fn(),
      onBack: null,
      onStartFight: null,
    } as unknown as ReturnType<typeof vi.mocked<CharacterSelectMenu>>;

    mockPauseMenu = {
      update: vi.fn(),
      render: vi.fn(),
      setVisible: vi.fn(),
      isVisible: vi.fn(),
      handleMouseMove: vi.fn(),
      handleMouseDown: vi.fn(),
      handleMouseUp: vi.fn(),
      onResume: null,
      onQuit: null,
    } as unknown as ReturnType<typeof vi.mocked<PauseMenu>>;

    mockStateManager = {
      getGameState: vi.fn(),
      switchToState: vi.fn(),
      setSelectedCharacters: vi.fn(),
      getSelectedCharacters: vi.fn(),
      pauseGame: vi.fn(),
      resumeGame: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<UIStateManager>>;

    // Create handler with mocks
    eventHandler = new UIEventHandler(
      mockCanvas,
      mockMainMenu,
      mockCharacterSelectMenu,
      mockPauseMenu,
      mockStateManager
    );
  });

  afterEach(() => {
    eventHandler.destroy();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  test("sets up event listeners on canvas", () => {
    expect(mockCanvas.addEventListener).toHaveBeenCalledTimes(3);
    expect(window.addEventListener).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
  });

  test("removes event listeners on destroy", () => {
    eventHandler.destroy();
    expect(mockCanvas.removeEventListener).toHaveBeenCalledTimes(3);
    expect(window.removeEventListener).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
  });

  test("main menu callbacks correctly switch state", () => {
    // Handle the callbacks directly since we can't easily test events
    mockStateManager.getGameState.mockReturnValue(GameState.MAIN_MENU);

    // Call the callbacks that should have been set up
    if (mockMainMenu.onStartGame) mockMainMenu.onStartGame();
    expect(mockStateManager.switchToState).toHaveBeenCalledWith(
      GameState.GAMEPLAY
    );

    mockStateManager.switchToState.mockClear();
    if (mockMainMenu.onCharacterSelect) mockMainMenu.onCharacterSelect();
    expect(mockStateManager.switchToState).toHaveBeenCalledWith(
      GameState.CHARACTER_SELECT
    );
  });

  test("character select callbacks correctly switch state", () => {
    mockStateManager.getGameState.mockReturnValue(GameState.CHARACTER_SELECT);

    if (mockCharacterSelectMenu.onBack) mockCharacterSelectMenu.onBack();
    expect(mockStateManager.switchToState).toHaveBeenCalledWith(
      GameState.MAIN_MENU
    );

    mockStateManager.switchToState.mockClear();
    if (mockCharacterSelectMenu.onStartFight)
      mockCharacterSelectMenu.onStartFight("fighter1", "fighter2");
    expect(mockStateManager.setSelectedCharacters).toHaveBeenCalledWith(
      "fighter1",
      "fighter2"
    );
    expect(mockStateManager.switchToState).toHaveBeenCalledWith(
      GameState.GAMEPLAY
    );
  });

  test("pause menu callbacks correctly switch state", () => {
    mockStateManager.getGameState.mockReturnValue(GameState.PAUSED);

    if (mockPauseMenu.onResume) mockPauseMenu.onResume();
    expect(mockStateManager.switchToState).toHaveBeenCalledWith(
      GameState.GAMEPLAY
    );

    mockStateManager.switchToState.mockClear();
    if (mockPauseMenu.onQuit) mockPauseMenu.onQuit();
    expect(mockStateManager.switchToState).toHaveBeenCalledWith(
      GameState.MAIN_MENU
    );
  });

  test("handles mouse movement based on current state", () => {
    // For this test, we'll need to directly call the handler methods
    // since we can't use real DOM events in the test environment

    // Call the mousemove handler directly with coordinates
    const mouseX = 100;
    const mouseY = 200;

    // Test mouse move in main menu state
    mockStateManager.getGameState.mockReturnValue(GameState.MAIN_MENU);
    // Get the handler instance
    const handler = eventHandler as any;
    // Call the method directly
    handler.handleMouseMove({ clientX: mouseX, clientY: mouseY });
    expect(mockMainMenu.handleMouseMove).toHaveBeenCalledWith(mouseX, mouseY);

    // Test mouse move in character select state
    mockStateManager.getGameState.mockReturnValue(GameState.CHARACTER_SELECT);
    handler.handleMouseMove({ clientX: mouseX, clientY: mouseY });
    expect(mockCharacterSelectMenu.handleMouseMove).toHaveBeenCalledWith(
      mouseX,
      mouseY
    );

    // Test mouse move in paused state
    mockStateManager.getGameState.mockReturnValue(GameState.PAUSED);
    handler.handleMouseMove({ clientX: mouseX, clientY: mouseY });
    expect(mockPauseMenu.handleMouseMove).toHaveBeenCalledWith(mouseX, mouseY);
  });

  test("Escape key toggles between gameplay and pause states", () => {
    // For this test, we'll need to directly call the handler methods
    // since we can't use real DOM events in the test environment

    // Get the handler instance
    const handler = eventHandler as any;

    // Test pause from gameplay
    mockStateManager.getGameState.mockReturnValue(GameState.GAMEPLAY);
    // Call the keydown handler directly
    handler.handleKeyDown({ key: "Escape" });
    expect(mockStateManager.switchToState).toHaveBeenCalledWith(
      GameState.PAUSED
    );

    // Test resume from pause
    mockStateManager.getGameState.mockReturnValue(GameState.PAUSED);
    mockStateManager.switchToState.mockClear();
    handler.handleKeyDown({ key: "Escape" });
    expect(mockStateManager.switchToState).toHaveBeenCalledWith(
      GameState.GAMEPLAY
    );

    // Test Escape has no effect in main menu
    mockStateManager.getGameState.mockReturnValue(GameState.MAIN_MENU);
    mockStateManager.switchToState.mockClear();
    handler.handleKeyDown({ key: "Escape" });
    expect(mockStateManager.switchToState).not.toHaveBeenCalled();
  });
});
