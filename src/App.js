import './App.css';
import {useEffect} from 'react';
import {token, authLink, flow} from "./api/Auth";
import './api/Spotify';
import Landing from "./pages/Landing";
import Selector from "./pages/Selector";

function App() {
    useEffect(() => {
        if (flow.callback()) {
            console.log("Callback");
            token.grab();
            // window.location.reload();
        }
    }, [])


    return (flow.logged() ? <Selector/> : <Landing/>)
}

export default App;

