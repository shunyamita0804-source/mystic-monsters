# Phase1.9 | Road-first validation (2026-10-09)

## Verdict
- **Vector blockout geometry:** PASS (13/13 checks)
- **Original Phase1.8 topology:** 299 nodes / 370 directed edges / 42 segments, original source used without editing
- **48 conditions:** 48/48 PASS under filtered Phase1.8 original directed edges
- **Real landscape / 3D architectural support:** NOT VERIFIED; no final MASTER has been adopted
- **299 node artwork re-registration:** NOT STARTED; original node positions must not be called art-aligned
- **40-turn probability, economy and fatigue:** NOT TESTED in this delivery

## What these tests prove
1. All 42 source segment IDs and their exact endpoints were transferred into editable walkable **polygons**, with width, bridge/stair support class and abstract z heights. XML group `segment_ID` and `floor_ID` can be edited independently.
2. Neighbor floors meet on named source anchors. There are 0 unintended surface collisions between nonadjacent corridors and 0 unregistered centerline crossings; overly wide junction tails outside 31px radius: 0.
3. Both gates have an uninterrupted stone-floor path: **C01→LOWER_GATE→C02** and **C03→UPPER_GATE→C04**. The blue water drawings are placed beside, not on, those walkable floors.
4. In the original event-conditioned **directed** graph, 48 combinations (two J0 choices × two Q parities × three H choices × two challenge rolls × two D_RAND gate states) all reach GOAL. Removing any of LOWER_GATE/Q/R/UPPER_GATE/RIVAL/H/FINAL disconnects START from GOAL in each state. Unvisited CHALLENGE outcomes still included in state enumeration, as required for the 48 product-state coverage.
5. The six reward branches are independent dead ends with the correct fork and endpoint, and return-direction edges exist. The optional D_RAND spur is nonessential to GOAL.

## What remains unverified
- These are **new engineering-floor coordinates**, initialized from Phase1.8's *design-only* XY; **they have not been traced on or matched to a painted MASTER**. ``PASS_VECTOR`` is not ``PASS_ART_PHYSICAL``.
- Piers, banks, rock bearing, handrails, stair risers, waterfall occlusion and camera perspective are **symbolic geometry**. The view is planimetric, not built 3D terrain; no proof of realistic bridge abutments from photoreal imagery.
- No actual collision engine, in-game 40T simulation, or 299 individual node coordinates migrated to final artwork. The file retains original `phase18_node_ids` only.
- `05_iphone_6nodes_preview.png` is a crop of the same SVG with mobile chrome added; **not a gameplay capture**.
- Segment z numbers are abstract terrace ranks, not physical meters. Changing heights later needs a clearance/grade check.

## Source provenance
- Phase1.8 zip: `MysticMonsters_Ch1A_Phase18_Topology_Design_20261009(1)(2).zip`, canonical `graph.json`.
- Phase1.9 input: `MysticMonsters_Ch1A_Phase19_RoadFirst_Handoff_20261009(1).zip` with 42-row CSV and rejected image. The rejected image was NOT used as ground-truth stone floor.

## Next one-way dependency
1. Confirm the **new road-first blueprint** as an editable structural starting point; if changed, modify SVG/JSON together and rerun tests.
2. Construct real cliffs/pier footprints, bridge abutments, portal-depth and landings around **fixed vector floors**, then inspect a single composite scene.
3. Only after this structural adoption: redraw/paint scenery behind the controlled paths, migrate individual 299 original nodes, retest all 48 configurations and 40T simulation, then consider formal MASTER approval.

## Test output
- Original 299 nodes / 370 directed edges / 42 segments: PASS
- 42 segment IDs exact match to supplied Phase1.9 CSV: PASS
- 42 nonzero valid floor polygons: PASS
- endpoint geometry touches exact declared anchors: PASS
- no unregistered centerline crossings: PASS
- no unregistered full-width floor intersections: PASS
- no excessive junction overlaps outside named anchor pads: PASS
- 6 independent reward dead ends and correct parent anchors: PASS
- 6 reward spurs + D_RAND have full return-directed edges: PASS
- 48 original-edge gated combinations reach GOAL and force gates/RIVAL: PASS
- 2 gate portals connected on stone polygon at named anchors: PASS
- Q->R direct segment absent: PASS
- RIVAL cannot be bypassed with H route: PASS

## Reproducibility / extra independent check
- Run `python 08_validate_roadfirst.py` to re-evaluate the delivered **SVG/JSON/CSV plus immutable original graph**. The generator originally reported 13/13 checks; the independent delivered-output validator performs 17 tests with results in `10_standalone_test_log.json`.
- NOTE: `05_iphone_6nodes_preview.png` is a sample camera-scale crop, not a verified 6-game-node capture. Actual framing must be assessed after per-node camera registration.
- This is a geometric 2D blockout. Heights and load-bearing pier foundations remain *conceptual*, not as-built proof. Do not infer art approval from any PASS flags.
