import SpotifyWebApi from 'spotify-web-api-js';
import {Timeframe, BATCH_IS} from "./Utils.js";
import "../components/flowStates/Loading.js";

export function Track(id, url, uri, name, artist, album, addedAt, image) {
    this.id = id;
    this.url = url;
    this.uri = uri;
    this.play = uri + ":play";
    this.name = name;
    this.artist = artist;
    this.album = album;
    this.addedAt = addedAt;
    this.image = image;
}

// Wrapper for a wrapper
export class Spotify {
    static spotifyApi = new SpotifyWebApi();
    static cachedTracks = [];
    static cachedOffset = 0;
    static librarySize = 0;
    // Earliest song
    static earliestTf = null;
    // Latest song
    static latestTf = null;

    static async initialize(token) {
        await this.spotifyApi.setAccessToken(token);
        let data = await this.spotifyApi.getMySavedTracks({limit: 1, offset: 0});
        this.librarySize = data.total;
        this.latestTf = Timeframe.fromDateString(data.items[0].added_at);
        data = await this.spotifyApi.getMySavedTracks({limit: 1, offset: this.librarySize - 1});
        this.earliestTf = Timeframe.fromDateString(data.items[0].added_at);
        console.log("Initialized API");
    }

    static clearCache() {
        this.cachedTracks = [];
        this.cachedOffset = 0;
    }

    static async createPlaylist(name){
        let [userID, userName] = await this.spotifyApi.getMe().then(
            (data) => {return [data.id, data.display_name]}
        );
        let playlistResponse = await this.spotifyApi.createPlaylist(
            userID,
            {"name": name,
            "public": true}
        );
        // creates it with whatever is currently cached
        let uriList = this.cachedTracks.map((track) => {return track.uri});
        // batches of 50 to overcome API limitations
        for (let i = 0; i < uriList.length; i += 50) {
            await this.spotifyApi.addTracksToPlaylist(
                playlistResponse.id,
                uriList.slice(i, i + 50)
            );
        }
        // updating description separately due to a bug in the api
        await this.spotifyApi.changePlaylistDetails(
            playlistResponse.id,
            {"description": `By Nostalgify, for ${userName}.`}
        )
        console.log("Created playlist with ID: " + playlistResponse.id);
        console.log(playlistResponse);
        window.open(playlistResponse.uri,"_self");
    }


    // The starting year and library size are obtained from the API.
    // The user will be choosing a year and season, which together will form a timeframe.

    // Having the timeframe, the starting year and library size,
    // the offset of the timeframe will have to be estimated due to API limitations.

    // I've split the formula used into multiple lines for clarity:
    // totalSeasons = abs(earliest_timeframe - latest_timeframe)
    // tracksPerSeason = librarySize / totalSeasons;
    // seasonsOffset = abs(chosen_timeframe - earliest_timeframe)
    // return floor(librarySize - tracksPerSeason * seasonsOffset)

    // The following are assumed:
    // seasons = 1 for winter, 2 for spring, 3 for summer, 4 for autumn
    // winter = 1st of December to end of February, etc.
    // earliest_timeframe = timeframe of the earliest song added to library
    // latest_timeframe = timeframe of the latest song added to library

    // After fetching the first batch of tracks, the added-at date will be checked, and
    // the offset will be updated accordingly - trying to step closer to the chosen timeframe.
    // Once the added-at property of the tracks starts matching the timeframe,
    // the matching tracks will be pushed into the cachedTracks array.

    // If the initial batch is fully contained within the timeframe,
    // the offset will first go up and then go down, checking both sides.

    // (all of this must be done because the Spotify API does not have the option
    // of querying the library based on the added-at property, so the only way to do it
    // is to fetch the tracks in batches and look for the timeframe in each batch)
    // + one cannot simply fetch the entire library, because of rate limits

    static async getTracksByTimeframe(timeframe) {
        this.clearCache();
        console.log("cleared cache");
        if (timeframe.compareTo(this.earliestTf) < 0 || timeframe.compareTo(this.latestTf) > 0) {
            console.log("timeframe out of bounds");
            return;
        }
        console.log("library size: " + this.librarySize);
        console.log("starting year: " + this.earliestTf.year);
        console.log("timeframe: " + timeframe.year + " " + timeframe.season);
        this.cachedOffset = timeframe.estimateOffset(this.librarySize, this.earliestTf, this.latestTf);
        console.log("estimated offset: " + this.cachedOffset);
        let data = await this.spotifyApi.getMySavedTracks({limit: 50, offset: this.cachedOffset});
        let batch = data.items;
        let batchPosition = Timeframe.batchPosition(batch, timeframe);

        switch (batchPosition) {
            case BATCH_IS.OLD_LEFT:
                console.log("is to the left")
                await this.iterateBatches(batchPosition, BATCH_IS.NEW_RIGHT, batch, timeframe);
                break;

            case BATCH_IS.NEW_RIGHT:
                console.log("is to the right")
                await this.iterateBatches(batchPosition, BATCH_IS.OLD_LEFT, batch, timeframe);
                break;

            case BATCH_IS.WITHIN:
                console.log("is within");
                let initialOffset = this.cachedOffset;
                batchPosition = BATCH_IS.OLD_LEFT;
                await this.iterateBatches(batchPosition, BATCH_IS.NEW_RIGHT, batch, timeframe);
                this.cachedOffset = initialOffset + 50;
                await this.spotifyApi.getMySavedTracks({limit: 50, offset: this.cachedOffset}).then(
                    (data) => {batch=data.items}
                );
                batchPosition = BATCH_IS.NEW_RIGHT;
                await this.iterateBatches(batchPosition, BATCH_IS.OLD_LEFT, batch, timeframe);
                break;

            case BATCH_IS.OVER:
                console.log("is over")
                this.cacheMatching(batch, timeframe);
                break;
        }

        Spotify.cachedTracks.sort((t1, t2) => {
            return t1.addedAt < t2.addedAt ? 1 : -1;
        })
    }

    static async fetchBatch(offset) {
        let data = await this.spotifyApi.getMySavedTracks({limit: 50, offset: offset});
        console.log(data.items);
        return data.items;
    }

    static async iterateBatches(fromState, towardsState, batch, timeframe) {
        console.log("iterating batches, from direction " + fromState + ", towards " + towardsState + ".");
        let direction = (fromState === BATCH_IS.OLD_LEFT) ? -1 : 1;
        while (fromState !== towardsState) {
            this.cacheMatching(batch, timeframe);
            // -1 = offset gets lower = goes to right = towards newer tracks
            this.cachedOffset += (50 * direction);
            if (this.cachedOffset < 0 || this.cachedOffset > this.librarySize - 50)
                break;
            batch = await this.fetchBatch(this.cachedOffset);
            fromState = Timeframe.batchPosition(batch, timeframe);
            if (fromState === towardsState)
                this.cacheMatching(batch, timeframe);
            // ^ getting the leftovers before leaving the while
        }
    }

    static cacheMatching(batch, timeframe) {
        let valid = 0;
        for (let i = 0; i < batch.length; i++) {
            if (Timeframe.trackPosition(batch[i], timeframe)) {
                valid++;
                this.cachedTracks.push(
                    new Track(
                        batch[i].track.id,
                        batch[i].track.external_urls.spotify,
                        batch[i].track.uri,
                        batch[i].track.name,
                        batch[i].track.artists.map(artist => artist.name).join(', '),
                        batch[i].track.album.name,
                        batch[i].added_at,
                        batch[i].track.album.images[0].url
                    ));
            }
        }
        console.log("cached " + valid + " tracks");
        console.log("offset when cached: ", this.cachedOffset);
        console.log(this.cachedTracks);
    }
}