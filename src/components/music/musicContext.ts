import { createContext, useContext } from 'react'

export interface Music {
  playing: boolean
  toggle: () => void
}

export const MusicContext = createContext<Music>({ playing: false, toggle: () => {} })

export const useMusic = () => useContext(MusicContext)
