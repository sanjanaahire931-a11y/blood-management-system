// logistics_engine.js
/**
 * Logistics Optimization Engine for Blood Delivery
 * ------------------------------------------------
 * Provides routing and delivery‑mode decision utilities for transporting blood
 * between hospitals. The implementation is deliberately modular so that each
 * concern (routing, mode selection, ETA calculation) can be swapped out or
 * extended (e.g., real‑time traffic data, additional transport methods).
 *
 * Input model (simplified for this demo):
 *   - source: string – name/id of the source hospital
 *   - destination: string – name/id of the destination hospital
 *   - distance: number – direct distance in kilometres (used by the basic version)
 *   - urgencyLevel: 'low' | 'medium' | 'high' – clinical urgency
 *   - emergency: boolean – true forces the fastest possible delivery mode
 *
 * Advanced routing expects a graph representation:
 *   const graph = {
 *     nodes: { A: { name: 'Hospital A' }, B: { name: 'Hospital B' }, ... },
 *     edges: [ { from: 'A', to: 'B', distance: 12 }, ... ]
 *   };
 *
 * Exported API:
 *   - getBasicRoute(source, destination, distance)
 *   - dijkstra(graph, source, destination)
 *   - aStar(graph, source, destination, heuristicFn)
 *   - selectDeliveryMode(distance, urgencyLevel, emergency)
 *   - calculateETA(distance, mode)
 *   - planDelivery(params, options)
 */

/**
 * Basic route calculation – assumes a straight line between two points.
 * Returns an object containing the path (array of two nodes) and the travel time.
 */
function getBasicRoute(source, destination, distance) {
  // Assume average speed of 60 km/h for basic estimation.
  const averageSpeedKmh = 60;
  const travelTimeHours = distance / averageSpeedKmh;
  return {
    path: [source, destination],
    totalDistanceKm: distance,
    estimatedTimeHours: travelTimeHours,
  };
}

/**
 * Dijkstra's algorithm for shortest‑path on a weighted undirected graph.
 * @param {Object} graph - { nodes: {id: {...}}, edges: [{from, to, distance}] }
 * @param {string} start - source node id
 * @param {string} goal - destination node id
 * @returns {{ path: string[], totalDistanceKm: number }}
 */
function dijkstra(graph, start, goal) {
  const distances = {};
  const previous = {};
  const visited = new Set();
  const queue = new Set(Object.keys(graph.nodes));

  // Initialise distances
  for (const node of queue) {
    distances[node] = Infinity;
  }
  distances[start] = 0;

  while (queue.size) {
    // Pick node with smallest tentative distance
    let current = null;
    let minDist = Infinity;
    for (const node of queue) {
      if (distances[node] < minDist) {
        minDist = distances[node];
        current = node;
      }
    }
    if (current === null) break; // unreachable nodes remain
    if (current === goal) break; // reached destination

    queue.delete(current);
    visited.add(current);

    // Examine neighbours
    const neighbours = graph.edges.filter(
      (e) => e.from === current || e.to === current
    );
    for (const edge of neighbours) {
      const neighbor = edge.from === current ? edge.to : edge.from;
      if (visited.has(neighbor)) continue;
      const alt = distances[current] + edge.distance;
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        previous[neighbor] = current;
      }
    }
  }

  // Reconstruct path
  const path = [];
  let node = goal;
  if (previous[node] || node === start) {
    while (node) {
      path.unshift(node);
      node = previous[node];
    }
  }

  return {
    path,
    totalDistanceKm: distances[goal] !== Infinity ? distances[goal] : null,
  };
}

/**
 * A* pathfinding – similar to Dijkstra but adds a heuristic.
 * The heuristic function receives two node ids and should return an estimated
 * distance (e.g., straight‑line Euclidean distance). If no heuristic is supplied,
 * the algorithm falls back to Dijkstra.
 */
function aStar(graph, start, goal, heuristicFn = null) {
  if (typeof heuristicFn !== 'function') {
    // No heuristic → Dijkstra
    return dijkstra(graph, start, goal);
  }

  const openSet = new Set([start]);
  const cameFrom = {};
  const gScore = {};
  const fScore = {};

  for (const node of Object.keys(graph.nodes)) {
    gScore[node] = Infinity;
    fScore[node] = Infinity;
  }
  gScore[start] = 0;
  fScore[start] = heuristicFn(start, goal);

  while (openSet.size) {
    // Node in openSet with lowest fScore
    let current = null;
    let lowestF = Infinity;
    for (const node of openSet) {
      if (fScore[node] < lowestF) {
        lowestF = fScore[node];
        current = node;
      }
    }
    if (current === goal) {
      // Reconstruct path
      const path = [];
      let n = current;
      while (n) {
        path.unshift(n);
        n = cameFrom[n];
      }
      return { path, totalDistanceKm: gScore[goal] };
    }

    openSet.delete(current);

    const neighbours = graph.edges.filter(
      (e) => e.from === current || e.to === current
    );
    for (const edge of neighbours) {
      const neighbor = edge.from === current ? edge.to : edge.from;
      const tentativeG = gScore[current] + edge.distance;
      if (tentativeG < gScore[neighbor]) {
        cameFrom[neighbor] = current;
        gScore[neighbor] = tentativeG;
        fScore[neighbor] = tentativeG + heuristicFn(neighbor, goal);
        if (!openSet.has(neighbor)) openSet.add(neighbor);
      }
    }
  }

  // No path found
  return { path: [], totalDistanceKm: null };
}

/**
 * Delivery‑mode decision engine.
 * Rules:
 *   - Drone: short distances (≤ 20 km) and non‑emergency.
 *   - Ambulance: longer distances or when urgency is high.
 *   - Emergency flag forces the fastest mode (ambulance) regardless of distance.
 *   - The function returns a string identifier.
 */
function selectDeliveryMode(distanceKm, urgencyLevel, emergency) {
  const DRONE_MAX_KM = 20; // practical drone range
  if (emergency) {
    // Emergency overrides – choose the fastest (ambulance assumed fastest)
    return 'Ambulance';
  }
  if (urgencyLevel === 'high') {
    // High urgency prefers ambulance even for short trips
    return 'Ambulance';
  }
  if (distanceKm <= DRONE_MAX_KM) {
    return 'Drone';
  }
  return 'Ambulance';
}

/**
 * Estimate delivery time (ETA) based on distance and selected mode.
 * Speeds are illustrative and can be tuned or replaced with real‑time data.
 */
function calculateETA(distanceKm, mode) {
  const speedMap = {
    Drone: 60, // km/h (typical fast‑drone speed)
    Ambulance: 80, // km/h (average road speed with priority)
  };
  const speed = speedMap[mode] || 70; // fallback average speed
  const hours = distanceKm / speed;
  const minutes = Math.round(hours * 60);
  return minutes; // ETA in minutes
}

/**
 * High‑level orchestration – combines routing, mode selection, and ETA.
 * @param {Object} params - { source, destination, distance, urgencyLevel, emergency }
 * @param {Object} [options] - { useAdvanced: boolean, graph, heuristicFn }
 * @returns {Object} { selectedRoute, deliveryMode, etaMinutes }
 */
function planDelivery(params, options = {}) {
  const {
    source,
    destination,
    distance, // direct distance (km) – used for basic routing
    urgencyLevel = 'low',
    emergency = false,
  } = params;

  const { useAdvanced = false, graph = null, heuristicFn = null } = options;

  // 1️⃣ Routing
  let routeResult;
  if (useAdvanced && graph) {
    // Prefer A* if a heuristic is supplied, otherwise Dijkstra.
    routeResult = heuristicFn
      ? aStar(graph, source, destination, heuristicFn)
      : dijkstra(graph, source, destination);
  } else {
    // Basic straight‑line route
    routeResult = getBasicRoute(source, destination, distance);
  }

  const totalDist = routeResult.totalDistanceKm !== undefined ? routeResult.totalDistanceKm : distance;

  // 2️⃣ Delivery mode decision
  const mode = selectDeliveryMode(totalDist, urgencyLevel, emergency);

  // 3️⃣ ETA calculation
  const eta = calculateETA(totalDist, mode);

  return {
    selectedRoute: routeResult.path,
    totalDistanceKm: totalDist,
    deliveryMode: mode,
    etaMinutes: eta,
  };
}

// Export for Node.js / browser usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getBasicRoute,
    dijkstra,
    aStar,
    selectDeliveryMode,
    calculateETA,
    planDelivery,
  };
}

/**
 * Example usage (uncomment to test locally):
 *
 * const simple = planDelivery({
 *   source: 'HospitalA',
 *   destination: 'HospitalB',
 *   distance: 15,
 *   urgencyLevel: 'medium',
 *   emergency: false,
 * });
 * console.log(simple);
 *
 * // Advanced routing example with a graph
 * const graph = {
 *   nodes: { A: {}, B: {}, C: {} },
 *   edges: [
 *     { from: 'A', to: 'B', distance: 10 },
 *     { from: 'B', to: 'C', distance: 8 },
 *     { from: 'A', to: 'C', distance: 25 },
 *   ],
 * };
 * const advanced = planDelivery(
 *   {
 *     source: 'A',
 *     destination: 'C',
 *     distance: 0, // ignored for advanced mode
 *     urgencyLevel: 'high',
 *     emergency: false,
 *   },
 *   { useAdvanced: true, graph }
 * );
 * console.log(advanced);
 */
