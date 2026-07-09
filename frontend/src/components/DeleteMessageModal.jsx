import "../styles/DeleteMessageModal.css";

function DeleteMessageModal({

    open,

    onClose,

    onDeleteMe,

    onDeleteEveryone,

    isSender,

}) {

    if (!open) return null;

    return (

        <div
            className="delete-overlay"
            onClick={onClose}
        >

            <div
                className="delete-modal"
                onClick={(e)=>e.stopPropagation()}
            >

                <h3>Delete Message</h3>

                <p>
                    Choose an option
                </p>

                <button
                    className="delete-me"
                    onClick={onDeleteMe}
                >
                    Delete For Me
                </button>

                {isSender && (

                    <button
                        className="delete-all"
                        onClick={onDeleteEveryone}
                    >
                        Delete For Everyone
                    </button>

                )}

                <button
                    className="cancel-btn"
                    onClick={onClose}
                >
                    Cancel
                </button>

            </div>

        </div>

    );

}

export default DeleteMessageModal;