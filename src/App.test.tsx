import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("App", () => {
  it("renderiza o título corretamente", () => {
    render(<App />);
    expect(screen.getByText(/vite_react_shadcn_ts/i)).toBeInTheDocument();
  });
});
