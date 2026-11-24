import { LOCALE_COOKIE } from "@/i18n/config";
import Script from "next/script";

/** Runs beforeInteractive — keep in sync with `src/i18n/request.ts` locale priority. */
const documentLangScript = `(function(){
  var p=window.location.pathname;
  var lang;
  if(p==='/en'||p.indexOf('/en/')===0){
    lang='en';
  }else{
    var raw='';
    var prefix='${LOCALE_COOKIE}=';
    var parts=document.cookie?document.cookie.split('; '):[];
    for(var i=0;i<parts.length;i++){
      if(parts[i].indexOf(prefix)===0){
        raw=parts[i].slice(prefix.length);
        break;
      }
    }
    try{raw=decodeURIComponent(raw.replace(/\\+/g,' '));}catch(e){}
    lang=raw==='en'?'en':'pt-PT';
  }
  document.documentElement.lang=lang;
})();`;

export function DocumentLangScript() {
  return (
    <Script id="document-lang" strategy="beforeInteractive">
      {documentLangScript}
    </Script>
  );
}
