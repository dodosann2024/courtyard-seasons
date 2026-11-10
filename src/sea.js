/* 空中海洋 · Sky Ocean — loaded on demand by app.js. Shares the app's renderer, sky, lights,
   seasons and weather; everything here lives on camera layer 2, which the camera only
   enables while the sea is shown, so the yards never see any of it. */
(()=>{
window.__seaInit=getX=>{
const X=getX(),T=X.T,{Jt,De,Cn,Ta,Ue,Ct,qt,jt,pi,dc}=X,MOB=!!X.kn;
const V3=T.V3,C3=T.Color,TAU=Math.PI*2,R=9,G=1.4,L2=4;
let sd=20261110;const rnd=()=>{sd|=0;sd=sd+0x6D2B79F5|0;let t=Math.imul(sd^sd>>>15,1|sd);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const rr=(a,b)=>a+(b-a)*rnd(),cl=(x,a,b)=>x<a?a:x>b?b:x;
const ss=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const ease=(k,dt)=>1-Math.exp(-dt*k);
const root=new T.Group();root.visible=false;Jt.add(root);
const onSea=o=>{o.traverse(c=>{c.layers.mask=1|L2})};

/* ---------------- textures ---------------- */
function canvas(w,h,f){const c=document.createElement("canvas");c.width=w;c.height=h;f(c.getContext("2d"),w,h);return c}
function dataTex(c){const t=new T.CTex(c);t.colorSpace="";t.wrapS=t.wrapT=1000;t.anisotropy=MOB?4:8;return t}
function srgbTex(c,rep){const t=new T.CTex(c);t.colorSpace="srgb";t.wrapS=t.wrapT=1000;t.anisotropy=MOB?4:8;rep&&t.repeat.set(rep[0],rep[1]);return t}
/* tileable ripple normals: integer wave numbers keep every component periodic on the tile */
function mkNormal(S){const comps=[];for(let i=0;i<30;i++){let fx,fy;do{fx=Math.round(rr(-15,15));fy=Math.round(rr(-15,15))}while(fx*fx+fy*fy<5);const f=Math.hypot(fx,fy);comps.push([fx,fy,Math.pow(f,-1.3),rnd()*TAU])}
 const gx=new Float32Array(S*S),gy=new Float32Array(S*S);
 for(const[fx,fy,a,ph]of comps){const ca=new Float32Array(S),sa=new Float32Array(S),cb=new Float32Array(S),sb=new Float32Array(S);
  for(let i=0;i<S;i++){const A=TAU*fx*i/S+ph,B=TAU*fy*i/S;ca[i]=Math.cos(A);sa[i]=Math.sin(A);cb[i]=Math.cos(B);sb[i]=Math.sin(B)}
  const kx=a*fx,ky=a*fy;for(let y=0;y<S;y++)for(let x=0;x<S;x++){const c=ca[x]*cb[y]-sa[x]*sb[y],j=y*S+x;gx[j]+=kx*c;gy[j]+=ky*c}}
 let m=0;for(let j=0;j<S*S;j++)m=Math.max(m,Math.abs(gx[j]),Math.abs(gy[j]));const k=1.15/m;
 return canvas(S,S,(g,w,h)=>{const im=g.createImageData(w,h),d=im.data;for(let j=0;j<S*S;j++){let nx=-gx[j]*k,ny=-gy[j]*k,nz=1;const l=Math.hypot(nx,ny,nz);d[j*4]=(nx/l*.5+.5)*255;d[j*4+1]=(ny/l*.5+.5)*255;d[j*4+2]=(nz/l*.5+.5)*255;d[j*4+3]=255}g.putImageData(im,0,0)})}
/* R: streaky foam (warped, wind-stretched noise with lacy holes; no cells), G: soft fbm */
function mkFoam(S){const L=[8,16,32].map(n=>{const a=new Float32Array(n*n);for(let i=0;i<n*n;i++)a[i]=rnd();return{n,m:n,a}});
 const lat=(n,m)=>{const a=new Float32Array(n*m);for(let i=0;i<n*m;i++)a[i]=rnd();return{n,m,a}};
 const vn=(o,x,y)=>{const n=o.n,m=o.m,X=x*n,Y=y*m,i=Math.floor(X),j=Math.floor(Y),fx=X-i,fy=Y-j,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),A=(a,b)=>o.a[((b%m+m)%m)*n+((a%n+n)%n)];return(A(i,j)*(1-u)+A(i+1,j)*u)*(1-v)+(A(i,j+1)*(1-u)+A(i+1,j+1)*u)*v};
 const W=[lat(4,4),lat(8,8),lat(4,4)],B=[lat(6,6),lat(12,12),lat(24,24),lat(48,48)],SK=[lat(5,40),lat(10,80),lat(20,150)],HO=[lat(40,40),lat(72,72)],GR=lat(128,128);
 return canvas(S,S,(g,w,h)=>{const im=g.createImageData(w,h),d=im.data;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const px=x/w,py=y/h;
  const wx=vn(W[0],px,py)*.7+vn(W[1],px,py)*.3-.5,wy=vn(W[2],px+.5,py+.2)*.7+vn(W[1],px+.3,py+.6)*.3-.5,qx=px+wx*.22,qy=py+wy*.22;
  const blob=vn(B[0],qx,qy)*.42+vn(B[1],qx,qy)*.28+vn(B[2],qx,qy)*.18+vn(B[3],qx,qy)*.12;
  const sk=vn(SK[0],qx,qy+wx*.05)*.5+vn(SK[1],qx,qy)*.32+vn(SK[2],qx,qy)*.18;
  const hol=ss(.6,.78,vn(HO[0],qx,qy))*.6+ss(.62,.8,vn(HO[1],qx+.3,qy))*.4;
  const fb=vn(L[0],px,py)*.5+vn(L[1],px,py)*.32+vn(L[2],px,py)*.18,fb2=vn(L[1],px+.37,py+.71)*.55+vn(L[2],px+.13,py+.29)*.45;
  const j=(y*w+x)*4;d[j]=cl((blob-.5)*2.3+.5+(sk-.5)*1.1-hol*.45+(vn(GR,qx,qy)-.5)*.3,0,1)*255;d[j+1]=fb2*255;d[j+2]=fb*255;d[j+3]=255}g.putImageData(im,0,0)})}
const tN=dataTex(mkNormal(MOB?256:512)),tF=dataTex(mkFoam(256));
const tDot=srgbTex(canvas(64,64,(g)=>{const r=g.createRadialGradient(32,32,0,32,32,31);r.addColorStop(0,"rgba(255,255,255,1)");r.addColorStop(.4,"rgba(255,255,255,.6)");r.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=r;g.fillRect(0,0,64,64)}));
const tPuff=srgbTex(canvas(128,128,(g)=>{for(let i=0;i<14;i++){const x=rr(34,94),y=rr(34,94),s=rr(16,30),r=g.createRadialGradient(x,y,0,x,y,s);r.addColorStop(0,"rgba(255,255,255,.34)");r.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=r;g.fillRect(0,0,128,128)}}));

/* ---------------- waves (GPU and CPU share the exact same model) ---------------- */
const WV=[[9.2,0,.15],[6.1,.47,.105],[4.0,-.36,.072],[2.65,.84,.046],[1.72,-.68,.03],[1.12,.27,.019],[.76,-1.12,.012]];
const NW=WV.length,a0=Math.atan2(.8,2.6);
const W={k:[],dx:[],dz:[],w:[],A0:[],A:new Float32Array(NW),Q:new Float32Array(NW),P:new Float32Array(NW),ph:[]};
WV.forEach(([L,d,A])=>{const k=TAU/L,a=a0+d;W.k.push(k);W.dx.push(Math.cos(a));W.dz.push(Math.sin(a));W.w.push(Math.sqrt(G*k));W.A0.push(A);W.ph.push(rnd()*TAU)});
const uWK={value:W.k.map((k,i)=>new V3(W.dx[i],W.dz[i],k))},uWA={value:W.A},uWQ={value:W.Q},uWP={value:W.P};
const WO={x:0,y:0,z:0,nx:0,ny:1,nz:0};
function wv(x0,z0,o){const r=Math.hypot(x0,z0),att=1-.62*ss(R-2.2,R-.15,r),hat=1-ss(R-1.2,R-.05,r);let px=x0,py=0,pz=z0,nx=0,ny=1,nz=0;
 for(let i=0;i<NW;i++){const k=W.k[i],A=W.A[i]*att,Q=W.Q[i],dx=W.dx[i],dz=W.dz[i],th=k*(dx*x0+dz*z0)+W.P[i],s=Math.sin(th),c=Math.cos(th),wa=k*A;
  px+=Q*A*dx*c*hat;pz+=Q*A*dz*c*hat;py+=A*s;nx-=dx*wa*c;nz-=dz*wa*c;ny-=Q*wa*s}
 const lp=ss(R-.6,R,r);py=py*(1-lp)-.13*lp*lp;o.x=px;o.y=py;o.z=pz;o.nx=nx;o.ny=ny;o.nz=nz;return o}
/* height of the displaced surface above world (x,z): undo the horizontal Gerstner shift */
function hAt(x,z,o=WO){let ax=x,az=z;for(let k=0;k<3;k++){wv(ax,az,o);ax+=x-o.x;az+=z-o.z}return wv(ax,az,o)}
const WGL=`#define NW ${NW}
uniform vec3 uWK[NW];uniform float uWA[NW],uWQ[NW],uWP[NW];
void waves(vec2 x0,out vec3 p,out vec3 n,out float J){float r=length(x0);float att=1.-.62*smoothstep(${R-2.2},${R-.15},r),hat=1.-smoothstep(${R-1.2},${R-.05},r);
 p=vec3(x0.x,0.,x0.y);n=vec3(0.,1.,0.);float jx=1.,jz=1.,jc=0.;
 for(int i=0;i<NW;i++){vec3 K=uWK[i];float A=uWA[i]*att,Q=uWQ[i];float th=K.z*dot(K.xy,x0)+uWP[i];float s=sin(th),c=cos(th),wa=K.z*A;
  p.x+=Q*A*K.x*c*hat;p.z+=Q*A*K.y*c*hat;p.y+=A*s;n.x-=K.x*wa*c;n.z-=K.y*wa*c;n.y-=Q*wa*s;jx-=Q*wa*K.x*K.x*s;jz-=Q*wa*K.y*K.y*s;jc-=Q*wa*K.x*K.y*s;}
 float t=clamp((r-${R-.6})/.6,0.,1.),lp=t*t*(3.-2.*t);p.y=p.y*(1.-lp)-.13*lp*lp;
 n=mix(n,vec3(0.,1.,0.),lp);n.xz+=x0/max(r,1e-3)*(.26*lp*6.*t*(1.-t)/.6);J=mix(jx*jz-jc*jc,1.,lp);}`;

/* ---------------- shared lighting uniforms ---------------- */
const U={uT:{value:0},uFlow:{value:new T.V2()},uDeep:{value:new C3("#07357f")},uScat:{value:new C3("#35e2d6")},uShal:{value:new C3("#12c2cc")},uSlick:{value:new T.V4(0,0,-99,0)},uSlickH:{value:new T.V4(1,0,0,0)},uSpot:{value:[...Array(6)].map(()=>new T.V4(0,0,-99,0))},
 uAmb:{value:new C3()},uKey:{value:new C3()},uKeyDir:{value:new V3(0,1,0)},uFogC:{value:new C3()},uFogN:{value:30},uFogF:{value:90},uHaze:{value:.02},
 uRain:{value:0},uDet:{value:1},uWhite:{value:0},uGlit:{value:1},uHI:{value:2},uLanP:{value:new V3()},uLanC:{value:new C3(0,0,0)},uPatch:{value:new T.V4(0,0,-99,0)},uBio:{value:0},uIce:{value:0},
 uRing:{value:[...Array(16)].map(()=>new T.V4(0,0,-99,0))},uTur:{value:new T.V4(0,0,0,0)},uWh0:{value:new T.V4()},uWh1:{value:new T.V4()},uKel:{value:new T.V4(0,0,1,0)},uKelS:{value:0},uTurF:{value:new T.V4()},uRingOn:{value:0},uSunCol:{value:new C3()},uMoonC:{value:new C3()},tN:{value:tN},tF:{value:tF}};
const SKY={uTop:jt.top,uBot:jt.bot,uSunDir:jt.sunDir,uSunVis:jt.uSunVis,uMoonDir:jt.moonDir,uMoonVis:jt.uMoonVis,uNight:jt.uNight,uCover:jt.uCover,uDark:jt.uDark,uFlash:jt.flash};
const FOG=`float fogMix(float d){return clamp(max(smoothstep(uFogN,uFogF,d),1.-exp(-max(d-50.,0.)*uHaze)),0.,1.);}`;
/* the water body is the lower half of an oblate ellipsoid (radius R, depth BD), clear down to YW; a sand dish fills it below */
const BD=6,YW=-3.7,RS=R*Math.sqrt(1-YW*YW/(BD*BD)),YS0=-4.75,ySand=r=>YS0+(YW-YS0)*Math.min(1,(r/RS)**2),rWall=y=>R*Math.sqrt(Math.max(0,1-y*y/(BD*BD)));
/* distance a view ray travels in the water, its colour and the caustic net (needs tF, uShal, uAmb, uKey, uKeyDir) */
const AQG=`float aqEnter(vec3 ro,vec3 rd){vec3 s=vec3(1.,${(R/BD).toFixed(4)},1.),o=ro*s,d=rd*s;float a=dot(d,d),b=dot(o,d),c=dot(o,o)-${(R*R).toFixed(3)};float h=b*b-a*c;if(h<0.)return 9.;h=sqrt(h);
 float t0=(-b-h)/a,t1=(-b+h)/a;if(t1<0.)return 9.;float te=max(t0,0.);if(ro.y>0.){if(rd.y>=0.)return 9.;te=max(te,-ro.y/rd.y);}return te>t1?9.:te;}
/* seen from far off the bowl must read as a body of deep blue-teal water, not a clear glass */
float aqFar(){return smoothstep(14.,40.,length(cameraPosition));}
vec3 aqLight(float dep){float f=aqFar();vec3 w=mix(uShal,mix(uShal,uDeep,.55)*1.25,f);return w*(uAmb*.8+uKey*max(uKeyDir.y,0.)*.6)*.3183*exp(-dep*vec3(.22,.1,.075))*1.15;}
vec3 aqFogK(vec3 col,vec3 P,float k){vec3 rd=P-cameraPosition;float te=aqEnter(cameraPosition,rd);if(te>=1.)return col;float dw=(1.-te)*length(rd)*mix(k,1.5,aqFar());vec3 Tr=exp(-dw*vec3(.14,.05,.036));
 return col*Tr+aqLight(max(-P.y,0.)*.55+dw*.035)*(1.-Tr);}
vec3 aqFog(vec3 col,vec3 P){return aqFogK(col,P,1.);}
float caus(vec2 p,float t){float a=texture2D(tF,p*.21+t*vec2(.012,.007)).g,b=texture2D(tF,p*.29-t*vec2(.009,.014)+.37).g;return pow(1.-clamp(abs(a-b)*4.5,0.,1.),5.);}`;

/* ---------------- sea surface ---------------- */
function seaGeo(nr,na){const pos=[0,0,0],idx=[];for(let j=1;j<=nr;j++){const r=R*j/nr;for(let i=0;i<na;i++){const a=i/na*TAU;pos.push(r*Math.cos(a),0,r*Math.sin(a))}}
 for(let i=0;i<na;i++)idx.push(0,1+(i+1)%na,1+i);
 for(let j=1;j<nr;j++){const a0=1+(j-1)*na,b0=1+j*na;for(let i=0;i<na;i++){const i2=(i+1)%na;idx.push(a0+i,a0+i2,b0+i,a0+i2,b0+i2,b0+i)}}
 const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setIndex(idx);return g}
const seaMat=new T.SM({uniforms:{...U,...SKY,uWK,uWA,uWQ,uWP},side:2,
 vertexShader:WGL+`varying vec3 vW,vN;varying float vJ;varying vec2 vX;void main(){vec3 p,n;float J;waves(position.xz,p,n,J);vW=p;vN=n;vJ=J;vX=position.xz;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}`,
 fragmentShader:`uniform sampler2D tN,tF;uniform float uKelS,uT,uRingOn,uRain,uDet,uWhite,uGlit,uHI,uFogN,uFogF,uHaze,uSunVis,uMoonVis,uNight,uCover,uDark,uFlash,uBio,uIce;
uniform vec4 uPatch,uSlick,uSlickH,uSpot[6],uTur,uTurF,uKel,uWh0,uWh1;uniform vec2 uFlow;uniform vec3 uShal,uDeep,uScat,uAmb,uKey,uKeyDir,uFogC,uTop,uBot,uSunDir,uSunCol,uMoonDir,uMoonC,uLanP,uLanC;uniform vec4 uRing[16];
varying vec3 vW,vN;varying float vJ;varying vec2 vX;
float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float specks(vec2 g,float t){float b=0.;for(int k=0;k<2;k++){float sc=k==0?23.:37.;vec2 q=g*sc+float(k)*13.7;vec2 c=floor(q),f=fract(q);float h=hs(c);
 vec2 o=vec2(hs(c+3.1),hs(c+7.7))*.7+.15;vec2 dd=f-o;float tw=.5+.5*sin(t*(1.6+2.4*h)+h*40.);b+=step(.48,h)*exp(-dot(dd,dd)*(70.+50.*h))*tw*tw*(k==0?1.:.75);}return b;}
${FOG}${AQG}
vec2 rainN(vec2 p){vec2 g=vec2(0.);for(int L=0;L<2;L++){float sc=L==0?2.7:3.9;vec2 q=p*sc+float(L)*7.31;vec2 c=floor(q),f=fract(q)-.5;float h=hs(c+float(L)*3.1);
 if(h<uRain*.92){vec2 o=(vec2(hs(c+1.7),hs(c+4.3))-.5)*.4;float ph=fract(uT*(.85+.5*hs(c+9.1))+h*7.);vec2 d=f-o;float r=length(d);float x=(r-ph*.4)*30.;
 g+=d/max(r,1e-3)*sin(x*1.4)*exp(-x*x*.08)*(1.-ph)*(1.-ph)*.8;}}return g;}
vec2 ringN(vec2 p){vec2 g=vec2(0.);for(int i=0;i<16;i++){vec4 Q=uRing[i];float a=uT-Q.z;if(a<0.||a>2.6||Q.w<=0.)continue;vec2 d=p-Q.xy;float r=length(d);float x=(r-a*.62)*20.;if(abs(x)>10.)continue;
 g+=d/max(r,1e-3)*sin(x*1.7)*exp(-x*x*.05)*Q.w*exp(-a*1.4)*smoothstep(0.,.12,a);}return g;}
float tcap(vec2 p,vec2 a,vec2 b,float r0,float r1){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h)-mix(r0,r1,h);}
vec3 skyC(vec3 d){float t=pow(clamp(d.y*2.4+.04,0.,1.),.6);vec3 c=mix(uBot,uTop,t);
 vec3 cc=mix(mix(vec3(.6,.63,.68),vec3(.09,.1,.13),uNight),vec3(.19,.2,.23)*(1.-.6*uNight),uDark);c=mix(c,cc,uCover*.5*(.55+.45*t));
 float s=max(dot(d,normalize(vec3(uSunDir.x,max(uSunDir.y,.06),uSunDir.z))),0.);c+=uSunCol*uSunVis*(pow(s,6.)*.22+pow(s,48.)*.55);c+=uFlash*vec3(.5,.55,.7);return c;}
void main(){vec3 E=cameraPosition-vW;float dist=length(E);vec3 V=E/dist;float lod=exp(-dist*.03);vec2 fx=vX+uFlow;
 vec3 n1=texture2D(tN,fx*.2+uT*vec2(.013,.007)).xyz*2.-1.,n2=texture2D(tN,fx*.53+uT*vec2(-.019,.012)).xyz*2.-1.,n3=texture2D(tN,fx*1.57+uT*vec2(.031,-.023)).xyz*2.-1.;
 vec2 det=(n1.xy*.26+n2.xy*.42*lod+n3.xy*.3*lod)*uDet;
 if(uRain>.002)det+=rainN(vW.xz)*uRain*lod*.9+n3.xy*uRain*.3*lod;if(uRingOn>0.)det+=ringN(vW.xz);
 /* Kelvin wake, fixed to the ship: feathered divergent crests along the two 19.5 degree arms, transverse crests between them */
 float kel=0.;if(uKelS>.01){vec2 d=vW.xz-uKel.xy,f=uKel.zw,sd=vec2(-f.y,f.x);float a=-dot(d,f),l=dot(d,sd),la=abs(l);
  if(a>-.5&&a<26.){float arm=max(a,0.)*.354,w=.05+.02*max(a,0.);float cu=exp(-pow((la-arm)/w,2.))*smoothstep(-.4,.5,a)*exp(-a*.035);
   /* the arm foam is a broken line: torn into patches along its length, with a fainter echelon just inside */
   float brk=smoothstep(.38,.62,texture2D(tF,vec2(a*.42,la*.9)+uT*vec2(.004,.002)).g);cu=cu*(.35+.9*brk)+exp(-pow((la-arm*.9+.08)/(w*.6),2.))*smoothstep(1.,2.5,a)*exp(-a*.09)*.45*brk;
   float ins=smoothstep(arm+.05,arm-.6,la)*smoothstep(.4,1.6,a)*exp(-a*.11);vec2 gd=-f*.6+sd*sign(l)*.8;
   float kp=sin((a*.6+la*.8)*8.);det+=(gd*kp*cu*.55+f*sin(a*4.3)*ins*.3)*uKelS;kel=cu*uKelS*(.3+.7*smoothstep(-.2,.8,kp));}}
 /* footprint of a diving whale: a smooth, glassy slick that spreads and fades */
 /* an uneven oval a little wider than the flukes, stretched along the whale's track */
 float slk=0.,slr=0.;{float sa=uT-uSlick.z;if(sa>0.&&sa<22.){vec2 dv=vW.xz-uSlick.xy,q=vec2(dot(dv,uSlickH.xy),dot(dv,vec2(-uSlickH.y,uSlickH.x)));float r=.44+.09*sqrt(sa),an=atan(q.y,q.x)+uSlickH.z;
  float nz=texture2D(tF,vW.xz*.45+uSlickH.z).g,nw=texture2D(tF,vW.xz*1.1-uSlickH.z).r,d=length(q/vec2(r*1.45,r*.78))*(1.+.07*sin(an*3.)+.07*sin(an*5.+1.7)+.05*sin(an*2.+.6)-.1*q.x/(r*1.45))+(nz-.5)*.42+(nw-.5)*.14;
  slk=(1.-smoothstep(.56,1.08,d))*uSlick.w*exp(-sa*.05)*smoothstep(0.,.8,sa)*(1.-smoothstep(14.,22.,sa));
  /* a thin, broken lip of foam that drifts apart and dissolves over a few seconds */
  float nb=texture2D(tF,vW.xz*2.4+.4+sa*vec2(.03,-.02)).r,nc=texture2D(tF,vW.xz*.9-.2).g,th=.41+.045*sa,fr=1.-smoothstep(.8,3.2,sa);
  slr=min(1.,smoothstep(.17+.04*fr,0.,abs(d-.98))*smoothstep(th+.03,th+.27,nb*.65+nc*.35+.1)*uSlick.w*smoothstep(0.,.35,sa)*(1.-smoothstep(3.5,7.5,sa))*(.85+.22*fr));}}
 det*=1.-.98*slk;
 vec3 N=normalize(mix(normalize(vN),vec3(0.,1.,0.),.85*slk));float lp=smoothstep(${R-.7},${R.toFixed(2)},length(vX));
 /* seen from inside the aquarium: the bright, rippling underside of the surface */
 if(!gl_FrontFacing){vec3 c=aqLight(.2)*1.6+uShal*(uAmb+uKey)*.3183*.22*smoothstep(.35,.9,n1.x*.5+.5+det.x)+uSunCol*uSunVis*caus(vW.xz,uT)*.22;c=aqFog(c,vW-vec3(0.,.04,0.));c=mix(c,uFogC,fogMix(dist));gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 return;}
 vec3 Nf=normalize(N+vec3(det.x,0.,det.y)*(.58-lp*.3)),Ng=normalize(N+vec3(det.x*1.6+n3.x*.55*lod,0.,det.y*1.6+n3.y*.55*lod)*(1.-.97*slk));
 float NV=max(dot(Nf,V),0.),F=(.02+.98*pow(1.-NV,5.))*.82*mix(1.,.5,smoothstep(18.,50.,dist));F=mix(F,min(1.,F*1.45+.03),slk);F=mix(F,min(.95,F*2.+.22),slk*smoothstep(.75,.15,NV));vec3 Rf=reflect(-V,Nf);Rf.y=abs(Rf.y);vec3 Rg=reflect(-V,Ng);
 vec3 sky=skyC(Rf)*vec3(.74,.87,1.)*.9;vec3 Ls=normalize(vec3(uSunDir.x,max(uSunDir.y,.06),uSunDir.z));
 float hr=clamp(vW.y*uHI+.5,0.,1.),sss=pow(clamp(dot(V,-uKeyDir)*.6+.4,0.,1.),3.)*hr*hr;
 vec3 key=uKey*max(uKeyDir.y,0.);
 /* sapphire over the deep middle, clear turquoise toward the shallow rim, a soft glow through the crests */
 float shl=smoothstep(${(R*.28).toFixed(2)},${(R-.25).toFixed(2)},length(vX));vec3 base=mix(uDeep,uShal,shl*shl*.9);
 vec3 aW=mix(uAmb,vec3(dot(uAmb,vec3(.3,.59,.11))),.65),kW=mix(key,vec3(dot(key,vec3(.3,.59,.11))),.65),uKW=mix(uKey,vec3(dot(uKey,vec3(.3,.59,.11))),.65);
 vec3 body=base*(aW*.9+kW*.6)*.3183*1.3+uScat*(uKW*sss*.42+aW*hr*.07+(aW*.14+kW*.12)*lp)+uScat*kW*.3183*hr*hr*.14;
 /* a turtle resting just under the surface to breathe: shell and flippers seen through a thin layer of water */
 if(uTur.w>.005){vec2 d=vW.xz-uTur.xy+det*.025;float ch=cos(uTur.z),sh=sin(uTur.z);vec2 q=vec2(d.x*ch+d.y*sh,-d.x*sh+d.y*ch)/.7;
  float e=length(q/vec2(q.x>0.?.46:.5,.37)),ms=1.-smoothstep(.9,1.,e);float b=uTurF.x,L=.56*uTurF.y,fd=9.;
  for(int i=0;i<2;i++){float s=i==0?1.:-1.;vec2 a=vec2(.24,.29*s);fd=min(fd,tcap(q,a,a+vec2(-sin(b),s*cos(b))*L,.075,.02));a=vec2(-.37,.2*s);fd=min(fd,tcap(q,a,a+vec2(-.75,.66*s)*.2,.05,.02));}
  fd=min(fd,tcap(q,vec2(.36,0.),vec2(.66,0.),.065,.055));float mf=1.-smoothstep(0.,.025,fd),nt=texture2D(tF,q*1.4+.2).g,nm=texture2D(tF,q*3.1).r;
  vec2 S[13];S[0]=vec2(.31,0.);S[1]=vec2(.15,0.);S[2]=vec2(-.01,0.);S[3]=vec2(-.17,0.);S[4]=vec2(-.32,0.);S[5]=vec2(.23,.19);S[6]=vec2(.07,.21);S[7]=vec2(-.09,.2);S[8]=vec2(-.25,.16);
  S[9]=vec2(.23,-.19);S[10]=vec2(.07,-.21);S[11]=vec2(-.09,-.2);S[12]=vec2(-.25,-.16);float d1=9.,d2=9.,id=0.;vec2 cc=vec2(0.);for(int i=0;i<13;i++){float dd=length(q-S[i]);if(dd<d1){d2=d1;d1=dd;id=float(i);cc=S[i];}else if(dd<d2)d2=dd;}
  float hid=fract(sin(id*12.9+3.)*437.5),eg=(d2-d1)*.5;if(e>.84){eg=min(eg,(e-.84)*.3);cc=q/e*.92;hid=fract(sin(floor(atan(q.y,q.x)*4.1)*7.3)*437.5);}
  /* olive-brown scutes with amber flames radiating from each growth centre, thin dark seams */
  vec2 rq=q-cc-vec2(-.03,0.);float fl=.5+.5*sin(atan(rq.y,rq.x)*5.+hid*30.+length(rq)*9.+nt*7.);
  vec3 tc=mix(vec3(.1,.075,.035),vec3(.4,.25,.075),smoothstep(.55,1.,fl*.45+nt*.7+hid*.2)*.85);tc*=.85+.3*nt;
  tc=mix(tc,vec3(.08,.06,.035),smoothstep(.008,.002,eg)*.75);
  vec3 tf=mix(vec3(.2,.16,.09),vec3(.48,.42,.28),smoothstep(.62,.8,nm)*.45);float mm=max(ms,mf);tc=mix(tf,tc,ms);
  tc*=(1.08-.4*e*e)*(aW*.85+kW*.95)*.3183*vec3(.82,.86,.7);tc=mix(tc,body,.16);body=mix(body,tc,mm*uTur.w*.85);F*=1.-.55*mm*uTur.w;}
 /* the whale's submerged bulk: a soft dark shape along its spine, fading with depth */
 if(uWh1.z>.005){float nz3=texture2D(tF,vW.xz*.8).g;vec2 pq=vW.xz+det*.03,a0=uWh0.xy,a1=uWh0.zw,a2=uWh1.xy,e0=a1-a0,e1=a2-a1;float h0=clamp(dot(pq-a0,e0)/dot(e0,e0),0.,1.),h1=clamp(dot(pq-a1,e1)/dot(e1,e1),0.,1.);
  float d0=length(pq-a0-e0*h0),d1=length(pq-a1-e1*h1),sw=d0<d1?h0*.5:.5+h1*.5,dw=min(d0,d1),wd=.3*(1.-.75*sw*sw)*smoothstep(-.02,.1,sw)+.02;
  float wm=(1.-smoothstep(wd*.3,wd*1.45,dw+(nz3-.5)*.06))*uWh1.z*exp(-uWh1.w*2.6);body=mix(body,body*.34,wm*.75);F*=1.-.45*wm;}
 float sg=max(dot(Rg,Ls),0.),sb=max(dot(Rf,Ls),0.);
 vec3 Hs=normalize(V+Ls);float nh=max(dot(Ng,Hs),1e-3),t2=(1.-nh*nh)/(nh*nh),m2=.012+.01*uDet;
 float spk=smoothstep(.15,.9,texture2D(tN,fx*3.1+uT*vec2(.05,-.04)).x*texture2D(tN,fx*2.3-uT*vec2(.03,.06)).y*4.);
 float bk=exp(-t2/m2)/(3.1416*m2*nh*nh*nh*nh)*(.02+.98*pow(1.-max(dot(V,Hs),0.),5.))/max(4.*NV*Ls.y,.05);
 vec3 spec=uSunCol*uSunVis*uGlit*(pow(sg,700.)*70.+pow(sb,110.)*2.+pow(sb,14.)*.14+bk*(.35+2.6*spk)*.5);
 float mg=max(dot(Rg,uMoonDir),0.);spec+=uMoonC*uMoonVis*(pow(mg,900.)*14.+pow(max(dot(Rf,uMoonDir),0.),44.)*.7);
 vec3 Ld=uLanP-vW;float ld=length(Ld);Ld/=ld;spec+=uLanC*(pow(max(dot(Rg,Ld),0.),220.)*2.2+pow(max(dot(Rf,Ld),0.),18.)*.12)/(1.+ld*ld*.35);
 vec3 col=mix(body,sky,F)+spec*(.3+.7*F)*(1.-.8*slk);col=mix(col,col*1.08+vec3(.015,.025,.03),slk*.45);
 float cap=smoothstep(.04,.62,1.-vJ)*uWhite;
 /* two rotated scales so the tile never lines up; crests grow the coverage, a broad noise thins it out */
 vec2 fr=mat2(.951,.309,-.309,.951)*fx;float f1=texture2D(tF,fx*.21).r,f2=texture2D(tF,fr*.57+.31).r,fm=f1*.6+f2*.4;
 float fade=smoothstep(.2,.7,texture2D(tF,fr*.045+.13).g);
 float foam=smoothstep(.92-cap*.62,1.12-cap*.6,fm+(fade-.5)*.25)*smoothstep(.02,.2,cap);
 /* foam patch left by a fluke slap: spreads, then thins out over several seconds */
 {float pa=uT-uPatch.z;if(pa>0.&&pa<16.){float d=length(vW.xz-uPatch.xy),r=.2+.95*sqrt(pa*.6);float pf=(1.-smoothstep(r*.5,r,d+(fm-.5)*.8))*exp(-pa*.2)*uPatch.w*mix(1.,.25+.75*smoothstep(0.,r*.85,d),smoothstep(.4,3.5,pa));foam=max(foam,smoothstep(.3,.85,pf*(.2+1.3*fm))*.92);}}
 for(int i=0;i<6;i++){vec4 Q=uSpot[i];float a=uT-Q.z;if(a<0.||a>3.2)continue;float d=length(vW.xz-Q.xy),r=Q.w*(.6+.8*sqrt(a));foam=max(foam,(1.-smoothstep(r*.35,r,d+(fm-.5)*r*.5))*exp(-a*1.1)*smoothstep(.28,.62,fm+.3*(1.-d/r))*.8);}
 foam=max(foam,clamp(kel*1.8,0.,1.)*(.15+.85*smoothstep(.4,.62,fm)));
 foam*=1.-.85*slk;foam=max(foam,slr);
 float ang=atan(vX.y,vX.x)/6.2832;float rl=length(vX),rimF=smoothstep(${R-.42},${R-.02},rl);
 float rs=texture2D(tF,vec2(ang*38.,rl*.9-uT*.35)).g*.6+texture2D(tF,vec2(ang*90.+.3,rl*2.1-uT*.8)).r*.55;
 foam=max(foam,rimF*smoothstep(.45,.85,rs+rimF*.35)*.85+smoothstep(${R-.08},${R-.01},rl)*.35);
 foam=max(foam,uIce*.0);
 vec3 fc=vec3(.92,.94,.95)*(uAmb*.95+key*.8)*.3183;col=mix(col,fc,foam*.9);
 if(uBio>.001)col+=uBio*vec3(.22,.85,1.)*specks(fx,uT)*(clamp(cap*1.4,0.,1.)*.9+rimF*.3)*1.3;
 col=mix(col,uFogC,fogMix(dist));
 gl_FragColor=vec4(col,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`});
const sea=new T.Mesh(seaGeo(MOB?84:118,MOB?240:320),seaMat);sea.frustumCulled=false;root.add(sea);

/* ---------------- floating body: an aquarium bowl of clear water over a sand dish, rim falls and mist ---------------- */
const AQU={...U,...SKY,uTSh:{value:new T.V4(0,0,1,0)},uDim:{value:1}};
const ellPts=(y0,y1,n,k)=>{const p=[];for(let i=0;i<=n;i++){const y=y0+(y1-y0)*i/n;p.push(new T.V2(Math.max(1e-4,rWall(y)*(k||1)),y))}return p};
const AQH=`uniform sampler2D tF;uniform float uDim,uT,uFogN,uFogF,uHaze,uSunVis,uCover;uniform vec3 uShal,uDeep,uScat,uAmb,uKey,uKeyDir,uFogC,uTop,uBot,uSunDir,uSunCol;uniform vec4 uTSh;${FOG}${AQG}
vec3 eN(vec3 p){return normalize(vec3(p.x,p.y*${(R*R/(BD*BD)).toFixed(4)},p.z));}`;
const AQV=`varying vec3 vW,vN;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`;
{const g=new T.Lathe(ellPts(YW,-.13,MOB?12:20),MOB?96:160);
 /* far wall: the water in between, with shafts of sunlight hanging down through it */
 const NS=MOB?6:10,back=new T.Mesh(g,new T.SM({uniforms:AQU,transparent:true,depthWrite:false,side:2,vertexShader:AQV,
  fragmentShader:AQH+`varying vec3 vW,vN;void main(){vec3 V=cameraPosition-vW;if(dot(eN(vW),V)>0.)discard;vec3 rd=-V;float te=aqEnter(cameraPosition,rd);if(te>=1.)discard;
  float L=(1.-te)*length(rd);vec3 E=cameraPosition+rd*te;vec3 Ls=normalize(vec3(uSunDir.x,max(uSunDir.y,.25),uSunDir.z));float ray=0.;
  /* shafts fan out from a source above the surface toward the sun and fade with depth */
  vec3 S0=Ls*9.;for(int i=0;i<${NS};i++){vec3 q=mix(E,vW,(float(i)+.5)/${NS}.);vec2 sp=S0.xz+(q.xz-S0.xz)*S0.y/(S0.y-q.y);float c=texture2D(tF,sp*.032+uT*vec2(.004,.002)).g*.75+texture2D(tF,sp*.061-uT*vec2(.002,.004)).g*.25;ray+=smoothstep(.3,1.05,c)*exp(q.y*.62);}
  ray/=${NS}.;vec3 Tr=exp(-L*vec3(.14,.05,.036));float a=1.-exp(-L*(.24+.3*aqFar()));
  vec3 c=aqLight(max(-(E.y+vW.y)*.5,0.)*.55+L*.035)+uSunCol*uSunVis*ray*.2*(1.-Tr.g)*(1.-.6*uCover);c=mix(c,uFogC,fogMix(length(V))*.7);
  gl_FragColor=vec4(c,clamp(a,0.,.97));
  #include <colorspace_fragment>
  }`}));back.renderOrder=1;back.frustumCulled=false;root.add(back);
 /* near wall: only a faint glassy sheen of the sky */
 const front=new T.Mesh(new T.Lathe(ellPts(-BD+.004,-.13,MOB?22:34),MOB?96:160),new T.SM({uniforms:AQU,transparent:true,depthWrite:false,side:2,vertexShader:AQV,
  fragmentShader:AQH+`varying vec3 vW,vN;void main(){vec3 V=normalize(cameraPosition-vW),N=eN(vW);float nv=dot(N,V);if(nv<0.)discard;float F=pow(1.-nv,4.);vec3 Rf=reflect(-V,N);
  vec3 sk=mix(uBot,uTop,clamp(Rf.y*1.8+.3,0.,1.));float hl=pow(max(dot(Rf,normalize(uSunDir)),0.),80.)*uSunVis;float lip=smoothstep(-.5,-.13,vW.y);
  vec3 c=mix(sk*.95+uSunCol*hl*2.,uFogC,fogMix(length(cameraPosition-vW))*.7);gl_FragColor=vec4(c,clamp(.03+F*.5+hl+lip*.12,0.,.85));
  #include <colorspace_fragment>
  }`}));front.renderOrder=1.5;front.frustumCulled=false;root.add(front)}
/* the sand pressed against the bottom of the glass bowl: soft layered bands, lit through the glass, no dark rim */
{const g=new T.Lathe(ellPts(-BD+.002,YW,MOB?14:22),MOB?96:160);const m=new T.SM({uniforms:AQU,vertexShader:AQV,
  fragmentShader:AQH+`varying vec3 vW,vN;void main(){vec3 N=eN(vW);vec3 V=normalize(cameraPosition-vW);float a=atan(vW.z,vW.x);
  float wv=texture2D(tF,vec2(a*1.6,.37)).g*.5+texture2D(tF,vec2(a*4.1,.71)).r*.25,yb=vW.y+wv,n2=texture2D(tF,vW.xz*.9+vW.y*.7).g,gr=texture2D(tF,vec2(a*40.,vW.y*3.)).r;
  float band=.5+.5*sin(yb*5.3)*sin(yb*2.1+1.3);vec3 c=mix(vec3(.93,.87,.72),vec3(.82,.73,.58),band*.6);c=mix(c,vec3(.95,.82,.74),smoothstep(.75,.95,.5+.5*sin(yb*9.+1.))*.35);
  c*=.9+.18*n2;c*=.94+.1*gr;c=mix(c,vec3(.98,.95,.86),smoothstep(-4.1,${(YW+.1).toFixed(2)},vW.y)*.25);
  float dif=max(dot(N,uKeyDir),0.);c*=(uAmb*(.92+.08*N.y)*1.05+uKey*(.35+dif*.55))*.3183;
  /* glass over the sand: a turquoise tint, a little sky at grazing angles */
  float F=pow(1.-abs(dot(N,V)),3.);c=mix(c,c*vec3(.86,.98,1.),.5);c=mix(c,mix(uBot,uTop,.4)*.95,F*.35);
  c=mix(c,uFogC,fogMix(length(cameraPosition-vW)));gl_FragColor=vec4(c,1.);
  #include <colorspace_fragment>
  }`});const o=new T.Mesh(g,m);o.frustumCulled=false;root.add(o)}
/* sand dish: rippled, with the caustic net dancing over it */
const sandB=(x,z)=>{const r=Math.hypot(x,z),k=1-Math.pow(Math.min(1,r/RS),4);return k*(.13*Math.sin(x*.8+z*.35)*Math.sin(z*.62-x*.2+.4)+.05*Math.sin(x*2.1-z*1.7))};
const floorY=(x,z)=>ySand(Math.hypot(x,z))+sandB(x,z);
{const nr=MOB?20:30,na=MOB?72:110,pos=[0,floorY(0,0),0],idx=[];for(let j=1;j<=nr;j++){const r=RS*j/nr;for(let i=0;i<na;i++){const a=i/na*TAU,x=r*Math.cos(a),z=r*Math.sin(a);pos.push(x,floorY(x,z),z)}}
 for(let i=0;i<na;i++)idx.push(0,1+(i+1)%na,1+i);for(let j=1;j<nr;j++){const a0=1+(j-1)*na,b0=1+j*na;for(let i=0;i<na;i++){const i2=(i+1)%na;idx.push(a0+i,a0+i2,b0+i,a0+i2,b0+i2,b0+i)}}
 const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setIndex(idx);g.computeVertexNormals();
 const m=new T.SM({uniforms:AQU,side:2,vertexShader:AQV,fragmentShader:AQH+`varying vec3 vW,vN;void main(){vec3 N=normalize(vN);if(N.y<0.)N=-N;float dep=-vW.y;
  vec3 sd=vec3(.88,.8,.62)*(.85+.3*texture2D(tF,vW.xz*.45).g);float rp=sin(dot(vW.xz,vec2(.8,.6))*10.+texture2D(tF,vW.xz*.18).g*9.);sd*=.93+.07*rp;
  sd=mix(sd,vec3(.62,.6,.5),smoothstep(.62,.85,texture2D(tF,vW.xz*.09+.3).r)*.35);
  vec3 lt=(uAmb*.62*(.6+.4*N.y)+uKey*max(dot(N,uKeyDir),0.)*.85)*.3183*exp(-dep*vec3(.05,.035,.03));
  vec3 c=sd*lt*(1.+caus(vW.xz,uT)*2.4*uSunVis*(1.-uCover*.6)*exp(-dep*.1));vec2 d=vW.xz-uTSh.xy;c*=1.-uTSh.w*exp(-dot(d,d)/(uTSh.z*uTSh.z));
  c=aqFogK(c*uDim,vW,.38);gl_FragColor=vec4(c,1.);
  #include <colorspace_fragment>
  }`});const o=new T.Mesh(g,m);o.frustumCulled=false;root.add(o)}
/* reef: textured rocks, branching, brain and table corals, anemones, sea fans and swaying weed, merged into one mesh */
const REEF=[];
{const P=[],N=[],Cc=[],S=[],K=[],I=[],v=new V3(),nn=new V3(),hex=h=>{const c=new C3(h);return[c.r,c.g,c.b]},mix3=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];
 const put=(g,m,col,sw,kd)=>{const pa=g.attributes.position,na=g.attributes.normal,b=P.length/3;for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i);const y0=v.y;v.applyMatrix4(m);P.push(v.x,v.y,v.z);
   nn.fromBufferAttribute(na,i).transformDirection(m);N.push(nn.x,nn.y,nn.z);const c=typeof col==="function"?col(y0,i):col;Cc.push(c[0],c[1],c[2]);S.push(typeof sw==="function"?sw(y0):sw);K.push(kd||0)}
  if(g.index)for(let k=0;k<g.index.count;k++)I.push(b+g.index.getX(k));else for(let k=0;k<pa.count;k++)I.push(b+k)};
 const MX=(x,z,dy,ry,tx,tz,sx,sy,sz)=>{const e=new T.M4().makeRotationY(ry),t2=new T.M4().makeRotationX(tx),t3=new T.M4().makeRotationZ(tz);return new T.M4().makeTranslation(x,floorY(x,z)+dy,z).multiply(e).multiply(t3).multiply(t2).multiply(new T.M4().makeScale(sx,sy,sz))};
 /* weathered boulders: several octaves of lumps, a flattened seat and a few ledges */
 const rockG=()=>{let g=new T.Sphere(1,MOB?11:14,MOB?8:10),pa=g.attributes.position,o=[rr(0,9),rr(0,9),rr(0,9)];for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i);
   let k=1+.2*Math.sin(v.x*2.1+o[0])*Math.sin(v.z*2.4+v.y*1.3+o[1])+.1*Math.sin(v.y*5.3+v.z*4.1+o[2])*Math.sin(v.x*4.7)+.045*Math.sin(v.x*11+v.y*9+o[0])*Math.sin(v.z*12-v.y*7)+.02*Math.sin(v.x*23+v.z*19+v.y*17);
   k-=.06*Math.max(0,Math.sin(v.y*7+o[1]));v.multiplyScalar(k);if(v.y<-.35)v.y=-.35+(v.y+.35)*.25;pa.setXYZ(i,v.x,v.y,v.z)}g=g.toNonIndexed();g.computeVertexNormals();return g};
 const RG=[rockG(),rockG(),rockG(),rockG()];
 const CORAL=["#ff6f91","#ff8a3d","#b066e6","#ffd24a","#ef4b4b","#ff9ec4","#ffb03a"].map(hex),Y=new V3(0,1,0),q=new T.Quat(),dd=new V3();
 /* staghorn coral: forking tapered branches with pale growing tips */
 const branch=(p,d,len,rad,dep,col)=>{q.setFromUnitVectors(Y,d);const e=p.clone().addScaledVector(d,len),r1=rad*.72;
   put(new T.Cyl(r1,rad,len,6,1,true).translate(0,len/2,0),new T.M4().makeTranslation(p.x,p.y,p.z).multiply(new T.M4().makeRotationFromQuaternion(q)),y=>mix3(col,[1,.96,.9],dep?0:ss(len*.3,len,y)*.55),0,1);
   if(!dep){put(new T.Sphere(r1,6,4),new T.M4().makeTranslation(e.x,e.y,e.z),mix3(col,[1,.96,.9],.55),0,1);return}
   const nb=2+(rnd()<.4?1:0);for(let i=0;i<nb;i++){const a=rnd()*TAU,t=rr(.35,.65);dd.set(Math.cos(a),0,Math.sin(a)).multiplyScalar(t).add(d).normalize();dd.y=Math.max(dd.y,.25);dd.normalize();branch(e,dd.clone(),len*rr(.7,.85),r1,dep-1,col)}};
 const sites=[];for(let i=0;i<(MOB?14:20);i++){const a=i/(MOB?14:20)*TAU+rr(-.2,.2),r=rr(1.6,RS-.9);sites.push([Math.cos(a)*r,Math.sin(a)*r])}REEF.push(...sites);
 sites.forEach(([x0,z0],si)=>{
  for(let k=0;k<3;k++){const x=x0+rr(-.6,.6),z=z0+rr(-.6,.6),s=rr(.2,.46),tone=rr(0,1);
   put(RG[(si+k)%4],MX(x,z,-s*.2,rr(0,TAU),rr(-.15,.15),rr(-.15,.15),s*rr(.9,1.3),s*rr(.55,.85),s*rr(.8,1.2)),mix3(hex("#b7ab98"),hex("#968a7a"),tone),0,0)}
  const kind=si%3;
  if(kind===0)for(let k=0;k<2;k++){const x=x0+rr(-.7,.7),z=z0+rr(-.7,.7),col=CORAL[(rnd()*CORAL.length)|0],b0=new V3(x,floorY(x,z)-.02,z);
   for(let j=0;j<3+(rnd()*2|0);j++){const a=rnd()*TAU;branch(b0.clone().add(dd.set(Math.cos(a)*.05,0,Math.sin(a)*.05)),new V3(Math.cos(a)*.45,1,Math.sin(a)*.45).normalize(),rr(.15,.21),.036,MOB?2:3,col)}}
  if(kind===1||rnd()<.3){const x=x0+rr(-.7,.7),z=z0+rr(-.7,.7),s=rr(.22,.36),col=[hex("#f29a3a"),hex("#e8d04a"),hex("#c07ae0"),hex("#ff7f8f")][(rnd()*4)|0];
   put(new T.Sphere(1,MOB?18:24,MOB?12:16),MX(x,z,-s*.3,rr(0,TAU),0,0,s,s*.68,s*rr(.85,1.1)),col,0,2)}
  if(kind===2){const x=x0+rr(-.6,.6),z=z0+rr(-.6,.6),s=rr(.3,.48),h=rr(.14,.24),col=[hex("#f08a5a"),hex("#b77ad8"),hex("#e8c84a")][(rnd()*3)|0];
   put(new T.Cyl(.035,.06,h,7).translate(0,h/2,0),MX(x,z,-.02,0,0,0,1,1,1),mix3(col,[.4,.35,.3],.3),0,3);
   for(let l=0;l<2;l++){const sl=s*(1-l*.35),y2=h-l*.07;put(new T.Cyl(sl,sl*.92,.035,22,1).translate(0,y2,0),MX(x+rr(-.04,.04),z+rr(-.04,.04),0,rr(0,TAU),rr(-.08,.08),rr(-.08,.08),1,1,rr(.75,1)),y=>mix3(col,[1,.97,.9],y>y2?.15:0),0,3)}}
  if(rnd()<.75){const x=x0+rr(-.8,.8),z=z0+rr(-.8,.8),tip=[hex("#ff7fc8"),hex("#ffb347"),hex("#d58cff")][(rnd()*3)|0],bs=rnd()<.5?hex("#b0306e"):hex("#e0702a"),nt=MOB?14:22;
   put(new T.Cyl(.09,.11,.1,10).translate(0,.05,0),MX(x,z,-.02,0,0,0,1,1,1),bs,0,4);
   for(let k=0;k<nt;k++){const a=k/nt*TAU+rr(-.1,.1),r=rr(.01,.07),h=rr(.22,.34);put(new T.Cone(.014,h,4).translate(0,h/2,0),MX(x+Math.cos(a)*r,z+Math.sin(a)*r,.07,-a,0,rr(.3,.8),1,1,1),y=>mix3(bs,tip,ss(0,h,y)),y=>Math.max(0,y)*.5,4)}}
  for(let k=0;k<(rnd()<.5?3:1);k++){const x=x0+rr(-1,1),z=z0+rr(-1,1),h=rr(.3,.7),nseg=6,pos=[],ix=[];for(let j=0;j<=nseg;j++){const t=j/nseg,w=.05*(1-.65*t);pos.push(-w,t*h,.03*Math.sin(t*5),w,t*h,.03*Math.sin(t*5));if(j<nseg)ix.push(j*2,j*2+1,j*2+2,j*2+1,j*2+3,j*2+2)}
   const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setIndex(ix);g.computeVertexNormals();put(g,MX(x,z,-.03,rr(0,TAU),0,0,1,1,1),y=>mix3(hex("#2c6a34"),hex("#86b552"),y/h),y=>Math.pow(y/h,1.6),5)}});
 const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(P),3));g.setAttribute("normal",new T.BA(new Float32Array(N),3));g.setAttribute("color",new T.BA(new Float32Array(Cc),3));g.setAttribute("aSw",new T.BA(new Float32Array(S),1));g.setAttribute("aK",new T.BA(new Float32Array(K),1));g.setIndex(I);
 const m=new T.SM({uniforms:AQU,side:2,vertexShader:`attribute float aSw,aK;attribute vec3 color;uniform float uT;varying vec3 vW,vN,vC;varying float vK;void main(){vec3 p=position;float ph=uT*1.1+p.x*1.3+p.z*1.7;p.x+=sin(ph)*.11*aSw;p.z+=cos(ph*.8+1.)*.08*aSw;
  vW=p;vN=normal;vC=color;vK=aK;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}`,
  fragmentShader:AQH+`varying vec3 vW,vN,vC;varying float vK;void main(){vec3 N=normalize(vN);vec3 V=normalize(cameraPosition-vW);if(dot(N,V)<0.)N=-N;float dep=-vW.y;vec3 al=vC;float sp=.0;
  if(vK<.5){/* rock: grain, pits, darker crevices, crusts of pink coralline algae and green film on the tops */
   float n1=texture2D(tF,vW.xz*1.3+vW.y*.8).g,n2=texture2D(tF,vec2(vW.x-vW.y,vW.z+vW.y)*4.1).r,n3=texture2D(tF,vec2(vW.x+vW.z,vW.y)*9.).b;
   al*=.55+.75*n1;al*=.8+.4*n3;al*=1.-.65*smoothstep(.55,.8,n2);al*=.55+.45*smoothstep(-.5,.5,N.y);
   al=mix(al,vec3(.86,.42,.58),smoothstep(.5,.7,texture2D(tF,vW.xz*.9+vW.y*.5+.37).b)*.8);al=mix(al,vec3(.5,.42,.7),smoothstep(.62,.78,texture2D(tF,vW.zx*1.3+.71).g)*.55);
   al=mix(al,vec3(.5,.45,.36),smoothstep(.5,.9,N.y)*smoothstep(.55,.72,n1)*.2);}
  else if(vK<1.5){al*=.86+.22*texture2D(tF,vW.xz*11.+vW.y*7.).r;sp=.15;}
  else if(vK<2.5){/* brain coral: meandering ridges and valleys */
   float nz=texture2D(tF,vW.xz*.55+vW.y*.35).g*2.4+texture2D(tF,vW.zx*1.7+vW.y).r*.9;float gr=abs(fract(nz*5.)-.5)*2.;al*=mix(.5,1.12,smoothstep(.15,.6,gr));sp=.12;}
  else if(vK<3.5){float rn=texture2D(tF,vW.xz*7.).g;al*=.82+.3*rn;al*=1.-.2*smoothstep(.0,-.6,N.y);}
  else if(vK<4.5)sp=.25;
  if(vK>.5){float l=dot(al,vec3(.3,.55,.15));al=min(mix(vec3(l),al,1.45)*1.3,vec3(1.));al=max(al,0.);}vec3 att=exp(-dep*vec3(.04,.03,.025));vec3 lt=(uAmb*.62*(.6+.4*N.y)+uKey*max(dot(N,uKeyDir),0.)*.85)*.3183*att;
  vec3 c=al*lt*(1.+caus(vW.xz,uT)*1.8*uSunVis*max(N.y,0.)*exp(-dep*.1));c+=uSunCol*uSunVis*pow(max(dot(N,normalize(V+uKeyDir)),0.),30.)*sp*att;c=aqFogK(c*uDim,vW,.38);gl_FragColor=vec4(c,1.);
  #include <colorspace_fragment>
  }`});const o=new T.Mesh(g,m);o.frustumCulled=false;root.add(o)}
const fallU={uFT:{value:0},uFA:{value:1},uWind:Ue.uWind};
{const na=MOB?220:340,nv=MOB?34:44,pos=[],uv=[],idx=[];for(let i=0;i<=na;i++){const a=i/na*TAU;for(let j=0;j<=nv;j++){const s=Math.pow(j/nv,1.25),r=R+.01+.62*s+.08*s*s,y=-.12-(.04*s+5.4*s*s);pos.push(r*Math.cos(a),y,r*Math.sin(a));uv.push(i/na,s)}}
 for(let i=0;i<na;i++)for(let j=0;j<nv;j++){const a=i*(nv+1)+j,b=a+nv+1;idx.push(a,b,a+1,b,b+1,a+1)}
 const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setAttribute("uv",new T.BA(new Float32Array(uv),2));g.setIndex(idx);
 const m=new T.SM({uniforms:{...U,...SKY,...fallU},transparent:true,depthWrite:false,side:2,
  vertexShader:`uniform float uWind;varying vec2 vU;varying vec3 vW;void main(){vU=uv;vec3 p=position;p.x+=uWind*.55*uv.y*uv.y;p.z+=uWind*.17*uv.y*uv.y;vW=p;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}`,
  fragmentShader:`uniform sampler2D tF;uniform float uFT,uFA,uIce,uFogN,uFogF,uHaze;uniform vec3 uDeep,uScat,uAmb,uKey,uFogC;varying vec2 vU;varying vec3 vW;${FOG}
  float h1(float n){return fract(sin(n*91.7)*43758.55);}
  /* one layer of strands: N columns, each with its own width, opacity, wobble and break height;
     past the break a strand falls apart into drops that keep accelerating */
  vec3 strands(float x,float s,float v,float N,float o,out float br){float q=x*N+o;float id=floor(q);float h=h1(id+o),h2=h1(id+o+7.3),h3=h1(id+o+3.9),h4=h1(id+o+11.1);
   float cx=fract(q+.34*sin(s*4.+h*30.+uFT*.5)*s+.12*sin(s*11.+h4*20.)*s)-.5;float w=mix(.05,.2,h*h);float on=step(.8,h2);
   float sb=mix(.12,.5,pow(h3,1.2));float lon=.55+.45*sin(v*(5.+6.*h4)+h*40.);
   float core=1.-smoothstep(w*.35,w,abs(cx));
   float s0=.16*h4*h4*h4;float st=core*smoothstep(-.2,.4,lon)*(1.-smoothstep(sb,sb+.08,s))*smoothstep(s0,s0+.05,s);
   float dv=fract(v*(9.+5.*h)+h4*7.);float dc=floor(v*(9.+5.*h)+h4*7.);float dp=step(.45,h1(dc+id*1.7));
   float dr=exp(-pow((dv-.5)/.16,2.))*exp(-pow(cx/(w*.6+.04),2.))*dp*smoothstep(sb-.02,sb+.06,s)*(1.-smoothstep(sb+.12,sb+.34+.2*h,s));
   br=pow(core,3.)*on*smoothstep(.72,1.,sin(v*(1.6+1.8*h4)+h*60.)*.5+.5);return vec3(st*on,dr*on,mix(.35,.9,h2));}
  void main(){float s=vU.y,x=vU.x;
  /* water accelerates as it falls: scroll in a stretched coordinate */
  float v=pow(s,.55)*7.-uFT*1.9;float b1,b2,b3;
  float b0;vec3 Wd=strands(x,s,v*.85,${MOB?52:70}.,93.,b0);vec3 A=strands(x,s,v,${MOB?150:210}.,0.,b1),B=strands(x,s,v*1.13,${MOB?330:480}.,17.,b2),C=strands(x,s,v*1.27,${MOB?640:980}.,41.,b3);
  float lip=1.-smoothstep(.0,.05,s);
  /* a glassy sheet over the lip that tears open into the strands */
  float tear=texture2D(tF,vec2(x*23.,s*.6-uFT*.05)).g*.6+texture2D(tF,vec2(x*61.+.3,s*1.3-uFT*.11)).b*.4;
  float sm=smoothstep(.3,.7,texture2D(tF,vec2(x*9.,.31)).g*.7+texture2D(tF,vec2(x*23.,.77)).b*.4);
  float sheet=(1.-smoothstep(.0,.04+.14*tear*sm,s))*.6*(.25+.75*sm);
  float strand=max(Wd.x*Wd.z*.12,max(A.x*A.z,B.x*B.z*.45)),drop=max(max(Wd.y*.3,A.y),max(B.y*.6,C.y*.4));
  float a=clamp(max(sheet,strand)+drop*.8,0.,1.)*(1.-smoothstep(.16,.42,s))*.42;a=max(a,lip*(.2+.3*sm));
  float aer=clamp(s*1.6+drop*.5-.05,0.,1.);
  vec3 c=mix(uDeep*.85+uScat*.75,vec3(.88,.93,.97),aer)*(uAmb*.95+uKey*.62)*.3183*1.1;
  /* glints run down the strand cores */
  float gl=max(b0*.3,max(b1,b2*.6))*(1.-smoothstep(.05,.35,s));
  c+=(lip*.3+gl*.9+drop*.25)*vec3(.95,.97,1.)*(uAmb*.4+uKey)*.3183;
  c=mix(c,vec3(.9,.95,1.)*(uAmb+uKey*.4)*.3183,uIce*.55);c=mix(c,uFogC,fogMix(length(cameraPosition-vW)));
  gl_FragColor=vec4(c,a*uFA*(1.-uIce*.35));
  #include <colorspace_fragment>
  }`});
 const falls=new T.Mesh(g,m);falls.renderOrder=2;falls.frustumCulled=false;root.add(falls)}
/* soft points for mist and spray; size is in world units */
const ptScale={value:500};
function ptMat(tex,add){return new T.SM({uniforms:{tS:{value:tex},uSc:ptScale,uC:{value:new C3(1,1,1)},uFogC:U.uFogC,uFogN:U.uFogN,uFogF:U.uFogF,uHaze:U.uHaze},transparent:true,depthWrite:false,blending:add?2:1,
 vertexShader:`attribute float aA,aS;uniform float uSc;varying float vA,vD;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;vD=-mv.z;gl_PointSize=aA<.003?0.:min(aS*uSc/max(vD,.1),${MOB?380:600}.);vA=aA;}`,
 fragmentShader:`uniform sampler2D tS;uniform vec3 uC,uFogC;uniform float uFogN,uFogF,uHaze;varying float vA,vD;${FOG}void main(){float a=texture2D(tS,gl_PointCoord).a*vA;if(a<.004)discard;gl_FragColor=vec4(mix(uC,uFogC,fogMix(vD)*.85),a);
 #include <colorspace_fragment>
 }`})}
function ptSys(n,tex,add){const g=new T.BG(),p=new Float32Array(n*3),a=new Float32Array(n),s=new Float32Array(n);g.setAttribute("position",new T.BA(p,3));g.setAttribute("aA",new T.BA(a,1));g.setAttribute("aS",new T.BA(s,1));
 const m=ptMat(tex,add),o=new T.Points(g,m);o.frustumCulled=false;return{o,p,a,s,g,m,n}}
const mist=ptSys(MOB?210:340,tPuff);mist.o.renderOrder=3;root.add(mist.o);
const MI=[];for(let i=0;i<mist.n;i++)MI.push({a:rnd()*TAU,r:0,y:0,age:rr(0,12),life:rr(7,13),sz:rr(1.8,3.8),vy:rr(.14,.3),vr:rr(.03,.12)});
const fdrop=ptSys(MOB?220:420,tDot);fdrop.o.renderOrder=3;root.add(fdrop.o);
const FDp=[];for(let i=0;i<fdrop.n;i++)FDp.push({x:0,y:-50,z:0,vx:0,vy:0,vz:0,age:rr(0,1),life:.5,sz:.04});
/* a slow bank of cloud below the disc that the falls dissolve into */
const cbank=ptSys(MOB?26:40,tPuff);cbank.o.renderOrder=0;root.add(cbank.o);
const CB=[];for(let i=0;i<cbank.n;i++)CB.push({a:i/cbank.n*TAU+rr(-.1,.1),r:rr(R*.5,R*1.25),y:rr(-10.6,-8.6),sz:rr(6,10),ph:rnd()*TAU,w:rr(.004,.012)});

/* ---------------- spray / droplets ---------------- */
const spray=ptSys(MOB?560:1000,tDot);spray.o.renderOrder=6;root.add(spray.o);
const SP=[];let spN=0;for(let i=0;i<spray.n;i++)SP.push({on:0,x:0,y:0,z:0,vx:0,vy:0,vz:0,age:0,life:1,sz:.04,a:1,lx:0,ly:0,lz:0,loc:0});
function emit(x,y,z,vx,vy,vz,life,sz,a){const q=SP[spN];spN=(spN+1)%spray.n;q.on=1;q.x=x;q.y=y;q.z=z;q.vx=vx;q.vy=vy;q.vz=vz;q.age=0;q.life=life;q.sz=sz;q.a=a;q.loc=0}

/* whale water: thin streaks stretched along their velocity (motion blur), near-white with a sky tint */
const wtrU={uWc:{value:new C3(.8,.85,.9)},uAsp:{value:1},uBlur:{value:.05}};
const streak=(()=>{const n=MOB?420:800,g=new T.BG(),P=new Float32Array(n*12),Vv=new Float32Array(n*12),D=new Float32Array(n*8),Cn=new Float32Array(n*8),I=[];
 for(let i=0;i<n;i++){[[-1,0],[1,0],[-1,1],[1,1]].forEach((c,k)=>{Cn[(i*4+k)*2]=c[0];Cn[(i*4+k)*2+1]=c[1]});const b=i*4;I.push(b,b+1,b+2,b+1,b+3,b+2)}
 g.setAttribute("position",new T.BA(P,3));g.setAttribute("aV",new T.BA(Vv,3));g.setAttribute("aD",new T.BA(D,2));g.setAttribute("aC",new T.BA(Cn,2));g.setIndex(I);
 const m=new T.SM({uniforms:{...wtrU,uFogC:U.uFogC,uFogN:U.uFogN,uFogF:U.uFogF,uHaze:U.uHaze},transparent:true,depthWrite:false,
  vertexShader:`attribute vec3 aV;attribute vec2 aD,aC;uniform float uBlur,uAsp;varying vec2 vC;varying float vA,vD;
  void main(){vec4 h=projectionMatrix*viewMatrix*vec4(position,1.),t=projectionMatrix*viewMatrix*vec4(position-aV*uBlur,1.);vA=aD.y;vD=h.w;vC=aC;
   if(aD.y<.003||h.w<.05){gl_Position=vec4(2.,2.,2.,1.);return;}
   vec2 hs=h.xy/h.w,ts=t.xy/max(t.w,.05);vec2 d=(hs-ts)*vec2(uAsp,1.);float L=length(d);vec2 dir=L>1e-5?d/L:vec2(0.,1.),nr=vec2(-dir.y,dir.x);
   float w=aD.x*projectionMatrix[1][1]/h.w;float len=max(L,w*1.5);vec2 p=hs*vec2(uAsp,1.)+dir*w*.5-dir*(len+w)*aC.y+nr*w*aC.x*.5;
   gl_Position=vec4(p.x/uAsp*h.w,p.y*h.w,h.z,h.w);}`,
  fragmentShader:`uniform vec3 uWc,uFogC;uniform float uFogN,uFogF,uHaze;varying vec2 vC;varying float vA,vD;${FOG}
  void main(){float core=exp(-vC.x*vC.x*5.),tail=(1.-smoothstep(.15,1.,vC.y))*smoothstep(0.,.08,vC.y);float a=vA*core*tail;if(a<.004)discard;
   vec3 c=mix(uWc,vec3(1.)*max(max(uWc.r,uWc.g),uWc.b)*1.35,core*core);gl_FragColor=vec4(mix(c,uFogC,fogMix(vD)*.8),a*(.35+.65*core*core));
  #include <colorspace_fragment>
  }`});
 const o=new T.Mesh(g,m);o.frustumCulled=false;o.renderOrder=7;root.add(o);const Q=[];for(let i=0;i<n;i++)Q.push({on:0,x:0,y:0,z:0,vx:0,vy:0,vz:0,age:0,life:1,w:.01,a:.6,dr:0});
 let k=0;return{n,g,P,Vv,D,Q,emit(x,y,z,vx,vy,vz,life,w,a,dr){const q=Q[k];k=(k+1)%n;Object.assign(q,{on:1,x,y,z,vx,vy,vz,age:0,life,w,a,dr:dr||0})}}})();
function emitW(x,y,z,vx,vy,vz,life,w,a,dr){streak.emit(x,y,z,vx,vy,vz,life,w,a,dr)}
function streakUpd(dt,wn){const S=streak;for(let i=0;i<S.n;i++){const q=S.Q[i];let a=0;if(q.on){q.age+=dt;if(q.age>q.life||q.y<hAt(q.x,q.z).y-.05)q.on=0;else{q.vy-=4.2*dt;const dk=Math.exp(-dt*q.dr);q.vx=q.vx*dk+wn*.25*dt;q.vz*=dk;q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;const u=q.age/q.life;a=q.a*(1-u*u)*Math.min(1,q.age*20)}}
  for(let c=0;c<4;c++){const j=(i*4+c)*3;S.P[j]=q.x;S.P[j+1]=q.y;S.P[j+2]=q.z;S.Vv[j]=q.vx;S.Vv[j+1]=q.vy;S.Vv[j+2]=q.vz;S.D[(i*4+c)*2]=q.w;S.D[(i*4+c)*2+1]=a}}
 S.g.attributes.position.needsUpdate=S.g.attributes.aV.needsUpdate=S.g.attributes.aD.needsUpdate=true}

/* ---------------- foam ribbons: wake, bow waves and the waterline ring ---------------- */
const ribMat=new T.SM({uniforms:{...U,...SKY},transparent:true,side:2,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4,
 vertexShader:`attribute float aA,aS;varying float vA,vS;varying vec3 vW;void main(){vA=aA;vS=aS;vW=position;gl_Position=projectionMatrix*viewMatrix*vec4(position,1.);}`,
 fragmentShader:`uniform sampler2D tF;uniform vec2 uFlow;uniform float uT,uBio,uFogN,uFogF,uHaze;uniform vec3 uAmb,uKey,uKeyDir,uFogC;varying float vA,vS;varying vec3 vW;${FOG}
 float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float specks(vec2 g,float t){float b=0.;for(int k=0;k<2;k++){float sc=k==0?23.:37.;vec2 q=g*sc+float(k)*13.7;vec2 c=floor(q),f=fract(q);float h=hs(c);
 vec2 o=vec2(hs(c+3.1),hs(c+7.7))*.7+.15;vec2 dd=f-o;float tw=.5+.5*sin(t*(1.6+2.4*h)+h*40.);b+=step(.48,h)*exp(-dot(dd,dd)*(70.+50.*h))*tw*tw*(k==0?1.:.75);}return b;}
 void main(){vec2 p=vW.xz+uFlow;float f=texture2D(tF,p*.95).r*.75+texture2D(tF,p*2.3+.4).r*.45;float e=1.-abs(vS);
 float m=smoothstep(.25,.85,f*(.45+.75*e)+vA*.55-.25)*vA*smoothstep(0.,.35,e)*.95*(1.-.55*min(uBio,1.));
 /* night glow: sparse twinkling specks fixed in the water, thinning out as the foam ages */
 float bio=uBio>.001?uBio*specks(p,uT)*smoothstep(.02,.45,vA)*smoothstep(0.,.3,e)*(.45+.55*smoothstep(.15,.7,f)):0.;
 float a=clamp(m+bio*.85,0.,1.);if(a<.004)discard;
 vec3 c=vec3(.93,.95,.96)*(uAmb*.95+uKey*max(uKeyDir.y,0.)*.8)*.3183;
 c=mix(c,uFogC,fogMix(length(cameraPosition-vW)));c=(c*m+vec3(.25,.88,1.)*bio*1.6)/a;gl_FragColor=vec4(c,a);
 #include <colorspace_fragment>
 }`});
class Ribbon{constructor(n,closed){this.n=n;this.closed=closed;const g=new T.BG();this.p=new Float32Array(n*2*3);this.a=new Float32Array(n*2);this.s=new Float32Array(n*2);
  for(let i=0;i<n;i++){this.s[i*2]=-1;this.s[i*2+1]=1}g.setAttribute("position",new T.BA(this.p,3));g.setAttribute("aA",new T.BA(this.a,1));g.setAttribute("aS",new T.BA(this.s,1));
  const idx=[],m=closed?n:n-1;for(let i=0;i<m;i++){const j=(i+1)%n;idx.push(i*2,j*2,i*2+1,j*2,j*2+1,i*2+1)}g.setIndex(idx);this.g=g;this.o=new T.Mesh(g,ribMat);this.o.frustumCulled=false;this.o.renderOrder=4;root.add(this.o);this.pts=[]}
 build(list){/* list: [{x,z,w,a}] */const n=Math.min(this.n,list.length),P=this.p,A=this.a;
  for(let i=0;i<this.n;i++){if(i>=n){A[i*2]=A[i*2+1]=0;continue}const q=list[i],pa=list[Math.max(0,i-1)],pb=list[Math.min(n-1,i+1)];
   let tx=pb.x-pa.x,tz=pb.z-pa.z;if(this.closed){const qa=list[(i-1+n)%n],qb=list[(i+1)%n];tx=qb.x-qa.x;tz=qb.z-qa.z}const tl=Math.hypot(tx,tz)||1,nx=-tz/tl,nz=tx/tl;
   for(let s=0;s<2;s++){const sg=s?1:-1,x=q.x+nx*q.w*.5*sg,z=q.z+nz*q.w*.5*sg,h=hAt(x,z).y;const k=(i*2+s)*3;P[k]=x;P[k+1]=h+.022;P[k+2]=z;A[i*2+s]=q.a*(1-ss(R-1.1,R-.25,Math.hypot(x,z)))}}
  this.g.attributes.position.needsUpdate=true;this.g.attributes.aA.needsUpdate=true}}
class Trail{constructor(n,life,w0,spread,alpha){this.r=new Ribbon(n,false);this.life=life;this.w0=w0;this.sp=spread;this.al=alpha;this.q=[];this.acc=0}
 step(dt,src,ux,uz,str){/* src: emit point (x,z,vx,vz) */this.acc+=dt;if(this.acc>.09){this.acc=0;this.q.unshift({x:src.x,z:src.z,vx:src.vx,vz:src.vz,age:0,s:str});if(this.q.length>this.r.n)this.q.pop()}
  const L=[];if(this.q.length)L.push({x:src.x,z:src.z,w:this.w0,a:0});
  for(const p of this.q){p.age+=dt;p.x+=(p.vx-ux)*dt;p.z+=(p.vz-uz)*dt;const k=Math.exp(-dt*.5);p.vx*=k;p.vz*=k;
   const u=p.age/this.life;if(u<1)L.push({x:p.x,z:p.z,w:this.w0+this.sp*p.age,a:this.al*p.s*Math.pow(1-u,1.4)*ss(0,.25,p.age)})}
  while(this.q.length&&this.q[this.q.length-1].age>this.life)this.q.pop();this.r.build(L)}}

/* ---------------- the galleon ---------------- */
const ship=new T.Group();ship.rotation.order="YZX";root.add(ship);
const XS=-2.45,XB=2.45;
const hbF=x=>x>1?.76*Math.pow(Math.cos(Math.min(1,(x-1)/1.45)*Math.PI/2),.8):x<-1.1?.76*(1-.42*Math.pow(Math.min(1,(-1.1-x)/1.35),1.7)):.76*(1-.012*x*x);
const kdF=x=>.56-.2*ss(1.3,2.45,x)-.06*ss(-1.6,-2.45,x);
const railF=x=>.70+.45*ss(-.35,-.8,x)+.45*ss(-1.55,-1.95,x)+.40*ss(1.4,1.8,x)+.06*ss(2,2.6,x);
const rakeF=u=>.3*ss(.72,1,u)-.11*ss(.22,0,u);
const sectF=(x,y,K,Rl)=>{if(y<0){const q=Math.min(1,-y/K);return Math.pow(Math.max(0,1-Math.pow(q,2.2)),.55)*(1-.18*ss(1.3,2.4,x))}const t=Math.max(0,(y-.3)/Math.max(.05,Rl-.3));return 1+.05*Math.sin(Math.min(1,y/.35)*Math.PI/2)-.17*Math.pow(t,1.6)};
function hullPt(u,v){const xn=XS+(XB-XS)*u,K=kdF(xn),Rl=railF(xn),y=-K+(Rl+K)*v,x=xn+rakeF(u)*y;return[x,y,Math.max(.022,hbF(xn)*sectF(xn,y,K,Rl))]}
function hwAt(x,y){let a=0,b=1;for(let i=0;i<26;i++){const m=(a+b)/2,xm=XS+(XB-XS)*m+rakeF(m)*y;xm<x?a=m:b=m}const u=(a+b)/2,xn=XS+(XB-XS)*u;if(u<=0.0005||u>=.9995)return 0;const K=kdF(xn),Rl=railF(xn);if(y>Rl||y<-K)return 0;return Math.max(0,hbF(xn)*sectF(xn,y,K,Rl))}
/* the hull floats with its waterline just under the lower wale */
const WLY=.13;
const WL=u=>{const xn=XS+(XB-XS)*u,K=kdF(xn);return K/(railF(xn)+K)};
/* hull texture in (station, girth) space so strakes follow the sheer */
const hullTex=srgbTex(canvas(1024,1024,(g,w,h)=>{const pal=["#4b3626","#563e2b","#5f4530","#463223","#523b29","#5a4231"];const NS=34;
 for(let k=0;k<NS;k++){const y0=h-(k+1)/NS*h,y1=h-k/NS*h;let x=0;while(x<w){const L=rr(70,170);g.fillStyle=pal[(rnd()*pal.length)|0];g.fillRect(x,y0,L,y1-y0);g.fillStyle="rgba(20,12,6,.55)";g.fillRect(x,y0,1.5,y1-y0);
  for(let t=0;t<3;t++){g.fillStyle=`rgba(${rnd()<.5?"30,20,10":"120,100,80"},${rr(.04,.12)})`;g.fillRect(x+rr(0,L),y0+rr(0,y1-y0),rr(10,50),rr(1,3))}x+=L}
  g.fillStyle="rgba(18,10,4,.7)";g.fillRect(0,y0,w,1.6);for(let x2=rr(0,30);x2<w;x2+=rr(30,60)){g.fillStyle="rgba(15,10,6,.6)";g.fillRect(x2,y0+3,2,2)}}
 const P=(u,y)=>{const xn=XS+(XB-XS)*u,K=kdF(xn);return h-(y+K)/(railF(xn)+K)*h};
 g.beginPath();for(let i=0;i<=200;i++){const u=i/200;g.lineTo(u*w,P(u,WLY))}g.lineTo(w,h);g.lineTo(0,h);g.closePath();g.fillStyle="rgba(22,18,14,.9)";g.fill();
 for(let i=0;i<=200;i++){const u=i/200;const y=P(u,WLY);g.fillStyle="rgba(78,86,52,.55)";g.fillRect(u*w,y-9,w/200+1,9);g.fillStyle="rgba(190,186,170,.28)";g.fillRect(u*w,y-14,w/200+1,2)}
 const wale=(f,col,th)=>{g.beginPath();for(let i=0;i<=200;i++){const u=i/200,xn=XS+(XB-XS)*u;g.lineTo(u*w,P(u,f(xn)))}g.strokeStyle=col;g.lineWidth=th;g.stroke()};
 wale(x=>.17+.10*(x/2.45)**2,"#1d140d",11);wale(x=>.47+.12*(x/2.45)**2+.12*ss(-1,-2.45,x),"#1d140d",12);
 const band=(v0,v1)=>{g.beginPath();for(let i=0;i<=200;i++)g.lineTo(i/200*w,h-v1*h);for(let i=200;i>=0;i--)g.lineTo(i/200*w,h-v0*h);g.closePath();g.fillStyle="#7a5a22";g.fill();
  for(let x=6;x<w;x+=26){g.fillStyle="#2a1d10";g.beginPath();const yc=h-(v0+v1)/2*h,r=(v1-v0)*h*.42;g.moveTo(x,yc-r);g.lineTo(x+8,yc);g.lineTo(x,yc+r);g.lineTo(x-8,yc);g.fill()}g.fillStyle="rgba(230,190,90,.35)";g.fillRect(0,h-v1*h,w,2)};
 band(.9,.955);
 const port=(x,y0,y1,s)=>{const u=(x-XS)/(XB-XS),px=u*w,ya=P(u,y1),yb=P(u,y0),hw2=(yb-ya)*.55*s;g.fillStyle="#7a2418";g.fillRect(px-hw2-3,ya-3,hw2*2+6,yb-ya+6);g.fillStyle="#0e0907";g.fillRect(px-hw2,ya,hw2*2,yb-ya);
  g.fillStyle="#3b2a1c";g.fillRect(px-hw2-3,ya-(yb-ya)*.95,hw2*2+6,(yb-ya)*.8)};
 [-.7,-.15,.4,.95,1.5].forEach(x=>port(x,.26,.4,1));[-1.25,-1.62].forEach(x=>port(x,.98,1.08,.8));[2.0].forEach(x=>port(x,.62,.72,.8));
 for(let i=0;i<70;i++){const x=rnd()*w,y=rr(.25,.75)*h;const gr=g.createLinearGradient(x,y,x,y+rr(30,110));gr.addColorStop(0,`rgba(${rnd()<.6?"40,28,16":"170,150,120"},${rr(.08,.2)})`);gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.fillRect(x,y,rr(2,5),110)}
 for(let i=0;i<300;i++){g.fillStyle=`rgba(${rnd()<.5?"25,16,8":"140,120,95"},${rr(.03,.09)})`;g.beginPath();g.arc(rnd()*w,rnd()*h,rr(4,22),0,TAU);g.fill()}}));
const deckTex=srgbTex(canvas(512,512,(g,w,h)=>{const pal=["#7a5e42","#84684b","#6f553b","#8a6e50","#664d36"];for(let y=0;y<h;y+=16){let x=-rr(0,100);while(x<w){const L=rr(90,220);g.fillStyle=pal[(rnd()*pal.length)|0];g.fillRect(x,y,L,16);g.fillStyle="rgba(30,22,14,.6)";g.fillRect(x,y,1.5,16);g.fillStyle="rgba(20,14,8,.35)";g.fillRect(x+3,y+7,2,2);g.fillRect(x+L-5,y+7,2,2);x+=L}g.fillStyle="rgba(26,18,10,.75)";g.fillRect(0,y,w,1.5)}
 for(let i=0;i<220;i++){g.fillStyle=`rgba(${rnd()<.5?"40,30,20":"190,180,160"},${rr(.03,.08)})`;g.beginPath();g.ellipse(rnd()*w,rnd()*h,rr(8,40),rr(3,10),0,0,TAU);g.fill()}},[3,3]));
const sternC=canvas(512,512,(g,w,h)=>{g.fillStyle="#3e2c1e";g.fillRect(0,0,w,h);for(let y=0;y<h;y+=14){g.fillStyle=`rgba(${rnd()<.5?"20,12,6":"90,70,50"},.25)`;g.fillRect(0,y,w,1.5)}
 const Y=y=>h-(y+.6)/2.3*h,gold="#a7822f";g.fillStyle="rgba(15,12,9,.88)";g.fillRect(0,Y(0),w,h-Y(0));
 g.fillStyle=gold;g.fillRect(0,Y(.92)-6,w,8);g.fillRect(0,Y(1.32)-6,w,8);g.fillRect(0,Y(1.62),w,7);g.fillRect(0,Y(.5)-5,w,6);
 g.fillStyle="#6b1f16";g.fillRect(0,Y(1.6),w,Y(1.36)-Y(1.6));
 g.fillStyle=gold;g.beginPath();g.ellipse(w/2,(Y(1.6)+Y(1.36))/2,62,(Y(1.36)-Y(1.6))*.42,0,0,TAU);g.fill();g.fillStyle="#6b1f16";g.beginPath();g.ellipse(w/2,(Y(1.6)+Y(1.36))/2,48,(Y(1.36)-Y(1.6))*.3,0,0,TAU);g.fill();
 for(let s=-1;s<=1;s+=2)for(let k=0;k<4;k++){g.strokeStyle=gold;g.lineWidth=4;g.beginPath();const x=w/2+s*(90+k*40),y=(Y(1.6)+Y(1.36))/2;g.arc(x,y,13,0,TAU*.75);g.stroke()}});
const win=(g,w,h,emit)=>{const Y=y=>h-(y+.6)/2.3*h;const row=(y0,y1,n,x0,x1)=>{for(let i=0;i<n;i++){const xa=x0+(x1-x0)*i/n+9,xb=x0+(x1-x0)*(i+1)/n-9;
  if(emit){g.fillStyle="#ffb35c";g.fillRect(xa,Y(y1),xb-xa,Y(y0)-Y(y1));g.fillStyle="rgba(120,50,10,.8)";g.fillRect((xa+xb)/2-1.5,Y(y1),3,Y(y0)-Y(y1));g.fillRect(xa,(Y(y1)+Y(y0))/2-1.5,xb-xa,3)}
  else{g.fillStyle="#a7822f";g.fillRect(xa-5,Y(y1)-5,xb-xa+10,Y(y0)-Y(y1)+10);g.fillStyle="#141c22";g.fillRect(xa,Y(y1),xb-xa,Y(y0)-Y(y1));g.fillStyle="rgba(160,190,200,.25)";g.fillRect(xa+3,Y(y1)+3,(xb-xa)*.35,Y(y0)-Y(y1)-6);g.fillStyle="#2a1d12";g.fillRect((xa+xb)/2-2,Y(y1),4,Y(y0)-Y(y1));g.fillRect(xa,(Y(y1)+Y(y0))/2-2,xb-xa,4)}}};
 row(1.0,1.22,5,40,w-40);row(.62,.8,2,140,w-140)};
win(sternC.getContext("2d"),512,512,false);
const sternTex=srgbTex(sternC),sternE=srgbTex(canvas(512,512,(g,w,h)=>{g.fillStyle="#000";g.fillRect(0,0,w,h);win(g,w,h,true)}));
const sailTex=srgbTex(canvas(256,256,(g,w,h)=>{g.fillStyle="#ddd0b2";g.fillRect(0,0,w,h);for(let x=0;x<w;x+=18){g.fillStyle=`rgba(${rr(150,190)|0},${rr(130,160)|0},${rr(95,120)|0},.1)`;g.fillRect(x,0,18,h);g.fillStyle="rgba(110,90,60,.32)";g.fillRect(x,0,1.5,h)}
 for(let i=0;i<5;i++){g.fillStyle=`rgba(${rr(170,210)|0},${rr(150,185)|0},${rr(110,140)|0},.55)`;const x=rr(10,220),y=rr(20,220);g.fillRect(x,y,rr(14,30),rr(14,30))}
 const gr=g.createLinearGradient(0,h*.55,0,h);gr.addColorStop(0,"rgba(90,70,40,0)");gr.addColorStop(1,"rgba(90,70,40,.32)");g.fillStyle=gr;g.fillRect(0,0,w,h);
 for(let i=0;i<40;i++){g.fillStyle=`rgba(80,64,40,${rr(.03,.08)})`;g.beginPath();g.arc(rnd()*w,rnd()*h,rr(6,30),0,TAU);g.fill()}
 g.fillStyle="rgba(70,55,35,.6)";g.fillRect(0,0,w,3);g.fillRect(0,h-3,w,3);g.fillRect(0,0,3,h);g.fillRect(w-3,0,3,h);for(let x=8;x<w;x+=12){g.fillStyle="rgba(60,48,30,.6)";g.fillRect(x,22,2,5);g.fillRect(x,44,2,5)}}));
const mats=[];const M=(p,o)=>{const m=X.Wt(p,o);mats.push(m);return m};
const mHull=M({map:hullTex,roughness:.84,side:2}),mDeck=M({map:deckTex,roughness:.88}),mWood=M({color:"#4a3524",roughness:.8}),mDark=M({color:"#2a1e15",roughness:.78}),
 mSpar=M({color:"#3b2a1c",roughness:.75}),mGold=M({color:"#9c7a33",roughness:.42,metalness:.55}),mIron=M({color:"#22201e",roughness:.5,metalness:.6}),
 mStern=M({map:sternTex,emissiveMap:sternE,emissive:new C3("#ffffff"),emissiveIntensity:0,roughness:.8}),mRed=M({color:"#5e1d14",roughness:.8});
{const ob=mHull.onBeforeCompile;mHull.onBeforeCompile=(sh,r)=>{ob.call(mHull,sh,r);Object.assign(sh.uniforms,{uWK,uWA,uWQ,uWP,uT:U.uT,uShal:U.uShal,uDeep:U.uDeep,uAmb:U.uAmb,uKey:U.uKey,uKeyDir:U.uKeyDir,tF:U.tF});
 sh.fragmentShader=WGL+"\nuniform float uT;uniform sampler2D tF;uniform vec3 uShal,uDeep,uAmb,uKey,uKeyDir;\n"+AQG+"\n"+sh.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
 {vec3 wp_,wn_;float wj_;waves(vWP.xz,wp_,wn_,wj_);float lap_=wp_.y+.04+.035*sin(vWP.x*6.+uT*1.6)*sin(vWP.z*9.-uT*1.1)+.02*sin(vWP.x*13.-uT*2.4);
  float wet_=1.-smoothstep(lap_,lap_+.08,vWP.y);diffuseColor.rgb*=1.-.48*wet_;}`).replace("#include <tonemapping_fragment>","if(vWP.y<0.)gl_FragColor.rgb=aqFog(gl_FragColor.rgb,vWP);\n#include <tonemapping_fragment>")};
 mHull.customProgramCacheKey=()=>"seahull"}
const mGlass=new T.MSM({color:"#3a2a18",emissive:new C3("#ffb860"),emissiveIntensity:.1,roughness:.3});mats.push(mGlass);
const add=(geo,mat,x,y,z,rx,ry,rz,par)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx||0,ry||0,rz||0);m.castShadow=m.receiveShadow=true;(par||ship).add(m);return m};
/* hull shell */
{const nu=MOB?40:56,nv=MOB?18:24,pos=[],uv=[],idx=[];for(const side of[1,-1]){const b=pos.length/3;for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++){const u=i/nu,v=Math.pow(j/nv,.92),[x,y,hw]=hullPt(u,v);pos.push(x,y,side*hw);uv.push(u,v)}
  for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const a=b+i*(nv+1)+j,c=a+nv+1;side>0?idx.push(a,c,a+1,c,c+1,a+1):idx.push(a,a+1,c,c,a+1,c+1)}}
 const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setAttribute("uv",new T.BA(new Float32Array(uv),2));g.setIndex(idx);g.computeVertexNormals();add(g,mHull,0,0,0);
 /* transom */const tp=[],tu=[],ti=[];const n=nv;for(let j=0;j<=n;j++){const v=Math.pow(j/n,.92),[x,y,hw]=hullPt(0,v);for(const s of[-1,1]){tp.push(x-.004,y,s*hw);tu.push(.5+s*hw/1.0,(y+.6)/2.3)}}
 for(let j=0;j<n;j++){const a=j*2;ti.push(a,a+1,a+2,a+1,a+3,a+2)}const tg=new T.BG();tg.setAttribute("position",new T.BA(new Float32Array(tp),3));tg.setAttribute("uv",new T.BA(new Float32Array(tu),2));tg.setIndex(ti);tg.computeVertexNormals();add(tg,mStern,0,0,0)}
/* decks and break bulkheads */
const DECKS=[[.47,-.85,1.8],[.92,-1.95,-.85],[1.32,-2.62,-1.95],[.86,1.8,2.7]];
const deckY=x=>x<-1.95?1.32:x<-.85?.92:x>1.8?.86:.47;
for(const[y,x0,x1]of DECKS){const pos=[],uv=[],idx=[];const n=Math.max(4,Math.round((x1-x0)/.08));let k=0;for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n,hw=Math.max(0,hwAt(x,y)-.015);pos.push(x,y,-hw,x,y,hw);uv.push(x*.45,-hw*.45,x*.45,hw*.45);if(i<n)idx.push(k,k+1,k+2,k+1,k+3,k+2);k+=2}
 const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setAttribute("uv",new T.BA(new Float32Array(uv),2));g.setIndex(idx);g.computeVertexNormals();add(g,mDeck,0,0,0)}
const bulkTex=srgbTex(canvas(256,128,(g,w,h)=>{g.fillStyle="#4d3726";g.fillRect(0,0,w,h);for(let x=0;x<w;x+=12){g.fillStyle=`rgba(${rnd()<.5?"25,16,8":"110,85,60"},.3)`;g.fillRect(x,0,1.5,h)}
 const door=x=>{g.fillStyle="#2a1c12";g.fillRect(x,h*.25,34,h*.75);g.strokeStyle="#9c7a33";g.lineWidth=3;g.strokeRect(x,h*.25,34,h*.75)};door(w*.5-17);
 for(const x of[w*.2,w*.8]){g.fillStyle="#9c7a33";g.fillRect(x-14,h*.3-3,28,30);g.fillStyle="#141c22";g.fillRect(x-11,h*.3,22,24)}g.fillStyle="#9c7a33";g.fillRect(0,0,w,5)}));
const mBulk=M({map:bulkTex,roughness:.8}),mRope=M({color:"#8f7752",roughness:.95}),mCrate=M({color:"#6e5236",roughness:.85});
for(const[x,y0,y1,f]of[[-.85,.47,.92,1],[-1.95,.92,1.32,1],[1.8,.47,.86,-1]]){const hw=Math.max(.1,hwAt(x,(y0+y1)/2)-.02);const g=new T.Plane(hw*2,y1-y0);const m=add(g,mBulk,x,(y0+y1)/2,0,0,f>0?Math.PI/2:-Math.PI/2,0);
 const rl=new T.Box(.03,.03,hw*2);add(rl,mWood,x+.02*f,y1+.24,0);for(let z=-hw+.06;z<hw;z+=.13)add(new T.Cyl(.011,.013,.24,6),mWood,x+.02*f,y1+.12,z)}
/* cap rails, channels, wales detail */
{const mk=side=>{const P=[];for(let i=0;i<=60;i++){const u=i/60,[x,y,hw]=hullPt(u,1);P.push(new V3(x,y+.012,side*hw))}return new T.Tube(new T.Curve(P),120,.024,5,false)};add(mk(1),mWood,0,0,0);add(mk(-1),mWood,0,0,0)}
/* stern details: gallery balcony, quarter galleries, taffrail, lanterns */
{const[x0]=hullPt(0,.8);const hw=hwAt(-2.5,1.0)||.45;add(new T.Box(.16,.025,hw*2+.12),mWood,x0-.09,.96,0);for(let z=-hw;z<=hw+.001;z+=.075)add(new T.Cyl(.007,.009,.17,5),mGold,x0-.15,1.05,z);add(new T.Box(.03,.02,hw*2+.12),mGold,x0-.15,1.14,0);
 for(const s of[-1,1]){const g=add(new T.Box(.42,.42,.12),mWood,-2.2,1.12,s*(hwAt(-2.2,1.1)+.04));const gw=add(new T.Plane(.3,.15),mGlass,-2.2,1.16,s*(hwAt(-2.2,1.1)+.101));gw.rotation.y=s>0?0:Math.PI;add(new T.Cone(.23,.22,8),mGold,-2.2,1.43,s*(hwAt(-2.2,1.1)+.03)).rotation.x=0}}
const LAN=[];
function lantern(x,y,z,s){const g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(s);ship.add(g);
 add(new T.Cyl(.012,.012,.22,6),mIron,0,-.13,0,0,0,0,g);add(new T.Cyl(.075,.06,.04,8),mGold,0,0,0,0,0,0,g);const gl=add(new T.Cyl(.068,.055,.16,8),mGlass,0,.1,0,0,0,0,g);
 add(new T.Cone(.09,.1,8),mGold,0,.23,0,0,0,0,g);add(new T.Sphere(.025,8,6),mGold,0,.3,0,0,0,0,g);for(let k=0;k<4;k++)add(new T.Box(.008,.17,.008),mGold,Math.cos(k*Math.PI/2)*.07,.1,Math.sin(k*Math.PI/2)*.07,0,0,0,g);LAN.push(g);return g}
{const[xs]=hullPt(0,1);lantern(xs-.06,1.86,0,1.25);lantern(xs+.02,1.8,-.36,1);lantern(xs+.02,1.8,.36,1);lantern(1.0,3.05,0,.8)}
const lanL=new T.PL(new C3("#ffb15e"),0,5,2);lanL.position.set(-2.95,1.95,0);lanL.layers.mask=L2;ship.add(lanL);
/* cannons */
for(const x of[-.7,-.15,.4,.95,1.5])for(const s of[-1,1]){const hw=hwAt(x,.33);const c=add(new T.Cyl(.022,.03,.22,8),mIron,x,.33,s*(hw+.04),Math.PI/2,0,0)}
/* bowsprit, beakhead, figurehead, anchors */
const BS0=new V3(2.25,.95,0),BSd=new V3(Math.cos(.42),Math.sin(.42),0),BS=t=>BS0.clone().addScaledVector(BSd,2.45*t);
{const g=new T.Cyl(.028,.06,2.6,10);const m=add(g,mSpar,0,0,0);m.position.copy(BS(.5));m.rotation.z=.42-Math.PI/2;
 const bk=add(new T.Cone(.13,.6,6),mWood,2.7,.55,0,0,0,-Math.PI/2+.55);add(new T.Sphere(.08,8,6),mGold,2.93,.67,0);
 for(const s of[-1,1]){const a=new T.Group();a.position.set(2.05,.5,s*(hwAt(2.05,.5)+.07));ship.add(a);add(new T.Cyl(.015,.015,.5,6),mIron,0,-.2,0,0,0,0,a);add(new T.Torus(.13,.014,6,12,Math.PI),mIron,0,-.42,0,Math.PI,0,0,a);add(new T.Box(.04,.04,.36),mIron,0,.05,0,0,0,0,a)}}
/* deck furniture: capstan, hatch, boat, bell, wheel, barrels */
{add(new T.Cyl(.08,.1,.18,10),mWood,-.45,.56,0);add(new T.Box(.5,.04,.42),mDark,.8,.49,0);for(let k=0;k<5;k++)add(new T.Box(.5,.012,.012),mWood,.8,.515,-.18+k*.09);
 const bt=new T.Group();bt.position.set(.78,.6,0);ship.add(bt);{const p=[];for(let k=0;k<=8;k++){const t=k/8;p.push(new T.V2(.16*Math.sin(t*Math.PI/2+.0001),-.1+.1*t))}const g=new T.Lathe(p,10);g.scale(3.2,1,1);add(g,mWood,0,0,0,0,0,0,bt)}
 add(new T.Box(.06,.3,.06),mWood,2.2,1.05,0);add(new T.Box(.06,.06,.26),mWood,2.2,1.2,0);add(new T.Cone(.05,.07,8,1,true),mGold,2.2,1.12,0);
 const wh=new T.Group();wh.position.set(-1.6,1.12,0);wh.rotation.y=Math.PI/2;ship.add(wh);add(new T.Torus(.11,.012,6,16),mWood,0,0,0,0,0,0,wh);for(let k=0;k<8;k++)add(new T.Box(.01,.29,.01),mWood,0,0,0,0,0,k*Math.PI/8,wh);add(new T.Box(.04,.16,.04),mWood,0,-.13,-.02,0,0,0,wh);
 for(const[x,z]of[[1.15,.42],[1.25,.3],[-.3,-.42]])add(new T.Cyl(.06,.06,.13,10),mWood,x,.535,z);
 /* gratings: a dark coaming with a lattice of battens */
 const grate=(x,y,lx,lz)=>{add(new T.Box(lx+.04,.035,lz+.04),mDark,x,y+.017,0);for(let k=1;k<6;k++){add(new T.Box(lx,.012,.012),mWood,x,y+.04,-lz/2+lz*k/6);add(new T.Box(.012,.012,lz),mWood,x-lx/2+lx*k/6,y+.036,0)}};
 grate(-.68,.47,.2,.28);grate(1.2,.47,.2,.2);grate(-1.62,.92,.18,.24);
 /* coils of rope on the deck by the bulwarks */
 const coil=(x,y,z)=>{for(let k=0;k<3;k++)add(new T.Torus(.05-k*.012,.011,5,14),mRope,x,y+.012+k*.016,z,Math.PI/2,0,0)};
 for(const[x,y]of[[.35,.47],[1.65,.47],[-.95,.92],[2.15,.86]])for(const sd of[1,-1])coil(x,y,sd*(hwAt(x,y)-.1));
 /* crates and a few more barrels */
 for(const[x,z,r]of[[.22,.36,.2],[.2,-.3,-.25],[.6,-.36,.1]])add(new T.Box(.11,.1,.11),mCrate,x,.52,z,0,r,0);add(new T.Box(.09,.08,.09),mCrate,.22,.61,.36,0,.5,0);
 for(const[x,y,z]of[[-1.85,.92,.3],[-1.85,.92,.17],[2.4,.86,-.18]])add(new T.Cyl(.05,.05,.11,10),mWood,x,y+.055,z);
 /* deck guns on carriages, run out to the bulwarks */
 for(const x of[-.65,-.1,.42])for(const sd of[1,-1]){const z=sd*(hwAt(x,.47)-.15);add(new T.Box(.13,.06,.14),mWood,x,.5,z);for(const dx of[-.05,.05])for(const dz of[-.05,.05])add(new T.Cyl(.022,.022,.015,8),mDark,x+dx,.49,z+dz,Math.PI/2,0,0);
  add(new T.Cyl(.022,.03,.24,8),mIron,x,.56,z+sd*.04,Math.PI/2,0,0)}
 /* waist rail along the inside of the bulwarks */
 for(const sd of[1,-1]){const x0=-.82,x1=1.78,N=10;for(let k=0;k<=N;k++){const x=x0+(x1-x0)*k/N;add(new T.Cyl(.008,.01,.16,5),mWood,x,.55,sd*(hwAt(x,.55)-.05))}
  const P=[];for(let k=0;k<=20;k++){const x=x0+(x1-x0)*k/20;P.push(new V3(x,.63,sd*(hwAt(x,.63)-.05)))}add(new T.Tube(new T.Curve(P),40,.012,5,false),mWood,0,0,0)}}
/* masts, tops, yards, sails, rigging */
const clothU={uST:{value:0},uSunV:{value:new V3()},uSunC:{value:new C3()}};
function clothMat(kind){const m=X.Wt({map:sailTex,roughness:.92,side:2},{snow:1,wet:1});const pu={uBil:{value:0},uFlu:{value:0},uFoot:{value:0},uReef:{value:0},uTopY:{value:0},uAx:{value:new V3(1,0,0)},uDrp:{value:0},uFW:{value:6}};
 const ob=m.onBeforeCompile;m.onBeforeCompile=(sh,r)=>{ob.call(m,sh,r);Object.assign(sh.uniforms,clothU,pu);
  const fn=kind==="flag"?`float sD(vec2 s){float x=s.x;return uBil*x*(sin(8.5*x-uST*uFW+s.y*1.3)*.75+sin(15.*x-uST*uFW*1.6+s.y*2.)*.25);}`
   :`float sD(vec2 s){float u=s.x,v=s.y;float vv=v*(1.-.42*uFoot);float d=uBil*(1.-.75*u*u)*sin(3.14159*clamp(vv,0.,1.));d+=uFlu*sin(7.*u-uST*9.+v*2.5)*(.25+.75*abs(u))*(.35+.65*v)*.07;return d*(1.-.9*uReef);}`;
  sh.vertexShader=`attribute vec2 aS;attribute vec3 aTu,aTv;uniform float uBil,uFlu,uFoot,uReef,uTopY,uST,uDrp,uFW;uniform vec3 uAx;${fn}\n`+sh.vertexShader
   .replace("#include <beginnormal_vertex>",`#include <beginnormal_vertex>
   float e_=.02,d0_=sD(aS),du_=(sD(aS+vec2(e_,0.))-d0_)/e_,dv_=(sD(aS+vec2(0.,e_))-d0_)/e_;vec3 Tu_=aTu+uAx*du_,Tv_=aTv*vec3(1.,1.-.96*uReef,1.)+uAx*dv_;vec3 nn_=normalize(cross(Tu_,Tv_));objectNormal=dot(nn_,objectNormal)<0.?-nn_:nn_;`)
   .replace("#include <begin_vertex>",`#include <begin_vertex>
   transformed.y=uTopY-(uTopY-transformed.y)*(1.-.96*uReef);transformed+=uAx*d0_;transformed.y-=uDrp*aS.x*aS.x;`);
  sh.fragmentShader="uniform vec3 uSunV,uSunC;\n"+sh.fragmentShader.replace("#include <opaque_fragment>",`{float tr_=max(0.,-dot(normal,uSunV));outgoingLight+=diffuseColor.rgb*uSunC*tr_*.1;}\n#include <opaque_fragment>`)};
 m.customProgramCacheKey=()=>"seacloth"+kind;m.userData.pu=pu;mats.push(m);return m}
/* generic cloth grid: corner function P(s,t) -> V3; s in [0,1] across, t in [0,1] down */
function clothGeo(nu,nv,P,su){const pos=[],uv=[],aS=[],aTu=[],aTv=[],idx=[],e=1e-3;for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const s=i/nu,t=j/nv,p=P(s,t),pu=P(Math.min(1,s+e),t).sub(P(Math.max(0,s-e),t)).multiplyScalar(1/((Math.min(1,s+e)-Math.max(0,s-e))*(su?2:1))),pv=P(s,Math.min(1,t+e)).sub(P(s,Math.max(0,t-e))).multiplyScalar(1/(Math.min(1,t+e)-Math.max(0,t-e)));
  pos.push(p.x,p.y,p.z);uv.push(s,1-t);aS.push(su?s*2-1:s,t);aTu.push(pu.x,pu.y,pu.z);aTv.push(pv.x,pv.y,pv.z)}
 for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+nu+1;idx.push(a,b,a+1,b,b+1,a+1)}
 const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setAttribute("uv",new T.BA(new Float32Array(uv),2));g.setAttribute("aS",new T.BA(new Float32Array(aS),2));g.setAttribute("aTu",new T.BA(new Float32Array(aTu),3));g.setAttribute("aTv",new T.BA(new Float32Array(aTv),3));g.setIndex(idx);g.computeVertexNormals();return g}
const SAILS=[],YARDS=[],PIV=[];
function squareSail(piv,top,bot,tw,bw,foot,bmax,kind){const g=clothGeo(MOB?10:14,MOB?8:12,(s,t)=>new V3(0,top-(top-bot)*t,(s*2-1)*(tw+(bw-tw)*t)/2),true);const m=clothMat("sail");m.userData.pu.uTopY.value=top;m.userData.pu.uFoot.value=foot;
 const o=new T.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;piv.add(o);const rl=add(new T.Cyl(.05,.05,tw*.92,8),M({color:"#cdbf9f",roughness:.95},{snow:1,wet:1}),0,top-.03,0,Math.PI/2,0,0,piv);rl.scale.set(0,1,0);
 const S={o,m,pu:m.userData.pu,top,bot,tw,bw,foot,bmax,kind,roll:rl,reef:0,piv};SAILS.push(S);return S}
const MASTS=[{x:1.48,base:.47,low:2.78,top:2.64,tm:4.15,tg:5.02,y:[[2.5,1.3,.98],[3.9,1.0],[4.8,.64]]},{x:.08,base:.47,low:3.02,top:2.88,tm:4.52,tg:5.52,y:[[2.74,1.46,1.05],[4.24,1.1],[5.26,.72]]},{x:-1.36,base:.92,low:2.72,top:2.6,tm:3.72,tg:0,y:[[3.46,.56]]}];
const RIG=[];const seg=(a,b)=>RIG.push(a.x,a.y,a.z,b.x,b.y,b.z);
for(const[mi,m]of MASTS.entries()){const x=m.x;
 add(new T.Cyl(.045,.058,m.low-m.base+.15,10),mSpar,x,(m.low+m.base-.15)/2,0);add(new T.Cyl(.095,.11,.05,12),mDark,x,m.base+.025,0);for(let k=0;k<6;k++){const a=k/6*TAU;add(new T.Box(.03,.07,.03),mWood,x+Math.cos(a)*.075,m.base+.06,Math.sin(a)*.075,0,-a,0)}add(new T.Cyl(.21,.19,.035,14),mWood,x+.02,m.top,0);add(new T.Torus(.205,.012,5,16),mDark,x+.02,m.top+.02,0,Math.PI/2,0,0);
 add(new T.Cyl(.028,.036,m.tm-m.top+.2,8),mSpar,x,(m.tm+m.top)/2,0);add(new T.Box(.05,.03,.4),mWood,x,m.tm-.12,0);
 if(m.tg){add(new T.Cyl(.013,.02,m.tg-m.tm+.25,6),mSpar,x,(m.tg+m.tm)/2,0);add(new T.Sphere(.03,8,6),mGold,x,m.tg+.12,0)}else add(new T.Sphere(.03,8,6),mGold,x,m.tm+.12,0);
 const piv=new T.Group();piv.position.set(x,0,0);ship.add(piv);PIV.push(piv);
 m.y.forEach(([yy,hl,foot],k)=>{const yd=add(new T.Cyl(.016,.034,hl*2,8),mSpar,0,yy,0,Math.PI/2,0,0,piv);YARDS.push({piv,y:yy,hl,mi,k});
  if(mi<2){const nb=k===0?foot:m.y[k-1][0]+.08,bw=k===0?hl*2*1.06:m.y[k-1][1]*2*.9;squareSail(piv,yy-.04,nb,hl*2*.96,bw,k===0?1:0,k===0?.32:k===1?.28:.2,k===0?"course":k===1?"top":"tg")}
  else squareSail(piv,yy-.04,m.top+.06,hl*2*.95,.44*2,0,.14,"mtop")});
 /* lower shrouds + ratlines */
 for(const s of[-1,1]){const head=new V3(x,m.top-.08,s*.05),feet=[-.42,-.24,-.06,.12].map(dx=>{const xx=x+dx,yy=railF(xx)-.05;return new V3(xx,yy,s*(hwAt(xx,yy)+.11))});
  feet.forEach(f=>seg(head,f));for(let k=0;k<3;k++)for(let t=.08;t<.92;t+=.055){const a=head.clone().lerp(feet[k],t),b=head.clone().lerp(feet[k+1],t);seg(a,b)}
  add(new T.Box(.7,.025,.1),mWood,x-.15,railF(x-.15)-.08,s*(hwAt(x-.15,railF(x-.15)-.08)+.06));
  const th=new V3(x,m.tm-.12,s*.03),tf=[-.12,0,.12].map(dx=>new V3(x+dx,m.top+.02,s*.2));tf.forEach(f=>seg(th,f));for(let k=0;k<2;k++)for(let t=.1;t<.9;t+=.11)seg(th.clone().lerp(tf[k],t),th.clone().lerp(tf[k+1],t));
  if(mi<2){seg(new V3(x,m.tm-.1,s*.03),new V3(x-.75,railF(x-.75)-.03,s*(hwAt(x-.75,railF(x-.75))+.08)))}}}
{const F=MASTS[0],Mn=MASTS[1],Z=MASTS[2],v=(x,y)=>new V3(x,y,0);
 seg(v(Mn.x,Mn.top-.05),v(F.x+.18,.55));seg(v(Mn.x,Mn.tm-.06),v(F.x,F.top+.02));seg(v(Mn.x,Mn.tg-.04),v(F.x,F.tm-.08));
 seg(v(F.x,F.top-.05),BS(.32));seg(v(F.x,F.tm-.06),BS(.92));seg(v(F.x,F.tg-.04),new V3(BS(1).x-.05,2.55,0));
 seg(v(Z.x,Z.top-.05),v(Mn.x,.75));seg(v(Z.x,Z.tm-.06),v(Mn.x,Mn.top+.05));seg(BS(.45),v(2.55,.05));seg(BS(.7),v(2.6,.3))}
/* spritsail under the bowsprit and the sprit topmast at its end */
const sprP=new T.Group();ship.add(sprP);{const p=BS(.62);sprP.position.set(p.x,0,0);add(new T.Cyl(.012,.025,1.5,8),mSpar,0,p.y-.04,0,Math.PI/2,0,0,sprP);squareSail(sprP,p.y-.07,p.y-.72,1.4,1.5,1,.16,"sprit");
 const e=BS(.98);add(new T.Cyl(.012,.02,.75,6),mSpar,e.x,e.y+.33,0);const sp2=new T.Group();ship.add(sp2);sp2.position.set(e.x,0,0);add(new T.Cyl(.01,.018,.8,6),mSpar,0,e.y+.6,0,Math.PI/2,0,0,sp2);squareSail(sp2,e.y+.57,e.y+.12,.72,.82,0,.1,"sprit2");PIV.push(sprP,sp2)}
/* mizzen lateen: triangle tack-peak-clew, billowing sideways */
const latP=new T.Group();ship.add(latP);let LAT;{const mx=MASTS[2].x,A=new V3(mx+1.0,1.45,0),B=new V3(mx-1.3,3.95,0),Cc=new V3(mx-1.2,1.5,0);
 const yd=new T.Mesh(new T.Cyl(.014,.03,A.distanceTo(B)+.2,8),mSpar);yd.position.copy(A).add(B).multiplyScalar(.5);yd.quaternion.setFromUnitVectors(new V3(0,1,0),B.clone().sub(A).normalize());yd.castShadow=true;latP.add(yd);
 const g=clothGeo(MOB?10:14,MOB?8:12,(s,t)=>A.clone().lerp(B,s).multiplyScalar(1-t*.97).addScaledVector(Cc,t*.97),true);const m=clothMat("sail");m.userData.pu.uAx.value.set(0,0,1);m.userData.pu.uTopY.value=9;
 const o=new T.Mesh(g,m);o.castShadow=true;latP.add(o);LAT={o,m,pu:m.userData.pu,A,B,C:Cc};seg(B,new V3(mx,MASTS[2].tm-.1,0))}
/* ensign and masthead pennant */
const FL=[];function flag(par,x,y,len,wid,col,kind){const g=clothGeo(kind==="pen"?20:12,kind==="pen"?2:7,(s,t)=>new V3(s*len,-t*wid*(kind==="pen"?1-s*.85:1),0),false);const m=clothMat("flag");m.map=null;m.color=new C3(col);m.userData.pu.uAx.value.set(0,0,1);
 const o=new T.Mesh(g,m);o.castShadow=true;const p=new T.Group();p.position.set(x,y,0);p.add(o);par.add(p);FL.push({p,o,pu:m.userData.pu,len,kind});return FL[FL.length-1]}
{const[xs]=hullPt(0,1);add(new T.Cyl(.012,.018,1.25,6),mSpar,xs-.22,2.15,0,0,0,.25);flag(ship,xs-.36,2.72,.62,.4,"#6b1a14","flag");flag(ship,MASTS[1].x,MASTS[1].tg+.1,1.55,.11,"#8a1c14","pen");flag(ship,MASTS[0].x,MASTS[0].tg+.1,.9,.07,"#b8a46a","pen")}
const rigG=new T.BG();rigG.setAttribute("position",new T.BA(new Float32Array(RIG),3));const rigM=new T.LBM({color:"#211810",transparent:true,opacity:.85});ship.add(new T.LS(rigG,rigM));
const dynN=64,dynP=new Float32Array(dynN*6),dynG=new T.BG();dynG.setAttribute("position",new T.BA(dynP,3));const dynL=new T.LS(dynG,rigM);dynL.frustumCulled=false;ship.add(dynL);
ship.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});

/* ---------------- ice floes (winter) ---------------- */
const floeG=(()=>{const n=15,pr=[];for(let i=0;i<n;i++){const a=(i+rr(-.25,.25))/n*TAU,r=rr(.62,1.1);pr.push([Math.cos(a)*r,Math.sin(a)*r,rr(.03,.075)])}const pos=[],col=[],idx=[];
 const P=(x,y,z,c)=>{pos.push(x,y,z);col.push(...c);return pos.length/3-1},W2=[.93,.96,.98],E=[.72,.86,.9],B=[.36,.58,.66];
 const c0=P(0,.095,0,W2),t=pr.map(([x,z,h])=>P(x,h,z,W2)),e=pr.map(([x,z,h])=>P(x*1.02,h-.035,z*1.02,E)),b=pr.map(([x,z])=>P(x*.97,-.07,z*.97,B));
 for(let i=0;i<n;i++){const k=(i+1)%n;idx.push(c0,t[k],t[i],t[i],t[k],e[i],t[k],e[k],e[i],e[i],e[k],b[i],e[k],b[k],b[i])}
 let g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setAttribute("color",new T.BA(new Float32Array(col),3));g.setIndex(idx);g=g.toNonIndexed();g.computeVertexNormals();return g})();
const NF=MOB?12:18,floes=new T.IM(floeG,M({color:"#ffffff",vertexColors:true,roughness:.42,flatShading:true},{snow:1,wet:0}),NF);floes.castShadow=floes.receiveShadow=true;floes.frustumCulled=false;root.add(floes);
const FS=[];for(let i=0;i<NF;i++){const a=rnd()*TAU,r=rr(4.6,R-1.1);FS.push({x:Math.cos(a)*r,z:Math.sin(a)*r,sx:rr(.22,.5),sz:rr(.2,.45),ry:rnd()*TAU,vr:rr(-.08,.08),g:1,y:0,q:new T.Quat()})}

/* ---------------- hail (sea version: splashes in the sea, bounces on the deck) ---------------- */
const hail=ptSys(MOB?220:360,tDot);hail.m.uniforms.uC.value.set(.95,.97,1);hail.o.renderOrder=5;root.add(hail.o);
const HS=[];for(let i=0;i<hail.n;i++)HS.push({x:0,y:-99,z:0,vx:0,vy:0,vz:0,st:0,t:0,lx:0,ly:0,lz:0,b:0});
let ringI=0,ringLast=-99;function ring(x,z,amp){const v=U.uRing.value[ringI];ringI=(ringI+1)%16;v.set(x,z,U.uT.value,amp);ringLast=U.uT.value}

/* ---------------- colour grade pass (sea only) ---------------- */
const gradeM=new T.SM({uniforms:{tDiffuse:{value:null},uCon:{value:0},uSat:{value:1},uSep:{value:0},uLift:{value:0},uVig:{value:.25},uRay:{value:0},uAsp:{value:1},uTint:{value:new V3(1,1,1)},uSun:{value:new T.V2(.5,.5)}},depthTest:false,depthWrite:false,
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
 fragmentShader:`uniform sampler2D tDiffuse;uniform float uSat,uSep,uLift,uVig,uRay,uAsp,uCon;uniform vec3 uTint;uniform vec2 uSun;varying vec2 vUv;
 float hs(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
 void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;
 if(uRay>.001){
  /* soft shafts: march toward the sun through a smooth, sun-weighted bright mask; the jitter is a
     smooth function of position (no per-pixel pattern) and the hard luminance threshold is gone,
     so neither concentric step rings nor fine radial streaks can form */
  const int NS=${MOB?10:18};vec2 d=(uSun-vUv)/float(NS)*.75;
  vec2 dq=vUv-uSun;dq.x*=uAsp;float ang=atan(dq.y,dq.x);float j=.5+.25*sin(ang*7.+length(dq)*5.)+.25*sin(ang*13.-1.7);
  vec2 p=vUv+d*j;vec3 acc=vec3(0.);float w=1.,ws=0.;
  for(int i=0;i<NS;i++){vec2 o=d*.35;vec3 s=(texture2D(tDiffuse,p).rgb*2.+texture2D(tDiffuse,p+vec2(o.y,-o.x)).rgb+texture2D(tDiffuse,p-vec2(o.y,-o.x)).rgb)*.25;
   vec2 qs=p-uSun;qs.x*=uAsp;float l=dot(s,vec3(.3,.55,.15));acc+=s*smoothstep(.45,1.5,l)*(.35+.65*exp(-dot(qs,qs)*7.))*w;ws+=w;w*=.94;p+=d;}
  c+=acc/ws*uRay*.62*exp(-dot(dq,dq)*1.5);}
 c=max(c,0.);c=.18*pow(c/.18+1e-5,vec3(1.+uCon));float L=dot(c,vec3(.2126,.7152,.0722));c=mix(c,L*vec3(1.3,.98,.6),uSep);c=mix(vec3(L),c,uSat);c*=uTint;c+=uLift*vec3(1.,.97,.9)/(1.+L*6.);
 vec2 q=vUv-.5;q.x*=uAsp;c*=1.-uVig*dot(q,q)*1.4;gl_FragColor=vec4(c,1.);}`});
const gradeQ=new T.Mesh(new T.Plane(2,2),gradeM);gradeQ.frustumCulled=false;const gradeC=new T.OC(-1,1,1,-1,0,1);
const grade={enabled:false,needsSwap:true,clear:false,renderToScreen:false,setSize(){},dispose(){},render(r,w,rd){gradeM.uniforms.tDiffuse.value=rd.texture;r.setRenderTarget(this.renderToScreen?null:w);r.render(gradeQ,gradeC)}};
Ta.insertPass(grade,Ta.passes.length-1);

/* ---------------- seasons ---------------- */
/* deep: sapphire middle, shal: turquoise toward the rim, scat: glow through the crests */
const SEAS=[{deep:"#0a3a7a",shal:"#1cb4bc",scat:"#3fd6c4",haze:.012,S:.82,sat:1.02,sep:.03,tint:[1,1.01,1],lift:.025,ray:.45,vig:.2,con:.04},
 {deep:"#06327e",shal:"#0fc0cc",scat:"#35e2d6",haze:.005,S:.66,sat:1.08,sep:0,tint:[1,1.005,1],lift:0,ray:.5,vig:.18,con:.06},
 {deep:"#0a2f72",shal:"#1898b4",scat:"#3cbcc4",haze:.009,S:1.02,sat:1,sep:.1,tint:[1.04,1,.94],lift:.008,ray:.9,vig:.32,con:.2},
 {deep:"#123a66",shal:"#3896b0",scat:"#70bcd0",haze:.012,S:1.14,sat:.78,sep:.02,tint:[.97,.99,1.04],lift:.02,ray:.4,vig:.24,con:.05}];
const WM={sun:1,cloud:1.12,lrain:1.1,mrain:1.26,hrain:1.46,rain:1.26,storm:2.2,hail:1.36,snow:1};
const st={S:.8,vs:.2,ice:0,psi:.78,ox:0,oz:0,flowX:0,flowZ:0,ft:0,t:0,gr:{con:0,sat:1,sep:0,lift:0,ray:0,vig:.2,tint:new V3(1,1,1)},
 h:0,hv:0,p:0,pv:0,r:0,rv:0,heel:0,yaw:0,bowPrev:0,rainAcc:0,bioT:0,reefC:0,reefT:0,ts:1};
const ShipC=new V3(-.25,0,.35);
const trailW=new Trail(MOB?50:70,9,.55,.16,.85),bowL=new Trail(MOB?44:56,8,.31,.15,1),bowR=new Trail(MOB?44:56,8,.31,.15,1),wl=new Ribbon(48,true);
const HULLRING=[];{const n=48;for(let i=0;i<n;i++){const a=i/n*TAU;const u=.5-.5*Math.cos(a),side=Math.sin(a)>=0?1:-1,xn=XS+(XB-XS)*u;HULLRING.push([xn+rakeF(u)*WLY+(u>.97?.03:0)+(u<.02?-.03:0),side*(Math.max(.03,hbF(xn)*sectF(xn,WLY,kdF(xn),railF(xn)))+.05),u])}}
const tmpV=new V3(),tmpV2=new V3(),tmpM=new T.M4(),tmpQ=new T.Quat(),C1=new C3(),C2=new C3(),moonFill=new C3("#9fb2d6"),gndN=new C3("#3d4a52");
const toW=(lx,ly,lz,o=tmpV)=>o.set(lx,ly,lz).applyMatrix4(ship.matrixWorld);
function wind(){return Ue.uWind.value}

/* ---------------- per-frame ---------------- */
function update(dt){if(!root.visible)return;dt=Math.min(dt,.05)*st.ts;st.t+=dt;const t=st.t;U.uT.value=t;clothU.uST.value=t;
 const sz=SEAS[Ct.season],w=Ct.weather,wn=wind(),night=qt.night,storm=w==="storm"?1:0;
 /* sea state */
 const ST=sz.S*(.5+1.3*wn)*(WM[w]||1)*(w==="snow"&&(Ct.snowLv||2)>=4?1.45:1);st.S+=(Math.min(3,ST)-st.S)*ease(.28,dt);const S=st.S;
 const q=cl(.3+.22*S,.3,.82);for(let i=0;i<NW;i++){const A=W.A0[i]*S*(i<2?1+.15*storm:1);W.A[i]=A;W.Q[i]=A>1e-5?Math.min(1.25,q/(W.k[i]*A*NW)):0}
 U.uHI.value=.5/Math.max(.05,(W.A[0]+W.A[1]+W.A[2])*.8);U.uWhite.value=ss(1.05,2.2,S)*.9+ss(.55,1,wn)*.35;U.uDet.value=.75+.5*wn+.25*Math.min(1,S-.6);U.uGlit.value=1-.55*jt.uCover.value*jt.uCover.value;
 /* the ship sails in place: the water streams past it */
 st.vs+=((.2+.62*wn)*(storm?.85:1)-st.vs)*ease(.25,dt);st.yaw=.07*Math.sin(t*.11)+.035*Math.sin(t*.27+1.3);const psi=st.psi+st.yaw,fx=Math.cos(psi),fz=-Math.sin(psi),ux=st.vs*fx,uz=st.vs*fz;
 st.flowX+=ux*dt;st.flowZ+=uz*dt;U.uFlow.value.set(st.flowX,st.flowZ);
 for(let i=0;i<NW;i++){W.ph[i]=(W.ph[i]-W.w[i]*dt+W.k[i]*(W.dx[i]*ux+W.dz[i]*uz)*dt)%TAU;W.P[i]=W.ph[i]}
 /* buoyancy from the same wave model at four hull stations */
 const sg0=.35*Math.sin(t*.021),cx=ShipC.x+.12*Math.sin(t*.05)+Math.cos(psi)*sg0,cz=ShipC.z+.1*Math.sin(t*.037+.7)-Math.sin(psi)*sg0,sx=-fz,sz2=fx,smp=(a,b)=>hAt(cx+fx*a+sx*b,cz+fz*a+sz2*b).y;
 const hb=smp(2.05,0),hs=smp(-2.0,0),hp=smp(0,-.78),hst=smp(0,.78),hc=smp(0,0);
 const tH=(hb+hs+hp+hst)*.18+hc*.28,tP=Math.atan2(hb-hs,4.05),tR=-Math.atan2(hst-hp,1.56)+st.heel;
 const n=Math.ceil(dt/(1/120)),h=dt/n;for(let k=0;k<n;k++){st.hv+=(6.2*(tH-st.h)-2*.75*2.5*st.hv)*h;st.h+=st.hv*h;st.pv+=(4.4*(tP-st.p)-2*.7*2.1*st.pv)*h;st.p+=st.pv*h;st.rv+=(3.2*(tR-st.r)-2*.55*1.8*st.rv)*h;st.r+=st.rv*h}
 ship.position.set(cx,st.h-.19,cz);ship.rotation.set(st.r,psi,st.p);ship.updateMatrixWorld(true);
 /* sails: brace to apparent wind, billow, flutter, reef in a blow */
 const awx=(wn*1.2+.15)*Math.cos(a0)-ux,awz=(wn*1.2+.15)*Math.sin(a0)-uz,lax=awx*fx+awz*fz,laz=awx*sx+awz*sz2,aw=Math.hypot(lax,laz);
 st.heel+=(cl(laz/.9,-1,1)*(.035+.07*wn)*(1-.5*st.reefC)-st.heel)*ease(.5,dt);const brace=cl(Math.atan2(laz,lax)*.8,-.6,.6);for(const p of PIV)p.rotation.y+=(-brace-p.rotation.y)*ease(.6,dt);latP.rotation.y=0;
 const fill=cl(lax/(aw+1e-4),0,1)*cl(aw/.9,0,1),gust=1+.1*Math.sin(t*.73)+.06*Math.sin(t*1.9+.4);
 st.reefT=storm?1:wn>.82?.6:0;st.reefC+=(st.reefT-st.reefC)*ease(.35,dt);
 for(const s of SAILS){const furl=s.kind==="tg"?ss(.55,.85,wn)+storm*.4:s.kind==="course"?st.reefC*.45:s.kind==="sprit2"?ss(.6,.9,wn):s.kind==="top"?st.reefC*.3:0;s.reef+=(cl(furl,0,.97)-s.reef)*ease(.5,dt);
  s.pu.uReef.value=s.reef;s.pu.uBil.value=s.bmax*(.18+.82*fill)*gust;s.pu.uFlu.value=.25+.9*(1-fill)+.8*Math.max(0,wn-.6)+storm*.5;s.roll.scale.set(Math.max(.001,s.reef),1,Math.max(.001,s.reef))}
 LAT.pu.uBil.value=.22*(.25+.75*cl(aw/.9,0,1))*Math.sign(laz||1)*gust;LAT.pu.uFlu.value=.3+.8*Math.max(0,wn-.5);
 for(const f of FL){const sp=cl(aw/.7,0,1),tgt=Math.atan2(-laz,lax);let d=tgt-f.p.rotation.y;d-=Math.round(d/TAU)*TAU;f.p.rotation.y+=d*ease(1.5,dt);
  f.pu.uBil.value=(f.kind==="pen"?.12:.07)*(.3+.7*sp);f.pu.uFW.value=4+9*sp;f.pu.uDrp.value=(1-sp)*(f.kind==="pen"?.5:.12)}
 /* running rigging follows the yards */
 {let k=0;const P=dynP,put=(a,b)=>{if(k>=dynN)return;P.set([a.x,a.y,a.z,b.x,b.y,b.z],k*6);k++};
  for(const y of YARDS){const c=Math.cos(y.piv.rotation.y),s=Math.sin(y.piv.rotation.y);for(const sg of[-1,1]){const z=sg*y.hl,arm=new V3(y.piv.position.x+s*z,y.y,c*z);
   put(arm,new V3(y.piv.position.x,y.y+.45,0));const ax=y.mi===0?MASTS[1].x:y.mi===1?MASTS[2].x:-2.5;put(arm,new V3(ax,y.mi===2?railF(-2.5):Math.min(y.y,3)-.2,sg*.1))}}
  for(const S2 of SAILS)if(S2.kind==="course"){const c=Math.cos(S2.piv.rotation.y),s=Math.sin(S2.piv.rotation.y),d=S2.pu.uBil.value*.25*(1-.9*S2.reef);for(const sg of[-1,1]){const z=sg*S2.bw/2,yb=S2.top-(S2.top-S2.bot)*(1-.96*S2.reef);const cl2=new V3(S2.piv.position.x+s*z+c*d,yb,c*z-s*d);
   put(cl2,new V3(S2.piv.position.x-.95,railF(S2.piv.position.x-.95),sg*hwAt(S2.piv.position.x-.95,railF(S2.piv.position.x-.95)-.02)));put(cl2,new V3(S2.piv.position.x+.75,railF(S2.piv.position.x+.75),sg*hwAt(S2.piv.position.x+.75,railF(S2.piv.position.x+.75)-.02)))}}
  for(;k<dynN;k++)P.fill(0,k*6,k*6+6);dynG.attributes.position.needsUpdate=true}
 /* wake, bow waves, waterline foam */
 const bowW=toW(XB+.3*WLY,WLY,0,new V3()),strn=toW(-2.45,WLY,0,new V3());
 const spd=st.vs/.55;U.uKel.value.set(bowW.x,bowW.z,fx,fz);U.uKelS.value=cl(.25+spd*.85,0,1.1)*(1-.5*st.ice);trailW.step(dt,{x:strn.x,z:strn.z,vx:0,vz:0},ux,uz,cl(.35+spd*.8,0,1.2));
 for(const[T2,sg]of[[bowL,-1],[bowR,1]]){const p=toW(1.95,0,sg*.55,new V3());T2.step(dt,{x:p.x,z:p.z,vx:sx*sg*.36*st.vs,vz:sz2*sg*.4*st.vs},ux,uz,cl(.45+spd*1.05,0,1.3))}
 {const L=[];for(const[x,z,u]of HULLRING){const p=toW(x,WLY,z,tmpV2);L.push({x:p.x,z:p.z,w:.13+.26*ss(.72,1,u),a:.34+.9*ss(.66,1,u)*cl(spd+.25,0,1.3)+.25*Math.min(1,Math.abs(st.pv)*2)})}wl.build(L)}
 /* bow spray when the bow plunges */
 {const hw=hAt(bowW.x,bowW.z).y,rel=bowW.y-hw,rv=(rel-st.bowPrev)/Math.max(dt,1e-3);st.bowPrev=rel;let nE=dt*(10+44*spd*(.45+wn))*(rel<.25?1:.25);if(rv<-.25&&rel<.3)nE+=dt*120*Math.min(1,-rv-.25);
  for(;nE>0;nE--){if(nE<1&&rnd()>nE)break;const sg=rnd()<.5?-1:1;emit(bowW.x+rr(-.08,.08),hw+.03,bowW.z+rr(-.08,.08),fx*rr(.1,.5)+sx*sg*rr(.3,.9),rr(.6,1.6)*(1+S*.25),fz*rr(.1,.5)+sz2*sg*rr(.3,.9),rr(.6,1.2),rr(.03,.07),.75)}}
 /* rim spray blown off the lip in strong wind */
 {let nE=dt*Math.max(0,wn-.45)*40;for(;nE>0;nE--){if(nE<1&&rnd()>nE)break;const a=rnd()*TAU;emit(Math.cos(a)*(R-.05),-.1,Math.sin(a)*(R-.05),Math.cos(a)*rr(.2,.6)+wn*1.4,rr(.1,.6),Math.sin(a)*rr(.2,.6)+wn*.4,rr(.8,1.6),rr(.05,.1),.45)}}
 /* rain: patter on the deck and canvas (rings on the water are in the sea shader) */
 const rain=qt.rain;U.uRain.value=rain;
 {let nE=dt*rain*(MOB?70:110);for(;nE>0;nE--){if(nE<1&&rnd()>nE)break;const lx=rr(-2.4,2.5),y=deckY(lx),hw=hwAt(lx,y);if(hw<.05)continue;const p=toW(lx,y+.01,rr(-hw,hw)*.92,tmpV2);
  for(let k=0;k<2;k++)emit(p.x,p.y,p.z,rr(-.25,.25),rr(.35,.8),rr(-.25,.25),rr(.18,.3),rr(.018,.03),.55)}}
 /* hail */
 {const HN=Math.floor((qt.hail||0)*hail.n),inv=tmpM.copy(ship.matrixWorld).invert(),up=new V3(0,1,0).applyQuaternion(ship.quaternion);for(let i=0;i<hail.n;i++){const q2=HS[i];
  if(i>=HN&&q2.st===0){q2.y=-99;continue}
  if(q2.st===0){if(q2.y<-50){const a=rnd()*TAU,r=Math.sqrt(rnd())*R*.98;q2.x=Math.cos(a)*r;q2.z=Math.sin(a)*r;q2.y=rr(4,16);q2.vy=-rr(13,18);q2.vx=wn*4;q2.vz=wn*1.2;continue}
   q2.x+=q2.vx*dt;q2.y+=q2.vy*dt;q2.z+=q2.vz*dt;if(q2.b)q2.vy-=18*dt;
   tmpV2.set(q2.x,q2.y,q2.z).applyMatrix4(inv);const lx=tmpV2.x,ly=tmpV2.y,lz=tmpV2.z,dy=deckY(lx),hw=lx>-2.6&&lx<2.65&&ly<dy+.3?hwAt(lx,dy):0;
   if(hw>.05&&Math.abs(lz)<hw&&ly<dy+.02&&ly>dy-.4){if(q2.b<2&&q2.vy<-1.2){q2.b++;const vd=q2.vx*up.x+q2.vy*up.y+q2.vz*up.z;q2.vx-=1.38*vd*up.x;q2.vy-=1.38*vd*up.y;q2.vz-=1.38*vd*up.z;q2.vx+=rr(-.6,.6);q2.vz+=rr(-.6,.6);
     const p=toW(lx,dy+.03,lz,tmpV2);q2.x=p.x;q2.y=p.y;q2.z=p.z;hailSnd(1,p.x,p.y,p.z)}else{q2.st=1;q2.t=rr(5,9);q2.lx=lx;q2.ly=dy+.02;q2.lz=lz}}
   else{const hwv=hAt(q2.x,q2.z).y;if(q2.y<hwv){if(Math.hypot(q2.x,q2.z)<R-.15){ring(q2.x,q2.z,.55);hailSnd(0,q2.x,hwv,q2.z);for(let k=0;k<4;k++)emit(q2.x,hwv+.02,q2.z,rr(-.4,.4),rr(.9,1.7),rr(-.4,.4),rr(.3,.5),rr(.02,.035),.7)}q2.y=-99;q2.b=0}}}
  else{q2.t-=dt;if(q2.t<=0||q2.ly-deckY(q2.lx)>.3){q2.st=0;q2.y=-99;q2.b=0;continue}const p=toW(q2.lx,q2.ly,q2.lz,tmpV2);q2.x=p.x;q2.y=p.y;q2.z=p.z}}
  for(let i=0;i<hail.n;i++){const q2=HS[i];hail.p[i*3]=q2.x;hail.p[i*3+1]=q2.y;hail.p[i*3+2]=q2.z;hail.a[i]=q2.y<-50?0:q2.st?Math.min(1,q2.t/2):1;hail.s[i]=q2.st?.045:.06}
  hail.g.attributes.position.needsUpdate=hail.g.attributes.aA.needsUpdate=hail.g.attributes.aS.needsUpdate=true}
 /* spray integration */
 for(let i=0;i<spray.n;i++){const q2=SP[i];if(!q2.on){spray.a[i]=0;continue}q2.age+=dt;if(q2.age>q2.life){q2.on=0;spray.a[i]=0;continue}q2.vy-=4.2*dt;q2.vx+=(wn*1.2-q2.vx)*dt*.6;q2.x+=q2.vx*dt;q2.y+=q2.vy*dt;q2.z+=q2.vz*dt;
  const u=q2.age/q2.life;spray.p[i*3]=q2.x;spray.p[i*3+1]=q2.y;spray.p[i*3+2]=q2.z;spray.a[i]=q2.a*(1-u)*Math.min(1,q2.age*12);spray.s[i]=q2.sz*(1+u*.8)}
 spray.g.attributes.position.needsUpdate=spray.g.attributes.aA.needsUpdate=spray.g.attributes.aS.needsUpdate=true;
 /* mist under the rim */
 for(let i=0;i<mist.n;i++){const m=MI[i];m.age+=dt;if(m.age>m.life){m.age=0;m.a=rnd()*TAU;m.life=rr(7,13)}const u=m.age/m.life,r=R+.3+m.vr*m.age*2.5+.7*u,y=-1.9-m.vy*m.age*2.6-u*2.6;
  mist.p[i*3]=Math.cos(m.a)*r+wn*u*1.2;mist.p[i*3+1]=y;mist.p[i*3+2]=Math.sin(m.a)*r;mist.a[i]=.42*Math.sin(Math.PI*Math.pow(u,.7))*(1-st.ice*.4);mist.s[i]=m.sz*(.6+.9*u)}
 mist.g.attributes.position.needsUpdate=mist.g.attributes.aA.needsUpdate=mist.g.attributes.aS.needsUpdate=true;
 /* droplets shaken loose from the curtains at all heights, mostly on the side facing the camera */
 {const ca=Math.atan2(De.position.z,De.position.x);for(let i=0;i<fdrop.n;i++){const q=FDp[i];q.age+=dt;if(q.age>q.life){const s=rr(.12,.8),a=ca+rr(-1.5,1.5),r=R+.01+.62*s+.08*s*s;
   q.x=Math.cos(a)*r;q.z=Math.sin(a)*r;q.y=-.12-(.04*s+5.4*s*s);const vr=rr(.15,.7);q.vx=Math.cos(a)*vr;q.vz=Math.sin(a)*vr;q.vy=-rr(.4,1.6)-s*3.;q.age=0;q.life=rr(.35,.9);q.sz=rr(.04,.11)*(1+s)}
  q.vy-=4.2*dt;q.x+=(q.vx+wn*.4)*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;const u=q.age/q.life;fdrop.p[i*3]=q.x;fdrop.p[i*3+1]=q.y;fdrop.p[i*3+2]=q.z;fdrop.a[i]=.75*(1-u)*Math.min(1,q.age*10)*(1-st.ice*.9);fdrop.s[i]=q.sz*(1+u*1.5)}
  fdrop.g.attributes.position.needsUpdate=fdrop.g.attributes.aA.needsUpdate=fdrop.g.attributes.aS.needsUpdate=true}
 for(let i=0;i<cbank.n;i++){const b=CB[i];b.a+=b.w*dt;cbank.p[i*3]=Math.cos(b.a)*b.r;cbank.p[i*3+1]=b.y+.3*Math.sin(t*.07+b.ph);cbank.p[i*3+2]=Math.sin(b.a)*b.r;cbank.a[i]=.3+.08*Math.sin(t*.05+b.ph*2.);cbank.s[i]=b.sz}
 cbank.g.attributes.position.needsUpdate=cbank.g.attributes.aA.needsUpdate=cbank.g.attributes.aS.needsUpdate=true;
 /* ice floes drift with the water and part around the hull */
 st.ice+=((Ct.season===3?1:0)-st.ice)*ease(.25,dt);U.uIce.value=st.ice*.6;
 for(let i=0;i<NF;i++){const f=FS[i];f.x-=ux*dt*.95;f.z-=uz*dt*.95;f.x+=wn*.05*dt;f.ry+=f.vr*dt;
  tmpV2.set(f.x-cx,0,f.z-cz);const along=tmpV2.x*fx+tmpV2.z*fz,side=tmpV2.x*sx+tmpV2.z*sz2,hwS=Math.abs(along)<2.7?.95*Math.sqrt(Math.max(0,1-(along/2.8)**2))+f.sx:0;
  if(hwS>0&&Math.abs(side)<hwS){const push=(hwS-Math.abs(side))*Math.min(1,dt*3)*Math.sign(side||1);f.x+=sx*push;f.z+=sz2*push}
  const r=Math.hypot(f.x,f.z);f.g=Math.min(1,f.g+dt*.5);if(r>R-.75){const a=Math.atan2(fz,fx)+rr(-1,1);f.x=Math.cos(a)*(R-1);f.z=Math.sin(a)*(R-1);f.g=0}
  const o=hAt(f.x,f.z);f.y=o.y;tmpV.set(o.nx,o.ny,o.nz).normalize();tmpQ.setFromUnitVectors(new V3(0,1,0),tmpV);f.q.slerp(tmpQ,ease(3,dt));
  const sc=st.ice*ss(0,1,f.g)*(1-ss(R-1.6,R-.8,r));tmpM.compose(tmpV.set(f.x,f.y-.012,f.z),tmpQ.copy(f.q).multiply(new T.Quat().setFromAxisAngle(new V3(0,1,0),f.ry)),tmpV2.set(f.sx*sc+1e-4,(.7+f.sx)*sc+1e-4,f.sz*sc+1e-4));floes.setMatrixAt(i,tmpM)}
 floes.instanceMatrix.needsUpdate=true;floes.visible=st.ice>.01;
 U.uRingOn.value=U.uT.value-ringLast<2.7?1:0;
 /* falls flow (slows as it freezes) */
 st.ft+=dt*(1-.65*st.ice);fallU.uFT.value=st.ft;
 /* lights shared with the sky */
 const open=1-Math.min(1,jt.uCover.value)*.5;dc.intensity*=1+night*2.4*open;pi.intensity*=1+night*.55*open;if(night>.02){dc.color.lerp(moonFill,Math.min(.8,night*.7*open));dc.groundColor.lerp(gndN,night*.4)}
 U.uAmb.value.copy(dc.color).multiplyScalar(dc.intensity);U.uKey.value.copy(pi.color).multiplyScalar(pi.intensity);U.uKeyDir.value.copy(pi.position).normalize();
 U.uSunCol.value.copy(jt.sunCol.value);U.uMoonC.value.set(.75,.82,1).multiplyScalar(night*(.6+.4*open));
 /* the bowl hangs in clear sky: keep the air between it and a far camera clear unless the weather closes in */
 {const fk=1-.75*Math.max(storm,rain*.6);Jt.fog.near=Math.max(Jt.fog.near,70*fk);Jt.fog.far=Math.max(Jt.fog.far,240*fk)}
 U.uFogC.value.copy(Jt.fog.color);U.uFogN.value=Jt.fog.near;U.uFogF.value=Jt.fog.far;
 {const lit=C1.copy(U.uAmb.value).multiplyScalar(.95).add(C2.copy(U.uKey.value).multiplyScalar(Math.max(U.uKeyDir.value.y,0)*.8)).multiplyScalar(.3183);
  spray.m.uniforms.uC.value.copy(lit).multiplyScalar(.95);hail.m.uniforms.uC.value.copy(lit).multiplyScalar(1.1);fdrop.m.uniforms.uC.value.copy(lit).multiplyScalar(1.05);mist.m.uniforms.uC.value.copy(lit).multiplyScalar(.9).lerp(U.uFogC.value,.35);cbank.m.uniforms.uC.value.copy(lit).multiplyScalar(.85).lerp(U.uFogC.value,.5);
  blowS.m.uniforms.uC.value.copy(lit).multiplyScalar(1.05);
  /* whale water: near-white with a hint of sky, only as bright as the light, never tinted by it */
  const lum=Math.min(1.1,Math.max(.04,(.2126*lit.r+.7152*lit.g+.0722*lit.b)*1.25)),tp=jt.top.value,tm=Math.max(tp.r,tp.g,tp.b,1e-3);
  wtrU.uWc.value.setRGB(.88+(tp.r/tm-.88)*.3,.93+(tp.g/tm-.93)*.3,.97+(tp.b/tm-.97)*.3).multiplyScalar(lum);wtrU.uAsp.value=De.aspect}
 /* season colours ease in */
 const ke=ease(.9,dt),dk=(1-.25*rain)*(1-.3*storm);U.uDeep.value.lerp(C1.set(sz.deep).multiplyScalar(dk),ke);U.uScat.value.lerp(C2.set(sz.scat).multiplyScalar(1-.3*storm),ke);U.uShal.value.lerp(C1.set(sz.shal).multiplyScalar(.6+.4*dk),ke);U.uHaze.value+=(sz.haze*(1+rain*.8)+(w==="snow"?.008:0)-U.uHaze.value)*ke;
 U.uBio.value=night*(Ct.season===1?1:Ct.season===0?.25:0)*.9;
 /* lanterns and stern windows */
 const lg=.12+night*3.4;mGlass.emissiveIntensity=lg;mStern.emissiveIntensity=night*1.6;lanL.intensity=night*2.2*(.92+.08*Math.sin(t*9)*Math.sin(t*5.3));
 toW(-2.72,1.95,0,tmpV2);U.uLanP.value.copy(tmpV2);U.uLanC.value.setRGB(1,.62,.3).multiplyScalar(night*1.6);
 const envI=.4*(1-night*.85)*(1-rain*.3);for(const m of mats)m.envMapIntensity=envI;whale.o.material.envMapIntensity=envI*.2;
 /* cloth backlight */
 tmpV2.copy(U.uKeyDir.value).transformDirection(De.matrixWorldInverse);clothU.uSunV.value.copy(tmpV2);clothU.uSunC.value.copy(U.uKey.value).multiplyScalar(.3183*(1-night*.7));
 /* grade */
 const gl=jt.uGlowA.value,gs=st.gr;const tg={sat:sz.sat-gl*.12,sep:sz.sep*(1-night*.8)+gl*.18*(1-night),lift:sz.lift,ray:sz.ray*(1-night)*(1-.5*jt.uCover.value),vig:sz.vig};
 gs.con+=((sz.con||0)*(1-night*.5)-gs.con)*ke;gs.sat+=(tg.sat-gs.sat)*ke;gs.sep+=(tg.sep-gs.sep)*ke;gs.lift+=(tg.lift-gs.lift)*ke;gs.ray+=(tg.ray-gs.ray)*ke;gs.vig+=(tg.vig-gs.vig)*ke;gs.tint.lerp(tmpV.set(...sz.tint).lerp(tmpV2.set(1.05,.98,.88),gl*.6*(1-night)),ke);
 const gu=gradeM.uniforms;gu.uCon.value=gs.con;gu.uSat.value=gs.sat;gu.uSep.value=gs.sep;gu.uLift.value=gs.lift;gu.uVig.value=gs.vig;gu.uTint.value.copy(gs.tint);gu.uAsp.value=innerWidth/innerHeight;
 tmpV.copy(jt.sunDir.value).multiplyScalar(300).add(De.position).project(De);const front=tmpV.z<1&&tmpV.z>-1;gu.uSun.value.set(tmpV.x*.5+.5,tmpV.y*.5+.5);
 gu.uRay.value=front?gs.ray*jt.uSunVis.value*(1-ss(.9,1.5,Math.max(Math.abs(tmpV.x),Math.abs(tmpV.y)))):0;
 ptScale.value=Cn.getPixelRatio()*innerHeight*.5/Math.tan(De.fov*Math.PI/360);
 const E=ENV;E.S=S;E.wn=wn;E.w=w;E.night=night;E.storm=storm;E.fill=fill;E.aw=aw;E.ux=ux;E.uz=uz;E.fx=fx;E.fz=fz;E.spd=spd;E.rain=rain;E.cx=cx;E.cz=cz;
 AQU.uDim.value+=((1-.5*storm)*(1-.3*rain)*(1-.25*night)-AQU.uDim.value)*ke;
 life(dt,E);try{sound(dt,E)}catch(e){}}

/* ---------------- sea life: dolphins, whales and gulls ---------------- */
const ENV={},LOG=[],logE=(k,p)=>{LOG.push({k,t:+st.t.toFixed(3),x:+p.x.toFixed(2),y:+p.y.toFixed(2),z:+p.z.toFixed(2)});LOG.length>60&&LOG.shift()};
const tbl=(S,V)=>s=>{let i=0;while(i<S.length-2&&s>S[i+1])i++;const k=cl((s-S[i])/(S[i+1]-S[i]),0,1),u=k*k*(3-2*k);return V[i]+(V[i+1]-V[i])*u};
/* creatures are seen through the aquarium wall: water fog, never below the sand, and a dithered fade so nothing pops */
const DITH="if(fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233)))*43758.5453)>uFd)discard;";
const lifeM=(ro,sk)=>{const m=M({vertexColors:true,roughness:ro||.34,metalness:0,side:2},{snow:0,wet:0}),ob=m.onBeforeCompile,fd={value:1};m.userData.fd=fd;
 m.onBeforeCompile=(sh,r)=>{ob.call(m,sh,r);Object.assign(sh.uniforms,{uFd:fd,uShal:U.uShal,uDeep:U.uDeep,uAmb:U.uAmb,uKey:U.uKey,uKeyDir:U.uKeyDir,tF:U.tF});
  if(sk){Object.assign(sh.uniforms,{uWK,uWA,uWQ,uWP});sh.vertexShader="attribute vec3 aO;varying vec3 vO;\n"+sh.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\nvO=aO;");
   sh.fragmentShader="varying vec3 vO;\n"+sh.fragmentShader.replace("#include <color_fragment>","#include <color_fragment>\n"+sk[0]).replace("#include <roughnessmap_fragment>","#include <roughnessmap_fragment>\n"+sk[1])}
  sh.fragmentShader=(sk?WGL+"\n":"")+"uniform float uFd;uniform sampler2D tF;uniform vec3 uShal,uDeep,uAmb,uKey,uKeyDir;\n"+AQG+"\n"+sh.fragmentShader.replace("#include <clipping_planes_fragment>",DITH+`if(vWP.y<${YS0.toFixed(2)}+${(YW-YS0).toFixed(2)}*min(1.,dot(vWP.xz,vWP.xz)/${(RS*RS).toFixed(2)})+.03)discard;\n#include <clipping_planes_fragment>`)
   .replace("#include <tonemapping_fragment>","gl_FragColor.rgb=mix(gl_FragColor.rgb,aqFogK(gl_FragColor.rgb,vWP,.6),smoothstep(-.02,-.35,vWP.y));\n"+(sk?
    /* wet flukes catch the sky: a Fresnel sheen where the reflection points upward */
    `{float fk_=smoothstep(2.5,2.72,vO.x);if(fk_>.01){vec3 vv_=normalize(vViewPosition),n_=normalize(normal);if(dot(n_,vv_)<0.)n_=-n_;float c_=dot(n_,vv_);vec3 r_=reflect(-vv_,n_);float up_=smoothstep(-.15,.7,dot(r_,(viewMatrix*vec4(0.,1.,0.,0.)).xyz));
     gl_FragColor.rgb+=uAmb*(.1+.6*pow(1.-c_,3.))*up_*fk_*.6;}}
`+
    /* below the local wave surface the skin sinks into the water colour, so only what breaks the surface reads as whale */
    `{vec3 wp_,wn_;float wj_;waves(vWP.xz,wp_,wn_,wj_);float dep_=wp_.y-vWP.y;vec3 wc_=aqLight(.6+max(dep_,0.)*1.5);
     gl_FragColor.rgb=mix(gl_FragColor.rgb,gl_FragColor.rgb*.45+wc_*.55,smoothstep(-.005,.05,dep_));gl_FragColor.rgb=mix(gl_FragColor.rgb,wc_*.9,smoothstep(.04,.5,dep_)*.8);}\n`:"")+"#include <tonemapping_fragment>")};m.customProgramCacheKey=()=>sk?"sealife-skin":"sealife";return m};
/* whale skin in body space (so it rides with the animal): blotchy dark blue-grey, paler flank mottles, faint scars, uneven wetness */
const WSKIN=[`float skT=smoothstep(2.55,2.7,vO.x);vec2 sq=vec2(vO.x,vO.y+vO.z);float sk1=texture2D(tF,sq*1.6).g,sk2=texture2D(tF,sq*4.2+.31).r,sk3=texture2D(tF,sq*11.+.7).g;
 float skf=1.-smoothstep(.12,.24,abs(vO.z));diffuseColor.rgb*=(.8+.34*sk1+.14*(sk3-.5))*vec3(.94,.98,1.05);
 diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*1.55+.025,smoothstep(.62,.82,sk2)*skf*(.55-.4*skT));
 float scr=texture2D(tF,vec2(vO.x*1.4+vO.z*5.,(vO.y+vO.z)*13.)).r;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.42,.46,.48),smoothstep(.018,.0,abs(scr-.5))*smoothstep(.55,.72,sk1)*.3);
 /* fluke underside: low-contrast pale blotches and dark flecks, humpback fashion */
 float skU=skT*smoothstep(-.2,-.8,vO.z);if(skU>.01){vec2 fq=vO.xy+vec2(0.,.37);float m1=texture2D(tF,fq*.9+.13).g,m2=texture2D(tF,fq*2.4+.61).r,m3=texture2D(tF,fq*6.+.3).g;
  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.66,.7,.7),skU*smoothstep(.5,.8,m1*.7+m2*.3)*.42);diffuseColor.rgb*=1.-skU*smoothstep(.66,.86,m3)*.16;}`,
 `roughnessFactor=clamp(roughnessFactor+(sk3-.5)*.3-(sk1-.5)*.15-.16*skT,.26,.85);`];
/* a tapered body of rings along a spine plus flat appendages, posed through a frame function */
class Body{constructor(L,NR,NA,prof,colF,apps){this.L=L;this.NR=NR;this.NA=NA;this.prof=prof;this.apps=apps;
  const nr=(NR+1)*NA,nv=nr+2+apps.reduce((a,p)=>a+p.v.length,0);this.P=new Float32Array(nv*3);const C=new Float32Array(nv*3),idx=[];
  for(let i=0;i<=NR;i++)for(let j=0;j<NA;j++)C.set(colF(i/NR,Math.sin(j/NA*TAU)),(i*NA+j)*3);
  C.set(colF(0,0),nr*3);C.set(colF(1,0),nr*3+3);
  for(let i=0;i<NR;i++)for(let j=0;j<NA;j++){const j2=(j+1)%NA,a=i*NA+j,b=i*NA+j2;idx.push(a,a+NA,b,b,a+NA,b+NA)}
  for(let j=0;j<NA;j++){const j2=(j+1)%NA;idx.push(nr,j,j2,nr+1,NR*NA+j2,NR*NA+j)}
  let o=nr+2;for(const p of apps){p.o=o;p.v.forEach((v,k)=>C.set(p.cs?p.cs[k]:p.c,(o+k)*3));for(const t of p.t)idx.push(o+t[0],o+t[1],o+t[2]);o+=p.v.length}
  const g=new T.BG();g.setAttribute("position",new T.BA(this.P,3));g.setAttribute("color",new T.BA(C,3));g.setIndex(idx);this.g=g;
  {const O=new Float32Array(nv*3);for(let i=0;i<=NR;i++){const[rw,rh]=prof(i/NR);for(let j=0;j<NA;j++){const a=j/NA*TAU;O.set([i/NR*L,Math.cos(a)*rw,Math.sin(a)*rh],(i*NA+j)*3)}}
   O.set([L,0,0],nr*3+3);for(const p of apps)p.v.forEach((v,k)=>O.set([p.s*L-v[0],v[1],v[2]+(p.oz?p.oz[k]:0)],(p.o+k)*3));g.setAttribute("aO",new T.BA(O,3))}
  this.o=new T.Mesh(g,lifeM(this.rough));this.o.frustumCulled=false;this.o.castShadow=true;this.o.visible=false;root.add(this.o);this.fr={p:new V3(),t:new V3(),n:new V3(),b:new V3()}}
 pose(F,roll){const P=this.P,NA=this.NA,fr=this.fr,cr=Math.cos(roll),sr=Math.sin(roll),put=(k,u,v,w)=>{const bu=u*cr-v*sr,bv=u*sr+v*cr;
   P[k]=fr.p.x+fr.t.x*w+fr.b.x*bu+fr.n.x*bv;P[k+1]=fr.p.y+fr.t.y*w+fr.b.y*bu+fr.n.y*bv;P[k+2]=fr.p.z+fr.t.z*w+fr.b.z*bu+fr.n.z*bv};
  const sv=(o)=>{o.p.copy(fr.p);o.t.copy(fr.t);o.n.copy(fr.n);o.b.copy(fr.b)},ld=(o)=>{fr.p.copy(o.p);fr.t.copy(o.t);fr.n.copy(o.n);fr.b.copy(o.b)},f0=this.f0||(this.f0={p:new V3(),t:new V3(),n:new V3(),b:new V3()}),f1=this.f1||(this.f1={p:new V3(),t:new V3(),n:new V3(),b:new V3()});
  for(let i=0;i<=this.NR;i++){const s=i/this.NR;F(s,fr);i===0&&sv(f0);i===this.NR&&sv(f1);const[rw,rh,dy,tb,kb]=this.prof(s);for(let j=0;j<NA;j++){const a=j/NA*TAU,sa=Math.sin(a);put((i*NA+j)*3,Math.cos(a)*rw,sa*rh*(sa<0?.92:1)+dy+(tb?tb*Math.pow(Math.max(sa,0),12):0)-(kb?kb*Math.pow(Math.max(-sa,0),12):0),0)}}
  const nr=(this.NR+1)*NA;ld(f0);put(nr*3,0,this.prof(0)[2],this.L*.012);ld(f1);put(nr*3+3,0,this.prof(1)[2],-this.L*.01);
  for(const p of this.apps){p.s>=1?ld(f1):p.s<=0?ld(f0):F(p.s,fr);p.v.forEach((v,k)=>put((p.o+k)*3,v[1],v[2],v[0]))}
  this.g.attributes.position.needsUpdate=true;this.g.computeVertexNormals()}}
const hex=h=>{const c=new C3(h);return[c.r,c.g,c.b]};
const mix3=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];
/* fluke outline (t back, b lateral) as a fan from the root */
function flukeApp(k,col){const R0=[.03,0,0],O=[[-.06,.1,0],[-.2,.3,0],[-.36,.47,.03],[-.35,.33,0],[-.31,.16,0],[-.27,0,0]];const v=[R0.map(x=>x*k)],t=[];
 for(const sg of[1,-1]){const b=v.length;O.forEach(p=>v.push([p[0]*k,p[1]*k*sg,p[2]*k]));for(let i=0;i<O.length-1;i++)t.push([0,b+i,b+i+1])}return{s:1,v,t,c:col}}
/* whale (humpback-like): long white flippers, small dorsal, broad flukes */
/* lofted fin: sections of [le, te] (in [back, lateral, up]) with a thickness axis; returns an appendage with per-vertex colours */
function foil(sp,secs,K,cT,cB,mot){const M=2*K-2,v=[],t=[],cs=[],te=[],oz=[],us=[...Array(K)].map((_,k)=>(1-Math.cos(Math.PI*k/(K-1)))/2),sh=u=>Math.min(1,2.6*Math.sqrt(u)*(1-u));
 secs.forEach((S,i)=>{const P=u=>[0,1,2].map(d=>S.le[d]+(S.te[d]-S.le[d])*u);for(let m=0;m<M;m++){const top=m<K,k=top?m:2*K-2-m,u=us[k],q=P(u),h=S.th*sh(u)*(top?1:-1);
   v.push([q[0]+S.up[0]*h,q[1]+S.up[1]*h,q[2]+S.up[2]*h]);oz.push(top?0:-1);const c=top?cT:cB,n=mot?mot(i/(secs.length-1),u,top):0;cs.push(mix3(c,n>0?[.86,.89,.88]:[.1,.12,.13],Math.abs(n)))}
  te.push(i*M+K-1);if(i)for(let m=0;m<M;m++){const a=(i-1)*M+m,b=(i-1)*M+(m+1)%M,c=i*M+m,d=i*M+(m+1)%M;t.push([a,c,b],[b,c,d])}});return{s:sp,v,t,cs,te,oz}}
const hsh=(a,b)=>{const x=Math.sin(a*127.1+b*311.7)*43758.5453;return x-Math.floor(x)};
/* whale (humpback-like): broad flat head, deep body, keeled tail stock, long pale flippers, small dorsal on a hump, wide notched flukes */
const WLN=2.7,WR=.27,WS=[0,.03,.08,.15,.25,.36,.48,.6,.7,.8,.88,.94,1],wRW=tbl(WS,[.24,.58,.78,.91,1,1,.93,.78,.55,.33,.2,.14,.12]),wRH=tbl(WS,[.17,.42,.6,.79,.92,.97,.94,.84,.72,.6,.52,.42,.27]);
const wTop=hex("#333d45"),wFl=hex("#3a454c"),wBel=hex("#8a9599"),wSpot=hex("#b3babb"),wFin=hex("#c9cfcf");
const wProf=s=>{const rw=WR*wRW(s),rh=WR*wRH(s),kl=WR*.24*ss(.68,.86,s)*(1-.65*ss(.94,1,s)),kn=WR*.035*ss(.68,.72,s)*(1-ss(.86,.9,s))*Math.pow(Math.max(0,Math.sin((s-.68)/.2*Math.PI*5)),2);
 return[rw,rh,-rh*.14*(1-ss(.05,.25,s)),WR*.13*Math.exp(-Math.pow((s-.63)/.065,2))+kl+kn,kl*.85]};
/* dark back, paler mottled belly with throat pleats, pale knobs (tubercles) on the head */
const wCol=(s,sa)=>{const k=ss(.2,-.75,sa)*(1-.35*ss(.7,.9,s)),h=hsh(s*41.3,sa*9.7),c=mix3(mix3(wTop,wFl,ss(.55,.05,sa)),wBel,k);
 let o=mix3(c,k>.3?wSpot:wFl,(k>.3?Math.pow(h,5)*.45:Math.pow(h,6)*.35)*(1-ss(.5,.68,s)));if(sa<-.35&&s>.03&&s<.42)o=mix3(o,wTop,.35*Math.pow(.5+.5*Math.cos(Math.asin(sa)*46),3));
 if(sa>.55&&s<.14&&h>.8)o=mix3(o,wSpot,.55);
 /* tail stock keels: a pale crest line with darker flanks either side, so the ridge reads face-on */
 const kz=ss(.7,.82,s),as=Math.abs(sa);if(kz>0){o=mix3(o,[0,0,0],.35*kz*ss(.55,.82,as)*(1-ss(.9,.97,as)));o=mix3(o,mix3(wFl,wSpot,.45),.6*kz*ss(.92,.99,as))}return o};
const WFK=(()=>{const NS=MOB?19:31,HS=.47,out=[];for(const sg of[1,-1]){const secs=[];for(let i=0;i<NS;i++){const v=1-Math.pow(1-i/(NS-1),1.3),xl=.08-.42*Math.pow(v,1.6),
  /* chord closes on a rounded tip; the trailing edge carries the central notch and soft scallops, humpback fashion */
  ch=(.37-.17*v)*Math.sqrt(Math.max(0,1-Math.pow(v,4)))+.004,sc=(.0035+.004*hsh(Math.floor(v*7),sg))*Math.pow(Math.sin(v*Math.PI*7),2)*ss(.08,.2,v)*(1-ss(.84,.96,v)),
  xt=Math.min(xl-.004,xl-ch+.05*Math.exp(-v*v/.003)+sc),zl=.05*v*v+.012*v,zt=zl-.022*v*(1-.4*v);
  secs.push({le:[xl,sg*HS*v,zl],te:[xt,sg*HS*v,zt],th:.075*Math.pow(1-v,1.15)+.008,up:[0,0,1]})}
 /* top dark grey like the back; underside paler, greying toward the trailing margin and the tips */
 out.push(foil(1,secs,MOB?7:10,hex("#434f57"),hex("#66727a"),(v,u,top)=>top?-.12*ss(.8,1,u):-.28*ss(.72,.97,u)-.2*ss(.86,1,v)))}return out})();
const WPE=[1,-1].map(sg=>{const NS=MOB?6:8,secs=[];for(let i=0;i<NS;i++){const v=i/(NS-1),px=.02-.5*v,py=sg*(.17+.58*v),pz=-.1-.26*v-.06*v*v,ch=.16*(1-.55*v)+.02,kn=.012*Math.pow(Math.sin(v*Math.PI*6),2);
  secs.push({le:[px+.05+kn,py,pz],te:[px+.05-ch,py,pz+.02],th:.026*(1-v)+.005,up:[0,-sg*.45,.89]})}return foil(.27,secs,MOB?5:6,hex("#9aa2a3"),wFin,(v,u,top)=>top&&hsh(v*13,u*7)>.7?-.35:0)});
const WDF=(()=>{const s=.66,top=WR*wRH(s)+WR*.11*Math.exp(-Math.pow((s-.64)/.06,2))+wProf(s)[2],secs=[];for(let i=0;i<5;i++){const v=i/4;secs.push({le:[.05-.13*Math.pow(v,1.3),0,top-.03+.1*v],te:[-.14+.05*v,0,top-.03+.08*v],th:.022*(1-v)+.003,up:[0,1,0]})}return foil(s,secs,5,wTop,wTop)})();
for(const f of[...WPE,WDF])delete f.oz;
const whale=new Body(WLN,MOB?42:58,MOB?16:24,wProf,wCol,[...WFK,...WPE,WDF]);whale.o.material=lifeM(.52,WSKIN);
/* bottlenose dolphin (about 2.5 m against the galleon): short beak under a rounded melon, fusiform body, keeled tail stock;
   falcate dorsal, curved pectorals and crescent flukes are lofted with real thickness; grey cape, paler flanks, white belly */
const DL=.38,DR=.042,DS=[0,.03,.06,.09,.13,.2,.32,.45,.58,.7,.8,.88,.94,1],dRH=tbl(DS,[.1,.2,.25,.4,.66,.88,1,.97,.82,.6,.43,.32,.24,.13]),dRW=tbl(DS,[.1,.2,.24,.38,.62,.84,.95,.92,.76,.5,.3,.2,.14,.08]);
const dProf=s=>{const rh=DR*dRH(s),kl=DR*.3*ss(.7,.84,s)*(1-.6*ss(.93,1,s));return[DR*dRW(s),rh,-DR*.32*(1-ss(.06,.15,s))+DR*.04*Math.exp(-Math.pow((s-.11)/.04,2)),kl,kl*.7]};
const dTop=hex("#26303a"),dFl=hex("#5f6c76"),dBel=hex("#f1f1ec");
const dCol=(s,sa)=>{const cape=ss(.3,.75,sa)*ss(.12,.25,s)*(1-ss(.7,.85,s));let c=mix3(mix3(dFl,dTop,ss(-.05,.45,sa)),hex("#1d252d"),cape*.7);c=mix3(c,dBel,ss(-.02,-.42,sa)*(1-.55*ss(.78,.96,s)));return c};
const dFins=()=>{const K=MOB?4:5,F=[];
 {const s=.5,top=DR*dRH(s)+dProf(s)[2],secs=[];for(let i=0;i<6;i++){const v=i/5,le=DL*(.06-.13*Math.pow(v,1.4));secs.push({le:[le,0,top-.004+DL*.1*v],te:[Math.min(le-DL*.012,DL*(-.085+.035*Math.sin(Math.PI*v))),0,top-.004+DL*.095*v],th:DL*.016*(1-v)+.001,up:[0,1,0]})}
  F.push(foil(s,secs,K,dTop,dTop))}
 for(const sg of[1,-1]){const secs=[];for(let i=0;i<5;i++){const v=i/4,le=DL*(.035-.11*Math.pow(v,1.2)),y=sg*(DR*.6+DL*.085*v),z=-DR*.5-DL*.045*v;secs.push({le:[le,y,z],te:[le-DL*(.085*(1-.75*v)+.008),y,z+DL*.006],th:DL*.014*(1-v)+.0012,up:[0,-sg*.4,.92]})}
  F.push(foil(.25,secs,K,dTop,dFl))}
 for(const sg of[1,-1]){const secs=[],HS=DL*.135;for(let i=0;i<7;i++){const v=i/6,le=DL*(.025-.1*Math.pow(v,1.7));secs.push({le:[le,sg*HS*v,0],te:[Math.min(le-DL*.006,DL*(-.07-.015*v+.012*Math.exp(-v*v/.004))),sg*HS*v,0],th:DL*.022*Math.pow(1-v,1.4)+.0015,up:[0,0,1]})}
  F.push(foil(1,secs,K,dTop,hex("#77838a")))}
 return F};
/* the body is laid along the path the head has travelled, so it follows its own arc in and out of the water */
const dSamp=(H,d,o)=>{let acc=0;for(let i=1;i<H.length;i++){const a=H[i-1],b=H[i],l=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]);if(acc+l>=d||i===H.length-1){const k=l>1e-6?(d-acc)/l:0;o.p.set(a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k);if(l>1e-6)o.t.set(a[0]-b[0],a[1]-b[1],a[2]-b[2]).divideScalar(l);return o}acc+=l}o.p.set(H[0][0],H[0][1],H[0][2]);return o};
const DTF={p:new V3(),t:new V3(1,0,0),n:new V3(),b:new V3()};
function mkDolphin(){const b=new Body(DL,MOB?20:28,MOB?10:14,dProf,dCol,dFins());b.o.material=lifeM(.28);return b}
const DOL=[...Array(4)].map(mkDolphin);
/* whale path: arc-length polyline from a pitch schedule: rise, three shallow breathing arcs (crest, under, crest), a low arch, then the dive */
const WSEG=[[2,.3],[1,0],[.85,-.35],[.85,0],[.85,.35],[.85,0],[.85,-.35],[.85,0],[.85,.35],[.85,0],[.7,.1],[1,-1.45],[2.4,-1.45]],WCR=[2,6,10],WP={x:[0],y:[0],f:[.3],su:[],du:.02};
{let x=0,y=0,ph=.3,u=0;for(const[len,pe]of WSEG){WP.su.push(u);const n=Math.max(1,Math.round(len/WP.du)),p0=ph,h=len/n;for(let i=1;i<=n;i++){const a=p0+(pe-p0)*(i-.5)/n;x+=Math.cos(a)*h;y+=Math.sin(a)*h;ph=p0+(pe-p0)*i/n;WP.x.push(x);WP.y.push(y);WP.f.push(ph)}u+=len}
 WP.L=u;WP.n=WP.x.length;let ai=0;const i0=Math.round(WP.su[10]/WP.du),i1=Math.round(WP.su[12]/WP.du);for(let i=i0;i<i1;i++)if(WP.y[i]>WP.y[ai]||ai<i0)ai=i;WP.apex=ai*WP.du;WP.cy=WP.y[Math.round(WP.su[2]/WP.du)]}
const pAt=(u,o)=>{const n=WP.n,du=WP.du;if(u<=0){o.x=u*Math.cos(.3);o.y=u*Math.sin(.3);o.f=.3;return o}const fi=u/du;if(fi>=n-1){const d=u-(n-1)*du,f=WP.f[n-1];o.x=WP.x[n-1]+d*Math.cos(f);o.y=WP.y[n-1]+d*Math.sin(f);o.f=f;return o}
 const i=Math.floor(fi),k=fi-i;o.x=WP.x[i]+(WP.x[i+1]-WP.x[i])*k;o.y=WP.y[i]+(WP.y[i+1]-WP.y[i])*k;o.f=WP.f[i]+(WP.f[i+1]-WP.f[i])*k;return o};
const WH={on:0,ox:0,oz:0,hx:1,hz:0,y0:0,uh:0,v:.5,blown:0,slap:-1,slapped:0,bend:0,hold:0,sa:0,sung:0,drip:0},PO={x:0,y:0,f:0},pv=new V3();
/* the track over the water curves gently (constant curvature k) so the whale swims an arc, not a ruler line */
const WTK={x:0,z:0,dx:1,dz:0};
const wTrk=(ox,oz,hx,hz,k,l,o)=>{if(Math.abs(k)<1e-4){o.x=ox+hx*l;o.z=oz+hz*l;o.dx=hx;o.dz=hz;return o}const a=Math.atan2(-hz,hx),b=a+k*l;
 o.x=ox+(Math.sin(b)-Math.sin(a))/k;o.z=oz+(Math.cos(b)-Math.cos(a))/k;o.dx=Math.cos(b);o.dz=-Math.sin(b);return o};
/* fluke stroke: a vertical wave driven from the peduncle, head steady, growing toward the tail, gentler near the surface */
const wUnd=(s,yl,x,z)=>{const H=WH;if(!(H.ua>1e-3))return 0;const e=Math.pow(ss(.28,1,s),1.6);return H.ua*e*cl((hAt(x,z).y-yl-.05)/.35,.2,1)*Math.sin(H.uph-s*3.2)};
function whaleF(s,f){const H=WH,u=H.uh-s*WLN;if(s<=.82||H.bend<=0){pAt(u,PO);const c=Math.cos(PO.f),sn=Math.sin(PO.f);const T=wTrk(H.ox,H.oz,H.hx,H.hz,H.kp||0,PO.x,WTK),x=T.x,z=T.z,dx=T.dx,dz=T.dz,yl=H.y0+PO.y+(H.ag>0?H.ag*.14*Math.exp(-Math.pow((u-WP.apex)/.55,2)):0);
  const lf=(H.pl||0)*ss(.6,.93,s);H.pl0=lf;f.p.set(x,yl+ss(-.95,-.05,yl)*hAt(x,z).y*.85+lf,z);f.t.set(dx*c,sn,dz*c);f.n.set(-dx*sn,c,-dz*sn);f.b.set(-dz,0,dx);
  if(H.ua>1e-3){const d=wUnd(s,yl,x,z),sl=(wUnd(s+.02,yl,x,z)-wUnd(s-.02,yl,x,z))/(.04*WLN);f.p.addScaledVector(f.n,d);const tx=f.t.x,ty=f.t.y,tz=f.t.z;
   f.t.addScaledVector(f.n,-sl).normalize();f.n.set(f.n.x+tx*sl,f.n.y+ty*sl,f.n.z+tz*sl).normalize()}
  pv.copy(f.p);H.ps=s;return}
 /* tail stock bends toward vertical so the flukes stand up, then throws them back onto the water */
 pAt(u,PO);const T=wTrk(H.ox,H.oz,H.hx,H.hz,H.kp||0,PO.x,WTK),dx=T.dx,dz=T.dz,be=H.bend*H.bend*(3-2*H.bend),a=PO.f+(-1.62+H.sa-PO.f)*Math.pow((s-.82)/.18,1.4)*be,c=Math.cos(a),sn=Math.sin(a);f.t.set(dx*c,sn,dz*c);f.n.set(-dx*sn,c,-dz*sn);f.b.set(-dz,0,dx);
 if(s>H.ps){pv.addScaledVector(f.t,-(s-H.ps)*WLN);H.ps=s}f.p.copy(pv);f.p.y+=(H.pl||0)*ss(.6,.93,s)-(H.pl0||0)}
/* gulls: body, head, beak, two-part wings with black tips */
const mGB=M({color:"#f3f2ec",roughness:.7},{snow:0,wet:0}),mGK=M({color:"#d6a83a",roughness:.6},{snow:0,wet:0}),mGW=M({vertexColors:true,roughness:.75,side:2},{snow:0,wet:0});
function wingGeo(outer,sg){const g0=hex("#aab2b7"),g1=hex("#1c2023");const V=outer?[[.02,0,0],[-.05,0,0],[0,0,.07],[-.055,0,.07],[-.045,0,.145]]:[[.03,0,0],[-.045,0,0],[.022,0,.13],[-.05,0,.13]];
 const C=outer?[g0,g0,mix3(g0,g1,.5),mix3(g0,g1,.6),g1]:[g0,g0,g0,g0],I=outer?[[0,2,1],[1,2,3],[2,4,3]]:[[0,2,1],[1,2,3]];
 const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(V.flatMap(v=>[v[0],v[1],v[2]*sg])),3));g.setAttribute("color",new T.BA(new Float32Array(C.flat()),3));g.setIndex(I.flat());g.computeVertexNormals();return g}
const GW=[wingGeo(0,1),wingGeo(1,1),wingGeo(0,-1),wingGeo(1,-1)],GBd=new T.Sphere(1,10,8),GHd=new T.Sphere(.024,8,6),GBk=new T.Cone(.008,.035,6),GTl=new T.Cone(.025,.06,4);
const GU=[];for(let i=0;i<5;i++){const g=new T.Group();const b=new T.Mesh(GBd,mGB);b.scale.set(.075,.028,.03);g.add(b);const h=new T.Mesh(GHd,mGB);h.position.set(.075,.014,0);g.add(h);
 const k=new T.Mesh(GBk,mGK);k.position.set(.105,.01,0);k.rotation.z=-Math.PI/2;g.add(k);const tl=new T.Mesh(GTl,mGB);tl.position.set(-.09,0,0);tl.rotation.z=Math.PI/2;tl.scale.set(1,1,.35);g.add(tl);
 const W2=[];for(const sg of[1,-1]){const r=new T.Group();r.position.set(.01,.006,sg*.02);g.add(r);const a=new T.Mesh(GW[sg>0?0:2],mGW);r.add(a);const o=new T.Group();o.position.set(-.004,0,sg*.13);r.add(o);o.add(new T.Mesh(GW[sg>0?1:3],mGW));W2.push({r,o,sg})}
 g.visible=false;root.add(g);GU.push({g,W:W2,th:rnd()*TAU,r0:rr(1.3,2.8),a0:rr(4.4,6.6),dir:rnd()<.8?1:-1,sp:rr(1.3,1.9),ph:rnd()*TAU,p:0,fl:0,ft:rr(0,2),fp:0,call:rr(4,14),m:i%3})}
/* plume of the whale's blow (soft puffs) */
/* water sheet hanging from the raised fluke's trailing edge; it tears into strands and drops lower down */
const FSH=(()=>{const NS=WFK[0].te.length,cols=[];for(let k=NS-1;k>=0;k--)cols.push([0,k]);for(let k=1;k<NS;k++)cols.push([1,k]);const NC=cols.length,KR=9,n=NC*KR;
 const P=new Float32Array(n*3),UV=new Float32Array(n*2),F=new Float32Array(n),I=[];for(let c=0;c<NC;c++)for(let r=0;r<KR;r++){const j=c*KR+r;UV[j*2]=c/(NC-1);UV[j*2+1]=r/(KR-1);if(c<NC-1&&r<KR-1)I.push(j,j+KR,j+1,j+1,j+KR,j+KR+1)}
 const g=new T.BG();g.setAttribute("position",new T.BA(P,3));g.setAttribute("uv",new T.BA(UV,2));g.setAttribute("aF",new T.BA(F,1));g.setIndex(I);
 const m=new T.SM({uniforms:{...wtrU,tF:{value:tF},uT:U.uT},transparent:true,depthWrite:false,side:2,
  vertexShader:`attribute float aF;varying vec2 vU;varying float vF;void main(){vU=uv;vF=aF;gl_Position=projectionMatrix*viewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D tF;uniform vec3 uWc;uniform float uT;varying vec2 vU;varying float vF;
  void main(){float f=texture2D(tF,vec2(vU.x*5.3,vU.y*.5-uT*1.3)).r,f2=texture2D(tF,vec2(vU.x*13.+.4,vU.y*.9-uT*2.1)).r;
   float st=.5+.5*sin(vU.x*17.+f*5.+f2*3.);float end=.5+.5*f2*f;float a=vF*(1.-smoothstep(end-.25,end,vU.y))*(.22+.2*st+.2*f+.25*smoothstep(.15,.0,vU.y))*smoothstep(0.,.06,vU.y+.02);
   a*=1.-smoothstep(.55,.75,texture2D(tF,vec2(vU.x*7.1+.2,vU.y*1.6-uT*1.7)).g)*smoothstep(.2,.6,vU.y);
   if(a<.004)discard;gl_FragColor=vec4(mix(uWc,vec3(max(uWc.r,max(uWc.g,uWc.b))*1.3),.25+st*.35),a);
  #include <colorspace_fragment>
  }`});
 const o=new T.Mesh(g,m);o.frustumCulled=false;o.renderOrder=7;o.visible=false;root.add(o);return{o,g,P,F,cols,NC,KR,a:0}})();
/* only a few irregular sheets run off: always at the tips, plus two or three drifting patches along the trailing edge */
const fshW=(c,NC,t,sd)=>{const v=c/(NC-1),n=Math.sin(c*2.3+sd*7+t*.35)*Math.sin(c*.83+sd*3.1-t*.21);return Math.max(.5,ss(.14,0,v),ss(.86,1,v),ss(.3,.7,n))};
function flukeSheet(dt,on,E){const S=FSH;S.a+=((on?1:0)-S.a)*ease(on?6:2.5,dt);S.o.visible=S.a>.01;if(!S.o.visible)return;const W=whale.P,t=st.t,sd=WH.sd||0;
 for(let c=0;c<S.NC;c++){const[o,k]=S.cols[c],ap=WFK[o],j=(ap.o+ap.te[k])*3,x=W[j],y=W[j+1],z=W[j+2],hw=hAt(x,z).y,up=y>hw+.03,w=fshW(c,S.NC,t,sd),L=(.1+.46*w)*(.7+.3*Math.sin(c*1.7+t*1.3));
  for(let r=0;r<S.KR;r++){const v=r/(S.KR-1),i=c*S.KR+r;let yy=y-L*v;const xx=x+E.wn*.04*v-whale.f1.t.x*.05*v*v,zz=z-whale.f1.t.z*.05*v*v,hv=hAt(xx,zz).y;S.P[i*3]=xx;S.P[i*3+1]=Math.max(yy,hv);S.P[i*3+2]=zz;S.F[i]=up&&yy>hv?S.a*w:0}
  /* the sheets break into drops below their ragged ends */
  if(up&&w>.3&&rnd()<dt*(MOB?7:11)*w)emitW(x+E.wn*.04+rr(-.01,.01),y-L*rr(.6,.95),z+rr(-.01,.01),rr(-.03,.03),-rr(.3,.9),rr(-.03,.03),rr(.4,.7),rr(.007,.013),.75)}
 S.g.attributes.position.needsUpdate=S.g.attributes.aF.needsUpdate=true}
/* foam collar hugging the tail stock where it cuts the surface */
const COLR=(()=>{const NA=whale.NA,NV=3,n=(NA+1)*NV,P=new Float32Array(n*3),UV=new Float32Array(n*2),I=[];
 for(let j=0;j<=NA;j++)for(let v=0;v<NV;v++){const q=j*NV+v;UV[q*2]=j/NA;UV[q*2+1]=v/(NV-1);if(j<NA&&v<NV-1)I.push(q,q+NV,q+1,q+1,q+NV,q+NV+1)}
 const g=new T.BG();g.setAttribute("position",new T.BA(P,3));g.setAttribute("uv",new T.BA(UV,2));g.setIndex(I);
 const uA={value:0},m=new T.SM({uniforms:{tF:U.tF,uT:U.uT,uAmb:U.uAmb,uKey:U.uKey,uA},transparent:true,depthWrite:false,side:2,
  vertexShader:`varying vec2 vU;varying vec3 vW;void main(){vU=uv;vW=position;gl_Position=projectionMatrix*viewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D tF;uniform float uT,uA;uniform vec3 uAmb,uKey;varying vec2 vU;varying vec3 vW;
  void main(){float n=texture2D(tF,vW.xz*2.3+uT*vec2(.02,-.015)).g*.65+texture2D(tF,vW.xz*6.1-uT*.03).r*.35;float u=vU.y;
   float a=smoothstep(.3,.55,n+.45*(1.-u)-.1)*(1.-smoothstep(.55,1.,u))*uA;if(a<.01)discard;
   gl_FragColor=vec4(vec3(.95,.97,1.)*(uAmb*.9+uKey*.75)*.3183*1.25,a*.95);
   #include <colorspace_fragment>
  }`});
 const o=new T.Mesh(g,m);o.frustumCulled=false;o.renderOrder=6;o.visible=false;root.add(o);return{o,g,P,NA,NV,uA,a:0,on:0}})();
function collarSet(i,cx,cz){const C=COLR,W=whale.P,NA=C.NA;let mx=0,mz=0;for(let j=0;j<NA;j++){const q=(i*NA+j)*3;mx+=W[q];mz+=W[q+2]}mx/=NA;mz/=NA;
 for(let j=0;j<=NA;j++){const q=(i*NA+j%NA)*3;let dx=W[q]-mx,dz=W[q+2]-mz;const l=Math.hypot(dx,dz)||1e-4,ux=dx/l,uz=dz/l,r0=l*1.08+.012,w=.1+.06*Math.sin(j*2.7+st.t*1.3)+.04*Math.sin(j*5.1);
  for(let v=0;v<C.NV;v++){const r=r0+w*v/(C.NV-1),x=cx+ux*r,z=cz+uz*r,k=((j*C.NV)+v)*3;C.P[k]=x;C.P[k+1]=hAt(x,z).y+.012;C.P[k+2]=z}}
 C.g.attributes.position.needsUpdate=true;C.on=1}
/* slap crown: a flaring sheet of white water that rises, tears into fingers and collapses */
const CRW=(()=>{const NA=MOB?40:64,NV=8,n=(NA+1)*NV,P=new Float32Array(n*3),UV=new Float32Array(n*2),I=[];
 for(let i=0;i<=NA;i++)for(let v=0;v<NV;v++){const j=i*NV+v;UV[j*2]=i/NA;UV[j*2+1]=v/(NV-1);if(i<NA&&v<NV-1)I.push(j,j+NV,j+1,j+1,j+NV,j+NV+1)}
 const g=new T.BG();g.setAttribute("position",new T.BA(P,3));g.setAttribute("uv",new T.BA(UV,2));g.setIndex(I);
 const uA={value:0},m=new T.SM({uniforms:{...wtrU,tF:{value:tF},uA},transparent:true,depthWrite:false,side:2,
  vertexShader:`varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*viewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D tF;uniform vec3 uWc;uniform float uA;varying vec2 vU;
  void main(){float f=texture2D(tF,vec2(vU.x*7.,vU.y*.45-uA*.35)).r,f2=texture2D(tF,vec2(vU.x*17.+.3,vU.y*.8)).g;
   float top=.45+.5*f2-uA*.25;float a=(1.-smoothstep(top-.2,top,vU.y))*(.35+.65*smoothstep(.25,.6,f))*smoothstep(.0,.35,vU.y)*(1.-smoothstep(.55,1.5,uA))*smoothstep(0.,.06,uA);
   if(a<.004)discard;gl_FragColor=vec4(mix(uWc,vec3(max(uWc.r,max(uWc.g,uWc.b))*1.35),.55+.45*f),a*.62);
  #include <colorspace_fragment>
  }`});
 const o=new T.Mesh(g,m);o.frustumCulled=false;o.renderOrder=7;o.visible=false;root.add(o);return{o,g,P,NA,NV,uA,on:0,age:0,x:0,z:0}})();
function crownUpd(dt,E){const C=CRW;if(!C.on){C.o.visible=false;return}C.age+=dt;C.x-=E.ux*dt;C.z-=E.uz*dt;const a=C.age;if(a>1.6){C.on=0;C.o.visible=false;return}C.o.visible=true;C.uA.value=a;
 const r0=.3+1.05*(1-Math.exp(-a*2.6)),h=.85*Math.pow(Math.sin(Math.min(a/1.2,1)*Math.PI),.8);
 for(let i=0;i<=C.NA;i++){const an=i/C.NA*TAU,ca=Math.cos(an),sa=Math.sin(an),j0=1+.05*Math.sin(an*3+C.ph)+.035*Math.sin(an*7+C.ph*2)+.02*Math.sin(an*19+C.ph*3);
  for(let v=0;v<C.NV;v++){const k=v/(C.NV-1),r=r0*j0*(1+.4*k*k),x=C.x+ca*r,z=C.z+sa*r,j=(i*C.NV+v)*3;C.P[j]=x;C.P[j+1]=hAt(x,z).y-.02+h*k*(1-.25*k);C.P[j+2]=z}}
 C.g.attributes.position.needsUpdate=true}
const blowS=ptSys(MOB?90:150,tPuff);blowS.o.renderOrder=6;root.add(blowS.o);
const BLW=[];let blN=0;for(let i=0;i<blowS.n;i++)BLW.push({on:0,x:0,y:0,z:0,vx:0,vy:0,vz:0,age:0,life:1,sz:.2,a:.6});
function puff(x,y,z,vx,vy,vz,life,sz,a){const q=BLW[blN];blN=(blN+1)%blowS.n;Object.assign(q,{on:1,x,y,z,vx,vy,vz,age:0,life,sz,a})}
/* ---------------- aquarium life: schools of fish, reef fish, a sea turtle, flying fish ---------------- */
let spI=0;function spot(x,z,r){U.uSpot.value[spI].set(x,z,U.uT.value,r);spI=(spI+1)%6}
function fishGeo(wing){const pos=[],aT=[],idx=[],NA=8,PR=[[.5,0,0],[.4,.075,.04],[.24,.125,.062],[.04,.14,.066],[-.18,.105,.05],[-.37,.05,.024],[-.5,.022,.01]];
 PR.forEach(([x,h,w])=>{for(let j=0;j<NA;j++){const a=j/NA*TAU;pos.push(x,Math.sin(a)*h,Math.cos(a)*w);aT.push(cl(.5-x,0,1))}});
 for(let i=0;i<PR.length-1;i++)for(let j=0;j<NA;j++){const j2=(j+1)%NA,a=i*NA+j,b=i*NA+j2;idx.push(a,b,a+NA,b,b+NA,a+NA)}
 const tri=(v,t,ix)=>{const b=pos.length/3;v.forEach(p=>pos.push(p[0],p[1],p[2]));aT.push(...t);ix.forEach(k=>idx.push(b+k))};
 tri([[-.47,0,0],[-.74,.21,0],[-.66,0,0],[-.74,-.21,0]],[1,1.25,1.2,1.25],[0,1,2,0,2,3]);tri([[.12,.13,0],[-.12,.22,0],[-.2,.1,0]],[.38,.62,.7],[0,1,2]);
 if(wing){for(const s of[1,-1])tri([[.26,-.01,s*.05],[-.02,.01,s*.6],[-.26,0,s*.46],[-.08,-.01,s*.06]],[.1,.12,.15,.15],[0,1,2,0,2,3])}
 else for(const s of[1,-1])tri([[.2,-.04,s*.05],[.05,-.08,s*.16],[.08,-.05,s*.05]],[.3,.4,.4],[0,1,2]);
 const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setAttribute("aT",new T.BA(new Float32Array(aT),1));g.setIndex(idx);g.computeVertexNormals();return g}
/* silver fish: dark blue back, mirror sides that flash as the school turns; reef fish: plain bright colours */
function fishMat(met){return new T.SM({uniforms:{...AQU,uMet:{value:met}},side:2,
 vertexShader:`attribute float aT;uniform float uT;varying vec3 vW,vN,vC;varying float vY;void main(){vec3 p=position;float id=float(gl_InstanceID);float ph=uT*(6.+3.*fract(id*.618))+id*2.3;p.z+=sin(ph-p.x*5.)*.085*aT*aT;
  mat4 M=modelMatrix*instanceMatrix;vec4 w=M*vec4(p,1.);vW=w.xyz;vN=normalize(mat3(M)*normal);vY=position.y;
  #ifdef USE_INSTANCING_COLOR
  vC=instanceColor;
  #else
  vC=vec3(1.);
  #endif
  gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:AQH+`uniform float uMet;varying vec3 vW,vN,vC;varying float vY;void main(){vec3 V=normalize(cameraPosition-vW);vec3 N=normalize(vN);if(dot(N,V)<0.)N=-N;float dep=max(-vW.y,0.);vec3 att=exp(-dep*vec3(.14,.05,.035));
  vec3 Ls=uKeyDir;float dif=max(dot(N,Ls),0.)*.8+.3*(.5+.5*N.y);float bk=smoothstep(.02,.1,vY)*uMet;vec3 base=mix(vC,vC*vec3(.3,.4,.55),bk);
  vec3 c=base*(uAmb*.75+uKey*dif*.75)*.3183*att;vec3 Rf=reflect(-V,N);float up=clamp(Rf.y*.5+.5,0.,1.);
  vec3 env=mix(uShal*.6,mix(uBot,uTop,.6)*1.3,up*up)*(uAmb+uKey*.5)*.3183*att;float fl=pow(max(dot(Rf,Ls),0.),8.);
  c=mix(c,env*vC*1.25+uSunCol*uSunVis*fl*1.5*att,uMet*(1.-bk));c+=uSunCol*uSunVis*(pow(max(dot(Rf,Ls),0.),40.)*.35+caus(vW.xz,uT)*max(N.y,0.)*.35*step(vW.y,0.))*att;
  c=aqFogK(c,vW,.6);c=mix(c,uFogC,fogMix(length(cameraPosition-vW)));gl_FragColor=vec4(c,1.);
  #include <colorspace_fragment>
  }`})}
const FISH=(()=>{const nS=MOB?22:34,nR=MOB?10:16,g=fishGeo(0),sil=new T.IM(g,fishMat(1),nS*2),reef=new T.IM(g,fishMat(0),nR),c=new C3(),F=[];
 for(const o of[sil,reef]){o.frustumCulled=false;root.add(o)}
 const RC=["#ffd23f","#2f6fe8","#ff7f2a","#e05ad0","#ff4d5a","#34d1b8","#fff2c0","#7a5cff"],SC=[0,1].map(k=>({c:new V3(),v:new V3(),ph:k*3.1,dir:k?-1:1}));
 for(let i=0;i<nS*2;i++){const k=i<nS?0:1,a=k*3+rr(-.3,.3);F.push({k:0,sc:k,i,p:new V3(Math.cos(a)*4.5+rr(-.8,.8),-1.3+rr(-.3,.3),Math.sin(a)*4.5+rr(-.8,.8)),v:new V3(rr(-.3,.3),0,rr(-.3,.3)),up:new V3(0,1,0),s:rr(.2,.26)*(k?1.15:1)});
  c.setRGB(.8,.84,.88).multiplyScalar(rr(.92,1.05));sil.setColorAt(i,c)}
 for(let i=0;i<nR;i++){const[sx,sz]=REEF[i%REEF.length],x=sx+rr(-.6,.6),z=sz+rr(-.6,.6),y=floorY(x,z)+rr(.3,.7);F.push({k:1,i,p:new V3(x,y,z),v:new V3(),up:new V3(0,1,0),s:rr(.15,.2),hx:x,hy:y,hz:z,ph:rnd()*TAU});c.set(RC[i%RC.length]);reef.setColorAt(i,c)}
 return{sil,reef,F,SC,nS,nR}})();
const fA=new V3(),fS=new V3(),fT=new V3(),fX=new V3(),fY=new V3(),fZ=new V3();
function fishUpd(dt){const t=st.t,{F,SC,nS}=FISH,shp=ship.position;
 for(let k=0;k<2;k++){const S=SC[k],a=t*.045*S.dir+S.ph,r=4.2+1.6*Math.sin(t*.07+k*2),y=-1.15-.5*Math.sin(t*.09+k*1.7);S.c.set(Math.cos(a)*r,y,Math.sin(a)*r);S.v.set(0,0,0)}
 for(const f of F)if(!f.k)SC[f.sc].v.add(f.v);for(const S of SC)S.v.multiplyScalar(1/nS);
 for(const f of F){fA.set(0,0,0);const p=f.p,r=Math.hypot(p.x,p.z);
  if(!f.k){const S=SC[f.sc];fT.copy(S.c).sub(p);const dl=fT.length();fA.addScaledVector(fT,Math.min(dl,2.5)/Math.max(dl,.3)*.35);fA.addScaledVector(fS.copy(S.v).sub(f.v),.9);
   for(const g of F){if(g.k||g.sc!==f.sc||g===f)continue;const dx=p.x-g.p.x,dy=p.y-g.p.y,dz=p.z-g.p.z,d2=dx*dx+dy*dy+dz*dz;if(d2<.16&&d2>1e-6){const w=(.16-d2)/.16*3/Math.sqrt(d2);fA.x+=dx*w;fA.y+=dy*w;fA.z+=dz*w}}}
  else{fT.set(f.hx+Math.sin(t*.23+f.ph)*.7,f.hy+.18*Math.sin(t*.4+f.ph*2),f.hz+Math.cos(t*.19+f.ph)*.7).sub(p);fA.addScaledVector(fT,.8);fA.x+=Math.sin(t*1.3+f.ph*3)*.3;fA.z+=Math.cos(t*1.1+f.ph)*.3}
  /* stay in the water: under the surface, over the sand, inside the wall and clear of the keel */
  const top=-.5,bot=floorY(p.x,p.z)+.28,rw=rWall(p.y)-.6;if(p.y>top)fA.y-=(p.y-top)*8;if(p.y<bot)fA.y+=(bot-p.y)*8;if(r>rw){fA.x-=p.x/r*(r-rw)*8;fA.z-=p.z/r*(r-rw)*8}
  const sd=Math.hypot(p.x-shp.x,p.z-shp.z);if(sd<3&&p.y>-1.25)fA.y-=(3-sd)*2.5;
  f.v.addScaledVector(fA,dt);const sp=f.v.length(),lo=f.k?.06:.42,hi=f.k?.32:.9;if(sp>hi)f.v.multiplyScalar(hi/sp);else if(sp<lo)f.v.multiplyScalar(lo/Math.max(sp,1e-4));
  p.addScaledVector(f.v,dt);
  /* bank into the turn */
  fX.copy(f.v).normalize();fY.copy(fA).addScaledVector(fX,-fA.dot(fX)).multiplyScalar(.12);fY.y+=1;fY.addScaledVector(fX,-fY.dot(fX)).normalize();f.up.lerp(fY,ease(4,dt)).normalize();
  fZ.crossVectors(fX,f.up).normalize();fY.crossVectors(fZ,fX);lm.makeBasis(fX,fY,fZ).scale(fT.set(f.s,f.s,f.s)).setPosition(p);(f.k?FISH.reef:FISH.sil).setMatrixAt(f.i,lm)}
 FISH.sil.instanceMatrix.needsUpdate=FISH.reef.instanceMatrix.needsUpdate=true}
/* green sea turtle: domed carapace with scutes, pale plastron, scaled head with a beak, long front flippers */
const turtM=new T.SM({uniforms:{...AQU,uFd:{value:0}},side:2,
 vertexShader:`attribute float aK;varying vec3 vW,vN,vL;varying float vK;void main(){vL=position;vK=aK;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:AQH+`uniform float uFd;varying vec3 vW,vN,vL;varying float vK;
 float h1(float n){return fract(sin(n*91.7)*43758.55);}vec2 h2(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.55);}
 vec3 vor(vec2 p){vec2 c=floor(p),f=fract(p);float d1=8.,d2=8.,id=0.;for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 g=vec2(float(i),float(j)),r=g+h2(c+g)*.8+.1-f;float d=dot(r,r);if(d<d1){d2=d1;d1=d;id=dot(c+g,vec2(7.,113.));}else if(d<d2)d2=d;}return vec3(sqrt(d1),sqrt(d2),id);}
 void main(){${DITH}vec3 V=normalize(cameraPosition-vW);vec3 N=normalize(vN);if(dot(N,V)<0.)N=-N;vec3 alb;float spec=.25;
  if(vK<.5){vec2 q=vL.xz;
   /* five vertebral scutes down the middle, four costals each side, a ring of marginals */
   vec2 S[13];S[0]=vec2(.31,0.);S[1]=vec2(.15,0.);S[2]=vec2(-.01,0.);S[3]=vec2(-.17,0.);S[4]=vec2(-.32,0.);S[5]=vec2(.23,.19);S[6]=vec2(.07,.21);S[7]=vec2(-.09,.2);S[8]=vec2(-.25,.16);
   S[9]=vec2(.23,-.19);S[10]=vec2(.07,-.21);S[11]=vec2(-.09,-.2);S[12]=vec2(-.25,-.16);
   float d1=9.,d2=9.,id=0.;vec2 cc=vec2(0.);for(int i=0;i<13;i++){vec2 r=q-S[i];r.y*=.9;float d=length(r);if(d<d1){d2=d1;d1=d;id=float(i);cc=S[i];}else if(d<d2)d2=d;}
   float rho=length(q/vec2(q.x>0.?.46:.5,.37)),e=(d2-d1)*.5,hid=h1(id*1.37+.2);
   if(rho>.84){float an=atan(q.y,q.x)/6.2832*26.;hid=h1(floor(an)+40.);e=min((.5-abs(fract(an)-.5))*.09,(rho-.84)*.4);cc=q/rho*.92;}
   vec2 rq=q-cc;float fn=texture2D(tF,q*1.7+hid).g,strk=.5+.5*sin(atan(rq.y,rq.x)*5.+hid*30.+fn*7.+length(rq)*9.);
   alb=mix(vec3(.15,.105,.045),vec3(.6,.37,.11),smoothstep(.5,.95,strk*.45+fn*.7+hid*.2)*.9);alb*=.85+.3*fn;
   alb=mix(alb,vec3(.07,.05,.03),smoothstep(.007,.002,e)*.8);spec=.5;}
  else if(vK<1.5){alb=vec3(.9,.84,.64)*(.93+.07*sin(vL.x*40.)*sin(vL.z*30.));alb=mix(alb,vec3(.62,.54,.38),smoothstep(.03,0.,abs(fract(vL.x*6.)-.5)-.46));}
  else if(vK<3.5){vec3 v=vor(vec2(vL.x*1.1+vL.z*.6,vL.y+vL.z*.8)*(vK>2.5?34.:58.));float e=v.y-v.x,hh=h1(v.z);
   alb=mix(vec3(.13,.11,.06),vec3(.25,.2,.1),hh);alb=mix(alb,vec3(.46,.42,.28),smoothstep(.12,.04,e)*.55);if(vK>2.5)alb=mix(alb,vec3(.78,.74,.6),smoothstep(.1,-.35,N.y)*.6);}
  else{alb=vec3(.02);spec=1.;}
  float dep=max(-vW.y,0.);vec3 att=exp(-dep*vec3(.14,.05,.035)),Ls=uKeyDir;float dif=max(dot(N,Ls),0.);
  vec3 c=alb*(uAmb*(.6+.4*N.y)*.8+uKey*dif*.85)*.3183*att;c+=uSunCol*uSunVis*pow(max(dot(N,normalize(V+Ls)),0.),40.)*spec*.6*att;
  if(vW.y<0.)c*=1.+caus(vW.xz,uT)*1.6*uSunVis*max(N.y,0.)*exp(-dep*.15);
  c=aqFogK(c,vW,.35);c=mix(c,uFogC,fogMix(length(cameraPosition-vW)));gl_FragColor=vec4(c,1.);
  #include <colorspace_fragment>
 }`});
const TUR=(()=>{const g0=new T.Group();g0.visible=false;g0.rotation.order="YZX";g0.scale.setScalar(.7);root.add(g0);
 const K=(g,k)=>{g.setAttribute("aK",new T.BA(new Float32Array(g.attributes.position.count).fill(k),1));return g};
 const mk=(pos,idx,k)=>{const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setIndex(idx);g.computeVertexNormals();return K(g,k)};
 const add2=(par,g,x,y,z)=>{const m=new T.Mesh(g,turtM);m.position.set(x||0,y||0,z||0);m.frustumCulled=false;par.add(m);return m};
 {const NR=MOB?8:11,NA=MOB?24:32;for(const top of[1,0]){const pos=[],idx=[],Y=r=>top?.2*Math.pow(Math.max(0,1-r*r),.55)+.004:-.07*Math.pow(Math.max(0,1-r*r),.45);pos.push(0,Y(0),0);
  for(let j=1;j<=NR;j++){const r=j/NR;for(let i=0;i<NA;i++){const a=i/NA*TAU,c=Math.cos(a),sn=Math.sin(a),ax=c>0?.46:.5,bz=.37*(1-.22*Math.pow(Math.max(0,-c),2));pos.push(ax*r*c,Y(r)-(top?.012*Math.pow(r,8):0),bz*r*sn)}}
  for(let i=0;i<NA;i++)idx.push(0,1+(i+1)%NA,1+i);for(let j=1;j<NR;j++){const a0=1+(j-1)*NA,b0=1+j*NA;for(let i=0;i<NA;i++){const i2=(i+1)%NA;idx.push(a0+i,a0+i2,b0+i,a0+i2,b0+i2,b0+i)}}
  add2(g0,mk(pos,idx,top?0:1))}}
 const head=new T.Group();head.position.set(.4,.03,0);g0.add(head);
 add2(head,K(new T.Cyl(.055,.07,.2,10).rotateZ(Math.PI/2).translate(.05,0,0),2));const hd=new T.Group();hd.position.set(.15,0,0);head.add(hd);{const g=new T.Sphere(1,16,12),pa=g.attributes.position;for(let i=0;i<pa.count;i++){const x=pa.getX(i),k=x>0?1-.5*x:1-.12*x*x;pa.setXYZ(i,x,pa.getY(i)*k*(pa.getY(i)>0?.85:1),pa.getZ(i)*k)}g.computeVertexNormals();
  add2(hd,K(g.scale(.155,.082,.095).translate(.05,.008,0),2))}
 add2(hd,K(new T.Cone(.034,.06,8).rotateZ(-Math.PI/2).scale(1,.8,1.1).translate(.205,.006,0),2));for(const s of[1,-1])add2(hd,K(new T.Sphere(.0105,8,6).translate(.1,.036,s*.06),4));
 const flip=(L,W,sw,th,s)=>{const n=8,pos=[],idx=[];for(let i=0;i<=n;i++){const v=i/n,w=W*Math.pow(Math.sin(Math.PI*(v*.88+.08)),.7),x0=-sw*v*v,z=L*v*s,t=th*(1-v)+.006;
   pos.push(x0+w*.45,t*.5,z,x0-w*.55,t*.2,z,x0+w*.45,-t*.5,z,x0-w*.55,-t*.2,z)}
  for(let i=0;i<n;i++){const a=i*4,b=a+4;idx.push(a,b,a+1,a+1,b,b+1,a+2,a+3,b+2,a+3,b+3,b+2,a,a+2,b,a+2,b+2,b,a+1,b+1,a+3,a+3,b+1,b+3)}return mk(pos,idx,3)};
 const FL=[1,-1].map(s=>{const p=new T.Group();p.position.set(.24,0,s*.29);g0.add(p);add2(p,flip(.56,.15,.2,.035,s));return{p,s}});
 const RL=[1,-1].map(s=>{const p=new T.Group();p.position.set(-.37,-.01,s*.2);g0.add(p);add2(p,flip(.2,.1,.05,.025,s));return{p,s}});
 add2(g0,K(new T.Cone(.035,.12,6).rotateZ(Math.PI/2),2),-.55,-.01,0);
 return{g:g0,head,hd,FL,RL,on:0,t:0,dur:50,mode:0,x:0,y:-1.4,z:0,h:0,sp:.2,tb:24,ph:0,fd:0,br:0,yd:-1.5}})();
function spawnTurtle(mode){const Q=TUR;for(let tr=0;tr<40;tr++){const a=rnd()*TAU,r0=rr(4.2,5.8),x=Math.cos(a)*r0,z=Math.sin(a)*r0,h=Math.atan2(-z,-x)+(mode?(rnd()<.5?-1:1)*rr(.9,1.4):rr(-.6,.6)),sp=.2,tb=rr(16,24);
  const bx=x+Math.cos(h)*sp*tb,bz=z+Math.sin(h)*sp*tb;if(mode&&(Math.hypot(bx-ship.position.x,bz-ship.position.z)<3.4||Math.hypot(bx,bz)>R-1.8))continue;
  const yd=rr(-1.9,-1.2);Object.assign(Q,{on:1,t:0,dur:tb*2+rr(4,10),mode,x,z,y:yd,yd,h,sp,tb,ph:rnd()*TAU,fd:0,br:0});Q.g.visible=true;return 1}return 0}
function turtUpd(dt,E){const Q=TUR,sh=AQU.uTSh.value;if(!Q.on){sh.w=0;U.uTur.value.w=0;return}Q.t+=dt;const t=Q.t,r=Math.hypot(Q.x,Q.z);
 let tr=.07*Math.sin(t*.13+Q.ph);const lim=rWall(Q.y)-1.4;if(r>lim){let d=Math.atan2(-Q.z,-Q.x)-Q.h;d-=Math.round(d/TAU)*TAU;tr+=cl(d,-1,1)*.35*Math.min(1,r-lim)}Q.h+=tr*dt;
 const bm=Q.mode?ss(Q.tb-7,Q.tb-2,t)*(1-ss(Q.tb+4,Q.tb+8,t)):0,hw=hAt(Q.x,Q.z).y,sp=Q.sp*(1-.55*bm);
 const yT=Math.max(floorY(Q.x,Q.z)+.55,Q.yd+.22*Math.sin(t*.12+Q.ph))*(1-bm)+(hw-.22)*bm;const y0=Q.y;Q.y+=(yT-Q.y)*ease(.9,dt);const vy=(Q.y-y0)/Math.max(dt,1e-4);
 Q.x+=Math.cos(Q.h)*sp*dt;Q.z+=Math.sin(Q.h)*sp*dt;
 /* a slow flying stroke of the front flippers; the rear ones steer */
 Q.ph+=dt*TAU/(3.6+2.4*bm);const fp=Q.ph,amp=1-.7*bm,flap=.72*Math.sin(fp)*amp+.38*bm,yaw=(.32*Math.cos(fp)-.28)*amp-.25*bm,tw=.5*Math.cos(fp)*amp;
 for(const f of Q.FL)f.p.rotation.set(flap*f.s,yaw*f.s,tw);for(const f of Q.RL)f.p.rotation.set(.14*Math.sin(fp+1)*f.s,(.9+tr*3)*f.s,.1);
 const hl=Q.mode?ss(Q.tb-1.2,Q.tb,t)*(1-ss(Q.tb+1.4,Q.tb+2.4,t)):0;Q.head.rotation.set(0,.12*Math.sin(t*.31)*(1-hl),.25*hl+.05*Math.sin(t*.7));
 /* breathing: the body lies nearly level just under the surface, tilted a little nose-up; the neck barely extends,
    so only the crown of the head and the nostrils break the water */
 const nk=1+.1*hl;Q.head.position.x=.4;Q.head.children[0].scale.x=nk;Q.hd.position.x=.15*nk;Q.hd.rotation.z=-.08*hl;
 Q.g.position.set(Q.x,Q.y+.012*Math.sin(fp*2)*(1-bm),Q.z);Q.g.rotation.set(-tr*1.2*(1-bm),-Q.h,cl(Math.atan2(vy,sp+.05),-.45,.45)*(1-bm*.8)+.3*bm);Q.g.updateMatrixWorld(true);
 U.uTur.value.set(Q.x,Q.z,Q.h,bm*Q.fd);U.uTurF.value.set(.45+.35*Math.sin(fp),.75+.25*Math.cos(flap),0,0);
 if(hl>.5){Q.rp=(Q.rp||0)-dt;if(Q.rp<=0){Q.rp=rr(1,1.6);Q.hd.localToWorld(lw.set(.05,0,0));ring(lw.x,lw.z,.22)}}
 if(hl>.6&&!Q.br){Q.br=1;Q.hd.localToWorld(lw.set(.2,0,0));ring(lw.x,lw.z,.4);spot(lw.x,lw.z,.09);ring(lw.x,lw.z,.55);for(let i=0;i<7;i++)puff(lw.x,lw.y+.04,lw.z,rr(-.06,.06)+E.wn*.2,rr(.18,.42),rr(-.06,.06),rr(1,1.7),rr(.09,.17),.26);
  for(let i=0;i<14;i++)emitW(lw.x+rr(-.02,.02),lw.y+.03,lw.z+rr(-.02,.02),rr(-.2,.2),rr(.5,.95),rr(-.2,.2),rr(.3,.55),rr(.004,.007),.6);
  for(let i=0;i<6;i++)emitW(lw.x+rr(-.03,.03),lw.y,lw.z+rr(-.03,.03),rr(-.08,.08),rr(0,.3),rr(-.08,.08),rr(.3,.5),rr(.004,.007),.7);logE("tBreath",lw)}
 Q.fd=ss(0,3,t)*(1-ss(Q.dur-3,Q.dur,t));turtM.uniforms.uFd.value=Q.fd;
 const L=U.uKeyDir.value,dy=Q.y-floorY(Q.x,Q.z);sh.set(Q.x-L.x/Math.max(L.y,.2)*dy,Q.z-L.z/Math.max(L.y,.2)*dy,.32,.42*Q.fd*Math.exp(-dy*.3)*ss(.05,.3,L.y));
 if(t>Q.dur){Q.on=0;Q.g.visible=false;sh.w=0}}
/* flying fish: a few burst out near the ship, glide on stiff wings just over the waves and drop back in */
const FFS=(()=>{const n=6,o=new T.IM(fishGeo(1),fishMat(1),n),c=new C3();o.frustumCulled=false;root.add(o);const z0=new T.M4().makeScale(0,0,0);for(let i=0;i<n;i++){c.setRGB(.6,.74,.92);o.setColorAt(i,c);o.setMatrixAt(i,z0)}return{o,n,M:[],on:0}})();
function spawnFF(E){const n=3+(rnd()*3|0),side=rnd()<.5?-1:1,a=st.psi+st.yaw+rr(-.6,.6),hx=Math.cos(a),hz=-Math.sin(a),sx=-E.fz,sz=E.fx,d=rr(1.9,3.2),f=rr(0,2.4);
 const bx=E.cx+E.fx*f+sx*side*d,bz=E.cz+E.fz*f+sz*side*d;if(Math.hypot(bx+hx*5,bz+hz*5)>R-1.2)return 0;
 FFS.M=[];for(let i=0;i<Math.min(n,FFS.n);i++)FFS.M.push({d:i*rr(.08,.3),x:bx+rr(-.4,.4),z:bz+rr(-.4,.4),hx,hz,sp:rr(2,2.7),T:rr(1.2,2.1),t:0,st:0});FFS.on=1;return 1}
function ffUpd(dt){if(!FFS.on)return;let alive=0;const o=FFS.o;FFS.M.forEach((f,i)=>{if(f.st===2)return;alive++;f.d-=dt;if(f.d>0){o.setMatrixAt(i,lm.makeScale(0,0,0));return}
  if(f.st===0){f.st=1;const hw=hAt(f.x,f.z).y;for(let k=0;k<4;k++)emitW(f.x,hw+.02,f.z,f.hx*rr(.2,.6)+rr(-.1,.1),rr(.4,.9),f.hz*rr(.2,.6)+rr(-.1,.1),rr(.25,.4),rr(.004,.007),.75);ring(f.x,f.z,.25)}
  f.t+=dt;const k=f.t/f.T;f.x+=f.hx*f.sp*dt;f.z+=f.hz*f.sp*dt;const hw=hAt(f.x,f.z).y,ht=.2*ss(0,.15,k)*(1-ss(.8,1,k))+.025*Math.sin(k*9);const y=Math.max(hw+.015,hw*.35+ht);
  if(k>.85&&rnd()<dt*25)emitW(f.x-f.hx*.05,hw+.01,f.z-f.hz*.05,rr(-.05,.05),rr(.2,.5),rr(-.05,.05),rr(.2,.3),.004,.6);
  if(k>=1){f.st=2;for(let k2=0;k2<4;k2++)emitW(f.x,hw+.02,f.z,rr(-.12,.12),rr(.3,.7),rr(-.12,.12),rr(.25,.4),rr(.004,.007),.75);ring(f.x,f.z,.22);spot(f.x,f.z,.05);o.setMatrixAt(i,lm.makeScale(0,0,0));return}
  fX.set(f.hx,(ht-.1)*.1,f.hz).normalize();fZ.crossVectors(fX,fY.set(0,1,0)).normalize();fY.crossVectors(fZ,fX);lm.makeBasis(fX,fY,fZ).scale(fT.set(.11,.11,.11)).setPosition(f.x,y,f.z);o.setMatrixAt(i,lm)});
 o.instanceMatrix.needsUpdate=true;if(!alive)FFS.on=0}
const POD={on:0,ox:0,oz:0,hx:1,hz:0,M:[],cl:0},LF={dN:6,wN:16,sN:30,bN:40,first:1};
function spawnPod(E){const sg=rnd()<.5?-1:1;const cam=De.position;let best=null;
 for(let tr=0;tr<12;tr++){const a=st.psi+st.yaw+rr(-.35,.35),hx=Math.cos(a),hz=-Math.sin(a),bx=-hz,bz=hx;const side=((cam.x-E.cx)*bx+(cam.z-E.cz)*bz>0?1:-1)*(rnd()<.75?1:-1);
  const lat=side*rr(1.3,2.8),back=rr(3,4.6),ox=E.cx-hx*back+bx*lat,oz=E.cz-hz*back+bz*lat;let ok=Math.hypot(ox,oz)<R-1.6;const ex=ox+hx*7,ez=oz+hz*7;ok=ok&&Math.hypot(ex,ez)<R-1.2;if(ok){best={ox,oz,hx,hz};break}}
 if(!best)return 0;Object.assign(POD,best,{on:1,cl:rr(.4,1.2),M:[]});const n=Math.min(DOL.length,2+Math.floor(rnd()*3));
 for(let i=0;i<n;i++){const nh=rr(.2,.28),nt=rr(.85,1);POD.M.push({b:DOL[i],H:null,a:-i*rr(.2,.45),lat:(i-(n-1)/2)*rr(.2,.3)+rr(-.06,.06),st:0,tl:rr(1.2,2)+i*.3,t:0,tau:1,h:.35,y:-.8,ys:-.8,vs:0,ye:-.08,ve:4*nh/nt,tup:0,nh,ntau:nt,up:0,fd:0,bub:0,leaps:3+Math.floor(rnd()*3),vd:rr(1.35,1.55)})}
 return 1}
function spawnWhale(E){const fx=Math.cos(st.psi),fz=-Math.sin(st.psi),u0=WP.su[2]-.3,dv=WH.force!=null?WH.force:rnd()<.55?1:0,u1=WP.apex+WLN+(dv?1.8:.3);
 const ua=WP.su[2]-.4,ub=WP.su[10],tAt=u=>Math.min(u,ua)/.55+Math.max(0,Math.min(u,ub)-ua)/.42+Math.max(0,u-ub)/.45+(u>WP.apex+WLN-.4?3.6:0),RT=[],DR=[0,0];
 /* the water carries the whale along the ship's swaying heading, so its drift is integrated ahead the way update() will apply it */
 for(let k=1,x=0,z=0;k<=320;k++){const t=st.t+(k-.5)*.25,a=st.psi+.07*Math.sin(t*.11)+.035*Math.sin(t*.27+1.3);x-=Math.cos(a)*st.vs*.25;z+=Math.sin(a)*st.vs*.25;DR.push(x,z)}
 /* where the hull will be when the whale gets there: the same sway and yaw update() gives it */
 const shp=tt=>{const t=st.t+tt,ya=.07*Math.sin(t*.11)+.035*Math.sin(t*.27+1.3),hx=Math.cos(st.psi+ya),hz=-Math.sin(st.psi+ya),sg0=.35*Math.sin(t*.021);return[ShipC.x+.12*Math.sin(t*.05)+hx*sg0,ShipC.z+.1*Math.sin(t*.037+.7)+hz*sg0,hx,hz]};
 const dr=(tt,o)=>{const f=Math.min(319.99,Math.max(0,tt*4)),i=f|0,k=f-i;return DR[2*i+o]+(DR[2*i+2+o]-DR[2*i+o])*k};
 const go=(ox,oz,hx,hz,kp)=>{Object.assign(WH,{bw:0,wk:0,wp:0,on:1,ox,oz,hx,hz,kp,ua:0,uph:rnd()*TAU,y0:-.185-WP.cy,ag:0,uh:0,v:.5,blown:0,slap:-1,slapped:0,bend:0,hold:0,sa:0,sung:0,drip:0,bt:0,bd:1,sd:rnd()*9,bs:1,ba:0,dv,dvs:0,fin:0,fd:0,end:0,rg:0,st:0});whale.o.material.userData.fd.value=0;WSH.u.fill(0);WSH.w.fill(0);whale.o.visible=true;return 1};
 /* the hull's outline on screen from the current view, as a box in normalised device units */
 const sx=-fz,sz=fx,HB=[1e9,-1e9,1e9,-1e9],pv=new V3();De.updateMatrixWorld();for(const a of[-2.7,3.3])for(const b of[-.85,.85])for(const y of[-.3,1.3]){pv.set(E.cx+fx*a+sx*b,y,E.cz+fz*a+sz*b).project(De);HB[0]=Math.min(HB[0],pv.x);HB[1]=Math.max(HB[1],pv.x);HB[2]=Math.min(HB[2],pv.y);HB[3]=Math.max(HB[3],pv.y)}
 const scr=(x,z)=>{let g=9;for(const y of[.5,0]){pv.set(x,y,z).project(De);if(pv.z>1)continue;g=Math.min(g,Math.max(HB[0]-pv.x,pv.x-HB[1],HB[2]-pv.y,pv.y-HB[3]))}return g-.08};
 /* the route is laid out first relative to its own start, then centred on the disc and nudged sideways, so a fitting place is found at once; looser passes only run when the stricter ones find no place at all */
 for(const rl of[0,.4,.8]){let best=null;for(let tr=0;tr<24;tr++){const a=st.psi+st.yaw+(tr<10?rr(-.7,.7):rnd()*TAU),hx=Math.cos(a),hz=-Math.sin(a),kp=(rnd()<.5?-1:1)*rr(.03,.07);
  RT.length=0;let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
  for(let k=0;k<=24;k++){const u=u0+(u1-u0)*k/24,tt=tAt(u);for(const b of[0,WLN*.5,WLN]){pAt(u-b,PO);wTrk(0,0,hx,hz,kp,PO.x,WTK);const qx=WTK.x+dr(tt,0),qz=WTK.z+dr(tt,1);RT.push(qx,qz,b,...shp(tt));
   x0=Math.min(x0,qx);x1=Math.max(x1,qx);z0=Math.min(z0,qz);z1=Math.max(z1,qz)}}
  /* slide the route so the dive point sits toward the middle of the disc, as far as the rest of the route allows */
  pAt(WP.apex,PO);wTrk(0,0,hx,hz,kp,PO.x,WTK);const td=tAt(WP.apex+WLN-.41),cx=(x0+x1)/2,cz=(z0+z1)/2,dx0=WTK.x+dr(td,0),dz0=WTK.z+dr(td,1);let vx=cx-dx0,vz=cz-dz0;const vl=Math.hypot(vx,vz)||1;vx/=vl;vz/=vl;
  /* clearance from the hull's centre line, capped past bow and stern: a ship-beam plus a margin for the body, more for the flukes */
  const hd=(x,z,P,n)=>{const sx=x-P[n],sz=z-P[n+1],hx=P[n+2],hz=P[n+3],al=Math.max(-2.6,Math.min(3.2,sx*hx+sz*hz));return Math.hypot(sx-hx*al,sz-hz*al)},PD=shp(td);
  /* quarter positions off bow and stern are tried first, then slides across the disc */
  const s0=rnd()*16|0,sg=rnd()<.5?1:-1;for(let jt=0;jt<56;jt++){let ox,oz;if(jt<16){const k=(jt+s0)%16,al=[3,-2.8,3.6,-3.4][k&3],la=(k&4?-1:1)*(k&8?4.6:4.1);ox=E.cx+fx*al-fz*la-dx0;oz=E.cz+fz*al+fx*la-dz0}
    else{const j=jt-16,sl=sg*(j&4?-1:1)*[.3,2.8,3.6,1.5,4.3][j>>3]+rr(-.2,.2),sa=[1.2,.6,1.8,0][j&3];ox=-cx-vz*sl+vx*sa;oz=-cz+vx*sl+vz*sa}
   const qx=dx0+ox,qz=dz0+oz;let ok=(!dv||Math.hypot(qx,qz)>3.3)&&hd(qx,qz,PD,0)>3.6-rl;
   for(let n=0;n<RT.length&&ok;n+=7){const qx=RT[n]+ox,qz=RT[n+1]+oz,b=RT[n+2];if(Math.hypot(qx,qz)>(b===WLN?R-(dv?3.1:2.6):R-1.8)||hd(qx,qz,RT,n+3)<(b===WLN?3.5:3.4)-rl)ok=false}
   if(!ok)continue;
   /* the flukes should rise off a quarter rather than abeam, and outside the hull's outline as the viewer sees it, so the hull is not right behind them */
   const vs=Math.min(scr(qx,qz),(Math.abs((qx-E.cx)*fx+(qz-E.cz)*fz)-2.5)*.1);if(vs<0){if(!best||vs>best.vs)best={vs,ox,oz,hx,hz,kp};continue}
   return go(ox,oz,hx,hz,kp)}}if(best)return go(best.ox,best.oz,best.hx,best.hz,best.kp)}return 0}
const lw=new V3(),lw2=new V3(),lq=new T.Quat(),lm=new T.M4();
const WSH={n:7,u:new Uint8Array(7),w:new Float32Array(7),a:new Float32Array(7)};
function life(dt,E){const t=st.t,se=Ct.season,amb=(window.__sndX||{}).amb!==false,nt=E.night>.5,heavy=/storm|hail/.test(E.w);
 if(LF.first){LF.first=0;LF.dN=t+rr(4,7);LF.wN=t+(se>=2?rr(10,16):rr(30,50));LF.sN=t+rr(20,40);LF.bN=t+rr(25,60);LF.tN=t+rr(10,22);LF.fN=t+rr(14,30)}
 /* turtles: every 40-90 s, more often in summer, rarely in winter; flying fish in the warm seasons by day */
 if(!TUR.on&&t>LF.tN){if(spawnTurtle(rnd()<.5?1:0))LF.tN=t+TUR.dur+rr(40,90)*[1,.6,1.2,3][se];else LF.tN=t+5}
 if(!FFS.on&&t>LF.fN){LF.fN=t+rr(20,45)*[1.3,1,2.6,1][se];if(se<3&&!nt&&!heavy&&E.storm===0)spawnFF(E)}
 /* schedule: dolphins favour summer, whales autumn and winter */
 if(!POD.on&&t>LF.dN){const I=[[30,55],[12,24],[40,70],[70,120]][se],k=(nt?1.5:1)*(E.storm?2:1);if(spawnPod(E))LF.dN=t+rr(I[0],I[1])*k+8;else LF.dN=t+3}
 if(!WH.on&&t>LF.wN){const I=[[70,110],[100,160],[34,55],[30,50]][se];if(spawnWhale(E))LF.wN=t+rr(I[0],I[1])*(E.storm?1.3:1)+25;else LF.wN=t+4}
 if(t>LF.sN){LF.sN=t+rr(40,90)*(se>=2?1:2.2);if(amb&&(se>=2||rnd()<.35)){const a=rnd()*TAU;lw.set(Math.cos(a)*30,-6,Math.sin(a)*30);shot(rnd()<.5?"zWs1":"zWs2",.32,lw,rr(.94,1.04),1);logE("song",lw)}}
 /* dolphins: low ballistic leaps joined by smooth underwater swims; the body trails the head along the same arc,
    and every place it breaks the surface gets a splash, a foam ring and ripples */
 if(POD.on){POD.ox-=E.ux*dt;POD.oz-=E.uz*dt;let alive=0;const bx=-POD.hz,bz=POD.hx;
  for(const m of POD.M){m.a+=m.vd*dt;const x=POD.ox+POD.hx*m.a+bx*m.lat,z=POD.oz+POD.hz*m.a+bz*m.lat;const out=Math.hypot(x,z)>R-1.4;
   if(m.st===1){m.t+=dt;const k=m.t/m.tau;if(k<1)m.y=-.08+4*m.h*k*(1-k);
    else{const more=m.leaps>0&&!out;m.st=more?0:2;m.t=0;m.ys=-.08;m.vs=-4*m.h/m.tau;m.nh=rr(.2,.28);m.ntau=rr(.85,1);m.tl=more?rr(.8,1.3):2.6;m.ye=more?-.08:-1;m.ve=more?4*m.nh/m.ntau:0;m.y=-.08}}
   else if(m.st<3){m.t+=dt;const u=Math.min(1,m.t/m.tl),Tl=m.tl,u2=u*u,u3=u2*u;
    m.y=(2*u3-3*u2+1)*m.ys+(u3-2*u2+u)*Tl*m.vs+(-2*u3+3*u2)*m.ye+(u3-u2)*Tl*m.ve;
    if(u>=1){if(m.st===0){m.st=1;m.t=0;m.tau=m.ntau;m.h=m.nh;m.leaps--}else m.st=3}}
   const fdT=m.st===3?0:m.st===2?1-ss(.5,1,m.t/m.tl):1;m.fd=fdT>m.fd?Math.min(fdT,m.fd+dt*1.5):m.fd+(fdT-m.fd)*ease(5,dt);m.b.o.material.userData.fd.value=m.fd;
   if(m.st<3||m.fd>.02)alive++;
   const hw=hAt(x,z).y,yr=m.y+hw*.6*ss(-1,-.2,m.y);m.yf=m.yf==null?yr:m.yf+(yr-m.yf)*ease(20,dt);const y=m.yf;
   if(!m.H){m.H=[];for(let k=0;k<40;k++)m.H.push([x-POD.hx*k*.015,y,z-POD.hz*k*.015])}
   for(const p of m.H){p[0]-=E.ux*dt;p[2]-=E.uz*dt}
   const h0=m.H[0];if(Math.hypot(x-h0[0],y-h0[1],z-h0[2])>.006){m.H.unshift([x,y,z]);m.H.length>90&&m.H.pop()}else{h0[0]=x;h0[1]=y;h0[2]=z}
   const above=y>hw+.01;if(above!==!!m.up){m.up=above;lw.set(x,hw,z);
    if(above){for(let k=0;k<10;k++)emitW(x+rr(-.03,.03),hw+.02,z+rr(-.03,.03),POD.hx*rr(.2,.6)+rr(-.15,.15),rr(.5,1.1),POD.hz*rr(.2,.6)+rr(-.15,.15),rr(.35,.55),rr(.005,.009),.8);ring(x,z,.38);spot(x,z,.09);shot("zDex",.42,lw,rr(.92,1.08));logE("dExit",lw)}
    else{for(let k=0;k<10;k++){const a=rnd()*TAU;emitW(x+Math.cos(a)*.03,hw+.02,z+Math.sin(a)*.03,Math.cos(a)*rr(.06,.18)+POD.hx*.15,rr(.7,1.3),Math.sin(a)*rr(.06,.18)+POD.hz*.15,rr(.3,.5),rr(.006,.011),.85)}ring(x,z,.42);spot(x,z,.08);m.bub=.45;shot("zDen",.55,lw,rr(.9,1.08));logE("dEntry",lw)}}
   /* the flukes leave and re-enter the water too */
   const tf=dSamp(m.H,DL,DTF),tx=tf.p.x,tz=tf.p.z,thw=hAt(tx,tz).y,tup=tf.p.y>thw+.01;
   if(tup!==!!m.tup){m.tup=tup;ring(tx,tz,.3);spot(tx,tz,.06);for(let k=0;k<6;k++)emitW(tx+rr(-.03,.03),thw+.02,tz+rr(-.03,.03),rr(-.08,.12),rr(.4,.9),rr(-.08,.12),rr(.3,.45),rr(.004,.008),.8)}
   /* while the body pierces the surface, water sheets off it where it crosses */
   if(m.up!==m.tup&&m.fd>.3){const d0=y-hw,d1=tf.p.y-thw,k=d0/(d0-d1),px=x+(tx-x)*k,pz=z+(tz-z)*k;for(let e=dt*(MOB?22:40);e>0;e--){if(e<1&&rnd()>e)break;const a=rnd()*TAU;emitW(px+Math.cos(a)*.025,hAt(px,pz).y+.015,pz+Math.sin(a)*.025,Math.cos(a)*rr(.05,.2),rr(.2,.6),Math.sin(a)*rr(.05,.2),rr(.25,.4),rr(.004,.007),.75)}}
   /* a short trail of bubbles breaking just behind the entry */
   if(m.bub>0){const b0=m.bub;m.bub-=dt;if(b0>.25&&m.bub<=.25||b0>.05&&m.bub<=.05)spot(x-POD.hx*.1,z-POD.hz*.1,.06)}
   m.dp=(m.dp||0)+((!m.up&&m.tup?1:0)-(m.dp||0))*ease(9,dt);const dp=m.dp;
   const o=m.b.o;o.visible=m.fd>.02;if(o.visible)m.b.pose((s,f)=>{dSamp(m.H,s*DL,f);if(dp>.01&&s>.6){const u=(s-.6)/.4;f.p.y-=dp*.15*DL*u*u;f.t.y+=dp*.75*u;f.t.normalize()}f.b.set(bx,0,bz).addScaledVector(f.t,-f.t.x*bx-f.t.z*bz).normalize();f.n.crossVectors(f.b,f.t)},0)}
  POD.cl-=dt;if(POD.cl<=0&&alive){POD.cl=rr(1.2,3.5);const m=POD.M[0];lw.set(POD.ox+POD.hx*m.a,0,POD.oz+POD.hz*m.a);if(amb){const k=rnd();shot(k<.45?"zDcl":k<.75?"zDw1":"zDw2",.3,lw,rr(.95,1.06));logE("dVoice",lw)}}
  if(!alive){POD.on=0;for(const m of POD.M)m.b.o.visible=false}}
 /* whale: rise, blow, roll, arch, raise the flukes, slap, dive */
 if(WH.on){const H=WH;H.ox-=E.ux*dt;H.oz-=E.uz*dt;const ut=H.uh-WLN;
  if(ut>=WP.apex-1.1)H.bend=Math.min(1,H.bend+dt/2);
  /* the tail stock arches clear of the water before and while the flukes lift, so they stay visibly joined to it */
  H.pl=.17*ss(WP.apex-1.8,WP.apex-1.05,ut)*(1-ss(WP.apex-.45,WP.apex+.4,ut));
  if(H.slap>=0){H.slap+=dt;const k=Math.min(1,H.slap/.45);H.sa=1.95*k*k;H.v=0;if(H.slap>.9){H.slap=-2;H.v=.7}}
  else{const tgt=H.uh<WP.su[2]-.4?.55:H.uh<WP.su[10]?.42:ut<WP.apex-.6?.45:H.slap===-2?.75:H.dvs?.42:.2;H.v+=(tgt-H.v)*ease(1.5,dt)}
  H.uh+=H.v*dt;H.uph+=dt*TAU/4.2;H.ua+=(.13*(1-H.bend)*(H.slap===-1?1:0)-H.ua)*ease(1.2,dt);
  if(H.slap===-1&&H.bend>=1&&!H.dvs){H.hold+=dt;if(H.hold>(H.dv?1:1.3)){if(H.dv&&Math.hypot(whale.f1.p.x,whale.f1.p.z)<R-1.5)H.dvs=1;else H.slap=0}}
  const roll=H.uh>WP.su[4]&&H.uh<WP.su[8]?.3*Math.sin(Math.PI*(H.uh-WP.su[4])/(WP.su[8]-WP.su[4])):0;
  /* the back rises out over the arch only as the tail stock reaches it, so the peduncle comes up as the back goes under */
  H.ag=ss(WP.apex-1.5,WP.apex-.45,ut);
  whale.pose(whaleF,roll+(H.kp||0)*3.5*(1-H.bend));
  {const P=whale.P,NA=whale.NA,NR=whale.NR,c=[0,0,0,0,0,0],w0=U.uWh0.value,w1=U.uWh1.value;let dp=0;
   [.04,.45,.84].forEach((s,k)=>{const i=Math.round(s*NR);let x=0,y=0,z=0;for(let a=0;a<NA;a++){const j=(i*NA+a)*3;x+=P[j];y+=P[j+1];z+=P[j+2]}x/=NA;y/=NA;z/=NA;c[k*2]=x;c[k*2+1]=z;dp+=Math.max(0,hAt(x,z).y-y)/3});
   w0.set(c[0],c[1],c[2],c[3]);w1.set(c[4],c[5],H.fd,dp)}
  /* where the tail stock pierces the water: a foam collar, ripples and small splashes */
  COLR.on=0;if(H.bend>.3&&!H.slapped&&H.fin<2){const P=whale.P,NA=whale.NA,NR=whale.NR;let pr=null;
   for(let i=NR;i>=Math.floor(NR*.3);i--){const a=(i*NA+(NA>>2))*3,b=(i*NA+(3*NA>>2))*3,x=(P[a]+P[b])/2,y=(P[a+1]+P[b+1])/2,z=(P[a+2]+P[b+2])/2,d=y-hAt(x,z).y;
    if(pr&&(pr[3]<0)!==(d<0)){const k=pr[3]/(pr[3]-d),px=pr[0]+(x-pr[0])*k,pz=pr[2]+(z-pr[2])*k,hw=hAt(px,pz).y;H.pr=(H.pr||0)+dt;collarSet(k<.5?i+1:i,px,pz);
     if(H.pr>.24){H.pr=0;ring(px,pz,.34);spot(px,pz,.26);puff(px,hw+.05,pz,rr(-.05,.05),rr(.05,.15),rr(-.05,.05),rr(.6,1),rr(.12,.2),.14)}
     for(let e=dt*(MOB?22:34);e>0;e--){if(e<1&&rnd()>e)break;const a2=rnd()*TAU,r2=rr(.08,.14);puff(px+Math.cos(a2)*r2,hw+.03,pz+Math.sin(a2)*r2,Math.cos(a2)*.1,rr(.02,.06),Math.sin(a2)*.1,rr(.5,.8),rr(.07,.11),.4)}
     for(let e=dt*(MOB?30:55);e>0;e--){if(e<1&&rnd()>e)break;const a2=rnd()*TAU;emitW(px+Math.cos(a2)*.07,hw+.02,pz+Math.sin(a2)*.07,Math.cos(a2)*rr(.1,.35),rr(.3,1),Math.sin(a2)*rr(.1,.35),rr(.3,.55),rr(.005,.011),.8)}break}
    pr=[x,y,z,d]}}
  COLR.a+=((COLR.on?1:0)-COLR.a)*ease(COLR.on?5:2.5,dt);COLR.uA.value=COLR.a*H.fd;COLR.o.visible=COLR.a>.01;
  /* water sheets off the back wherever it has just broken the surface */
  {whaleF(.4,whale.fr);WSH.cs=(De.position.x-whale.fr.p.x)*whale.fr.b.x+(De.position.z-whale.fr.p.z)*whale.fr.b.z>0?1:-1}
  for(let i=0;i<WSH.n;i++){const s0=.1+i*.1;whaleF(s0,whale.fr);const f=whale.fr,[rw,rh]=wProf(s0);const ty=f.p.y+f.n.y*rh,hw=hAt(f.p.x,f.p.z).y,up=ty>hw+.01;
   if(up&&!WSH.u[i]){WSH.w[i]=2.2;for(const sg of[1,-1])puff(f.p.x+f.b.x*WR*sg*1.1,hw+.04,f.p.z+f.b.z*WR*sg*1.1,f.b.x*sg*.25,rr(.1,.3),f.b.z*sg*.25,rr(.9,1.4),rr(.22,.36),.22);if(i%2===0)ring(f.p.x,f.p.z,.5)}if(!up&&WSH.u[i]&&i%2)ring(f.p.x,f.p.z,.35);WSH.u[i]=up;if(!up){WSH.w[i]=0;continue}WSH.w[i]=Math.max(0,WSH.w[i]-dt);WSH.a[i]+=dt*(MOB?40:80)*(.55+WSH.w[i]/2.2+(WSH.w[i]>1.5?1.6:0));
   for(;WSH.a[i]>1;WSH.a[i]--){const sg=rnd()<.7?WSH.cs:-WSH.cs,th=rr(1.15,1.6),c=Math.cos(th),sn=Math.sin(th)*sg,bx=f.b.x,bz=f.b.z,ex=f.p.x+f.n.x*rh*c+bx*rw*sn*1.08+f.t.x*rr(-.05,.05),ey=f.p.y+f.n.y*rh*c+.01,ez=f.p.z+f.n.z*rh*c+bz*rw*sn*1.08+f.t.z*rr(-.05,.05);
    if(ey>hAt(ex,ez).y+.015)emitW(ex,ey,ez,bx*sg*rr(.3,.75),rr(-.1,.2),bz*sg*rr(.3,.75),rr(.35,.6),rr(.008,.016),.85)}}
  /* blowhole a little behind the head */
  whaleF(.1,whale.fr);const bh=whale.fr.p;const hwB=hAt(bh.x,bh.z).y;
  /* the exhale lasts as long as its sound (about 0.8 s): puffs stream from the blowhole the whole time */
  if(H.bt>0){const k=1-H.bt/H.bd;H.bt-=dt;H.ba+=dt*(MOB?70:110)*H.bs;for(;H.ba>1;H.ba--){const vy=rr(1.9,3.4)*(1-.35*k)*H.bs,sp=.13+vy*.16,lo=(rnd()<.5?-1:1)*rr(.04,.22);puff(bh.x+rr(-.05,.05),hwB+.1+rr(0,.06),bh.z+rr(-.05,.05),rr(-sp,sp)-H.hz*lo+E.wn*.3,vy,rr(-sp,sp)+H.hx*lo,rr(2.4,4.2),rr(.2,.38),.34)}
   if(rnd()<dt*40)emitW(bh.x,hwB+.12,bh.z,rr(-.35,.35),rr(1.4,3)*H.bs,rr(-.35,.35),rr(.8,1.3),rr(.006,.012),.6)}
  /* one breath at each crest, as the blowhole breaks the surface; the first is the strongest */
  if(H.blown<3&&H.uh>WP.su[WCR[H.blown]]+.35){const k=H.blown++;H.bt=H.bd=k?.6:.8;H.bs=k?.75:1;H.ba=0;lw.copy(bh);lw.y=hwB;shot("zWbl",k?.5:.7,lw,rr(.96,1.06));logE(k?"wBlow2":"wBlow",lw);
   if(!k&&amb&&!H.sung&&rnd()<.6){H.sung=1;shot(rnd()<.5?"zWs1":"zWs2",.26,lw2.set(lw.x,-4,lw.z),rr(.95,1.03),1)}}
  /* soft bow wave where the back first cuts the water, and a foam wake trailing from where it goes back under */
  if(H.bend<.3&&H.fd>.5){let fr=-1,bk=-1,fp=null;for(let i=0;i<=16;i++){const s0=i/16*.8;whaleF(s0,whale.fr);const f=whale.fr,P2=wProf(s0),hw=hAt(f.p.x,f.p.z).y,up=f.p.y+f.n.y*(P2[1]+P2[3])>hw+.005;if(up){if(fr<0){fr=s0;fp=[f.p.x,f.p.z,hw,P2[0]]}bk=s0}}
   if(fr>=0){const vx=H.hx*H.v,vz=H.hz*H.v,bx=-H.hz,bz=H.hx;H.bw=(H.bw||0)+dt*(MOB?14:24);for(;H.bw>1;H.bw--){const sg=rnd()<.5?-1:1,r2=fp[3]*rr(.5,1.1);puff(fp[0]+bx*sg*r2+H.hx*.04,fp[2]+.02,fp[1]+bz*sg*r2+H.hz*.04,bx*sg*rr(.12,.25)+vx*.4,rr(.01,.05),bz*sg*rr(.12,.25)+vz*.4,rr(.6,1),rr(.07,.12),.2)}
    whaleF(bk,whale.fr);const q=whale.fr.p,hw=hAt(q.x,q.z).y;H.wk=(H.wk||0)+dt;if(H.wk>.5){H.wk=0;spot(q.x,q.z,.13)}H.wp=(H.wp||0)+dt*(MOB?8:14);for(;H.wp>1;H.wp--)puff(q.x+rr(-.06,.06),hw+.02,q.z+rr(-.06,.06),-vx*.2+rr(-.05,.05),rr(0,.03),-vz*.2+rr(-.05,.05),rr(.8,1.3),rr(.08,.13),.16)}}
  /* flukes: water streams off while raised; the slap lands when the tip meets the water */
  const ft=lw2.copy(whale.f1.p).addScaledVector(whale.f1.t,-.36),hT=hAt(ft.x,ft.z).y;
  if(ut>WP.apex-.5&&H.slap<.1){const P=whale.P;H.drip+=dt*(MOB?10:16);
   const te=(k,o)=>{const a=WFK[o],j=(a.o+a.te[k])*3;lw.set(P[j],P[j+1],P[j+2]);return lw.y>hAt(lw.x,lw.z).y+.04};
   for(;H.drip>1;H.drip--){const o=rnd()<.5?0:1;if(te(Math.floor(rnd()*WFK[o].te.length),o))emitW(lw.x,lw.y-.01,lw.z,rr(-.04,.04),-rr(0,.3),rr(-.04,.04),rr(.7,1.1),rr(.005,.01),.7)}
}
  if(H.slap>.1&&!H.slapped&&ft.y<hT+.02){H.slapped=1;H.rg=0;H.st=0;lw.set(ft.x,hT,ft.z);Object.assign(CRW,{on:1,age:0,x:ft.x,z:ft.z,ph:rnd()*10});
   /* fine spray thrown off the crown, a little mist, then a spreading foam patch with rings */
   for(let i=0;i<(MOB?170:320);i++){const a=rnd()*TAU,sp=rr(.5,2.6),r=rr(.2,.6);emitW(ft.x+Math.cos(a)*r,hT+rr(.05,.4),ft.z+Math.sin(a)*r,Math.cos(a)*sp*.8,rr(1.4,4),Math.sin(a)*sp*.8,rr(.6,1.3),rr(.005,.012),.8,.4)}
   for(let i=0;i<10;i++)puff(ft.x+rr(-.4,.4),hT+.15,ft.z+rr(-.4,.4),rr(-.3,.3),rr(.3,.9),rr(-.3,.3),rr(1.2,2.2),rr(.3,.5),.22);U.uPatch.value.set(ft.x,ft.z,U.uT.value,1);ring(ft.x,ft.z,1.6);shot("zWsl",.95,lw,rr(.96,1.02));logE("wSlap",lw)}
  /* clean dive: the flukes slide straight down, leaving a few drops, a ring and a smooth footprint */
  if(H.dvs){if(!H.fin&&ft.y<hT-.02){H.fin=1;lw.set(ft.x,hT,ft.z);ring(ft.x,ft.z,.55);spot(ft.x,ft.z,.16);for(let i=0;i<8;i++)emitW(ft.x+rr(-.1,.1),hT+.03,ft.z+rr(-.1,.1),rr(-.15,.15),rr(.3,.8),rr(-.15,.15),rr(.3,.5),rr(.005,.009),.7);logE("wDive",lw)}
   if(H.fin===1&&ft.y<hT-.35){H.fin=2;U.uSlick.value.set(ft.x,ft.z,U.uT.value,1);U.uSlickH.value.set(H.hx,H.hz,rnd()*6.28,0);H.st=0;H.rg=0;ring(ft.x,ft.z,.7)}
   if(H.fin===2&&H.rg<2){H.st+=dt;if(H.st>[.9,2.1][H.rg]){H.rg++;ring(U.uSlick.value.x,U.uSlick.value.y,.5-H.rg*.12)}}}
  if(H.slapped&&H.rg<3){H.st+=dt;if(H.st>[.35,.85,1.5][H.rg]){H.rg++;ring(CRW.x+rr(-.15,.15),CRW.z+rr(-.15,.15),1.2-H.rg*.25)}}
  flukeSheet(dt,ut>WP.apex-.5&&H.slap>-1.5&&H.slap<.1,E);
  if(!H.end&&(H.uh>WP.L+WLN*.4||(H.slapped||H.dvs)&&ft.y<hT-1.1))H.end=1;H.fd+=((H.end?0:1)-H.fd)*ease(H.end?2.5:1.2,dt);whale.o.material.userData.fd.value=H.fd;if(H.end&&H.fd<.02){H.on=0;whale.o.visible=false}}else{flukeSheet(dt,false,E);U.uWh1.value.z=0}
 crownUpd(dt,E);streakUpd(dt,E.wn);U.uPatch.value.x-=E.ux*dt;U.uPatch.value.y-=E.uz*dt;U.uSlick.value.x-=E.ux*dt;U.uSlick.value.y-=E.uz*dt;for(const v of U.uSpot.value){v.x-=E.ux*dt;v.y-=E.uz*dt}
 fishUpd(dt);turtUpd(dt,E);ffUpd(dt);
 /* blow plume */
 for(let i=0;i<blowS.n;i++){const q=BLW[i];if(!q.on){blowS.a[i]=0;continue}q.age+=dt;if(q.age>q.life){q.on=0;blowS.a[i]=0;continue}const dr=Math.exp(-dt*1.9);q.vx=(q.vx-E.wn*1.4)*dr+E.wn*1.4;q.vz*=dr;q.vy=q.vy*dr-.12*dt;
  q.x+=(q.vx-E.ux*.3)*dt;q.y+=q.vy*dt;q.z+=(q.vz-E.uz*.3)*dt;const u=q.age/q.life;blowS.p.set([q.x,q.y,q.z],i*3);blowS.a[i]=q.a*(1-u)*(1-u)*Math.min(1,q.age*8);blowS.s[i]=q.sz*(1+u*2.8)}
 blowS.g.attributes.position.needsUpdate=blowS.g.attributes.aA.needsUpdate=blowS.g.attributes.aS.needsUpdate=true;
 /* gulls circle the masts: fewer at night and in foul weather */
 const n0=E.storm?1:heavy||/hrain/.test(E.w)||E.w==="snow"?2:[4,5,4,3][se],want=Math.round(n0*(1-ss(.25,.6,E.night)));
 const mx=ship.position.x+Math.cos(st.psi)*.08,mz=ship.position.z-Math.sin(st.psi)*.08,my=ship.position.y;
 GU.forEach((b,i)=>{b.p+=((i<want?1:0)-b.p)*ease(i<want?.35:.25,dt);const g=b.g;if(b.p<.01){g.visible=false;return}g.visible=true;
  const rho=b.r0+.6*Math.sin(t*.13+b.ph)+(1-b.p)*15,alt=b.a0+.5*Math.sin(t*.21+b.ph*1.7)+(1-b.p)*7,om=b.dir*b.sp/rho;b.th+=om*dt;
  const x=mx+Math.cos(b.th)*rho,z=mz+Math.sin(b.th)*rho,y=my+alt;const vx=-Math.sin(b.th)*b.dir,vz=Math.cos(b.th)*b.dir,vy=.5*.21*Math.cos(t*.21+b.ph*1.7)/b.sp;
  b.ft-=dt;if(b.ft<=0){b.fl=!b.fl;b.ft=b.fl?rr(1,2.2):rr(1.8,4.5)}b.fp+=dt*(b.fl?TAU*3.4:0);const fa=b.fl?Math.sin(b.fp):0;
  for(const w of b.W){w.r.rotation.x=-w.sg*(b.fl?.12+.55*fa:.1);w.o.rotation.x=-w.sg*(b.fl?.35*Math.sin(b.fp-.9):-.06)}
  lw.set(vx,vy,vz).normalize();const bank=-b.dir*Math.atan(b.sp*b.sp/(rho*3.2));lw2.set(0,1,0);const lat=new V3().crossVectors(lw,lw2).normalize();lw2.crossVectors(lat,lw).normalize();
  lw2.applyAxisAngle(lw,bank);lat.crossVectors(lw,lw2);lm.makeBasis(lw,lw2,lat);g.quaternion.setFromRotationMatrix(lm);g.position.set(x,y,z);
  b.call-=dt;if(b.call<=0){b.call=rr(7,20)*(E.night>.25?2:1);if(b.p>.6&&amb){b.fl=1;b.ft=Math.max(b.ft,.8);lw.set(x,y,z);shot(["zGl1","zGl2","zGl3"][b.m],.5,lw,rr(.95,1.06));logE("gull",lw)}}})}

/* ---------------- sound: everything here is synthesised (tools/seasynth.py) ---------------- */
const AQ={zBed:"@a:zBed",zWnd:"@a:zWnd",zSrf:"@a:zSrf",zLap:"@a:zLap",zLuf:"@a:zLuf",zRnS:"@a:zRnS",zRnD:"@a:zRnD",zSnw:"@a:zSnw",zCr1:"@a:zCr1",zCr2:"@a:zCr2",zCr3:"@a:zCr3",
 zClk1:"@a:zClk1",zClk2:"@a:zClk2",zBel:"@a:zBel",zGl1:"@a:zGl1",zGl2:"@a:zGl2",zGl3:"@a:zGl3",zDcl:"@a:zDcl",zDw1:"@a:zDw1",zDw2:"@a:zDw2",zDex:"@a:zDex",zDen:"@a:zDen",
 zWbl:"@a:zWbl",zWsl:"@a:zWsl",zWs1:"@a:zWs1",zWs2:"@a:zWs2",zHw1:"@a:zHw1",zHw2:"@a:zHw2",zHd1:"@a:zHd1",zHd2:"@a:zHd2",zTh1:"@a:zTh1",zTh2:"@a:zTh2",zFl1:"@a:zFl1",zFl2:"@a:zFl2"};
const LL={zBed:20,zWnd:16,zSrf:14,zLap:13,zLuf:10,zRnS:12,zRnD:12,zSnw:14};
const AU={b:{},pd:{},lp:{},bus:null,bed:null,far:null,acc:0,n:0,hw:0,hd:0,cr:0,cl:0,rv:0,pv:0,fl:0,bell:0,pre:0};
const SX=()=>window.__sndX;
function aOK(){const x=SX();return!!(x&&x.on&&x.s&&x.s.state==="running"&&root.visible)}
function dec(k){if(AU.b[k]||AU.pd[k])return;const x=SX();if(!x||!x.s||!x.ld)return;AU.pd[k]=1;x.ld(AQ[k]).then(B=>{const P=x.s.decodeAudioData(B,b=>{AU.b[k]=b},()=>{});P&&P.catch&&P.catch(()=>{})}).catch(()=>{setTimeout(()=>{AU.pd[k]=0},8e3)})}
function aBus(){if(AU.bus)return true;const x=SX(),c=x.s;try{const b=c.createGain();b.gain.value=0;b.connect(x.r);const f=c.createBiquadFilter();f.type="lowpass";f.frequency.value=9000;f.Q.value=.4;f.connect(b);
  const lp=c.createBiquadFilter();lp.type="lowpass";lp.frequency.value=1400;lp.connect(b);AU.bus=b;AU.bed=f;AU.far=lp;return true}catch(e){return false}}
/* camera-relative pan and distance gain, the same idea as the yards' sounds */
function spat(p){const m=De.matrixWorld.elements,dx=p.x-m[12],dy=p.y-m[13],dz=p.z-m[14],d=Math.hypot(dx,dy,dz)||1;return[cl((dx*m[0]+dy*m[1]+dz*m[2])/d,-1,1)*.85,cl(Math.pow(30/d,.85),.25,1.8)]}
function loop(k,v,p,rate,out){const c=SX().s;let L=AU.lp[k];if(!L){if(v<=.001)return;dec(k);const b=AU.b[k];if(!b)return;try{const s=c.createBufferSource(),g=c.createGain(),pn=c.createStereoPanner?c.createStereoPanner():null;
  g.gain.value=0;s.buffer=b;s.loop=true;s.loopStart=.5;s.loopEnd=.5+LL[k];s.connect(g);if(pn){g.connect(pn);pn.connect(out||AU.bus)}else g.connect(out||AU.bus);s.start(0,.5+rnd()*LL[k]);L=AU.lp[k]={s,g,pn}}catch(e){return}}
 const now=c.currentTime;let gv=v,pa=0;if(p){const q=spat(p);pa=q[0];gv*=q[1]}L.g.gain.setTargetAtTime(gv,now,.6);L.pn&&L.pn.pan.setTargetAtTime(pa,now,.3);rate&&L.s.playbackRate.setTargetAtTime(rate,now,.5)}
function shot(k,g,p,rate,far){if(!aOK()||!aBus())return;const b=AU.b[k];dec(k);if(!b)return;try{const c=SX().s,s=c.createBufferSource(),gn=c.createGain(),pn=c.createStereoPanner?c.createStereoPanner():null;
  const q=p?spat(p):[0,1];s.buffer=b;s.playbackRate.value=rate||1;gn.gain.value=g*(far?1:q[1]);s.connect(gn);const out=far?AU.far:AU.bus;if(pn){pn.pan.value=q[0];gn.connect(pn);pn.connect(out)}else gn.connect(out);s.start();AU.n++;LOG.push({k:"snd:"+k,t:+st.t.toFixed(3)});LOG.length>60&&LOG.shift()}catch(e){}}
function hailSnd(wood,x,y,z){if(!aOK()||(SX().rm==="0"))return;if(wood){if(AU.hd<1)return;AU.hd--}else{if(AU.hw<1)return;AU.hw--}lw2.set(x,y,z);
 shot(wood?(rnd()<.5?"zHd1":"zHd2"):(rnd()<.5?"zHw1":"zHw2"),wood?rr(.25,.45):rr(.12,.26),lw2,rr(.9,1.12))}
window.__seaThn=()=>{if(!aOK()||SX().rm==="0")return;const k=rnd()<.5?"zTh1":"zTh2",a=rnd()*TAU;dec(k);setTimeout(()=>shot(k,rr(.75,.95),{x:Math.cos(a)*25,y:4,z:Math.sin(a)*25},rr(.9,1.05),0),rr(1,3.5)*1e3)};
const sw=new V3();
function sound(dt,E){const x=SX();if(!aOK()){return}if(!aBus())return;const c=x.s,now=c.currentTime;
 if(!AU.pre){AU.pre=1;Object.keys(LL).forEach(dec);setTimeout(()=>Object.keys(AQ).forEach(dec),2500)}
 AU.hw=Math.min(6,AU.hw+dt*22);AU.hd=Math.min(5,AU.hd+dt*16);
 /* ship motion: rigging creaks at the ends of a roll, the hull groans on hard pitch, lanterns clink */
 const rv=st.rv,pvv=st.pv;AU.cr-=dt;AU.cl-=dt;
 if(rv*AU.rv<0&&Math.abs(st.r)>.025&&AU.cr<=0){AU.cr=rr(1.1,2.2);if(rnd()<.75){toW(.08,rr(2.4,3.8),rr(-.4,.4),sw);shot(rnd()<.5?"zCr1":"zCr3",cl(Math.abs(st.r)*6,.18,.6),sw,rr(.85,1.15))}
  if(AU.cl<=0&&rnd()<.4){AU.cl=rr(2,5);toW(-2.9,1.86,0,sw);shot(rnd()<.5?"zClk1":"zClk2",cl(Math.abs(st.r)*4,.12,.35),sw,rr(.95,1.05))}}
 if(pvv*AU.pv<0&&Math.abs(st.p)>.022&&rnd()<.5){toW(rr(-1.5,1.5),.2,0,sw);shot("zCr2",cl(Math.abs(st.p)*6,.18,.55),sw,rr(.85,1.1))}
 AU.rv=rv;AU.pv=pvv;
 if(!AU.bell)AU.bell=st.t+rr(25,60);else if(st.t>AU.bell){AU.bell=st.t+rr(70,150)*(E.storm?.5:1);toW(2.2,1.12,0,sw);shot("zBel",.5,sw,1)}
 /* canvas: flogging when the sails lose the wind, snaps in gusts */
 const luf=cl(.06+.55*E.wn*(.3+.7*(1-E.fill))+.25*E.storm,0,.85);AU.fl-=dt;
 if(AU.fl<=0){AU.fl=rr(2,7)/(.3+E.wn*1.6);if(E.wn>.3&&rnd()<.4+.6*(1-E.fill)){toW(rr(-.5,1.6),rr(2.2,4.5),0,sw);shot(rnd()<.5?"zFl1":"zFl2",cl(.2+.5*E.wn,.2,.7),sw,rr(.9,1.1))}}
 AU.acc+=dt;if(AU.acc<.12)return;AU.acc=0;
 const se=Ct.season,w=E.w,wx=x.rm!=="0",cov=jt.uCover.value,snow=w==="snow"?cl((Ct.snowLv||2)/4,.3,1):0,cloud=w==="cloud"?1:0;
 AU.bus.gain.setTargetAtTime(1,now,.8);
 /* bed: swells and lap; summer calmer, cloud duller, snow muffled */
 const Sx=Math.min(1.6,E.S);let fq=(se===1?6500:9500)*(1-.7*cloud*cov)*(1-.85*snow)+3500*E.storm;AU.bed.frequency.setTargetAtTime(Math.max(600,fq),now,1.5);
 loop("zBed",(.42+.22*Sx/1.6)*(se===1?.78:1)*(1-.25*snow),null,null,AU.bed);
 loop("zSrf",.18+.08*Math.min(1,E.S),sw.set(De.position.x,0,De.position.z).setLength(R).setY(-.8),null,AU.bed);
 loop("zLap",.32*(.55+.45*cl(E.spd,0,1))*(.75+.25*Sx),sw.copy(ship.position),null,AU.bed);
 loop("zWnd",([.08,.03,.1,.42][se]+.45*ss(.35,1,E.wn)+.4*E.storm)*(1-.5*snow)*(se===1?.7:1),null,.9+.2*E.wn);
 toW(.08,3.4,0,sw);loop("zLuf",luf,sw,.82+.45*E.wn);
 /* weather on open water vs on the deck, mixed by how close the camera is to the ship */
 const dS=De.position.distanceTo(ship.position),near=cl((40-dS)/32,.12,1),rn=wx&&/rain|storm/.test(w)?E.rain:0;
 loop("zRnS",rn*.8*(1-.55*near));loop("zRnD",rn*.9*near,sw.copy(ship.position).setY(ship.position.y+.6));loop("zSnw",wx?snow*.55:0)}
/* ---------------- batch static ship parts per material (one draw per material per moving frame) ---------------- */
{const KEEP=new Set(["position","normal","uv"]),hold=new Set([ship,latP,...PIV,...FL.map(f=>f.p)]),skip=new Set(SAILS.map(s=>s.roll));
 ship.updateMatrixWorld(true);const inv=new T.M4(),rel=new T.M4(),nm=new T.M4();
 for(const C of hold){const groups=new Map();inv.copy(C.matrixWorld).invert();
  C.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||skip.has(o)||o.material.userData.pu)return;
   let p=o.parent;while(p&&p!==C){if(hold.has(p)||skip.has(p))return;p=p.parent}if(p!==C)return;
   const g=o.geometry;if(Object.keys(g.attributes).some(k=>!KEEP.has(k))||!g.attributes.normal||!g.attributes.uv||g.morphAttributes.position)return;
   const k=o.material.uuid+(o.castShadow?1:0)+(o.receiveShadow?1:0);(groups.get(k)||groups.set(k,[]).get(k)).push(o)});
  for(const L of groups.values()){if(L.length<2)continue;let nv=0;const parts=L.map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();rel.multiplyMatrices(inv,o.matrixWorld);g.applyMatrix4(rel);nv+=g.attributes.position.count;return g});
   const P=new Float32Array(nv*3),N=new Float32Array(nv*3),UV=new Float32Array(nv*2);let off=0;
   for(const g of parts){const c=g.attributes.position.count;P.set(g.attributes.position.array,off*3);N.set(g.attributes.normal.array,off*3);UV.set(g.attributes.uv.array,off*2);off+=c;g.dispose()}
   const G=new T.BG();G.setAttribute("position",new T.BA(P,3));G.setAttribute("normal",new T.BA(N,3));G.setAttribute("uv",new T.BA(UV,2));G.computeBoundingSphere();
   const m=new T.Mesh(G,L[0].material);m.castShadow=L[0].castShadow;m.receiveShadow=L[0].receiveShadow;C.add(m);for(const o of L)o.parent.remove(o)}}}

/* ---------------- show / hide ---------------- */
for(const o of[X.vd,pi,dc,X.Dc,X.qc,X.sr,...(X.Ca||[]).map(c=>c.m)])o&&o.traverse(c=>c.layers.enable(2));
onSea(root);lanL.layers.mask=L2;
function show(on){root.visible=on;grade.enabled=on;De.layers.set(on?2:0);window.__seaA=on;const x=SX();x&&x.C&&x.C();
 if(!on&&AU.bus&&x&&x.s){AU.bus.gain.setTargetAtTime(0,x.s.currentTime,.25);const L=AU.lp;AU.lp={};setTimeout(()=>{for(const k in L)try{L[k].s.stop()}catch(e){}},1500)}}
window.__seaShow=show;window.__seaU=update;
window.__sea={spawnTurtle,st,ship,root,W,hAt,U,streak,SAILS,FL,De,Ce:X.Ce,Cn,grade:gradeM,jt,trailW,wl,bowL,LOG,WH,POD,GU,AU,WP,whale,WSH,SP,
 TUR,FISH,FFS,AQU,spawn:(k,a)=>k==="whale"?(WH.on=0,WH.force=a,spawnWhale(ENV)):k==="dolphin"?(POD.on=0,spawnPod(ENV)):k==="turtle"?(TUR.on=0,spawnTurtle(a||0)):k==="ff"?spawnFF(ENV):0};
window.__seaReady=true;
};
})();
