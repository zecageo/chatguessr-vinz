import { ipcRenderer } from 'electron'

declare global {
  interface Window {
    chatguessrApi: typeof chatguessrApi
  }
}

export const chatguessrApi = {
  setGuessesOpen(open: boolean) {
    if (open) {
      ipcRenderer.send('open-guesses')
    } else {
      ipcRenderer.send('close-guesses')
    }
  },

  getCurrentLocation(): Promise<Location_> {
    return ipcRenderer.invoke('get-current-location')
  },
  startNextRound() {
    ipcRenderer.send('next-round-click')
  },

  returnToMapPage() {
    ipcRenderer.send('return-to-map-page')
  },

  getSettings(): Promise<Settings> {
    return ipcRenderer.invoke('get-settings')
  },

  saveSettings(settings: Settings) {
    ipcRenderer.send('save-settings', settings)
  },

  getGlobalStats(sinceTime: StatisticsInterval): Promise<Statistics> {
    return ipcRenderer.invoke('get-global-stats', sinceTime)
  },

  clearGlobalStats(sinceTime: StatisticsInterval): Promise<boolean> {
    return ipcRenderer.invoke('clear-global-stats', sinceTime)
  },

  getBannedUsers(): Promise<{ username: string }[]> {
    return ipcRenderer.invoke('get-banned-users')
  },

  addBannedUser(username: string) {
    ipcRenderer.send('add-banned-user', username)
  },

  deleteBannedUser(username: string) {
    ipcRenderer.send('delete-banned-user', username)
  },
  returnMyLastLoc(url: string, username: string, locationNumber: number): void {
    console.log("locationnumber inside returnMyLastLoc", locationNumber)
    ipcRenderer.send('return-my-last-loc', url, username, locationNumber)

  },

  appDataPathExists(subdir?: string): Promise<string | false> {
    return ipcRenderer.invoke('app-data-path-exists', subdir)
  },

  importAudioFile(): Promise<unknown> {
    return ipcRenderer.invoke('import-audio-file')
  },

  onGameStarted(
    callback: (
      isMultiGuess: boolean,
      isBRMode: boolean,
      modeHelp: string[],
      restoredGuesses: RoundResult[] | Player[],
      location: Location_
    ) => void
  ) {
    return ipcRendererOn('game-started', callback)
  },
  onRoundStarted(
    callback: (
      modeHelp: string[],
    ) => void
  ) {
    return ipcRendererOn('round-started', callback)
  },
  onGameQuit(callback: () => void) {
    return ipcRendererOn('game-quitted', callback)
  },

  onPickNextMap: (callback: (mapId: string) => void) =>
    ipcRenderer.on('pick-next-map', (_event, mapId) => callback(mapId)),

  onReceiveGuess(callback: (guess: Guess) => void) {
    return ipcRendererOn('render-guess', callback)
  },

  onReceiveMultiGuesses(callback: (guess: Guess) => void) {
    return ipcRendererOn('render-multiguess', callback)
  },
  onMoveForward(callback: (value) => void) {
    return ipcRendererOn('move-forward', callback)
  },
  onMoveBackward(callback: (value) => void) {
    return ipcRendererOn('move-backward', callback)
  },
  onPanLeft(callback: (value) => void) {
    return ipcRendererOn('pan-left', callback)
  },
  onPanRight(callback: (value) => void) {
    return ipcRendererOn('pan-right', callback)
  },
  onPanUp(callback: (value) => void) {
    return ipcRendererOn('pan-up', callback)
  },
  onPanDown(callback: (value) => void) {
    return ipcRendererOn('pan-down', callback)
  },
  onZoomIn(callback: (value) => void) {
    return ipcRendererOn('zoom-in', callback)
  },
  onZoomOut(callback: (value) => void) {
    return ipcRendererOn('zoom-out', callback)
  },
  onRetrieveMyLastLoc(callback: (location: Location_, username:string, locationNumber: number) => void) {
    return ipcRendererOn('retrieve-my-last-loc', callback)
  },
  onShowRoundResults(
    callback: (
      round: number,
      location: Location_,
      roundResults: RoundResult[],
      markerLimit: number
    ) => void
  ) {
    return ipcRendererOn('show-round-results', callback)
  },

  onShowGameResults(callback: (locations: Location_[], gameResults: GameResult[]) => void) {
    return ipcRendererOn('show-game-results', callback)
  },

  onStartRound(callback: (location: Location_) => void) {
    return ipcRendererOn('next-round', callback)
  },

  onRefreshRound(callback: (location: Location_) => void) {
    return ipcRendererOn('refreshed-in-game', callback)
  },
  sendPano(pano: string): void {
    console.log("about to send pano", pano)
    ipcRenderer.send('send-pano', pano)
  },

  onGuessesOpenChanged(callback: (open: boolean) => void) {
    const remove = [
      ipcRendererOn('switch-on', () => callback(true)),
      ipcRendererOn('switch-off', () => callback(false))
    ]
    return () => {
      for (const unlisten of remove) {
        unlisten()
      }
    }
  },

  reconnect(): void {
    ipcRenderer.send('reconnect')
  },

  replaceSession(): void {
    ipcRenderer.invoke('replace-session')
  },

  getTwitchConnectionState(): Promise<TwitchConnectionState> {
    return ipcRenderer.invoke('get-twitch-connection-state')
  }, 
  getRandomPlonkLatLng(): Promise<LatLng> {
    return ipcRenderer.invoke('get-streamer-random-plonk-lat-lng')
  },


  onTwitchConnectionStateChange(callback: (state: TwitchConnectionState) => void) {
    return ipcRendererOn('twitch-connection-state', callback)
  },

  onTwitchError(callback: (err: unknown) => void) {
    return ipcRendererOn('twitch-error', callback)
  },

  getSocketConnectionState(): Promise<SocketConnectionState> {
    return ipcRenderer.invoke('get-socket-connection-state')
  },

  onSocketConnected(callback: () => void) {
    return ipcRendererOn('socket-connected', callback)
  },

  onSocketDisconnected(callback: () => void) {
    return ipcRendererOn('socket-disconnected', callback)
  },

  getCurrentVersion(): Promise<string> {
    return ipcRenderer.invoke('get-current-version')
  }
}

function ipcRendererOn(event: string, callback: (...args: any[]) => void) {
  const listener = (_event: unknown, ...args: unknown[]) => {
    callback(...args)
  }

  ipcRenderer.on(event, listener)
  return () => ipcRenderer.off(event, listener)
}
