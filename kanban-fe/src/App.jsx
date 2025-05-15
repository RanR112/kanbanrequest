import { useState } from "react";
import LoginForm from "./components/LoginForm";
import RequestForm from "./components/RequestForm";
import ApprovalList from "./components/ApprovalList";
import ApprovedList from "./components/ApprovedList";
import StaffInbox from "./components/StaffInbox";
import "./sass/App.css"
import ClosureList from "./components/ClosureList";

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(
        !!localStorage.getItem("token")
    );

    const handleLogout = () => {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
    };

    if (!isLoggedIn) return <LoginForm onLogin={() => setIsLoggedIn(true)} />;

    return (
        <div className="App">
            <button onClick={handleLogout}>Logout</button>
            <RequestForm />
            <hr />
            <ApprovalList />
            <hr />
            <ApprovedList />
            <hr />
            <StaffInbox />
            <hr />
            <ClosureList />
        </div>
    );
}

export default App;
