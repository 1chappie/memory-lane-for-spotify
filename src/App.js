import './App.css';
import React, {useState, useEffect} from 'react';
import {token, authLink} from "./Auth";
import './Spotify';
import Spotify from "./Spotify";

function Unlogged() {
  return (
      <div className="App">
        <a href={authLink}>Login to Spotify</a>
      </div>
  )
}

function Logged() {
  const getNowPlaying = () => {
    Spotify.setToken(token.get());
    Spotify.getCurrentTrack().then(name => {
      console.log("dan " + name);
    });
  }

  return (<div className="App">
    <button onClick={getNowPlaying}>Get Now Playing</button>
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
    if (!token.get()) {
      if (window.location.hash) {
        token.grab();
        window.location.reload();
      }
    }
  }, [])

  return (token.get() ? <Logged/> : <Unlogged/>);
}

export default App;

