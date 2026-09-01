type TfLProperty={key:string;value:string};
type TfLCam={id:string;commonName:string;lat:number;lon:number;additionalProperties:TfLProperty[]};

async function trafficWatchNICameras(signal:AbortSignal){
  const page=await fetch('https://www.trafficwatchni.com/twni/cameras',{signal});if(!page.ok)throw new Error('TrafficWatchNI page unavailable');
  const html=await page.text();const token=html.match(/meta name="_csrf" content="([^"]+)"/)?.[1];const headerName=html.match(/meta name="_csrf_header" content="([^"]+)"/)?.[1]||'X-CSRF-TOKEN';if(!token)throw new Error('TrafficWatchNI token unavailable');
  const cookie=(page.headers.get('set-cookie')||'').split(',').map(x=>x.split(';')[0]).join('; ');
  const response=await fetch('https://www.trafficwatchni.com/twni/map/mapData',{method:'POST',signal,headers:{[headerName]:token,'Content-Type':'application/x-www-form-urlencoded','Cookie':cookie,'User-Agent':'UK-Signal/1.0 public-situational-awareness'},body:new URLSearchParams({selectedTypes:'CCTV_CAMERAS',roadworksEndDateFilter:''})});if(!response.ok)throw new Error('TrafficWatchNI map unavailable');
  const data=await response.json() as {mapData:{CCTV_CAMERAS:Array<{id:string;latitude:number;longitude:number;summary:string}>}};const images=new Map<string,string>();const re=/addToPreview\((\d+),\s*&quot;([^&]+)&quot;,\s*&quot;([^&]+)&quot;,\s*&quot;([^&]+)&quot;/g;let match:RegExpExecArray|null;
  while((match=re.exec(html))!==null)images.set(match[1],`${match[2].replace(/\\\//g,'/')}/${match[4]}?cache=${match[3]}`);
  return (data.mapData.CCTV_CAMERAS||[]).map(c=>({id:`ni-${c.id}`,name:c.summary,lat:c.latitude,lon:c.longitude,image:images.get(c.id)||'',video:'',view:'Road view',available:Boolean(images.get(c.id)),source:'TrafficWatchNI'}));
}

export async function GET(){
  const headers={'User-Agent':'UK-Signal/1.0 public-situational-awareness'};
  const signal=AbortSignal.timeout(12000);
  const [flightResult,camResult,niResult]=await Promise.allSettled([
    fetch('https://opensky-network.org/api/states/all?lamin=49.5&lomin=-8.8&lamax=59.2&lomax=2.5&extended=1',{headers,signal}),
    fetch('https://api.tfl.gov.uk/Place/Type/JamCam',{headers,signal}),
    trafficWatchNICameras(signal),
  ]);
  let flights:unknown[][]=[];let cameras:unknown[]=[];const errors:string[]=[];
  if(flightResult.status==='fulfilled'&&flightResult.value.ok){const data=await flightResult.value.json() as {states?:unknown[][]};flights=(data.states||[]).filter(s=>s[5]!=null&&s[6]!=null).map(s=>({icao:s[0],callsign:String(s[1]||'UNKNOWN').trim(),country:s[2],lon:s[5],lat:s[6],altitude:s[7],ground:s[8],velocity:s[9],heading:s[10],verticalRate:s[11],squawk:s[14],category:s[17]}));}else errors.push('OpenSky temporarily unavailable');
  if(camResult.status==='fulfilled'&&camResult.value.ok){const data=await camResult.value.json() as TfLCam[];cameras=data.filter(c=>c.lat&&c.lon).map(c=>{const p=Object.fromEntries(c.additionalProperties.map(x=>[x.key,x.value]));return{id:c.id,name:c.commonName,lat:c.lat,lon:c.lon,image:p.imageUrl,video:p.videoUrl,view:p.view,available:p.available==='true',source:'TfL JamCams'};});}else errors.push('TfL JamCams temporarily unavailable');
  if(niResult.status==='fulfilled')cameras.push(...niResult.value);else errors.push('TrafficWatchNI temporarily unavailable');
  return Response.json({flights,cameras,errors,updatedAt:new Date().toISOString()},{headers:{'Cache-Control':'public, max-age=20, s-maxage=45'}});
}
