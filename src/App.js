import { useState, useEffect, useRef } from "react";

// ─── Watch dimensions (44mm Apple Watch) ─────────────────────────────────────
const W = 198, H = 242;

// ─── Mock round data ──────────────────────────────────────────────────────────
const HOLES = [
  {n:1, par:4, hdcp:8,  front:365, center:377, back:399, hazards:[{label:"Bunker L", toFront:210, toCarry:225, side:"left", type:"bunker"}]},
  {n:2, par:5, hdcp:12, front:487, center:502, back:530, hazards:[{label:"Bunker R", toFront:260, toCarry:275, side:"right", type:"bunker"},{label:"Ocean L", toFront:300, toCarry:320, side:"left", type:"water"}]},
  {n:3, par:4, hdcp:14, front:373, center:388, back:408, hazards:[{label:"Greenside Bunker", toFront:355, toCarry:370, side:"right", type:"bunker"}]},
  {n:4, par:4, hdcp:4,  front:318, center:331, back:352, hazards:[{label:"Bunker L", toFront:180, toCarry:195, side:"left", type:"bunker"}]},
  {n:5, par:3, hdcp:18, front:180, center:195, back:213, hazards:[{label:"Ocean R", toFront:160, toCarry:180, side:"right", type:"water"}]},
  {n:6, par:5, hdcp:6,  front:501, center:516, back:542, hazards:[{label:"Bunker", toFront:220, toCarry:240, side:"right", type:"bunker"},{label:"Ocean L", toFront:400, toCarry:420, side:"left", type:"water"}]},
  {n:7, par:3, hdcp:16, front:95,  center:107, back:123, hazards:[{label:"Cove R", toFront:80, toCarry:100, side:"right", type:"water"}]},
  {n:8, par:4, hdcp:2,  front:416, center:431, back:455, hazards:[{label:"Bunker R", toFront:195, toCarry:210, side:"right", type:"bunker"}]},
  {n:9, par:4, hdcp:10, front:448, center:464, back:488, hazards:[{label:"Bay L", toFront:240, toCarry:265, side:"left", type:"water"}]},
  {n:10,par:4, hdcp:7,  front:430, center:446, back:470, hazards:[{label:"Bunker", toFront:220, toCarry:235, side:"right", type:"bunker"}]},
  {n:11,par:4, hdcp:11, front:365, center:381, back:401, hazards:[{label:"Bunker L", toFront:195, toCarry:210, side:"left", type:"bunker"}]},
  {n:12,par:3, hdcp:15, front:187, center:202, back:219, hazards:[{label:"Ocean", toFront:155, toCarry:175, side:"both", type:"water"}]},
  {n:13,par:4, hdcp:3,  front:377, center:392, back:414, hazards:[{label:"Bunker R", toFront:200, toCarry:215, side:"right", type:"bunker"}]},
  {n:14,par:5, hdcp:13, front:557, center:573, back:601, hazards:[{label:"Bunker L", toFront:280, toCarry:298, side:"left", type:"bunker"}]},
  {n:15,par:4, hdcp:1,  front:381, center:397, back:418, hazards:[{label:"Bay L", toFront:200, toCarry:220, side:"left", type:"water"}]},
  {n:16,par:4, hdcp:9,  front:387, center:403, back:423, hazards:[{label:"Bunker R", toFront:230, toCarry:248, side:"right", type:"bunker"}]},
  {n:17,par:3, hdcp:17, front:162, center:178, back:194, hazards:[{label:"Ocean L", toFront:145, toCarry:165, side:"left", type:"water"}]},
  {n:18,par:5, hdcp:5,  front:527, center:543, back:570, hazards:[{label:"Bay L", toFront:280, toCarry:300, side:"left", type:"water"},{label:"Bunker R", toFront:320, toCarry:338, side:"right", type:"bunker"}]},
];

const CLUBS = [
  {name:"Driver",  avg:262, p90:275},
  {name:"3W",      avg:228, p90:240},
  {name:"5W",      avg:210, p90:222},
  {name:"5i",      avg:188, p90:198},
  {name:"6i",      avg:175, p90:184},
  {name:"7i",      avg:162, p90:170},
  {name:"8i",      avg:148, p90:156},
  {name:"9i",      avg:132, p90:140},
  {name:"PW",      avg:112, p90:120},
  {name:"GW",      avg:92,  p90:100},
  {name:"SW",      avg:72,  p90:82},
  {name:"LW",      avg:52,  p90:60},
  {name:"Putter",  avg:null,p90:null},
];

const LIES = [
  {id:"tee",     label:"Tee",     emoji:"🟦"},
  {id:"fairway", label:"Fairway", emoji:"🟩"},
  {id:"rough",   label:"Rough",   emoji:"🟫"},
  {id:"bunker",  label:"Bunker",  emoji:"🏖️"},
  {id:"green",   label:"Green",   emoji:"⛳"},
  {id:"water",   label:"Water/OB",emoji:"💧"},
];

const SCREENS = {
  HOLE:    "hole",
  CLUBS:   "clubs",
  SWING:   "swing",
  FLIGHT:  "flight",
  LOG:     "log",
  PUTTS:   "putts",
  SUMMARY: "summary",
  CARD:    "scorecard",
  PICKER:  "picker",
};

// ─── Haptic simulator ─────────────────────────────────────────────────────────
function useHaptic() {
  return () => {
    if(navigator.vibrate) navigator.vibrate(40);
  };
}

// ─── Main Watch App ───────────────────────────────────────────────────────────
export default function WatchApp() {
  const [screen,    setScreen]   = useState(SCREENS.HOLE);
  const [holeIdx,   setHoleIdx]  = useState(0);
  const [scores,    setScores]   = useState(Array(18).fill(null));
  const [puttsList, setPuttsList]= useState(Array(18).fill(0));
  const [shotLog,   setShotLog]  = useState(Array(18).fill(null).map(()=>[]));
  const [selClub,   setSelClub]  = useState(null);
  const [shotDist,  setShotDist] = useState(null);
  const [selLie,    setSelLie]   = useState(null);
  const [selDir,    setSelDir]   = useState(null);
  const [traveled,  setTraveled] = useState(0); // yards hit this hole
  const [prevScreen,setPrevScreen]=useState(null);
  const [flightSec, setFlightSec]= useState(0);
  const [longPress, setLongPress]= useState(false);
  const lpRef = useRef(null);
  const haptic = useHaptic();
  const hole = HOLES[holeIdx];

  // Remaining distances update as shots are hit
  const remainCenter = Math.max(0, hole.center - traveled);
  const remainFront  = Math.max(0, hole.front  - traveled - 12);
  const remainBack   = remainCenter + 22;
  const hazardsAhead = hole.hazards
    .map(h=>({...h, toFront:Math.max(0,h.toFront-traveled), toCarry:Math.max(0,h.toCarry-traveled)}))
    .filter(h=>h.toFront>0);

  // Running totals
  const completedHoles = scores.filter(s=>s!==null).length;
  const totalScore  = scores.reduce((a,s)=>a+(s||0),0);
  const totalPar    = HOLES.slice(0,completedHoles).reduce((a,h)=>a+h.par,0);
  const roundDiff   = totalScore - totalPar;

  // Flight timer
  useEffect(()=>{
    if(screen!==SCREENS.FLIGHT){setFlightSec(0);return;}
    const t=setInterval(()=>setFlightSec(s=>s+1),1000);
    return()=>clearInterval(t);
  },[screen]);

  const nav=(to,from)=>{
    haptic();
    setPrevScreen(from||screen);
    setScreen(to);
  };

  const goBack=()=>{
    haptic();
    setScreen(prevScreen||SCREENS.HOLE);
  };

  const confirmSwing=()=>{
    haptic();
    nav(SCREENS.FLIGHT, SCREENS.SWING);
  };

  const confirmBallHere=()=>{
    // Simulate GPS distance
    const dist = selClub ? (CLUBS.find(c=>c.name===selClub)?.avg || 150) + Math.round((Math.random()-0.5)*30) : 150;
    setShotDist(dist);
    haptic();
    setSelLie(null);setSelDir(null);
    nav(SCREENS.LOG, SCREENS.FLIGHT);
  };

  const confirmShot=()=>{
    if(!selLie)return;
    haptic();
    const shot={club:selClub, dist:shotDist, lie:selLie, dir:selDir};
    setShotLog(prev=>{const n=[...prev];n[holeIdx]=[...n[holeIdx],shot];return n;});
    if(selLie==="green"){
      setTraveled(t=>t+(shotDist||0));
      setSelClub(null);setShotDist(null);
      nav(SCREENS.HOLE, SCREENS.LOG);
    } else {
      setTraveled(t=>t+(shotDist||0));
      setSelClub(null);setShotDist(null);
      nav(SCREENS.HOLE, SCREENS.LOG);
    }
  };

  const confirmPutts=(n)=>{
    haptic();
    const shots=shotLog[holeIdx].length+(n);
    const sc=shots;
    setScores(prev=>{const arr=[...prev];arr[holeIdx]=sc;return arr;});
    setPuttsList(prev=>{const arr=[...prev];arr[holeIdx]=n;return arr;});
    nav(SCREENS.SUMMARY, SCREENS.PUTTS);
  };

  const advanceHole=()=>{
    haptic();
    if(holeIdx<17){
      setHoleIdx(h=>h+1);
      setTraveled(0);setSelClub(null);setShotDist(null);setSelLie(null);setSelDir(null);
      nav(SCREENS.HOLE, SCREENS.SUMMARY);
    }
  };

  const goToHole=(n)=>{
    haptic();
    setHoleIdx(n);
    setTraveled(0);setSelClub(null);setShotDist(null);
    nav(SCREENS.HOLE, SCREENS.PICKER);
  };

  const scColor=(s,p)=>{if(s===null)return"#555";const d=s-p;if(d<=-2)return"#f59e0b";if(d===-1)return"#4ade80";if(d===0)return"#e8dcc8";if(d===1)return"#f97316";return"#f87171";};
  const scoreLabel=(s,p)=>{if(s===null)return"—";const d=s-p;if(d<=-2)return"Eagle";if(d===-1)return"Birdie";if(d===0)return"Par";if(d===1)return"Bogey";if(d===2)return"Double";return`+${d}`;};

  const currentScore = scores[holeIdx];
  const currentPutts = puttsList[holeIdx];
  const currentShots = shotLog[holeIdx];

  return (
    <div style={{minHeight:"100vh",background:"#111",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:24,padding:40,fontFamily:"system-ui"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@300;400;600;700&display=swap');
        * { box-sizing: border-box; margin:0; padding:0; }
        .watch-btn { transition: all 0.1s; }
        .watch-btn:active { transform: scale(0.94); opacity:0.8; }
        ::-webkit-scrollbar { display:none; }
      `}</style>

      {/* Label */}
      <div style={{color:"#555",fontSize:13,letterSpacing:2,textTransform:"uppercase"}}>GameTime Golf · Watch Simulator</div>
      <div style={{color:"#333",fontSize:11,letterSpacing:1}}>Pebble Beach Golf Links · Blue Tees</div>

      {/* Watch body */}
      <div style={{position:"relative",width:W+32,height:H+48}}>
        {/* Watch case */}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(145deg,#2a2a2a,#1a1a1a)",borderRadius:52,boxShadow:"0 0 0 1.5px #3a3a3a, 0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)"}}>
          {/* Crown */}
          <div style={{position:"absolute",right:-6,top:"35%",width:6,height:40,background:"linear-gradient(to right,#2a2a2a,#3a3a3a)",borderRadius:"0 4px 4px 0",boxShadow:"2px 0 4px rgba(0,0,0,0.5)"}}/>
          {/* Side button */}
          <div style={{position:"absolute",right:-6,top:"62%",width:6,height:22,background:"linear-gradient(to right,#2a2a2a,#3a3a3a)",borderRadius:"0 4px 4px 0",boxShadow:"2px 0 4px rgba(0,0,0,0.5)"}}/>
        </div>

        {/* Screen */}
        <div style={{position:"absolute",top:16,left:16,width:W,height:H,borderRadius:38,overflow:"hidden",background:"#000"}}>

          {/* ── HOLE OVERVIEW ── */}
          {screen===SCREENS.HOLE&&(
            <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:"#000"}}>
              {/* Header */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px 4px"}}>
                <div
                  style={{cursor:"pointer"}}
                  onMouseDown={()=>{lpRef.current=setTimeout(()=>{haptic();nav(SCREENS.PICKER);},600);}}
                  onMouseUp={()=>clearTimeout(lpRef.current)}
                  onMouseLeave={()=>clearTimeout(lpRef.current)}
                >
                  <div style={{fontSize:11,color:"#555",letterSpacing:1,lineHeight:1}}>HOLE</div>
                  <div style={{fontFamily:"'SF Pro Display',system-ui",fontSize:28,fontWeight:700,color:"#fff",lineHeight:1}}>{hole.n}</div>
                </div>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:10,color:"#555",letterSpacing:1}}>PAR</div>
                  <div style={{fontSize:22,fontWeight:600,color:"#c8a96e",lineHeight:1}}>{hole.par}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:10,color:"#555",letterSpacing:1}}>ROUND</div>
                  <div style={{fontSize:16,fontWeight:700,color:roundDiff<=0?"#4ade80":roundDiff<=4?"#f97316":"#f87171",lineHeight:1}}>
                    {completedHoles>0?(roundDiff===0?"E":roundDiff>0?`+${roundDiff}`:roundDiff):"—"}
                  </div>
                </div>
              </div>

              {/* Distances */}
              <div style={{display:"flex",gap:4,padding:"4px 10px"}}>
                {[{l:"FRT",v:remainFront,c:"#fbbf24"},{l:"CTR",v:remainCenter,c:"#c8a96e"},{l:"BCK",v:remainBack,c:"#fb923c"}].map(({l,v,c})=>(
                  <div key={l} style={{flex:1,background:"rgba(255,255,255,0.06)",borderRadius:10,padding:"6px 4px",textAlign:"center"}}>
                    <div style={{fontSize:8,color:"#555",letterSpacing:1,marginBottom:1}}>{l}</div>
                    <div style={{fontSize:19,fontWeight:700,color:c,lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Hazards */}
              <div style={{flex:1,overflowY:"auto",padding:"2px 10px"}}>
                {hazardsAhead.length===0&&(
                  <div style={{fontSize:10,color:"#2a2a2a",textAlign:"center",padding:"6px 0"}}>No hazards ahead ✓</div>
                )}
                {hazardsAhead.map((h,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                    <span style={{fontSize:12}}>{h.type==="water"?"💧":"🏖️"}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:10,color:"#999",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{h.label}</div>
                      <div style={{fontSize:9,color:"#555"}}>{h.side==="both"?"Both":h.side==="left"?"◀ L":"R ▶"}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:h.type==="water"?"#38bdf8":"#d97706",lineHeight:1}}>{h.toFront}</div>
                      <div style={{fontSize:9,color:"#4ade80",lineHeight:1}}>{h.toCarry} carry</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{display:"flex",gap:6,padding:"6px 10px 10px"}}>
                <button className="watch-btn" onClick={()=>nav(SCREENS.CLUBS)} style={{flex:3,background:"#c8a96e",border:"none",borderRadius:12,padding:"10px 0",fontSize:12,fontWeight:700,color:"#000",cursor:"pointer"}}>
                  + Shot
                </button>
                <button className="watch-btn" onClick={()=>nav(SCREENS.PUTTS)} style={{flex:2,background:"rgba(74,222,128,0.15)",border:"1px solid rgba(74,222,128,0.3)",borderRadius:12,padding:"10px 0",fontSize:12,fontWeight:600,color:"#4ade80",cursor:"pointer"}}>
                  ⛳ Putt
                </button>
                <button className="watch-btn" onClick={()=>nav(SCREENS.CARD)} style={{flex:1,background:"rgba(255,255,255,0.06)",border:"none",borderRadius:12,padding:"10px 0",fontSize:14,cursor:"pointer"}}>
                  📋
                </button>
              </div>

              {/* Long press hint */}
              <div style={{textAlign:"center",paddingBottom:6,fontSize:8,color:"#2a2a2a"}}>Hold hole # to jump</div>
            </div>
          )}

          {/* ── CLUB SELECT ── */}
          {screen===SCREENS.CLUBS&&(
            <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:"#000"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px 4px"}}>
                <button className="watch-btn" onClick={goBack} style={{background:"none",border:"none",color:"#c8a96e",fontSize:16,cursor:"pointer",padding:0}}>‹</button>
                <div style={{fontSize:12,fontWeight:600,color:"#fff",letterSpacing:0.5}}>Select Club</div>
              </div>
              {/* Distance strip */}
              <div style={{display:"flex",gap:4,padding:"0 8px 4px"}}>
                {[{l:"FRT",v:remainFront,c:"#fbbf24"},{l:"CTR",v:remainCenter,c:"#c8a96e"},{l:"BCK",v:remainBack,c:"#fb923c"}].map(({l,v,c})=>(
                  <div key={l} style={{flex:1,background:"rgba(255,255,255,0.06)",border:`1px solid ${c}44`,borderRadius:8,padding:"5px 2px",textAlign:"center"}}>
                    <div style={{fontSize:16,fontWeight:700,color:c,lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{v}</div>
                    <div style={{fontSize:7,color:"#555",letterSpacing:1,marginTop:1}}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"0 8px 8px"}}>
                {CLUBS.map((c,i)=>(
                  <button key={i} className="watch-btn" onClick={()=>{setSelClub(c.name);if(c.name==="Putter"){nav(SCREENS.PUTTS);}else{nav(SCREENS.SWING);}}}
                    style={{width:"100%",display:"flex",alignItems:"center",background:selClub===c.name?"rgba(200,169,110,0.15)":"rgba(255,255,255,0.04)",border:`1px solid ${selClub===c.name?"rgba(200,169,110,0.4)":"rgba(255,255,255,0.06)"}`,borderRadius:10,padding:"7px 10px",marginBottom:4,cursor:"pointer",textAlign:"left"}}>
                    <div style={{flex:1,fontSize:13,fontWeight:600,color:"#e8dcc8"}}>{c.name}</div>
                    {c.avg?(
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:11,color:"#c8a96e",fontWeight:700}}>{c.avg}<span style={{fontSize:8,color:"#555"}}> avg</span></div>
                        <div style={{fontSize:10,color:"#4ade80"}}>{c.p90}<span style={{fontSize:8,color:"#555"}}> p90</span></div>
                      </div>
                    ):<div style={{fontSize:10,color:"#555"}}>—</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── SWING READY ── */}
          {screen===SCREENS.SWING&&(
            <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",background:"#000",padding:"14px 12px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,alignSelf:"flex-start"}}>
                <button className="watch-btn" onClick={()=>nav(SCREENS.CLUBS)} style={{background:"none",border:"none",color:"#c8a96e",fontSize:16,cursor:"pointer",padding:0}}>‹</button>
                <div style={{fontSize:11,color:"#555",letterSpacing:1}}>READY</div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:26,fontWeight:700,color:"#c8a96e",letterSpacing:1,marginBottom:4}}>{selClub}</div>
                <div style={{fontSize:10,color:"#555"}}>🌬️ 8mph NW · Tap before you swing</div>
              </div>
              <button className="watch-btn" onClick={confirmSwing}
                style={{width:"100%",background:"linear-gradient(135deg,#22c55e,#16a34a)",border:"none",borderRadius:18,padding:"18px 0",fontSize:16,fontWeight:800,color:"#000",cursor:"pointer",letterSpacing:2,boxShadow:"0 0 24px rgba(34,197,94,0.4)"}}>
                SWING
              </button>
            </div>
          )}

          {/* ── IN FLIGHT ── */}
          {screen===SCREENS.FLIGHT&&(
            <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",background:"#000",padding:"14px 12px"}}>
              <div style={{fontSize:11,color:"#555",letterSpacing:1}}>IN FLIGHT</div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:48,marginBottom:8}}>🚶</div>
                <div style={{fontSize:12,color:"#86efac"}}>Walk to your ball</div>
                <div style={{fontSize:10,color:"#333",marginTop:4}}>{flightSec}s elapsed</div>
              </div>
              <button className="watch-btn" onClick={confirmBallHere}
                style={{width:"100%",background:"rgba(74,222,128,0.15)",border:"2px solid #4ade80",borderRadius:18,padding:"16px 0",fontSize:14,fontWeight:700,color:"#4ade80",cursor:"pointer"}}>
                📍 Ball Here
              </button>
            </div>
          )}

          {/* ── LOG SHOT ── */}
          {screen===SCREENS.LOG&&(
            <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:"#000"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px 4px"}}>
                <button className="watch-btn" onClick={goBack} style={{background:"none",border:"none",color:"#c8a96e",fontSize:16,cursor:"pointer",padding:0}}>‹</button>
                <div style={{fontFamily:"system-ui",fontSize:20,fontWeight:700,color:"#c8a96e"}}>{shotDist}<span style={{fontSize:11,color:"#555",fontWeight:400}}>y</span></div>
                <div style={{width:20}}/>
              </div>

              {/* Lie grid */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,padding:"2px 10px"}}>
                {LIES.map(l=>(
                  <button key={l.id} className="watch-btn" onClick={()=>setSelLie(l.id)}
                    style={{background:selLie===l.id?"rgba(200,169,110,0.25)":"rgba(255,255,255,0.05)",border:`1.5px solid ${selLie===l.id?"#c8a96e":"rgba(255,255,255,0.08)"}`,borderRadius:10,padding:"6px 2px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                    <span style={{fontSize:16}}>{l.emoji}</span>
                    <span style={{fontSize:8,color:selLie===l.id?"#c8a96e":"#777"}}>{l.label}</span>
                  </button>
                ))}
              </div>

              {/* Direction */}
              <div style={{display:"flex",gap:4,padding:"4px 10px"}}>
                {[{id:"left",label:"◀ Left"},{id:"center",label:"Center"},{id:"right",label:"Right ▶"}].map(d=>(
                  <button key={d.id} className="watch-btn" onClick={()=>setSelDir(d.id)}
                    style={{flex:1,background:selDir===d.id?"rgba(200,169,110,0.2)":"rgba(255,255,255,0.04)",border:`1px solid ${selDir===d.id?"#c8a96e":"rgba(255,255,255,0.07)"}`,borderRadius:8,padding:"5px 2px",cursor:"pointer",fontSize:9,color:selDir===d.id?"#c8a96e":"#777",fontWeight:600}}>
                    {d.label}
                  </button>
                ))}
              </div>

              <div style={{padding:"4px 10px 8px"}}>
                <button className="watch-btn" onClick={confirmShot}
                  style={{width:"100%",background:selLie?"#c8a96e":"rgba(255,255,255,0.06)",border:"none",borderRadius:12,padding:"10px 0",fontSize:13,fontWeight:700,color:selLie?"#000":"#333",cursor:"pointer",opacity:selLie?1:0.5}}>
                  Confirm ✓
                </button>
              </div>
            </div>
          )}

          {/* ── PUTTS ── */}
          {screen===SCREENS.PUTTS&&(
            <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",background:"#000",padding:"10px 12px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,alignSelf:"flex-start",marginBottom:8}}>
                <button className="watch-btn" onClick={goBack} style={{background:"none",border:"none",color:"#c8a96e",fontSize:16,cursor:"pointer",padding:0}}>‹</button>
                <div style={{fontSize:11,color:"#4ade80",fontWeight:600,letterSpacing:1}}>ON THE GREEN</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,width:"100%",flex:1}}>
                {[{n:1,c:"#4ade80",bg:"rgba(74,222,128,0.12)"},{n:2,c:"#c8a96e",bg:"rgba(200,169,110,0.12)"},{n:3,c:"#f97316",bg:"rgba(249,115,22,0.12)"},{n:4,c:"#f87171",bg:"rgba(248,113,113,0.12)"}].map(({n,c,bg})=>(
                  <button key={n} className="watch-btn" onClick={()=>confirmPutts(n)}
                    style={{background:bg,border:`2px solid ${c}`,borderRadius:16,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",gap:2}}>
                    <span style={{fontSize:34,fontWeight:800,color:c,lineHeight:1}}>{n}{n===4?"+":""}</span>
                    <span style={{fontSize:9,color:c,opacity:0.7}}>{n===4?"4+ putts":`${n} putt${n>1?"s":""}`}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── HOLE SUMMARY ── */}
          {screen===SCREENS.SUMMARY&&(()=>{
            const sc=scores[holeIdx];
            const diff=sc!==null?sc-hole.par:0;
            const color=scColor(sc,hole.par);
            const label=scoreLabel(sc,hole.par);
            return(
              <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",background:"#000",padding:"14px 12px"}}>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:10,color:"#555",letterSpacing:1,marginBottom:2}}>HOLE {hole.n} COMPLETE</div>
                  <div style={{fontSize:42,fontWeight:800,color,lineHeight:1}}>{sc}</div>
                  <div style={{fontSize:14,color,fontWeight:600,marginTop:2}}>{label}</div>
                  <div style={{fontSize:10,color:"#555",marginTop:4}}>{currentPutts} putt{currentPutts!==1?"s":""} · {currentShots.length} shots</div>
                </div>
                {/* Shot recap */}
                <div style={{width:"100%",background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"8px 10px"}}>
                  {currentShots.map((s,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#777",padding:"1px 0"}}>
                      <span>{s.club}</span>
                      <span style={{color:"#c8a96e"}}>{s.dist}y</span>
                    </div>
                  ))}
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#555",padding:"1px 0"}}>
                    <span>Putting</span>
                    <span style={{color:"#4ade80"}}>{currentPutts} putt{currentPutts!==1?"s":""}</span>
                  </div>
                </div>
                <button className="watch-btn" onClick={advanceHole}
                  style={{width:"100%",background:"linear-gradient(135deg,#c8a96e,#a07840)",border:"none",borderRadius:14,padding:"12px 0",fontSize:13,fontWeight:700,color:"#000",cursor:"pointer"}}>
                  {holeIdx<17?"Next Hole →":"Finish Round 🏁"}
                </button>
              </div>
            );
          })()}

          {/* ── SCORECARD ── */}
          {screen===SCREENS.CARD&&(
            <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:"#000"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px 6px",flexShrink:0}}>
                <button className="watch-btn" onClick={goBack} style={{background:"none",border:"none",color:"#c8a96e",fontSize:16,cursor:"pointer",padding:0}}>‹</button>
                <div style={{fontSize:12,fontWeight:600,color:"#fff"}}>Scorecard</div>
                <div style={{fontSize:11,fontWeight:700,color:roundDiff<=0?"#4ade80":roundDiff>0?"#f87171":"#e8dcc8"}}>{completedHoles>0?(roundDiff===0?"E":roundDiff>0?`+${roundDiff}`:roundDiff):"—"}</div>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"0 10px 8px"}}>
                {HOLES.map((h,i)=>{
                  const sc=scores[i];
                  const diff=sc!==null?sc-h.par:null;
                  const c=scColor(sc,h.par);
                  const isCur=i===holeIdx;
                  return(
                    <div key={i} style={{display:"flex",alignItems:"center",padding:"5px 8px",marginBottom:2,borderRadius:8,background:isCur?"rgba(200,169,110,0.1)":"transparent",border:isCur?"1px solid rgba(200,169,110,0.25)":"1px solid transparent"}}>
                      <div style={{width:18,fontSize:10,color:isCur?"#c8a96e":"#555",fontWeight:isCur?700:400}}>{h.n}</div>
                      <div style={{width:20,fontSize:10,color:"#444"}}>P{h.par}</div>
                      <div style={{flex:1}}/>
                      <div style={{width:22,textAlign:"right",fontSize:14,fontWeight:700,color:c}}>{sc||"—"}</div>
                      <div style={{width:24,textAlign:"right",fontSize:10,color:c}}>{diff===null?"":(diff===0?"E":diff>0?`+${diff}`:diff)}</div>
                    </div>
                  );
                })}
              </div>
              {/* Pinned total */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",borderTop:"1px solid rgba(255,255,255,0.07)",flexShrink:0}}>
                <span style={{fontSize:11,color:"#555"}}>Total · {completedHoles} holes</span>
                <span style={{fontSize:16,fontWeight:700,color:"#c8a96e"}}>{totalScore||"—"}</span>
              </div>
            </div>
          )}

          {/* ── HOLE PICKER ── */}
          {screen===SCREENS.PICKER&&(
            <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:"#000"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px 6px",flexShrink:0}}>
                <button className="watch-btn" onClick={goBack} style={{background:"none",border:"none",color:"#c8a96e",fontSize:16,cursor:"pointer",padding:0}}>‹</button>
                <div style={{fontSize:12,fontWeight:600,color:"#fff"}}>Go to Hole</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:4,padding:"0 10px 10px",overflowY:"auto"}}>
                {HOLES.map((h,i)=>{
                  const sc=scores[i];
                  const isCur=i===holeIdx;
                  const c=scColor(sc,h.par);
                  return(
                    <button key={i} className="watch-btn" onClick={()=>goToHole(i)}
                      style={{background:isCur?"#c8a96e":sc!==null?c+"22":"rgba(255,255,255,0.06)",border:`1px solid ${isCur?"#c8a96e":sc!==null?c+"66":"rgba(255,255,255,0.1)"}`,borderRadius:8,padding:"7px 0",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                      <span style={{fontSize:12,fontWeight:700,color:isCur?"#000":sc!==null?c:"#aaa"}}>{h.n}</span>
                      {sc!==null&&<span style={{fontSize:8,color:isCur?"#000":c}}>{sc}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Screen label */}
      <div style={{color:"#333",fontSize:11,letterSpacing:2,textTransform:"uppercase"}}>
        {screen.replace("_"," ")} · Hole {holeIdx+1}
      </div>

      {/* Quick nav for simulator */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",maxWidth:400}}>
        {Object.entries(SCREENS).map(([k,v])=>(
          <button key={k} onClick={()=>{haptic();setScreen(v);}} style={{background:screen===v?"#c8a96e":"rgba(255,255,255,0.06)",border:"none",borderRadius:8,padding:"5px 10px",fontSize:10,color:screen===v?"#000":"#555",cursor:"pointer",letterSpacing:1,textTransform:"uppercase"}}>
            {k}
          </button>
        ))}
      </div>
      <div style={{color:"#2a2a2a",fontSize:10,textAlign:"center"}}>Use quick nav above to jump between screens · Long-press hole number to open picker</div>
    </div>
  );
}
