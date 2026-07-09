import { useEffect } from "react";
import { FaTimes, FaDownload } from "react-icons/fa";
import "../styles/imageViewer.css";

function ImageViewer({ image, onClose }) {

    useEffect(() => {

        const handleEsc = (e) => {

            if (e.key === "Escape") {
                onClose();
            }

        };

        window.addEventListener("keydown", handleEsc);

        return () => {
            window.removeEventListener("keydown", handleEsc);
        };

    }, []);

    if (!image) return null;

    return (

        <div
            className="viewer-overlay"
            onClick={onClose}
        >

            <div
                className="viewer-content"
                onClick={(e) => e.stopPropagation()}
            >

                <button
                    className="viewer-close"
                    onClick={onClose}
                >
                    <FaTimes />
                </button>

                <a
                    href={image}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="viewer-download"
                >
                    <FaDownload />
                </a>

                <img
                    src={image}
                    alt=""
                    className="viewer-image"
                />

            </div>

        </div>

    );

}

export default ImageViewer;