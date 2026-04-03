interface YouTubeEmbedProps {
  videoId: string
  title?: string
  className?: string
}

function extractYouTubeId(input: string): string | null {
  // Already a full embed URL — use it directly
  if (input.includes('youtube-nocookie.com/embed/') || input.includes('youtube.com/embed/')) {
    return input
  }
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = input.match(pattern)
    if (match) return match[1]
  }
  return input.length === 11 ? input : null
}

function buildEmbedUrl(idOrUrl: string): string {
  // If it's already a full URL, return as-is
  if (idOrUrl.startsWith('http')) return idOrUrl
  // Otherwise build from video ID
  return `https://www.youtube-nocookie.com/embed/${idOrUrl}?rel=0&modestbranding=1&iv_load_policy=3&fs=1&showinfo=0&disablekb=1&playsinline=1`
}

export function YouTubeEmbed({ videoId, title = 'Video', className }: YouTubeEmbedProps) {
  const resolved = extractYouTubeId(videoId)
  if (!resolved) return null

  const embedSrc = buildEmbedUrl(resolved)

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '56.25%',
        height: 0,
        overflow: 'hidden',
        borderRadius: '12px',
        backgroundColor: '#000',
      }}
    >
      <iframe
        src={embedSrc}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none',
        }}
      />
    </div>
  )
}