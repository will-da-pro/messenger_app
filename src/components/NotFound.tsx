import '../styles/NotFound.css'
import {useNavigate} from "react-router-dom";

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="not-found">
            <h1>Error 404!</h1>
            <h2>Page not found.</h2>
            <button onClick={() => navigate("/dashboard/")}>
                Back
            </button>
        </div>
    )
}

export default NotFound