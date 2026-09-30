import { useBlobUrl } from './useBlobUrl'

type Props = {
  blob?: Blob
  className?: string
  alt?: string
  fallback?: string
}

export function Thumb({
  blob,
  className = 'thumb',
  alt = '',
  fallback = '🐥',
}: Props) {
  const url = useBlobUrl(blob)
  if (!url) {
    return <div className={`thumb-fallback ${className}`} role="img" aria-label="사진 없음 · 병아리">{fallback}</div>
  }
  return <img className={className} src={url} alt={alt} />
}
