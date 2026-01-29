
window.OfficeDnD.systems.buildRegions = (mapGrid) => {
  const height = mapGrid.length;
  const width = mapGrid[0]?.length ?? 0;
  const cellToRegion = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => null),
  );
  const regions = [];

  const inBounds = (x, y) => y >= 0 && y < height && x >= 0 && x < width;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const code = mapGrid[y][x];
      if (!code || cellToRegion[y][x] !== null) {
        continue;
      }

      const regionId = regions.length;
      const stack = [{ x, y }];
      const cells = [];
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let anchorCell = { x, y };

      while (stack.length > 0) {
        const current = stack.pop();
        if (!current) break;
        const { x: cx, y: cy } = current;
        if (!inBounds(cx, cy)) continue;
        if (cellToRegion[cy][cx] !== null) continue;
        if (mapGrid[cy][cx] !== code) continue;

        cellToRegion[cy][cx] = regionId;
        cells.push({ x: cx, y: cy });

        if (cy < anchorCell.y || (cy === anchorCell.y && cx < anchorCell.x)) {
          anchorCell = { x: cx, y: cy };
        }

        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);

        stack.push(
          { x: cx + 1, y: cy },
          { x: cx - 1, y: cy },
          { x: cx, y: cy + 1 },
          { x: cx, y: cy - 1 },
        );
      }

      regions.push({
        code,
        cells,
        bounds: {
          minX,
          maxX,
          minY,
          maxY,
        },
        anchorCell,
      });
    }
  }

  const neighborSets = Array.from({ length: regions.length }, () => new Set());

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const regionId = cellToRegion[y][x];
      if (regionId === null) continue;

      const neighbors = [
        { x: x + 1, y },
        { x: x - 1, y },
        { x, y: y + 1 },
        { x, y: y - 1 },
      ];

      neighbors.forEach(({ x: nx, y: ny }) => {
        if (!inBounds(nx, ny)) return;
        const neighborId = cellToRegion[ny][nx];
        if (neighborId === null || neighborId === regionId) return;
        neighborSets[regionId].add(neighborId);
      });
    }
  }

  const regionNeighbors = neighborSets.map((set) => Array.from(set));

  return {
    cellToRegion,
    regions,
    regionNeighbors,
  };
};
