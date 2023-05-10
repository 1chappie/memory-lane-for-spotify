import "./TrackCard.css";
import moment from "moment";
export default function TrackCard({track}){
    let d = moment(track.addedAt);
    return(
        <div className={"cardContainer"} onClick={()=>{
            window.open(track.play, "_self")
        }}>
            <div className={"albumArt"} style={{backgroundImage: `url(${track.image})`}}/>
            <div className={"trackInfo"}>
                <h3 className={"text"}>{track.name}</h3>
                <p className={"text"}>{track.artist}</p>
            </div>
            <div className={"albumInfo"}>
                <p className={"text"}>{track.album}</p>
            </div>
            <div className={"addedAt"}>
                <p className={"text"}>{`${ d.format("MMM D, YYYY")}`}</p>
            </div>
        </div>
    )
}