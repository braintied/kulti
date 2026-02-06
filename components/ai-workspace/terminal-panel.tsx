"use client"

import { useEffect, useRef, useState } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import "@xterm/xterm/css/xterm.css"

interface TerminalPanelProps {
  lines: string[]
  className?: string
}

export function TerminalPanel({ lines, className = "" }: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)

  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return

    const term = new Terminal({
      theme: {
        background: "#0d0d0d",
        foreground: "#e4e4e7",
        cursor: "#a3e635",
        cursorAccent: "#0d0d0d",
        black: "#18181b",
        red: "#ef4444",
        green: "#22c55e",
        yellow: "#eab308",
        blue: "#3b82f6",
        magenta: "#a855f7",
        cyan: "#06b6d4",
        white: "#e4e4e7",
        brightBlack: "#52525b",
        brightRed: "#f87171",
        brightGreen: "#4ade80",
        brightYellow: "#facc15",
        brightBlue: "#60a5fa",
        brightMagenta: "#c084fc",
        brightCyan: "#22d3ee",
        brightWhite: "#fafafa",
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 14,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: "block",
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(terminalRef.current)
    fitAddon.fit()

    xtermRef.current = term
    fitAddonRef.current = fitAddon

    // Write initial prompt
    term.writeln("\x1b[32m❯\x1b[0m nex@kulti ~ ")

    // Handle resize
    const handleResize = () => fitAddon.fit()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      term.dispose()
    }
  }, [])

  // Write new lines when they change
  useEffect(() => {
    const term = xtermRef.current
    if (!term || lines.length === 0) return

    // Clear and write all lines
    term.clear()
    lines.forEach((line) => {
      term.writeln(line)
    })
  }, [lines])

  return (
    <div className={`bg-black rounded-lg overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-4 py-2 bg-surface-1 border-b border-border-default">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-xs text-muted-3 ml-2">Terminal — nex@kulti</span>
      </div>
      <div ref={terminalRef} className="h-full min-h-[300px] p-2" />
    </div>
  )
}
