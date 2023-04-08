import SpotifyWebApi from 'spotify-web-api-js';
import {Timeframe, BATCH_IS} from "./Utils.js";

export function Track(id, url, name, artist, album, addedAt, image) {
    this.id = id;
    this.url = url;
    this.name = name;
    this.artist = artist;
    this.album = album;
    this.addedAt = addedAt;
    this.image = image;
}

// Wrapper for a wrapper :D
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
        try {
            this.spotifyApi.setAccessToken(token);
            let data = await this.spotifyApi.getMySavedTracks({limit: 1, offset: 0});
            this.librarySize = data.total;
            this.latestTf = Timeframe.fromDateString(data.items[0].added_at);
            data = await this.spotifyApi.getMySavedTracks({limit: 1, offset: this.librarySize - 1});
            this.earliestTf = Timeframe.fromDateString(data.items[0].added_at);
            console.log("API initialized");
        } catch (e) {
            console.log(e);
        }
    }

    static clearCache() {
        this.cachedTracks = [];
        this.cachedOffset = 0;
    }

    static setToken(token) {
        this.spotifyApi.setAccessToken(token);
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
    // + one cannot simply fetch the entire library, because of rate limits :)

    static async getTracksByTimeframe(timeframe) {
        try {
            this.clearCache();
            console.log("Cleared cache");
            if(timeframe.compareTo(this.earliestTf) < 0 || timeframe.compareTo(this.latestTf) > 0) {
                console.log("Timeframe out of bounds");
                return;
            }
            console.log("Library size: " + this.librarySize);
            console.log("Starting year: " + this.earliestTf.year);
            console.log("Timeframe: " + timeframe.year + " " + timeframe.season);
            this.cachedOffset = timeframe.estimateOffset(this.librarySize, this.earliestTf, this.latestTf);
            console.log("Estimated offset: " + this.cachedOffset);
            let data = await this.spotifyApi.getMySavedTracks({limit: 50, offset: this.cachedOffset});
            let batch = data.items;
            console.log("Fetched first batch");
            console.log(batch);
            let batchPosition = Timeframe.batchPosition(batch, timeframe);
            console.log("Position: " + batchPosition);

            switch (batchPosition) {
                case BATCH_IS.LOW:
                    await this.iterateBatches(batchPosition, BATCH_IS.HIGH, batch, timeframe);
                    console.log("Left valid batches at offset: " + this.cachedOffset);
                    break;

                case BATCH_IS.HIGH:
                    await this.iterateBatches(batchPosition, BATCH_IS.LOW, batch, timeframe);
                    console.log("Left valid batches at offset: " + this.cachedOffset);
                    break;

                case BATCH_IS.WITHIN:
                    console.log("All tracks match, going up and down")
                    let initialOffset = this.cachedOffset;
                    batchPosition = BATCH_IS.LOW;
                    console.log("Going up");
                    await this.iterateBatches(batchPosition, BATCH_IS.HIGH, batch, timeframe);
                    this.cachedOffset = initialOffset;
                    batchPosition = BATCH_IS.HIGH;
                    console.log("Going down");
                    await this.iterateBatches(batchPosition, BATCH_IS.LOW, batch, timeframe);
                    break;

                case BATCH_IS.OVER:
                    console.log("Contains matching tracks, caching them")
                    this.cacheMatching(batch, timeframe);
                    break;
            }
        } catch (e) {
            console.log(e);
        }
    }

    static async fetchBatch(offset) {
        let data = await this.spotifyApi.getMySavedTracks({limit: 50, offset: offset});
        return data.items;
    }

    static async iterateBatches(startPosition, endPosition, batch, timeframe) {
        let direction = (startPosition === BATCH_IS.LOW) ? -1 : 1;
        while (startPosition !== endPosition) {
            console.log(`Going ${direction > 0 ? "higher" : "lower"}, offset: ${this.cachedOffset}`);
            this.cacheMatching(batch, timeframe);
            this.cachedOffset += (50 * direction);
            if(this.cachedOffset < 0 || this.cachedOffset > this.librarySize-50)
                break;
            batch = await this.fetchBatch(this.cachedOffset);
            console.log("New batch:");
            console.log(batch);
            startPosition = Timeframe.batchPosition(batch, timeframe);
            if(startPosition === endPosition)
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
                        batch[i].track.name,
                        batch[i].track.artists.map(artist => artist.name).join(', '),
                        batch[i].track.album.name,
                        batch[i].added_at,
                        batch[i].track.album.images[0].url
                    ));
            }
        }
        console.log("Cached " + valid + " tracks");
    }
}