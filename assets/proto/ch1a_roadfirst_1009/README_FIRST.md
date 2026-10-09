# Road-first Blockout — Chapter1 Pattern A

- 01_road_geometry.svg: editable 1024×1536 vector with **42 real-width stone-floor polygons**, gates, pier symbols, non-walkable terrain; this is an engineering blockout, not the MASTER artwork.
- 02_walkable_geometry.json: matching 42 surface polygons, endpoints, z grade, physical neighbors, support categories, and source Phase1.8 node IDs.
- 03_anchor_and_segment_map.csv: 42-row pairing of source segment endpoints and proposed blockout coordinates, with artwork verification explicitly pending.
- 04_validation_report.md: independent pass/review gates and what is NOT proven.
- 05_iphone_6nodes_preview.png: real SVG crop at iPhone proportions, **not** gameplay.
- 06_48_states_original_graph_check.csv: all 48 conditional original directed-graph state results.
- 07_validation_machine.json: machine-readable QA results.
- 08_validate_roadfirst.py: rerun script; exact paths relative to the ZIP contents.
- 09_original_source_graph.json: full original 299 node / 370 edge graph, unchanged, for validation/reproducibility. Keep Phase1.8 node coordinates tagged as design-only.

**Approval boundaries**: proposed vector floor geometry tested; final 3D scenery and art-alignment not tested. No production MASTER. Do not treat SVG as final in-game scene.
- 10_standalone_test_log.json: reproduced standalone geometry/topology tests (17/17 PASS at delivery), separate from generator's 13/13 check log.
- 11_overview_visual_check.png: full blockout visualization for quick review; not an artwork MASTER.

**Important:** The iPhone crop is only a composition/scale example and does not yet prove six actual game nodes are visible. Road ramps, support symbols and z-levels are editable *proposals*, not verified 3D architecture. The returned 48-state test refers to source-directed graph and its conditional filters; game play/camera/economy remains untested.
