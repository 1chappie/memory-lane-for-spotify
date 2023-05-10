import moment from 'moment';

export const BATCH_IS = {
    OLD_LEFT: -1,
    WITHIN: 0,
    OVER: 10,
    NEW_RIGHT: 1
}

export class Timeframe {
    constructor(year, season) {
        this.year = year;
        this.season = season;
    }

    static fromDateString(date) {
        let _date = moment.utc(date);
        let year = _date.year();
        let month = _date.month();
        switch (Number(month)) {
            case 11: year++;
            case 0: case 1:
                return new this(year, 1);
            case 2: case 3: case 4:
                return new this(year, 2);
            case 5: case 6: case 7:
                return new this(year, 3);
            case 8: case 9: case 10:
                return new this(year, 4);
        }
    }

    toDates() {
        let startMonth = {
            1: 11,
            2: 2,
            3: 5,
            4: 8
        }
        let endMonth = {
            1: 1,
            2: 4,
            3: 7,
            4: 10
        }
        let startingDay = moment()
            .year(this.year)
            .month(startMonth[this.season])
            .date(1)
            .hour(0)
            .minute(0)
            .second(0)
            .utc(true);
        if (this.season == 1) {
            startingDay.subtract(1, 'year');
        }
        let endingDay = moment()
            .year(this.year)
            .month(endMonth[this.season])
            .endOf('month')
            .hour(23)
            .minute(59)
            .second(59)
            .utc(true);
        return [startingDay, endingDay];
    }

    estimateOffset(librarySize, earliestTf, latestTf) {
        let totalSeasons = earliestTf.diff(latestTf);
        console.log("Total seasons: ", totalSeasons);
        if (totalSeasons == 0 || librarySize <= 50) return 0;
        let tracksPerSeason = librarySize / totalSeasons;
        let seasonsOffset = this.diff(earliestTf);
        if (seasonsOffset === 0)
            return librarySize - 50;
        // ^ api cannot be called with the offset equal to the library size
        let ofs = Math.floor(librarySize - tracksPerSeason * seasonsOffset);
        return ofs < 0 ? 0 : ofs;
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
        let batchRightRecent = moment.utc(batch[0].added_at);
        let batchLeftOld = moment.utc(batch[batch.length - 1].added_at);
        let [limitLeftOld, limitRightRecent] = timeframe.toDates();
        // the more left something is, the older it is, IMPORTANT
        console.log("Batch bounds: ", batchLeftOld.format('D M Y'), batchRightRecent.format('D M Y'));
        if (batchLeftOld.isBefore(limitLeftOld)){
            console.log("is before", limitLeftOld.format('D M Y'));
            return BATCH_IS.OLD_LEFT;
        } else if (batchRightRecent>=limitRightRecent && batchLeftOld<=limitLeftOld) {
            console.log("batch is within", limitLeftOld.format('D M Y'), limitRightRecent.format('D M Y'));
            return BATCH_IS.WITHIN;
        } else if (batchRightRecent.isAfter(limitRightRecent)) {
            console.log("is after", limitRightRecent.format('D M Y'));
            return BATCH_IS.NEW_RIGHT;
        } else {
            console.log("batch is over")
            return BATCH_IS.OVER;
        }
    }

    static trackPosition(track, timeframe) {
        let [start, end] = timeframe.toDates();
        return moment.utc(track.added_at) >= start && moment.utc(track.added_at) <= end;
    }

    toString(){
        let season = {
            1: "Winter",
            2: "Spring",
            3: "Summer",
            4: "Fall"
        }
        return `${season[this.season]} of ${this.year}`;
    }
}