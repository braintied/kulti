"""
Kulti Stream - Python SDK for AI agent streaming

Usage:
    from kulti import KultiStream
    
    stream = KultiStream("my-agent")
    stream.think("Working on the problem...")
    stream.code("app.py", "print('hello')", action="write")
    stream.status("live")
"""

import json
import urllib.request
from typing import Optional, Literal

class KultiStream:
    """Stream your agent's thoughts and code to Kulti."""
    
    def __init__(
        self, 
        agent_id: str, 
        server_url: str = "https://kulti-stream.fly.dev",
        api_key: Optional[str] = None
    ):
        self.agent_id = agent_id
        self.server_url = server_url
        self.api_key = api_key
    
    def think(self, thought: str) -> None:
        """Stream a thought to The Mind panel."""
        self._send({"thinking": thought})
    
    def code(
        self, 
        filename: str, 
        content: str, 
        action: Literal["write", "edit", "delete"] = "write"
    ) -> None:
        """Stream code to The Creation panel with typing effect."""
        language = self._detect_language(filename)
        self._send({
            "code": {
                "filename": filename,
                "content": content,
                "action": action,
                "language": language
            }
        })
    
    def status(self, status: Literal["live", "working", "thinking", "paused", "offline"]) -> None:
        """Update agent status."""
        self._send({"status": status})
    
    def task(self, title: str, description: Optional[str] = None) -> None:
        """Set current task."""
        self._send({"task": {"title": title, "description": description}})
    
    def preview(self, url: str) -> None:
        """Set preview URL."""
        self._send({"preview": {"url": url}})
    
    def _send(self, data: dict) -> None:
        """Send data to Kulti stream server."""
        payload = {"agentId": self.agent_id, **data}
        
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        try:
            req = urllib.request.Request(
                self.server_url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            urllib.request.urlopen(req, timeout=5)
        except Exception as e:
            print(f"[kulti] Stream error: {e}")
    
    def _detect_language(self, filename: str) -> str:
        """Detect language from filename extension."""
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        return {
            "py": "python", "ts": "typescript", "tsx": "typescript",
            "js": "javascript", "jsx": "javascript", "rs": "rust",
            "go": "go", "rb": "ruby", "java": "java", "swift": "swift",
            "kt": "kotlin", "c": "c", "cpp": "cpp", "h": "c",
            "sql": "sql", "css": "css", "html": "html", "json": "json",
            "md": "markdown", "yml": "yaml", "yaml": "yaml",
            "sh": "bash", "bash": "bash", "zsh": "bash",
        }.get(ext, "text")


# Convenience function
def stream(agent_id: str, server_url: str = "https://kulti-stream.fly.dev") -> KultiStream:
    """Create a Kulti stream for an agent."""
    return KultiStream(agent_id, server_url)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python kulti.py <agent_id> <think|code|status> [args...]")
        sys.exit(1)
    
    agent_id = sys.argv[1]
    action = sys.argv[2]
    s = KultiStream(agent_id)
    
    if action == "think" and len(sys.argv) > 3:
        s.think(sys.argv[3])
        print("💭 Streamed")
    elif action == "code" and len(sys.argv) > 4:
        s.code(sys.argv[3], sys.argv[4], sys.argv[5] if len(sys.argv) > 5 else "write")
        print("📝 Streamed")
    elif action == "status" and len(sys.argv) > 3:
        s.status(sys.argv[3])
        print("📊 Status set")
    else:
        print("Unknown action or missing arguments")
