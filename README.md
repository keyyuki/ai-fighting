# 2D Fighting Game

A modern browser-based 2D fighting game built with TypeScript and web technologies. This project features classic fighting mechanics with fluid animations, combo systems, and responsive controls.

## Features

- **Responsive Game Engine** - 60 FPS game loop with physics and collision detection
- **Multiple Characters** - Each with unique movesets and special abilities
- **Dynamic Combat System** - Combos, special moves, and blocking mechanics
- **Beautiful Stages** - Multiple fighting arenas with interactive elements
- **Local Multiplayer** - Challenge your friends on the same device
- **Sound Effects & Music** - Immersive audio experience

## Demo

[View the live demo](https://your-demo-url.com) _(Coming Soon)_

## Screenshots

_(Coming Soon)_

## Prerequisites

- Modern web browser (Chrome, Firefox, Safari, or Edge recommended)
- Node.js (v14.0.0 or higher)
- npm or yarn

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/fighting-game.git
   cd fighting-game
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal)

## How to Play

### Controls (Default)

#### Player 1:

- **Movement**: W, A, S, D
- **Light Attack**: J
- **Medium Attack**: K
- **Heavy Attack**: L
- **Special**: U, I, O

#### Player 2:

- **Movement**: Arrow Keys
- **Light Attack**: Numpad 1
- **Medium Attack**: Numpad 2
- **Heavy Attack**: Numpad 3
- **Special**: Numpad 4, 5, 6

_Note: Controller support is planned for future updates._

## Project Structure

```
fighting-game/
├── src/                       # Source code
│   ├── assets/                # Game assets
│   │   ├── characters/        # Character sprites and animations
│   │   ├── stages/            # Background images and elements
│   │   ├── audio/             # Sound effects and music
│   │   └── ui/                # UI elements and icons
│   ├── engine/                # Game engine implementation
│   │   ├── core/              # Core game loop and systems
│   │   ├── physics/           # Collision detection and physics
│   │   └── input/             # Input handling for keyboard/gamepad
│   ├── characters/            # Character implementations
│   │   ├── base/              # Base character class
│   │   └── [character-name]/  # Individual character implementations
│   ├── stages/                # Stage implementations
│   ├── ui/                    # UI components and screens
│   └── utils/                 # Utility functions and helpers
├── public/                    # Static files
├── index.html                 # Main HTML file
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run unit tests

## Technologies Used

- **TypeScript** - Strongly typed programming language
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Next generation frontend tooling
- **Howler.js** - Audio library

## Current Development Status

The game is currently in active development. Completed features include:

- ✅ Game engine with animation and collision systems
- ✅ Input management for keyboard/gamepad
- ✅ Audio services and asset loading utilities

In progress:

- 🔄 Character system and animation state machine
- 🔄 UI development (health bars, menus)
- 🔄 Game mechanics (combos, blocking, special moves)

See [TASK.md](TASK.md) for detailed development progress.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Background music and sound effects from [source]
- Sprite inspiration from [source]
- Special thanks to [contributors]
