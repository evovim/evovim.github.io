# Figure 1 tool traces

All six examples refer to the held-out episodes in EvoViM, Figure 1. The website presents a walkthrough of recorded tool behavior. Short source excerpts link to the evolved functions used in each task.

| Task | Source episode | Evidence in the walkthrough |
| --- | --- | --- |
| Card Matching | Qwen3.8-27B, seed 47 | Face crops came from actual flips. The four pixel differences were recomputed with the evolved alignment function on the figure crops. The suggested flip and removed pair appear in the recorded interaction. |
| DMV-Hard | Claude Haiku 5.5, seed 52, step 42 | The catalog sheet contains the 20 stored thumbnails from session 1. The question, the two aligned windows, the ranking and the winning page come from the same episode. |
| Minecraft Gallery | Claude Haiku 5.5, seed 43, step 18 | The question and stored view are original episode images. The similarity heatmap was recomputed with the evolved matcher. The overlay marks the returned best window on the full view. |
| Poster Maze | GPT-6.1 Sol, seed 48, step 39 | The image and marked camera region are from the question and its matched view. The two-cell diagram illustrates the saved pose and the program’s tracked open and blocked edges. |
| Tetris | Qwen3.8-27B, seed 47, steps 30–33 | The two gameplay images bracket the real moves. The middle board renders the cells and projected landing in the step-30 plan. |
| Pac-Man | Qwen3.8-27B, seed 43, step 30 | The game image comes from the recorded step. The magnified map is drawn from the wall grid, pellet state and route recovered by replaying the evolved program. The first-move hint agrees with the recorded prompt. |

The source asset manifest lives at `paper_figures/teaser_v18_20261103/assets/SOURCES.md` in the research workspace. The gallery question is `paper_figures/framework_v8_assets/test_s43_step18_question1.png`. The maze and board fields used for the drawings are in `paper_figures/teaser_v18_20261103/data/`.
