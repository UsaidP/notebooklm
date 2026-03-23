import React from "react"
import ReactMarkdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import remarkGfm from "remark-gfm"

export const MarkdownMessage = ({ content }: { content: string }) => {
  return (
    <div
      className="assistant-message"
      style={{
        fontSize: "14px",
        lineHeight: 1.7,
        color: "var(--text-primary)",
        paddingLeft: "26px",
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Custom renderer for citation links [1], [2]
          a: ({ node, ...props }) => {
            if (props.href?.match(/^#\d+$/)) {
              return (
                <sup style={{ color: "var(--accent)", fontWeight: 600 }}>
                  {props.children}
                </sup>
              )
            }
            return <a {...props} />
          },
        }}
      >
        {content}
      </ReactMarkdown>
      <style>{`
        .assistant-message h1, .assistant-message h2, .assistant-message h3 {
          margin: 16px 0 8px; font-weight: 600; line-height: 1.3; color: var(--text-primary); letter-spacing: -0.3px;
        }
        .assistant-message h1 { font-size: 17px; }
        .assistant-message h2 { font-size: 15px; }
        .assistant-message h3 { font-size: 14px; }
        .assistant-message p { margin: 8px 0; }
        .assistant-message ul, .assistant-message ol { margin: 8px 0; padding-left: 20px; }
        .assistant-message code { background: var(--accent-muted); padding: 2px 6px; border-radius: 4px; font-size: 13px; font-family: var(--font-mono); }
        .assistant-message pre { background: var(--bg-primary); border: 1px solid var(--border-subtle); padding: 14px 16px; overflow-x: auto; border-radius: 6px; }
        .assistant-message pre code { background: none; padding: 0; }
        .assistant-message table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 13px; }
        .assistant-message th, .assistant-message td { border: 1px solid var(--border-default); padding: 8px 12px; }
      `}</style>
    </div>
  )
}
