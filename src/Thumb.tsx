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
  fallback = '위시',
}: Props) {
  const url = useBlobUrl(blob)
  if (!url) {
    return <div className="thumb-fallback">{fallback}</div>
  }
  return <img className={className} src={url} alt={alt} />
}
