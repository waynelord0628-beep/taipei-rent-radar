self.addEventListener('push',event=>{
  let data={};try{data=event.data.json();}catch{}
  event.waitUntil(self.registration.showNotification(data.title||'住這裡：新房源',{
    body:data.body||'打開網站查看新收錄房源',tag:data.tag||'rent-radar',
    icon:new URL('icon.svg',self.registration.scope).href,
    data:{url:data.url||self.registration.scope}
  }));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const base=new URL(self.registration.scope);let target=base;
  try{const value=new URL(event.notification.data?.url||base.href);if(value.origin===base.origin&&value.pathname.startsWith(base.pathname))target=value;}catch{}
  event.waitUntil(clients.openWindow(target.href));
});
