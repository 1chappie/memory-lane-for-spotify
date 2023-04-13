export const BATCH_IS = {
    LOW: -1,
    WITHIN: 0,
    OVER: 10,
    HIGH: 1,
}

export class Timeframe {
    constructor(year, season) {
        this.year = year;
        this.season = season;
    }

    static fromDateString(date) {
        let _date = new Date(date);
        let year = _date.getFullYear();
        let season = Math.floor(_date.getMonth() / 3) + 1;
        return new this(year, season);
    }

    toDates() {
        let startingDay = new Date(this.year, (this.season - 1) * 3, 1);
        let endingDay = new Date(this.year, (this.season - 1) * 3 + 3, 1);
        endingDay.setDate(endingDay.getDate() - 1);
        return [startingDay, endingDay];
    }

    estimateOffset(librarySize, earliestTf, latestTf) {
        let totalSeasons = earliestTf.diff(latestTf);
        if (!totalSeasons || librarySize <= 50) return 0;
        let tracksPerSeason = librarySize / totalSeasons;
        let seasonsOffset = this.diff(earliestTf);
        if (seasonsOffset === 0)
            return librarySize - 50;
        // ^ api cannot be called with the offset equal to the library size
        return Math.floor(librarySize - tracksPerSeason * seasonsOffset);
    }

    compareTo(other) {
        if (this.year < other.year) {
            return -1;
        } else if (this.year > other.year) {
            return 1;
        } else if (this.season < other.season) {
            return -1;
        } else if (this.season > other.season) {
            return 1;
        } else {
            return 0;
        }
    }

    diff(other) {
        return Math.abs(this.year - other.year) * 4 + Math.abs(this.season - other.season);
    }

    static batchPosition(batch, timeframe) {
        let first = new Date(batch[0].added_at);
        let last = new Date(batch[batch.length - 1].added_at);
        let [start, end] = timeframe.toDates();
        if (first < start && (last < start || last >= start)) {
            return BATCH_IS.LOW;
        } else if (first >= start && last <= end) {
            return BATCH_IS.WITHIN;
        } else if ((first <= end || first > end) && last > end) {
            return BATCH_IS.HIGH;
        } else {
            return BATCH_IS.OVER;
        }
    }

    static trackPosition(track, timeframe) {
        let [start, end] = timeframe.toDates();
        if (new Date(track.added_at) >= start && new Date(track.added_at) <= end) {
            return true;
        } else {
            return false;
        }
    }
}