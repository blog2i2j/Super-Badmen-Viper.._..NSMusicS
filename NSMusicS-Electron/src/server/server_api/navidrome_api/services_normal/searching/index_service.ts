import { Navidrome_Api_Services_Normal } from '../Navidrome_Api_Services_Normal'

export class Searching_ApiService_of_ND extends Navidrome_Api_Services_Normal {
  // artistCount: artistCount.toString(),
  // artistOffset: artistOffset.toString(),
  // albumCount: albumCount.toString(),
  // albumOffset: albumOffset.toString(),
  // songCount: songCount.toString(),
  // songOffset: songOffset.toString()
  public async getSearch2(
    username: string,
    token: string,
    salt: string,
    query: string,
    artistCount: number,
    artistOffset: number,
    albumCount: number,
    albumOffset: number,
    songCount: number,
    songOffset: number
  ): Promise<any> {
    return this.sendRequest(username, token, salt, 'search2', {
      query,
      artistCount: String(artistCount),
      artistOffset: String(artistOffset),
      albumCount: String(albumCount),
      albumOffset: String(albumOffset),
      songCount: String(songCount),
      songOffset: String(songOffset),
    })
  }
  public async getSearch3(
    username: string,
    token: string,
    salt: string,
    query: string,
    params: Record<string, string> = {}
  ): Promise<any> {
    return this.sendRequest(username, token, salt, 'search3', {
      query,
      ...params,
    })
  }
}
