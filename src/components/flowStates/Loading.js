import "./flowStates.scss";


export default function Loading() {
    return (
        <div className="parent">
            <div className='container'>
                <svg height="200" width="200">
                    <circle className='ring' cx="100" cy="102" r="70" stroke="#c6c6c6" fill="none"
                            strokeLinecap="round"/>
                    <circle className='ring' cx="100" cy="102" r="70" stroke="#c6c6c6" fill="none" strokeLinecap="round"
                            filter="url(#blurMe)"/>
                </svg>

            </div>
        </div>);
}
