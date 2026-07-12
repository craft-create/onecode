'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ImageOff } from 'lucide-react';
type ImageFormat = 'jpg' | 'png' | 'webp' | 'bmp' | 'gif' | 'tiff';

type NativeImgProps = React.ComponentPropsWithoutRef<'img'>;

export interface ImageProps extends NativeImgProps {
  quality?: number;
  format?: ImageFormat;
  breakpoints?: Array<number>;
}

const DEFAULT_QUALITY = 80;
const DEFAULT_RESOLUTIONS: number[] = [
  16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048,
  3840,
];

const SRC_ALLOWLIST = [
  '/runtime/api/v1/storage/object/',
  '/aily/api/v1/feisuda/attachments/',
  '/aily/api/v1/files/static/',
];

function getClosestResolution(target: number): number {
  return DEFAULT_RESOLUTIONS.reduce((prev, curr) => {
    return Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev;
  });
}

function applyParamsToUrl(
  src: string,
  params: Record<string, string | number | undefined>,
): string {
  const search = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => {
      return `${k},${v}`;
    })
    .join('/');
  if (!search) return src;

  const [pathAndQuery = '', hash] = src.split('#');
  const [base, query] = pathAndQuery.split('?');
  const urlParams = new URLSearchParams(query);
  urlParams.set('x-tos-process', `image/${search}`);

  return `${base}?${urlParams.toString()}${hash ? '#' + hash : ''}`;
}

function isTargetSrc(originSrc: string) {
  return SRC_ALLOWLIST.some((item) => originSrc.includes(item));
}

function supportWebp() {
  try {
    return (
      document
        .createElement('canvas')
        .toDataURL('image/webp')
        .indexOf('data:image/webp') === 0
    );
  } catch (err) {
    return false;
  }
}

function buildSrcSet(
  src: string,
  widths: number[],
  format: ImageFormat | undefined,
  quality: number,
  width?: number,
  sizes?: string,
): string | undefined {
  if (!widths || widths.length === 0 || (!width && !sizes)) return undefined;
  const fmt = format;
  if (width) {
    return [1, 2]
      .map((dpr) => {
        const targetWidth = getClosestResolution(width * dpr);
        return `${applyParamsToUrl(src, { resize: `w_${targetWidth}`, quality: `Q_${quality}`, format: fmt })} ${dpr}x`;
      })
      .join(', ');
  }
  return widths
    .map(
      (w) =>
        `${applyParamsToUrl(src, { resize: `w_${w}`, quality: `Q_${quality}`, format: fmt })} ${w}w`,
    )
    .join(', ');
}

const LazyImage = React.forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      src,
      width,
      height,
      quality = DEFAULT_QUALITY,
      format,
      sizes,
      srcSet: userSrcSet,
      breakpoints = DEFAULT_RESOLUTIONS,
      className,
      loading = 'lazy',
      decoding = 'async',
      ...rest
    },
    ref,
  ) => {
    const imgRef = React.useRef<HTMLImageElement | null>(null);
    const [isInView, setIsInView] = React.useState(false);
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [hasError, setHasError] = React.useState(false);

    const defaultFormat = React.useMemo(
      () => (supportWebp() ? 'webp' : undefined),
      [],
    );

    // IntersectionObserver for lazy loading
    React.useEffect(() => {
      const el = imgRef.current;
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]: IntersectionObserverEntry[]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { rootMargin: '200px' },
      );

      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    const handleLoad = React.useCallback(() => {
      setIsLoaded(true);
    }, []);

    const handleError = React.useCallback(() => {
      setHasError(true);
      setIsLoaded(true);
    }, []);

    // Build src/srcSet only when in view
    const computedSrc = React.useMemo(() => {
      if (!isInView || typeof src !== 'string' || !isTargetSrc(src)) {
        return typeof src === 'string' && !isTargetSrc(src) ? src : undefined;
      }
      const numericWidth = typeof width === 'number' ? width : undefined;
      return applyParamsToUrl(src, {
        resize: numericWidth ? `w_${numericWidth}` : undefined,
        quality: `Q_${quality}`,
        format: format ?? defaultFormat,
      });
    }, [isInView, src, width, quality, format, defaultFormat]);

    const computedSrcSet = React.useMemo(() => {
      if (!isInView || typeof src !== 'string' || !isTargetSrc(src)) return undefined;
      if (userSrcSet) return userSrcSet;
      const numericWidth = typeof width === 'number' ? width : undefined;
      return buildSrcSet(
        src,
        breakpoints,
        format ?? (defaultFormat as ImageFormat),
        quality,
        numericWidth,
        sizes,
      );
    }, [isInView, src, userSrcSet, width, breakpoints, format, defaultFormat, quality, sizes]);

    const isTarget = typeof src === 'string' && isTargetSrc(src);

    return (
      <div
        ref={(node: HTMLDivElement | null) => {
          if (node && !imgRef.current) {
            imgRef.current = node.querySelector?.('img') ?? null;
          }
        }}
        className="relative overflow-hidden"
        style={{ width, height }}
      >
        {/* Skeleton placeholder */}
        {!isLoaded && (
          <div
            className={cn(
              'absolute inset-0 bg-linear-to-b from-muted/30 to-muted/10 animate-pulse',
              className,
            )}
          />
        )}

        {/* Error fallback */}
        {hasError && (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center bg-muted/20',
              className,
            )}
          >
            <ImageOff className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        {/* Actual image */}
        {!hasError && (
          <img
            {...rest}
            ref={ref}
            src={isTarget ? computedSrc : src}
            width={width}
            height={height}
            sizes={sizes}
            srcSet={isTarget ? computedSrcSet : userSrcSet}
            className={cn(
              'transition-opacity duration-500',
              isLoaded ? 'opacity-100' : 'opacity-0',
              className,
            )}
            loading={loading}
            decoding={decoding}
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
      </div>
    );
  },
);

LazyImage.displayName = 'LazyImage';

export const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  (props, ref) => {
    return <LazyImage {...props} ref={ref} />;
  },
);

Image.displayName = 'Image';

export default Image;
