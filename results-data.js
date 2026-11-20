// Held-out scores (%) from the main paper, Table 3. Display scores to one decimal place.
window.EVOVIM_RESULTS = {
  tasks: [
    {"key": "cards", "label": "Card Matching", "episodes": 5},
    {"key": "dmv", "label": "DMV-Hard", "episodes": 10},
    {"key": "gallery", "label": "MC Gallery", "episodes": 10},
    {"key": "maze", "label": "Poster Maze", "episodes": 10},
    {"key": "tetris", "label": "Tetris", "episodes": 5},
    {"key": "pacman", "label": "Pac-Man", "episodes": 5},
  ],
  models: [
    {
      key: "gpt",
      label: "GPT-6.1 Sol",
      rows: [
        {"method": "No memory", "scores": [0.3, 0.0, 25.0, 25.0, 34.7, 45.3], "average": 21.7},
        {"method": "Rolling summary", "scores": [8.6, 1.7, 11.3, 17.5, 51.1, 42.6], "average": 22.1},
        {"method": "Hand-crafted text", "scores": [0.8, 11.3, 25.0, 17.5, 36.9, 44.5], "average": 22.7},
        {"method": "Hand-crafted visual", "scores": [2.8, 9.2, 25.0, 17.5, 38.9, 42.0], "average": 22.6},
        {"method": "AutoMem", "scores": [13.6, 41.3, 23.8, 75.0, 40.4, 31.6], "average": 37.6},
        {"method": "EvoViM", "scores": [100.0, 97.5, 65.0, 66.3, 45.8, 38.6], "average": 68.9},
      ],
    },
    {
      key: "haiku",
      label: "Claude Haiku 5.5",
      rows: [
        {"method": "No memory", "scores": [0.3, 0.0, 22.5, 22.5, 37.6, 31.8], "average": 19.1},
        {"method": "Rolling summary", "scores": [7.8, 0.4, 23.8, 18.8, 41.5, 32.9], "average": 20.9},
        {"method": "Hand-crafted text", "scores": [7.5, 22.1, 23.8, 8.8, 32.9, 46.3], "average": 23.6},
        {"method": "Hand-crafted visual", "scores": [4.4, 13.8, 15.0, 18.8, 36.3, 40.1], "average": 21.4},
        {"method": "AutoMem", "scores": [63.6, 42.1, 23.8, 16.3, 31.9, 42.4], "average": 36.7},
        {"method": "EvoViM", "scores": [100.0, 77.1, 98.8, 50.0, 75.0, 61.1], "average": 77.0},
      ],
    },
    {
      key: "qwen",
      label: "Qwen3.8-27B",
      rows: [
        {"method": "No memory", "scores": [0.3, 0.0, 25.0, 25.0, 35.3, 27.0], "average": 18.8},
        {"method": "Rolling summary", "scores": [0.8, 2.1, 25.0, 22.5, 46.1, 32.7], "average": 21.5},
        {"method": "Hand-crafted text", "scores": [0.8, 16.3, 25.0, 22.5, 36.6, 27.4], "average": 21.4},
        {"method": "Hand-crafted visual", "scores": [1.1, 7.9, 23.8, 23.8, 38.3, 39.1], "average": 22.3},
        {"method": "AutoMem", "scores": [13.3, 37.9, 25.0, 17.5, 42.0, 42.1], "average": 29.6},
        {"method": "EvoViM", "scores": [100.0, 45.4, 96.3, 70.0, 99.1, 52.4], "average": 77.2},
      ],
    },
  ],
};
