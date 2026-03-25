
/* ============================================================
   LIQUID GRADIENT WEBGL BACKGROUND
   ============================================================ */
class TouchTexture {
  constructor() {
    this.size = 64;
    this.width = this.height = this.size;
    this.maxAge = 64;
    this.radius = 0.25 * this.size;
    this.speed = 1 / this.maxAge;
    this.trail = [];
    this.last = null;
    this.initTexture();
  }
  initTexture() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    this.texture = new THREE.Texture(this.canvas);
  }
  update() {
    this.clear();
    for (let i=this.trail.length-1;i>=0;i--) {
      const p=this.trail[i];
      let f=p.force*this.speed*(1-p.age/this.maxAge);
      p.x+=p.vx*f; p.y+=p.vy*f; p.age++;
      if(p.age>this.maxAge) this.trail.splice(i,1);
      else this.drawPoint(p);
    }
    this.texture.needsUpdate=true;
  }
  clear() {
    this.ctx.fillStyle='black';
    this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
  }
  addTouch(point) {
    let force=0,vx=0,vy=0;
    const last=this.last;
    if(last){
      const dx=point.x-last.x,dy=point.y-last.y;
      if(dx===0&&dy===0)return;
      const d=Math.sqrt(dx*dx+dy*dy);
      vx=dx/d;vy=dy/d;
      force=Math.min((dx*dx+dy*dy)*20000,2.0);
    }
    this.last={x:point.x,y:point.y};
    this.trail.push({x:point.x,y:point.y,age:0,force,vx,vy});
  }
  drawPoint(point) {
    const pos={x:point.x*this.width,y:(1-point.y)*this.height};
    let intensity=1;
    if(point.age<this.maxAge*0.3) intensity=Math.sin((point.age/(this.maxAge*0.3))*(Math.PI/2));
    else { const t=1-(point.age-this.maxAge*0.3)/(this.maxAge*0.7); intensity=-t*(t-2); }
    intensity*=point.force;
    const radius=this.radius;
    let color=`${((point.vx+1)/2)*255},${((point.vy+1)/2)*255},${intensity*255}`;
    let offset=this.size*5;
    this.ctx.shadowOffsetX=offset;this.ctx.shadowOffsetY=offset;
    this.ctx.shadowBlur=radius*1;
    this.ctx.shadowColor=`rgba(${color},${0.2*intensity})`;
    this.ctx.beginPath();
    this.ctx.fillStyle='rgba(255,0,0,1)';
    this.ctx.arc(pos.x-offset,pos.y-offset,radius,0,Math.PI*2);
    this.ctx.fill();
  }
}

class GradientBackground {
  constructor(sm) {
    this.sm=sm; this.mesh=null;
    this.uniforms={
      uTime:{value:0},
      uResolution:{value:new THREE.Vector2(window.innerWidth,window.innerHeight)},
      uColor1:{value:new THREE.Vector3(0.945,0.353,0.133)},
      uColor2:{value:new THREE.Vector3(0.039,0.055,0.153)},
      uColor3:{value:new THREE.Vector3(0.945,0.353,0.133)},
      uColor4:{value:new THREE.Vector3(0.039,0.055,0.153)},
      uColor5:{value:new THREE.Vector3(0.945,0.353,0.133)},
      uColor6:{value:new THREE.Vector3(0.039,0.055,0.153)},
      uSpeed:{value:1.2},
      uIntensity:{value:1.8},
      uTouchTexture:{value:null},
      uGrainIntensity:{value:0.06},
      uZoom:{value:1.0},
      uDarkNavy:{value:new THREE.Vector3(0.039,0.055,0.153)},
      uGradientSize:{value:0.45},
      uGradientCount:{value:12.0},
      uColor1Weight:{value:0.5},
      uColor2Weight:{value:1.8}
    };
  }
  init() {
    const vs=this.sm.getViewSize();
    const geo=new THREE.PlaneGeometry(vs.width,vs.height,1,1);
    const mat=new THREE.ShaderMaterial({
      uniforms:this.uniforms,
      vertexShader:`varying vec2 vUv;void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);vUv=uv;}`,
      fragmentShader:`
        uniform float uTime;uniform vec2 uResolution;
        uniform vec3 uColor1,uColor2,uColor3,uColor4,uColor5,uColor6;
        uniform float uSpeed,uIntensity;
        uniform sampler2D uTouchTexture;
        uniform float uGrainIntensity,uZoom;
        uniform vec3 uDarkNavy;
        uniform float uGradientSize,uGradientCount,uColor1Weight,uColor2Weight;
        varying vec2 vUv;
        #define PI 3.14159265359
        float grain(vec2 uv,float time){
          vec2 g=uv*uResolution*0.5;
          return fract(sin(dot(g+time,vec2(12.9898,78.233)))*43758.5453)*2.-1.;
        }
        vec3 getGradientColor(vec2 uv,float time){
          float gr=uGradientSize;
          vec2 c1=vec2(.5+sin(time*uSpeed*.4)*.4,.5+cos(time*uSpeed*.5)*.4);
          vec2 c2=vec2(.5+cos(time*uSpeed*.6)*.5,.5+sin(time*uSpeed*.45)*.5);
          vec2 c3=vec2(.5+sin(time*uSpeed*.35)*.45,.5+cos(time*uSpeed*.55)*.45);
          vec2 c4=vec2(.5+cos(time*uSpeed*.5)*.4,.5+sin(time*uSpeed*.4)*.4);
          vec2 c5=vec2(.5+sin(time*uSpeed*.7)*.35,.5+cos(time*uSpeed*.6)*.35);
          vec2 c6=vec2(.5+cos(time*uSpeed*.45)*.5,.5+sin(time*uSpeed*.65)*.5);
          vec2 c7=vec2(.5+sin(time*uSpeed*.55)*.38,.5+cos(time*uSpeed*.48)*.42);
          vec2 c8=vec2(.5+cos(time*uSpeed*.65)*.36,.5+sin(time*uSpeed*.52)*.44);
          vec2 c9=vec2(.5+sin(time*uSpeed*.42)*.41,.5+cos(time*uSpeed*.58)*.39);
          vec2 c10=vec2(.5+cos(time*uSpeed*.48)*.37,.5+sin(time*uSpeed*.62)*.43);
          float i1=1.-smoothstep(0.,gr,length(uv-c1));
          float i2=1.-smoothstep(0.,gr,length(uv-c2));
          float i3=1.-smoothstep(0.,gr,length(uv-c3));
          float i4=1.-smoothstep(0.,gr,length(uv-c4));
          float i5=1.-smoothstep(0.,gr,length(uv-c5));
          float i6=1.-smoothstep(0.,gr,length(uv-c6));
          float i7=1.-smoothstep(0.,gr,length(uv-c7));
          float i8=1.-smoothstep(0.,gr,length(uv-c8));
          float i9=1.-smoothstep(0.,gr,length(uv-c9));
          float i10=1.-smoothstep(0.,gr,length(uv-c10));
          vec2 ru1=uv-.5;
          float a1=time*uSpeed*.15;
          ru1=vec2(ru1.x*cos(a1)-ru1.y*sin(a1),ru1.x*sin(a1)+ru1.y*cos(a1));ru1+=.5;
          vec2 ru2=uv-.5;
          float a2=-time*uSpeed*.12;
          ru2=vec2(ru2.x*cos(a2)-ru2.y*sin(a2),ru2.x*sin(a2)+ru2.y*cos(a2));ru2+=.5;
          float ri1=1.-smoothstep(0.,.8,length(ru1-.5));
          float ri2=1.-smoothstep(0.,.8,length(ru2-.5));
          vec3 color=vec3(0.);
          color+=uColor1*i1*(.55+.45*sin(time*uSpeed))*uColor1Weight;
          color+=uColor2*i2*(.55+.45*cos(time*uSpeed*1.2))*uColor2Weight;
          color+=uColor3*i3*(.55+.45*sin(time*uSpeed*.8))*uColor1Weight;
          color+=uColor4*i4*(.55+.45*cos(time*uSpeed*1.3))*uColor2Weight;
          color+=uColor5*i5*(.55+.45*sin(time*uSpeed*1.1))*uColor1Weight;
          color+=uColor6*i6*(.55+.45*cos(time*uSpeed*.9))*uColor2Weight;
          if(uGradientCount>6.){
            color+=uColor1*i7*(.55+.45*sin(time*uSpeed*1.4))*uColor1Weight;
            color+=uColor2*i8*(.55+.45*cos(time*uSpeed*1.5))*uColor2Weight;
            color+=uColor3*i9*(.55+.45*sin(time*uSpeed*1.6))*uColor1Weight;
            color+=uColor4*i10*(.55+.45*cos(time*uSpeed*1.7))*uColor2Weight;
          }
          color+=mix(uColor1,uColor3,ri1)*.45*uColor1Weight;
          color+=mix(uColor2,uColor4,ri2)*.4*uColor2Weight;
          color=clamp(color,vec3(0.),vec3(1.))*uIntensity;
          float lum=dot(color,vec3(.299,.587,.114));
          color=mix(vec3(lum),color,1.35);
          color=pow(color,vec3(.92));
          float b=length(color);
          color=mix(uDarkNavy,color,max(b*1.2,.15));
          float mb=length(color);
          if(mb>1.) color*=1./mb;
          return color;
        }
        void main(){
          vec2 uv=vUv;
          vec4 tt=texture2D(uTouchTexture,uv);
          float vx=-(tt.r*2.-1.),vy=-(tt.g*2.-1.),ti=tt.b;
          uv.x+=vx*.8*ti; uv.y+=vy*.8*ti;
          float dist=length(uv-.5);
          float rip=sin(dist*20.-uTime*3.)*.04*ti;
          float wav=sin(dist*15.-uTime*2.)*.03*ti;
          uv+=vec2(rip+wav);
          vec3 color=getGradientColor(uv,uTime);
          color+=grain(uv,uTime)*uGrainIntensity;
          float ts=uTime*.5;
          color.r+=sin(ts)*.02;
          color.g+=cos(ts*1.4)*.02;
          color.b+=sin(ts*1.2)*.02;
          float b2=length(color);
          color=mix(uDarkNavy,color,max(b2*1.2,.15));
          color=clamp(color,vec3(0.),vec3(1.));
          float mb2=length(color);
          if(mb2>1.) color*=1./mb2;
          gl_FragColor=vec4(color,1.);
        }
      `
    });
    this.mesh=new THREE.Mesh(geo,mat);
    this.mesh.position.z=0;
    this.sm.scene.add(this.mesh);
  }
  update(delta){if(this.uniforms.uTime)this.uniforms.uTime.value+=delta;}
  onResize(w,h){
    const vs=this.sm.getViewSize();
    if(this.mesh){this.mesh.geometry.dispose();this.mesh.geometry=new THREE.PlaneGeometry(vs.width,vs.height,1,1);}
    if(this.uniforms.uResolution)this.uniforms.uResolution.value.set(w,h);
  }
}

class BgApp {
  constructor(){
    this.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',alpha:false,stencil:false,depth:false});
    this.renderer.setSize(window.innerWidth,window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    this.renderer.domElement.id='webGLApp';
    document.body.insertBefore(this.renderer.domElement,document.body.firstChild);
    this.camera=new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,10000);
    this.camera.position.z=50;
    this.scene=new THREE.Scene();
    this.scene.background=new THREE.Color(0x0a0e27);
    this.clock=new THREE.Clock();
    this.touchTexture=new TouchTexture();
    this.gradientBackground=new GradientBackground(this);
    this.gradientBackground.uniforms.uTouchTexture.value=this.touchTexture.texture;
    this.init();
  }
  init(){
    this.gradientBackground.init();
    this.tick();
    window.addEventListener('resize',()=>this.onResize());
    window.addEventListener('mousemove',(e)=>this.onMouseMove(e));
    window.addEventListener('touchmove',(e)=>{const t=e.touches[0];this.onMouseMove({clientX:t.clientX,clientY:t.clientY});});
  }
  onMouseMove(e){
    this.touchTexture.addTouch({x:e.clientX/window.innerWidth,y:1-e.clientY/window.innerHeight});
  }
  getViewSize(){
    const f=(this.camera.fov*Math.PI)/180;
    const h=Math.abs(this.camera.position.z*Math.tan(f/2)*2);
    return{width:h*this.camera.aspect,height:h};
  }
  tick(){
    const delta=Math.min(this.clock.getDelta(),.1);
    this.touchTexture.update();
    this.gradientBackground.update(delta);
    this.renderer.render(this.scene,this.camera);
    requestAnimationFrame(()=>this.tick());
  }
  onResize(){
    this.camera.aspect=window.innerWidth/window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth,window.innerHeight);
    this.gradientBackground.onResize(window.innerWidth,window.innerHeight);
  }
}

// Boot WebGL background
const bgApp = new BgApp();

/* ============================================================
   SITE INTERACTIVITY
   ============================================================ */
// cursor
const cur=document.getElementById('cur'),curR=document.getElementById('curR');
let mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;cur.style.transform=`translate(${mx-5}px,${my-5}px)`});
(function loop(){rx+=(mx-rx-17)*.12;ry+=(my-ry-17)*.12;curR.style.transform=`translate(${rx}px,${ry}px)`;requestAnimationFrame(loop)})();
document.querySelectorAll('a,button,.gcard,.ndot,.snav-item,.mini-orb,.orb').forEach(el=>{
  el.addEventListener('mouseenter',()=>{curR.style.width='52px';curR.style.height='52px';curR.style.borderColor='rgba(196,168,130,.8)'});
  el.addEventListener('mouseleave',()=>{curR.style.width='34px';curR.style.height='34px';curR.style.borderColor='rgba(196,168,130,.5)'});
});

// progress bar
const prog=document.getElementById('prog');
window.addEventListener('scroll',()=>{prog.style.width=(window.scrollY/(document.body.scrollHeight-window.innerHeight)*100)+'%';},{passive:true});

// scroll reveal
const secs=document.querySelectorAll('.esec');
const ndots=document.querySelectorAll('.ndot');
const snavs=document.querySelectorAll('.snav-item');
const io=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('iv');
      const id=e.target.id;
      ndots.forEach(d=>d.classList.remove('active'));
      const nd=document.querySelector(`.ndot[data-t="${id}"]`);
      if(nd)nd.classList.add('active');
      snavs.forEach(s=>s.classList.remove('active'));
      const sn=document.querySelector(`.snav-item[data-t="${id}"]`);
      if(sn)sn.classList.add('active');
    }
  });
},{threshold:0.35});
secs.forEach(s=>io.observe(s));
new IntersectionObserver(entries=>{
  if(entries[0].isIntersecting){
    ndots.forEach(d=>d.classList.remove('active'));
    document.querySelector('.ndot[data-t="hero"]').classList.add('active');
    snavs.forEach(s=>s.classList.remove('active'));
  }
},{threshold:0.5}).observe(document.getElementById('hero'));

document.querySelectorAll('[data-t]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.t)));

function go(id){const el=document.getElementById(id);if(el)el.scrollIntoView({behavior:'smooth'});}

// parallax
window.addEventListener('scroll',()=>{
  const sy=window.scrollY;
  document.querySelectorAll('.orb-wrap').forEach((w,i)=>{w.style.transform=`translateY(${sy*.03*(i%2===0?1:-1)}px)`;});
},{passive:true});
