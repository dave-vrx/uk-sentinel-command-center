type TfLProperty={key:string;value:string};
type TfLCam={id:string;commonName:string;lat:number;lon:number;additionalProperties:TfLProperty[]};

export async function GET(){
  const headers={'User-Agent':'UK-Signal/1.0 public-situational-awareness'};
  const [flightResult,camResult]=await Promise.allSettled([
    fetch('https://opensky-network.org/api/states/all?lamin=49.5&lomin=-8.8&lamax=59.2&lomax=2.5&extended=1',{headers}),
    fetch('https://api.tfl.gov.uk/Place/Type/JamCam',{headers}),
  ]);
  let flights:unknown[][]=[];let cameras:unknown[]=[];const errors:string[]=[];
  if(flightResult.status==='fulfilled'&&flightResult.value.ok){const data=await flightResult.value.json() as {states?:unknown[][]};flights=(data.states||[]).filter(s=>s[5]!=null&&s[6]!=null).map(s=>({icao:s[0],callsign:String(s[1]||'UNKNOWN').trim(),country:s[2],lon:s[5],lat:s[6],altitude:s[7],ground:s[8],velocity:s[9],heading:s[10],verticalRate:s[11],squawk:s[14],category:s[17]}));}else errors.push('OpenSky temporarily unavailable');
  if(camResult.status==='fulfilled'&&camResult.value.ok){const data=await camResult.value.json() as TfLCam[];cameras=data.filter(c=>c.lat&&c.lon).map(c=>{const p=Object.fromEntries(c.additionalProperties.map(x=>[x.key,x.value]));return{id:c.id,name:c.commonName,lat:c.lat,lon:c.lon,image:p.imageUrl,video:p.videoUrl,view:p.view,available:p.available==='true'};});}else errors.push('TfL JamCams temporarily unavailable');
  return Response.json({flights,cameras,errors,updatedAt:new Date().toISOString()},{headers:{'Cache-Control':'public, max-age=20, s-maxage=45'}});
}
