import numpy as np
import queue

def slide_puzzle(array):
    game = SlidingPuzzle(array)
    game.solve()
    return game.steps


class Tile:
    def __init__(self, value, r, c):
        self.value = value
        self.r = r  # Row index
        self.c = c  # Column index
        self.is_locked = False
        self.neighbors = []
        
        # A* Pathfinding attributes
        self.distance_from_start = np.inf
        self.parent_tile = None

    def __repr__(self):
        return str(self.value)

    def __gt__(self, other):
        # Required for PriorityQueue comparison
        return self.distance_from_start > other.distance_from_start

    def reset_pathfinding(self):
        self.distance_from_start = np.inf
        self.parent_tile = None

    def manhattan_distance(self, other):
        return abs(self.r - other.r) + abs(self.c - other.c)

    def swap_values(self, other):
        """Swaps value and lock status with another tile (physically moving the tile)."""
        self.value, other.value = other.value, self.value
        self.is_locked, other.is_locked = other.is_locked, self.is_locked

    def compute_neighbors(self, grid):
        """Pre-calculates valid neighbors for this position."""
        height, width = grid.shape
        self.neighbors = []
        if self.r > 0:          self.neighbors.append(grid[self.r - 1, self.c])
        if self.r < height - 1: self.neighbors.append(grid[self.r + 1, self.c])
        if self.c > 0:          self.neighbors.append(grid[self.r, self.c - 1])
        if self.c < width - 1:  self.neighbors.append(grid[self.r, self.c + 1])

    def get_best_neighbor(self, target_dest):
        """Finds the neighbor closest to the target destination (heuristic)."""
        candidates = [
            (target_dest.manhattan_distance(n), n) 
            for n in self.neighbors if not n.is_locked
        ]
        if not candidates:
            return None
        # Sort by distance, return the tile
        return sorted(candidates, key=lambda x: x[0])[0][1]


class SlidingPuzzle:
    def __init__(self, array):
        # Initialize grid
        self.grid = np.array(array, dtype=object)
        self.height, self.width = self.grid.shape
        self.steps = []
        
        # Determine the "Solved" state (1 to N-1, then 0)
        self.target_grid = np.zeros_like(self.grid, dtype=int)
        
        for r, row in enumerate(self.grid):
            for c, val in enumerate(row):
                # Create Tile objects
                self.grid[r, c] = Tile(val, r, c)
                # Calculate expected value at this position
                self.target_grid[r, c] = 1 + c + self.width * r
        
        # Set the last cell target to 0 (empty space)
        self.target_grid[-1, -1] = 0

        # Link neighbors
        for row in self.grid:
            for tile in row:
                tile.compute_neighbors(self.grid)

    def _reset_tiles(self):
        """Clears A* data on all tiles."""
        for tile in np.ravel(self.grid):
            tile.reset_pathfinding()

    def _find_tile_by_value(self, value):
        """Scan grid to find the tile object containing a specific value."""
        for row in self.grid:
            for tile in row:
                if tile.value == value:
                    return tile
        return None

    def solve(self):
        """Main solver pipeline."""
        self._reduce_grid()
        self._solve_remaining_3x3()

    def _reduce_grid(self):
        """
        Solves the top row, then the left column, iteratively reducing the 
        unsolved area until only a 3x3 (or effectively smaller) grid remains.
        """
        # We stop when 2 rows/cols remain (creating a 3x3 zone at bottom-right)
        for i in range(self.height - 2):
            
            # 1. Solve the top-most unsolved Row
            # Identify the "buffer" zone (next two rows) used to juggle tiles
            row_buffer = (
                self.grid[i + 1, -1], self.grid[i + 1, -2],
                self.grid[i + 2, -1], self.grid[i + 2, -2]
            )
            # Solve the row using the buffer
            self._solve_vector(self.grid[i, :], self.target_grid[i, :], row_buffer)

            # 2. Solve the left-most unsolved Column
            col_buffer = (
                self.grid[-1, i + 1], self.grid[-2, i + 1],
                self.grid[-1, i + 2], self.grid[-2, i + 2]
            )
            # Solve the column using the buffer
            self._solve_vector(self.grid[i + 1:, i], self.target_grid[i + 1:, i], col_buffer)

    def _solve_vector(self, tiles, solutions, buffer_zone):
        """
        Generic method to solve a single Row or Column.
        strategies differ for the normal elements vs the final two elements.
        """
        # 1. Place all tiles except the last two
        for tile, correct_val in zip(tiles[:-2], solutions[:-2]):
            self._move_value_to_target(tile, correct_val)

        # 2. Complex shuffle to place the last two tiles of the line
        # We utilize the buffer zone (adjacent rows/cols) to rotate tiles in.
        
        # Move pieces out of the way into buffer (temporarily unlocked)
        self._move_value_to_target(buffer_zone[2], solutions[-1], lock_result=False)
        self._move_value_to_target(buffer_zone[3], solutions[-2], lock_result=False)
        self._move_value_to_target(tiles[-1], solutions[-2], lock_result=False)
        self._move_value_to_target(buffer_zone[0], solutions[-1], lock_result=False)

        # Special check: Ensure the empty space (0) isn't blocking the critical spot
        if tiles[-2] != self._find_tile_by_value(0):
            # Move buffer tile out of the way, ignoring specific tiles to prevent deadlock
            self._move_value_to_target(
                buffer_zone[1], 
                tiles[-2].value, 
                ignore_list=[buffer_zone[0], tiles[-1]], 
                lock_result=False
            )

        # Final placement of the last two tiles
        self._move_value_to_target(tiles[-2], solutions[-2])
        self._move_value_to_target(tiles[-1], solutions[-1])

    def _move_value_to_target(self, target_pos, value_to_fetch, ignore_list=None, lock_result=True):
        """
        Moves a specific value (value_to_fetch) into a specific physical tile (target_pos).
        Uses A* pathfinding.
        """
        ignore_list = ignore_list or []

        while target_pos.value != value_to_fetch:
            zero_tile = self._find_tile_by_value(0)
            target_tile = self._find_tile_by_value(value_to_fetch)

            # Determine where the zero tile should go to help move the target
            # We want '0' to be adjacent to our target tile, on the side closest to destination
            best_spot_for_zero = target_tile.get_best_neighbor(target_pos)

            # Find path for '0' to that spot
            path = self._calculate_astar_path(zero_tile, best_spot_for_zero, avoid_tile=target_tile, ignore_list=ignore_list)

            # Execute the movement of '0'
            for current, next_tile in zip(path, path[1:]):
                self.steps.append(next_tile.value)
                current.swap_values(next_tile)
            else:
                # Finally, swap '0' with the target number to advance it one step
                self.steps.append(target_tile.value)
                path[-1].swap_values(target_tile)

        if lock_result:
            target_pos.is_locked = True

    def _calculate_astar_path(self, start_node, end_node, avoid_tile, ignore_list):
        """Standard A* implementation to move the empty space (0)."""
        pq = queue.PriorityQueue()
        self._reset_tiles()
        
        start_node.distance_from_start = 0
        pq.put((0, start_node))

        while not pq.empty():
            _, current = pq.get()

            if current == end_node:
                break

            for neighbor in current.neighbors:
                # Constraints for valid path
                is_traversable = (
                    neighbor.parent_tile != current and
                    neighbor != avoid_tile and
                    not neighbor.is_locked and
                    neighbor not in ignore_list
                )

                if is_traversable:
                    new_dist = 1 + current.distance_from_start
                    if neighbor.distance_from_start > new_dist:
                        neighbor.distance_from_start = new_dist
                        neighbor.parent_tile = current
                        # Priority = Cost so far + Heuristic (Manhattan)
                        priority = new_dist + neighbor.manhattan_distance(end_node)
                        pq.put((priority, neighbor))

        # Reconstruct path
        path = []
        node = end_node
        while node.parent_tile:
            path.append(node)
            node = node.parent_tile
        path.append(node)
        
        return list(reversed(path))

    def _solve_remaining_3x3(self):
        """
        Brute force rotation for the final 3x3 grid.
        Iterates through a fixed rotation pattern until solved.
        """
        # Valid rotation sequence for the '0' tile in the bottom-right 3x3 area
        # Relative coordinates from (height, width)
        move_sequence = [
            (-1, -1), (-1, -2), (-2, -2), (-2, -1) # Counter-clockwise rotation?
        ]
        
        # Try for a max number of iterations to prevent infinite loops
        for i in range(24):
            # Check if strictly the 3x3 area is solved
            # We flatten the last 3x3, remove the last item (should be 0), and check order
            flat_view = self.grid[-3:, -3:].ravel()
            current_values = [t.value for t in flat_view][:-1] # Exclude last
            if sorted(current_values) == current_values:
                return True

            zero_tile = self._find_tile_by_value(0)
            
            # Determine which index in the sequence we should target based on 'i'
            # The original logic used two phases (i < 12 and i >= 12) with reversed logic
            seq_idx = i % 4
            offset_y, offset_x = move_sequence[seq_idx]
            
            # Flip logic for second half of attempts (change rotation direction)
            if i >= 12:
                 # Reverse the sequence lookup roughly
                 offset_y, offset_x = move_sequence[-(seq_idx + 1)]

            target_y, target_x = self.height + offset_y, self.width + offset_x
            
            # Check if zero is already there; if not, we need to swap with neighbor
            # In this heuristic, we actually find the neighbor AT that coordinate and swap
            target_tile = self.grid[target_y, target_x]
            
            # Only swap if it's a valid neighbor of zero (sanity check)
            if target_tile in zero_tile.neighbors:
                self.steps.append(target_tile.value)
                zero_tile.swap_values(target_tile)
        
        # If we failed to solve in 24 steps
        self.steps = None
