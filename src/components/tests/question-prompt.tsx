// Component to render markdown prompt with images
export function QuestionPrompt({ promptMd, className = '', imageLayout = 'stacked' }: { promptMd: string; className?: string; imageLayout?: 'stacked' | 'side-by-side' }) {
  // Split content into text and image parts
  const parseContent = (content: string) => {
    const imageRegex = /!\[([^\]]*)\]\((data:image\/[^)]+)\)/g
    const parts: Array<{ type: 'text' | 'image'; content: string; src?: string; alt?: string }> = []
    let lastIndex = 0
    let match

    while ((match = imageRegex.exec(content)) !== null) {
      // Add text before image
      if (match.index > lastIndex) {
        const text = content.substring(lastIndex, match.index).trim()
        if (text) {
          parts.push({ type: 'text', content: text })
        }
      }
      // Add image
      parts.push({
        type: 'image',
        content: '',
        src: match[2],
        alt: match[1] || 'Image'
      })
      lastIndex = imageRegex.lastIndex
    }

    // Add remaining text
    if (lastIndex < content.length) {
      const text = content.substring(lastIndex).trim()
      if (text) {
        parts.push({ type: 'text', content: text })
      }
    }

    // If no images found, return the whole content as text
    if (parts.length === 0) {
      return [{ type: 'text' as const, content: content.trim() }]
    }

    return parts
  }

  // Handle context/prompt split (separated by ---)
  const parts = promptMd.split('---')
  const hasContext = parts.length === 2
  const contextContent = hasContext ? parts[0].trim() : ''
  const promptContent = hasContext ? parts[1].trim() : promptMd.trim()

  const contextParts = contextContent ? parseContent(contextContent) : []
  const promptParts = parseContent(promptContent)

  const renderParts = (partsToRender: typeof promptParts, className = '') => {
    // Group consecutive images for side-by-side layout
    const groupedParts: Array<{ type: 'text' | 'image' | 'image-group'; content?: string; images?: Array<{ src: string; alt: string }>; src?: string; alt?: string }> = []
    
    if (imageLayout === 'side-by-side') {
      let i = 0
      while (i < partsToRender.length) {
        if (partsToRender[i].type === 'image') {
          // Collect consecutive images
          const imageGroup: Array<{ src: string; alt: string }> = []
          while (i < partsToRender.length && partsToRender[i].type === 'image') {
            if (partsToRender[i].src) {
              imageGroup.push({ src: partsToRender[i].src!, alt: partsToRender[i].alt || 'Image' })
            }
            i++
          }
          if (imageGroup.length > 0) {
            groupedParts.push({ type: 'image-group', images: imageGroup })
          }
        } else {
          groupedParts.push(partsToRender[i])
          i++
        }
      }
    } else {
      groupedParts.push(...partsToRender)
    }

    return (
      <div className={className}>
        {groupedParts.map((part, index) => {
          if (part.type === 'image-group' && part.images) {
            return (
              <div key={index} className="my-3 flex flex-wrap gap-2">
                {part.images.map((img, imgIndex) => (
                  <div key={imgIndex} className="flex-1 min-w-[200px] rounded-md border border-input overflow-hidden bg-muted/30">
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="max-w-full max-h-96 object-contain block mx-auto"
                    />
                  </div>
                ))}
              </div>
            )
          }
          if (part.type === 'image' && part.src) {
            return (
              <div key={index} className="my-3 rounded-md border border-input overflow-hidden bg-muted/30">
                <img
                  src={part.src}
                  alt={part.alt || 'Image'}
                  className="max-w-full max-h-96 object-contain block mx-auto"
                />
              </div>
            )
          }
          return (
            <p key={index} className={`whitespace-pre-wrap ${className || 'text-lg'}`}>
              {part.content}
            </p>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {contextParts.length > 0 && (
        <div className="space-y-3 pb-3 border-b border-border">
          {renderParts(contextParts)}
        </div>
      )}
      {renderParts(promptParts)}
    </div>
  )
}

