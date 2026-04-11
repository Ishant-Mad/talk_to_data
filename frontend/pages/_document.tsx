import { Head, Html, Main, NextScript } from "next/document";
import { THEME_STORAGE_KEY } from "../context/ThemeContext";

const THEME_BOOT = `(function(){try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="light")document.documentElement.setAttribute("data-theme","light");}catch(e){}})();`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
