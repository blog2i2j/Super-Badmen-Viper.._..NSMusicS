# NineSong Open-Source Reference

Source snapshot:

- Local source used for this reference: `E:\0_XiangCheng_WorkSpace\0_项目备份\NineSong\README.md`
- This document is a condensed reference of that archived public README so the main workspace README can stay concise.

## Public Repository Status

According to the archived public README snapshot:

- The NineSong open-source repository is declared frozen at its current public commit.
- The backend is described as no longer continuing as an actively updated open-source backend.
- DockerHub distribution is described as remaining permanently free.
- React-based frontend apps were described as planned to start rolling out around April 2026.
- A multi-OS NineSong-Desktop installer flow and a NineSong-Panel visual Docker panel were described as future-facing plans.
- NSMusicS-Flutter was described there as a cross-platform premium app planned for Google Play, App Store, and Microsoft Store.

Because that README is itself a historical public snapshot, treat these points as archived public positioning rather than guaranteed live release commitments.

## Music Scene Features Listed In The Archived README

The archived NineSong README explicitly listed these implemented music-scene enhancements:

- Rich single-level sorting plus multi-level mixed sorting and filtering
- Deeper composite-tag processing
- Search jump optimization
- Fuzzy search across title, album, artist, and lyrics
- Mixed matching for Chinese pinyin and simplified/traditional Chinese
- Recommended similar search results
- Multiple playback styles such as cover square, rotate, beaut, base, and album-list styles
- Exclusive playback modes for different music-file scenarios
- CUE-focused playback and CUE file management
- Visualized virtual-track playback for CUE
- Broader TAG import support including `m4a` and `cue`-related music-image workflows
- Phase 1 recommendation support through tag cloud and interest-driven suggestions
- Phase 2 lightweight recommendation algorithms based on user usage data

## Planned Music Scene Updates Listed There

The archived README also listed the following planned directions:

- Dual-page browsing with virtual-list and paged-list modes
- Uploading, downloading, and synchronizing files between server and client
- Visualized tag management with remote upload, auto-association, and manual merge flows
- Richer tag fields such as artist pictures, artist photos, album covers, quality versions, and lyrics versions
- ISO-focused playback and ISO file management
- More advanced audio effects, including multi-channel effects and multiple EQ modes
- Optional public-welfare online tag APIs for user-driven tag synchronization
- Recommendation Phase 3 based on a music knowledge graph
- Recommendation Phase 4 combining the knowledge graph with LLM-based recommendation

## Docker Deployment Notes From The Archived README

The archived NineSong README described the public Docker deployment flow as:

1. Download the package from the NineSong releases page:
   https://github.com/Super-Badmen-Viper/NineSong/releases/
2. Keep `.env` and `docker-compose.yaml` in the same folder.
3. Customize mapped volumes as needed, especially for music-library storage.
4. Run:

```sh
docker compose up -d
```

Default credentials listed there:

- Login email: `admin@gmail.com`
- Login password: `admin123`

Important notes from that archived README:

- Updating the mirrored NineSong version could clear temporary generated media resources such as album covers.
- A rescan might be needed to regenerate temporary resources.
- A full reinstall required clearing both containers and Docker volume data.

## Local Debug Notes Listed There

The archived README also included these local-debug pointers:

- Adjust `.env` values such as:
  - `DB_HOST=localhost`
  - `DB_PORT=27017`
- If local MongoDB volume data is not already prepared, update `docker-compose-local-windows.ps1` volume targets first.
- Then run the local docker-compose Windows script and wait for the volume paths to initialize.
- Install `air`:

```sh
go install github.com/air-verse/air@latest
```

- Then run:

```sh
air
```

It also mentioned importing `NineSong API.postman_collection.json` for Postman-based API runs.

## Community And Additional Notes

The archived README listed:

- QQ Group 1 as full
- QQ Group 2: `610551734`

If you need the exact historical wording, consult the archived README directly at the source path above.
