import { Browsing_ApiService_of_ND } from '../services_normal/browsing/index_service'
import { Searching_ApiService_of_ND } from '../services_normal/searching/index_service'
import { Playlists_ApiService_of_ND } from '../services_normal/playlists/index_service'

type Paging = {
  offset: number
  size: number
}

type ListResult = {
  items: any[]
  metadata: any[]
  totalCount: number
}

type ArtistPlaybackAggregate = {
  playCount: number
  playDate: string
}

export class Navidrome_Public_Api_Adapter {
  private parseSubsonicPayload(response: any): Record<string, any> {
    if (!response || typeof response !== 'object') {
      return {}
    }
    return (
      response['subsonic-response'] ||
      response.subsonic_response ||
      response.subsonicResponse ||
      {}
    )
  }

  private asObject(value: any): Record<string, any> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined
    }
    return value as Record<string, any>
  }

  private asArray(value: any): Record<string, any>[] {
    if (Array.isArray(value)) {
      return value
        .filter((item) => item && typeof item === 'object')
        .map((item) => item as Record<string, any>)
    }
    const single = this.asObject(value)
    return single ? [single] : []
  }

  private toInt(value: any, fallback = 0): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.trunc(value)
    }
    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10)
      return Number.isFinite(parsed) ? parsed : fallback
    }
    if (typeof value === 'boolean') {
      return value ? 1 : 0
    }
    return fallback
  }

  private toBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value !== 0
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      if (!normalized || normalized === 'false' || normalized === '0' || normalized === 'no') {
        return false
      }
      return true
    }
    return false
  }

  private toStringValue(value: any): string {
    if (value == null) return ''
    return String(value)
  }

  private toIsoLike(value: any): string {
    return this.toStringValue(value).trim()
  }

  private toTimestamp(value: any): number {
    const parsed = Date.parse(this.toStringValue(value))
    return Number.isFinite(parsed) ? parsed : 0
  }

  private resolvePaging(start: string, end: string, defaultSize = 30): Paging {
    const offset = Math.max(0, this.toInt(start, 0))
    const parsedEnd = this.toInt(end, 0)

    let size = defaultSize
    if (parsedEnd > offset) {
      size = parsedEnd - offset
    } else if (parsedEnd > 0 && offset === 0) {
      size = parsedEnd
    }

    size = Math.max(1, Math.min(size, 500))
    return { offset, size }
  }

  private buildCommonParams(username: string, token: string, salt: string): Record<string, string> {
    return {
      u: username,
      t: token,
      s: salt,
      v: '1.12.0',
      c: 'nsmusics',
      f: 'json',
    }
  }

  private buildCoverArtUrl(
    url: string,
    username: string,
    token: string,
    salt: string,
    id: string
  ): string {
    if (!id || !username || !token || !salt) {
      return ''
    }
    const query = new URLSearchParams({
      ...this.buildCommonParams(username, token, salt),
      id,
    }).toString()
    return `${url}/getCoverArt?${query}`
  }

  private buildStreamUrl(
    url: string,
    username: string,
    token: string,
    salt: string,
    id: string
  ): string {
    if (!id || !username || !token || !salt) {
      return ''
    }
    const query = new URLSearchParams({
      ...this.buildCommonParams(username, token, salt),
      id,
    }).toString()
    return `${url}/stream?${query}`
  }

  private formatTime(duration: number): string {
    const totalSeconds = Math.max(0, duration)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  private compareString(a: any, b: any, descending: boolean): number {
    const left = this.toStringValue(a).toLowerCase()
    const right = this.toStringValue(b).toLowerCase()
    return descending ? right.localeCompare(left) : left.localeCompare(right)
  }

  private compareInt(a: any, b: any, descending: boolean): number {
    const left = this.toInt(a, 0)
    const right = this.toInt(b, 0)
    return descending ? right - left : left - right
  }

  private compareDate(a: any, b: any, descending: boolean): number {
    const leftRaw = this.toStringValue(a)
    const rightRaw = this.toStringValue(b)
    const left = Date.parse(leftRaw)
    const right = Date.parse(rightRaw)

    const leftValid = Number.isFinite(left)
    const rightValid = Number.isFinite(right)
    if (!leftValid && !rightValid) return 0
    if (!leftValid) return descending ? 1 : -1
    if (!rightValid) return descending ? -1 : 1
    return descending ? right - left : left - right
  }

  private sliceItems<T>(items: T[], offset: number, size: number): T[] {
    if (!Array.isArray(items) || items.length === 0 || size <= 0 || offset >= items.length) {
      return []
    }
    return items.slice(offset, Math.min(items.length, offset + size))
  }

  private isPlaybackSort(sort: string, recentlyPlayed: boolean): boolean {
    const normalizedSort = sort.trim()
    return (
      recentlyPlayed ||
      normalizedSort === 'play_count' ||
      normalizedSort === 'playDate' ||
      normalizedSort === 'play_date'
    )
  }

  private async loadAllSearchSongs(
    url: string,
    username: string,
    token: string,
    salt: string,
    search: string
  ): Promise<Record<string, any>[]> {
    const searching = new Searching_ApiService_of_ND(url)
    const songs: Record<string, any>[] = []
    const pageSize = 500

    for (let offset = 0; offset < 50000; offset += pageSize) {
      const response = await searching.getSearch3(username, token, salt, search.trim(), {
        artistCount: '0',
        artistOffset: '0',
        albumCount: '0',
        albumOffset: '0',
        songCount: String(pageSize),
        songOffset: String(offset),
      })
      const payload = this.parseSubsonicPayload(response)
      const searchResult = this.asObject(payload.searchResult3)
      const chunk = this.asArray(searchResult?.song)

      if (!chunk.length) {
        break
      }

      songs.push(...chunk)
      if (chunk.length < pageSize) {
        break
      }
    }

    return songs
  }

  private async loadArtistPlaybackMap(
    url: string,
    username: string,
    token: string,
    salt: string
  ): Promise<Map<string, ArtistPlaybackAggregate>> {
    const browsing = new Browsing_ApiService_of_ND(url)
    const playbackMap = new Map<string, ArtistPlaybackAggregate>()
    const pageSize = 500

    for (let offset = 0; offset < 50000; offset += pageSize) {
      const response = await browsing.getAlbumList2(username, token, salt, {
        type: 'alphabeticalByName',
        size: String(pageSize),
        offset: String(offset),
      })
      const payload = this.parseSubsonicPayload(response)
      const albumList = this.asObject(payload.albumList2)
      const albums = this.asArray(albumList?.album)

      if (!albums.length) {
        break
      }

      albums.forEach((album) => {
        const artistId = this.toStringValue(album.artistId ?? album.artist_id).trim()
        if (!artistId) {
          return
        }

        const playCount = this.toInt(album.playCount ?? album.play_count, 0)
        const playDate = this.toIsoLike(album.playDate ?? album.played)
        if (playCount <= 0 && !playDate) {
          return
        }

        const current = playbackMap.get(artistId) || { playCount: 0, playDate: '' }
        const currentTs = this.toTimestamp(current.playDate)
        const nextTs = this.toTimestamp(playDate)

        playbackMap.set(artistId, {
          playCount: current.playCount + playCount,
          playDate: nextTs > currentTs ? playDate : current.playDate,
        })
      })

      if (albums.length < pageSize) {
        break
      }
    }

    return playbackMap
  }

  private applyArtistPlaybackMap(
    artists: Record<string, any>[],
    playbackMap: Map<string, ArtistPlaybackAggregate>
  ): Record<string, any>[] {
    return artists.map((artist) => {
      const artistId = this.toStringValue(artist.id).trim()
      const aggregate = artistId ? playbackMap.get(artistId) : undefined
      if (!aggregate) {
        return artist
      }

      return {
        ...artist,
        playCount: aggregate.playCount,
        playDate: aggregate.playDate,
        played: aggregate.playDate,
      }
    })
  }

  private sortAlbums(items: Record<string, any>[], sort: string, order: string): Record<string, any>[] {
    const descending = order.toLowerCase() === 'desc'
    const normalizedSort = sort.trim()
    return [...items].sort((a, b) => {
      switch (normalizedSort) {
        case 'name':
          return this.compareString(a.name ?? a.album, b.name ?? b.album, descending)
        case 'artist':
        case 'album_artist':
          return this.compareString(
            a.artist ?? a.albumArtist,
            b.artist ?? b.albumArtist,
            descending
          )
        case 'min_year':
        case 'year':
          return this.compareInt(a.minYear ?? a.year, b.minYear ?? b.year, descending)
        case 'duration':
          return this.compareInt(a.duration, b.duration, descending)
        case 'song_count':
          return this.compareInt(a.songCount ?? a.song_count, b.songCount ?? b.song_count, descending)
        case 'play_count':
          return this.compareInt(a.playCount ?? a.play_count, b.playCount ?? b.play_count, descending)
        case 'rating':
          return this.compareInt(a.userRating ?? a.rating, b.userRating ?? b.rating, descending)
        case 'size':
          return this.compareInt(a.size, b.size, descending)
        case 'starred_at':
          return this.compareDate(a.starred ?? a.starredAt, b.starred ?? b.starredAt, descending)
        case 'created_at':
          return this.compareDate(a.created ?? a.createdAt, b.created ?? b.createdAt, descending)
        case 'updated_at':
        case 'playDate':
        case 'play_date':
          return this.compareDate(
            a.changed ?? a.updatedAt ?? a.playDate ?? a.played,
            b.changed ?? b.updatedAt ?? b.playDate ?? b.played,
            descending
          )
        default:
          return this.compareString(a.id, b.id, descending)
      }
    })
  }

  private sortArtists(items: Record<string, any>[], sort: string, order: string): Record<string, any>[] {
    const descending = order.toLowerCase() === 'desc'
    const normalizedSort = sort.trim()
    return [...items].sort((a, b) => {
      switch (normalizedSort) {
        case 'name':
          return this.compareString(a.name, b.name, descending)
        case 'album_count':
          return this.compareInt(a.albumCount ?? a.album_count, b.albumCount ?? b.album_count, descending)
        case 'song_count':
          return this.compareInt(a.songCount ?? a.song_count, b.songCount ?? b.song_count, descending)
        case 'play_count':
          return this.compareInt(a.playCount ?? a.play_count, b.playCount ?? b.play_count, descending)
        case 'rating':
          return this.compareInt(a.userRating ?? a.rating, b.userRating ?? b.rating, descending)
        case 'size':
          return this.compareInt(a.size, b.size, descending)
        case 'starred_at':
          return this.compareDate(a.starred ?? a.starredAt, b.starred ?? b.starredAt, descending)
        case 'created_at':
          return this.compareDate(a.created ?? a.createdAt, b.created ?? b.createdAt, descending)
        case 'updated_at':
        case 'playDate':
        case 'play_date':
          return this.compareDate(
            a.changed ?? a.updatedAt ?? a.playDate ?? a.played,
            b.changed ?? b.updatedAt ?? b.playDate ?? b.played,
            descending
          )
        default:
          return this.compareString(a.id, b.id, descending)
      }
    })
  }

  private sortSongs(items: Record<string, any>[], sort: string, order: string): Record<string, any>[] {
    const descending = order.toLowerCase() === 'desc'
    const normalizedSort = sort.trim()
    if (normalizedSort.toLowerCase().includes('random')) {
      return [...items]
    }

    return [...items].sort((a, b) => {
      switch (normalizedSort) {
        case 'title':
        case 'name':
          return this.compareString(a.title ?? a.name, b.title ?? b.name, descending)
        case 'artist':
          return this.compareString(a.artist, b.artist, descending)
        case 'album':
          return this.compareString(a.album, b.album, descending)
        case 'year':
          return this.compareInt(a.year, b.year, descending)
        case 'duration':
          return this.compareInt(a.duration, b.duration, descending)
        case 'track_number':
        case 'track':
          return this.compareInt(a.track ?? a.track_number, b.track ?? b.track_number, descending)
        case 'play_count':
          return this.compareInt(a.playCount ?? a.play_count, b.playCount ?? b.play_count, descending)
        case 'rating':
          return this.compareInt(a.userRating ?? a.rating, b.userRating ?? b.rating, descending)
        case 'size':
          return this.compareInt(a.size, b.size, descending)
        case 'bit_rate':
          return this.compareInt(a.bitRate ?? a.bit_rate, b.bitRate ?? b.bit_rate, descending)
        case 'starred_at':
          return this.compareDate(a.starred ?? a.starredAt, b.starred ?? b.starredAt, descending)
        case 'created_at':
          return this.compareDate(a.created ?? a.createdAt, b.created ?? b.createdAt, descending)
        case 'updated_at':
          return this.compareDate(a.changed ?? a.updatedAt, b.changed ?? b.updatedAt, descending)
        case 'playDate':
        case 'play_date':
          return this.compareDate(a.playDate ?? a.played, b.playDate ?? b.played, descending)
        default:
          return this.compareString(a.id, b.id, descending)
      }
    })
  }

  private resolveAlbumListType(sort: string, order: string, starred: string, recentlyPlayed: boolean): string {
    if (starred === 'true') return 'starred'

    switch (sort.trim()) {
      case 'random':
        return 'random'
      case 'play_count':
        return 'frequent'
      case 'playDate':
      case 'play_date':
      case 'updated_at':
        return 'recent'
      case 'created_at':
        return order.toLowerCase() === 'desc' ? 'newest' : 'alphabeticalByName'
      case 'artist':
      case 'album_artist':
        return 'alphabeticalByArtist'
      case 'name':
        return 'alphabeticalByName'
      default:
        return recentlyPlayed
          ? 'recent'
          : order.toLowerCase() === 'desc'
            ? 'newest'
            : 'alphabeticalByName'
    }
  }

  private buildAlbumMetadata(
    album: Record<string, any>,
    url: string,
    username: string,
    token: string,
    salt: string
  ): Record<string, any> {
    const id = this.toStringValue(album.id)
    const coverArtId = this.toStringValue(album.coverArt || id)
    const mediumImageUrl = this.buildCoverArtUrl(url, username, token, salt, coverArtId)
    const favorite = this.toBoolean(album.starred ?? album.favorite)

    return {
      ...album,
      id,
      name: this.toStringValue(album.name ?? album.album ?? album.title),
      artistId: this.toStringValue(album.artistId ?? album.artist_id),
      artist: this.toStringValue(album.artist ?? album.albumArtist),
      albumArtist: this.toStringValue(album.albumArtist ?? album.artist),
      year: this.toInt(album.year ?? album.minYear),
      songCount: this.toInt(album.songCount ?? album.song_count),
      duration: this.toInt(album.duration),
      createdAt: this.toIsoLike(album.createdAt ?? album.created),
      updatedAt: this.toIsoLike(album.updatedAt ?? album.changed),
      playCount: this.toInt(album.playCount ?? album.play_count),
      playDate: this.toIsoLike(album.playDate ?? album.played),
      starred: favorite,
      starredAt: this.toIsoLike(album.starredAt ?? album.starred),
      rating: this.toInt(album.rating ?? album.userRating),
      coverArtUrl: mediumImageUrl,
      mediumImageUrl,
    }
  }

  private buildAlbumItem(
    album: Record<string, any>,
    url: string,
    username: string,
    token: string,
    salt: string,
    absoluteIndex: number
  ): Record<string, any> {
    const metadata = this.buildAlbumMetadata(album, url, username, token, salt)
    return {
      absoluteIndex,
      favorite: metadata.starred,
      rating: metadata.rating,
      id: metadata.id,
      name: metadata.name,
      artist_id: metadata.artistId,
      embed_art_path: this.toStringValue(album.coverArt ?? metadata.id),
      artist: metadata.artist,
      album_artist: metadata.albumArtist,
      min_year: metadata.year,
      max_year: metadata.year,
      compilation: this.toInt(album.compilation),
      song_count: metadata.songCount,
      duration: metadata.duration,
      genre: this.toStringValue(album.genre),
      created_at: metadata.createdAt,
      updated_at: metadata.updatedAt,
      full_text: this.toStringValue(album.fullText ?? album.full_text),
      album_artist_id: this.toStringValue(album.albumArtistId ?? album.album_artist_id),
      order_album_name: this.toStringValue(album.orderAlbumName ?? album.order_album_name),
      order_album_artist_name: this.toStringValue(
        album.orderAlbumArtistName ?? album.order_album_artist_name
      ),
      sort_album_name: this.toStringValue(album.sortAlbumName ?? album.sort_album_name),
      sort_artist_name: this.toStringValue(album.sortArtistName ?? album.sort_artist_name),
      sort_album_artist_name: this.toStringValue(
        album.sortAlbumArtistName ?? album.sort_album_artist_name
      ),
      size: this.toInt(album.size),
      mbz_album_id: this.toStringValue(album.mbzAlbumId ?? album.mbz_album_id),
      mbz_album_artist_id: this.toStringValue(album.mbzAlbumArtistId ?? album.mbz_album_artist_id),
      mbz_album_type: this.toStringValue(album.mbzAlbumType ?? album.mbz_album_type),
      mbz_album_comment: this.toStringValue(album.mbzAlbumComment ?? album.mbz_album_comment),
      catalog_num: this.toStringValue(album.catalogNum ?? album.catalog_num),
      comment: this.toStringValue(album.comment),
      all_artist_ids: this.toStringValue(album.allArtistIds ?? album.all_artist_ids),
      image_files: this.toStringValue(album.imageFiles ?? album.image_files),
      paths: this.toStringValue(album.paths),
      description: this.toStringValue(album.description),
      small_image_url: metadata.mediumImageUrl,
      medium_image_url: metadata.mediumImageUrl,
      large_image_url: metadata.mediumImageUrl,
      external_url: this.toStringValue(album.externalUrl ?? album.external_url),
      external_info_updated_at: this.toStringValue(
        album.externalInfoUpdatedAt ?? album.external_info_updated_at
      ),
      play_count: metadata.playCount,
      play_date: metadata.playDate,
      starred_at: metadata.starredAt,
    }
  }

  private buildArtistMetadata(
    artist: Record<string, any>,
    url: string,
    username: string,
    token: string,
    salt: string
  ): Record<string, any> {
    const id = this.toStringValue(artist.id)
    const coverArtId = this.toStringValue(artist.coverArt || id)
    const mediumImageUrl = this.buildCoverArtUrl(url, username, token, salt, coverArtId)
    const favorite = this.toBoolean(artist.starred ?? artist.favorite)

    return {
      ...artist,
      id,
      name: this.toStringValue(artist.name),
      albumCount: this.toInt(artist.albumCount ?? artist.album_count),
      songCount: this.toInt(artist.songCount ?? artist.song_count),
      playCount: this.toInt(artist.playCount ?? artist.play_count),
      playDate: this.toIsoLike(artist.playDate ?? artist.played),
      createdAt: this.toIsoLike(artist.createdAt ?? artist.created),
      updatedAt: this.toIsoLike(artist.updatedAt ?? artist.changed),
      starred: favorite,
      starredAt: this.toIsoLike(artist.starredAt ?? artist.starred),
      rating: this.toInt(artist.rating ?? artist.userRating),
      mediumImageUrl,
    }
  }

  private buildArtistItem(
    artist: Record<string, any>,
    url: string,
    username: string,
    token: string,
    salt: string,
    absoluteIndex: number
  ): Record<string, any> {
    const metadata = this.buildArtistMetadata(artist, url, username, token, salt)
    return {
      absoluteIndex,
      favorite: metadata.starred,
      rating: metadata.rating,
      id: metadata.id,
      name: metadata.name,
      album_count: metadata.albumCount,
      full_text: this.toStringValue(artist.fullText ?? artist.full_text),
      order_artist_name: this.toStringValue(artist.orderArtistName ?? artist.order_artist_name),
      sort_artist_name: this.toStringValue(artist.sortArtistName ?? artist.sort_artist_name),
      song_count: metadata.songCount,
      size: this.toInt(artist.size),
      mbz_artist_id: this.toStringValue(artist.mbzArtistId ?? artist.mbz_artist_id),
      biography: this.toStringValue(artist.biography),
      small_image_url: metadata.mediumImageUrl,
      medium_image_url: metadata.mediumImageUrl,
      large_image_url: metadata.mediumImageUrl,
      similar_artists: this.toStringValue(artist.similarArtists ?? artist.similar_artists),
      external_url: this.toStringValue(artist.externalUrl ?? artist.external_url),
      external_info_updated_at: this.toStringValue(
        artist.externalInfoUpdatedAt ?? artist.external_info_updated_at
      ),
      play_count: metadata.playCount,
      play_date: metadata.playDate,
      starred_at: metadata.starredAt,
      created_at: metadata.createdAt,
      updated_at: metadata.updatedAt,
    }
  }

  private buildSongMetadata(
    song: Record<string, any>,
    url: string,
    username: string,
    token: string,
    salt: string
  ): Record<string, any> {
    const id = this.toStringValue(song.id)
    const coverArtId = this.toStringValue(song.coverArt || id)
    const mediumImageUrl = this.buildCoverArtUrl(url, username, token, salt, coverArtId)
    const rawPath = this.toStringValue(song.path)
    const path = rawPath.startsWith('http://') || rawPath.startsWith('https://')
      ? rawPath
      : this.buildStreamUrl(url, username, token, salt, id)
    const favorite = this.toBoolean(song.starred ?? song.favorite)
    const duration = this.toInt(song.duration)

    return {
      ...song,
      id,
      title: this.toStringValue(song.title ?? song.name),
      name: this.toStringValue(song.title ?? song.name),
      artist: this.toStringValue(song.artist),
      album: this.toStringValue(song.album),
      artistId: this.toStringValue(song.artistId ?? song.artist_id),
      artist_id: this.toStringValue(song.artist_id ?? song.artistId),
      albumId: this.toStringValue(song.albumId ?? song.album_id ?? song.parent),
      album_id: this.toStringValue(song.album_id ?? song.albumId ?? song.parent),
      albumArtist: this.toStringValue(song.albumArtist ?? song.album_artist ?? song.artist),
      album_artist: this.toStringValue(song.album_artist ?? song.albumArtist ?? song.artist),
      track: this.toInt(song.track ?? song.track_number),
      track_number: this.toInt(song.track_number ?? song.track),
      discNumber: this.toInt(song.discNumber ?? song.disc_number),
      disc_number: this.toInt(song.disc_number ?? song.discNumber),
      year: this.toInt(song.year),
      size: this.toInt(song.size),
      suffix: this.toStringValue(song.suffix),
      duration,
      duration_txt: this.formatTime(duration),
      bitRate: this.toInt(song.bitRate ?? song.bit_rate),
      bit_rate: this.toInt(song.bit_rate ?? song.bitRate),
      createdAt: this.toIsoLike(song.createdAt ?? song.created),
      created_at: this.toIsoLike(song.created_at ?? song.createdAt ?? song.created),
      updatedAt: this.toIsoLike(song.updatedAt ?? song.changed),
      updated_at: this.toIsoLike(song.updated_at ?? song.updatedAt ?? song.changed),
      playCount: this.toInt(song.playCount ?? song.play_count),
      play_count: this.toInt(song.play_count ?? song.playCount),
      playDate: this.toIsoLike(song.playDate ?? song.played),
      play_date: this.toIsoLike(song.play_date ?? song.playDate ?? song.played),
      rating: this.toInt(song.rating ?? song.userRating),
      favorite,
      starred: favorite,
      starredAt: this.toIsoLike(song.starredAt ?? song.starred),
      starred_at: this.toIsoLike(song.starred_at ?? song.starredAt ?? song.starred),
      contentType: this.toStringValue(song.contentType ?? song.transcodedContentType),
      encoding_format: this.toStringValue(
        song.encoding_format ?? song.encodingFormat ?? song.contentType ?? song.transcodedContentType
      ),
      medium_image_url: mediumImageUrl,
      coverArtUrl: mediumImageUrl,
      path,
      lyrics: this.toStringValue(song.lyrics),
    }
  }

  private buildSongItem(song: Record<string, any>, absoluteIndex: number): Record<string, any> {
    return {
      absoluteIndex,
      favorite: this.toBoolean(song.starred ?? song.favorite),
      rating: this.toInt(song.rating),
      duration_txt: this.toStringValue(song.duration_txt || this.formatTime(this.toInt(song.duration))),
      id: this.toStringValue(song.id),
      title: this.toStringValue(song.title ?? song.name),
      path: this.toStringValue(song.path),
      artist: this.toStringValue(song.artist),
      album: this.toStringValue(song.album),
      artist_id: this.toStringValue(song.artist_id ?? song.artistId),
      album_id: this.toStringValue(song.album_id ?? song.albumId),
      album_artist: this.toStringValue(song.album_artist ?? song.albumArtist ?? song.artist),
      has_cover_art: 0,
      track_number: this.toInt(song.track_number ?? song.track),
      disc_number: this.toInt(song.disc_number ?? song.discNumber),
      year: this.toInt(song.year),
      size: this.toInt(song.size),
      suffix: this.toStringValue(song.suffix),
      duration: this.toInt(song.duration),
      bit_rate: this.toInt(song.bit_rate ?? song.bitRate),
      genre: this.toStringValue(song.genre),
      compilation: this.toInt(song.compilation),
      created_at: this.toStringValue(song.created_at ?? song.createdAt),
      updated_at: this.toStringValue(song.updated_at ?? song.updatedAt),
      full_text: this.toStringValue(song.full_text ?? song.fullText),
      album_artist_id: this.toStringValue(song.album_artist_id ?? song.albumArtistId),
      order_album_name: this.toStringValue(song.order_album_name ?? song.orderAlbumName),
      order_album_artist_name: this.toStringValue(
        song.order_album_artist_name ?? song.orderAlbumArtistName
      ),
      order_artist_name: this.toStringValue(song.order_artist_name ?? song.orderArtistName),
      sort_album_name: this.toStringValue(song.sort_album_name ?? song.sortAlbumName),
      sort_artist_name: this.toStringValue(song.sort_artist_name ?? song.sortArtistName),
      sort_album_artist_name: this.toStringValue(
        song.sort_album_artist_name ?? song.sortAlbumArtistName
      ),
      sort_title: this.toStringValue(song.sort_title ?? song.sortTitle),
      disc_subtitle: this.toStringValue(song.disc_subtitle ?? song.discSubtitle),
      mbz_track_id: this.toStringValue(song.mbz_track_id ?? song.mbzTrackId),
      mbz_album_id: this.toStringValue(song.mbz_album_id ?? song.mbzAlbumId),
      mbz_artist_id: this.toStringValue(song.mbz_artist_id ?? song.mbzArtistId),
      mbz_album_artist_id: this.toStringValue(song.mbz_album_artist_id ?? song.mbzAlbumArtistId),
      mbz_album_type: this.toStringValue(song.mbz_album_type ?? song.mbzAlbumType),
      mbz_album_comment: this.toStringValue(song.mbz_album_comment ?? song.mbzAlbumComment),
      catalog_num: this.toStringValue(song.catalog_num ?? song.catalogNum),
      comment: this.toStringValue(song.comment),
      lyrics: this.toStringValue(song.lyrics),
      bpm: this.toInt(song.bpm),
      channels: this.toInt(song.channels),
      order_title: this.toStringValue(song.order_title ?? song.orderTitle),
      mbz_release_track_id: this.toStringValue(song.mbz_release_track_id ?? song.mbzReleaseTrackId),
      rg_album_gain: this.toInt(song.rg_album_gain ?? song.rgAlbumGain),
      rg_album_peak: this.toInt(song.rg_album_peak ?? song.rgAlbumPeak),
      rg_track_gain: this.toInt(song.rg_track_gain ?? song.rgTrackGain),
      rg_track_peak: this.toInt(song.rg_track_peak ?? song.rgTrackPeak),
      medium_image_url: this.toStringValue(song.medium_image_url ?? song.coverArtUrl),
      play_count: this.toInt(song.play_count ?? song.playCount),
      play_date: this.toStringValue(song.play_date ?? song.playDate),
      starred_at: this.toStringValue(song.starred_at ?? song.starredAt),
      encoding_format: this.toStringValue(song.encoding_format ?? song.contentType),
    }
  }

  private applySongFilters(
    songs: Record<string, any>[],
    search: string,
    year: string,
    albumId: string,
    artistId: string,
    starredOnly: boolean
  ): Record<string, any>[] {
    const keyword = search.trim().toLowerCase()
    const normalizedAlbumId = albumId.trim()
    const normalizedArtistId = artistId.trim()
    const yearValue = this.toInt(year, 0)

    return songs.filter((song) => {
      if (keyword) {
        const title = this.toStringValue(song.title ?? song.name).toLowerCase()
        const artist = this.toStringValue(song.artist).toLowerCase()
        const album = this.toStringValue(song.album).toLowerCase()
        if (!title.includes(keyword) && !artist.includes(keyword) && !album.includes(keyword)) {
          return false
        }
      }

      if (yearValue > 0 && this.toInt(song.year, 0) !== yearValue) {
        return false
      }

      if (normalizedAlbumId) {
        const itemAlbumId = this.toStringValue(song.albumId ?? song.album_id ?? song.parent).trim()
        if (itemAlbumId !== normalizedAlbumId) {
          return false
        }
      }

      if (normalizedArtistId) {
        const itemArtistId = this.toStringValue(song.artistId ?? song.artist_id).trim()
        if (itemArtistId !== normalizedArtistId) {
          return false
        }
      }

      if (starredOnly) {
        return this.toBoolean(song.starred ?? song.favorite)
      }

      return true
    })
  }

  private async loadSongsFromAlbum(
    url: string,
    username: string,
    token: string,
    salt: string,
    albumId: string
  ): Promise<Record<string, any>[]> {
    const browsing = new Browsing_ApiService_of_ND(url)
    const response = await browsing.getAlbum(username, token, salt, albumId)
    const payload = this.parseSubsonicPayload(response)
    return this.asArray(this.asObject(payload.album)?.song)
  }

  private async loadSongsFromArtist(
    url: string,
    username: string,
    token: string,
    salt: string,
    artistId: string
  ): Promise<Record<string, any>[]> {
    const browsing = new Browsing_ApiService_of_ND(url)
    const response = await browsing.getArtist(username, token, salt, artistId)
    const payload = this.parseSubsonicPayload(response)
    const artist = this.asObject(payload.artist)
    const albums = this.asArray(artist?.album)
    if (!albums.length) {
      return []
    }

    const songLists = await Promise.all(
      albums
        .map((album) => this.toStringValue(album.id).trim())
        .filter(Boolean)
        .map((albumId) => this.loadSongsFromAlbum(url, username, token, salt, albumId))
    )
    return songLists.flat()
  }

  private async loadStarredSongs(
    url: string,
    username: string,
    token: string,
    salt: string
  ): Promise<Record<string, any>[]> {
    const browsing = new Browsing_ApiService_of_ND(url)
    const response = await browsing.getStarred2(username, token, salt)
    const payload = this.parseSubsonicPayload(response)
    return this.asArray(this.asObject(payload.starred2)?.song)
  }

  private async loadSongsFromPlaylist(
    url: string,
    username: string,
    token: string,
    salt: string,
    playlistId: string
  ): Promise<Record<string, any>[]> {
    const playlists = new Playlists_ApiService_of_ND(url)
    const browsing = new Browsing_ApiService_of_ND(url)
    const response = await playlists.getPlaylist_id(username, token, salt, playlistId)
    const payload = this.parseSubsonicPayload(response)
    const playlist = this.asObject(payload.playlist)
    const entries = this.asArray(playlist?.entry)
    if (!entries.length) {
      return []
    }

    const songs = await Promise.all(
      entries.map(async (entry) => {
        const songId = this.toStringValue(entry.id).trim()
        if (!songId) {
          return entry
        }
        const songResponse = await browsing.getSong(username, token, salt, songId)
        const songPayload = this.parseSubsonicPayload(songResponse)
        return this.asObject(songPayload.song) || entry
      })
    )

    return songs.filter((item) => item && typeof item === 'object')
  }

  async getAlbumList(params: {
    url: string
    username: string
    token: string
    salt: string
    start: string
    end: string
    order: string
    sort: string
    search: string
    starred: string
    artistId: string
    recentlyPlayed?: boolean
  }): Promise<ListResult> {
    const {
      url,
      username,
      token,
      salt,
      start,
      end,
      order,
      sort,
      search,
      starred,
      artistId,
      recentlyPlayed = false,
    } = params

    const browsing = new Browsing_ApiService_of_ND(url)
    const searching = new Searching_ApiService_of_ND(url)
    const paging = this.resolvePaging(start, end, 30)

    let albumMaps: Record<string, any>[] = []
    let totalCount = 0

    if (search.trim()) {
      const response = await searching.getSearch3(username, token, salt, search.trim(), {
        artistCount: '0',
        artistOffset: '0',
        albumCount: String(paging.size),
        albumOffset: String(paging.offset),
        songCount: '0',
        songOffset: '0',
      })
      const payload = this.parseSubsonicPayload(response)
      const searchResult = this.asObject(payload.searchResult3)
      albumMaps = this.sortAlbums(this.asArray(searchResult?.album), sort, order)
      totalCount = albumMaps.length
    } else if (artistId.trim()) {
      const response = await browsing.getArtist(username, token, salt, artistId.trim())
      const payload = this.parseSubsonicPayload(response)
      const artist = this.asObject(payload.artist)
      const allAlbums = this.sortAlbums(this.asArray(artist?.album), sort, order)
      totalCount = allAlbums.length
      albumMaps = this.sliceItems(allAlbums, paging.offset, paging.size)
    } else {
      const response = await browsing.getAlbumList2(username, token, salt, {
        type: this.resolveAlbumListType(sort, order, starred, recentlyPlayed),
        size: String(paging.size),
        offset: String(paging.offset),
      })
      const payload = this.parseSubsonicPayload(response)
      const albumList = this.asObject(payload.albumList2)
      albumMaps = this.asArray(albumList?.album)
      totalCount = albumMaps.length
    }

    if (starred === 'true') {
      albumMaps = albumMaps.filter((album) => this.toBoolean(album.starred ?? album.favorite))
      totalCount = albumMaps.length
    }

    const metadata = albumMaps.map((album) =>
      this.buildAlbumMetadata(album, url, username, token, salt)
    )
    const items = albumMaps.map((album, index) =>
      this.buildAlbumItem(album, url, username, token, salt, paging.offset + index + 1)
    )

    return { items, metadata, totalCount }
  }

  async getArtistList(params: {
    url: string
    username: string
    token: string
    salt: string
    start: string
    end: string
    order: string
    sort: string
    search: string
    starred: string
    recentlyPlayed?: boolean
  }): Promise<ListResult> {
    const {
      url,
      username,
      token,
      salt,
      start,
      end,
      order,
      sort,
      search,
      starred,
      recentlyPlayed = false,
    } = params

    const browsing = new Browsing_ApiService_of_ND(url)
    const searching = new Searching_ApiService_of_ND(url)
    const paging = this.resolvePaging(start, end, 30)
    const requiresPlaybackAggregation = this.isPlaybackSort(sort, recentlyPlayed)

    let artistMaps: Record<string, any>[] = []
    let totalCount = 0

    if (search.trim()) {
      const response = await searching.getSearch3(username, token, salt, search.trim(), {
        artistCount: '500',
        artistOffset: '0',
        albumCount: '0',
        albumOffset: '0',
        songCount: '0',
        songOffset: '0',
      })
      const payload = this.parseSubsonicPayload(response)
      const searchResult = this.asObject(payload.searchResult3)
      artistMaps = this.asArray(searchResult?.artist)
    } else if (starred === 'true') {
      const response = await browsing.getStarred2(username, token, salt)
      const payload = this.parseSubsonicPayload(response)
      const starredRoot = this.asObject(payload.starred2)
      artistMaps = this.asArray(starredRoot?.artist)
    } else {
      const response = await browsing.getArtists_ALL(username, token, salt)
      const payload = this.parseSubsonicPayload(response)
      const artistsRoot = this.asObject(payload.artists)
      const indexes = this.asArray(artistsRoot?.index)
      artistMaps = indexes.flatMap((indexItem) => this.asArray(indexItem.artist))
    }

    if (requiresPlaybackAggregation && artistMaps.length > 0) {
      const playbackMap = await this.loadArtistPlaybackMap(url, username, token, salt)
      artistMaps = this.applyArtistPlaybackMap(artistMaps, playbackMap)
    }

    if (recentlyPlayed) {
      artistMaps = artistMaps.filter(
        (artist) => this.toInt(artist.playCount ?? artist.play_count, 0) > 0
      )
    }

    artistMaps = this.sortArtists(artistMaps, sort, order)
    totalCount = artistMaps.length
    artistMaps = this.sliceItems(artistMaps, paging.offset, paging.size)

    const metadata = artistMaps.map((artist) =>
      this.buildArtistMetadata(artist, url, username, token, salt)
    )
    const items = artistMaps.map((artist, index) =>
      this.buildArtistItem(artist, url, username, token, salt, paging.offset + index + 1)
    )

    return { items, metadata, totalCount }
  }

  async getMediaList(params: {
    url: string
    username: string
    token: string
    salt: string
    start: string
    end: string
    order: string
    sort: string
    search: string
    starred: string
    playlistId: string
    albumId: string
    artistId: string
    year: string
    recentlyPlayed?: boolean
  }): Promise<ListResult> {
    const {
      url,
      username,
      token,
      salt,
      start,
      end,
      order,
      sort,
      search,
      starred,
      playlistId,
      albumId,
      artistId,
      year,
      recentlyPlayed = false,
    } = params

    const browsing = new Browsing_ApiService_of_ND(url)
    const searching = new Searching_ApiService_of_ND(url)
    const paging = this.resolvePaging(start, end, 30)
    const trimmedPlaylistId = playlistId.trim()
    const wantsStarred = trimmedPlaylistId === 'favorites' || starred === 'true'
    const randomSort = sort.trim().toLowerCase().includes('random')
    const requiresPlaybackSearch =
      !trimmedPlaylistId &&
      !albumId.trim() &&
      !artistId.trim() &&
      !wantsStarred &&
      !randomSort &&
      this.isPlaybackSort(sort, recentlyPlayed)

    let songMaps: Record<string, any>[] = []
    let totalCount = 0

    if (requiresPlaybackSearch) {
      const allSongs = await this.loadAllSearchSongs(url, username, token, salt, search)
      const filteredSongs = this.applySongFilters(allSongs, search, year, albumId, artistId, false)
      let sortedSongs = this.sortSongs(filteredSongs, sort, order)
      if (recentlyPlayed) {
        sortedSongs = sortedSongs.filter((song) => this.toInt(song.playCount ?? song.play_count, 0) > 0)
      }
      totalCount = sortedSongs.length
      songMaps = this.sliceItems(sortedSongs, paging.offset, paging.size)
    } else if (trimmedPlaylistId && trimmedPlaylistId !== 'favorites') {
      const allSongs = await this.loadSongsFromPlaylist(url, username, token, salt, trimmedPlaylistId)
      totalCount = allSongs.length
      songMaps = this.sliceItems(allSongs, paging.offset, paging.size)
    } else if (albumId.trim()) {
      const allSongs = await this.loadSongsFromAlbum(url, username, token, salt, albumId.trim())
      const filteredSongs = this.applySongFilters(allSongs, search, year, albumId, artistId, wantsStarred)
      totalCount = filteredSongs.length
      songMaps = this.sliceItems(this.sortSongs(filteredSongs, sort, order), paging.offset, paging.size)
    } else if (artistId.trim()) {
      const allSongs = await this.loadSongsFromArtist(url, username, token, salt, artistId.trim())
      const filteredSongs = this.applySongFilters(allSongs, search, year, albumId, artistId, wantsStarred)
      totalCount = filteredSongs.length
      songMaps = this.sliceItems(this.sortSongs(filteredSongs, sort, order), paging.offset, paging.size)
    } else if (wantsStarred) {
      const allSongs = await this.loadStarredSongs(url, username, token, salt)
      const filteredSongs = this.applySongFilters(allSongs, search, year, albumId, artistId, true)
      totalCount = filteredSongs.length
      songMaps = this.sliceItems(this.sortSongs(filteredSongs, sort, order), paging.offset, paging.size)
    } else if (randomSort) {
      const response = await browsing.getRandomSongs(
        username,
        token,
        salt,
        String(paging.size),
        this.toStringValue(year),
        this.toStringValue(year)
      )
      const payload = this.parseSubsonicPayload(response)
      const randomSongs = this.asObject(payload.randomSongs)
      songMaps = this.asArray(randomSongs?.song)
      totalCount = songMaps.length
    } else {
      const response = await searching.getSearch3(username, token, salt, search.trim(), {
        artistCount: '0',
        artistOffset: '0',
        albumCount: '0',
        albumOffset: '0',
        songCount: String(paging.size),
        songOffset: String(paging.offset),
      })
      const payload = this.parseSubsonicPayload(response)
      const searchResult = this.asObject(payload.searchResult3)
      songMaps = this.sortSongs(
        this.applySongFilters(this.asArray(searchResult?.song), search, year, albumId, artistId, false),
        sort,
        order
      )
      totalCount = songMaps.length
    }

    if (!requiresPlaybackSearch && recentlyPlayed && songMaps.length) {
      songMaps = this.sortSongs(songMaps, 'play_date', 'desc')
    }

    const metadata = songMaps.map((song) => this.buildSongMetadata(song, url, username, token, salt))
    const items = metadata.map((song, index) => this.buildSongItem(song, paging.offset + index + 1))
    return { items, metadata, totalCount }
  }

  async getHomeSection(params: {
    kind: 'play_count' | 'random' | 'recently_added' | 'recently_played'
    url: string
    username: string
    token: string
    salt: string
    start?: string
    end?: string
  }): Promise<any[]> {
    const { kind, url, username, token, salt, start = '0', end = '15' } = params

    switch (kind) {
      case 'play_count':
        return (
          await this.getAlbumList({
            url,
            username,
            token,
            salt,
            start,
            end,
            order: 'desc',
            sort: 'play_count',
            search: '',
            starred: '',
            artistId: '',
          })
        ).items
      case 'random':
        return (
          await this.getAlbumList({
            url,
            username,
            token,
            salt,
            start,
            end,
            order: 'asc',
            sort: 'random',
            search: '',
            starred: '',
            artistId: '',
          })
        ).items
      case 'recently_added':
        return (
          await this.getAlbumList({
            url,
            username,
            token,
            salt,
            start,
            end,
            order: 'desc',
            sort: 'created_at',
            search: '',
            starred: '',
            artistId: '',
          })
        ).items
      case 'recently_played':
        return (
          await this.getAlbumList({
            url,
            username,
            token,
            salt,
            start,
            end,
            order: 'desc',
            sort: 'play_date',
            search: '',
            starred: '',
            artistId: '',
            recentlyPlayed: true,
          })
        ).items
      default:
        return []
    }
  }
}
