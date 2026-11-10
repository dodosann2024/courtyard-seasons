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
/* R: bubbly foam web (tileable worley), G: soft fbm */
function mkFoam(S){const N=9,pts=[];for(let j=0;j<N;j++)for(let i=0;i<N;i++)pts.push([(i+rnd())/N,(j+rnd())/N]);
 const L=[8,16,32].map(n=>{const a=new Float32Array(n*n);for(let i=0;i<n*n;i++)a[i]=rnd();return{n,a}});
 const vn=(o,x,y)=>{const n=o.n,X=x*n,Y=y*n,i=Math.floor(X),j=Math.floor(Y),fx=X-i,fy=Y-j,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),A=(a,b)=>o.a[((b%n+n)%n)*n+((a%n+n)%n)];return(A(i,j)*(1-u)+A(i+1,j)*u)*(1-v)+(A(i,j+1)*(1-u)+A(i+1,j+1)*u)*v};
 return canvas(S,S,(g,w,h)=>{const im=g.createImageData(w,h),d=im.data;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const px=x/w,py=y/h;let f1=9,f2=9;const ci=Math.floor(px*N),cj=Math.floor(py*N);
  for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const ii=((ci+a)%N+N)%N,jj=((cj+b)%N+N)%N,p=pts[jj*N+ii];let dx=p[0]-px,dy=p[1]-py;
   dx-=Math.round(dx);dy-=Math.round(dy);const dd=Math.hypot(dx,dy);if(dd<f1){f2=f1;f1=dd}else if(dd<f2)f2=dd}
  const web=1-ss(0,.035,f2-f1),fb=vn(L[0],px,py)*.5+vn(L[1],px,py)*.32+vn(L[2],px,py)*.18,fb2=vn(L[1],px+.37,py+.71)*.55+vn(L[2],px+.13,py+.29)*.45;
  const j=(y*w+x)*4;d[j]=cl((web*.75+fb*.7-.32)*1.5,0,1)*255;d[j+1]=fb2*255;d[j+2]=fb*255;d[j+3]=255}g.putImageData(im,0,0)})}
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
const U={uT:{value:0},uFlow:{value:new T.V2()},uDeep:{value:new C3("#1b3638")},uScat:{value:new C3("#4d8a78")},
 uAmb:{value:new C3()},uKey:{value:new C3()},uKeyDir:{value:new V3(0,1,0)},uFogC:{value:new C3()},uFogN:{value:30},uFogF:{value:90},uHaze:{value:.02},
 uRain:{value:0},uDet:{value:1},uWhite:{value:0},uGlit:{value:1},uHI:{value:2},uLanP:{value:new V3()},uLanC:{value:new C3(0,0,0)},uBio:{value:0},uIce:{value:0},
 uRing:{value:[...Array(16)].map(()=>new T.V4(0,0,-99,0))},uRingOn:{value:0},uSunCol:{value:new C3()},uMoonC:{value:new C3()},tN:{value:tN},tF:{value:tF}};
const SKY={uTop:jt.top,uBot:jt.bot,uSunDir:jt.sunDir,uSunVis:jt.uSunVis,uMoonDir:jt.moonDir,uMoonVis:jt.uMoonVis,uNight:jt.uNight,uCover:jt.uCover,uDark:jt.uDark,uFlash:jt.flash};
const FOG=`float fogMix(float d){return clamp(max(smoothstep(uFogN,uFogF,d),1.-exp(-max(d-20.,0.)*uHaze)),0.,1.);}`;

/* ---------------- sea surface ---------------- */
function seaGeo(nr,na){const pos=[0,0,0],idx=[];for(let j=1;j<=nr;j++){const r=R*j/nr;for(let i=0;i<na;i++){const a=i/na*TAU;pos.push(r*Math.cos(a),0,r*Math.sin(a))}}
 for(let i=0;i<na;i++)idx.push(0,1+(i+1)%na,1+i);
 for(let j=1;j<nr;j++){const a0=1+(j-1)*na,b0=1+j*na;for(let i=0;i<na;i++){const i2=(i+1)%na;idx.push(a0+i,a0+i2,b0+i,a0+i2,b0+i2,b0+i)}}
 const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setIndex(idx);return g}
const seaMat=new T.SM({uniforms:{...U,...SKY,uWK,uWA,uWQ,uWP},side:2,
 vertexShader:WGL+`varying vec3 vW,vN;varying float vJ;varying vec2 vX;void main(){vec3 p,n;float J;waves(position.xz,p,n,J);vW=p;vN=n;vJ=J;vX=position.xz;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}`,
 fragmentShader:`uniform sampler2D tN,tF;uniform float uT,uRingOn,uRain,uDet,uWhite,uGlit,uHI,uFogN,uFogF,uHaze,uSunVis,uMoonVis,uNight,uCover,uDark,uFlash,uBio,uIce;
uniform vec2 uFlow;uniform vec3 uDeep,uScat,uAmb,uKey,uKeyDir,uFogC,uTop,uBot,uSunDir,uSunCol,uMoonDir,uMoonC,uLanP,uLanC;uniform vec4 uRing[16];
varying vec3 vW,vN;varying float vJ;varying vec2 vX;
float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float specks(vec2 g,float t){float b=0.;for(int k=0;k<2;k++){float sc=k==0?23.:37.;vec2 q=g*sc+float(k)*13.7;vec2 c=floor(q),f=fract(q);float h=hs(c);
 vec2 o=vec2(hs(c+3.1),hs(c+7.7))*.7+.15;vec2 dd=f-o;float tw=.5+.5*sin(t*(1.6+2.4*h)+h*40.);b+=step(.48,h)*exp(-dot(dd,dd)*(70.+50.*h))*tw*tw*(k==0?1.:.75);}return b;}
${FOG}
vec2 rainN(vec2 p){vec2 g=vec2(0.);for(int L=0;L<2;L++){float sc=L==0?2.7:3.9;vec2 q=p*sc+float(L)*7.31;vec2 c=floor(q),f=fract(q)-.5;float h=hs(c+float(L)*3.1);
 if(h<uRain*.92){vec2 o=(vec2(hs(c+1.7),hs(c+4.3))-.5)*.4;float ph=fract(uT*(.85+.5*hs(c+9.1))+h*7.);vec2 d=f-o;float r=length(d);float x=(r-ph*.4)*30.;
 g+=d/max(r,1e-3)*sin(x*1.4)*exp(-x*x*.08)*(1.-ph)*(1.-ph)*.8;}}return g;}
vec2 ringN(vec2 p){vec2 g=vec2(0.);for(int i=0;i<16;i++){vec4 Q=uRing[i];float a=uT-Q.z;if(a<0.||a>2.6||Q.w<=0.)continue;vec2 d=p-Q.xy;float r=length(d);float x=(r-a*.62)*20.;if(abs(x)>10.)continue;
 g+=d/max(r,1e-3)*sin(x*1.7)*exp(-x*x*.05)*Q.w*exp(-a*1.4)*smoothstep(0.,.12,a);}return g;}
vec3 skyC(vec3 d){float t=pow(clamp(d.y*2.4+.04,0.,1.),.6);vec3 c=mix(uBot,uTop,t);
 vec3 cc=mix(mix(vec3(.6,.63,.68),vec3(.09,.1,.13),uNight),vec3(.19,.2,.23)*(1.-.6*uNight),uDark);c=mix(c,cc,uCover*.5*(.55+.45*t));
 float s=max(dot(d,normalize(vec3(uSunDir.x,max(uSunDir.y,.06),uSunDir.z))),0.);c+=uSunCol*uSunVis*(pow(s,6.)*.22+pow(s,48.)*.55);c+=uFlash*vec3(.5,.55,.7);return c;}
void main(){vec3 E=cameraPosition-vW;float dist=length(E);vec3 V=E/dist;float lod=exp(-dist*.03);vec2 fx=vX+uFlow;
 vec3 n1=texture2D(tN,fx*.2+uT*vec2(.013,.007)).xyz*2.-1.,n2=texture2D(tN,fx*.53+uT*vec2(-.019,.012)).xyz*2.-1.,n3=texture2D(tN,fx*1.57+uT*vec2(.031,-.023)).xyz*2.-1.;
 vec2 det=(n1.xy*.26+n2.xy*.42*lod+n3.xy*.3*lod)*uDet;
 if(uRain>.002)det+=rainN(vW.xz)*uRain*lod*.9+n3.xy*uRain*.3*lod;if(uRingOn>0.)det+=ringN(vW.xz);
 vec3 N=normalize(vN);float lp=smoothstep(${R-.7},${R.toFixed(2)},length(vX));
 if(!gl_FrontFacing){vec3 c=uDeep*(uAmb*.45+uKey*.15)+uScat*(uAmb*.12+uKey*.1)*(.7+.3*n1.x);c=mix(c,uFogC,fogMix(dist));gl_FragColor=vec4(c,1.);return;}
 vec3 Nf=normalize(N+vec3(det.x,0.,det.y)*(.58-lp*.3)),Ng=normalize(N+vec3(det.x*1.6+n3.x*.55*lod,0.,det.y*1.6+n3.y*.55*lod));
 float NV=max(dot(Nf,V),0.),F=(.02+.98*pow(1.-NV,5.))*.82;vec3 Rf=reflect(-V,Nf);Rf.y=abs(Rf.y);vec3 Rg=reflect(-V,Ng);
 vec3 sky=skyC(Rf)*.86;vec3 Ls=normalize(vec3(uSunDir.x,max(uSunDir.y,.06),uSunDir.z));
 float hr=clamp(vW.y*uHI+.5,0.,1.),sss=pow(clamp(dot(V,-uKeyDir)*.6+.4,0.,1.),3.)*hr*hr;
 vec3 key=uKey*max(uKeyDir.y,0.);
 vec3 body=uDeep*(uAmb*.9+key*.55)*.3183+uScat*(uKey*sss*.22+uAmb*hr*.05+(uAmb*.14+key*.12)*lp);
 float sg=max(dot(Rg,Ls),0.),sb=max(dot(Rf,Ls),0.);
 vec3 Hs=normalize(V+Ls);float nh=max(dot(Ng,Hs),1e-3),t2=(1.-nh*nh)/(nh*nh),m2=.012+.01*uDet;
 float spk=smoothstep(.15,.9,texture2D(tN,fx*3.1+uT*vec2(.05,-.04)).x*texture2D(tN,fx*2.3-uT*vec2(.03,.06)).y*4.);
 float bk=exp(-t2/m2)/(3.1416*m2*nh*nh*nh*nh)*(.02+.98*pow(1.-max(dot(V,Hs),0.),5.))/max(4.*NV*Ls.y,.05);
 vec3 spec=uSunCol*uSunVis*uGlit*(pow(sg,700.)*70.+pow(sb,110.)*2.+pow(sb,14.)*.14+bk*(.35+2.6*spk)*.5);
 float mg=max(dot(Rg,uMoonDir),0.);spec+=uMoonC*uMoonVis*(pow(mg,900.)*14.+pow(max(dot(Rf,uMoonDir),0.),44.)*.7);
 vec3 Ld=uLanP-vW;float ld=length(Ld);Ld/=ld;spec+=uLanC*(pow(max(dot(Rg,Ld),0.),220.)*2.2+pow(max(dot(Rf,Ld),0.),18.)*.12)/(1.+ld*ld*.35);
 vec3 col=mix(body,sky,F)+spec*(.3+.7*F);
 float cap=smoothstep(.04,.62,1.-vJ)*uWhite;float f1=texture2D(tF,fx*.33).r,f2=texture2D(tF,fx*.86+.31).r;
 float foam=clamp(cap*(f1*1.3+f2*.6)-.12,0.,1.);
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

/* ---------------- floating body: lens of water beneath, rim falls and mist ---------------- */
{const pts=[];for(let k=0;k<=28;k++){const t=k/28,r=R*(1-t);pts.push(new T.V2(r+.0001,-.13-2.15*Math.pow(Math.max(1-Math.pow(r/R,2),0),.62)))}
 const g=new T.Lathe(pts,MOB?96:160);
 const m=new T.SM({uniforms:{...U,...SKY},transparent:true,depthWrite:false,side:2,
  vertexShader:`varying vec3 vW,vNw;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vNw=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:`uniform sampler2D tF;uniform float uT,uFogN,uFogF,uHaze;uniform vec3 uDeep,uScat,uAmb,uKey,uFogC,uBot;varying vec3 vW,vNw;${FOG}
  void main(){vec3 E=cameraPosition-vW;float d=length(E);vec3 V=E/d;vec3 N=normalize(vNw);float F=pow(1.-abs(dot(N,V)),2.5);float dp=clamp(-vW.y/2.3,0.,1.);
  vec3 c=mix(uScat*.55+uDeep*.7,uDeep*.4,dp)*(uAmb*.9+uKey*.3)*.3183;
  float sh=texture2D(tF,vec2(atan(vW.z,vW.x)/6.2832*16.,vW.y*.07+uT*.012)).g;c+=uScat*(uKey+uAmb)*.03*smoothstep(.45,.8,sh)*(1.-dp);
  c=mix(c,uBot*.7,F*.45);c=mix(c,uFogC,fogMix(d));gl_FragColor=vec4(c,mix(.55,.88,F)*(.75+.25*dp));
  #include <colorspace_fragment>
  }`});
 const lens=new T.Mesh(g,m);lens.renderOrder=1;root.add(lens)}
const fallU={uFT:{value:0},uFA:{value:1},uWind:Ue.uWind};
{const na=MOB?220:340,nv=30,pos=[],uv=[],idx=[];for(let i=0;i<=na;i++){const a=i/na*TAU;for(let j=0;j<=nv;j++){const s=j/nv,r=R+.01+.42*s+.25*s*s,y=-.13-(.18*s+5.2*s*s);pos.push(r*Math.cos(a),y,r*Math.sin(a));uv.push(i/na,s)}}
 for(let i=0;i<na;i++)for(let j=0;j<nv;j++){const a=i*(nv+1)+j,b=a+nv+1;idx.push(a,b,a+1,b,b+1,a+1)}
 const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setAttribute("uv",new T.BA(new Float32Array(uv),2));g.setIndex(idx);
 const m=new T.SM({uniforms:{...U,...SKY,...fallU},transparent:true,depthWrite:false,side:2,
  vertexShader:`uniform float uWind;varying vec2 vU;varying vec3 vW;void main(){vU=uv;vec3 p=position;p.x+=uWind*.55*uv.y*uv.y;p.z+=uWind*.17*uv.y*uv.y;vW=p;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}`,
  fragmentShader:`uniform sampler2D tF;uniform float uFT,uFA,uIce,uFogN,uFogF,uHaze;uniform vec3 uDeep,uScat,uAmb,uKey,uFogC;varying vec2 vU;varying vec3 vW;${FOG}
  void main(){float s=vU.y,x=vU.x;
  /* water accelerates as it falls: scroll in a stretched coordinate */
  float v=pow(s,.62)*2.2-uFT*.55;
  float gate=smoothstep(.22,.5,texture2D(tF,vec2(x*7.,.37)).g*.7+texture2D(tF,vec2(x*19.,.71)).b*.5);
  float a1=texture2D(tF,vec2(x*70.,v*.22)).g,a2=texture2D(tF,vec2(x*170.+.37,v*.45+.2)).g,a3=texture2D(tF,vec2(x*400.+.71,v*1.4)).g;
  float st=smoothstep(.5,.66,a1*.55+a2*.5)*(.75+.25*a3);
  float lip=1.-smoothstep(.0,.07,s),sheet=(1.-smoothstep(.02,.24,s))*(.45+.55*gate);
  /* the curtain tears into strands, then droplets, then mist */
  float brk=texture2D(tF,vec2(x*90.+.13,v*1.9-.4)).g*.6+texture2D(tF,vec2(x*210.,v*3.7)).r*.4;
  float keep=smoothstep(s*1.4-.62,s*1.4-.36,brk);
  float a=clamp(sheet*.7+gate*(.1+.9*st),0.,1.)*keep*(1.-smoothstep(.6,1.,s))*smoothstep(0.,.012,s+.01);a=max(a,lip*.8);
  float wht=clamp(st*.3+s*1.25-.08-sheet*.2,0.,1.);
  vec3 c=mix(uDeep*.8+uScat*.7,vec3(.9,.94,.97),wht)*(uAmb*.95+uKey*.62)*.3183*1.12;c+=lip*vec3(.95,.97,1.)*(uAmb+uKey)*.3183*.25;
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
/* a slow bank of cloud below the disc that the falls dissolve into */
const cbank=ptSys(MOB?26:40,tPuff);cbank.o.renderOrder=0;root.add(cbank.o);
const CB=[];for(let i=0;i<cbank.n;i++)CB.push({a:i/cbank.n*TAU+rr(-.1,.1),r:rr(R*.5,R*1.25),y:rr(-8.2,-6.2),sz:rr(6,10),ph:rnd()*TAU,w:rr(.004,.012)});

/* ---------------- spray / droplets ---------------- */
const spray=ptSys(MOB?380:640,tDot);spray.o.renderOrder=6;root.add(spray.o);
const SP=[];let spN=0;for(let i=0;i<spray.n;i++)SP.push({on:0,x:0,y:0,z:0,vx:0,vy:0,vz:0,age:0,life:1,sz:.04,a:1,lx:0,ly:0,lz:0,loc:0});
function emit(x,y,z,vx,vy,vz,life,sz,a){const q=SP[spN];spN=(spN+1)%spray.n;q.on=1;q.x=x;q.y=y;q.z=z;q.vx=vx;q.vy=vy;q.vz=vz;q.age=0;q.life=life;q.sz=sz;q.a=a;q.loc=0}

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
const WL=u=>{const xn=XS+(XB-XS)*u,K=kdF(xn);return K/(railF(xn)+K)};
/* hull texture in (station, girth) space so strakes follow the sheer */
const hullTex=srgbTex(canvas(1024,1024,(g,w,h)=>{const pal=["#4b3626","#563e2b","#5f4530","#463223","#523b29","#5a4231"];const NS=34;
 for(let k=0;k<NS;k++){const y0=h-(k+1)/NS*h,y1=h-k/NS*h;let x=0;while(x<w){const L=rr(70,170);g.fillStyle=pal[(rnd()*pal.length)|0];g.fillRect(x,y0,L,y1-y0);g.fillStyle="rgba(20,12,6,.55)";g.fillRect(x,y0,1.5,y1-y0);
  for(let t=0;t<3;t++){g.fillStyle=`rgba(${rnd()<.5?"30,20,10":"120,100,80"},${rr(.04,.12)})`;g.fillRect(x+rr(0,L),y0+rr(0,y1-y0),rr(10,50),rr(1,3))}x+=L}
  g.fillStyle="rgba(18,10,4,.7)";g.fillRect(0,y0,w,1.6);for(let x2=rr(0,30);x2<w;x2+=rr(30,60)){g.fillStyle="rgba(15,10,6,.6)";g.fillRect(x2,y0+3,2,2)}}
 const P=(u,y)=>{const xn=XS+(XB-XS)*u,K=kdF(xn);return h-(y+K)/(railF(xn)+K)*h};
 g.beginPath();for(let i=0;i<=200;i++){const u=i/200;g.lineTo(u*w,P(u,0))}g.lineTo(w,h);g.lineTo(0,h);g.closePath();g.fillStyle="rgba(22,18,14,.9)";g.fill();
 for(let i=0;i<=200;i++){const u=i/200;const y=P(u,0);g.fillStyle="rgba(78,86,52,.55)";g.fillRect(u*w,y-9,w/200+1,9);g.fillStyle="rgba(190,186,170,.28)";g.fillRect(u*w,y-14,w/200+1,2)}
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
const deckTex=srgbTex(canvas(512,512,(g,w,h)=>{const pal=["#7d6a52","#86725a","#74624b","#8c7a61","#6f5d47"];for(let y=0;y<h;y+=16){let x=-rr(0,100);while(x<w){const L=rr(90,220);g.fillStyle=pal[(rnd()*pal.length)|0];g.fillRect(x,y,L,16);g.fillStyle="rgba(30,22,14,.6)";g.fillRect(x,y,1.5,16);g.fillStyle="rgba(20,14,8,.35)";g.fillRect(x+3,y+7,2,2);g.fillRect(x+L-5,y+7,2,2);x+=L}g.fillStyle="rgba(26,18,10,.75)";g.fillRect(0,y,w,1.5)}
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
for(const[y,x0,x1]of DECKS){const pos=[],uv=[],idx=[];const n=Math.max(4,Math.round((x1-x0)/.08));let k=0;for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n,hw=Math.max(0,hwAt(x,y)-.015);pos.push(x,y,-hw,x,y,hw);uv.push(x*.45,-hw*.45,x*.45,hw*.45);if(i<n)idx.push(k,k+2,k+1,k+1,k+2,k+3);k+=2}
 const g=new T.BG();g.setAttribute("position",new T.BA(new Float32Array(pos),3));g.setAttribute("uv",new T.BA(new Float32Array(uv),2));g.setIndex(idx);g.computeVertexNormals();add(g,mDeck,0,0,0)}
const bulkTex=srgbTex(canvas(256,128,(g,w,h)=>{g.fillStyle="#4d3726";g.fillRect(0,0,w,h);for(let x=0;x<w;x+=12){g.fillStyle=`rgba(${rnd()<.5?"25,16,8":"110,85,60"},.3)`;g.fillRect(x,0,1.5,h)}
 const door=x=>{g.fillStyle="#2a1c12";g.fillRect(x,h*.25,34,h*.75);g.strokeStyle="#9c7a33";g.lineWidth=3;g.strokeRect(x,h*.25,34,h*.75)};door(w*.5-17);
 for(const x of[w*.2,w*.8]){g.fillStyle="#9c7a33";g.fillRect(x-14,h*.3-3,28,30);g.fillStyle="#141c22";g.fillRect(x-11,h*.3,22,24)}g.fillStyle="#9c7a33";g.fillRect(0,0,w,5)}));
const mBulk=M({map:bulkTex,roughness:.8});
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
 for(const[x,z]of[[1.15,.42],[1.25,.3],[-.3,-.42]])add(new T.Cyl(.06,.06,.13,10),mWood,x,.535,z)}
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
 add(new T.Cyl(.045,.058,m.low-m.base+.15,10),mSpar,x,(m.low+m.base-.15)/2,0);add(new T.Cyl(.21,.19,.035,14),mWood,x+.02,m.top,0);add(new T.Torus(.205,.012,5,16),mDark,x+.02,m.top+.02,0,Math.PI/2,0,0);
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
const SEAS=[{deep:"#1d4440",scat:"#5aa08a",haze:.014,S:.82,sat:.95,sep:.06,tint:[1,1.02,.99],lift:.03,ray:.45,vig:.22,con:.04},
 {deep:"#0c4150",scat:"#2ea896",haze:.005,S:.66,sat:1.06,sep:0,tint:[1,1.005,1],lift:0,ray:.5,vig:.18,con:.06},
 {deep:"#221d12",scat:"#8a7034",haze:.009,S:1.02,sat:.82,sep:.56,tint:[1.12,.98,.78],lift:.008,ray:1,vig:.36,con:.32},
 {deep:"#28333b",scat:"#5d808e",haze:.012,S:1.14,sat:.66,sep:.04,tint:[.96,.99,1.05],lift:.02,ray:.4,vig:.24,con:.05}];
const WM={sun:1,cloud:1.12,lrain:1.1,mrain:1.26,hrain:1.46,rain:1.26,storm:2.2,hail:1.36,snow:1};
const st={S:.8,vs:.2,ice:0,psi:.78,ox:0,oz:0,flowX:0,flowZ:0,ft:0,t:0,gr:{con:0,sat:1,sep:0,lift:0,ray:0,vig:.2,tint:new V3(1,1,1)},
 h:0,hv:0,p:0,pv:0,r:0,rv:0,yaw:0,bowPrev:0,rainAcc:0,bioT:0,reefC:0,reefT:0,ts:1};
const ShipC=new V3(-.25,0,.35);
const trailW=new Trail(MOB?50:70,9,.55,.16,.85),bowL=new Trail(MOB?34:46,5.5,.16,.07,.6),bowR=new Trail(MOB?34:46,5.5,.16,.07,.6),wl=new Ribbon(48,true);
const HULLRING=[];{const n=48;for(let i=0;i<n;i++){const a=i/n*TAU;const u=.5-.5*Math.cos(a),side=Math.sin(a)>=0?1:-1,xn=XS+(XB-XS)*u;HULLRING.push([xn+(u>.97?.03:0)+(u<.02?-.03:0),side*(Math.max(.03,hbF(xn)*sectF(xn,0,kdF(xn),railF(xn)))+.05),u])}}
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
 const cx=ShipC.x+.12*Math.sin(t*.05),cz=ShipC.z+.1*Math.sin(t*.037+.7),sx=-fz,sz2=fx,smp=(a,b)=>hAt(cx+fx*a+sx*b,cz+fz*a+sz2*b).y;
 const hb=smp(2.05,0),hs=smp(-2.0,0),hp=smp(0,-.78),hst=smp(0,.78),hc=smp(0,0);
 const tH=(hb+hs+hp+hst)*.18+hc*.28,tP=Math.atan2(hb-hs,4.05),tR=-Math.atan2(hst-hp,1.56)+(.035+.05*wn)*Math.min(1,st.vs*3)*(-1);
 const n=Math.ceil(dt/(1/120)),h=dt/n;for(let k=0;k<n;k++){st.hv+=(6.2*(tH-st.h)-2*.75*2.5*st.hv)*h;st.h+=st.hv*h;st.pv+=(4.4*(tP-st.p)-2*.7*2.1*st.pv)*h;st.p+=st.pv*h;st.rv+=(3.2*(tR-st.r)-2*.55*1.8*st.rv)*h;st.r+=st.rv*h}
 ship.position.set(cx,st.h-.06,cz);ship.rotation.set(st.r,psi,st.p);ship.updateMatrixWorld(true);
 /* sails: brace to apparent wind, billow, flutter, reef in a blow */
 const awx=(wn*1.2+.15)*Math.cos(a0)-ux,awz=(wn*1.2+.15)*Math.sin(a0)-uz,lax=awx*fx+awz*fz,laz=awx*sx+awz*sz2,aw=Math.hypot(lax,laz);
 const brace=cl(Math.atan2(laz,lax)*.8,-.6,.6);for(const p of PIV)p.rotation.y+=(-brace-p.rotation.y)*ease(.6,dt);latP.rotation.y=0;
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
 const bowW=toW(2.45,0,0,new V3()),strn=toW(-2.45,0,0,new V3());
 const spd=st.vs/.55;trailW.step(dt,{x:strn.x,z:strn.z,vx:0,vz:0},ux,uz,cl(.35+spd*.8,0,1.2));
 for(const[T2,sg]of[[bowL,-1],[bowR,1]]){const p=toW(1.95,0,sg*.55,new V3());T2.step(dt,{x:p.x,z:p.z,vx:sx*sg*.22*st.vs+ux*.0,vz:sz2*sg*.22*st.vs},ux,uz,cl(.25+spd*.9,0,1.1))}
 {const L=[];for(const[x,z,u]of HULLRING){const p=toW(x,0,z,tmpV2);L.push({x:p.x,z:p.z,w:.12+.1*ss(.75,1,u),a:.32+.55*ss(.7,1,u)*cl(spd,0,1.2)+.25*Math.min(1,Math.abs(st.pv)*2)})}wl.build(L)}
 /* bow spray when the bow plunges */
 {const hw=hAt(bowW.x,bowW.z).y,rel=bowW.y-hw,rv=(rel-st.bowPrev)/Math.max(dt,1e-3);st.bowPrev=rel;let nE=dt*(4+18*spd*(.4+wn))*(rel<.25?1:.2);if(rv<-.25&&rel<.3)nE+=dt*120*Math.min(1,-rv-.25);
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
 U.uFogC.value.copy(Jt.fog.color);U.uFogN.value=Jt.fog.near;U.uFogF.value=Jt.fog.far;
 {const lit=C1.copy(U.uAmb.value).multiplyScalar(.95).add(C2.copy(U.uKey.value).multiplyScalar(Math.max(U.uKeyDir.value.y,0)*.8)).multiplyScalar(.3183);
  spray.m.uniforms.uC.value.copy(lit).multiplyScalar(.95);hail.m.uniforms.uC.value.copy(lit).multiplyScalar(1.1);mist.m.uniforms.uC.value.copy(lit).multiplyScalar(.9).lerp(U.uFogC.value,.35);cbank.m.uniforms.uC.value.copy(lit).multiplyScalar(.85).lerp(U.uFogC.value,.5);
  blowS.m.uniforms.uC.value.copy(lit).multiplyScalar(1.05)}
 /* season colours ease in */
 const ke=ease(.9,dt);U.uDeep.value.lerp(C1.set(sz.deep).multiplyScalar(1-.25*rain),ke);U.uScat.value.lerp(C2.set(sz.scat),ke);U.uHaze.value+=(sz.haze*(1+rain*.8)+(w==="snow"?.008:0)-U.uHaze.value)*ke;
 U.uBio.value=night*(Ct.season===1?1:Ct.season===0?.25:0)*.9;
 /* lanterns and stern windows */
 const lg=.12+night*3.4;mGlass.emissiveIntensity=lg;mStern.emissiveIntensity=night*1.6;lanL.intensity=night*2.2*(.92+.08*Math.sin(t*9)*Math.sin(t*5.3));
 toW(-2.72,1.95,0,tmpV2);U.uLanP.value.copy(tmpV2);U.uLanC.value.setRGB(1,.62,.3).multiplyScalar(night*1.6);
 const envI=.4*(1-night*.85)*(1-rain*.3);for(const m of mats)m.envMapIntensity=envI;
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
 life(dt,E);try{sound(dt,E)}catch(e){}}

/* ---------------- sea life: dolphins, whales and gulls ---------------- */
const ENV={},LOG=[],logE=(k,p)=>{LOG.push({k,t:+st.t.toFixed(3),x:+p.x.toFixed(2),y:+p.y.toFixed(2),z:+p.z.toFixed(2)});LOG.length>60&&LOG.shift()};
const tbl=(S,V)=>s=>{let i=0;while(i<S.length-2&&s>S[i+1])i++;const k=cl((s-S[i])/(S[i+1]-S[i]),0,1),u=k*k*(3-2*k);return V[i]+(V[i+1]-V[i])*u};
/* creatures never show below the top of the water body (it is see-through from the side) */
const lifeM=()=>{const m=M({vertexColors:true,roughness:.34,metalness:0,side:2},{snow:0,wet:0}),ob=m.onBeforeCompile;
 m.onBeforeCompile=(sh,r)=>{ob.call(m,sh,r);sh.fragmentShader=sh.fragmentShader.replace("#include <clipping_planes_fragment>","if(vWP.y<-1.05)discard;\n#include <clipping_planes_fragment>")};m.customProgramCacheKey=()=>"sealife";return m};
/* a tapered body of rings along a spine plus flat appendages, posed through a frame function */
class Body{constructor(L,NR,NA,prof,colF,apps){this.L=L;this.NR=NR;this.NA=NA;this.prof=prof;this.apps=apps;
  const nr=(NR+1)*NA,nv=nr+2+apps.reduce((a,p)=>a+p.v.length,0);this.P=new Float32Array(nv*3);const C=new Float32Array(nv*3),idx=[];
  for(let i=0;i<=NR;i++)for(let j=0;j<NA;j++)C.set(colF(i/NR,Math.sin(j/NA*TAU)),(i*NA+j)*3);
  C.set(colF(0,0),nr*3);C.set(colF(1,0),nr*3+3);
  for(let i=0;i<NR;i++)for(let j=0;j<NA;j++){const j2=(j+1)%NA,a=i*NA+j,b=i*NA+j2;idx.push(a,a+NA,b,b,a+NA,b+NA)}
  for(let j=0;j<NA;j++){const j2=(j+1)%NA;idx.push(nr,j,j2,nr+1,NR*NA+j2,NR*NA+j)}
  let o=nr+2;for(const p of apps){p.o=o;p.v.forEach((v,k)=>C.set(p.c,(o+k)*3));for(const t of p.t)idx.push(o+t[0],o+t[1],o+t[2]);o+=p.v.length}
  const g=new T.BG();g.setAttribute("position",new T.BA(this.P,3));g.setAttribute("color",new T.BA(C,3));g.setIndex(idx);this.g=g;
  this.o=new T.Mesh(g,lifeM());this.o.frustumCulled=false;this.o.castShadow=true;this.o.visible=false;root.add(this.o);this.fr={p:new V3(),t:new V3(),n:new V3(),b:new V3()}}
 pose(F,roll){const P=this.P,NA=this.NA,fr=this.fr,cr=Math.cos(roll),sr=Math.sin(roll),put=(k,u,v,w)=>{const bu=u*cr-v*sr,bv=u*sr+v*cr;
   P[k]=fr.p.x+fr.t.x*w+fr.b.x*bu+fr.n.x*bv;P[k+1]=fr.p.y+fr.t.y*w+fr.b.y*bu+fr.n.y*bv;P[k+2]=fr.p.z+fr.t.z*w+fr.b.z*bu+fr.n.z*bv};
  const sv=(o)=>{o.p.copy(fr.p);o.t.copy(fr.t);o.n.copy(fr.n);o.b.copy(fr.b)},ld=(o)=>{fr.p.copy(o.p);fr.t.copy(o.t);fr.n.copy(o.n);fr.b.copy(o.b)},f0=this.f0||(this.f0={p:new V3(),t:new V3(),n:new V3(),b:new V3()}),f1=this.f1||(this.f1={p:new V3(),t:new V3(),n:new V3(),b:new V3()});
  for(let i=0;i<=this.NR;i++){const s=i/this.NR;F(s,fr);i===0&&sv(f0);i===this.NR&&sv(f1);const[rw,rh,dy]=this.prof(s);for(let j=0;j<NA;j++){const a=j/NA*TAU,sa=Math.sin(a);put((i*NA+j)*3,Math.cos(a)*rw,sa*rh*(sa<0?.92:1)+dy,0)}}
  const nr=(this.NR+1)*NA;ld(f0);put(nr*3,0,this.prof(0)[2],this.L*.012);ld(f1);put(nr*3+3,0,this.prof(1)[2],-this.L*.01);
  for(const p of this.apps){p.s>=1?ld(f1):p.s<=0?ld(f0):F(p.s,fr);p.v.forEach((v,k)=>put((p.o+k)*3,v[1],v[2],v[0]))}
  this.g.attributes.position.needsUpdate=true;this.g.computeVertexNormals()}}
const hex=h=>{const c=new C3(h);return[c.r,c.g,c.b]};
const mix3=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];
/* fluke outline (t back, b lateral) as a fan from the root */
function flukeApp(k,col){const R0=[.03,0,0],O=[[-.06,.1,0],[-.2,.3,0],[-.36,.47,.03],[-.35,.33,0],[-.31,.16,0],[-.27,0,0]];const v=[R0.map(x=>x*k)],t=[];
 for(const sg of[1,-1]){const b=v.length;O.forEach(p=>v.push([p[0]*k,p[1]*k*sg,p[2]*k]));for(let i=0;i<O.length-1;i++)t.push([0,b+i,b+i+1])}return{s:1,v,t,c:col}}
/* whale (humpback-like): long white flippers, small dorsal, broad flukes */
const WLN=2.7,WR=.27,WD=[.2,.5,.74,.92,1,.93,.74,.48,.25,.14,.09],WS=[0,.04,.1,.2,.32,.48,.62,.75,.86,.94,1],wPr=tbl(WS,WD);
const wTop=hex("#232a2e"),wBel=hex("#8d9597"),wFin=hex("#c4cacb");
const whale=new Body(WLN,MOB?30:40,MOB?12:16,s=>{const r=WR*wPr(s);return[r,r*.86,-r*.04]},(s,sa)=>mix3(wTop,wBel,ss(.1,-.75,sa)*(s<.8?1:.45)),
 [flukeApp(1,hex("#3b4448")),{s:.28,v:[[.1,.2,-.12],[-.12,.2,-.14],[-.4,.55,-.36],[-.62,.78,-.42]],t:[[0,3,2],[0,2,1]],c:wFin},
  {s:.28,v:[[.1,-.2,-.12],[-.12,-.2,-.14],[-.4,-.55,-.36],[-.62,-.78,-.42]],t:[[0,2,3],[0,1,2]],c:wFin},{s:.66,v:[[.08,0,.13],[-.1,0,.24],[-.16,0,.13]],t:[[0,1,2]],c:wTop}]);
/* dolphin: beak, melon, falcate dorsal */
const DL=.62,DR=.075,dPr=tbl([0,.05,.11,.2,.35,.5,.65,.8,.9,1],[.12,.2,.45,.82,1,.92,.68,.4,.22,.12]);
const dTop=hex("#3a434a"),dFl=hex("#7a868d"),dBel=hex("#d3d8da");
function mkDolphin(){const b=new Body(DL,MOB?16:22,MOB?8:10,s=>{const r=DR*dPr(s);return[r*.92,r,0]},(s,sa)=>sa>.35?dTop:sa>-.35?mix3(dTop,dFl,ss(.35,-.1,sa)):mix3(dFl,dBel,ss(-.35,-.7,sa)),
  [flukeApp(.25,dTop),{s:.45,v:[[.05,0,.05],[-.07,0,.15],[-.06,0,.05]],t:[[0,1,2]],c:dTop},{s:.24,v:[[.02,.05,-.03],[-.03,.05,-.03],[-.09,.12,-.07]],t:[[0,1,2]],c:dTop},{s:.24,v:[[.02,-.05,-.03],[-.03,-.05,-.03],[-.09,-.12,-.07]],t:[[0,2,1]],c:dTop}]);
 b.pose((s,f)=>{f.p.set((.5-s)*DL,0,0);f.t.set(1,0,0);f.n.set(0,1,0);f.b.set(0,0,1)},0);return b}
const DOL=[...Array(4)].map(mkDolphin);
/* whale path: arc-length polyline from a curvature schedule (rise, cruise, roll, arch, dive) */
const WSEG=[[2,.3],[1.4,0],[2.6,0],[.9,-.1],[1.4,.1],[.9,0],[1,0],[1,.5],[1,-1.45],[2.4,-1.45]],WP={x:[0],y:[0],f:[.3],su:[],du:.02};
{let x=0,y=0,ph=.3,u=0;for(const[len,pe]of WSEG){WP.su.push(u);const n=Math.max(1,Math.round(len/WP.du)),p0=ph,h=len/n;for(let i=1;i<=n;i++){const a=p0+(pe-p0)*(i-.5)/n;x+=Math.cos(a)*h;y+=Math.sin(a)*h;ph=p0+(pe-p0)*i/n;WP.x.push(x);WP.y.push(y);WP.f.push(ph)}u+=len}
 WP.L=u;WP.n=WP.x.length;let ai=0;const i0=Math.round(WP.su[7]/WP.du),i1=Math.round(WP.su[9]/WP.du);for(let i=i0;i<i1;i++)if(WP.y[i]>WP.y[ai]||ai<i0)ai=i;WP.apex=ai*WP.du;WP.cy=WP.y[Math.round(WP.su[2]/WP.du)]}
const pAt=(u,o)=>{const n=WP.n,du=WP.du;if(u<=0){o.x=u*Math.cos(.3);o.y=u*Math.sin(.3);o.f=.3;return o}const fi=u/du;if(fi>=n-1){const d=u-(n-1)*du,f=WP.f[n-1];o.x=WP.x[n-1]+d*Math.cos(f);o.y=WP.y[n-1]+d*Math.sin(f);o.f=f;return o}
 const i=Math.floor(fi),k=fi-i;o.x=WP.x[i]+(WP.x[i+1]-WP.x[i])*k;o.y=WP.y[i]+(WP.y[i+1]-WP.y[i])*k;o.f=WP.f[i]+(WP.f[i+1]-WP.f[i])*k;return o};
const WH={on:0,ox:0,oz:0,hx:1,hz:0,y0:0,uh:0,v:.5,blown:0,slap:-1,slapped:0,bend:0,hold:0,sa:0,sung:0,drip:0},PO={x:0,y:0,f:0},pv=new V3();
function whaleF(s,f){const H=WH,u=H.uh-s*WLN;if(s<=.82||H.bend<=0){pAt(u,PO);const c=Math.cos(PO.f),sn=Math.sin(PO.f);const x=H.ox+H.hx*PO.x,z=H.oz+H.hz*PO.x,yl=H.y0+PO.y;
  f.p.set(x,yl+ss(-.95,-.05,yl)*hAt(x,z).y*.85,z);f.t.set(H.hx*c,sn,H.hz*c);f.n.set(-H.hx*sn,c,-H.hz*sn);f.b.set(-H.hz,0,H.hx);pv.copy(f.p);H.ps=s;return}
 /* tail stock bends toward vertical so the flukes stand up, then throws them back onto the water */
 pAt(u,PO);const a=PO.f+(-1.62+H.sa-PO.f)*Math.pow((s-.82)/.18,1.4)*H.bend,c=Math.cos(a),sn=Math.sin(a);f.t.set(H.hx*c,sn,H.hz*c);f.n.set(-H.hx*sn,c,-H.hz*sn);f.b.set(-H.hz,0,H.hx);
 if(s>H.ps){pv.addScaledVector(f.t,-(s-H.ps)*WLN);H.ps=s}f.p.copy(pv)}
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
const blowS=ptSys(MOB?90:150,tPuff);blowS.o.renderOrder=6;root.add(blowS.o);
const BLW=[];let blN=0;for(let i=0;i<blowS.n;i++)BLW.push({on:0,x:0,y:0,z:0,vx:0,vy:0,vz:0,age:0,life:1,sz:.2,a:.6});
function puff(x,y,z,vx,vy,vz,life,sz,a){const q=BLW[blN];blN=(blN+1)%blowS.n;Object.assign(q,{on:1,x,y,z,vx,vy,vz,age:0,life,sz,a})}
const POD={on:0,ox:0,oz:0,hx:1,hz:0,M:[],cl:0},LF={dN:6,wN:16,sN:30,bN:40,first:1};
function spawnPod(E){const sg=rnd()<.5?-1:1;const cam=De.position;let best=null;
 for(let tr=0;tr<12;tr++){const a=st.psi+st.yaw+rr(-.35,.35),hx=Math.cos(a),hz=-Math.sin(a),bx=-hz,bz=hx;const side=((cam.x-E.cx)*bx+(cam.z-E.cz)*bz>0?1:-1)*(rnd()<.75?1:-1);
  const lat=side*rr(1.3,2.8),back=rr(3,4.6),ox=E.cx-hx*back+bx*lat,oz=E.cz-hz*back+bz*lat;let ok=Math.hypot(ox,oz)<R-1.6;const ex=ox+hx*7,ez=oz+hz*7;ok=ok&&Math.hypot(ex,ez)<R-1.2;if(ok){best={ox,oz,hx,hz};break}}
 if(!best)return 0;Object.assign(POD,best,{on:1,cl:rr(.4,1.2),M:[]});const n=Math.min(DOL.length,2+Math.floor(rnd()*3));
 for(let i=0;i<n;i++)POD.M.push({b:DOL[i],a:-i*rr(.2,.5),lat:(i-(n-1)/2)*rr(.28,.42)+rr(-.08,.08),st:0,tl:rr(.2,1.3)+i*.3,t:0,tau:1,h:.4,y:-.6,up:0,leaps:3+Math.floor(rnd()*3),vd:rr(1.05,1.25)});
 return 1}
function spawnWhale(E){const cam=De.position,fx=Math.cos(st.psi),fz=-Math.sin(st.psi),u0=WP.su[2]-.3,u1=WP.apex+WLN+.3;
 for(let tr=0;tr<24;tr++){const a=st.psi+st.yaw+rr(-.6,.6),hx=Math.cos(a),hz=-Math.sin(a);
  const ang=Math.atan2(cam.z,cam.x)+rr(-1.2,1.2),rad=rr(1.5,6.5),sx0=Math.cos(ang)*rad,sz0=Math.sin(ang)*rad;
  /* route of the visible stretch, with the water's drift, must stay on the disc and clear of the ship */
  const tAt=u=>u/.45+(u>WP.apex+WLN-.4?3.6:0);pAt(u0,PO);const xs=PO.x,ts=tAt(u0),ox=sx0-hx*xs+fx*st.vs*ts,oz=sz0-hz*xs+fz*st.vs*ts;let ok=true;
  for(let k=0;k<=12&&ok;k++){const u=u0+(u1-u0)*k/12;pAt(u,PO);const tt=tAt(u),px=ox+hx*PO.x-fx*st.vs*tt,pz=oz+hz*PO.x-fz*st.vs*tt;
   for(const b of[0,WLN*.5,WLN]){pAt(u-b,PO);const qx=ox+hx*PO.x-fx*st.vs*tt,qz=oz+hz*PO.x-fz*st.vs*tt;if(Math.hypot(qx,qz)>R-1.8||Math.hypot(qx-E.cx,qz-E.cz)<2.9)ok=false}}
  if(!ok)continue;
  Object.assign(WH,{on:1,ox,oz,hx,hz,y0:-.07-WP.cy,uh:0,v:.5,blown:0,slap:-1,slapped:0,bend:0,hold:0,sa:0,sung:0,drip:0,bt:0,bd:1,bs:1,ba:0});whale.o.visible=true;return 1}return 0}
const lw=new V3(),lw2=new V3(),lq=new T.Quat(),lm=new T.M4();
function life(dt,E){const t=st.t,se=Ct.season,amb=(window.__sndX||{}).amb!==false,nt=E.night>.5,heavy=/storm|hail/.test(E.w);
 if(LF.first){LF.first=0;LF.dN=t+rr(4,7);LF.wN=t+(se>=2?rr(10,16):rr(30,50));LF.sN=t+rr(20,40);LF.bN=t+rr(25,60)}
 /* schedule: dolphins favour summer, whales autumn and winter */
 if(!POD.on&&t>LF.dN){const I=[[30,55],[12,24],[40,70],[70,120]][se],k=(nt?1.5:1)*(E.storm?2:1);if(spawnPod(E))LF.dN=t+rr(I[0],I[1])*k+8;else LF.dN=t+3}
 if(!WH.on&&t>LF.wN){const I=[[70,110],[100,160],[34,55],[30,50]][se];if(spawnWhale(E))LF.wN=t+rr(I[0],I[1])*(E.storm?1.3:1)+25;else LF.wN=t+4}
 if(t>LF.sN){LF.sN=t+rr(40,90)*(se>=2?1:2.2);if(amb&&(se>=2||rnd()<.35)){const a=rnd()*TAU;lw.set(Math.cos(a)*30,-6,Math.sin(a)*30);shot(rnd()<.5?"zWs1":"zWs2",.32,lw,rr(.94,1.04),1);logE("song",lw)}}
 /* dolphins */
 if(POD.on){POD.ox-=E.ux*dt;POD.oz-=E.uz*dt;let alive=0;const bx=-POD.hz,bz=POD.hx;
  for(const m of POD.M){m.a+=m.vd*dt;const x=POD.ox+POD.hx*m.a+bx*m.lat,z=POD.oz+POD.hz*m.a+bz*m.lat;const out=Math.hypot(x,z)>R-1.1;
   if(m.st===0){m.tl-=dt;m.y=-.6;if(m.tl<=0&&m.leaps>0&&!out){m.st=1;m.t=0;m.tau=rr(1.1,1.35);m.h=rr(.55,.85);m.leaps--}}
   else{m.t+=dt;const k=m.t/m.tau;if(k>=1){m.st=0;m.tl=rr(.5,1.4)}else m.y=-.26+4*m.h*k*(1-k)}
   if(m.st===1||m.leaps>0&&!out)alive++;const hw=hAt(x,z).y,y=m.y+hw*.6,vy=m.st?4*m.h*(1-2*m.t/m.tau)/m.tau:0;
   const above=y>hw+.01;if(above!==!!m.up){m.up=above;lw.set(x,hw,z);if(above){for(let k=0;k<14;k++)emit(x+rr(-.05,.05),hw+.02,z+rr(-.05,.05),POD.hx*rr(.2,.7)+rr(-.25,.25),rr(.6,1.4),POD.hz*rr(.2,.7)+rr(-.25,.25),rr(.4,.7),rr(.025,.045),.75);ring(x,z,.6);shot("zDex",.42,lw,rr(.92,1.08));logE("dExit",lw)}
    else{for(let k=0;k<26;k++){const a=rnd()*TAU,sp=rr(.3,1);emit(x+rr(-.06,.06),hw+.02,z+rr(-.06,.06),Math.cos(a)*sp*.6,rr(.9,2),Math.sin(a)*sp*.6,rr(.5,.9),rr(.03,.06),.8)}ring(x,z,.9);shot("zDen",.55,lw,rr(.9,1.08));logE("dEntry",lw)}}
   const o=m.b.o;o.visible=m.st===1&&y>hw-.45;if(o.visible){lw.set(POD.hx*m.vd,vy,POD.hz*m.vd).normalize();lw2.set(bx,0,bz);const n=new V3().crossVectors(lw2,lw).normalize();lm.makeBasis(lw,n,lw2);o.quaternion.setFromRotationMatrix(lm);o.position.set(x,y,z)}}
  POD.cl-=dt;if(POD.cl<=0&&alive){POD.cl=rr(1.2,3.5);const m=POD.M[0];lw.set(POD.ox+POD.hx*m.a,0,POD.oz+POD.hz*m.a);if(amb){const k=rnd();shot(k<.45?"zDcl":k<.75?"zDw1":"zDw2",.3,lw,rr(.95,1.06));logE("dVoice",lw)}}
  if(!alive){POD.on=0;for(const m of POD.M)m.b.o.visible=false}}
 /* whale: rise, blow, roll, arch, raise the flukes, slap, dive */
 if(WH.on){const H=WH;H.ox-=E.ux*dt;H.oz-=E.uz*dt;const ut=H.uh-WLN;
  if(ut>=WP.apex-.35)H.bend=Math.min(1,H.bend+dt/1.1);
  if(H.slap>=0){H.slap+=dt;const k=Math.min(1,H.slap/.45);H.sa=1.95*k*k;H.v=0;if(H.slap>.9){H.slap=-2;H.v=.7}}
  else{const tgt=H.uh<WP.su[2]-.4?.55:H.uh<WP.su[3]?.32:H.uh<WP.su[7]?.5:ut<WP.apex-.6?.5:H.slap===-2?.75:.2;H.v+=(tgt-H.v)*ease(1.5,dt)}
  H.uh+=H.v*dt;
  if(H.slap===-1&&H.bend>=1){H.hold+=dt;if(H.hold>1.3)H.slap=0}
  const roll=H.uh>WP.su[3]&&H.uh<WP.su[6]?.55*Math.sin(Math.PI*(H.uh-WP.su[3])/(WP.su[6]-WP.su[3])):0;
  whale.pose(whaleF,roll);
  /* blowhole a little behind the head */
  whaleF(.1,whale.fr);const bh=whale.fr.p;const hwB=hAt(bh.x,bh.z).y;
  /* the exhale lasts as long as its sound (about 0.8 s): puffs stream from the blowhole the whole time */
  if(H.bt>0){const k=1-H.bt/H.bd;H.bt-=dt;H.ba+=dt*(MOB?70:110)*H.bs;for(;H.ba>1;H.ba--){const vy=rr(1.9,3.4)*(1-.35*k)*H.bs,sp=.1+vy*.11;puff(bh.x+rr(-.04,.04),hwB+.1+rr(0,.06),bh.z+rr(-.04,.04),rr(-sp,sp)+E.wn*.3,vy,rr(-sp,sp),rr(2.2,4),rr(.16,.3),.36)}
   if(rnd()<dt*40)emit(bh.x,hwB+.12,bh.z,rr(-.35,.35),rr(1.4,3)*H.bs,rr(-.35,.35),rr(.8,1.3),rr(.025,.045),.55)}
  if(!H.blown&&H.uh>WP.su[2]+.55){H.blown=1;H.bt=H.bd=.8;H.bs=1;H.ba=0;lw.copy(bh);lw.y=hwB;shot("zWbl",.7,lw,rr(.96,1.03));logE("wBlow",lw);
   if(amb&&!H.sung&&rnd()<.6){H.sung=1;shot(rnd()<.5?"zWs1":"zWs2",.26,lw2.set(lw.x,-4,lw.z),rr(.95,1.03),1)}}
  if(H.blown===1&&H.uh>WP.su[3]+.3){H.blown=2;H.bt=H.bd=.55;H.bs=.6;H.ba=0;lw.copy(bh);lw.y=hwB;shot("zWbl",.45,lw,rr(1.04,1.1));logE("wBlow2",lw)}
  /* flukes: water streams off while raised; the slap lands when the tip meets the water */
  const ft=lw2.copy(whale.f1.p).addScaledVector(whale.f1.t,-.36),hT=hAt(ft.x,ft.z).y;
  if(ft.y>hT+.05&&ut>WP.apex-.5){H.drip+=dt*60;for(;H.drip>1;H.drip--)emit(ft.x+rr(-.25,.25)*H.hz,ft.y-rr(0,.1),ft.z+rr(-.25,.25)*H.hx,rr(-.1,.1),-rr(0,.3),rr(-.1,.1),rr(.5,.9),rr(.02,.035),.6)}
  if(H.slap>.1&&!H.slapped&&ft.y<hT+.02){H.slapped=1;lw.set(ft.x,hT,ft.z);for(let i=0;i<(MOB?120:200);i++){const a=rnd()*TAU,sp=rr(.4,2.4);emit(ft.x+rr(-.3,.3),hT+.03,ft.z+rr(-.3,.3),Math.cos(a)*sp*.7,rr(1.2,3.6),Math.sin(a)*sp*.7,rr(.7,1.4),rr(.03,.07),.85)}
   for(let i=0;i<18;i++)puff(ft.x+rr(-.3,.3),hT+.1,ft.z+rr(-.3,.3),rr(-.4,.4),rr(.4,1.2),rr(-.4,.4),rr(1.2,2),rr(.25,.45),.4);ring(ft.x,ft.z,1.6);ring(ft.x+.2,ft.z-.15,1.1);shot("zWsl",.95,lw,rr(.96,1.02));logE("wSlap",lw)}
  if(H.uh>WP.L+WLN*.4||H.slapped&&ft.y<hT-1.1){H.on=0;whale.o.visible=false}}
 /* blow plume */
 for(let i=0;i<blowS.n;i++){const q=BLW[i];if(!q.on){blowS.a[i]=0;continue}q.age+=dt;if(q.age>q.life){q.on=0;blowS.a[i]=0;continue}const dr=Math.exp(-dt*1.9);q.vx=(q.vx-E.wn*.9)*dr+E.wn*.9;q.vz*=dr;q.vy=q.vy*dr-.12*dt;
  q.x+=(q.vx-E.ux*.3)*dt;q.y+=q.vy*dt;q.z+=(q.vz-E.uz*.3)*dt;const u=q.age/q.life;blowS.p.set([q.x,q.y,q.z],i*3);blowS.a[i]=q.a*(1-u)*(1-u)*Math.min(1,q.age*8);blowS.s[i]=q.sz*(1+u*2.2)}
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
window.__sea={st,ship,root,W,hAt,U,SAILS,FL,De,Ce:X.Ce,Cn,grade:gradeM,jt,trailW,wl,bowL,LOG,WH,POD,GU,AU,WP,whale,
 spawn:k=>k==="whale"?(WH.on=0,spawnWhale(ENV)):k==="dolphin"?(POD.on=0,spawnPod(ENV)):0};
window.__seaReady=true;
};
})();
