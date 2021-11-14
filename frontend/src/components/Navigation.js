import { Link } from 'react-router-dom';

function Navigation(props) {

    return <div>
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <Link to="/wallet" className="nav-link">Wallet</Link>
            <Link to="/tokenWatchlist" className="nav-link">Token Watchlist</Link>
        </nav>
    </div>;
}

export default Navigation;