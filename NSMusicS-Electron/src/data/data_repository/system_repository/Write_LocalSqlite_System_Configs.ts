import { App_Configs } from '@/data/data_models/app_models/app_Configs/class_App_Configs'
import { Player_Configs_of_Audio_Info } from '@/data/data_models/app_models/app_Configs/class_Player_Configs_of_Audio_Info'
import { Player_Configs_of_UI } from '@/data/data_models/app_models/app_Configs/class_Player_Configs_of_UI'

export class Write_LocalSqlite_System_Configs {
  private getTableColumns(db: any, tableName: string): string[] {
    try {
      const rows = db.prepare(`PRAGMA table_info(${tableName})`).all()
      return rows
        .map((row: { name?: string }) => String(row?.name ?? '').trim())
        .filter((name: string) => name.length > 0)
    } catch (error) {
      console.error(`Failed to read table columns for ${tableName}:`, error)
      return []
    }
  }

  private normalizeSqlValue(value: any) {
    if (value == null) {
      return ''
    }
    if (typeof value === 'object') {
      if ('id' in value) {
        return String(value.id ?? '')
      }
      return JSON.stringify(value)
    }
    if (typeof value === 'boolean') {
      return value ? 1 : 0
    }
    return value
  }

  system_app_config(db: any, app_Configs: App_Configs) {
    /// system_app_config
    db.exec('DELETE FROM system_app_config')
    db.exec("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'system_app_config'")
    const appConfigStmt = db.prepare(
      `INSERT INTO system_app_config (config_key, config_value) VALUES (?, ?)`
    )
    Object.entries(app_Configs).forEach(([propertyName, value]) => {
      appConfigStmt.run(propertyName, value)
    })
  }

  system_library_config(db: any, local_Configs: Local_Configs_Props[]) {
    /// system_library_config
    db.exec('DELETE FROM system_library_config')
    db.exec("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'system_library_config'")
    const local_library_config = db.prepare(`
            INSERT INTO system_library_config
                (id,config_key,config_value)
            VALUES (?, ?, ?)
        `)
    local_Configs.forEach((local_Configs_Props) => {
      local_library_config.run(
        local_Configs_Props.id,
        local_Configs_Props.config_key,
        local_Configs_Props.config_value
      )
    })
  }
  system_servers_config(db: any, server_Configs: Server_Configs_Props[]) {
    /// system_servers_config
    db.exec('DELETE FROM system_servers_config')
    db.exec("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'system_servers_config'")
    const server_ConfigsStmt = db.prepare(`
            INSERT INTO system_servers_config 
            (id,server_name,url,user_name,password,last_login_at,type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
    server_Configs.forEach((server_Configs_Props) => {
      server_ConfigsStmt.run(
        server_Configs_Props.id,
        server_Configs_Props.server_name,
        server_Configs_Props.url,
        server_Configs_Props.user_name,
        server_Configs_Props.password,
        server_Configs_Props.last_login_at,
        server_Configs_Props.type
      )
    })
  }

  system_player_config_of_ui(db: any, player_Configs_of_UI: Player_Configs_of_UI) {
    /// system_player_config_of_ui
    db.exec('DELETE FROM system_player_config_of_ui')
    db.exec("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'system_player_config_of_ui'")
    const uiConfigStmt = db.prepare(
      `INSERT INTO system_player_config_of_ui (config_key, config_value) VALUES (?, ?)`
    )
    Object.entries(player_Configs_of_UI).forEach(([propertyName, value]) => {
      uiConfigStmt.run(propertyName, value)
    })
  }

  system_player_config_of_audio(
    db: any,
    player_Configs_of_Audio_Info: Player_Configs_of_Audio_Info
  ) {
    /// system_player_config_of_audio
    db.exec('DELETE FROM system_player_config_of_audio')
    db.exec("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'system_player_config_of_audio'")
    const audioConfigStmt = db.prepare(
      `INSERT INTO system_player_config_of_audio (config_key, config_value) VALUES (?, ?)`
    )
    Object.entries(player_Configs_of_Audio_Info).forEach(([propertyName, value]) => {
      audioConfigStmt.run(propertyName, value)
    })
  }

  public system_playlist_item_id_config(db: any, media_file_id_of_list: string[]) {
    db.exec('DELETE FROM system_playlist_file_id')
    db.exec("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'system_playlist_file_id'")

    let order_index = 1
    media_file_id_of_list.forEach((mediaFileId) => {
      db.prepare(
        `
            INSERT INTO system_playlist_file_id (media_file_id, order_index)
            VALUES (?, ?)
        `
      ).run(mediaFileId, order_index++)
    })
  }

  public system_playlist_item_config(
    db: any,
    media_file_of_list: Record<string, any>[] // 假设 media_file_of_list 是对象数组
  ) {
    db.exec('DELETE FROM server_media_file')

    const excludedFields = new Set([
      'play_id',
      'favorite',
      'rating',
      'play_count',
      'play_date',
      'play_complete_count',
      'duration_txt',
      'absoluteIndex',
      'selected',
      'playing',
      'all_artist_ids',
      'all_album_artist_ids',
      'cue_count',
      'guest_cue_count',
      'encoding_format',
      'cue_tracks',
      'cue_track_count',
      'cue_track_show',
    ])

    if (!Array.isArray(media_file_of_list) || media_file_of_list.length === 0) {
      return
    }

    const tableColumns = this.getTableColumns(db, 'server_media_file')
    if (tableColumns.length === 0) {
      return
    }

    const columns = tableColumns.filter((column) => !excludedFields.has(column))
    if (columns.length === 0) {
      return
    }

    const quotedColumns = columns.map((column) => `"${column}"`).join(', ')
    const placeholders = columns.map(() => '?').join(', ')

    try {
      const stmt = db.prepare(
        `
            INSERT INTO server_media_file (${quotedColumns})
            VALUES (${placeholders})
        `
      )
      const insertRows = db.transaction((rows: Record<string, any>[]) => {
        rows.forEach((item) => {
          const values = columns.map((column) => this.normalizeSqlValue(item?.[column]))
          stmt.run(...values)
        })
      })
      insertRows(media_file_of_list)
    } catch (error) {
      console.error('Error inserting playlist snapshot data:', error)
    }
  }
}
