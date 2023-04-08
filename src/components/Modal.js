import React, {useState} from "react";
import "./Modal.css";
import Modal from "react-overlays/Modal";

export default function InfoModal({modalText, divClass, divText}) {
    const [showModal, setShowModal] = useState(false);

    const renderBackdrop = (props) => <div className="backdrop" {...props} />;

    let handleClose = () => setShowModal(false);

    return (
        <div className={divClass}>
            <div onClick={() => setShowModal(true)}>
                {divText}
            </div>

            <Modal
                className="modal"
                show={showModal}
                onHide={handleClose}
                renderBackdrop={renderBackdrop}
                onBackdropClick={handleClose}
            >
                <div>
                    <div className="modal-header">
                        <div className="modal-title">{divText}</div>
                        <div>
                              <span className="close-button" onClick={handleClose}>
                                X
                              </span>
                        </div>
                    </div>
                    <div className="modal-desc">
                        <p>{modalText}</p>
                    </div>
                </div>
            </Modal>
        </div>
    );
}