# Krushka: Knight Rider

A pixel-art endless runner game for Telegram Mini Apps with 5 themed levels.

## Project Structure

```
krushka/
├── index.html      # Main HTML file with Telegram WebApp integration
├── styles.css      # Responsive styling
├── game.js         # Complete game logic
├── assets/         # Image assets folder
│   ├── README.md   # Asset requirements
│   ├── knight.png
│   ├── background_morning.png
│   ├── background_day.png
│   ├── background_sunrise.png
│   ├── background_sunset.png
│   ├── background_night.png
│   ├── ground.png
│   ├── fire.png
│   └── pit.png
└── README.md       # This file
```

## Running Locally

### Option 1: Direct File Opening
Simply open `index.html` in your web browser:
```bash
open ~/Downloads/krushka/index.html
```

### Option 2: Local Web Server (Recommended)
For better compatibility, use a local web server:

**Using Python 3:**
```bash
cd ~/Downloads/krushka
python3 -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

**Using Node.js (if installed):**
```bash
cd ~/Downloads/krushka
npx http-server -p 8000
```

## Game Controls

- **SPACE key** - Jump
- **Mouse Click** - Jump
- **Touch/Tap** - Jump (mobile)

## Game Features

- 5 themed levels: Morning, Day, Sunrise, Sunset, Night
- Progressive difficulty
- Score system
- Collision detection
- Level progression
- Game over and completion screens

## Deploying as Telegram Mini App

### Basic Steps:

1. **Host your files** on a web server (HTTPS required):
   - Use services like:
     - GitHub Pages (free)
     - Netlify (free)
     - Vercel (free)
     - Your own web server

2. **Create a Telegram Bot**:
   - Talk to [@BotFather](https://t.me/botfather) on Telegram
   - Create a new bot with `/newbot`
   - Get your bot token

3. **Set up Mini App**:
   - Use `/newapp` command with BotFather
   - Provide your hosted URL (must be HTTPS)
   - Set app title and description
   - Upload app icon

4. **Test your Mini App**:
   - Open your bot in Telegram
   - Click the menu button or use the bot command
   - Your game should load in Telegram's WebView

### Important Notes:

- **HTTPS is required** - Telegram Mini Apps only work over HTTPS
- **CORS headers** - Make sure your server allows requests from Telegram
- **Responsive design** - The game automatically scales to fit different screen sizes
- **Theme integration** - The game uses Telegram's theme colors if available

## Assets

The game works without custom images (uses procedural sprites), but you can add your own pixel-art assets to the `assets/` folder. See `assets/README.md` for details.

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Telegram WebView

## Development

No build process required! Just edit the files and refresh your browser.

- `game.js` - All game logic
- `styles.css` - Styling and layout
- `index.html` - HTML structure and Telegram integration




