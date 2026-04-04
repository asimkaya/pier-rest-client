/* @refresh reload */
import { render } from "solid-js/web";
import App from "./app";
import "./styles/globals.css";

const root = document.getElementById("root");

render(() => <App />, root!);
