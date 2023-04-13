import {useNavigate, useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {Spotify} from "../api/Spotify";
import {token} from "../api/Auth";
import "./Playlist.css";
import {Timeframe} from "../api/Utils";
import Loading from "../components/flowStates/Loading";

let isLoading, setIsLoading;
const seasonStrings = {
    1: "Winter",
    2: "Spring",
    3: "Summer",
    4: "Fall"
}

export default function Playlist() {
    const {year, season} = useParams();
    [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        async function getTracks() {
            await Spotify.getTracksByTimeframe(new Timeframe(year, season));
        }

        getTracks().then(() => {
            setIsLoading(false);
        }).catch((e) => {
            if (e.status === 401) navigate("/401");
        });

    }, []);

    let TrackSet = () => {
        let tr = Spotify.cachedTracks;
        let ts=[];
        for (let i = 0; i < tr.length; i++) {
            ts.push(
                <div className={"track"} key={i}>
                    {tr[i].name} {tr[i].artist} {tr[i].album.name}
                </div>
            )
        }
        return ts;
    }

    return (
        <>
            {isLoading
                ? <Loading/>
                : <div className={"playlist"}>
                    <h1>{seasonStrings[season]} of {year}</h1>
                    <div className={"trackList"}>
                        <TrackSet/>
                    </div>
                </div>
            }
        </>
    )
}