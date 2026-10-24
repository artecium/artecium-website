import Script from "next/script";

const documentLangScript = `(function(){var p=window.location.pathname;var l=(p==='/en'||p.indexOf('/en/')===0)?'en':'pt-PT';document.documentElement.lang=l;})();`;

export function DocumentLangScript() {
  return (
    <Script id="document-lang" strategy="beforeInteractive">
      {documentLangScript}
    </Script>
  );
}
