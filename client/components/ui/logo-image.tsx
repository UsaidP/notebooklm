import React from "react"

interface LogoImageProps {
  /** Size in pixels for width and height */
  size?: number
  /** Alt text for accessibility */
  alt?: string
}

/**
 * Renders the logo image from the public folder.
 * The image file `logo.jpg` is placed in `public/` and will be served
 * statically by Next.js. The component ensures the logo matches the
 * design system's height and provides a hover opacity effect.
 */
const LogoImage: React.FC<LogoImageProps> = ({
  size = 28,
  alt = "PrivyLM Logo",
}) => {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    display: "inline-block",
    // Preserve the same border radius as the previous SVG logo container
    borderRadius: size * 0.19,
    overflow: "hidden",
    // Subtle hover effect to match other interactive elements
    transition: "opacity 0.2s",
  }

  return (
    <img
      src="/logo.jpg"
      alt={alt}
      style={style}
      // Next.js static assets are served from the root, so /logo.jpg works
    />
  )
}

export default LogoImage
