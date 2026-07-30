---
name: dnd-kit drop detection
description: Kanban drags "sprong terug" — fix via pointer-based collision detection
---
Rule: for kanban boards with wide cards and column droppables (@dnd-kit/core), pass a custom `collisionDetection` of `pointerWithin` with `rectIntersection` fallback to `DndContext`.

**Why:** the default `rectIntersection` resolves drops by card-rect overlap; a wide card still overlaps its SOURCE column most, so `over.id` is the source phase and the card snaps back even though the move-API fires with 200.

**How to apply:** any dnd-kit board (Salesflow etc.). Symptom to recognize: drag works, PATCH fires, but phase never changes / card returns to origin column.
