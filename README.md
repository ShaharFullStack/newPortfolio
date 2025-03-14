# Shahar Maoz Portfolio

An immersive 3D portfolio showcasing my professional journey as both a Full Stack Developer and Music Educator.

## Overview

This portfolio utilizes Three.js and React to create an interactive 3D experience that highlights my dual background in technology and music. Visitors can navigate through different sections of the portfolio using an interactive particle-based navigation system, explore projects in a 3D workspace, and learn about my professional experience in an engaging environment.

## Features

### Immersive 3D Navigation
- Particle-based interactive menu system
- Smooth transitions between sections
- Intuitive controls with keyboard and mouse support

### Project Showcase
- 3D workspace environment displaying key projects
- Interactive project cards with detailed information
- Projects include:
  - 3D Flight Simulator
  - Balloon Game
  - GUI Tab Component Library
  - Vacation Management System

### About Me Experience
- Interactive biography with visual storytelling
- Dual representation of technology and music backgrounds
- Animated elements showcasing skills and experience

### Contact Section
- Professional contact information
- Links to GitHub, LinkedIn, and other platforms
- Interactive elements representing communication channels

## Technology Stack

- **Frontend**: React, TypeScript
- **3D Rendering**: Three.js
- **Routing**: React Router
- **Styling**: CSS/SCSS
- **Performance Optimization**: Custom resource caching and frame management

## Performance Optimizations

This portfolio implements several optimizations to ensure smooth performance across devices:

- Resource caching for geometries, materials, and textures
- Adaptive rendering quality based on device capabilities
- Frame rate management to prevent performance degradation
- Efficient memory cleanup to prevent leaks
- Throttled event handlers for window resizing

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
   ```
   git clone https://github.com/ShaharFullStack/portfolio.git
   cd portfolio
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   npm start
   ```

4. Build for production
   ```
   npm run build
   ```

## Project Structure

```
portfolio/
├── public/             # Static assets
├── src/
│   ├── components/     # React components
│   │   ├── UI/         # Common UI elements
│   │   ├── Scenes/     # 3D scenes for each section
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── assets/         # Images, models, and other assets
│   ├── styles/         # Global styles
│   ├── App.tsx         # Main application component
│   └── index.tsx       # Application entry point
└── README.md           # Project documentation
```

## Browser Support

The portfolio is optimized for modern browsers that support WebGL:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Mobile devices with WebGL support will experience a simplified version of the portfolio with reduced performance demands.

## Future Enhancements

- Additional interactive project demonstrations
- Expanded musical elements and audio integration
- AR/VR support for immersive portfolio exploration
- Dynamic data loading for projects and experience sections

## About Me

I am a Full Stack Developer combining creativity and technology. With over 15 years as a musician and educator, I bring a unique perspective to software development, blending technical expertise with artistic thinking.

Skilled in JavaScript, TypeScript, React, Node.js, SQL, Docker, and AI technologies, I focus on building innovative, user-friendly solutions. My background in teaching sharpens my ability to collaborate effectively and explain complex ideas clearly.

## Contact

- Email: rakloze@gmail.com
- LinkedIn: www.linkedin.com/in/shaharmaozh
- GitHub: github.com/ShaharFullStack

## License

This project is licensed under the MIT License - see the LICENSE file for details.
