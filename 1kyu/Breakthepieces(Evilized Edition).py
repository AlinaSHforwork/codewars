USE_BREAK_DISPLAY = True

def break_evil_pieces(shape):
    if not shape.strip():
        return []

    # Interpolate (expand) the shape to handle shared walls
    total_rows, total_cols, expanded_grid = _expand_shape(shape)

    # Identify all empty space coordinates in the expanded grid
    empty_spaces = {
        (r, c) 
        for r in range(total_rows) 
        for c in range(total_cols) 
        if expanded_grid[r][c] == ' '
    }
    
    found_regions = []
    
    # Process each connected region of empty spaces
    while empty_spaces:
        # Start a flood fill from an arbitrary empty space
        start_node = empty_spaces.pop()
        current_region = {start_node}
        frontier = {start_node}
        
        # Iterative BFS to find all connected empty spaces
        while frontier:
            next_frontier = set()
            for node in frontier:
                # Find valid empty neighbors that haven't been processed
                neighbors = _get_cardinal_neighbors(node) & empty_spaces
                next_frontier.update(neighbors)
            
            # Update main sets
            next_frontier -= current_region
            current_region.update(next_frontier)
            frontier = next_frontier
            
        # Remove the processed region from the global set of empty spaces
        empty_spaces -= current_region

        # Calculate the boundary (walls) of this region.
        # The boundary consists of non-empty cells adjacent to the region.
        boundary_cells = set()
        for node in current_region:
            boundary_cells.update(_get_neighbors_8(node))
        boundary_cells -= current_region

        # Calculate bounding box
        r_coords = [r for r, c in boundary_cells]
        c_coords = [c for r, c in boundary_cells]
        
        min_r, max_r = min(r_coords), max(r_coords) + 1
        min_c, max_c = min(c_coords), max(c_coords) + 1

        # Filter out the "outside" background region.
        # If the boundary indices are negative or exceed dimensions, 
        # it means this region touches the edge of the canvas (the outside world).
        if min_r < 0 or min_c < 0 or max_r > total_rows or max_c > total_cols:
            continue

        # Extract the shape within the bounding box
        shape_matrix = [
            list(row[min_c:max_c]) 
            for row in expanded_grid[min_r:max_r]
        ]

        # Clean up the shape: remove artifacts not part of this specific boundary
        for r in range(len(shape_matrix)):
            for c in range(len(shape_matrix[r])):
                global_pos = (r + min_r, c + min_c)
                
                # If a cell is not empty but not part of our specific boundary, wipe it
                if shape_matrix[r][c] != ' ' and global_pos not in boundary_cells:
                    shape_matrix[r][c] = ' '
                
                # Fix intersections ('+') on the boundary
                # If a '+' doesn't connect both ways within THIS boundary, it becomes a simple line
                elif shape_matrix[r][c] == '+':
                    has_horz = bool(_get_horizontal_neighbors(global_pos) & boundary_cells)
                    has_vert = bool(_get_vertical_neighbors(global_pos) & boundary_cells)
                    
                    if not (has_horz and has_vert):
                        shape_matrix[r][c] = '-' if has_horz else '|'

        # De-interpolate: Scale down by taking every 2nd character
        collapsed_shape = []
        for row in shape_matrix[::2]:
            line = "".join(row[::2]).rstrip()
            collapsed_shape.append(line)
            
        found_regions.append('\n'.join(collapsed_shape))

    return found_regions


# --- Helper Functions ---

def _expand_shape(s):
    """
    Interpolates the shape string into a 2x grid to turn "thin" walls 
    into explicit cells. Returns (new_rows, new_cols, new_grid_matrix).
    """
    lines = s.split('\n')
    
    # Trim leading/trailing empty lines
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
        
    if not lines:
        return 0, 0, []

    original_height = len(lines)
    original_width = max(len(line) for line in lines)

    # Pad lines to uniform length
    for i in range(original_height):
        lines[i] = lines[i].ljust(original_width)
    
    # Calculate new dimensions
    new_height = 2 * original_height - 1
    new_width = 2 * original_width - 1
    
    # Initialize blank canvas
    expanded_grid = [[' ' for _ in range(new_width)] for _ in range(new_height)]

    for r in range(new_height):
        orig_r = r // 2
        is_odd_row = (r % 2 == 1)
        
        if is_odd_row:
            # Fill vertical connections between rows
            for c in range(original_width):
                char_top = lines[orig_r][c]
                char_bot = lines[orig_r + 1][c]
                if char_top in '+|' and char_bot in '+|':
                    expanded_grid[r][2 * c] = '|'
        else:
            # Fill original characters and horizontal connections
            for c in range(new_width):
                orig_c = c // 2
                is_odd_col = (c % 2 == 1)
                
                if is_odd_col:
                    char_left = lines[orig_r][orig_c]
                    char_right = lines[orig_r][orig_c + 1]
                    if char_left in '+-' and char_right in '+-':
                        expanded_grid[r][c] = '-'
                else:
                    expanded_grid[r][c] = lines[orig_r][orig_c]
                    
    return new_height, new_width, expanded_grid

def _get_cardinal_neighbors(pos):
    r, c = pos
    return {(r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)}

def _get_neighbors_8(pos):
    r, c = pos
    return {(r + i, c + j) for i in (-1, 0, 1) for j in (-1, 0, 1) if not (i == 0 and j == 0)}

def _get_vertical_neighbors(pos):
    r, c = pos
    return {(r + 1, c), (r - 1, c)}

def _get_horizontal_neighbors(pos):
    r, c = pos
    return {(r, c + 1), (r, c - 1)}
