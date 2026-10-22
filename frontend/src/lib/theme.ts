import { useCallback, useSyncExternalStore } from "react"

export type Theme = "light" | "dark"

// Initial theme is applied by the inline script in index.html so there's no flash on load
const STORAGE_KEY = "theme"

const getTheme = (): Theme => (document.documentElement.classList.contains("dark") ? "dark" : "light")

// Elements with colour transitions would otherwise fade over ~200ms while the rest of the
// page flips instantly, briefly showing a mix of both themes. Suspend them for the switch.
function suspendTransitions() {
  const style = document.createElement("style")
  style.textContent = "*,*::before,*::after{transition:none!important}"
  document.head.appendChild(style)
  return () => {
    // Force a style recalc with transitions off, then restore them after the new theme has painted
    void window.getComputedStyle(document.body).backgroundColor
    requestAnimationFrame(() => requestAnimationFrame(() => style.remove()))
  }
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
  return () => observer.disconnect()
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme)

  const setTheme = useCallback((next: Theme) => {
    const restoreTransitions = suspendTransitions()
    document.documentElement.classList.toggle("dark", next === "dark")
    restoreTransitions()
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "dark" ? "#0a0a0a" : "#ffffff")
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage unavailable (private mode); the choice just won't persist
    }
  }, [])

  return { theme, setTheme }
}
