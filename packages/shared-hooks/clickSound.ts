import { Howl } from 'howler'

let _howl: Howl | null = null

function getHowl() {
  if (!_howl) {
    _howl = new Howl({
      src: ['/music/click.mp3'],
      volume: 0.7,
      preload: true,
    })
  }
  return _howl
}

/** Play the click SFX. */
export function playClick() {
  getHowl().play()
}
