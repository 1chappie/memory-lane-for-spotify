import {useNavigate, useParams} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {Spotify} from "../api/Spotify";
import {token} from "../api/Auth";
import "./Playlist.css";
import {Timeframe} from "../api/Utils";
import Loading from "../components/flowStates/Loading";
import back_arrow from "../assets/left_arrow.png";
import love from "../assets/love.png";
import love_full from "../assets/love-full.png";
import TrackCard from "../components/TrackCard";

export default function Playlist() {
    const {year, season} = useParams();
    let [isLoading, setIsLoading] = useState(true);
    let [isAdded, setIsAdded] = useState(false);
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
        if (Spotify.cachedTracks.length === 0)
            return (<h1>No tracks found</h1>);
        let ts = [];
        Spotify.cachedTracks.map((t) => {
            ts.push(<TrackCard track={t} key={t.id}/>)
        });
        return ts;
    }

    return (
        <>
            {isLoading ? <Loading/> :
                <div className={"mainContainer"}>
                    <div className={"titleBar"}>
                        <span className="backArrow" onClick={
                            () => navigate(`/timeline/${year}`)
                        }><img src={back_arrow}/></span>
                        <div className={"titlebarElements"}>
                            <h1>{(new Timeframe(year, season)).toString()}</h1>
                            <button className={"saveButton"} onClick={
                                async () => {
                                    setIsLoading(true);
                                    await Spotify.createPlaylist((new Timeframe(year, season)).toString());
                                    setIsAdded(true);
                                    setIsLoading(false);
                                }
                            }>
                                {isAdded ?
                                    <><img src={love_full}/>
                                    Added to Your Library</>
                                    :
                                    <><img src={love}/>
                                    Add to Your Library</>
                                }
                            </button>
                        </div>
                    </div>
                    <div className={"trackList"}>
                        <TrackSet/>
                    </div>
                </div>
            }
        </>
    )
}