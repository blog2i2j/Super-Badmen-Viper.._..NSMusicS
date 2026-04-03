import axios from 'axios'
import { createPinia, setActivePinia } from 'pinia'

import { User_ApiService_of_ND } from '../../src/server/server_api/navidrome_api/services_normal/user_management/index_service'
import { Browsing_ApiService_of_ND } from '../../src/server/server_api/navidrome_api/services_normal/browsing/index_service'
import { Playlists_ApiService_of_ND } from '../../src/server/server_api/navidrome_api/services_normal/playlists/index_service'
import { Searching_ApiService_of_ND } from '../../src/server/server_api/navidrome_api/services_normal/searching/index_service'
import { Media_Retrieval_ApiService_of_ND } from '../../src/server/server_api/navidrome_api/services_normal/media_retrieval/index_service'
import { Media_library_scanning_ApiService_of_ND } from '../../src/server/server_api/navidrome_api/services_normal/media_library_scanning/index_service'
import { Album$Medias_Lists_ApiService_of_ND } from '../../src/server/server_api/navidrome_api/services_normal/album$songs_lists/index_service'
import { Navidrome_Public_Api_Adapter } from '../../src/server/server_api/navidrome_api/services_public_middleware/navidrome_public_api_adapter'
import { Get_Navidrome_Public_Data_To_LocalSqlite } from '../../src/server/server_api/navidrome_api/services_public_middleware/class_Get_Navidrome_Public_Data_To_LocalSqlite'
import { store_server_users } from '../../src/server/server_management/store_server_users'
import { store_server_user_model } from '../../src/server/server_management/store_server_user_model'
import { store_server_navidrome_userdata_logic } from '../../src/server/server_management/server_data_select/server_navidrome_user_data/store_server_navidrome_userdata_logic'
import { usePageHomeStore } from '../../src/data/data_status/page_status/home_store/usePageHomeStore'
import { usePageAlbumStore } from '../../src/data/data_status/page_status/album_store/usePageAlbumStore'
import { usePageArtistStore } from '../../src/data/data_status/page_status/artist_store/usePageArtistStore'
import { usePageMediaStore } from '../../src/data/data_status/page_status/media_store/usePageMediaStore'
import { usePlayerSettingStore } from '../../src/data/data_status/comment_status/player_store/usePlayerSettingStore'
import { usePlayerAudioStore } from '../../src/data/data_status/comment_status/player_store/usePlayerAudioStore'
import { usePlaylistStore } from '../../src/data/data_status/comment_status/playlist_store/usePlaylistStore'
import { store_general_fetch_home_list } from '../../src/server/server_api_store/server_api_core/page/page_home/store_general_fetch_home_list'
import { store_general_fetch_album_list } from '../../src/server/server_api_store/server_api_core/page/page_album/store_general_fetch_album_list'
import { store_general_fetch_artist_list } from '../../src/server/server_api_store/server_api_core/page/page_artist/store_general_fetch_artist_list'
import { store_general_fetch_media_list } from '../../src/server/server_api_store/server_api_core/page/page_media_file/store_general_fetch_media_list'
import { store_server_data_set_mediaInfo } from '../../src/server/server_api_store/server_api_core/annotation/store_server_data_set_mediaInfo'
import { store_server_data_set_albumInfo } from '../../src/server/server_api_store/server_api_core/annotation/store_server_data_set_albumInfo'
import { store_server_data_set_artistInfo } from '../../src/server/server_api_store/server_api_core/annotation/store_server_data_set_artistInfo'
import { store_server_data_set_playlistInfo } from '../../src/server/server_api_store/server_api_core/annotation/store_server_data_set_playlistInfo'

type SmokeSummary = {
  authStatus: string
  authRefresh: boolean
  adapter: Record<string, any>
  apiSurface: Record<string, any>
  bridge: Record<string, any>
  playlistCrud: Record<string, any>
  annotation: Record<string, any>
  storeFlow: Record<string, any>
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

async function waitForCondition(
  predicate: () => boolean,
  timeoutMs: number,
  intervalMs = 100
) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    if (predicate()) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
  throw new Error(`等待条件超时: ${timeoutMs}ms`)
}

async function waitForValue<T>(
  factory: () => Promise<T | undefined>,
  timeoutMs: number,
  errorMessage: string,
  intervalMs = 500
): Promise<T> {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    const value = await factory()
    if (value !== undefined) {
      return value
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
  throw new Error(errorMessage)
}

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (Array.isArray(value)) {
    return value
  }
  return value ? [value] : []
}

function parseSubsonicPayload(response: any): Record<string, any> {
  return (
    response?.['subsonic-response'] ||
    response?.subsonic_response ||
    response?.subsonicResponse ||
    {}
  )
}

function buildRestUrl(
  restUrl: string,
  username: string,
  token: string,
  salt: string,
  endpoint: string,
  params: Record<string, string> = {}
) {
  const query = new URLSearchParams({
    u: username,
    t: token,
    s: salt,
    v: '1.12.0',
    c: 'nsmusics',
    f: 'json',
    ...params,
  }).toString()
  return `${restUrl}/${endpoint}?${query}`
}

async function inspectBinaryEndpoint(url: string) {
  const response = await axios.get(url, {
    responseType: 'stream',
    timeout: 20000,
    validateStatus: (status) => status >= 200 && status < 400,
  })

  const stream = response.data
  await new Promise<void>((resolve, reject) => {
    let settled = false
    stream.once('data', () => {
      if (settled) return
      settled = true
      stream.destroy()
      resolve()
    })
    stream.once('end', () => {
      if (settled) return
      settled = true
      resolve()
    })
    stream.once('error', (error: any) => {
      if (settled) return
      settled = true
      reject(error)
    })
  })

  return {
    status: response.status,
    contentType: String(response.headers['content-type'] || ''),
    contentLength: String(response.headers['content-length'] || ''),
  }
}

function normalizeBaseUrl(input: string): { baseUrl: string; restUrl: string } {
  const trimmed = input.trim().replace(/\/+$/, '')
  const baseUrl = trimmed.endsWith('/rest') ? trimmed.slice(0, -5) : trimmed
  const restUrl = `${baseUrl}/rest`
  return { baseUrl, restUrl }
}

function resolveCredentials() {
  const url = process.env.NSMUSICS_ND_URL || process.argv[2] || 'http://localhost:4533'
  const username = process.env.NSMUSICS_ND_USER || process.argv[3] || 'mozhi'
  const password = process.env.NSMUSICS_ND_PASSWORD || process.argv[4] || 'qwer1234'
  const encrypted = store_server_navidrome_userdata_logic.navidrome_get_EncryptedPassword(password)
  const salt = encrypted.salt
  const token = encrypted.token

  assertCondition(url, '缺少 Navidrome URL')
  assertCondition(username, '缺少 Navidrome 用户名')
  assertCondition(password, '缺少 Navidrome 密码')

  return {
    ...normalizeBaseUrl(url),
    username,
    password,
    salt,
    token,
  }
}

async function runAuthRefreshSmoke(
  baseUrl: string,
  username: string,
  password: string,
  token: string,
  salt: string
) {
  store_server_users.server_select_kind = 'navidrome'
  store_server_users.server_config_of_current_user_of_sqlite = {
    id: 'navidrome-auth-refresh',
    server_name: 'navidrome-auth-refresh',
    url: baseUrl,
    user_name: username,
    password,
    last_login_at: '',
    type: 'navidrome',
  } as any
  store_server_user_model.username = username
  store_server_user_model.password = password
  store_server_user_model.token = token
  store_server_user_model.salt = salt

  return await store_server_user_model.refresh_model_server_type_of_web()
}

async function runAdapterSmoke(
  restUrl: string,
  username: string,
  token: string,
  salt: string
) {
  const userApi = new User_ApiService_of_ND(restUrl)
  const authResponse = await userApi.getUser(username, token, salt)
  const authStatus = authResponse?.['subsonic-response']?.status || 'unknown'
  assertCondition(authStatus === 'ok', `公开 API 登录校验失败: ${authStatus}`)

  const adapter = new Navidrome_Public_Api_Adapter()

  const playCountHome = await adapter.getHomeSection({
    kind: 'play_count',
    url: restUrl,
    username,
    token,
    salt,
    start: '0',
    end: '5',
  })
  const randomHome = await adapter.getHomeSection({
    kind: 'random',
    url: restUrl,
    username,
    token,
    salt,
    start: '0',
    end: '5',
  })
  const recentAddedHome = await adapter.getHomeSection({
    kind: 'recently_added',
    url: restUrl,
    username,
    token,
    salt,
    start: '0',
    end: '5',
  })
  const recentPlayedHome = await adapter.getHomeSection({
    kind: 'recently_played',
    url: restUrl,
    username,
    token,
    salt,
    start: '0',
    end: '5',
  })

  const albumList = await adapter.getAlbumList({
    url: restUrl,
    username,
    token,
    salt,
    start: '0',
    end: '5',
    order: 'asc',
    sort: 'name',
    search: '',
    starred: '',
    artistId: '',
  })
  assertCondition(albumList.items.length > 0, 'adapter.getAlbumList 未返回专辑数据')

  const artistList = await adapter.getArtistList({
    url: restUrl,
    username,
    token,
    salt,
    start: '0',
    end: '5',
    order: 'asc',
    sort: 'name',
    search: '',
    starred: '',
  })
  assertCondition(artistList.items.length > 0, 'adapter.getArtistList 未返回艺术家数据')

  const firstAlbumId = String(albumList.items[0]?.id || '')
  assertCondition(firstAlbumId.length > 0, 'adapter.getAlbumList 返回的首个专辑缺少 id')

  const mediaList = await adapter.getMediaList({
    url: restUrl,
    username,
    token,
    salt,
    start: '0',
    end: '5',
    order: 'asc',
    sort: 'title',
    search: '',
    starred: '',
    playlistId: '',
    albumId: firstAlbumId,
    artistId: '',
    year: '',
  })
  assertCondition(mediaList.items.length > 0, 'adapter.getMediaList 未返回媒体数据')

  let searchAlbumCount = 0
  const searchKeyword = String(albumList.items[0]?.name || '').trim()
  if (searchKeyword) {
    const searchAlbumList = await adapter.getAlbumList({
      url: restUrl,
      username,
      token,
      salt,
      start: '0',
      end: '5',
      order: 'asc',
      sort: 'name',
      search: searchKeyword,
      starred: '',
      artistId: '',
    })
    searchAlbumCount = searchAlbumList.items.length
  }

  return {
    authStatus,
    home: {
      playCount: playCountHome.length,
      random: randomHome.length,
      recentlyAdded: recentAddedHome.length,
      recentlyPlayed: recentPlayedHome.length,
    },
    albums: albumList.items.length,
    artists: artistList.items.length,
    mediasFromFirstAlbum: mediaList.items.length,
    firstAlbumId,
    searchAlbumCount,
  }
}

async function runPlaylistCrudSmoke(
  restUrl: string,
  username: string,
  token: string,
  salt: string,
  adapter: Navidrome_Public_Api_Adapter
) {
  const playlistApi = new Playlists_ApiService_of_ND(restUrl)
  const before = await playlistApi.getPlaylists_all(username, token, salt)
  const beforePlaylistsRaw = before?.['subsonic-response']?.playlists?.playlist
  const beforePlaylists = Array.isArray(beforePlaylistsRaw)
    ? beforePlaylistsRaw
    : beforePlaylistsRaw
      ? [beforePlaylistsRaw]
      : []
  const beforeCount = beforePlaylists.length

  const albumList = await adapter.getAlbumList({
    url: restUrl,
    username,
    token,
    salt,
    start: '0',
    end: '1',
    order: 'asc',
    sort: 'name',
    search: '',
    starred: '',
    artistId: '',
  })
  const firstAlbumId = String(albumList.items[0]?.id || '')
  assertCondition(firstAlbumId, 'playlist CRUD 测试缺少可用专辑')

  const mediaList = await adapter.getMediaList({
    url: restUrl,
    username,
    token,
    salt,
    start: '0',
    end: '1',
    order: 'asc',
    sort: 'title',
    search: '',
    starred: '',
    playlistId: '',
    albumId: firstAlbumId,
    artistId: '',
    year: '',
  })
  const firstSongId = String(mediaList.items[0]?.id || '')
  assertCondition(firstSongId, 'playlist CRUD 测试缺少可用歌曲')

  const playlistName = `codex-public-api-${Date.now()}`
  const createResult = await playlistApi.createPlaylist_set(username, token, salt, playlistName)
  const playlistId = String(createResult?.['subsonic-response']?.playlist?.id || '')
  assertCondition(playlistId, 'createPlaylist.view 未返回 playlist id')

  try {
    await playlistApi.updatePlaylist_songIdToAdd(username, token, salt, playlistId, firstSongId)
    const playlistMedia = await adapter.getMediaList({
      url: restUrl,
      username,
      token,
      salt,
      start: '0',
      end: '5',
      order: 'asc',
      sort: 'title',
      search: '',
      starred: '',
      playlistId,
      albumId: '',
      artistId: '',
      year: '',
    })
    assertCondition(playlistMedia.items.length > 0, 'playlist add song 后未读到歌曲')

    await playlistApi.updatePlaylist_songIndexToRemove(username, token, salt, playlistId, '0')
    const playlistMediaAfterRemove = await adapter.getMediaList({
      url: restUrl,
      username,
      token,
      salt,
      start: '0',
      end: '5',
      order: 'asc',
      sort: 'title',
      search: '',
      starred: '',
      playlistId,
      albumId: '',
      artistId: '',
      year: '',
    })

    const afterCreate = await playlistApi.getPlaylists_all(username, token, salt)
    const afterPlaylistsRaw = afterCreate?.['subsonic-response']?.playlists?.playlist
    const afterPlaylists = Array.isArray(afterPlaylistsRaw)
      ? afterPlaylistsRaw
      : afterPlaylistsRaw
        ? [afterPlaylistsRaw]
        : []

    return {
      beforeCount,
      afterCreateCount: afterPlaylists.length,
      playlistId,
      playlistSongCount: playlistMedia.items.length,
      playlistSongCountAfterRemove: playlistMediaAfterRemove.items.length,
    }
  } finally {
    await playlistApi.deletePlaylist_set(username, token, salt, playlistId)
  }
}

async function runBridgeSmoke(
  baseUrl: string,
  restUrl: string,
  username: string,
  password: string,
  token: string,
  salt: string
) {
  setActivePinia(createPinia())

  store_server_users.server_select_kind = 'navidrome'
  store_server_users.server_config_of_current_user_of_sqlite = {
    id: 'navidrome-smoke',
    server_name: 'navidrome-smoke',
    url: baseUrl,
    user_name: username,
    password,
    last_login_at: '',
    type: 'navidrome',
  } as any

  store_server_user_model.model_select = 'server'
  store_server_user_model.model_server_type_of_web = true
  store_server_user_model.model_server_type_of_local = false
  store_server_user_model.username = username
  store_server_user_model.password = password
  store_server_user_model.token = token
  store_server_user_model.salt = salt

  const homeStore = usePageHomeStore()
  const albumStore = usePageAlbumStore()
  const artistStore = usePageArtistStore()
  const mediaStore = usePageMediaStore()
  const playerSettingStore = usePlayerSettingStore()
  const playerAudioStore = usePlayerAudioStore()
  const playlistStore = usePlaylistStore()

  homeStore.home_Files_temporary_maximum_playback = []
  homeStore.home_Files_temporary_random_search = []
  homeStore.home_Files_temporary_recently_added = []
  homeStore.home_Files_temporary_recently_played = []
  homeStore.home_Files_temporary_recently_added_search = { start: '0', end: '5' }
  albumStore.album_Files_temporary = []
  albumStore.album_File_metadata = []
  artistStore.artist_Files_temporary = []
  artistStore.artist_File_metadata = []
  mediaStore.media_Files_temporary = []
  mediaStore.media_File_metadata = []
  playlistStore.playlist_MediaFiles_temporary = []
  playlistStore.playlist_datas_CurrentPlayList_ALLMediaIds = []
  store_general_fetch_media_list._load_model = 'search'
  store_server_user_model.random_play_model_search = false
  store_server_user_model.random_play_model_add = false

  const bridge = new Get_Navidrome_Public_Data_To_LocalSqlite()

  await bridge.get_home_list(restUrl, username, token, salt)
  await bridge.get_album_list(restUrl, username, token, salt, '5', 'asc', 'name', '0', '', '', '')
  await bridge.get_artist_list(restUrl, username, token, salt, '5', 'asc', 'name', '0', '', '')

  assertCondition(albumStore.album_Files_temporary.length > 0, 'bridge.get_album_list 未写入专辑 store')
  assertCondition(artistStore.artist_Files_temporary.length > 0, 'bridge.get_artist_list 未写入艺术家 store')

  const firstAlbumId = String(albumStore.album_Files_temporary[0]?.id || '')
  assertCondition(firstAlbumId.length > 0, 'bridge 专辑 store 首项缺少 id')

  await bridge.get_media_list(
    restUrl,
    username,
    token,
    salt,
    '5',
    'asc',
    'title',
    '0',
    '',
    '',
    '',
    firstAlbumId,
    '',
    ''
  )

  assertCondition(mediaStore.media_Files_temporary.length > 0, 'bridge.get_media_list 未写入媒体 store')

  const firstMedia = mediaStore.media_Files_temporary[0]
  assertCondition(firstMedia, 'bridge 媒体 store 首项为空')
  await playerSettingStore.update_current_lyrics(firstMedia)
  assertCondition(
    typeof playerAudioStore.this_audio_lyrics_string === 'string',
    '公开 API 歌词链路未写入播放器歌词状态'
  )

  await bridge.get_count_of_media_file(restUrl, username, token, salt)
  await bridge.get_count_of_artist_album(restUrl, username, token, salt)
  await bridge.get_count_of_starred(restUrl, username, token, salt)
  await bridge.get_count_of_playlist(restUrl, username, token, salt)

  await bridge.get_random_song_list(restUrl, username, token, salt, '5', '', '')
  await waitForCondition(() => playlistStore.playlist_MediaFiles_temporary.length > 0, 15000)

  return {
    home: {
      playCount: homeStore.home_Files_temporary_maximum_playback.length,
      random: homeStore.home_Files_temporary_random_search.length,
      recentlyAdded: homeStore.home_Files_temporary_recently_added.length,
      recentlyPlayed: homeStore.home_Files_temporary_recently_played.length,
    },
    albums: albumStore.album_Files_temporary.length,
    artists: artistStore.artist_Files_temporary.length,
    mediasFromFirstAlbum: mediaStore.media_Files_temporary.length,
    firstAlbumId,
    lyricLength: playerAudioStore.this_audio_lyrics_string.length,
    mediaCount: mediaStore.media_item_count,
    albumCount: albumStore.album_item_count,
    artistCount: artistStore.artist_item_count,
    playlistCount: mediaStore.media_playlist_count,
    randomPlaylistLength: playlistStore.playlist_MediaFiles_temporary.length,
  }
}

async function getSongPayload(
  browsing: Browsing_ApiService_of_ND,
  username: string,
  token: string,
  salt: string,
  songId: string
) {
  const response = await browsing.getSong(username, token, salt, songId)
  return response?.['subsonic-response']?.song || {}
}

async function getAlbumPayload(
  browsing: Browsing_ApiService_of_ND,
  username: string,
  token: string,
  salt: string,
  albumId: string
) {
  const response = await browsing.getAlbum(username, token, salt, albumId)
  return response?.['subsonic-response']?.album || {}
}

async function getArtistPayload(
  browsing: Browsing_ApiService_of_ND,
  username: string,
  token: string,
  salt: string,
  artistId: string
) {
  const response = await browsing.getArtist(username, token, salt, artistId)
  return response?.['subsonic-response']?.artist || {}
}

async function getStarredState(params: {
  albumSongs: Album$Medias_Lists_ApiService_of_ND
  username: string
  token: string
  salt: string
  songId: string
  albumId: string
  artistId: string
}) {
  const { albumSongs, username, token, salt, songId, albumId, artistId } = params
  const response = await albumSongs.getStarred2_all(username, token, salt)
  const payload = parseSubsonicPayload(response)
  const root = payload.starred2 || {}
  return {
    song: asArray(root.song).some((item: any) => String(item?.id || '') === songId),
    album: asArray(root.album).some((item: any) => String(item?.id || '') === albumId),
    artist: asArray(root.artist).some((item: any) => String(item?.id || '') === artistId),
  }
}

async function waitForPlaybackMutation(params: {
  browsing: Browsing_ApiService_of_ND
  username: string
  token: string
  salt: string
  songId: string
  albumId: string
  previousSongPlayCount: number
  previousSongPlayed: string
  previousAlbumPlayCount: number
  previousAlbumPlayed: string
}) {
  const {
    browsing,
    username,
    token,
    salt,
    songId,
    albumId,
    previousSongPlayCount,
    previousSongPlayed,
    previousAlbumPlayCount,
    previousAlbumPlayed,
  } = params

  const startedAt = Date.now()
  while (Date.now() - startedAt < 15000) {
    const song = await getSongPayload(browsing, username, token, salt, songId)
    const album = await getAlbumPayload(browsing, username, token, salt, albumId)

    const songPlayCount = Number(song?.playCount || 0)
    const songPlayed = String(song?.played || song?.playDate || '')
    const albumPlayCount = Number(album?.playCount || 0)
    const albumPlayed = String(album?.played || album?.playDate || '')

    const songChanged =
      songPlayCount > previousSongPlayCount || songPlayed !== previousSongPlayed
    const albumChanged =
      albumPlayCount > previousAlbumPlayCount || albumPlayed !== previousAlbumPlayed

    if (songChanged && albumChanged) {
      return { song, album }
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error('等待 Navidrome 公开 API 播放记录同步超时')
}

async function waitForRecentTargets(params: {
  restUrl: string
  username: string
  token: string
  salt: string
  targetAlbumId: string
  targetSongId: string
  targetArtistId: string
}) {
  const { restUrl, username, token, salt, targetAlbumId, targetSongId, targetArtistId } = params
  const adapter = new Navidrome_Public_Api_Adapter()
  const artistStore = usePageArtistStore()

  const startedAt = Date.now()
  while (Date.now() - startedAt < 15000) {
    const recentAlbums = await adapter.getAlbumList({
      url: restUrl,
      username,
      token,
      salt,
      start: '0',
      end: '5',
      order: 'desc',
      sort: 'playDate',
      search: '',
      starred: '',
      artistId: '',
      recentlyPlayed: true,
    })

    const recentSongs = await adapter.getMediaList({
      url: restUrl,
      username,
      token,
      salt,
      start: '0',
      end: '5',
      order: 'desc',
      sort: 'playDate',
      search: '',
      starred: '',
      playlistId: '',
      albumId: '',
      artistId: '',
      year: '',
      recentlyPlayed: true,
    })

    artistStore.page_artistlists_selected = 'artist_list_recently'
    artistStore.page_artistlists_keyword = ''
    artistStore.page_artistlists_options_Sort_key = []
    artistStore.artist_Files_temporary = []
    await store_general_fetch_artist_list.fetchData_Artist_of_server_web_start()

    const recentAlbumTopId = String(recentAlbums.items[0]?.id || '')
    const recentSongTopId = String(recentSongs.items[0]?.id || '')
    const recentArtistTopId = String(artistStore.artist_Files_temporary[0]?.id || '')

    if (
      recentAlbumTopId === targetAlbumId &&
      recentSongTopId === targetSongId &&
      recentArtistTopId === targetArtistId
    ) {
      return {
        recentAlbumTopId,
        recentSongTopId,
        recentArtistTopId,
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return {
    recentAlbumTopId: '',
    recentSongTopId: '',
    recentArtistTopId: String(artistStore.artist_Files_temporary[0]?.id || ''),
  }
}

async function runAnnotationSmoke(
  baseUrl: string,
  restUrl: string,
  username: string,
  password: string,
  token: string,
  salt: string
) {
  setActivePinia(createPinia())

  store_server_users.server_select_kind = 'navidrome'
  store_server_users.server_config_of_current_user_of_sqlite = {
    id: 'navidrome-annotation-smoke',
    server_name: 'navidrome-annotation-smoke',
    url: baseUrl,
    user_name: username,
    password,
    last_login_at: '',
    type: 'navidrome',
  } as any

  store_server_user_model.model_select = 'server'
  store_server_user_model.model_server_type_of_web = true
  store_server_user_model.model_server_type_of_local = false
  store_server_user_model.username = username
  store_server_user_model.password = password
  store_server_user_model.token = token
  store_server_user_model.salt = salt

  const adapter = new Navidrome_Public_Api_Adapter()
  const browsing = new Browsing_ApiService_of_ND(restUrl)
  const albumStore = usePageAlbumStore()
  const artistStore = usePageArtistStore()
  const mediaStore = usePageMediaStore()

  store_general_fetch_media_list._load_model = 'search'
  store_general_fetch_media_list.fetchData_Media_of_server_web_clear_all_parms()
  store_general_fetch_album_list.set_artist_id('')

  const albumList = await adapter.getAlbumList({
    url: restUrl,
    username,
    token,
    salt,
    start: '0',
    end: '10',
    order: 'asc',
    sort: 'name',
    search: '',
    starred: '',
    artistId: '',
  })
  const targetAlbum = albumList.items.find((item) => String(item?.id || '').length > 0)
  assertCondition(targetAlbum, 'annotation smoke 缺少可用专辑')

  const mediaList = await adapter.getMediaList({
    url: restUrl,
    username,
    token,
    salt,
    start: '0',
    end: '10',
    order: 'asc',
    sort: 'title',
    search: '',
    starred: '',
    playlistId: '',
    albumId: String(targetAlbum.id),
    artistId: '',
    year: '',
  })
  const targetSong = mediaList.items.find((item) => String(item?.id || '').length > 0)
  assertCondition(targetSong, 'annotation smoke 缺少可用歌曲')

  const targetSongId = String(targetSong.id)
  const targetAlbumId = String(targetSong.album_id || targetSong.albumId || targetAlbum.id)
  const targetArtistId = String(targetSong.artist_id || targetSong.artistId || '')
  assertCondition(targetAlbumId, 'annotation smoke 缺少歌曲 album id')
  assertCondition(targetArtistId, 'annotation smoke 缺少歌曲 artist id')

  const songBefore = await getSongPayload(browsing, username, token, salt, targetSongId)
  const albumBefore = await getAlbumPayload(browsing, username, token, salt, targetAlbumId)
  const previousSongPlayCount = Number(songBefore?.playCount || 0)
  const previousSongPlayed = String(songBefore?.played || songBefore?.playDate || '')
  const previousAlbumPlayCount = Number(albumBefore?.playCount || 0)
  const previousAlbumPlayed = String(albumBefore?.played || albumBefore?.playDate || '')

  await store_server_data_set_mediaInfo.Set_MediaInfo_To_PlayCount_of_Media_File_Server(targetSongId)

  const playbackMutation = await waitForPlaybackMutation({
    browsing,
    username,
    token,
    salt,
    songId: targetSongId,
    albumId: targetAlbumId,
    previousSongPlayCount,
    previousSongPlayed,
    previousAlbumPlayCount,
    previousAlbumPlayed,
  })

  await store_server_data_set_albumInfo.Set_AlbumInfo_To_PlayCount_of_Album_Server(targetAlbumId)
  await store_server_data_set_artistInfo.Set_ArtistInfo_To_PlayCount_of_Artist_Server(targetArtistId)

  const albumAfterNoop = await getAlbumPayload(browsing, username, token, salt, targetAlbumId)
  assertCondition(
    Number(albumAfterNoop?.playCount || 0) === Number(playbackMutation.album?.playCount || 0),
    'album 播放记录不应再通过公开 API scrobble 直接推送'
  )

  const { recentAlbumTopId, recentSongTopId, recentArtistTopId } = await waitForRecentTargets({
    restUrl,
    username,
    token,
    salt,
    targetAlbumId,
    targetSongId,
    targetArtistId,
  })

  assertCondition(recentAlbumTopId === targetAlbumId, 'album 最近播放拉取未命中新 scrobble 专辑')
  assertCondition(recentSongTopId === targetSongId, 'song 最近播放拉取未命中新 scrobble 歌曲')
  assertCondition(recentArtistTopId === targetArtistId, 'artist 最近播放拉取未命中新 scrobble 歌手')

  return {
    targetSongId,
    targetAlbumId,
    targetArtistId,
    songPlayCountBefore: previousSongPlayCount,
    songPlayCountAfter: Number(playbackMutation.song?.playCount || 0),
    songPlayedAfter: String(playbackMutation.song?.played || playbackMutation.song?.playDate || ''),
    albumPlayCountBefore: previousAlbumPlayCount,
    albumPlayCountAfter: Number(playbackMutation.album?.playCount || 0),
    albumPlayedAfter: String(
      playbackMutation.album?.played || playbackMutation.album?.playDate || ''
    ),
    albumNoopStable: Number(albumAfterNoop?.playCount || 0),
    recentAlbumTopId,
    recentSongTopId,
    recentArtistTopId,
  }
}

async function runApiSurfaceSmoke(
  baseUrl: string,
  restUrl: string,
  username: string,
  password: string,
  token: string,
  salt: string
) {
  setActivePinia(createPinia())

  store_server_users.server_select_kind = 'navidrome'
  store_server_users.server_config_of_current_user_of_sqlite = {
    id: 'navidrome-api-surface-smoke',
    server_name: 'navidrome-api-surface-smoke',
    url: baseUrl,
    user_name: username,
    password,
    last_login_at: '',
    type: 'navidrome',
  } as any

  store_server_user_model.model_select = 'server'
  store_server_user_model.model_server_type_of_web = true
  store_server_user_model.model_server_type_of_local = false
  store_server_user_model.username = username
  store_server_user_model.password = password
  store_server_user_model.token = token
  store_server_user_model.salt = salt

  const browsing = new Browsing_ApiService_of_ND(restUrl)
  const searching = new Searching_ApiService_of_ND(restUrl)
  const retrieval = new Media_Retrieval_ApiService_of_ND(restUrl)
  const scanning = new Media_library_scanning_ApiService_of_ND(restUrl)
  const albumSongs = new Album$Medias_Lists_ApiService_of_ND(restUrl)
  const playlists = new Playlists_ApiService_of_ND(restUrl)
  const adapter = new Navidrome_Public_Api_Adapter()

  const albumList = await adapter.getAlbumList({
    url: restUrl,
    username,
    token,
    salt,
    start: '0',
    end: '5',
    order: 'asc',
    sort: 'name',
    search: '',
    starred: '',
    artistId: '',
  })
  const targetAlbum = albumList.items.find((item) => String(item?.id || '').length > 0)
  assertCondition(targetAlbum, 'api surface smoke 缺少可用专辑')

  const mediaList = await adapter.getMediaList({
    url: restUrl,
    username,
    token,
    salt,
    start: '0',
    end: '5',
    order: 'asc',
    sort: 'title',
    search: '',
    starred: '',
    playlistId: '',
    albumId: String(targetAlbum.id),
    artistId: '',
    year: '',
  })
  const targetSong = mediaList.items.find((item) => String(item?.id || '').length > 0)
  assertCondition(targetSong, 'api surface smoke 缺少可用歌曲')

  const targetSongId = String(targetSong.id)
  const targetAlbumId = String(targetSong.album_id || targetSong.albumId || targetAlbum.id)
  const targetArtistId = String(targetSong.artist_id || targetSong.artistId || '')
  assertCondition(targetArtistId, 'api surface smoke 缺少可用歌手')

  const searchKeyword =
    String(targetSong.title || targetSong.name || '')
      .split(/\s+/)
      .filter(Boolean)[0] || String(targetSong.title || targetSong.name || '')

  const musicFoldersPayload = parseSubsonicPayload(
    await browsing.getMusicFolders(username, token, salt)
  )
  const musicFolders = asArray(musicFoldersPayload.musicFolders?.musicFolder)
  assertCondition(musicFoldersPayload.status === 'ok', 'getMusicFolders 返回异常')

  const indexesPayload = parseSubsonicPayload(await browsing.getIndexes_all(username, token, salt))
  const indexes = asArray(indexesPayload.indexes?.index)
  assertCondition(indexesPayload.status === 'ok', 'getIndexes 返回异常')

  const artistsPayload = parseSubsonicPayload(await browsing.getArtists_ALL(username, token, salt))
  const artistsIndexes = asArray(artistsPayload.artists?.index)
  const artistsCount = artistsIndexes.flatMap((item: any) => asArray(item.artist)).length
  assertCondition(artistsPayload.status === 'ok', 'getArtists 返回异常')

  const genresPayload = parseSubsonicPayload(await browsing.getGenres(username, token, salt))
  const genres = asArray(genresPayload.genres?.genre)
  assertCondition(genresPayload.status === 'ok', 'getGenres 返回异常')

  const musicDirectoryPayload = parseSubsonicPayload(
    await browsing.getMusicDirectory_id(username, token, salt, targetArtistId)
  )
  const musicDirectory = musicDirectoryPayload.directory || {}
  const musicDirectoryChildren = asArray(musicDirectory.child)
  assertCondition(musicDirectoryPayload.status === 'ok', 'getMusicDirectory 返回异常')
  assertCondition(musicDirectoryChildren.length > 0, 'getMusicDirectory 未返回子项')

  const recentAlbumList2Payload = parseSubsonicPayload(
    await browsing.getAlbumList2(username, token, salt, {
      type: 'recent',
      size: '5',
      offset: '0',
    })
  )
  const newestAlbumList2Payload = parseSubsonicPayload(
    await browsing.getAlbumList2(username, token, salt, {
      type: 'newest',
      size: '5',
      offset: '0',
    })
  )
  const frequentAlbumList2Payload = parseSubsonicPayload(
    await browsing.getAlbumList2(username, token, salt, {
      type: 'frequent',
      size: '5',
      offset: '0',
    })
  )

  const search2Payload = parseSubsonicPayload(
    await searching.getSearch2(username, token, salt, searchKeyword, 0, 0, 0, 0, 1, 0)
  )
  const search2Result = search2Payload.searchResult2 || {}
  const search2ArtistCount = asArray(search2Result.artist).length
  const search2AlbumCount = asArray(search2Result.album).length
  const search2SongCount = asArray(search2Result.song).length
  assertCondition(search2Payload.status === 'ok', 'search2 返回异常')
  assertCondition(search2ArtistCount === 0, `search2 artistCount 异常: ${search2ArtistCount}`)
  assertCondition(search2AlbumCount === 0, `search2 albumCount 异常: ${search2AlbumCount}`)
  assertCondition(search2SongCount <= 1, `search2 songCount 异常: ${search2SongCount}`)

  const nowPlayingPayload = parseSubsonicPayload(
    await albumSongs.getNowPlaying_all(username, token, salt)
  )
  const nowPlayingEntries = asArray(nowPlayingPayload.nowPlaying?.entry)
  assertCondition(nowPlayingPayload.status === 'ok', 'getNowPlaying 返回异常')

  const scanStatusPayload = parseSubsonicPayload(await scanning.getScanStatus(username, token, salt))
  const scanStatus = scanStatusPayload.scanStatus || {}
  assertCondition(scanStatusPayload.status === 'ok', 'getScanStatus 返回异常')

  const lyricsBySongPayload = parseSubsonicPayload(
    await retrieval.getLyrics_id(username, token, salt, targetSongId)
  )
  const lyricsByFilterPayload = parseSubsonicPayload(
    await retrieval.getLyrics_filter(
      username,
      token,
      salt,
      String(targetSong.artist || ''),
      String(targetSong.title || targetSong.name || '')
    )
  )
  assertCondition(lyricsBySongPayload.status === 'ok', 'getLyricsBySongId 返回异常')
  assertCondition(lyricsByFilterPayload.status === 'ok', 'getLyrics 返回异常')

  const streamInfo = await inspectBinaryEndpoint(
    buildRestUrl(restUrl, username, token, salt, 'stream', { id: targetSongId })
  )
  const downloadInfo = await inspectBinaryEndpoint(
    buildRestUrl(restUrl, username, token, salt, 'download', { id: targetSongId })
  )
  const coverArtInfo = await inspectBinaryEndpoint(
    buildRestUrl(restUrl, username, token, salt, 'getCoverArt', { id: targetAlbumId })
  )
  assertCondition(streamInfo.contentType.length > 0, 'stream content-type 为空')
  assertCondition(downloadInfo.contentType.length > 0, 'download content-type 为空')
  assertCondition(
    coverArtInfo.contentType.toLowerCase().includes('image'),
    `getCoverArt content-type 异常: ${coverArtInfo.contentType}`
  )

  const starredBefore = await getStarredState({
    albumSongs,
    username,
    token,
    salt,
    songId: targetSongId,
    albumId: targetAlbumId,
    artistId: targetArtistId,
  })

  await store_server_data_set_mediaInfo.Set_MediaInfo_To_Favorite_Server(
    targetSongId,
    starredBefore.song
  )
  const songFavoriteChanged = await waitForValue(async () => {
    const current = await getStarredState({
      albumSongs,
      username,
      token,
      salt,
      songId: targetSongId,
      albumId: targetAlbumId,
      artistId: targetArtistId,
    })
    return current.song !== starredBefore.song ? current.song : undefined
  }, 15000, 'song favorite change timeout')
  await store_server_data_set_mediaInfo.Set_MediaInfo_To_Favorite_Server(
    targetSongId,
    songFavoriteChanged
  )
  const songFavoriteRestored = await waitForValue(async () => {
    const current = await getStarredState({
      albumSongs,
      username,
      token,
      salt,
      songId: targetSongId,
      albumId: targetAlbumId,
      artistId: targetArtistId,
    })
    return current.song === starredBefore.song ? current.song : undefined
  }, 15000, 'song favorite restore timeout')

  await store_server_data_set_albumInfo.Set_AlbumInfo_To_Favorite_Server(
    targetAlbumId,
    starredBefore.album
  )
  const albumFavoriteChanged = await waitForValue(async () => {
    const current = await getStarredState({
      albumSongs,
      username,
      token,
      salt,
      songId: targetSongId,
      albumId: targetAlbumId,
      artistId: targetArtistId,
    })
    return current.album !== starredBefore.album ? current.album : undefined
  }, 15000, 'album favorite change timeout')
  await store_server_data_set_albumInfo.Set_AlbumInfo_To_Favorite_Server(
    targetAlbumId,
    albumFavoriteChanged
  )
  const albumFavoriteRestored = await waitForValue(async () => {
    const current = await getStarredState({
      albumSongs,
      username,
      token,
      salt,
      songId: targetSongId,
      albumId: targetAlbumId,
      artistId: targetArtistId,
    })
    return current.album === starredBefore.album ? current.album : undefined
  }, 15000, 'album favorite restore timeout')

  await store_server_data_set_artistInfo.Set_ArtistInfo_To_Favorite_Server(
    targetArtistId,
    starredBefore.artist
  )
  const artistFavoriteChanged = await waitForValue(async () => {
    const current = await getStarredState({
      albumSongs,
      username,
      token,
      salt,
      songId: targetSongId,
      albumId: targetAlbumId,
      artistId: targetArtistId,
    })
    return current.artist !== starredBefore.artist ? current.artist : undefined
  }, 15000, 'artist favorite change timeout')
  await store_server_data_set_artistInfo.Set_ArtistInfo_To_Favorite_Server(
    targetArtistId,
    artistFavoriteChanged
  )
  const artistFavoriteRestored = await waitForValue(async () => {
    const current = await getStarredState({
      albumSongs,
      username,
      token,
      salt,
      songId: targetSongId,
      albumId: targetAlbumId,
      artistId: targetArtistId,
    })
    return current.artist === starredBefore.artist ? current.artist : undefined
  }, 15000, 'artist favorite restore timeout')

  const songBefore = await getSongPayload(browsing, username, token, salt, targetSongId)
  const albumBefore = await getAlbumPayload(browsing, username, token, salt, targetAlbumId)
  const artistBefore = await getArtistPayload(browsing, username, token, salt, targetArtistId)

  const songRatingBefore = Number(songBefore.userRating ?? songBefore.rating ?? 0)
  const albumRatingBefore = Number(albumBefore.userRating ?? albumBefore.rating ?? 0)
  const artistRatingBefore = Number(artistBefore.userRating ?? artistBefore.rating ?? 0)

  const nextSongRating = songRatingBefore >= 5 ? 4 : songRatingBefore + 1 || 5
  const nextAlbumRating = albumRatingBefore >= 5 ? 4 : albumRatingBefore + 1 || 5
  const nextArtistRating = artistRatingBefore >= 5 ? 4 : artistRatingBefore + 1 || 5

  await store_server_data_set_mediaInfo.Set_MediaInfo_To_Rating_Server(targetSongId, nextSongRating)
  const songRatingChanged = await waitForValue(async () => {
    const song = await getSongPayload(browsing, username, token, salt, targetSongId)
    const rating = Number(song.userRating ?? song.rating ?? 0)
    return rating === nextSongRating ? rating : undefined
  }, 15000, 'song rating change timeout')
  await store_server_data_set_mediaInfo.Set_MediaInfo_To_Rating_Server(targetSongId, songRatingBefore)
  const songRatingRestored = await waitForValue(async () => {
    const song = await getSongPayload(browsing, username, token, salt, targetSongId)
    const rating = Number(song.userRating ?? song.rating ?? 0)
    return rating === songRatingBefore ? rating : undefined
  }, 15000, 'song rating restore timeout')

  await store_server_data_set_albumInfo.Set_AlbumInfo_To_Rating_Server(
    targetAlbumId,
    nextAlbumRating
  )
  const albumRatingChanged = await waitForValue(async () => {
    const album = await getAlbumPayload(browsing, username, token, salt, targetAlbumId)
    const rating = Number(album.userRating ?? album.rating ?? 0)
    return rating === nextAlbumRating ? rating : undefined
  }, 15000, 'album rating change timeout')
  await store_server_data_set_albumInfo.Set_AlbumInfo_To_Rating_Server(
    targetAlbumId,
    albumRatingBefore
  )
  const albumRatingRestored = await waitForValue(async () => {
    const album = await getAlbumPayload(browsing, username, token, salt, targetAlbumId)
    const rating = Number(album.userRating ?? album.rating ?? 0)
    return rating === albumRatingBefore ? rating : undefined
  }, 15000, 'album rating restore timeout')

  await store_server_data_set_artistInfo.Set_ArtistInfo_To_Rating_Server(
    targetArtistId,
    nextArtistRating
  )
  const artistRatingChanged = await waitForValue(async () => {
    const artist = await getArtistPayload(browsing, username, token, salt, targetArtistId)
    const rating = Number(artist.userRating ?? artist.rating ?? 0)
    return rating === nextArtistRating ? rating : undefined
  }, 15000, 'artist rating change timeout')
  await store_server_data_set_artistInfo.Set_ArtistInfo_To_Rating_Server(
    targetArtistId,
    artistRatingBefore
  )
  const artistRatingRestored = await waitForValue(async () => {
    const artist = await getArtistPayload(browsing, username, token, salt, targetArtistId)
    const rating = Number(artist.userRating ?? artist.rating ?? 0)
    return rating === artistRatingBefore ? rating : undefined
  }, 15000, 'artist rating restore timeout')

  const playlistName = `codex-store-api-${Date.now()}`
  const playlistId =
    (await store_server_data_set_playlistInfo.Set_PlaylistInfo_To_Update_CreatePlaylist_Server(
      playlistName,
      false
    )) || ''
  assertCondition(playlistId, 'store playlist 创建失败')

  let playlistEntryCountAfterAdd = 0
  let playlistEntryCountAfterRemove = 0

  try {
    await store_server_data_set_playlistInfo.Set_PlaylistInfo_To_Update_SetPlaylist(
      String(playlistId),
      `${playlistName}-updated`,
      'public-api-smoke',
      false
    )

    const playlistAfterUpdatePayload = parseSubsonicPayload(
      await playlists.getPlaylist_id(username, token, salt, String(playlistId))
    )
    const playlistAfterUpdate = playlistAfterUpdatePayload.playlist || {}
    assertCondition(
      String(playlistAfterUpdate.name || '') === `${playlistName}-updated`,
      'store playlist rename 失败'
    )

    await store_server_data_set_mediaInfo.Set_MediaInfo_Add_Selected_Playlist_Server(
      targetSongId,
      String(playlistId)
    )
    playlistEntryCountAfterAdd = await waitForValue(async () => {
      const playlistPayload = parseSubsonicPayload(
        await playlists.getPlaylist_id(username, token, salt, String(playlistId))
      )
      const entries = asArray(playlistPayload.playlist?.entry)
      return entries.some((item: any) => String(item?.id || '') === targetSongId)
        ? entries.length
        : undefined
    }, 15000, 'store playlist add timeout')

    const playlistIndexes =
      await store_server_data_set_playlistInfo.Set_PlaylistInfo_To_Update_GetPlaylist_MediaIndex(
        String(playlistId),
        [targetSongId]
      )
    assertCondition(playlistIndexes.length > 0, 'store playlist index 获取失败')

    await store_server_data_set_mediaInfo.Set_MediaInfo_Delete_Selected_Playlist_Server(
      targetSongId,
      String(playlistId)
    )
    playlistEntryCountAfterRemove = await waitForValue(async () => {
      const playlistPayload = parseSubsonicPayload(
        await playlists.getPlaylist_id(username, token, salt, String(playlistId))
      )
      const entries = asArray(playlistPayload.playlist?.entry)
      return entries.every((item: any) => String(item?.id || '') !== targetSongId)
        ? entries.length
        : undefined
    }, 15000, 'store playlist remove timeout')
  } finally {
    await store_server_data_set_playlistInfo.Set_PlaylistInfo_To_Update_DeletePlaylist(
      String(playlistId)
    )
    await waitForValue(async () => {
      const playlistsPayload = parseSubsonicPayload(
        await playlists.getPlaylists_all(username, token, salt)
      )
      const playlistList = asArray(playlistsPayload.playlists?.playlist)
      return playlistList.every((item: any) => String(item?.id || '') !== String(playlistId))
        ? true
        : undefined
    }, 15000, 'store playlist delete timeout')
  }

  return {
    targets: {
      songId: targetSongId,
      albumId: targetAlbumId,
      artistId: targetArtistId,
    },
    browsing: {
      musicFolderCount: musicFolders.length,
      indexCount: indexes.length,
      artistCount: artistsCount,
      genreCount: genres.length,
      musicDirectoryChildCount: musicDirectoryChildren.length,
      recentAlbumList2Count: asArray(recentAlbumList2Payload.albumList2?.album).length,
      newestAlbumList2Count: asArray(newestAlbumList2Payload.albumList2?.album).length,
      frequentAlbumList2Count: asArray(frequentAlbumList2Payload.albumList2?.album).length,
    },
    searching: {
      search2ArtistCount,
      search2AlbumCount,
      search2SongCount,
    },
    albumSongs: {
      nowPlayingCount: nowPlayingEntries.length,
    },
    scanning: {
      scanning: Boolean(scanStatus.scanning),
      mediaCount: Number(scanStatus.count || 0),
      folderCount: Number(scanStatus.folderCount || 0),
      lastScan: String(scanStatus.lastScan || ''),
    },
    retrieval: {
      lyricsBySongKeys: Object.keys(lyricsBySongPayload.lyricsList || {}),
      lyricsByFilterKeys: Object.keys(lyricsByFilterPayload.lyricsList || {}),
      stream: streamInfo,
      download: downloadInfo,
      coverArt: coverArtInfo,
    },
    favorite: {
      song: {
        before: starredBefore.song,
        changed: songFavoriteChanged,
        restored: songFavoriteRestored,
      },
      album: {
        before: starredBefore.album,
        changed: albumFavoriteChanged,
        restored: albumFavoriteRestored,
      },
      artist: {
        before: starredBefore.artist,
        changed: artistFavoriteChanged,
        restored: artistFavoriteRestored,
      },
    },
    rating: {
      song: {
        before: songRatingBefore,
        changed: songRatingChanged,
        restored: songRatingRestored,
      },
      album: {
        before: albumRatingBefore,
        changed: albumRatingChanged,
        restored: albumRatingRestored,
      },
      artist: {
        before: artistRatingBefore,
        changed: artistRatingChanged,
        restored: artistRatingRestored,
      },
    },
    playlistStore: {
      playlistId,
      entryCountAfterAdd: playlistEntryCountAfterAdd,
      entryCountAfterRemove: playlistEntryCountAfterRemove,
    },
  }
}

async function runStoreFlowSmoke() {
  const homeStore = usePageHomeStore()
  const albumStore = usePageAlbumStore()
  const artistStore = usePageArtistStore()
  const mediaStore = usePageMediaStore()

  homeStore.home_Files_temporary_recently_added_search = { start: '0', end: '5' }
  homeStore.home_Files_temporary_maximum_playback = []
  homeStore.home_Files_temporary_random_search = []
  homeStore.home_Files_temporary_recently_added = []
  homeStore.home_Files_temporary_recently_played = []
  albumStore.page_albumlists_selected = 'album_list_all'
  albumStore.page_albumlists_keyword = ''
  albumStore.page_albumlists_options_Sort_key = []
  albumStore.album_Files_temporary = []
  artistStore.page_artistlists_selected = 'artist_list_all'
  artistStore.page_artistlists_keyword = ''
  artistStore.page_artistlists_options_Sort_key = []
  artistStore.artist_Files_temporary = []
  mediaStore.page_songlists_selected = 'song_list_all'
  mediaStore.page_songlists_keywordFilter = ''
  mediaStore.page_songlists_options_Sort_key = []
  mediaStore.media_Files_temporary = []

  await store_general_fetch_home_list.fetchData_Home()
  await store_general_fetch_album_list.fetchData_Album_of_server_web_start()
  await store_general_fetch_artist_list.fetchData_Artist_of_server_web_start()
  await store_general_fetch_media_list.fetchData_Media_of_server_web_start()

  assertCondition(homeStore.home_Files_temporary_random_search.length > 0, 'store home 流程未返回数据')
  assertCondition(albumStore.album_Files_temporary.length > 0, 'store album 流程未返回数据')
  assertCondition(artistStore.artist_Files_temporary.length > 0, 'store artist 流程未返回数据')
  assertCondition(mediaStore.media_Files_temporary.length > 0, 'store media 流程未返回数据')

  return {
    homeRandom: homeStore.home_Files_temporary_random_search.length,
    albums: albumStore.album_Files_temporary.length,
    artists: artistStore.artist_Files_temporary.length,
    medias: mediaStore.media_Files_temporary.length,
  }
}

async function main() {
  const { baseUrl, restUrl, username, password, token, salt } = resolveCredentials()
  const summary: SmokeSummary = {
    authStatus: 'unknown',
    authRefresh: false,
    adapter: {},
    apiSurface: {},
    bridge: {},
    playlistCrud: {},
    annotation: {},
    storeFlow: {},
  }

  console.log(`[navidrome-smoke] baseUrl=${baseUrl}`)
  console.log(`[navidrome-smoke] user=${username}`)

  summary.authRefresh = await runAuthRefreshSmoke(baseUrl, username, password, token, salt)
  assertCondition(summary.authRefresh, 'store_server_user_model.refresh_model_server_type_of_web 失败')

  const adapterSummary = await runAdapterSmoke(restUrl, username, token, salt)
  summary.authStatus = adapterSummary.authStatus
  summary.adapter = adapterSummary

  summary.annotation = await runAnnotationSmoke(baseUrl, restUrl, username, password, token, salt)
  summary.apiSurface = await runApiSurfaceSmoke(baseUrl, restUrl, username, password, token, salt)
  const adapter = new Navidrome_Public_Api_Adapter()
  summary.playlistCrud = await runPlaylistCrudSmoke(restUrl, username, token, salt, adapter)
  const bridgeSummary = await runBridgeSmoke(baseUrl, restUrl, username, password, token, salt)
  summary.bridge = bridgeSummary
  summary.storeFlow = await runStoreFlowSmoke()

  console.log('[navidrome-smoke] success')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error('[navidrome-smoke] failed')
  console.error(error)
  process.exitCode = 1
})
