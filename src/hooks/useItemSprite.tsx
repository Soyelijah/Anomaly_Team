import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getItemSprite, cleanMuItemName } from '../utils/itemSprites';
import { getSmashMuItemByName, getSmashMuImageUrl } from '../utils/muItemsDatabase';

/**
 * Global cache for preloaded item sprites across all component instances.
 * Prevents redundant network requests and eliminates UI flicker.
 */
const SPRITE_CACHE = new Map<string, 'loaded' | 'error'>();
const IN_FLIGHT_PROMISES = new Map<string, Promise<boolean>>();

/**
 * Standard category fallback sprites on Smash MU CDN if a specific item sprite is unavailable.
 */
export const CATEGORY_FALLBACK_SPRITES: Record<string, string> = {
  weapon: 'https://www.smashmu.com/en/items/2-8.gif',     // Battle Scepter
  armor: 'https://www.smashmu.com/en/items/8-7.gif',      // Sphinx Armor
  wings: 'https://www.smashmu.com/en/items/12-0.gif',     // Wings of Elf
  accessory: 'https://www.smashmu.com/en/items/13-8.gif', // Ring of Ice
  pet: 'https://www.smashmu.com/en/items/13-5.gif',       // Dark Raven
  consumable: 'https://www.smashmu.com/en/items/14-13.gif',// Jewel of Bless
  default: 'https://www.smashmu.com/en/items/2-8.gif',
};

/**
 * Checks if a string is a user-uploaded image, screenshot, or data URL
 */
export const isUserCustomImage = (path?: string): boolean => {
  if (!path) return false;
  return (
    path.startsWith('data:') ||
    path.startsWith('blob:') ||
    path.includes('/assets/aistudio/') ||
    path.includes('image_') ||
    path.includes('/uploads/')
  );
};

/**
 * Resolves the official Smash MU CDN sprite URL for a given item name or path
 */
export const resolveItemSpriteUrl = (
  itemName?: string,
  category?: string,
  imagePath?: string,
  customImage?: string
): string => {
  // 1. If explicit custom user screenshot/paste is provided, it takes priority
  if (customImage && isUserCustomImage(customImage)) {
    return customImage;
  }
  if (imagePath && isUserCustomImage(imagePath)) {
    return imagePath;
  }

  // 2. If valid imagePath already points to Smash MU CDN or starts with /en/items/
  if (imagePath && (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('/en/items/'))) {
    return getSmashMuImageUrl(imagePath);
  }

  // 3. Official Smash MU catalog lookup
  const cleanName = cleanMuItemName(itemName) || itemName || '';
  if (cleanName) {
    const catalogMatch = getSmashMuItemByName(cleanName);
    if (catalogMatch && catalogMatch.imagePath) {
      return getSmashMuImageUrl(catalogMatch.imagePath);
    }
    const resolvedFromSprites = getItemSprite(cleanName, category);
    if (resolvedFromSprites && (resolvedFromSprites.startsWith('http') || resolvedFromSprites.startsWith('/en/items/'))) {
      return getSmashMuImageUrl(resolvedFromSprites);
    }
  }

  // 4. Authentic Smash MU CDN Category fallback
  const catKey = (category || 'default').toLowerCase();
  return CATEGORY_FALLBACK_SPRITES[catKey] || CATEGORY_FALLBACK_SPRITES.default;
};

/**
 * Low-level image preloader that caches loaded/error states.
 * Safely handles browser and server/test environments.
 */
export const preloadItemSprite = (url: string): Promise<boolean> => {
  if (!url) return Promise.resolve(false);

  // Return immediately if in SSR / Node environment where Image constructor is absent
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    return Promise.resolve(true);
  }

  // Return immediately if already cached
  const cachedStatus = SPRITE_CACHE.get(url);
  if (cachedStatus === 'loaded') return Promise.resolve(true);
  if (cachedStatus === 'error') return Promise.resolve(false);

  // Return existing in-flight promise to avoid duplicate downloads
  const existingPromise = IN_FLIGHT_PROMISES.get(url);
  if (existingPromise) return existingPromise;

  const promise = new Promise<boolean>((resolve) => {
    const img = new Image();
    img.onload = () => {
      SPRITE_CACHE.set(url, 'loaded');
      IN_FLIGHT_PROMISES.delete(url);
      resolve(true);
    };
    img.onerror = () => {
      SPRITE_CACHE.set(url, 'error');
      IN_FLIGHT_PROMISES.delete(url);
      resolve(false);
    };
    img.src = url;
  });

  IN_FLIGHT_PROMISES.set(url, promise);
  return promise;
};

/**
 * Utility to batch-preload an array of items or URLs (e.g. before rendering auction gallery)
 */
export const preloadItemSprites = async (
  items: Array<{ itemName?: string; category?: string; imagePath?: string; url?: string }>
): Promise<void> => {
  const urls = items
    .map((item) => item.url || resolveItemSpriteUrl(item.itemName, item.category, item.imagePath))
    .filter(Boolean);

  const uniqueUrls = Array.from(new Set(urls));
  await Promise.all(uniqueUrls.map((url) => preloadItemSprite(url)));
};

export interface UseItemSpriteOptions {
  itemName?: string;
  category?: string;
  imagePath?: string;
  customImage?: string;
  fallbackUrl?: string;
  skipPreload?: boolean;
}

export interface UseItemSpriteReturn {
  spriteUrl: string;
  rawSpriteUrl: string;
  isLoading: boolean;
  isLoaded: boolean;
  isError: boolean;
  hasFallback: boolean;
  error: Error | null;
  reload: () => void;
}

/**
 * Hook to manage item sprite preloading, loading states, and fallback error recovery.
 *
 * Usage:
 * const { spriteUrl, isLoading, isError } = useItemSprite('Wings of Magic', 'wings');
 * const { spriteUrl, isLoading } = useItemSprite({ itemName: item.name, category: item.category });
 */
export function useItemSprite(
  itemNameOrConfig?: string | UseItemSpriteOptions,
  categoryOrOptions?: string | UseItemSpriteOptions,
  extraOptions?: UseItemSpriteOptions
): UseItemSpriteReturn {
  // Normalize overloaded arguments
  let config: UseItemSpriteOptions = {};
  if (typeof itemNameOrConfig === 'object' && itemNameOrConfig !== null) {
    config = { ...itemNameOrConfig };
  } else {
    config.itemName = itemNameOrConfig;
    if (typeof categoryOrOptions === 'object' && categoryOrOptions !== null) {
      config = { ...config, ...categoryOrOptions };
    } else if (typeof categoryOrOptions === 'string') {
      config.category = categoryOrOptions;
    }
    if (extraOptions) {
      config = { ...config, ...extraOptions };
    }
  }

  const {
    itemName,
    category,
    imagePath,
    customImage,
    fallbackUrl: customFallbackUrl,
    skipPreload = false,
  } = config;

  // Resolve target URL and standard fallback URL
  const targetUrl = resolveItemSpriteUrl(itemName, category, imagePath, customImage);
  const catKey = (category || 'default').toLowerCase();
  const safeFallback =
    customFallbackUrl || CATEGORY_FALLBACK_SPRITES[catKey] || CATEGORY_FALLBACK_SPRITES.default;

  const [activeUrl, setActiveUrl] = useState<string>(() => {
    // If targetUrl already errored in cache, start with fallback
    return SPRITE_CACHE.get(targetUrl) === 'error' ? safeFallback : targetUrl;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (skipPreload || !targetUrl) return false;
    return SPRITE_CACHE.get(targetUrl) !== 'loaded';
  });

  const [isLoaded, setIsLoaded] = useState<boolean>(() => {
    if (!targetUrl) return false;
    return SPRITE_CACHE.get(targetUrl) === 'loaded';
  });

  const [isError, setIsError] = useState<boolean>(() => {
    return SPRITE_CACHE.get(targetUrl) === 'error';
  });

  const [hasFallback, setHasFallback] = useState<boolean>(() => {
    return SPRITE_CACHE.get(targetUrl) === 'error' && activeUrl !== targetUrl;
  });

  const [error, setError] = useState<Error | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);

  const reload = useCallback(() => {
    if (targetUrl) {
      SPRITE_CACHE.delete(targetUrl);
      IN_FLIGHT_PROMISES.delete(targetUrl);
    }
    setError(null);
    setIsError(false);
    setHasFallback(false);
    setActiveUrl(targetUrl);
    setReloadCounter((prev) => prev + 1);
  }, [targetUrl]);

  // Handle preloading on targetUrl or reload changes
  useEffect(() => {
    let isCancelled = false;

    if (!targetUrl) {
      setIsLoading(false);
      setIsLoaded(false);
      setIsError(false);
      return;
    }

    if (skipPreload) {
      setActiveUrl(targetUrl);
      setIsLoading(false);
      setIsLoaded(true);
      setIsError(false);
      return;
    }

    // Check existing cache status
    const cached = SPRITE_CACHE.get(targetUrl);
    if (cached === 'loaded') {
      setActiveUrl(targetUrl);
      setIsLoading(false);
      setIsLoaded(true);
      setIsError(false);
      setHasFallback(false);
      setError(null);
      return;
    }

    if (cached === 'error') {
      setActiveUrl(safeFallback);
      setIsLoading(false);
      setIsLoaded(false);
      setIsError(true);
      setHasFallback(true);
      setError(new Error(`Failed to load sprite from Smash MU CDN: ${targetUrl}`));
      return;
    }

    // Start preloading
    setIsLoading(true);
    setIsLoaded(false);
    setIsError(false);
    setHasFallback(false);
    setError(null);
    setActiveUrl(targetUrl);

    preloadItemSprite(targetUrl)
      .then((success) => {
        if (isCancelled) return;
        setIsLoading(false);
        if (success) {
          setActiveUrl(targetUrl);
          setIsLoaded(true);
          setIsError(false);
          setHasFallback(false);
          setError(null);
        } else {
          // Switch to fallback URL smoothly
          setActiveUrl(safeFallback);
          setIsLoaded(false);
          setIsError(true);
          setHasFallback(true);
          setError(new Error(`Failed to load sprite from Smash MU CDN: ${targetUrl}`));
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        setIsLoading(false);
        setActiveUrl(safeFallback);
        setIsLoaded(false);
        setIsError(true);
        setHasFallback(true);
        setError(err instanceof Error ? err : new Error(String(err)));
      });

    return () => {
      isCancelled = true;
    };
  }, [targetUrl, safeFallback, skipPreload, reloadCounter]);

  return {
    spriteUrl: activeUrl,
    rawSpriteUrl: targetUrl,
    isLoading,
    isLoaded,
    isError,
    hasFallback,
    error,
    reload,
  };
}

export interface ItemSpriteImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  itemName?: string;
  category?: string;
  imagePath?: string;
  customImage?: string;
  fallbackUrl?: string;
  containerClassName?: string;
}

/**
 * Reusable component that uses the useItemSprite hook for seamless image loading,
 * shimmer skeleton, and CDN error fallback.
 */
export const ItemSpriteImage: React.FC<ItemSpriteImageProps> = ({
  itemName,
  category,
  imagePath,
  customImage,
  fallbackUrl,
  containerClassName = '',
  className = '',
  alt = '',
  ...imgProps
}) => {
  const { spriteUrl, isLoading } = useItemSprite({
    itemName,
    category,
    imagePath,
    customImage,
    fallbackUrl,
  });

  return (
    <div className={`relative flex items-center justify-center ${containerClassName}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded animate-pulse">
          <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <img
        src={spriteUrl}
        alt={alt || itemName || 'Ítem Mu Online'}
        className={`${className} ${isLoading ? 'opacity-20' : 'opacity-100'} transition-opacity duration-200`}
        {...imgProps}
      />
    </div>
  );
};

export default useItemSprite;
