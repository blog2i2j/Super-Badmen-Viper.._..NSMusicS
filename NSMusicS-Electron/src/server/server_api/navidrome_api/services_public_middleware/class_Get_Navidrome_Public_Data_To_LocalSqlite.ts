// @ts-ignore - 忽略模块导入类型检查
import { store_server_users } from '@/server/server_management/store_server_users'
// @ts-ignore - 忽略模块导入类型检查
import { usePageHomeStore } from '@/data/data_status/page_status/home_store/usePageHomeStore'
// @ts-ignore - 忽略模块导入类型检查
import { usePageArtistStore } from '@/data/data_status/page_status/artist_store/usePageArtistStore'
// @ts-ignore - 忽略模块导入类型检查
import { usePageAlbumStore } from '@/data/data_status/page_status/album_store/usePageAlbumStore'
// @ts-ignore - 忽略模块导入类型检查
import { Media_library_scanning_ApiService_of_ND } from '../services_normal/media_library_scanning/index_service'
// @ts-ignore - 忽略模块导入类型检查
import { usePageMediaStore } from '@/data/data_status/page_status/media_store/usePageMediaStore'
// @ts-ignore - 忽略模块导入类型检查
import { Playlists_ApiService_of_ND } from '../services_normal/playlists/index_service'
// @ts-ignore - 忽略模块导入类型检查
import { Album$Medias_Lists_ApiService_of_ND } from '../services_normal/album$songs_lists/index_service'
// @ts-ignore - 忽略模块导入类型检查
import { Browsing_ApiService_of_ND } from '../services_normal/browsing/index_service'
// @ts-ignore - 忽略模块导入类型检查
import { store_system_configs_save } from '@/data/data_stores/local_system_stores/store_system_configs_save'
// @ts-ignore - 忽略模块导入类型检查
import { store_general_fetch_player_list } from '@/server/server_api_store/server_api_core/components/player_list/store_general_fetch_player_list'
// @ts-ignore - 忽略模块导入类型检查
import { usePlaylistStore } from '@/data/data_status/comment_status/playlist_store/usePlaylistStore'
// @ts-ignore - 忽略模块导入类型检查
import { Media_Retrieval_ApiService_of_ND } from '../services_normal/media_retrieval/index_service'
// @ts-ignore - 忽略模块导入类型检查
import { usePlayerSettingStore } from '@/data/data_status/comment_status/player_store/usePlayerSettingStore'
// @ts-ignore - 忽略模块导入类型检查
import { store_server_user_model } from '@/server/server_management/store_server_user_model'
// @ts-ignore - 忽略模块导入类型检查
import { Navidrome_Public_Api_Adapter } from './navidrome_public_api_adapter'

// @ts-ignore - 忽略模块导入类型检查
import { usePlayerAudioStore } from '@/data/data_status/comment_status/player_store/usePlayerAudioStore'
// @ts-ignore - 忽略模块导入类型检查
import { store_general_fetch_media_list } from '@/server/server_api_store/server_api_core/page/page_media_file/store_general_fetch_media_list'

export class Get_Navidrome_Public_Data_To_LocalSqlite {
  // @ts-ignore - 忽略属性类型检查
  private adapter = new Navidrome_Public_Api_Adapter()

  // @ts-ignore - 忽略属性类型检查
  private playlistStore = usePlaylistStore()
  // @ts-ignore - 忽略属性类型检查
  private playerSettingStore = usePlayerSettingStore()
  // @ts-ignore - 忽略属性类型检查
  private playerAudioStore = usePlayerAudioStore()
  // @ts-ignore - 忽略属性类型检查
  private pageAlbumStore = usePageAlbumStore()
  // @ts-ignore - 忽略属性类型检查
  private pageArtistStore = usePageArtistStore()
  // @ts-ignore - 忽略属性类型检查
  private pageMediaStore = usePageMediaStore()
  // @ts-ignore - 忽略属性类型检查
  private pageHomeStore = usePageHomeStore()

  public async get_home_list(url: string, username: string, token: string, salt: string) {
    // @ts-ignore - 忽略异步调用类型检查
    await this.get_home_list_of_maximum_playback(url, username, token, salt)
    // @ts-ignore - 忽略异步调用类型检查
    await this.get_home_list_of_random_search(url, username, token, salt)
    // @ts-ignore - 忽略异步调用类型检查
    await this.get_home_list_of_recently_added(url, username, token, salt)
    // @ts-ignore - 忽略异步调用类型检查
    await this.get_home_list_of_recently_played(url, username, token, salt)
  }
  public async get_home_list_of_maximum_playback(
    url: string,
    username: string,
    token: string,
    salt: string
  ) {
    const items = await this.adapter.getHomeSection({
      kind: 'play_count',
      url,
      username,
      token,
      salt,
      start: '0',
      end: '15',
    })
    this.pageHomeStore.home_Files_temporary_maximum_playback.push(...items)
  }
  public async get_home_list_of_random_search(
    url: string,
    username: string,
    token: string,
    salt: string
  ) {
    const items = await this.adapter.getHomeSection({
      kind: 'random',
      url,
      username,
      token,
      salt,
      start: '0',
      end: '18',
    })
    this.pageHomeStore.home_Files_temporary_random_search.push(...items)
  }
  public async get_home_list_of_recently_added(
    url: string,
    username: string,
    token: string,
    salt: string
  ) {
    const searchState = this.pageHomeStore.home_Files_temporary_recently_added_search
    const start = searchState?.start != undefined ? String(searchState.start) : '0'
    const end = searchState?.end != undefined ? String(searchState.end) : '15'
    const items = await this.adapter.getHomeSection({
      kind: 'recently_added',
      url,
      username,
      token,
      salt,
      start,
      end,
    })
    this.pageHomeStore.home_Files_temporary_recently_added.push(...items)
  }
  public async get_home_list_of_recently_played(
    url: string,
    username: string,
    token: string,
    salt: string
  ) {
    const items = await this.adapter.getHomeSection({
      kind: 'recently_played',
      url,
      username,
      token,
      salt,
      start: '0',
      end: '15',
    })
    this.pageHomeStore.home_Files_temporary_recently_played.push(...items)
  }
  public async get_media_list(
    url: string,
    username: string,
    token: string,
    salt: string,
    _end: string,
    _order: string,
    _sort: string,
    _start: string,
    _search: string,
    _starred: string,
    playlist_id: string,
    _album_id: string,
    _artist_id: string,
    year: string
  ) {
    const result = await this.adapter.getMediaList({
      url,
      username,
      token,
      salt,
      start: _start,
      end: _end,
      order: _order,
      sort: _sort,
      search: _search,
      starred: _starred,
      playlistId: playlist_id,
      albumId: _album_id,
      artistId: _artist_id,
      year,
      recentlyPlayed: _sort === 'playDate' || _sort === 'play_date',
    })

    const songlist = result.items
    if (!Array.isArray(songlist) || songlist.length === 0) {
      return
    }

    const existingSong =
      store_general_fetch_media_list._load_model === 'search'
        ? this.pageMediaStore.media_Files_temporary.find((item) => item.id === songlist[0].id)
        : this.playlistStore.playlist_MediaFiles_temporary.find((item) => item.id === songlist[0].id)
    if (existingSong) {
      console.error('警告，获取的Media项存在重复，服务端的查询业务存在问题')
    }

    store_general_fetch_player_list._totalCount = result.totalCount
    const last_index =
      store_general_fetch_media_list._load_model === 'search'
        ? this.pageMediaStore.media_Files_temporary.length
        : this.playlistStore.playlist_MediaFiles_temporary.length

    this.pageMediaStore.media_File_metadata = []

    result.metadata.forEach((song: any) => {
      this.pageMediaStore.media_File_metadata.push(song)
    })

    songlist.forEach((song: any, index: number) => {
      const newsong = {
        ...song,
        absoluteIndex: index + 1 + last_index,
      }

      if (store_general_fetch_media_list._load_model === 'search') {
        this.pageMediaStore.media_Files_temporary.push(newsong)
      } else {
        this.playlistStore.playlist_MediaFiles_temporary.push({
          ...newsong,
          play_id: newsong.id + 'copy&' + Math.floor(Math.random() * 90000) + 10000,
        })
      }
    })

    if (store_general_fetch_media_list._load_model === 'play') {
      this.playlistStore.playlist_datas_CurrentPlayList_ALLMediaIds =
        this.pageMediaStore.media_Files_temporary.map((item) => item.id)
      store_system_configs_save.save_system_playlist_item_id_config()
    }
  }
  public async get_album_list(
    url: string,
    username: string,
    token: string,
    salt: string,
    _end: string,
    _order: string,
    _sort: string,
    _start: string,
    _search: string,
    _starred: string,
    _artist_id: string
  ) {
    const result = await this.adapter.getAlbumList({
      url,
      username,
      token,
      salt,
      start: _start,
      end: _end,
      order: _order,
      sort: _sort,
      search: _search,
      starred: _starred,
      artistId: _artist_id,
      recentlyPlayed: _sort === 'playDate' || _sort === 'play_date',
    })

    if (result.items.length > 0) {
      const last_index = this.pageAlbumStore.album_Files_temporary.length
      this.pageAlbumStore.album_File_metadata = []
      result.metadata.forEach((album: any) => {
        this.pageAlbumStore.album_File_metadata.push(album)
      })
      result.items.forEach((album: any, index: number) => {
        this.pageAlbumStore.album_Files_temporary.push({
          ...album,
          absoluteIndex: index + 1 + last_index,
        })
      })
    }
  }
  public async get_artist_list(
    url: string,
    username: string,
    token: string,
    salt: string,
    _end: string,
    _order: string,
    _sort: string,
    _start: string,
    _search: string,
    _starred: string
  ) {
    const result = await this.adapter.getArtistList({
      url,
      username,
      token,
      salt,
      start: _start,
      end: _end,
      order: _order,
      sort: _sort,
      search: _search,
      starred: _starred,
      recentlyPlayed: _sort === 'playDate' || _sort === 'play_date',
    })

    if (result.items.length > 0) {
      const last_index = this.pageArtistStore.artist_Files_temporary.length
      this.pageArtistStore.artist_File_metadata = []
      result.metadata.forEach((artist: any) => {
        this.pageArtistStore.artist_File_metadata.push(artist)
      })
      result.items.forEach((artist: any, index: number) => {
        this.pageArtistStore.artist_Files_temporary.push({
          ...artist,
          absoluteIndex: index + 1 + last_index,
        })
      })
    }
  }
  public async get_random_song_list(
    url: string,
    username: string,
    token: string,
    salt: string,
    size: string,
    fromYear: string,
    toYear: string
  ) {
    const browsing_ApiService_of_ND = new Browsing_ApiService_of_ND(url)
    const getRandomSongs = await browsing_ApiService_of_ND.getRandomSongs(
      username,
      token,
      salt,
      size,
      fromYear,
      toYear
    )
    const media_Retrieval_ApiService_of_ND = new Media_Retrieval_ApiService_of_ND(url)
    const songlist = getRandomSongs['subsonic-response']['randomSongs']['song']
    if (Array.isArray(songlist) && songlist.length > 0) {
      const last_index = 0
      songlist.map(async (song: any, index: number) => {
        const getLyrics_id = await media_Retrieval_ApiService_of_ND.getLyrics_id(
          username,
          token,
          salt,
          song.id
        )
        let lyrics = undefined
        try {
          lyrics = this.convertToLRC_Array(
            getLyrics_id['subsonic-response']['lyricsList']['structuredLyrics'][0]['line']
          )
        } catch {}
        const new_song = {
          absoluteIndex: index + 1 + last_index,
          favorite: song.starred,
          rating: song.rating,
          duration_txt: this.formatTime(song.duration),
          id: song.id,
          title: song.title,
          path:
            url +
            '/stream?u=' +
            username +
            '&t=' +
            token +
            '&s=' +
            salt +
            '&v=1.12.0&c=nsmusics&f=json&id=' +
            song.id,
          artist: song.artist,
          album: song.album,
          artist_id: song.artistId,
          album_id: song.albumId,
          album_artist: '',
          has_cover_art: 0,
          track_number: song.track,
          disc_number: 0,
          year: song.year,
          size: song.size,
          suffix: song.suffix,
          duration: song.duration,
          bit_rate: song.bitRate,
          genre: '',
          compilation: 0,
          created_at: song.createdAt,
          updated_at: '',
          full_text: '',
          album_artist_id: '',
          order_album_name: '',
          order_album_artist_name: '',
          order_artist_name: '',
          sort_album_name: '',
          sort_artist_name: '',
          sort_album_artist_name: '',
          sort_title: '',
          disc_subtitle: '',
          mbz_track_id: '',
          mbz_album_id: '',
          mbz_artist_id: '',
          mbz_album_artist_id: '',
          mbz_album_type: '',
          mbz_album_comment: '',
          catalog_num: '',
          comment: '',
          lyrics: lyrics,
          bpm: 0,
          channels: 0,
          order_title: '',
          mbz_release_track_id: '',
          rg_album_gain: 0,
          rg_album_peak: 0,
          rg_track_gain: 0,
          rg_track_peak: 0,
          medium_image_url:
            url +
            '/getCoverArt?u=' +
            username +
            '&t=' +
            token +
            '&s=' +
            salt +
            '&v=1.12.0&c=nsmusics&f=json&id=' +
            song.id,
        }
        this.playlistStore.playlist_MediaFiles_temporary.push({
          ...new_song,
          play_id: new_song.id + 'copy&' + Math.floor(Math.random() * 90000) + 10000,
        })
        if (!store_server_user_model.random_play_model_search) {
          if (index === songlist.length - 1) {
            const index_num = store_server_user_model.random_play_model_add
              ? this.playlistStore.playlist_MediaFiles_temporary.length - size
              : 0
            const media_file = this.playlistStore.playlist_MediaFiles_temporary[index_num]
            await this.playerSettingStore.update_current_media_info(media_file, index_num)
            this.playlistStore.media_page_handleItemDbClick = false
            this.playerAudioStore.this_audio_restart_play = true
            //
            store_server_user_model.random_play_model_add = false
          }
        }
      })

      this.playlistStore.playlist_datas_CurrentPlayList_ALLMediaIds =
        this.playlistStore.playlist_MediaFiles_temporary.map((item) => item.id)
      store_system_configs_save.save_system_playlist_item_id_config()
    }
  }

  private formatTime(currentTime: number): string {
    const minutes = Math.floor(currentTime / 60)
    const seconds = Math.floor(currentTime % 60)

    let formattedMinutes = String(minutes)
    let formattedSeconds = String(seconds)

    if (formattedMinutes.length == 1) formattedMinutes = '0' + formattedMinutes

    if (formattedSeconds.length == 1) formattedSeconds = '0' + formattedSeconds

    return `${formattedMinutes}:${formattedSeconds}`
  }
  private convertToLRC(lyrics: string): string {
    const lrcLines: string[] = []

    let lyricsArray
    try {
      lyricsArray = JSON.parse(lyrics)
    } catch {
      try {
        return lyrics
      } catch (e) {
        console.error('Failed to parse lyrics JSON:', e)
      }
      return ''
    }

    if (!Array.isArray(lyricsArray)) {
      return ''
    }

    for (const langBlock of lyricsArray) {
      if (langBlock.synced && Array.isArray(langBlock.line)) {
        for (const line of langBlock.line) {
          const minutes = Math.floor(line.start / 60000)
          const seconds = Math.floor((line.start % 60000) / 1000)
          const milliseconds = (line.start % 1000).toString().padStart(3, '0').slice(0, 2)

          const timeTag = `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds}]`
          lrcLines.push(`${timeTag}${line.value}`)
        }
      }
    }

    return lrcLines.join('\n')
  }
  private convertToLRC_Array(
    lyrics: {
      start: number
      value: string
    }[]
  ): string {
    return lyrics
      .map((item) => {
        // 将毫秒转换为 [mm:ss.xx] 格式
        const minutes = Math.floor(item.start / 60000)
        const seconds = Math.floor((item.start % 60000) / 1000)
        const milliseconds = Math.floor((item.start % 1000) / 10)
        const time = `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}]`

        // 返回 LRC 格式的行
        return `${time}${item.value}`
      })
      .join('\n') // 每行用换行符分隔
  }

  /// file count
  public async get_count_of_media_file(url: string, username: string, token: string, salt: string) {
    try {
      const media_library_scanning_ApiService_of_ND = new Media_library_scanning_ApiService_of_ND(
        url
      )
      const getScanStatus = await media_library_scanning_ApiService_of_ND.getScanStatus(
        username,
        token,
        salt
      )
      this.pageMediaStore.media_item_count = Number(
        getScanStatus['subsonic-response']['scanStatus']['count']
      )
    } catch {}
  }
  public async get_count_of_artist_album(
    url: string,
    username: string,
    token: string,
    salt: string
  ) {
    try {
      const browsing_ApiService_of_ND = new Browsing_ApiService_of_ND(url)
      const getArtists_ALL = await browsing_ApiService_of_ND.getArtists_ALL(username, token, salt)
      const list = getArtists_ALL['subsonic-response']['artists']['index']
      if (list != undefined && Array.isArray(list)) {
        this.pageArtistStore.artist_item_count = list.reduce(
          (total, item) => total + item.artist.length,
          0
        )
        this.pageAlbumStore.album_item_count = list.reduce((sum, index) => {
          return (
            sum +
            index.artist.reduce((artistSum, artist) => {
              return artistSum + artist.albumCount
            }, 0)
          )
        }, 0)
      }
    } catch {}
  }
  /// starred count
  public async get_count_of_starred(url: string, username: string, token: string, salt: string) {
    try {
      const album$Medias_Lists_ApiService_of_ND = new Album$Medias_Lists_ApiService_of_ND(url)
      const getStarred2_all = await album$Medias_Lists_ApiService_of_ND.getStarred2_all(
        username,
        token,
        salt
      )
      const starred2_artist = getStarred2_all['subsonic-response']['starred2']['artist']
      const starred2_album = getStarred2_all['subsonic-response']['starred2']['album']
      const starred2_song = getStarred2_all['subsonic-response']['starred2']['song']
      const getCount = (items: any) => (Array.isArray(items) ? items.length : items ? 1 : 0)
      this.pageMediaStore.media_starred_count = getCount(starred2_song)
      this.pageAlbumStore.album_starred_count = getCount(starred2_album)
      this.pageArtistStore.artist_starred_count = getCount(starred2_artist)
    } catch {}
  }
  /// playlist count
  public async get_count_of_playlist(url: string, username: string, token: string, salt: string) {
    try {
      const playlists_ApiService_of_ND = new Playlists_ApiService_of_ND(url)
      const getPlaylists_all = await playlists_ApiService_of_ND.getPlaylists_all(
        username,
        token,
        salt
      )
      const playlists = getPlaylists_all['subsonic-response']['playlists']['playlist']
      if (playlists != undefined) this.pageMediaStore.media_playlist_count = playlists.length || 0
    } catch {}
  }
}
