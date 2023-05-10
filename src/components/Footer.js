import InfoModal from "./Modal";
import "./Footer.css";
import {flow, token} from "../api/Auth";

function openLink(link) {
    window.open(link, "_blank");
}

function Logout() {
    return (
        <div className={"logoutButton"} onClick={
            () => {
                token.clear();
                window.location.reload();
            }}>
            Log out
        </div>
    )
}

export default function Footer() {
    return (<div className="footerContainer">
            {token.get() && <Logout/>}
            <div className="footerBar">
                <div className="footerItem">
                    Made by Ștefan Tănăsescu
                </div>
                <div onClick={() => openLink("https://github.com/1chappie/nostalgify")} className="footerItem clickable">
                    View on GitHub
                </div>
                <InfoModal
                    modalText={
                        <div>
                            Nostalgify is an open source application powered by the Spotify Web API.
                            By using this application, you agree with the use of your account username, song library,
                            top
                            tracks,
                            as well as giving Nostalgify permission to create playlists on your account at your request.
                            None of the data is stored, collected or shared with any third parties.
                            You may revoke Nostalgify's access at any time by
                            <a href="https://support.spotify.com/us/article/spotify-on-other-apps/"
                               target="_blank"> removing the application from your Spotify account</a>.
                        </div>}
                    divClass={"footerItem clickable"}
                    divText={"Privacy Policy"}
                />
                <InfoModal
                    modalText={
                        <div>
                            <p>
                                You can mail me at <a
                                href="mailto:tanasescu@protonmail.com">tanasescu@protonmail.com</a>,
                                or <a href="https://www.linkedin.com/in/stefan.tanasescu" target="_blank">message me on
                                LinkedIn</a>.
                            </p>
                            <p>
                                Check out my other projects on <a href="https://1chappie.com"
                                                                  target="_blank">1chappie.com</a> or
                                on <a href="https://www.github.com/1chappie" target="_blank">GitHub</a>.
                            </p>
                        </div>}
                    divClass={"footerItem clickable"}
                    divText={"Contact"}
                />
            </div>
        </div>
    )
}