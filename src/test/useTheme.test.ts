import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "@/hooks/useTheme";

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset inline styles and classes set on documentElement
    document.documentElement.style.cssText = "";
    document.documentElement.className = "";
  });

  it("defaults to dark theme when no saved preference", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
  });

  it("restores light theme from localStorage", () => {
    localStorage.setItem("style-theme", "light");
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
  });

  it("toggleTheme switches dark -> light", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe("light");
  });

  it("toggleTheme switches light -> dark", () => {
    localStorage.setItem("style-theme", "light");
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe("dark");
  });

  it("persists theme in localStorage on change", () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.toggleTheme();
    });
    expect(localStorage.getItem("style-theme")).toBe("light");
  });

  it("applies CSS variables for light theme", () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setTheme("light");
    });
    const bg = document.documentElement.style.getPropertyValue("--background");
    expect(bg).toBeTruthy();
  });

  it("applies CSS variables for dark theme", () => {
    localStorage.setItem("style-theme", "light");
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setTheme("dark");
    });
    const bg = document.documentElement.style.getPropertyValue("--background");
    expect(bg).toBeTruthy();
  });
});
