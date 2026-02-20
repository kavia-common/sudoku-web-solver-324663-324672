import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

test("renders the sudoku grid and controls", () => {
  render(<App />);

  // Header
  expect(screen.getByText("Sudoku")).toBeInTheDocument();

  // Controls
  expect(screen.getByRole("button", { name: /validate/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();

  // A few cells exist (we label inputs by row/col)
  expect(screen.getByLabelText("Row 1 Column 1")).toBeInTheDocument();
  expect(screen.getByLabelText("Row 9 Column 9")).toBeInTheDocument();
});

test("validate shows an error when there is a conflict", () => {
  render(<App />);

  // Make a row conflict: Row 1 already has 5 at Col 1, put 5 at Col 3 (editable)
  const cell13 = screen.getByLabelText("Row 1 Column 3");
  fireEvent.change(cell13, { target: { value: "5" } });

  fireEvent.click(screen.getByRole("button", { name: /validate/i }));

  expect(screen.getByText(/there are conflicts/i)).toBeInTheDocument();
});

test("reset clears user input back to the initial puzzle", () => {
  render(<App />);

  const cell11 = screen.getByLabelText("Row 1 Column 1");
  expect(cell11).toBeDisabled(); // fixed clue
  expect(cell11).toHaveValue("5");

  const cell13 = screen.getByLabelText("Row 1 Column 3");
  expect(cell13).not.toBeDisabled();
  expect(cell13).toHaveValue("");

  fireEvent.change(cell13, { target: { value: "9" } });
  expect(cell13).toHaveValue("9");

  fireEvent.click(screen.getByRole("button", { name: /reset/i }));
  expect(cell13).toHaveValue("");
});
