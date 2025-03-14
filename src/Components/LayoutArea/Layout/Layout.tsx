import { Header } from "../Header/Header";
import { Routing } from "../Routing/Routing";
import "./Layout.css";

export function Layout(): JSX.Element {
    return (
        <div className="Layout">
            {/* <aside> */}
                {/* <Menu /> */}
            {/* </aside> */}
            {/* <hr /> */}
            <header>
                <Header />
            </header>
            <main>
                <Routing />
            </main>
        </div>
    );
}
