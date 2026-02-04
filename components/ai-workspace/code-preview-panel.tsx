"use client"

import { useState } from "react"
import { FileCode, Copy, Check } from "lucide-react"

interface CodeFile {
  filename: string
  language: string
  content: string
}

interface CodePreviewPanelProps {
  files: CodeFile[]
  className?: string
}

export function CodePreviewPanel({ files, className = "" }: CodePreviewPanelProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [copied, setCopied] = useState(false)

  const activeFile = files[activeIndex] || { filename: "untitled", language: "text", content: "// No file selected" }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(activeFile.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Simple syntax highlighting
  const highlightCode = (code: string, language: string) => {
    // Keywords for common languages
    const keywords = /\b(const|let|var|function|return|if|else|for|while|import|export|from|async|await|class|interface|type|extends|implements|new|this|true|false|null|undefined)\b/g
    const strings = /(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g
    const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm
    const numbers = /\b(\d+\.?\d*)\b/g

    let highlighted = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")

    highlighted = highlighted
      .replace(comments, '<span class="text-[#6b7280]">$1</span>')
      .replace(strings, '<span class="text-[#a3e635]">$&</span>')
      .replace(keywords, '<span class="text-[#f472b6]">$1</span>')
      .replace(numbers, '<span class="text-[#fbbf24]">$1</span>')

    return highlighted
  }

  return (
    <div className={`bg-[#0d0d0d] rounded-lg overflow-hidden flex flex-col ${className}`}>
      {/* File tabs */}
      <div className="flex items-center bg-[#1a1a1a] border-b border-[#27272a] overflow-x-auto">
        {files.map((file, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`flex items-center gap-2 px-4 py-2 text-sm border-r border-[#27272a] whitespace-nowrap transition-colors ${
              index === activeIndex
                ? "bg-[#0d0d0d] text-white"
                : "text-[#71717a] hover:text-white hover:bg-[#27272a]"
            }`}
          >
            <FileCode className="w-4 h-4" />
            {file.filename}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={handleCopy}
          className="p-2 text-[#71717a] hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Code content */}
      <div className="flex-1 overflow-auto p-4">
        <pre className="text-sm font-mono leading-relaxed">
          <code dangerouslySetInnerHTML={{ __html: highlightCode(activeFile.content, activeFile.language) }} />
        </pre>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1 bg-[#1a1a1a] border-t border-[#27272a] text-xs text-[#71717a]">
        <span>{activeFile.language}</span>
        <span>{activeFile.content.split("\n").length} lines</span>
      </div>
    </div>
  )
}
