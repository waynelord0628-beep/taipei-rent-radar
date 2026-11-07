import React,{useState} from 'react';
const API='https://rent.207.148.124.127.sslip.io';
const KEY='rent-radar-push-token-v1';
function readToken(){try{return localStorage.getItem(KEY)||'';}catch{return '';}}
const supported=()=>isSecureContext&&'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
const keyBytes=value=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'=')),x=>x.charCodeAt(0));
async function request(path,body){const response=await fetch(`${API}/api/push/${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw new Error(data.error||'推播服務暫時無法連線');return data;}
export default function PushSettings(){
  const [open,setOpen]=useState(false),[token,setToken]=useState(readToken),[code,setCode]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  async function action(type){
    setBusy(true);setMessage('');
    try{
      if(type==='subscribe'){
        if(!supported())throw new Error('此環境不支援推播。iPhone 請用 Safari 加入主畫面，再從圖示開啟。');
        if(!code.trim())throw new Error('請先輸入私人配對碼');
        // Permission prompt directly follows the user's click (required on iOS).
        if(await Notification.requestPermission()!=='granted')throw new Error('尚未允許通知；若曾封鎖，請到瀏覽器或系統設定調整。');
        const config=await fetch(`${API}/api/push/config`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('推播服務暫時無法連線');return r.json();});
        if(!config.enabled)throw new Error('推播服務尚未開啟');
        await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`,{scope:import.meta.env.BASE_URL});
        const registration=await navigator.serviceWorker.ready;
        const subscription=await registration.pushManager.getSubscription()||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:keyBytes(config.publicKey)});
        const result=await request('subscribe',{subscription:subscription.toJSON(),pairCode:code.trim()});
        localStorage.setItem(KEY,result.token);setToken(result.token);setCode('');setMessage('裝置已配對。請按「發送測試通知」確認收得到；既有房源不會一次補發。');
      }else if(type==='unsubscribe'){
        await request(type,{token});localStorage.removeItem(KEY);setToken('');
        const registration=await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL);await (await registration?.pushManager.getSubscription())?.unsubscribe();setMessage('此裝置已停止接收通知');
      }else{await request(type,{token});setMessage('已交給瀏覽器推播服務，請確認裝置是否收到。');}
    }catch(error){setMessage(error.message==='Failed to fetch'?'推播服務暫時無法連線，請稍後再試。':error.message);}finally{setBusy(false);}
  }
  return <section className="push-settings"><button className="secondary" aria-expanded={open} onClick={()=>setOpen(!open)}>房源通知設定{token?' · 已配對':''}</button>{open&&<div className="push-panel"><h2>關閉網站也能收到新房源</h2><p>只通知已知固定月費 18,000 元內、台電、可租補、非頂加且有照片的新房源；獨洗加分。照片是否合口味仍需判讀，其他物件照常列在網站。</p><p>iPhone：Safari 分享 → 加入主畫面 → 從圖示開啟 → 回到這裡開啟通知。系統省電、專注模式及瀏覽器設定可能影響送達。</p>{!token?<><label>私人配對碼 <input type="password" autoComplete="off" value={code} onChange={e=>setCode(e.target.value)} placeholder="輸入提供給你的配對碼"/></label><button className="primary" disabled={busy} onClick={()=>action('subscribe')}>{busy?'處理中…':'開啟此裝置通知'}</button></>:<><button className="primary" disabled={busy} onClick={()=>action('test')}>發送測試通知</button><button className="secondary" disabled={busy} onClick={()=>action('unsubscribe')}>停止此裝置通知</button></>}{message&&<p role="status">{message}</p>}</div>}</section>;
}
