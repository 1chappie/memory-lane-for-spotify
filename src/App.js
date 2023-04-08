import './App.css';
import {useState, useEffect} from 'react';
import {token, authLink, flow} from "./backend/Auth";
import './backend/Spotify';
import {Spotify} from "./backend/Spotify";
import Landing from "./scenes/Landing";
import {Timeframe} from "./backend/Utils";

function Unlogged() {
    return (
        <div className="App">
            <a href={authLink}>Login to Spotify</a>
        </div>
    )
}

function Logged() {
    const testFunction = async () => {
        await Spotify.initialize(token.get());
        let tf = new Timeframe(2018,1);
        await Spotify.getTracksByTimeframe(tf);
        console.log(Spotify.cachedTracks);
    }


    return (<div className="App">
        <button onClick={testFunction}>Test</button>
        <button onClick={() => {
            token.clear();
            window.location.reload();
        }
        }>Log out
        </button>

    </div>)
}

function App() {
    useEffect(() => {
        if (flow.callback()) {
            console.log("Callback");
            token.grab();
            window.location.reload();
        }
    }, [])

    return (flow.logged() ? <Logged/> : <Landing/>)
}

export default App;

