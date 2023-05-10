import {Spotify} from "../api/Spotify";
import {useEffect, useState} from "react";
import {token} from "../api/Auth";
import Loading from "../components/flowStates/Loading";
import Expired from "../components/flowStates/401";
import {Link, Route, Routes, useNavigate, useParams} from 'react-router-dom';
import Footer from "../components/Footer";
import Wrong from "../components/flowStates/404";
import "./Selector.css"
import Playlist from "./Playlist";
import back_arrow from "../assets/left_arrow.png";

let isLoading, setIsLoading;

function YearSelector() {
    try {
        let firstYear = Spotify.earliestTf.year;
        let lastYear = Spotify.latestTf.year;
        let arr = [];
        for (let i = firstYear; i <= lastYear; i++) {
            arr.push(
                <Link to={"/timeline/" + i} key={i} className="selectorButton">
                    {i}
                </Link>
            )
        }
        return (
            <div className="selectorStrip">
                {arr}
            </div>
        );
    } catch (e) {
        console.log(e);
        return <Wrong/>;
    }
}

function SeasonSelector() {
    const {year} = useParams();
    function seasonDivs(start, end) {
        const seasonStrings = {
            1: "Winter",
            2: "Spring",
            3: "Summer",
            4: "Fall"
        }
        let arr = [];
        arr.push(
            <Link to={"/timeline"} key={"back"} className={"selectorButton"}>
                <img src={back_arrow} alt={"back"} className={"back"}/>
            </Link>
        )
        for (let i = start; i <= end; i++) {
            arr.push(
                <Link to={`/timeline/${year}/${i}`} key={i} className="selectorButton">
                    {seasonStrings[i]}
                </Link>)
        }
        return (
            <div className="selectorStrip">
                {arr}
            </div>
        );
    }

    try {
        if (year === undefined || year < Spotify.earliestTf.year || year > Spotify.latestTf.year)
            return <div>Invalid year. Please retry.</div>;
        if (year == Spotify.earliestTf.year)
            return seasonDivs(Spotify.earliestTf.season, 4);
        if (year == Spotify.latestTf.year)
            return seasonDivs(1, Spotify.latestTf.season);
        return seasonDivs(1, 4);
    } catch (e) {
        console.log(e);
        return <Wrong/>
    }
}

export default function Selector() {
    [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        async function initializeApi() {
            await Spotify.initialize(token.get());
        }
        initializeApi().then(() => {
            navigate("/timeline");
            isLoading = false;
        }).catch((e) => {
            if (e.status === 401) navigate("/401");
        });

    }, []);

    return (
        <>
            <Routes>
                <Route exact path="/callback" element={<Loading/>}/>
                <Route exact path="/timeline" element={<YearSelector/>}/>
                <Route exact path="/timeline/:year" element={<SeasonSelector/>}/>
                <Route exact path="/timeline/:year/:season" element={<Playlist/>}/>
                <Route exact path="/401" element={<Expired/>}/>
                <Route path="*" component={<Wrong/>}/>
            </Routes>
            <Footer/>
        </>
    )
};