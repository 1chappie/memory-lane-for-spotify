// landing page for logging into spotify
import {authLink} from "../api/Auth";
import "./Landing.css";
import Footer from "../components/Footer";

export default function Landing() {
    return <>
        <div className="landing">
            <div className="header">
                <h1>Nostalgify</h1>
                <p>
                    Go down memory lane by seeing your most listened songs by year and season.
                </p>
            </div>

            <a className="loginButton" href={authLink}>
                LOG IN WITH SPOTIFY
            </a>
        </div>
        <Footer/>
    </>
}