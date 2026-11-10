(()=>{const C=window.CY,Y=["def","jp","cn","kr","eu"],d=document.documentElement;
C.names={def:"默认小院",jp:"日式庭院",cn:"中式小院",kr:"韩式小院",eu:"欧式小院"};
C.root=new URL(C.p||"./",location.href).href;
C.url=k=>C.root+(k==="def"?"":k+"/");
let q="";try{q=new URLSearchParams(location.search).get("yard")||decodeURIComponent(location.hash.slice(1))}catch{}
let y=Y.includes(q)?q:C.yard;
if(!y){let s=null;try{s=localStorage.getItem("cyStyle")}catch{}y=Y.includes(s)?s:"def"}
try{localStorage.setItem("cyStyle",y)}catch{}
C.cur=y;d.dataset.yard=y;
/* The address bar is only rewritten to the canonical yard URL once the app has loaded:
   relative asset URLs further down this document must still resolve against the original one. */
C.canon=C.url(y);try{const st=history.state;history.replaceState({cy:y,i:st&&typeof st.i=="number"?st.i:0},"")}catch{}
const h=new Date().getHours();if(h<6||h>=19)d.classList.add("ldn");
C.ld=()=>{const l=document.getElementById("ld");if(!l)return;l.querySelector(".bg").style.backgroundImage="url("+C.root+C.th[y]+")";l.querySelector(".nm").textContent=C.names[y]};
})();
