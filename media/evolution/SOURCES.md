# Gallery program evolution

The development images come from the Claude Haiku 5.5 experiment in `haiku_mc_ours_20261017`, MC Gallery, line M, development episode 42. They are WebP renditions of the original observations and saved patches collected for the paper’s lineage figure. The questions and scores are from the recorded runs.

| Web image | Lineage figure asset |
| --- | --- |
| question | q8_f00023.png |
| door-four | gen2_view_door4_f00006.png |
| match | gen2_match_crop_f00006.png |
| crop-1R, crop-3R, crop-7L | gen1_crop_1R_f00001.png, gen1_crop_3R_f00004.png, gen1_crop_7L_f00012.png |
| crop-6L | gen1_best_crop_6L_f00010.png |

The walkthrough opens with [the starting program’s original step 6 frame](../framework/practice-door4.webp), from `baseline/evidence/units/42_0/attempts/a001/frames/f00006.png`. The door-four image in the table comes from the later whole-view program’s own walk. At step 23 all three programs received the same query image. [The whole-view matcher’s complete return](../framework/practice-recall.webp) shows that query followed by the candidate patches. It comes from `lines/M/generations/g2_fresh/evidence/units/42_0/attempts/a001/model_images/4862e71421371e66f1bb9d0a4ebbe04d0ed73fd7b650c6b65d688ffc8836273b.png`.

On question eight, the crop program had no saved region for door 4 and scored its best alternative, door 6 left, at 0.242. Its acceptance threshold was 0.45. Whole-view search returned view 0007, door 4 right, at 0.834. The highlighted box in the original 1280 × 720 frame is (696, 262) to (884, 450). The segment recreates these operations with the actual images. The mascot dialogue paraphrases the evidence.

Supplement Table 8 describes the lineage. The accepted programs scored 4, 13 and 16 of 16 answers across the two development walks. The final round’s two candidate gate records give 16 of 16 with increased steps and tokens, and 13 of 16. In the ten held-out runs of the retained program, only the first answer on seed 55 was incorrect.
