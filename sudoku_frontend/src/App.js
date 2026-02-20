import React, { useMemo, useState } from "react";
import "./App.css";

const SIZE = 9;

/**
 * A simple starter Sudoku puzzle (0 means empty).
 * This app focuses on input + validation + reset (not solving/generating).
 */
const INITIAL_PUZZLE = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],

  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],

  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

/**
 * Validates a sudoku grid for (a) allowed numbers and (b) duplicates in rows/cols/boxes.
 * Empty cells (0) are allowed, but duplicates among filled cells are not.
 *
 * Returns: { isValid, invalidCells, isComplete }
 */
function validateSudoku(grid) {
  const invalidCells = new Set();

  const addInvalid = (r, c) => invalidCells.add(`${r},${c}`);

  const isAllowedValue = (v) => Number.isInteger(v) && v >= 0 && v <= 9;

  // Any non-allowed values
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!isAllowedValue(grid[r][c])) addInvalid(r, c);
    }
  }

  // Rows
  for (let r = 0; r < SIZE; r++) {
    const seen = new Map(); // value -> first column
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c];
      if (v === 0) continue;
      if (seen.has(v)) {
        addInvalid(r, c);
        addInvalid(r, seen.get(v));
      } else {
        seen.set(v, c);
      }
    }
  }

  // Columns
  for (let c = 0; c < SIZE; c++) {
    const seen = new Map(); // value -> first row
    for (let r = 0; r < SIZE; r++) {
      const v = grid[r][c];
      if (v === 0) continue;
      if (seen.has(v)) {
        addInvalid(r, c);
        addInvalid(seen.get(v), c);
      } else {
        seen.set(v, r);
      }
    }
  }

  // 3x3 boxes
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const seen = new Map(); // value -> [r,c]
      for (let r = br * 3; r < br * 3 + 3; r++) {
        for (let c = bc * 3; c < bc * 3 + 3; c++) {
          const v = grid[r][c];
          if (v === 0) continue;
          if (seen.has(v)) {
            const [rr, cc] = seen.get(v);
            addInvalid(r, c);
            addInvalid(rr, cc);
          } else {
            seen.set(v, [r, c]);
          }
        }
      }
    }
  }

  const isComplete = grid.every((row) => row.every((v) => v >= 1 && v <= 9));
  return { isValid: invalidCells.size === 0, invalidCells, isComplete };
}

function cloneGrid(grid) {
  return grid.map((row) => row.slice());
}

function makeFixedMask(puzzle) {
  return puzzle.map((row) => row.map((v) => v !== 0));
}

// PUBLIC_INTERFACE
function App() {
  /** Current editable grid. 0 means empty. */
  const [grid, setGrid] = useState(() => cloneGrid(INITIAL_PUZZLE));
  /** Track whether user has clicked Validate to show inline invalid highlights. */
  const [showValidation, setShowValidation] = useState(false);
  /** Status message for user feedback. */
  const [status, setStatus] = useState(null); // { type: 'success'|'error'|'info', message: string }

  const fixed = useMemo(() => makeFixedMask(INITIAL_PUZZLE), []);
  const { isValid, invalidCells, isComplete } = useMemo(() => validateSudoku(grid), [grid]);

  const handleCellChange = (r, c, raw) => {
    if (fixed[r][c]) return;

    // Accept only a single digit 1-9 or empty. Anything else becomes empty.
    const cleaned = raw.replace(/[^\d]/g, "").slice(0, 1);
    const nextVal = cleaned === "" ? 0 : parseInt(cleaned, 10);

    // Block 0 in input (we use 0 internally only as empty)
    const finalVal = Number.isNaN(nextVal) ? 0 : nextVal === 0 ? 0 : nextVal;

    setGrid((prev) => {
      const next = cloneGrid(prev);
      next[r][c] = finalVal;
      return next;
    });

    // If user edits after validation, keep highlights but refresh message.
    if (showValidation) {
      setStatus(null);
    }
  };

  // PUBLIC_INTERFACE
  const handleValidate = () => {
    setShowValidation(true);

    if (!isValid) {
      setStatus({
        type: "error",
        message: "There are conflicts. Fix highlighted cells and try again.",
      });
      return;
    }

    if (!isComplete) {
      setStatus({
        type: "info",
        message: "So far so good — keep going to complete the puzzle.",
      });
      return;
    }

    setStatus({
      type: "success",
      message: "Valid solution. Nice work!",
    });
  };

  // PUBLIC_INTERFACE
  const handleReset = () => {
    setGrid(cloneGrid(INITIAL_PUZZLE));
    setShowValidation(false);
    setStatus(null);
  };

  const getCellClasses = (r, c) => {
    const classes = ["cell"];
    if (fixed[r][c]) classes.push("cellFixed");
    if (showValidation && invalidCells.has(`${r},${c}`)) classes.push("cellInvalid");

    // Thicker borders for 3x3 boxes
    if (c === 2 || c === 5) classes.push("cellBorderRight");
    if (r === 2 || r === 5) classes.push("cellBorderBottom");

    return classes.join(" ");
  };

  const statusRole = status?.type === "error" ? "alert" : "status";

  return (
    <div className="App">
      <main className="page">
        <header className="header">
          <h1 className="title">Sudoku</h1>
          <p className="subtitle">Fill the grid, then validate your solution.</p>
        </header>

        <section className="boardCard" aria-label="Sudoku board">
          <div className="board" role="grid" aria-rowcount={9} aria-colcount={9}>
            {grid.map((row, r) =>
              row.map((value, c) => (
                <div key={`${r}-${c}`} className={getCellClasses(r, c)} role="gridcell">
                  <input
                    aria-label={`Row ${r + 1} Column ${c + 1}`}
                    inputMode="numeric"
                    pattern="[1-9]"
                    className="cellInput"
                    value={value === 0 ? "" : String(value)}
                    onChange={(e) => handleCellChange(r, c, e.target.value)}
                    disabled={fixed[r][c]}
                  />
                </div>
              ))
            )}
          </div>

          <div className="controls" aria-label="Sudoku controls">
            <button className="btn btnPrimary" type="button" onClick={handleValidate}>
              Validate
            </button>
            <button className="btn btnSecondary" type="button" onClick={handleReset}>
              Reset
            </button>
          </div>

          <div className="status" role={statusRole} aria-live="polite">
            {status ? (
              <div className={`statusMessage status${status.type}`}>
                <span className="statusLabel">{status.type.toUpperCase()}</span>
                <span className="statusText">{status.message}</span>
              </div>
            ) : (
              <div className="statusHint">
                Tip: Only digits 1–9 are allowed. Conflicts are highlighted after validation.
              </div>
            )}
          </div>
        </section>

        <footer className="footer">
          <span className="footerText">Modern, lightweight Sudoku UI</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
