import { useEffect, useRef } from 'react'
import { Howl } from 'howler'

interface UseMusicOptions {
  loop?: boolean
  volume?: number
  fadeDuration?: number
}

/**
 * Plays a looping background track via Web Audio API.
 * - Pass null to stop music.
 * - Changing src cross-fades to the new track.
 * - Fade-in starts only once the audio is actually playing (handles
 *   browsers that delay playback until first user interaction).
 */
export function useMusic(src: string | null, options: UseMusicOptions = {}) {
  const { loop = true, volume = 0.5, fadeDuration = 800 } = options
  const howlRef = useRef<Howl | null>(null)

  useEffect(() => {
    const prev = howlRef.current

    // Fade out and schedule unload of previous track
    if (prev) {
      prev.fade(prev.volume(), 0, fadeDuration)
      setTimeout(() => prev.unload(), fadeDuration + 50)
      howlRef.current = null
    }

    if (!src) return

    const howl = new Howl({
      src: [src],
      loop,
      volume: 0,     // start silent — fade in once actually playing
      preload: true,
      // No html5:true — use Web Audio API so Howler's autoUnlock works.
      // Howler listens for click/touch/keydown and resumes the AudioContext
      // automatically; html5:true bypasses all of that.
      onplay: () => {
        howl.fade(0, volume, fadeDuration)
      },
      onplayerror: () => {
        // Browser blocked autoplay. Retry once the user interacts and
        // Howler's internal unlock mechanism fires.
        howl.once('unlock', () => howl.play())
      },
      onloaderror: (_id: number, err: unknown) => {
        console.warn('[useMusic] failed to load:', src, err)
      },
    })

    howl.play()
    howlRef.current = howl

    return () => {
      howl.fade(howl.volume(), 0, fadeDuration)
      setTimeout(() => howl.unload(), fadeDuration + 50)
      howlRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])
}
