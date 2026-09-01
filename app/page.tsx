'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Activity, AlertTriangle, CloudRain, Crosshair, Plane, Radio, Search, Ship, Video, Waves, Zap } from 'lucide-react';

const layers = [
  ['Public cameras', Video, 184, '#19d3ae'], ['Aircraft', Plane, 643, '#78a8ff'],
  ['Vessels', Ship, 912, '#31c6f4'], ['Radio', Radio, 126, '#c991ff'],
  ['Weather', CloudRain, 18, '#f2b84b'], ['Public alerts', AlertTriangle, 27, '#ff6577'],
] as const;
const events = [
  ['TRANSPORT', 'M25 J10 · Slow traffic reported', 'National Highways', '18 sec'],
  ['WEATHER', 'Heavy rain cell moving north-east', 'Met Office', '42 sec'],
  ['MARITIME', 'CARGO vessel entering Solent', 'AIS public feed', '1 min'],
  ['AVIATION', 'BAW82 descent into Heathrow', 'OpenSky Network', '2 min'],
  ['LOCAL', 'Planned road closure · A82', 'Traffic Scotland', '4 min'],
];
const points = [[54,75,'plane'],[47,63,'cam'],[58,56,'ship'],[50,49,'radio'],[45,82,'alert'],[61,87,'plane'],[41,39,'cam'],[56,31,'radio'],[65,45,'ship'],[37,68,'plane'],[52,91,'cam'],[44,55,'alert']] as const;

export default function Home() {
  const threeHost = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState(new Date());
  const [selected, setSelected] = useState('Public cameras');
  const [zoom, setZoom] = useState(1);
  const [paused, setPaused] = useState(false);
  useEffect(() => { const id = setInterval(() => { if (!paused) setTime(new Date()); }, 1000); return () => clearInterval(id); }, [paused]);
  useEffect(() => {
    const host=threeHost.current;if(!host)return;
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(50,1,.1,100);
    const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.appendChild(renderer.domElement);
    const geometry=new THREE.BufferGeometry();const vertices=[];for(let i=0;i<650;i++)vertices.push((Math.random()-.5)*11,(Math.random()-.5)*8,(Math.random()-.5)*5);geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    const cloud=new THREE.Points(geometry,new THREE.PointsMaterial({color:0x32d9b4,size:.018,transparent:true,opacity:.22}));scene.add(cloud);camera.position.z=6;
    let frame=0;const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()};resize();const observer=new ResizeObserver(resize);observer.observe(host);
    const animate=()=>{cloud.rotation.y+=.0006;cloud.rotation.x+=.00015;renderer.render(scene,camera);frame=requestAnimationFrame(animate)};animate();
    return()=>{cancelAnimationFrame(frame);observer.disconnect();renderer.dispose();geometry.dispose();host.removeChild(renderer.domElement)};
  },[]);
  return <main className="ops-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><Waves size={18}/></span><div><strong>UK SIGNAL</strong><small>PUBLIC SITUATIONAL AWARENESS</small></div></div>
      <div className="search"><Search size={15}/><input aria-label="Search UK location" placeholder="Search location, vessel, flight or station…"/><kbd>⌘ K</kbd></div>
      <div className="status"><span className="live-dot"/>LIVE <b>{time.toLocaleTimeString('en-GB',{hour12:false})}</b><button onClick={()=>setPaused(!paused)}>{paused?'Resume':'Pause'}</button></div>
    </header>
    <section className="workspace">
      <aside className="left-panel panel">
        <div className="panel-title"><span>LAYERS</span><b>6 / 6</b></div>
        {layers.map(([name,Icon,count,color])=><button className={`layer ${selected===name?'active':''}`} key={name} onClick={()=>setSelected(name)}><span className="layer-icon" style={{color}}><Icon size={16}/></span><span>{name}</span><b>{count}</b><i style={{background:color}}/></button>)}
        <div className="mini-weather"><span>UNITED KINGDOM</span><div><b>14°</b><CloudRain size={34}/></div><p>Light rain · W 19 km/h</p><div className="weather-row"><span>London<br/><b>16°</b></span><span>Cardiff<br/><b>15°</b></span><span>Edinburgh<br/><b>11°</b></span></div></div>
        <div className="integrity"><Activity size={15}/><span><b>FEED INTEGRITY 96.8%</b><small>2 providers delayed</small></span></div>
      </aside>
      <section className="map-wrap">
        <div className="map-meta"><span><Crosshair size={14}/>54.7024° N, 3.2766° W</span><span>HYBRID · PUBLIC SOURCES</span></div>
        <div className="map-stage" style={{'--zoom':zoom} as React.CSSProperties}>
          <div className="three-field" ref={threeHost}/>
          <div className="grid-lines"/><div className="radar-ring r1"/><div className="radar-ring r2"/><div className="radar-sweep"/>
          <svg className="uk-map" viewBox="0 0 410 600" aria-label="Stylized map of the United Kingdom"><path d="M245 45l-26 30 8 35-34 31 19 26-25 45 18 33-35 24 11 39-38 34 18 51-27 39 20 31-11 47 43 5 28-31 30-4 14-42 38-20-7-39 31-47-18-58-35-28-22-49 19-48-21-48 10-45-25-35z"/><path d="M88 302l-35 21 13 55 44-12 15-43z"/></svg>
          {points.map(([x,y,type],i)=><button key={i} className={`pin ${type}`} style={{left:`${x}%`,top:`${y}%`}} aria-label={`${type} marker`}><span>{type==='cam'?'●':type==='plane'?'✈':type==='ship'?'◆':type==='radio'?'◉':'!'}</span></button>)}
          <div className="selected-card"><span className="cam-preview"><Video size={24}/><i>PUBLIC FEED</i></span><div><small>A30 / Temple · London</small><b>Westbound carriageway</b><span><i/> LIVE · refreshed 21s ago</span></div></div>
          <div className="zoom"><button onClick={()=>setZoom(Math.min(1.35,zoom+.1))}>+</button><button onClick={()=>setZoom(Math.max(.8,zoom-.1))}>−</button></div>
        </div>
        <div className="map-footer"><span><i className="green"/>184 cameras</span><span><i className="blue"/>643 aircraft</span><span><i className="cyan"/>912 vessels</span><span><i className="purple"/>126 stations</span><b>Public, licensed or simulated data</b></div>
      </section>
      <aside className="right-panel panel">
        <div className="panel-title"><span>LIVE INTELLIGENCE</span><b><Zap size={12}/>STREAMING</b></div><div className="severity"><span>ALL</span><span>CRITICAL</span><span>WATCH</span></div>
        <div className="event-list">{events.map((e,i)=><article className="event" key={e[1]}><div className={`event-icon e${i}`}><AlertTriangle size={14}/></div><div><small>{e[0]}<time>{e[3]}</time></small><b>{e[1]}</b><span>{e[2]} · verified public feed</span></div></article>)}</div>
        <div className="snapshot"><span>NATIONAL SNAPSHOT</span><div><b>1,902<small> active objects</small></b><em>+8.4%</em></div><svg viewBox="0 0 260 55"><path d="M0 42 L18 36 34 39 52 23 69 31 86 12 104 25 121 18 140 28 158 9 177 20 195 15 213 29 232 17 260 6"/></svg></div>
        <button className="source-btn">Manage data sources <span>12 connected →</span></button>
      </aside>
    </section>
    <footer className="ticker"><span className="ticker-label">BREAKING / LOCAL</span><div><b>London</b> TfL reports minor delays on the Elizabeth line <i>•</i><b>Manchester</b> Wind advisory through 21:00 <i>•</i><b>Portsmouth</b> Harbour traffic normal</div><span>UPDATED NOW</span></footer>
  </main>;
}
